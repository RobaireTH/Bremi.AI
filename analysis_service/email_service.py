import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BrevoEmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp-relay.brevo.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_login = os.getenv("SMTP_LOGIN")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.sender_email = os.getenv("SENDER_EMAIL", "robaireth@gmail.com")
        self.sender_name = os.getenv("SENDER_NAME", "Bremi.Ai")

    def send_checkup_email(self, to_email: str, name: str, topic: str, content: str) -> bool:
        if not self.smtp_login or not self.smtp_password:
            logger.warning("SMTP credentials not set. Email not sent.")
            return False

        msg = MIMEMultipart()
        msg['From'] = f"{self.sender_name} <{self.sender_email}>"
        msg['To'] = f"{name} <{to_email}>"
        msg['Subject'] = f"Checking in: {topic}"

        html_content = f"""
        <html>
            <body>
                <p>Hi {name},</p>
                <p>{content}</p>
                <br>
                <p>Warmly,</p>
                <p>Bremi</p>
            </body>
        </html>
        """
        msg.attach(MIMEText(html_content, 'html'))

        try:
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_login, self.smtp_password)
            server.sendmail(self.sender_email, to_email, msg.as_string())
            server.quit()
            logger.info(f"Email sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return False
