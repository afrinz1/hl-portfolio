from datetime import timedelta
from unittest.mock import patch

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import Category, Project, ProjectMedia


class ProjectApiTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Design", slug="design")
        self.project = Project.objects.create(
            title="Published project",
            slug="published-project",
            category=self.category,
            description="A published project",
            year=2025,
            status=True,
        )
        self.unpublished_project = Project.objects.create(
            title="Unpublished project",
            slug="unpublished-project",
            category=self.category,
            description="Not public",
            year=2025,
        )
        ProjectMedia.objects.create(
            project=self.project,
            media_type="image",
            media_url="https://example.com/published.jpg",
        )
        ProjectMedia.objects.create(
            project=self.unpublished_project,
            media_type="image",
            media_url="https://example.com/unpublished.jpg",
        )

    def test_legacy_project_list_keeps_list_shape_and_hides_unpublished(self):
        response = self.client.get("/api/projects/")

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)
        self.assertEqual([item["slug"] for item in response.data], ["published-project"])

    def test_v1_project_list_is_paginated(self):
        response = self.client.get("/api/v1/projects/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            [item["slug"] for item in response.data["results"]],
            ["published-project"],
        )

    def test_project_media_route_only_returns_public_project_media(self):
        legacy_response = self.client.get(
            "/api/projects/published-project/media/"
        )
        v1_response = self.client.get(
            "/api/v1/projects/published-project/media/"
        )

        self.assertEqual(legacy_response.status_code, 200)
        self.assertEqual(len(legacy_response.data), 1)
        self.assertEqual(v1_response.status_code, 200)
        self.assertEqual(v1_response.data["count"], 1)

    def test_v1_page_size_is_capped(self):
        Project.objects.bulk_create(
            [
                Project(
                    title=f"Additional project {index}",
                    slug=f"additional-project-{index}",
                    category=self.category,
                    description="A published project",
                    year=2025,
                    status=True,
                )
                for index in range(105)
            ]
        )
        response = self.client.get("/api/v1/projects/?page_size=1000")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 106)
        self.assertEqual(len(response.data["results"]), 100)


class BaseClassTimestampTests(TestCase):
    def test_created_at_is_immutable_and_updated_at_changes_on_save(self):
        created_at = timezone.now()
        updated_at = created_at + timedelta(seconds=5)

        with patch("django.utils.timezone.now", return_value=created_at):
            category = Category.objects.create(name="Design", slug="design")

        with patch("django.utils.timezone.now", return_value=updated_at):
            category.name = "Updated design"
            category.save()

        category.refresh_from_db()
        self.assertEqual(category.created_at, created_at)
        self.assertEqual(category.updated_at, updated_at)


class DemoPortfolioCommandTests(TestCase):
    def test_seed_command_is_repeatable_and_creates_public_and_hidden_examples(self):
        call_command("seed_demo_portfolio")
        call_command("seed_demo_portfolio")

        demo_projects = Project.objects.filter(
            slug__startswith="demo-portfolio-"
        )
        self.assertEqual(demo_projects.count(), 10)
        self.assertEqual(
            ProjectMedia.objects.filter(
                project__in=demo_projects,
                caption="Demo YouTube video",
            ).count(),
            10,
        )
        self.assertEqual(
            demo_projects.filter(
                status=True,
                active_status=True,
                category__is_active=True,
            ).count(),
            7,
        )
