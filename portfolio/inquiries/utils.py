from django.core.mail import send_mail
from django.conf import settings
from studio.models import StudioSettings


def send_client_acknowledgement(inquiry):

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