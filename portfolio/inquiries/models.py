from django.db import models
from project.models import BaseClass


class Inquiry(BaseClass):

    STATUS_CHOICES = [
        ("new", "New"),
        ("contacted", "Contacted"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
    ]

    name = models.CharField(max_length=150)

    email = models.EmailField()

    company = models.CharField(
        max_length=150,
        blank=True
    )

    service = models.ForeignKey(
        "studio.Service",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inquiries"
    )

    budget_range = models.CharField(
        max_length=100,
        blank=True
    )

    message = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="new"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.status}"