import os
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

class FollowUpPlan(BaseModel):
    needs_followup: bool = Field(description="Whether the user needs a check-in based on unresolved stress or events.")
    topic: str = Field(description="The main topic (e.g., 'Job Interview', 'Argument with Spouse').")
    context_summary: str = Field(description="A one-sentence summary of why we are checking in.")
    suggested_delay_hours: int = Field(description="How many hours from now to send the check-in (e.g., 24, 48).")
    email_draft: str = Field(description="A short, warm, casual email draft from 'Bremi' checking in on this specific topic.")

class ContextAnalyzer:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            print("Warning: GEMINI_API_KEY not set.")
        self.client = genai.Client(api_key=self.api_key)
        self.model_id = "gemini-2.5-flash"

    def analyze_for_followup(self, history: List[Dict[str, str]]) -> FollowUpPlan:
        transcript = "\n".join([f"{msg.get('role', 'unknown').upper()}: {msg.get('text', '')}" for msg in history])
        
        system_instruction = """
        You are Bremi's "Memory Manager". Your goal is to identify "Open Loops" in the user's life that require a friendly check-in later.
        
        Look for:
        1. Upcoming stressful events (exams, interviews, dates, medical appointments).
        2. Unresolved emotional conflicts (arguments, breakups, bad news).
        3. Expressions of loneliness or needing support over time.
        
        If you find such an event, determine:
        - What is it?
        - When is a good time to check in? (Usually 24 hours later, or after the event).
        - Write a short, culturally aware (Nigerian context) email draft.
        
        If nothing significant is found, set needs_followup to False.
        """

        prompt = f"""
        Analyze this chat transcript for follow-up opportunities:
        
        {transcript}
        
        Return the JSON plan.
        """

        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=FollowUpPlan
                )
            )
            
            if response.text:
                return FollowUpPlan.model_validate_json(response.text)
            return FollowUpPlan(needs_followup=False, topic="", context_summary="", suggested_delay_hours=0, email_draft="")

        except Exception as e:
            print(f"Analysis Error: {e}")
            return FollowUpPlan(needs_followup=False, topic="Error", context_summary=str(e), suggested_delay_hours=0, email_draft="")

    def generate_title(self, history: List[Dict[str, str]]) -> str:
        """
        Generates a short, relevant title for the chat session.
        """
        transcript = "\n".join([f"{msg.get('role', 'unknown').upper()}: {msg.get('text', '')}" for msg in history])
        
        prompt = f"""
        Generate a short, concise title (3-5 words) for this chat session.
        Do not use quotes. Just the title.
        
        Transcript:
        {transcript}
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="text/plain",
                )
            )
            return response.text.strip() if response.text else "New Chat"
        except Exception as e:
            print(f"Title Generation Error: {e}")
            return "New Chat"
