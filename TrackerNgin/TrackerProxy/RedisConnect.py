import redis
import logging, traceback, json, ast
from redisearch import Client, TextField, IndexDefinition, Query
from .utils import *
from django.utils import timezone

logger=logging.getLogger("redis")
#ng1ntEc@123
# "redis://redis-14371.c57.us-east-1-4.ec2.cloud.redislabs.com:14371"

# -- user ({Email, Phone, Password, Token, Verification_Code, alias, location, Trackers, email_verified, data:{last_login:, last_update}})
RedisClient = redis.Redis(host='localhost', port=6379)

#############################
#InDexes for searches
############################
#FT.CREATE idx:users ON hash PREFIX 1 "users:" SCHEMA searchable_email TEXT SORTABLE phone TEXT SORTABLE
#searchable email is created to avoid issues with "@" in email
users_idx=Client('idx:users')
#FT.CREATE idx:trackerlist ON hash PREFIX 1 "users:" SCHEMA isTracker TEXT SORTABLE exposed TEXT SORTABLE
#this is used to send tokens to logged in users
trackerList_idx=Client('idx:trackerlist')
#FT.CREATE idx:trackers ON hash PREFIX 1 "users:" SCHEMA Trackers TEXT SORTABLE
# this is to search the hashes for all users who have tracker as me to be added in Locations(GET) api
trackers_idx=Client('idx:trackers')
###############################


def User_Exists(email, number):
    # we use REDISEARCH because we can verify both email and password in one go
    result=users_idx.search("{}|{}".format(email, number))
    if result.total > 0:
        return True
    else:
        return False


def Register_Users(user_data):
    key= user_data['id']
    try:
        user_data['searchable_email']=user_data['email'].replace("@","_").replace(".","_")

        #Check if users Exists
        if User_Exists(user_data['searchable_email'],key):
            return "User_Exists", False

        # flag user as tracker or not, this is further used to get availible services
        if "isTracker" in user_data.keys():
            user_data['isTracker']= "True"
        else:
            user_data['isTracker']= "False"
        # flag service as exposed or not, if exposed , data will be avalible for search option
        # impacts only if Tracker 
        if "exposed" in user_data.keys():
            user_data['exposed']= "True"
        else:
            user_data['exposed']= "False"

        # if Doesnt exists perform hashing and generate tokens
        user_data['password']=HashPassword(user_data['password'])
        user_data['Verification_Code']=GenerateToken(100)
        user_data['Token']=GenerateToken(64)
        # Set other fields to 
        user_data['phone']=key
        user_data['alias']=""
        user_data['email_verified']="False"
        user_data['Trackers']="[]"
        user_data['Location']="[]"
        user_data['Token']=GenerateToken(64)
        user_data['last_update']= str(timezone.now())


        #inset into Redis
        RedisClient.hset('users:{}'.format(key), mapping=user_data)
        #pick the result and verify
        #using REDISEARCH to avoid conversion from binary to json
        result=users_idx.search("{}".format(key))

        if result.total == 0:
            return "Technical Error", False


        JsonResponse = result.docs[0].__dict__
        return JsonResponse, True

    except Exception as e:
        traceback.print_exc()


def Clear_User(user_data):
    key= user_data['id']
    RedisClient.delete('users:{}'.format(key))
    return True

def Login_Users(user_data):
    email=user_data['email']
    phone=user_data['id']
    password=HashPassword(user_data['password'])

    if not RedisClient.hexists("users:{}".format(phone),'password'):
        return "You are not a registered user please register", False

    db_pass= RedisClient.hget("users:{}".format(phone),'password').decode("utf-8")
    db_email= RedisClient.hget("users:{}".format(phone),'email').decode("utf-8")
    email_verified= RedisClient.hget("users:{}".format(phone),'email_verified').decode("utf-8")

    if not email_verified == "True":
        return "Please Verify you email and then Try login", False


    if password == db_pass and email == db_email:
        searchable_email=user_data['email'].replace("@","_").replace(".","_")
        result=users_idx.search("{}|{}".format(searchable_email, phone))
        if result.total == 0:
            return "Technical Error", False
        else:
            # we send all the require info for some authorization in the front end
            JsonResponse={}
            JsonResponse['token'] = result.docs[0].Token
            JsonResponse['trackers'] = ast.literal_eval(result.docs[0].Trackers)
            JsonResponse['alias'] = result.docs[0].alias
            JsonResponse['email']=email
            JsonResponse['id']=phone
            JsonResponse['isTracker']= result.docs[0].isTracker
            return JsonResponse, True
    else:
        return "Invalid email, phone and password combination", False

