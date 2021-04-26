[Back to readme](./readme.md)


1. Install Venv
```
sudo apt-get install python3
sudo apt-get install python3-venv
sudo apt install python3-pip
sudo apt install nginx
```

2. Create venv
```
cd /opt
python3 -m venv trackerNgin
```

3. Clone repository
```
cd trackerNgin/
git clone https://github.com/ngintec/trackeNgin.git
cd trackeNgin/
git checkout master
```

4. Activate the env keep the env activated till the end of installation
```
cd /opt/trackerNgin
. ./bin/activate
```

5. Install the requirments
```
cd /opt/trackerNgin/trackerNgin
pip install wheel
pip install -r requirements.txt
```
6. Setup
```
cd /opt/trackerNgin/trackerNgin/TrackerNgin
```
--Edit the setting.py and in the end change the following as per your requirments.
```
# Redis config
REDIS_HOST = 'redis-14371.c57.us-east-1-4.ec2.cloud.redislabs.com'
REDIS_PORT = 14371
REDIS_USER = "app"
REDIS_PASSWORD = "ngin-TEC-123" 
# you can also set export $REDIS_PASSWORD="ngin-TEC-123" and specify
# REDIS_PASSWORD = os.environ['REDIS_PASSWORD']


# Should you sync with RDBMS
# if you want info to be synced with RDBMS set to true
RDBMS = True

# if you set the above to true
# make sure you give the db details in databASE SECTION

# Database
# https://docs.djangoproject.com/en/3.2/ref/settings/#databases
# Change to your bata base 
# add/install drivers
# provide the shema properbly based on documentation
# GIVE YOUR DB HERE POSTGRESS OR oracle
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# we dont use this for auth but we still keep it for Djano and future
AUTH_USER_MODEL = 'TrackerProxy.Users'
```
6. Migrate (needed only if rdbms is user)

```
cd /opt/trackerNgin/trackerNgin
./manage.py makemigration
./manage.py migrate
```


7. Start Django using uvicorn

```
#the below port will be same as in nginx config
/opt/tasenv/bin/uvicorn tasproj.asgi:application --port 10000 --uds /tmp/trackerngin.sock
 
```

* for autostart across reboot
```
#In this file ==> /etc/systemd/system/uvicorn-trackerngin.service 
#Add bemow

[Unit]
Description=uvicorn daemon
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/opt/trackerNgin/trackerNgin/
ExecStart=/opt/trackerNgin/bin/uvicorn TrackerNgin.asgi:application --port 10000 --uds /tmp/trackerngin.sock
Restart=always

[Install]
WantedBy=multi.user.target

```

8. Reverse proxy setup

refer to [trackerngin.conf](./trackerngin.conf)
You will need to create a link or copy the file after creating the ssl certs to the nginx folders
MACOS
``
ln -s /Users/arungautham/trackerNgin/trackerNgin/trackerngin.conf /usr/local/etc/nginx/servers/trackerngin.conf 
``
Ubuntu
```
ln -s /opt/trackerNgin/trackerNgin/trackerngin.conf /etc/nginx/sites-enabled/trackerngin.conf 

```

9. open https://localhost/tracker

[Back to readme](./readme.md)




