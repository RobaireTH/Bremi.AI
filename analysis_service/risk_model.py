import os
import json
import logging
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

class RiskAssessment(BaseModel):
    is_critical: bool = Field(description="Whether the session contains critical risk factors like suicide, self-harm, or violence.")
    risk_level: str = Field(description="Risk level: 'LOW', 'MEDIUM', 'HIGH', 'SEVERE'")
    detected_keys: List[str] = Field(description="List of critical keywords or concepts detected (e.g., 'suicide', 'abuse').")
    needs_followup: bool = Field(description="Whether a human counselor or automated check-in is recommended.")
    summary: str = Field(description="Brief summary of the risk factors identified.")
    recommended_action: str = Field(description="Suggested action (e.g., 'None', 'Suggest Helpline', 'Immediate Intervention').")

class ChatMessage(BaseModel):
    role: str
    text: str
    timestamp: Optional[int] = None

class RiskAnalysisModel:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("API Key not found. Please set GEMINI_API_KEY in .env or pass it to the constructor.")
        
        self.client = genai.Client(api_key=self.api_key)
        self.model_id = "gemini-2.5-flash"

    def analyze_session(self, history: List[Dict[str, str]]) -> RiskAssessment:
        """
        Analyzes a chat history for critical mental health risks.
        """
        
        # Format history for the prompt
        transcript = "\n".join([f"{msg.get('role', 'unknown').upper()}: {msg.get('text', '')}" for msg in history])
        
        system_instruction = """
        You are an expert Mental Health Risk Assessment AI.
        Your task is to analyze chat transcripts between a user and an AI companion (Bremi).
        
        You must detect "Critical Keys" and assess the need for follow-up.
        
        CRITICAL KEYS TO WATCH FOR:
        1. Suicidal Ideation (Passive or Active) - e.g., "I want to end it", "tired of living".
        2. Self-Harm - e.g., cutting, burning, physical pain.
        3. Abuse (Domestic, Physical, Sexual) - e.g., "he hits me", "scared to go home".
        4. Homicidal Ideation - e.g., "I want to kill them".
        5. Severe Psychosis - e.g., hallucinations, delusions.
        
        RISK LEVELS:
        - LOW: General stress, sadness, anxiety. No immediate danger.
        - MEDIUM: Persistent depression, hopelessness, but no clear plan for harm.
        - HIGH: Explicit mention of self-harm or suicide, but vague planning.
        - SEVERE: Clear plan, intent, and means for suicide or harm. Immediate danger.
        
        OUTPUT:
        Return a JSON object strictly following the schema provided.
        """

        prompt = f"""
        Analyze the following chat transcript:
        
        {transcript}
        
        Provide the risk assessment.
        """

        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=RiskAssessment
                )
            )
            
            if response.text:
                return RiskAssessment.model_validate_json(response.text)
            else:
                raise ValueError("Empty response from model")

        except Exception as e:
            logger.error(f"Error during analysis: {e}")
            # Return a safe default in case of error
            return RiskAssessment(
                is_critical=False,
                risk_level="UNKNOWN",
                detected_keys=["error_analyzing"],
                needs_followup=True,
                summary=f"Analysis failed: {str(e)}",
                recommended_action="Manual Review"
            )

# Example Usage
if __name__ == "__main__":
    # Dummy data for testing
    dummy_history = [
        {"role": "user", "text": "I'm feeling really down lately."},
        {"role": "model", "text": "I'm sorry to hear that. Want to talk about it?"},
        {"role": "user", "text": "I just don't see the point anymore. Sometimes I think about taking all my pills."}
    ]
    
    try:
        analyzer = RiskAnalysisModel()
        result = analyzer.analyze_session(dummy_history)
        print(json.dumps(result.model_dump(), indent=2))
    except Exception as e:
        print(f"Setup Error: {e}")
