# Why TrackerNgin 
### - To help Services be on top 
### 	- With location of their vehicles
### 	- Communicate with Trackee
### - To help users Find these service vehicles That is nearest to them.

## Key Terms 
#### 1. The Tracker/Services : 
	- Ambulance Command Center
	- Public Transport Command Center
	- Police Vehicle Command Center
	- Vehicle Towing Command Center
	- Garbage Management Command Center
	- And more….


#### 2. The Trackee:
##### Ambulance
	- Bus/Train/Metro
	- Police Vehicle
	- Towing Vehicle
	- Garbage management Vehicle
	- And More…….

#### 3. The User:
	- Me and You

## Key features:
#### 1. One to many and many to one tracking
#### 2. Alias , can be set at any time and can represent
		1. Vehicle
		2. Person
		3. Number beds in hospital (Covid use case)
		4. and many more.
#### 3. Filter users to be monitored
#### 4. Send message to online users ( 1 to 1 and 1 to all)

## How redis helps us
### - Redis HASH key allows us to store info
### - Redis SEARCH Helps Tracker to get the location of all Trackees and authenticate using multiple parameters ( email and phone )
###	- Redis GEO helps us to give the distance ( GEO RADIUS )
### - Redis PUB/SUB works along with SSE  to perform simple emergency messaging

## Feeding data
#### Api calls to exsting GPS location providers
#### Simple Mobile app ( for trackees )
#### Browser based interface ( mainly for trackers and users ).


## How it works
#### There is a flag in the API app setting to sync with RDBMS [Refer install doc](	/install.md) 
#### we have following FT indexes for RediSearch

```
FT.CREATE idx:users ON hash PREFIX 1 "users:" SCHEMA searchable_email TEXT SORTABLE phone TEXT SORTABLE
FT.CREATE idx:trackerlist ON hash PREFIX 1 "users:" SCHEMA isTracker TEXT SORTABLE exposed TEXT SORTABLE
FT.CREATE idx:trackers ON hash PREFIX 1 "users:" SCHEMA Trackers TEXT SORTABLE
```

1. Register 
	1. User enters details and submits
		- *check if user exists on redis*
		- *check if user exists in db if dbsync is enabled*
		- *if exists send error*
	2. We create an hash key  (users:"phone number of user") and upload all data
	3. Data looks like
		- *users {email, phone, password, Token, isTracker, exposed, searchable_email, alias, Verification_Code, email_verified, Trackers, Location, last_update}*
		- *Trackers and Locations are arrays*
		- *password is sha512 hashed*
	5. if RDBMS sync is on , data is written to rdbms else its all upto redis
	4. Send Confirm email link to email
	- [] To be done SMS 


2. VerifyEmail
	1. The user clicks on the link Verification_Code is changed to a new one ( To avoid reuse ).
	3. email_verified is set to True and 
	2. Success and failure message given as required
	3. if RDBMS sync is on , data is written to rdbms else its all upto redis


3. Login 
	1. User is authenticated
		- *check if user exists on redis*
		- *check if user exists in db if dbsync is enabled*
		- *if does exists send error*
		- *the authe happens on all 3 : phone, email and password*
		- *we use redis search here on idx:users*
	2. If exists on db and not on redis , load the request onto redis ( same as register )
	3. If success send user details along with tokens ( phone, email, alias, token, isTracker)


4. Load the UI 
	![screen](/ss/usersettings.png) 


6. Once the user turns on  tracking switch.

	1. Trackee
	![Mobile Interface for Trackee](/ss/trackee_m.png)
	![Interface for  Trackee](/ss/trackee.png)
		1. Trackee's need to add their trackers ( they can have multiple trackers ).
			- *the list is obtined using redisearch idx:trackerlist*
		![screen](/ss/addtracker.png) ![screen](/ss/viewtrackers.png) ![screen](/ss/deletetracker.png)
		2. Fetches the location from the device ( mobile , browser)
		3. Makes an api call at the requested Update frequency ( default 60s )
			- *updateFrequency can be changed on the fly and is not stored in backend* 
		![screen](/ss/updateFrequency.png)
		4. Trackee can update alias --> this is valid when same drivers drive different bus numbers.
		![screen](/ss/updatealias.png)

	2. Tracker
	![Interface for  Tracker](/ss/tracker.png)
		1. Fetches the location from the device ( mobile , browser)
		2. Makes an api call at the requested Update frequency ( default 60s )
			- *updateFrequency can be changed on the fly and is not stored in backend*
		3. Also fetches the location of all Trackees from REDIS and puts markers on the graph.
			- *we use redis search here on idx:trackers*
		4. Tracker can invite users and Filter from the list of current users whom he want to see.
		![screen](/ss/invite.png) ![screen](/ss/filter.png)


7. Tracker and Trackee can message each other and other ( all ) in case of emergencies.
	* uses redis pubsub and Server side events * 
	![screen](/ss/send.png) ![screen](/ss/receive.png)


8. Logout
	1. Clear all stored credentials

## For Nomal users 
![Interface for  User](/ss/user.png)
1. No login is required
2. They choose the service from list
		- *the list is obtained using redisearch idx:trackerlist*
		- *only services flagged as exposed  and isTracker=True are shown in list*
3. on Search GEO radius is used for services with in 50KM and top 5 are returned
![Search Result](/ss/search.png)
