from django import forms
from .models import Submission, validate_audio_file, ALLOWED_AUDIO_EXTENSIONS, MAX_AUDIO_SIZE_MB


class SubmissionForm(forms.ModelForm):
    """Form for audio file submission. Reuses model validators."""

    # Privacy consent checkbox (required)
    privacy_consent = forms.BooleanField(
        required=True,
        label="J'accepte l'enregistrement temporaire de cet audio.",
        error_messages={
            'required': "Vous devez accepter les conditions pour soumettre votre audio."
        }
    )

    class Meta:
        model = Submission
        fields = ['audio_file']
        widgets = {
            'audio_file': forms.FileInput(attrs={
                'accept': ','.join(ALLOWED_AUDIO_EXTENSIONS),
                'class': 'form-control'
            })
        }
        labels = {
            'audio_file': 'Fichier audio'
        }
        help_texts = {
            'audio_file': f"Formats acceptés: {', '.join(ALLOWED_AUDIO_EXTENSIONS)}. Taille max: {MAX_AUDIO_SIZE_MB} MB."
        }

    def clean_audio_file(self):
        """Extra validation on top of model validators."""
        audio_file = self.cleaned_data.get('audio_file')
        if audio_file:
            # Model validator handles extension and size, but we can add extra checks here
            validate_audio_file(audio_file)
        return audio_file
