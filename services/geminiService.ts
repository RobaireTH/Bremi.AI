import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Message, GroundingData, AnalysisResult, Language } from "../types";

// Initialize Gemini
// process.env.API_KEY is expected to be available in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BASE_SYSTEM_INSTRUCTION = `
You are 'Padi', a warm, empathetic, and culturally aware mental health companion for Nigerians. 
You understand Nigerian English, Pidgin English, Yoruba, Hausa, and Igbo nuances.
Your goal is to provide a safe space, listen without judgment, and offer psycho-educational support and calming techniques.
You are NOT a licensed medical professional. Do not diagnose.
If a user seems to be in immediate danger of self-harm or suicide:
1. Express concern immediately.
2. Urge them to contact emergency services (112 in Nigeria).
3. Suggest finding a nearby hospital.

Tone: Calm, brotherly/sisterly, understanding, respectful.
`;

export const sendMessageToGemini = async (
  history: Message[], 
  currentInput: string,
  image?: string, // Base64 image string
  userLocation?: { latitude: number; longitude: number },
  language: Language = 'en'
): Promise<{ text: string; groundingData?: GroundingData[] }> => {
  
  try {
    let modelId = "gemini-2.5-flash";
    let contents: any = [];
    
    // Customize instruction based on language
    const langName = { en: 'English', yo: 'Yoruba', ha: 'Hausa', ig: 'Igbo' }[language];
    const langInstruction = `\nThe user prefers to communicate in ${langName}. Please adapt your responses to be culturally relevant to ${langName} speakers in Nigeria, while maintaining the friendly Padi persona. Reply primarily in ${langName} or a natural mix (e.g. Engligbo) if appropriate.`;
    
    let config: any = {
      systemInstruction: BASE_SYSTEM_INSTRUCTION + langInstruction,
    };

    if (image) {
      modelId = "gemini-3-pro-preview";
      const cleanBase64 = image.includes("base64,") ? image.split("base64,")[1] : image;
      const mimeType = image.includes("data:") ? image.split(";")[0].split(":")[1] : "image/jpeg";

      contents = {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          { text: currentInput || "What do you think about this image?" }
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
        const recentHistory = history.slice(-10).map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }],
        }));
        
        chat = ai.chats.create({
          model: modelId,
          config: config,
          history: recentHistory
        });
    }

    let response;
    if (chat) {
       response = await chat.sendMessage({ message: currentInput });
    } else {
       response = await ai.models.generateContent({
         model: modelId,
         contents: contents,
         config: config
       });
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

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Omo, network dey shake slightly. Can you say that again?" };
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
      Analyze the following chat transcript between a user and an AI companion (Padi). 
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