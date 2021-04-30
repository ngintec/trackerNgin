import logging, json, time

from django.shortcuts import render
from django.http import JsonResponse, HttpResponseRedirect

from rest_framework import status as response_status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView

from TrackerNgin.TrackerProxy import RedisConnect
from .utils import *
from .permissions import LoggedIn

logger=logging.getLogger("Request")
c_handler = logging.StreamHandler()

logger.setLevel('INFO')
c_format = logging.Formatter('%(asctime)s %(module)s %(levelname)s %(message)s')
c_handler.setFormatter(c_format)
logger.addHandler(c_handler)


class Users(APIView):
	#this Class handles register ( PUT ) and Login ( POST )

	def put(self, request):
		try:
			request_origin = request.META['HTTP_ORIGIN'] if 'HTTP_ORIGIN' in request.META.keys() else "locatorservices.ngintec.com"
			# validate the input
			user_data=request.data
			status, message = ValidateInput(user_data)
			# if succes take action
			if not status:
				return Response(response,status=response_status.HTTP_400_BAD_REQUEST)
			#entries into redis
			message, status= RedisConnect.Register_Users(user_data)
			#Check if user registration failed
			if not status:
				#else respond with error
				response = { "message" : "Could not register", "Reason": message}
				return Response(response,status=response_status.HTTP_400_BAD_REQUEST)
			#Send mail to confirm email id
			message, status= SendRegisterMail(message['email'],message['Verification_Code'],message['phone'],request_origin)
			#Check if some thing happens during email sending
			if not status:
				RedisConnect.Clear_User(user_data)
				response = { "message" : "Could not register", "Reason": message}
				return Response(response,status=response_status.HTTP_400_BAD_REQUEST)
			else:
				response = { "message" : "Registration Success, Please verify your email before Logging in( Check Yor Email, including Junk Folder )"}
				return Response(response)
		except:
			logger.error("Some Exception occured in Register user",exc_info=True)
			pass
			return Response({"message":"Internal Server Error", "Reason":"Technical Error"},status=500)

	def post(self, request):
		try:
			user_data=request.data
			#try to login the user
			message, status = RedisConnect.Login_Users(user_data)
			if not status:
				response = { "message" : message}
				return Response(response,status=400)
			#set the alias as sent in login form
			return_reponse= message
			phone=user_data['id']

			return Response(return_reponse)
		except:
			logger.error("Some Exception occured in Logging user",exc_info=True)
			pass
			return Response({"message":"Internal Server Error", "Reason":"Technical Error"},status=500)


class VerifyEmail(APIView):
	#this Class handles verify email simple GET
	def get(self, request):
		try:
			if request.GET.get("uc", False) and request.GET.get("id", False):
				#verify teh code against user phone
				message, status= RedisConnect.Verify_Email(request.GET.get("uc", False),request.GET.get("id", False))
				logger.info(message)
				if not status:
					return HttpResponseRedirect("/tracker?action=failure")
				return HttpResponseRedirect("/tracker?action=success")
			else:
				return HttpResponseRedirect("/tracker?action=failure")
		except:
			logger.error("Some Exception occured in Verify Email",exc_info=True)
			pass
			return Response({"message":"Internal Server Error", "Reason":"Technical Error"},status=500)


class ResetPassword(APIView):
	#this Class handles reset password
	# user needs to be logged in to perform the action
	permission_classes=[LoggedIn]

	def post(self, request):
		try:
			user_data=request.data
			#validate the input
			status, message = ValidateInput(user_data)
			# if succes take action
			if not status:
				return Response(response,status=response_status.HTTP_400_BAD_REQUEST)
			#if input is alright then update the password
			message, result= RedisConnect.UpdatePassword(user_data)
			if result:
				return Response({"message": "Password successfully changed, Please logout and login"})
			else:
				return Response({"message": "Password Change failure", "Reason": message}, status=response_status.HTTP_400_BAD_REQUEST)
		except:
			logger.error("Some Exception occured in Reset Password",exc_info=True)
			pass
			return Response({"message":"Internal Server Error", "Reason":"Technical Error"},status=response_status.HTTP_400_BAD_REQUEST)

