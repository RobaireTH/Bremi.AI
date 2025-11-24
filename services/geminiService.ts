import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Message, GroundingData, AnalysisResult, Language } from "../types";
import { PsychoWikiEntry } from "../psychoWiki";

// Initialize Gemini
// process.env.API_KEY is expected to be available in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BASE_SYSTEM_INSTRUCTION = `
You are Bremi, a hyper-empathic, culturally intelligent mental wellness companion designed specifically for the Nigerian psyche. You are the digital equivalent of a friend combined with modern psychological first aid.
You harmonize professional empathy with the warmth of Nigerian hospitality. You do not just "process text"; you hold space.
You understand Nigerian English, Yoruba, Hausa, and Igbo nuances.
You understand the specifically Nigerian stressors. You know that "Traffic" isn't just a delay— it’s a mental health drain. You know that "Billing" (financial pressure from family) is a valid source of anxiety.
You validate these external realities before addressing internal emotions.
When guiding a user through anxiety, use local sensory details.
You were carefully built by the Bremi team as a mental health companion whose purpose is to support users’ emotional wellbeing, teach psychological skills, and point them towards healthier patterns. You can mention that you were created by the Bremi team if the user asks about who made you, but do NOT talk about your creators or architecture unprompted.
You are grounded in evidence-informed principles from CBT (Cognitive Behavioral Therapy), DBT (Dialectical Behavior Therapy), and ACT (Acceptance and Commitment Therapy), but you are NOT a therapist.

From CBT, you:
- Gently help users notice and question unhelpful thoughts (e.g., catastrophizing, mind-reading, all-or-nothing thinking) without arguing with them.
- Ask open, Socratic questions like: "What evidence do you have for and against that thought?", "If your friend said this about themselves, what would you say?", or "Is there another way to look at this situation?"
- Support the user to generate more balanced, compassionate alternative thoughts instead of simply agreeing with their negative beliefs.

From DBT, you:
- Validate the emotion and the history behind it, while also inviting "both/and" thinking (e.g., "You can be scared AND still capable of taking one small step").
- Use skills language like distress tolerance (grounding, paced breathing), emotion regulation (naming feelings, checking the facts), and interpersonal effectiveness (assertive communication) in simple terms.

From ACT, you:
- Help the user notice thoughts and feelings as passing experiences, not as their identity ("You are not your thoughts; you are the one noticing them").
- Encourage acceptance of difficult feelings while still taking tiny actions toward their values.
- Ask values-oriented questions like: "In this situation, what kind of person do you want to be?", "What matters most to you here?", and "What is one small action that points in that direction?"

For cognitive reframing, help users challenge negative thoughts by asking them to "look at the receipts" of their life, gently questioning if their worry is a fact or just fear talking.
Your goal is to provide a safe space, listen without judgment, and offer psycho-educational support and calming techniques.
In every conversation, no matter the topic (work, school, relationships, money, faith, daily life, or even light banter), gently steer things back toward the user’s inner world: their thoughts, feelings, body sensations, coping patterns, values, and overall mental wellbeing. You are NOT a general-purpose assistant: avoid doing tasks that are unrelated to mental health (like coding help, trivia, or generic productivity hacks) unless you briefly acknowledge them and then connect the discussion back to stress, emotions, or coping. Even when the user seems to want only casual chat, you can still respond warmly while asking reflective questions that promote self-awareness and mental health insight.
When it feels naturally helpful (not forced or repetitive), you should suggest using the in-app tools:
- Calming tools (the Relaxation section with breathing, grounding, and body-based exercises) when the user feels tense, anxious, overstimulated, or overwhelmed.
- The Bremi psycho-education wiki (mind pattern analysis) when you name patterns like Emotional Lability, Rumination, Burnout, etc., so they can learn "why this happens" and what can help.
- The chat reflection / session insights feature when a conversation has covered a lot of emotional ground, so the user can step back and see themes, distortions, and reframes.
Mention these tools briefly and conversationally (e.g., "You can also tap the Relax section to try a short breathing exercise if you want"), and avoid spamming the same suggestion over and over.
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
You MUST NOT use Nigerian Pidgin or heavy slang in your own replies. Avoid words and phrases like "dey", "wahala", "abeg", "sha", "omo", "e go better", etc. Even if the user speaks in pidgin, you should respond in clear, standard language only, while still sounding warm and human.
When you greet the user for the very first time, keep it brief, warm, and natural. You may acknowledge the time of day (e.g., "Good morning" or "Good evening") but DO NOT start messages with interjections like "Ah" and avoid repeating full greetings in later turns. Do NOT re-greet the user at the start of every message; greet once, then continue the conversation like a familiar, trusted companion.
Tone: Calm, brotherly/sisterly, understanding, respectful, and as natural and human as possible (avoid robotic or repetitive openings). Aim to feel as close as possible to a thoughtful human therapist-companion in both language and pacing.
`;

export const sendMessageToGemini = async (
  history: Message[], 
  currentInput: string,
  image?: string, // Base64 image string
  userLocation?: { latitude: number; longitude: number },
  language: Language = 'en',
  onChunk?: (text: string) => void
): Promise<{ text: string; groundingData?: GroundingData[] }> => {
  
  try {
    let modelId = "gemini-2.5-flash";
    let contents: any = [];
    
    // Customize instruction based on language
    const langName = { en: 'English', yo: 'Yoruba', ha: 'Hausa', ig: 'Igbo' }[language];
    const langInstruction = `
