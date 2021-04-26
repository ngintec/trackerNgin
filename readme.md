# Why TrackerNgin
### - [x] To help Services be on top of the location of their vehicles
### - [] Communicate with them
### - [x] To help users Find these service vehicles That is nearest to them.

## Key Terms 
#### 1.The Tracker/Services : 
######Ambulance Command Center
######Public Transport Command Center
######Police Vehicle Command Center
######Vehicle Towing Command Center
######Garbage Management Command Center
####And more….


#### 2.The Trackee:
######Ambulance
######Bus/Train/Metro
######Police Vehicle
######Towing Vehicle
######Garbage management Vehicle
####And More…….

#### 3.The User:
####Me and You


## How redis helps us
### - [x] Redis Hash key allows us to store info
### - [x] Redis Search Helps Tracker to get the location of all Trackees and authenticate using multiple parameters ( email and phone )
###	- [x] Redis GEO helps us to give the distance ( GEO RADIUS )
### - [] Redis pubsub works along with SSE  to perform webrtc calls ( it on mobile )

## Feeding data
####Api calls to exsting GPS location providers
####Simple Mobile app ( for trackees )
####Browser based interface ( mainly for trackers and users ).

## Images 
![Interface for  User]
(./ss/user.jpg)
![Interface for  Tracker]
(./ss/tracker.jpg)
![Interface for  Trackee]
(./ss/trackee.jpg)
![Mobile Interface for Trackee]
(./ss/trackee_m.jpg)

## How it works
#### There is a flag in the API app setting to sync with RDBMS [Refer install doc](./install.md) 
#### we have following FT indexes for RediSearch

```
FT.CREATE idx:users ON hash PREFIX 1 "users:" SCHEMA searchable_email TEXT SORTABLE phone TEXT SORTABLE
FT.CREATE idx:trackerlist ON hash PREFIX 1 "users:" SCHEMA isTracker TEXT SORTABLE exposed TEXT SORTABLE
FT.CREATE idx:trackers ON hash PREFIX 1 "users:" SCHEMA Trackers TEXT SORTABLE
```
1. Register 
	1. User enters details and submits
	*check if user exists on redis*
	*check if user exists in db if dbsync is enabled*
	*if exists send error*
	2. We create an hash key  (users:"phone number of user") and upload all data
	3. Data looks like
	*users {email, phone, password, Token, isTracker, exposed, searchable_email, alias, Verification_Code, email_verified, Trackers, Location, last_update}*
	*Trackers and Locations are arrays*
	*password is sha512 hashed*
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
	*check if user exists on redis*
	*check if user exists in db if dbsync is enabled*
	*if does exists send error*
	*the authe happens on all 3 : phone, email and password*
	*we use redis search here on idx:users*
	2. If exists on db and not on redis , load the request onto redis ( same as register )
	3. If success send user details along with tokens ( phone, email, alias, token, isTracker)
4. Load the UI 
5. Trackee's need to add their trackers ( they can have multiple trackers ).
	*the list is obtined using redisearch idx:trackerlist*
	*only services flagged isTracker=True are shown in list*
6. Once the user turns on  tracking switch.
	1. If Trackee
		1. Fetches the location from the device ( monile , browser)
		2. Makes an api call at the requested Update frequency ( default 10s )
		*updateFrequency can be changed on the fly and is not stored in backend 
		[screen](./ss/updateFrequency.jpg)*
	2. If Tracker
		1. Fetches the location from the device ( monile , browser)
		2. Makes an api call at the requested Update frequency ( default 10s )
		*updateFrequency can be changed on the fly and is not stored in backend*
		3. Also fetches the location of all Trackees from REDIS and puts markers on the graph.
		*we use redis search here on idx:trackers*
7. Logout
	1. Clear all stored credentials

## For Nomal users 
1. No login is required
2. They choose the service from list
	*the list is obtined using redisearch idx:trackerlist*
	*only services flagged as exposed  and isTracker=True are shown in list*
3. on Search GEO radius is used for services with in 50KM and top 5 are returned
