# test_email.py
import os
from email_utils import send_email

if __name__ == "__main__":
    to = os.getenv("TEST_TO_EMAIL", "your.personal.email@example.com")
    send_email(
        to_email=to,
        subject="Test - Algoritmia UP",
        text_body="Hola,\n\nEste es un correo de prueba desde el backend de Algoritmia UP.\n",
        html_body="<p>Hola,<br>Este es un <strong>correo de prueba</strong> desde el backend de Algoritmia UP.</p>",
    )
