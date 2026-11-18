import logging

from django.core.mail import send_mail
from django.conf import settings
from studio.models import StudioSettings

logger = logging.getLogger(__name__)


def _smtp_configured() -> bool:
    """Whether outbound mail can actually be sent.

    The configured backend is SMTP (smtp.gmail.com by default), which needs an
    authenticated mailbox. Without credentials a send can only block on a
    connection that will never succeed — and because notifications are sent
    inline during inquiry creation, that would stall (or time out) the whole
    request even though the inquiry itself was already saved.
    """
    return bool(settings.EMAIL_HOST_USER)


def send_client_acknowledgement(inquiry):

    if not _smtp_configured():
        logger.warning(
            "Skipped client acknowledgement for inquiry %s: SMTP is not "
            "configured (EMAIL_HOST_USER is empty).",
            inquiry.pk,
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

    if not _smtp_configured():
        logger.warning(
            "Skipped admin notification for inquiry %s: SMTP is not "
            "configured (EMAIL_HOST_USER is empty).",
            inquiry.pk,
        )
        return

    studio = StudioSettings.objects.first()

    if not studio or not studio.email:
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
        [studio.email]
    )