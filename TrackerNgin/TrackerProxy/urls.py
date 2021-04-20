
from django.urls import path, include
from . import views
from django.views.decorators.csrf import csrf_exempt

# need to add  204 preflight response in front end for csrf later
urlpatterns = [
    path('users', csrf_exempt(views.Users)),
    path('verifyemail', views.VerifyEmail),
    path('resetpassword', csrf_exempt(views.ResetPassword.as_view)),
    path('forgotpassword', csrf_exempt(views.ForgotPassword.as_view())),
    path('tracker', csrf_exempt(views.Trackers.as_view())),
    path('invite', csrf_exempt(views.Invite.as_view()))
]
