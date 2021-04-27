from django.test import TestCase
# from tasproj.mainapp import models
from rest_framework.test import RequestsClient
from rest_framework.test import APITestCase
from rest_framework import status
import json
from django.conf import settings


#Testusers and tokens
# { 8765432109:tn_user1@mailinator.com:zVZuezsgTfSX2pXzDyaKVIDfg1l2VH4GD8jyaDRRdW2QDfOTQ1ZG1gDv5uZvJpzu }
# { 6543217890:tn_user2@mailinator.com:BTL7c4KX05CH7NwKXNJ7he8IuWCGO8SbN1OAiWe2PlMijbFOU5LEGPzL45JEGF16}
# { 7654321890:tn_user3@mailinator.com:f5NPrVjZcie544IuuwnCpxtiYGP9SsGWEszXvWaDGU6v0TGK6gyQ1Y3vbZsVNfB8}
# { 7654321891:tn_user4@mailinator.com:yGJR1LtSeg1hZzarmxSdQGPRWr6mjckooEZ8aZ6QKjwNtaUM8yqsu24kkWKsej3f}
# { 7654321892:tn_user5@mailinator.com:nAGAgGoXQvaMVmLQ78LwW6NEqLSyQA1S9TRc17RcmAkE4Ii7poTVEZqMvZyEaFD0}

