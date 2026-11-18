"""Django email backend that sends through Resend's HTTPS API.

Railway blocks outbound SMTP on its Free/Trial/Hobby plans, and it drops the
packets rather than refusing them: an SMTP send does not fail, it hangs until
the worker dies. Resend delivers over HTTPS on port 443, which is never
blocked.

Implemented as a Django backend so the rest of the project keeps calling
`send_mail` and stays unaware of the transport, and so switching back to SMTP
is a matter of overriding EMAIL_BACKEND in the environment.
"""

import logging

import requests
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger(__name__)

RESEND_ENDPOINT = "https://api.resend.com/emails"


class ResendEmailBackend(BaseEmailBackend):
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.api_key = settings.RESEND_API_KEY
        # requests() blocks forever when timeout is None, so always bound it.
        self.timeout = settings.EMAIL_TIMEOUT or 10

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        if not self.api_key:
            if self.fail_silently:
                return 0
            raise ValueError(
                "RESEND_API_KEY is not configured, so no email could be sent."
            )

        sent = 0
        with requests.Session() as session:
            session.headers.update(
                {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }
            )
            for message in email_messages:
                if self._send(session, message):
                    sent += 1
        return sent

    def _send(self, session, message) -> bool:
        payload = {
            "from": message.from_email,
            "to": list(message.to or []),
            "subject": message.subject,
            "text": message.body,
        }
        for field, key in (("cc", "cc"), ("bcc", "bcc"), ("reply_to", "reply_to")):
            values = getattr(message, field, None)
            if values:
                payload[key] = list(values)

        try:
            response = session.post(
                RESEND_ENDPOINT, json=payload, timeout=self.timeout
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            detail = getattr(getattr(exc, "response", None), "text", "")
            logger.error(
                "Resend rejected the message to %s: %s %s",
                ", ".join(payload["to"]),
                exc,
                detail,
            )
            if not self.fail_silently:
                raise

        return True