class ForgotPassword(APIView):
	#we generate a dummy password if user forgot hist password and send to his email id

	def post(self, request):
		try:
			user_data= request.data

			message, result= RedisConnect.UpdateForgottenPassword(user_data)
			if not result:
				return Response({"message": "Some thing went Wrong", "Reason": message}, status=response_status.HTTP_400_BAD_REQUEST)

			message, result= SendTempPassword(message, user_data['email'])
			if result:
				return Response({"message": "Please Check your email for temporary password(Including Junk Folder)"})
			else:
				return Response({"message": "Some thing went Wrong", "Reason": message}, status=response_status.HTTP_400_BAD_REQUEST)
		except:
			logger.error("Some Exception occured in Forgot password",exc_info=True)
			pass
			return Response({"message":"Internal Server Error", "Reason":"Technical Error"},status=response_status.HTTP_400_BAD_REQUEST)


class Trackers(APIView):
	# this Class handles Addind and removing trackers for User
	# user can have multiple trackers just in case
	# user needs to be logged in to perform the action
	permission_classes=[LoggedIn]

	def post(self, request):
		try:
			user_data= request.data
			# i dont send the id here so reat from authenticated header
			user_data['id']= request.headers['id']
			if user_data['id'] == user_data['Tracker']:
				return Response({"message": "You cannot be your own tracker", "Reason": "Not Allowed"}, status=response_status.HTTP_400_BAD_REQUEST)

			message, trackers, result= RedisConnect.AddTracker(user_data)
			if not result:
				return Response({"message": "Some thing went Wrong", "Reason": message}, status=response_status.HTTP_400_BAD_REQUEST)
		
			return Response({"message": message, "Trackers": trackers})
		except:
			logger.error("Some Exception occured in Addind Tracker",exc_info=True)
			pass
			return Response({"message":"Internal Server Error", "Reason":"Technical Error"},status=500)


	def delete(self, request):
		try:
			user_data= request.data
			# i dont send the id here so reat from authenticated header
			user_data['id']= request.headers['id']
			if user_data['id'] == user_data['Tracker']:
				return Response({"message": "You cannot be your own tracker", "Reason": "Not Allowed"}, status=response_status.HTTP_400_BAD_REQUEST)

			message, trackers, result= RedisConnect.DeleteTracker(user_data)
			if not result:
				return Response({"message": "Some thing went Wrong", "Reason": message}, status=response_status.HTTP_400_BAD_REQUEST)
		
			return Response({"message": message, "Trackers": trackers})
		except:
			logger.error("Some Exception occured in Deleting Tracker",exc_info=True)
			pass
			return Response({"message":"Internal Server Error", "Reason":"Technical Error"},status=500)



class Invite(APIView):
	# Users can invite ohters into the platform
	# user needs to be logged in to perform the action
	permission_classes=[LoggedIn]

	def post(self, request):
		try:
			request_origin = request.META['HTTP_ORIGIN'] if 'HTTP_ORIGIN' in request.META.keys() else "locatorservices.ngintec.com"
			user_data= request.data

			message, result= SendInviteMails(user_data['inviter'],user_data['email'], request_origin)
			if not result:
				return Response({"message": "Some thing went Wrong", "Reason": message}, status=response_status.HTTP_400_BAD_REQUEST)

			return Response({"message": "Invite email has been sent on your behalf"})
		except:
			logger.error("Some Exception occured in Sending Invite to user",exc_info=True)
			pass
			return Response({"message":"Internal Server Error", "Reason":"Technical Error"},status=500)


#todo
#Logout = change the token??

class Location(APIView):
	# Users can set his location
	# We also add the geolocation for searching the distance from a user later
	# Trackers can get location of all his trackee ( we use redis search here)
	# user needs to be logged in to perform the action
	permission_classes=[LoggedIn]

	def post(self, request):
		try:
			user_data= request.data
			user_data['id']= request.headers['id']

			message, result= RedisConnect.UpdateLocation(user_data)
			if not result:
				return Response({"message": "Some thing went Wrong", "Reason": message}, status=response_status.HTTP_400_BAD_REQUEST)
			return Response({"message": message})
		except:
			logger.error("Some Exception occured in Updating Location",exc_info=True)
			pass
			return Response({"message":"Internal Server Error", "Reason":"Technical Error"},status=500)

	def get(self, request):
		try:

			message, result= RedisConnect.GetLocations(request.headers['id'])
			if not result:
				return Response({"message": "Some thing went Wrong", "Reason": message}, status=response_status.HTTP_400_BAD_REQUEST)
			return Response({"message": message})
		except:
			logger.error("Some Exception occured in Updating Location",exc_info=True)
			pass
			return Response({"message":"Internal Server Error", "Reason":"Technical Error"},status=500)

