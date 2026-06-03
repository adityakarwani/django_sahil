from django.db import models
from django.contrib.auth.models import User

class PersonDetail(models.Model):
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='person_detail')
    full_name = models.CharField(max_length=150)
    age = models.IntegerField()
    phone = models.CharField(max_length=20)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES)
    address = models.TextField()
    occupation = models.CharField(max_length=100)
    bio = models.TextField(blank=True)

    def __str__(self):
        return f"{self.full_name} ({self.user.username})"