#./manage.py test TrackerNgin.TrackerProxy.tests.ApiTestCase
# please not sicne we sre writing into redis the data will not be cread by the trstcase api 
class ApiTestCase(APITestCase):
	def setUp(self):
		print("----------------------------Running Test Cases--------------------------------------")
		csrftoken = None
		self.client = RequestsClient()

	# def test_0_register_user(self):
	# 	"""Register user"""
	# 	print("----------------------------Register an User--------------------------------------\n")
	# 	response = self.client.put('https://localhost/api/users', json={"id":"7654321891","email":"tn_user4@mailinator.com","alias":"Ambulance4","password":"123456789","confirmpassword":"123456789"})
	# 	response = self.client.put('https://localhost/api/users', json={"id":"7654321892","email":"tn_user5@mailinator.com","alias":"Ambulance4","password":"123456789","confirmpassword":"123456789"})
		
	# 	self.assertEqual(response.status_code, status.HTTP_200_OK)

	# def test_2_login_company(self):
	# 	"""Login user"""
	# 	print("----------------------------Login an User--------------------------------------\n")
	# 	response = self.client.post('https://localhost/api/users', json={"id":"7654321891","email":"tn_user4@mailinator.com","password":"123456789"})
	# 	print(response.content)
	# 	response = self.client.post('https://localhost/api/users', json={"id":"7654321892","email":"tn_user5@mailinator.com","password":"123456789"})
	# 	print(response.content)
	# 	self.assertEqual(response.status_code, status.HTTP_200_OK)

	# def test_8_update_alias(self):
	# 	""" update alias"""
	# 	print("----------------------------Update alias--------------------------------------\n")
	# 	response = self.client.post('https://localhost/api/alias', json={"alias" : "Ambulance1"}, 
	# 		headers= {'id': '8765432109', 'token':'zVZuezsgTfSX2pXzDyaKVIDfg1l2VH4GD8jyaDRRdW2QDfOTQ1ZG1gDv5uZvJpzu'})
	# 	print(response.content)
	# 	response = self.client.post('https://localhost/api/alias', json={"alias" : "Ambulance2"}, 
	# 		headers= {'id': '6543217890', 'token':'BTL7c4KX05CH7NwKXNJ7he8IuWCGO8SbN1OAiWe2PlMijbFOU5LEGPzL45JEGF16'})
	# 	print(response.content)
	# 	response = self.client.post('https://localhost/api/alias', json={"alias" : "Ambulance3"}, 
	# 		headers= {'id': '7654321890', 'token':'f5NPrVjZcie544IuuwnCpxtiYGP9SsGWEszXvWaDGU6v0TGK6gyQ1Y3vbZsVNfB8'})
	# 	print(response.content)
	# 	response = self.client.post('https://localhost/api/alias', json={"alias" : "Ambulance4"}, 
	# 		headers= {'id': '7654321891', 'token':'yGJR1LtSeg1hZzarmxSdQGPRWr6mjckooEZ8aZ6QKjwNtaUM8yqsu24kkWKsej3f'})
	# 	print(response.content)
	# 	response = self.client.post('https://localhost/api/alias', json={"alias" : "Ambulance5"}, 
	# 		headers= {'id': '7654321892', 'token':'nAGAgGoXQvaMVmLQ78LwW6NEqLSyQA1S9TRc17RcmAkE4Ii7poTVEZqMvZyEaFD0'})
	# 	print(response.content)
	# 	self.assertEqual(response.status_code, status.HTTP_200_OK)

	# def test_8_add_tracker(self):
	# 	""" Add tracker"""
	# 	print("----------------------------Add tracker--------------------------------------\n")
	# 	response = self.client.post('https://localhost/api/tracker', json={"Tracker" : "9876543210"}, 
	# 		headers= {'id': '8765432109', 'token':'zVZuezsgTfSX2pXzDyaKVIDfg1l2VH4GD8jyaDRRdW2QDfOTQ1ZG1gDv5uZvJpzu'})
	# 	print(response.content)
	# 	response = self.client.post('https://localhost/api/tracker', json={"Tracker" : "9876543210"}, 
	# 		headers= {'id': '6543217890', 'token':'BTL7c4KX05CH7NwKXNJ7he8IuWCGO8SbN1OAiWe2PlMijbFOU5LEGPzL45JEGF16'})
	# 	print(response.content)
	# 	response = self.client.post('https://localhost/api/tracker', json={"Tracker" : "9876543210"}, 
	# 		headers= {'id': '7654321890', 'token':'f5NPrVjZcie544IuuwnCpxtiYGP9SsGWEszXvWaDGU6v0TGK6gyQ1Y3vbZsVNfB8'})
	# 	print(response.content)
	# 	response = self.client.post('https://localhost/api/tracker', json={"Tracker" : "9876543210"}, 
	# 		headers= {'id': '7654321891', 'token':'yGJR1LtSeg1hZzarmxSdQGPRWr6mjckooEZ8aZ6QKjwNtaUM8yqsu24kkWKsej3f'})
	# 	print(response.content)
	# 	response = self.client.post('https://localhost/api/tracker', json={"Tracker" : "9876543210"}, 
	# 		headers= {'id': '7654321892', 'token':'nAGAgGoXQvaMVmLQ78LwW6NEqLSyQA1S9TRc17RcmAkE4Ii7poTVEZqMvZyEaFD0'})
	# 	print(response.content)
	# 	self.assertEqual(response.status_code, status.HTTP_200_OK)

	def test_3_update_location(self):
		""" update location"""
		print("----------------------------Update Location--------------------------------------\n")
		response = self.client.post('https://localhost/api/location', json={"location" : [77.55055209323752,12.855577862291418]}, 
			headers= {'id': '8765432109', 'token':'zVZuezsgTfSX2pXzDyaKVIDfg1l2VH4GD8jyaDRRdW2QDfOTQ1ZG1gDv5uZvJpzu'})
		print(response.content)
		response = self.client.post('https://localhost/api/location', json={"location" : [77.60455209323752,12.805577862291418]}, 
			headers= {'id': '6543217890', 'token':'BTL7c4KX05CH7NwKXNJ7he8IuWCGO8SbN1OAiWe2PlMijbFOU5LEGPzL45JEGF16'})
		print(response.content)
		response = self.client.post('https://localhost/api/location', json={"location" : [77.70055209323752,12.950577862291418]}, 
			headers= {'id': '7654321890', 'token':'f5NPrVjZcie544IuuwnCpxtiYGP9SsGWEszXvWaDGU6v0TGK6gyQ1Y3vbZsVNfB8'})
		print(response.content)
		response = self.client.post('https://localhost/api/location', json={"location" : [77.65455209323752,12.909577862291418]}, 
			headers= {'id': '7654321891', 'token':'yGJR1LtSeg1hZzarmxSdQGPRWr6mjckooEZ8aZ6QKjwNtaUM8yqsu24kkWKsej3f'})
		print(response.content)
		response = self.client.post('https://localhost/api/location', json={"location" : [77.50155209323752,12.755577862291418]}, 
			headers= {'id': '7654321892', 'token':'nAGAgGoXQvaMVmLQ78LwW6NEqLSyQA1S9TRc17RcmAkE4Ii7poTVEZqMvZyEaFD0'})
		print(response.content)
		self.assertEqual(response.status_code, status.HTTP_200_OK)

	# def test_4_fetch_location(self):
	# 	""" update location"""
	# 	print("----------------------------Fetch Locations--------------------------------------\n")
	# 	self.client.headers.update({'id': '9876543210', 'token':'EDYeOAuHVQBaxLJQ2dzDIcPJeJ0qPYUX8CZhBvnu3255uk5XZgNILOimxQvNDlC5'})
	# 	response = self.client.get('https://localhost/api/location')
	# 	print(response.content)
	# 	self.assertEqual(response.status_code, status.HTTP_200_OK)

	# def test_5_fetch_services_exposed(self):
	# 	""" fetch_services_exposed"""
	# 	print("----------------------------FETCH EXPOSED SERVICES--------------------------------------\n")
	# 	response = self.client.get('https://localhost/api/services')
	# 	print(response.content)
	# 	self.assertEqual(response.status_code, status.HTTP_200_OK)

	# def test_6_fetch_services_all(self):
	# 	""" fetch_services_all """
	# 	print("----------------------------FETCH ALL SERVICES--------------------------------------\n")
	# 	self.client.headers.update({'id': '9876543210', 'token':'EDYeOAuHVQBaxLJQ2dzDIcPJeJ0qPYUX8CZhBvnu3255uk5XZgNILOimxQvNDlC5'})
	# 	response = self.client.get('https://localhost/api/services/trackee')
	# 	print(response.content)
	# 	self.assertEqual(response.status_code, status.HTTP_200_OK)

	# def test_7_fetch_location_services(self):
	# 	""" update data for a service"""
	# 	print("----------------------------FETCH OTG Locations--------------------------------------\n")
	# 	# self.client.headers.update({'id': '9876543210', 'token':'EDYeOAuHVQBaxLJQ2dzDIcPJeJ0qPYUX8CZhBvnu3255uk5XZgNILOimxQvNDlC5'})
	# 	response = self.client.post('https://localhost/api/search', json={"service":"9876543210", "location":[77.58455209323752,12.885577862291418]})
	# 	print(response.content)
	# 	self.assertEqual(response.status_code, status.HTTP_200_OK)


