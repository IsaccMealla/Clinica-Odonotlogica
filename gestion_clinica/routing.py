from django.urls import re_path
from .consumers import StudentNotificationConsumer, AppointmentConsumer

websocket_urlpatterns = [
    re_path(r'ws/appointments/$', AppointmentConsumer.as_asgi()),
    re_path(r'ws/students/(?P<student_id>[0-9a-fA-F-]+)/$', StudentNotificationConsumer.as_asgi()),
]
