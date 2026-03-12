import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print("Deleting all users to ensure a clean slate...")
# Using raw SQL or Django ORM to delete all users might be safer if foreign keys cascade
User.objects.all().delete()

print("Creating teacher user...")
# Create superuser for teacher to access admin if needed, and set role
teacher = User.objects.create_superuser('teacher', 'teacher@example.com', 'password123')
teacher.role = 'teacher'
teacher.first_name = 'المعلم'
teacher.save()

print("Creating student user...")
student = User.objects.create_user('student', 'student@example.com', 'password123')
student.role = 'student'
student.first_name = 'الطالب'
student.save()

print("\n--- CREDENTIALS CREATED ---")
print("Teacher Username: teacher")
print("Teacher Password: password123")
print("Student Username: student")
print("Student Password: password123")
print("---------------------------\n")
