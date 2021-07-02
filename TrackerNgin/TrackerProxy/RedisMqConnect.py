import redis
import logging, traceback, json, ast

from django.utils import timezone
from django.conf import settings 

from redisearch import Client

logger=logging.getLogger("MQ")

RedisMq = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, username=settings.REDIS_USER, password=settings.REDIS_PASSWORD)

trackers_idx = Client('idx:trackers', conn=RedisMq)

def Subscribe(phone):
	messages=[]
	length=len(RedisMq.lrange("messages:{}".format(phone),0,-1))
	while length > 0:
		message=RedisMq.lpop("messages:{}".format(phone))
		messages.append(message)
		length-=1
	return messages

def Publish(message):
	Msg_to = message["to"]
	if Msg_to.startswith("general-"):
		#publish to all
		phone=Msg_to.split("-")[1]
		#send to tracker
		RedisMq.rpush("messages:{}".format(phone), json.dumps(message))
		#sent to the rest who have same tracker
		result=trackers_idx.search(phone)
		for row in result.docs:
			user=row.__dict__
			RedisMq.rpush("messages:{}".format(user['phone']), json.dumps(message))
	else:
		#publish to one
		RedisMq.rpush("messages:{}".format(Msg_to), json.dumps(message))
	return True

def StoreMessage(message):
	message_from = message["from"]
	message_to = message["to"]
	message_location = message['locationValue']
	save_message = {"from": message_from, "message" : message['message'], "location": message_location }

	RedisMq.rpush("messages:{}".format(message_to), json.dumps(save_message))
	return True

