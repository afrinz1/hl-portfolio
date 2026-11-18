from rest_framework.test import APITestCase

from .models import Service


class ServiceApiTests(APITestCase):
    def setUp(self):
        self.active_service = Service.objects.create(
            title="Brand identity",
            slug="test-brand-identity",
            is_active=True,
        )
        self.inactive_service = Service.objects.create(
            title="Inactive service",
            slug="test-inactive-service",
            is_active=False,
        )

    def test_legacy_service_list_only_returns_active_services(self):
        response = self.client.get("/api/services/")

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)
        slugs = [service["slug"] for service in response.data]
        self.assertIn(self.active_service.slug, slugs)
        self.assertNotIn(self.inactive_service.slug, slugs)

    def test_v1_service_list_is_paginated_and_only_returns_active_services(self):
        response = self.client.get("/api/v1/services/")

        self.assertEqual(response.status_code, 200)
        slugs = [service["slug"] for service in response.data["results"]]
        self.assertIn(self.active_service.slug, slugs)
        self.assertNotIn(self.inactive_service.slug, slugs)
