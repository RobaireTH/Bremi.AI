import os
import json
import logging
import httpx
from typing import Optional, Dict, Any

# Configure logging
logger = logging.getLogger(__name__)

class WhatsAppService:
    def __init__(self):
        self.api_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
        self.phone_number_id = os.getenv("PHONE_NUMBER_ID")
        self.api_version = os.getenv("WHATSAPP_API_VERSION", "v17.0")
        self.base_url = f"https://graph.facebook.com/{self.api_version}"
        self.environment = os.getenv("ENVIRONMENT", os.getenv("APP_ENV", "development")).lower()
        self.mock_mode = os.getenv("WHATSAPP_MOCK_MODE", "false").lower() == "true"
        
        # In production-like environments, fail fast if credentials are missing
        if self.environment in ("production", "staging") and (not self.api_token or not self.phone_number_id):
            logger.error("WhatsApp credentials are required in production/staging. "
                         "Set WHATSAPP_ACCESS_TOKEN and PHONE_NUMBER_ID.")
            raise ValueError("Missing WhatsApp credentials in production/staging.")

        if not self.api_token or not self.phone_number_id:
            logger.warning(
                "WhatsApp credentials not fully set. Running in MOCK mode; "
                "messages will be logged but not sent to the WhatsApp Cloud API."
            )
            self.mock_mode = True
        elif self.mock_mode:
            logger.info("WhatsAppService started in explicit MOCK mode. No real messages will be sent.")

    async def send_message(self, to_number: str, text: str) -> bool:
        """
        Sends a text message to a WhatsApp user asynchronously.
        """
        if self.mock_mode or not self.api_token or not self.phone_number_id:
            logger.info(f"[MOCK SEND] To: {to_number}, Message: {text}")
            return True

        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_number,
            "type": "text",
            "text": {
                "preview_url": False,
                "body": text
            }
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=5.0)) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                logger.info(f"Message sent to {to_number}")
                return True
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP error sending WhatsApp message: {e.response.status_code} - {e.response.text}")
                return False
            except httpx.RequestError as e:
                logger.error(f"Network error sending WhatsApp message: {e}")
                return False
            except Exception as e:
                logger.error(f"Unexpected error sending WhatsApp message: {e}")
                return False

    async def mark_as_read(self, message_id: str) -> bool:
        """
        Marks a message as read asynchronously.
        """
        if self.mock_mode or not self.api_token or not self.phone_number_id:
            # In mock mode we consider this a no-op success to keep flows simple.
            return True

        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": message_id
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=5.0)) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                return True
            except Exception as e:
                logger.error(f"Error marking message {message_id} as read: {e}")
                return False
