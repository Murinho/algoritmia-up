# app/email_utils.py
import os
import logging
import smtplib
import ssl
from email.message import EmailMessage

logger = logging.getLogger("email")

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER or "no-reply@example.com")


def send_email(to_email: str, subject: str, text_body: str, html_body: str | None = None) -> None:
    """
    Sends an email using Gmail SMTP (via app password).
    """
    if not (SMTP_USER and SMTP_PASS):
        logger.warning(
            "SMTP not configured. Would have sent email to %s with subject '%s'",
            to_email,
            subject,
        )
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = FROM_EMAIL
    msg["To"] = to_email
    msg.set_content(text_body)

    if html_body:
        msg.add_alternative(html_body, subtype="html")

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls(context=context)  # upgrade to TLS
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)

        logger.info("Email sent to %s with subject '%s'", to_email, subject)
    except Exception as e:
        logger.error("Error sending email to %s: %s", to_email, e)
        # You can choose to raise here, but for password reset I usually don't:
        # raise
