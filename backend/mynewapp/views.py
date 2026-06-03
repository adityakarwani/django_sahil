from django.shortcuts import render
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from .models import PersonDetail
from .serializers import UserRegisterSerializer, PersonDetailSerializer

class RegisterView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                "token": token.key,
                "username": user.username,
                "email": user.email,
                "message": "User registered successfully."
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {"non_field_errors": ["Username and password are required."]}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)

        if user is not None:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                "token": token.key,
                "username": user.username,
                "email": user.email,
                "message": "Login successful."
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {"non_field_errors": ["Invalid username or password."]}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class PersonDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            detail = request.user.person_detail
            serializer = PersonDetailSerializer(detail)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except PersonDetail.DoesNotExist:
            return Response(
                {"detail": "Person details have not been filled yet."}, 
                status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request):
        try:
            detail = request.user.person_detail
            # If it already exists, update it
            serializer = PersonDetailSerializer(detail, data=request.data, partial=True)
        except PersonDetail.DoesNotExist:
            # If it does not exist, create it
            serializer = PersonDetailSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_200_OK if 'detail' in locals() else status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