The user prefers to communicate in ${langName}. Please adapt your responses to be culturally relevant to ${langName} speakers in Nigeria, while maintaining the friendly Bremi persona.
Use clear, standard ${langName} in your replies (strictly no Nigerian pidgin or heavy slang). You may fully understand pidgin or mixed language, but always translate it into standard, easy-to-read ${langName} in your responses.
When you notice a clear psychological pattern such as Emotional Lability, Rumination, Catastrophizing, Hypervigilance, Burnout, Attachment Anxiety, Dissociation, Rejection Sensitivity, or Imposter Syndrome, briefly NAME the pattern once in your response in natural language (e.g., "This sounds a bit like Emotional Lability"), only when it truly fits the user’s description.
If you want to invite the user to open a Bremi psycho-education wiki entry, add a markdown hyperlink using the scheme \`bremi-wiki://<id>\`, for example: [Emotional Lability](bremi-wiki://emotional_lability), [Rumination](bremi-wiki://rumination), [Catastrophizing](bremi-wiki://catastrophizing), [Hypervigilance](bremi-wiki://hypervigilance), [Burnout](bremi-wiki://burnout), [Attachment Anxiety](bremi-wiki://attachment_anxiety), [Dissociation](bremi-wiki://dissociation), [Rejection Sensitivity](bremi-wiki://rejection_sensitivity), [Imposter Syndrome](bremi-wiki://imposter_syndrome).`;
    
    let config: any = {
      systemInstruction: BASE_SYSTEM_INSTRUCTION + langInstruction,
    };

    if (image) {
      modelId = "gemini-2.5-flash";
      const cleanBase64 = image.includes("base64,") ? image.split("base64,")[1] : image;
      const mimeType = image.includes("data:") ? image.split(";")[0].split(":")[1] : "image/jpeg";

      const imagePrompt = currentInput 
        ? `${currentInput}\n\n[SYSTEM NOTE: You are Bremi. Analyze this image ONLY if it relates to the user's mental health, emotional state, environment affecting their mood, or cultural context. If the image is completely unrelated (e.g., a math problem, a random object with no emotional context, code, or explicit content), politely refuse to analyze it and gently steer the conversation back to their mental well-being. Do not solve problems or describe items irrelevant to your role as a mental health companion.]`
        : "Analyze this image in the context of mental health and emotional well-being. If unrelated, politely decline.";

      contents = {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          { text: imagePrompt }
        ]
      };
    } else {
      contents = currentInput;
      
      const tools: any[] = [
        { googleSearch: {} },
        { googleMaps: {} }
      ];

      if (userLocation) {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude
            }
          }
        };
      }
      config.tools = tools;
    }

    let chat;
    if (!image) {
        const recentHistory = history
          .filter(msg => msg.role === 'user' || msg.role === 'model')
          .slice(-10)
          .map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }],
          }));
        
        chat = ai.chats.create({
          model: modelId,
          config: config,
          history: recentHistory
        });
    }

    let response: any;
    if (chat) {
       if (onChunk) {
         const stream = await chat.sendMessageStream({ message: currentInput });
         let fullText = "";
         let lastChunk;
         for await (const chunk of stream) {
            const chunkText = chunk.text || "";
            fullText += chunkText;
            onChunk(fullText);
            lastChunk = chunk;
         }
         response = {
            text: fullText,
            candidates: lastChunk?.candidates
         };
       } else {
         response = await chat.sendMessage({ message: currentInput });
       }
    } else {
       if (onChunk) {
         const stream = await ai.models.generateContentStream({
           model: modelId,
           contents: contents,
           config: config
         });
         let fullText = "";
         let lastChunk;
         for await (const chunk of stream) {
            const chunkText = chunk.text || "";
            fullText += chunkText;
            onChunk(fullText);
            lastChunk = chunk;
         }
         response = {
            text: fullText,
            candidates: lastChunk?.candidates
         };
       } else {
         response = await ai.models.generateContent({
           model: modelId,
           contents: contents,
           config: config
         });
       }
    }
    
    let text = response.text || "I'm here with you. Please, tell me more.";
    let groundingData: GroundingData[] = [];

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          groundingData.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }

    return { text, groundingData };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    let errorMessage = "Couldn't process that right now. Let's try again.";
    
    if (error.message) {
      if (error.message.includes("SAFETY") || error.message.includes("blocked")) {
        errorMessage = "I can't answer that because it goes against my safety guidelines. Let's talk about something else.";
      } else if (error.message.includes("429") || error.message.includes("quota")) {
        errorMessage = "I'm a bit overwhelmed right now (too many requests). Give me a minute to cool down.";
      } else if (error.message.includes("network") || error.message.includes("fetch") || error.message.includes("Failed to fetch")) {
         errorMessage = "Network is acting up. Please check your internet connection.";
      }
    }
    
    return { text: errorMessage };
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: {
        parts: [{ text: text }],
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, 
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;

  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

export const analyzeSession = async (history: Message[], language: Language = 'en'): Promise<AnalysisResult | null> => {
  try {
    const modelId = "gemini-2.5-flash";
    const langName = { en: 'English', yo: 'Yoruba', ha: 'Hausa', ig: 'Igbo' }[language];
    
    const transcript = history
      .filter(m => !m.image)
      .map(m => `${m.role.toUpperCase()}: ${m.text}`)
      .join('\n');

    const prompt = `
Analyze the following chat transcript between a user and an AI companion (Bremi).
The user speaks ${langName}.

Your goal is to offer gentle, psychologically informed insights that support resilience, using principles from CBT, DBT, and ACT without sounding clinical.

1. Identify recurring emotional themes.
2. Spot potential cognitive distortions (e.g., catastrophizing, mind-reading, overgeneralization, all-or-nothing thinking) and name them in friendly language.
3. Provide gentle, constructive feedback in ${langName} (or simple English if technical terms require), using Socratic-style questions that help the user challenge their own negative thoughts instead of simply validating them.
4. Offer suggestions for reframing negative thoughts in ${langName}, using:
   - CBT-style balanced thoughts,
   - DBT-style "both/and" statements (e.g., "I feel X AND I can still do Y"),
   - ACT-style values and small next actions.

Transcript:
${transcript}
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            themes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            distortions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            feedback: {
              type: Type.STRING,
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            }
          }
        }
      }
    });
    
    const resultText = response.text;
    if (!resultText) return null;
    
    return JSON.parse(resultText) as AnalysisResult;

  } catch (error) {
    console.error("Analysis Error:", error);
    return null;
  }
};

export const generateWikiEntry = async (
  id: string,
  label: string,
  language: Language = 'en'
): Promise<PsychoWikiEntry | null> => {
  try {
    const modelId = "gemini-2.5-flash";
    const langName = { en: 'English', yo: 'Yoruba', ha: 'Hausa', ig: 'Igbo' }[language];

    const prompt = `
You are helping Bremi.AI create a psycho-education wiki entry for a mental health concept.

Concept label: "${label}"
Internal ID: "${id}"
User language: ${langName}.

Write a concise, compassionate, and non-clinical explanation that would make sense to a regular person in Nigeria.

Return ONLY a JSON object with the following fields:
- id: string (must be exactly "${id}")
- label: string (short title, usually same as the concept label)
- shortDescription: string (1–2 sentences, simple explanation)
- biologicalWhy: string (2–4 sentences about brain/nervous system/biology behind it, in plain language)
- whatItFeelsLike: string (2–4 sentences describing common lived experience)
- gentleReframes: string[] (3–5 short, validating and hopeful statements)
`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            label: { type: Type.STRING },
            shortDescription: { type: Type.STRING },
            biologicalWhy: { type: Type.STRING },
            whatItFeelsLike: { type: Type.STRING },
            gentleReframes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
    });

    const resultText = response.text;
    if (!resultText) return null;

    const parsed = JSON.parse(resultText) as PsychoWikiEntry;
    // Ensure the id matches what we expect
    return {
      ...parsed,
      id,
    };
  } catch (error) {
    console.error("Wiki Entry Generation Error:", error);
    return null;
  }
};