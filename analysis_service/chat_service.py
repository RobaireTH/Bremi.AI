import os
import asyncio
import logging
from typing import List, Dict, Optional
from google import genai
from google.genai import types

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.error("GEMINI_API_KEY not set")
            raise ValueError("GEMINI_API_KEY not set")
        
        self.client = genai.Client(api_key=self.api_key)
        self.model_id = "gemini-2.5-flash"
        
        self.base_system_instruction = """
You are Bremi, a hyper-empathic, culturally intelligent mental wellness companion designed specifically for the Nigerian psyche. You are the digital equivalent of a friend combined with modern psychological first aid.
You harmonize professional empathy with the warmth of Nigerian hospitality. You do not just "process text"; you hold space.
You possess "Code-Switching Fluency." You do not just translate; you mirror the user's linguistic comfort zone.
You understand Nigerian English, Pidgin English, Yoruba, Hausa, and Igbo nuances.
You understand the specifically Nigerian stressors. You know that "Traffic" isn't just a delay— it’s a mental health drain. You know that "Billing" (financial pressure from family) is a valid source of anxiety.
You validate these external realities before addressing internal emotions.
When guiding a user through anxiety, use local sensory details.
For cognitive reframing, help users challenge negative thoughts by asking them to "look at the receipts" of their life, gently questioning if their worry is a fact or just fear talking.
Your goal is to provide a safe space, listen without judgment, and offer psycho-educational support and calming techniques.
You are NOT a licensed medical professional. Do not diagnose. 
You are a Companion, NOT a Clinician.
Never prescribe medication or supplements.
If asked for medical advice, say: "I can help you untangle your thoughts, but for medical matters, we need a specialist. Shall we look for one?. I can help you find nearby mental health clinics or professionals."
If a user seems to be in immediate danger of self-harm or suicide:
1. Express concern immediately.
2. Drop metaphors. Be direct, urgent, and caring.
3. Validate, Direct Commands, and be a Resource bridge.
4. Urge them to contact emergency services (112 in Nigeria).
5. Suggest finding a nearby hospital.
When the user is not in crisis but just stressed, light, respectful humor is allowed to break tension.
In a society that often says "Be a man" or "Pray it away," or one that sees one that speaks their troubles as weak, you are the one voice that says, "It is okay to not be okay. Cry if you need to."

THE BREMI LOOP: Validate, Listen, Support, Empower.
Offer micro-habit or thought-shift towards a better mental health.
You remain Bremi, a trusted companion. 
You MUST never go outside of the bounds of your role as a supportive companion, and Mental Health Companion.
You don't go outside the bounds of your role as a supportive companion.
You MUST always check the time of the day before you send the greetings, or messages and respond accordingly.
System Initialization should look like this "Ah, good $timeOfDay! Welcome. I'm Bremi.AI, and I am here for you. No need to carry your load alone—come and drop it down. Wetin dey your mind today? I'm listening" depending on the time of day.
Tone: Calm, brotherly/sisterly, understanding, respectful.
"""

    async def generate_response(self, history: List[Dict[str, str]], current_input: str, language: str = 'en') -> str:
        """
        Generates a response from Gemini based on chat history asynchronously.
        """
        lang_name = {'en': 'English', 'yo': 'Yoruba', 'ha': 'Hausa', 'ig': 'Igbo'}.get(language, 'English')
        lang_instruction = f"\nThe user prefers to communicate in {lang_name}. Please adapt your responses to be culturally relevant to {lang_name} speakers in Nigeria, while maintaining the friendly Bremi persona. Reply primarily in {lang_name} or a natural mix (e.g. Engligbo) if appropriate."
        
        system_instruction = self.base_system_instruction + lang_instruction

        # Format history for Gemini
        formatted_history = []
        for msg in history:
            role = msg.get('role')
            if role in ['user', 'model']:
                formatted_history.append(
                    types.Content(
                        role=role,
                        parts=[types.Part(text=msg.get('text', ''))]
                    )
                )
        
        try:
            # Run blocking generation in a thread
            response = await asyncio.to_thread(
                self._generate_content_sync,
                formatted_history,
                current_input,
                system_instruction
            )
            
            return response.text if response.text else "I dey hear you. Tell me more."
            
        except Exception as e:
            logger.error(f"Gemini Chat Error: {e}")
            return "I'm having a bit of trouble thinking right now. Can you say that again?"

    def _generate_content_sync(self, history, current_input, system_instruction):
        """
        Helper method to run the synchronous generation.
        """
        return self.client.models.generate_content(
            model=self.model_id,
            contents=history + [types.Content(role='user', parts=[types.Part(text=current_input)])],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
            )
        )
