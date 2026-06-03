from django.urls import path
from .views import RegisterView, LoginView, PersonDetailView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('person-detail/', PersonDetailView.as_view(), name='person-detail'),
]
