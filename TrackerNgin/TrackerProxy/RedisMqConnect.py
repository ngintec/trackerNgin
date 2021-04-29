import redis
import logging, traceback, json, ast

from django.utils import timezone
from django.conf import settings 

logger=logging.getLogger("MQ")

RedisMq = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, username=settings.REDIS_USER, password=settings.REDIS_PASSWORD)


def Subscribe(phone):
	MqClient = RedisMq.pubsub(ignore_subscribe_messages=True)
	if RedisMq.hget("users:{}".format(phone),"isTracker").decode("utf-8") == "True":
		MqClient.subscribe("general-{}".format(phone))
	else:
		existing_trackers= ast.literal_eval(RedisMq.hget("users:{}".format(phone),"Trackers").decode("utf-8"))
		for tracker in existing_trackers:
			MqClient.subscribe("general-{}".format(tracker))
	MqClient.subscribe(phone)
	return MqClient

def Publish(message):
	Msg_to = message["to"]
	RedisMq.publish(Msg_to, json.dumps(message))
	return True