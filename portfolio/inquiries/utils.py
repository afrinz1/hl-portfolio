import logging

from django.core.mail import send_mail
from django.conf import settings
from studio.models import StudioSettings

logger = logging.getLogger(__name__)


def _mail_configured() -> bool:
    """Whether outbound mail can actually be sent.

    Notifications are sent inline while the inquiry is being created, so a send
    that cannot succeed must be skipped rather than attempted — the inquiry is
    already saved, and all the caller needs back is the response. Which setting
    is required depends on the active backend: the Resend backend needs an API
    key, the SMTP backend needs a username.
    """
    backend = settings.EMAIL_BACKEND or ""
    if backend.endswith("ResendEmailBackend"):
        return bool(settings.RESEND_API_KEY)
    return bool(settings.EMAIL_HOST_USER)


def send_client_acknowledgement(inquiry):

    if not _mail_configured():
        logger.warning(
            "Skipped client acknowledgement for inquiry %s: the active email "
            "backend (%s) is not configured.",
            inquiry.pk,
            settings.EMAIL_BACKEND,
        )
        return

    subject = "We've received your inquiry | Hectic Labs"

    message = f"""
    Hey {inquiry.name},

    Thank you for contacting Hectic Labs!

    We've successfully received your inquiry.
    Our team will review your requirements and
    get back to you as soon as possible.

    Looking forward to creating something great together!

    Regards,
    Hectic Labs
    """

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [inquiry.email]
    )


def send_admin_notification(inquiry):

    if not _mail_configured():
        logger.warning(
            "Skipped admin notification for inquiry %s: the active email "
            "backend (%s) is not configured.",
            inquiry.pk,
            settings.EMAIL_BACKEND,
        )
        return

    studio = StudioSettings.objects.first()

    # The studio's address is public-facing contact information, so where
    # notifications land is configurable independently of it.
    recipient = settings.INQUIRY_NOTIFICATION_EMAIL or (
        studio.email if studio else ""
    )

    if not recipient:
        logger.warning(
            "Skipped admin notification for inquiry %s: neither "
            "INQUIRY_NOTIFICATION_EMAIL nor the studio contact email is set.",
            inquiry.pk,
        )
        return

    subject = "New Client Inquiry | Hectic Labs"

    message = f"""
    A new inquiry has been submitted.

    Name: {inquiry.name}
    Email: {inquiry.email}
    Company: {inquiry.company}
    Budget: {inquiry.budget_range}

    Message:
    {inquiry.message}
    """

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [recipient]
    )