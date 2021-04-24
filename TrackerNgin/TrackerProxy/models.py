from django.db import models
from django.contrib.auth.models import AbstractUser


#users {email, phone, password, Token, isTracker, exposed, searchable_email, alias, Verification_code, email_verified, Trackers, Location, last_update}

#user details this is backup in case redis is flushed for some reason 
class Users(AbstractUser):
	phone = models.CharField(max_length=13, unique=True)
	Token = models.CharField(max_length=100)
	isTracker = models.CharField(default="False" ,max_length=10)
	exposed = models.CharField(default="False" ,max_length=10)
	searchable_email = models.CharField(max_length=256)
	alias = models.CharField(max_length=100)
	Verification_Code = models.CharField(max_length=200)
	Trackers = models.CharField(max_length=1000)
	Location = models.CharField(max_length=256)
	last_update = models.CharField(max_length=50) 
	email_verified = models.CharField(default="False" ,max_length=10)

	class Meta:
		indexes = [
					models.Index(fields=['phone',]),
					models.Index(fields=['exposed','isTracker']),
				]