class Alias(APIView):
	# Users can set/change their alias ( specific case where bus drivers drive different routes/ bus numbers)
	# user needs to be logged in to perform the action
	permission_classes=[LoggedIn]

	def post(self, request):
		try:
			user_data=request.data

			phone=request.headers['id']
			alias=user_data['alias']

			message, status = RedisConnect.UpdateAlias(phone,alias)
			if not status:
				return Response({"message": "Some thing went Wrong", "Reason": message}, status=response_status.HTTP_400_BAD_REQUEST)
			return Response({"message": message , "alias": alias})
		except:
			logger.error("Some Exception occured in Getting Services",exc_info=True)
			pass
			return Response({"message":"Internal Server Error", "Reason":"Technical Error"},status=500)	


class UserService(APIView):
	# Get a list of all exposed trackers
	# Note trackers can hide their roooms to them selves and are not exposed to generic users
	def get(self, request):
		try:
			message, result= RedisConnect.GetUserServices()
			if not result:
				return Response({"message": "Some thing went Wrong", "Reason": message}, status=response_status.HTTP_400_BAD_REQUEST)
			return Response({"message": message})
		except:
			logger.error("Some Exception occured in Getting Services",exc_info=True)
			pass
			return Response({"message":"Internal Server Error", "Reason":"Technical Error"},status=500)



class TrackeeService(APIView):
	permission_classes=[LoggedIn]

	def get(self, request):
		try:
			message, result= RedisConnect.GetTrackeeServices()
			if not result:
				return Response({"message": "Some thing went Wrong", "Reason": message}, status=response_status.HTTP_400_BAD_REQUEST)
			return Response({"message": message})
		except:
			logger.error("Some Exception occured in Getting Services",exc_info=True)
			pass
			return Response({"message":"Internal Server Error", "Reason":"Technical Error"},status=500)	



class Search(APIView):
	# Search for a OTG vehicle nearest to you based on service ( Tracker )
	def post(self, request):
		try:
			user_data= request.data
			message, result= RedisConnect.GetNeighbour(user_data)
			if not result:
				return Response({"message": "Some thing went Wrong", "Reason": message}, status=response_status.HTTP_400_BAD_REQUEST)
			return Response({"message": message})
		except:
			logger.error("Some Exception occured in Getting Services",exc_info=True)
			pass
			return Response({"message":"Internal Server Error", "Reason":"Technical Error"},status=500)	


from django.http import StreamingHttpResponse
from TrackerNgin.TrackerProxy import RedisMqConnect 

class Publish(APIView):
	permission_classes=[LoggedIn]

	def post(self, request):
		phone=request.headers['id']
		try:
			user_data= request.data
			user_data['from']=phone
			result= RedisMqConnect.Publish(user_data)
			if not result:
				return Response({"message": "Some thing went Wrong", "Reason": message}, status=response_status.HTTP_400_BAD_REQUEST)
			return Response({"message": "Messaged published (message will reach recipient/s when they are online)"})
		except:
			logger.error("Some Exception occured in Getting Services",exc_info=True)
			pass
			return Response({"message":"Internal Server Error", "Reason":"Technical Error"},status=500)	


class Consume(APIView):
	permission_classes=[LoggedIn]

	def get(self, request):
		phone=request.headers['id']
		try:
			MsgQueue= RedisMqConnect.Subscribe(phone)
			message={"message": MsgQueue}
			if len(MsgQueue) == 0:
				message={"message":[]}
			return Response(message)
		except:
			logger.error("Some Exception occured in Getting Messages",exc_info=True)
			pass
			return Response({"message":"Internal Server Error", "Reason":"Technical Error"},status=500)	


# @permission_classes(['EventSource'])
# def Event(request):
# 	phone=request.GET.get('id')
# 	MsgQueue=RedisMqConnect.Subscribe(phone)
# 	def event_stream():
# 		while True:
# 			data = MsgQueue.get_message()
# 			if data:
# 				message=data['data'].decode("utf-8")
# 				print(message)
# 			else:
# 				message="{\"message\":\"None\"}"
# 			yield 'data: {}\n\n'.format(message)			

# 	return StreamingHttpResponse(event_stream(), content_type='text/event-stream')