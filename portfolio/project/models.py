from django.db import models

import uuid

# Create your models here.

class BaseClass(models.Model):

    uuid = models.UUIDField(unique=True, default=uuid.uuid4)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:

        abstract = True

class Category(BaseClass):

    name = models.CharField(max_length=250)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "category"
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Project(BaseClass):

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="projects"
    )

    client = models.CharField(max_length=150, blank=True)
    description = models.TextField()

    cover_image = models.URLField(blank=True)

    year = models.PositiveIntegerField()

    status = models.BooleanField(default=False)
    active_status = models.BooleanField(default=True)

    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "-created_at"]

    def __str__(self):
        return self.title


class ProjectMedia(BaseClass):

    MEDIA_TYPE_CHOICES = [
        ("image", "Image"),
        ("video", "Video"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="media"
    )

    media_type = models.CharField(
        max_length=10,
        choices=MEDIA_TYPE_CHOICES
    )

    media_url = models.URLField()

    public_id = models.CharField(max_length=255, blank=True)

    poster_url = models.URLField(blank=True)

    caption = models.CharField(max_length=255, blank=True)

    alt_text = models.CharField(max_length=255, blank=True)

    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "created_at"]

    def __str__(self):
        return f"{self.project.title} - {self.media_type}"