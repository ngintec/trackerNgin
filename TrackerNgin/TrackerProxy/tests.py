from django.test import TestCase
from tasproj.mainapp import models
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rest_framework import status
import json
from django.conf import settings


#./manage.py test tasproj.adminapp.tests.ApiTestCase
# please not sicne we sre writing into redis the data will not be cread by the trstcase api 
class ApiTestCase(APITestCase):
	def setUp(self):
		print("----------------------------Running Admin Test Cases--------------------------------------")
		csrftoken = None
		self.client = APIClient()

	def test_0_register_user(self):
		"""Register user"""
		print("----------------------------Register an User--------------------------------------\n")
		response = self.client.put('/api/users', {"id":"8765432109","email":"sunayana.arun.h@gmail.com","alias":"Ambulance3","password":"123456789","confirmpassword":"123456789"}, format='json')
		print(response.data)
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)

	def test_2_login_company(self):
		"""Login user"""
		print("----------------------------Login an User--------------------------------------\n")
		response = self.client.post('/api/users', {"id":"8765432109","email":"sunayana.arun.h@gmail.com","password":"123456789"}, format='json')
		self.assertEqual(response.status_code, status.HTTP_200_OK)

	def test_3_update_location(self):
		""" update location"""
		print("----------------------------Update Location--------------------------------------\n")
		self.client.login(username="admin", password="123456789")
		response = self.client.post('/api/location', {"location":[77.58455209323752,12.885577862291418]},format='json')
		print(response.data)
		self.assertEqual(response.status_code, status.HTTP_200_OK)

	def test_4_fetch_location(self):
		""" update location"""
		print("----------------------------Fetch Locations--------------------------------------\n")
		self.client.login(username="admin", password="123456789")
		response = self.client.get('/api/location', {"location":[77.58455209323752,12.885577862291418]},format='json')
		print(response.data)
		self.assertEqual(response.status_code, status.HTTP_200_OK)

	def test_5_fetch_services_exposed(self):
		""" fetch_services_exposed"""
		print("----------------------------FETCH EXPOSED SERVICES--------------------------------------\n")
		self.client.login(username="admin", password="123456789")
		response = self.client.delete('/api/admin/companies/2189/', format='json')
		print(response.data)
		self.assertEqual(response.status_code, status.HTTP_200_OK)

	def test_6_fetch_services_all(self):
		""" fetch_services_all """
		print("----------------------------FETCH ALL SERVICES--------------------------------------\n")
		self.client.login(username="admin", password="123456789")
		response = self.client.delete('/api/admin/companies/2189/', format='json')
		print(response.data)
		self.assertEqual(response.status_code, status.HTTP_200_OK)

	def test_7_fetch_location_services(self):
		""" update location"""
		print("----------------------------FETCH OTG Locations--------------------------------------\n")
		self.client.login(username="admin", password="123456789")
		response = self.client.delete('/api/admin/companies/2189/', format='json')
		print(response.data)
		self.assertEqual(response.status_code, status.HTTP_200_OK)

	def test_8_update_alias(self):
		""" update location"""
		print("----------------------------Update alias--------------------------------------\n")
		self.client.login(username="admin", password="123456789")
		response = self.client.delete('/api/admin/companies/2189/', format='json')
		print(response.data)
		self.assertEqual(response.status_code, status.HTTP_200_OK)

