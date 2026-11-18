from django.db import models
from project.models import BaseClass


class StudioSettings(BaseClass):

    name = models.CharField(max_length=150)
    tagline = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    about = models.TextField(blank=True)

    logo_url = models.URLField(blank=True)

    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=150, blank=True)

    vision = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Service(BaseClass):

    title = models.CharField(max_length=150)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True)

    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["display_order", "created_at"]

    def __str__(self):
        return self.title


class StudioInsight(BaseClass):

    title = models.CharField(max_length=200)
    summary = models.TextField()
    analysis_data = models.JSONField(default=dict, blank=True)

    generated_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=False)

    class Meta:
        ordering = ["-generated_at"]

    def __str__(self):
        return self.title