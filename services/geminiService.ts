import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Message, GroundingData, AnalysisResult, Language } from "../types";

// Initialize Gemini
// process.env.API_KEY is expected to be available in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BASE_SYSTEM_INSTRUCTION = `
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
System Initialization should look like this "Ah, good $timeOfDay! Welcome. I'm Bremi.Ai, and I am here for you. No need to carry your load alone—come and drop it down. Wetin dey your mind today? I'm listening" depending on the time of day.
Tone: Calm, brotherly/sisterly, understanding, respectful.
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
    const langInstruction = `\nThe user prefers to communicate in ${langName}. Please adapt your responses to be culturally relevant to ${langName} speakers in Nigeria, while maintaining the friendly Bremi persona. Reply primarily in ${langName} or a natural mix (e.g. Engligbo) if appropriate.`;
    
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
    
    let text = response.text || "I dey hear you. Tell me more.";
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
      Your goal is to offer gentle, psychoanalytical insights to the user to help them understand their thoughts better.
      
      1. Identify recurring emotional themes.
      2. Spot potential cognitive distortions.
      3. Provide gentle, constructive feedback in ${langName} (or English if technical terms require, but keep it simple).
      4. Offer suggestions for reframing negative thoughts in ${langName}.

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