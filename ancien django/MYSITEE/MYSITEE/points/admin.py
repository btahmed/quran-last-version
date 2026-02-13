from django.contrib import admin
from .models import PointsLog


@admin.register(PointsLog)
class PointsLogAdmin(admin.ModelAdmin):
    list_display = ['student', 'delta', 'reason', 'submission', 'created_at']
    list_filter = ['created_at']
    search_fields = ['student__username', 'reason']
    readonly_fields = ['created_at']
