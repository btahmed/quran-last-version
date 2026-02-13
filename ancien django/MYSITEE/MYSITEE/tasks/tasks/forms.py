from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import User, Task, Team
from django.core.exceptions import ValidationError


class RegisterForm(UserCreationForm):
    class Meta:
        model = User
        fields = ("username", "email", "description", "password1", "password2")


class TaskForm(forms.ModelForm):
    assigned_users = forms.ModelMultipleChoiceField(
        queryset=User.objects.none(),  # mis à jour dynamiquement dans __init__
        required=False,
        widget=forms.CheckboxSelectMultiple
    )

    assigned_teams = forms.ModelMultipleChoiceField(
        queryset=Team.objects.none(),  # mis à jour dynamiquement dans __init__
        required=False,
        widget=forms.CheckboxSelectMultiple
    )

    class Meta:
        model = Task
        fields = ['title', 'description', 'status', 'is_private', 'assigned_users', 'assigned_teams', 'parent']
        widgets = {
            'assigned_users': forms.CheckboxSelectMultiple,
            'assigned_teams': forms.CheckboxSelectMultiple,
        }

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)

        if user:
            self.fields['assigned_users'].queryset = User.objects.exclude(id=user.id)
            self.fields['assigned_teams'].queryset = Team.objects.all()

            queryset = Task.objects.filter(author=user)
            if self.instance.pk:
                queryset = queryset.exclude(pk=self.instance.pk)
            self.fields['parent'].queryset = queryset

    def clean(self):
        cleaned_data = super().clean()
        parent = cleaned_data.get('parent')
        is_private = cleaned_data.get('is_private')

        if parent and not parent.is_private and is_private:
            raise ValidationError("Une sous-tâche d’une tâche publique ne peut pas être privée.")
        return cleaned_data


class TeamForm(forms.ModelForm):
    class Meta:
        model = Team
        fields = ['name', 'members']
        widgets = {
            'members': forms.CheckboxSelectMultiple
        }
