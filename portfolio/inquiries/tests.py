from django.core import mail
from django.test import override_settings
from rest_framework.test import APITestCase

from studio.models import Service, StudioSettings
from .models import Inquiry


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
)
class InquiryApiTests(APITestCase):
    def setUp(self):
        mail.outbox.clear()
        self.service = Service.objects.create(
            title="Brand identity",
            slug="inquiry-brand-identity",
            is_active=True,
        )
        StudioSettings.objects.create(
            name="Test Studio",
            tagline="Test",
            email="studio@example.com",
        )

    def test_submission_creates_inquiry_and_sends_both_emails(self):
        initial_count = Inquiry.objects.count()
        response = self.client.post(
            "/api/inquiries/",
            {
                "name": "Alex",
                "email": "alex@example.com",
                "company": "Example Co",
                "service": self.service.pk,
                "budget_range": "10k-20k",
                "message": "I need a new portfolio site.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Inquiry.objects.count(), initial_count + 1)
        self.assertEqual(len(mail.outbox), 2)

    def test_invalid_submission_does_not_create_inquiry_or_send_email(self):
        initial_count = Inquiry.objects.count()
        response = self.client.post(
            "/api/inquiries/",
            {"name": "Alex", "email": "not-an-email", "message": "Hello"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Inquiry.objects.count(), initial_count)
        self.assertEqual(mail.outbox, [])
