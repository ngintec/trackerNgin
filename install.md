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
git clone https://github.com/ngintec/trackerNgin.git
cd trackerNgin/
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

# Should you sync with RDBMS
RDBMS = False



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

-- create a file with all variable
```
#/home/ubuntu/trackerngin.sh
REDIS_PASSWORD="sdf"
SMTP_USER="sdf"
SMTP_PASS="sdf"
SMTP_HOST="sdf"
SMTP_PORT=587
REDIS_HOST="sdf"
REDIS_PORT=14371

#the below export are only needed to test from command line, not harm in keeping them
export REDIS_PASSWORD
export SMTP_USER
export SMTP_PASS
export SMTP_HOST
export SMTP_PORT
export REDIS_HOST
export REDIS_PORT
```

-- set the variables
```
	source /home/ubuntu/trackerngin.sh
```

6. Migrate (needed only if rdbms is used)

```
cd /opt/trackerNgin/trackerNgin
./manage.py makemigrations
./manage.py migrate
```


7. Start Django using uvicorn

```
#the below port will be same as in nginx config
/opt/trackerNgin/bin/uvicorn TrackerNgin.asgi:application --port 10000 --uds /tmp/trackerngin.sock

#if success the press Cntrl+c and come out
 
```

* for autostart across reboot

```


#create this file ==> /etc/systemd/system/uvicorn-trackerngin.service 
#Add below
# The Environment file is the file you created in step 5 (last step) containing smtp and redis details
# make sure you put the correct user and paths

[Unit]
Description=uvicorn daemon
After=network.target

[Service]
User=ubuntu
Group=ubuntu
EnvironmentFile=-/home/ubuntu/trackerngin.sh
WorkingDirectory=/opt/trackerNgin/trackerNgin/
ExecStart=/opt/trackerNgin/bin/uvicorn TrackerNgin.asgi:application --port 10000 --uds /tmp/trackerngin.sock
Restart=always

[Install]
WantedBy=multi.user.target

```

* start the service and check the status

```
sudo service uvicorn-trackerngin start
sudo service uvicorn-trackerngin status
# if you get errors these can be possible causes
1. user
2. paths
3. environment file

```
8. Reverse proxy setup

refer to [trackerngin.conf](./trackerngin.conf)
You will need to create a link or copy the file after creating the ssl certs to the nginx folders
check the paths as per you OS and requirement below and as well in the [trackerngin.conf](./trackerngin.conf) file
MACOS
``
ln -s /Users/arungautham/trackerNgin/trackerNgin/trackerngin.conf /usr/local/etc/nginx/servers/trackerngin.conf 
``
Ubuntu
```
ln -s /opt/trackerNgin/trackerNgin/trackerngin.conf /etc/nginx/sites-enabled/trackerngin.conf 

```

Restart the server or reload the config
```
sudo nginx -s reload
or
sudo service nginx restart
```

9. open https://localhost/tracker

[Back to readme](./readme.md)