def TokenAuth(phone,token):
    db_Token= RedisClient.hget("users:{}".format(phone),'Token')
    #verify the token
    if token == db_Token.decode("utf-8"):
        return True
    else:
        return False


def Verify_Email(code, phone):
    db_Veri_Code= RedisClient.hget("users:{}".format(phone),'Verification_Code')

    if code == db_Veri_Code.decode('utf-8'):
        # for preventive reuse we update hash key
        new_code=GenerateToken(100)
        RedisClient.hset('users:{}'.format(phone), mapping={"email_verified":"True", "Verification_Code":new_code})
        return "Verify Success", True
    else:
        return "Verification Failed", False

def UpdateAlias(phone, alias):
    #update the alias on redis
    RedisClient.hset("users:{}".format(phone),key='alias',value=alias)
    return "Updated Alias", True

def UpdatePassword(user_data):
    phone=user_data['id']
    password=HashPassword(user_data['password'])
    token=GenerateToken(64)
    # for better security we update both token and password and force user to relogin to get the token
    RedisClient.hset("users:{}".format(phone),mapping={"Token":token, "password":password})
    return "Updated password", True

def UpdateForgottenPassword(user_data):
    phone=user_data['id']
    #Generate a temp password and use it
    temp_password=GenerateToken(8)
    password=HashPassword(temp_password)
    token=GenerateToken(64)
    RedisClient.hset("users:{}".format(phone),mapping={"Token":token, "password":password})

    return temp_password, True

def AddTracker(user_data):

    tracker=user_data['Tracker']
    phone=user_data['id']

    #get the object and convert to array
    existing_trackers= ast.literal_eval(RedisClient.hget("users:{}".format(phone),"Trackers").decode("utf-8"))
    if tracker not in existing_trackers:
        existing_trackers.append(tracker)
    RedisClient.hset("users:{}".format(phone),key='Trackers',value=str(existing_trackers))
    #ask them to invite, if not registered
    if User_Exists('Unknown', tracker):
        return "Added trackers: {} ".format(tracker), existing_trackers, True
    else:
        return "Added trackers: {}, But he is not registered with us, you can invite him using Users-> Invite".format(tracker), existing_trackers, True


def DeleteTracker(user_data):

    tracker=user_data['Tracker']
    phone=user_data['id']

    #get the object and convert to array
    existing_trackers= ast.literal_eval(RedisClient.hget("users:{}".format(phone),"Trackers").decode("utf-8"))
    if tracker in existing_trackers:
        existing_trackers.remove(tracker)
    RedisClient.hset("users:{}".format(phone),key='Trackers',value=str(existing_trackers))
    return "Removed trackers: {}".format(tracker), existing_trackers, True



def UpdateLocation(user_data):
    phone=user_data['id']
    location=user_data['location']

    RedisClient.hset("users:{}".format(phone),key='Location',value=str(location))
    #GEO ADD to tracked key on fetch not here
    return "update Success", True


def GetLocations(phone):
    #use REDISEARCH on all data where iam the Tracker and get their location
    result=trackers_idx.search(phone)
    allusers=[]
    for row in result.docs:
        user=row.__dict__
        if user["Location"] != "[]":
            location=ast.literal_eval(user["Location"])
            allusers.append({"location": location, "alias": user["alias"], "from": user["phone"]})
            #add geo add to serah later
            RedisClient.geoadd(phone, location[0], location[1], user["phone"])

    #need to restric the number of elements sent to front end 
    #what if 500 users to 1 tracker??? UI will be clumsy
    #post once Implementation we might want to see how we send list in chunks 
    #transport corporations can have 1000's of buses

    return allusers, True

def GetServices():
    result=trackerList_idx.search("@isTracker:True  @exposed:True")
    # seach and send all services using REDISSEARCH
    services=[]
    for row in result.docs:
        user=row.__dict__
        services.append({"alias": user["alias"], "phone": user["phone"]})
    return services, True

def GetNeighbour(user_data):
    # get the 5 nearest OTG service vehicle and send to user ( Serch API )
    longitude = user_data['location'][0]
    latitude = user_data['location'][1]
    service = user_data['service']
    result= RedisClient.georadius(service, longitude, latitude, 50, unit="km", withdist=True, withcoord=True, count=5, sort="ASC")
    searchResult=[]
    for row in result:
        location=[]
        phone=row[0].decode("utf-8")
        alias=RedisClient.hget("users:{}".format(phone),"alias").decode("utf-8")
        searchResult.append({"from" :row[0].decode("utf-8"), "distance": row[1], "location": row[2], "alias":alias})

    return searchResult, True






