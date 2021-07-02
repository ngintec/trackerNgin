
from django.urls import path, include
from . import views
from django.views.decorators.csrf import csrf_exempt

# need to add  204 preflight response in front end for csrf later
# Specific to services

urlpatterns = [
    path('users', csrf_exempt(views.Users.as_view())),
    path('verifyemail', views.VerifyEmail.as_view()),
    path('resetpassword', csrf_exempt(views.ResetPassword.as_view())),
    path('forgotpassword', csrf_exempt(views.ForgotPassword.as_view())),
    path('tracker', csrf_exempt(views.Trackers.as_view())),
    path('invite', csrf_exempt(views.Invite.as_view())),
    path('location', csrf_exempt(views.Location.as_view())),
    path('services', csrf_exempt(views.UserService.as_view())),
    path('services/trackee', csrf_exempt(views.TrackeeService.as_view())),
    path('search', csrf_exempt(views.Search.as_view())),
    path('alias', csrf_exempt(views.Alias.as_view())),
    path('publish', csrf_exempt(views.Publish.as_view())),
    path('event', csrf_exempt(views.Consume.as_view())),
    path('message', csrf_exempt(views.UserMessage.as_view())),
]
