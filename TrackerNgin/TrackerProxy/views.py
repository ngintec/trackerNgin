from django.shortcuts import render
from django.http import JsonResponse, HttpResponseRedirect
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
import logging, json
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

		def create(self, request):
			try:
				request_origin = request.META['HTTP_ORIGIN']
				# validate the input
				user_data=request.data
				status, message = ValidateInput(user_data)
				# if succes take action
				if not status:
					return JsonResponse(response,status=400)
				#entries into redis
				message, status= RedisConnect.Register_Users(user_data)
				#Check if user registration failed
				if not status:
					#else respond with error
					response = { "message" : "Could not register", "Reason": message}
					return JsonResponse(response,status=400)
				#Send mail to confirm email id
				message, status= SendRegisterMail(message['email'],message['Verification_Code'],message['phone'],request_origin)
				#Check if some thing happens during email sending
				if not status:
					RedisConnect.Clear_User(user_data)
					response = { "message" : "Could not register", "Reason": message}
					return JsonResponse(response,status=400)
				else:
					response = { "message" : "Registration Success, Please verify your email before Logging in( Check Yor Email, including Junk Folder )"}
					return JsonResponse(response)
			except:
				pass
				return JsonResponse({"message":"Internal Server Error", "Reason":"Technical Error"},status=500)

		def post(self, request):
			try:
				user_data=request.data
				#try to login the user
				message, status = RedisConnect.Login_Users(user_data)
				if not status:
					response = { "message" : message}
					return JsonResponse(response,status=400)
				#set the alias as sent in login form
				return_reponse= message
				message, status = RedisConnect.UpdateAlias(user_data)
				if not status:
					response = { "message" : "Login Failed", "Reason": message}
					return JsonResponse(response,status=400)
				#add alias here on success
				return_reponse['alias']=user_data['alias']
				return JsonResponse(return_reponse)
			except:
				pass
				return JsonResponse({"message":"Internal Server Error", "Reason":"Technical Error"},status=500)


class VerifyEmail(APIView):

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
			pass
			return JsonResponse({"message":"Internal Server Error", "Reason":"Technical Error"},status=500)


class ResetPassword(APIView):
	permission_classes=[LoggedIn]

	def post(self, request):
		try:
			user_data=request.data
			#validate the input
			status, message = ValidateInput(user_data)
			# if succes take action
			if not status:
				return Response(response,status=400)
			#if input is alright then update the password
			message, result= RedisConnect.UpdatePassword(user_data)
			if result:
				return Response({"message": "Password successfully changed, Please logout and login"})
			else:
				return Response({"message": "Password Change failure", "Reason": message}, status=400)
		except:
			pass
			return Response({"message":"Internal Server Error", "Reason":"Technical Error"},status=500)

class ForgotPassword(APIView):

	def post(self, request):
		user_data= request.data

		message, result= RedisConnect.UpdateForgottenPassword(user_data)
		if not result:
			return Response({"message": "Some thing went Wrong", "Reason": message}, status=400)

		message, result= SendTempPassword(message, user_data['email'])
		if result:
			return Response({"message": "Please Check your email for temporary password(Including Junk Folder)"})
		else:
			return Response({"message": "Some thing went Wrong", "Reason": message}, status=400)


class Trackers(APIView):
	permission_classes=[LoggedIn]

	def post(self, request):
		user_data= request.data
		# i dont send the id here so reat from authenticated header
		user_data['id']= request.headers['id']
		if user_data['id'] == user_data['Tracker']:
			return Response({"message": "You cannot be your own tracker", "Reason": "Not Allowed"}, status=400)

		message, trackers, result= RedisConnect.AddTracker(user_data)
		if not result:
			return Response({"message": "Some thing went Wrong", "Reason": message}, status=400)
	
		return Response({"message": message, "Trackers": trackers})

	def delete(self, request):
		user_data= request.data
		# i dont send the id here so reat from authenticated header
		user_data['id']= request.headers['id']
		if user_data['id'] == user_data['Tracker']:
			return Response({"message": "You cannot be your own tracker", "Reason": "Not Allowed"}, status=400)

		message, trackers, result= RedisConnect.DeleteTracker(user_data)
		if not result:
			return Response({"message": "Some thing went Wrong", "Reason": message}, status=400)
	
		return Response({"message": message, "Trackers": trackers})


class Invite(APIView):
	permission_classes=[LoggedIn]

	def post(self, request):
		request_origin = request.META['HTTP_ORIGIN']
		user_data= request.data

		message, result= SendInviteMails(user_data['inviter'],user_data['email'], request_origin)
		if not result:
			return Response({"message": "Some thing went Wrong", "Reason": message}, status=400)

		return Response({"message": "Invite email has been sent on your behalf"})

#todo
#Logout = change the token??
#Location 