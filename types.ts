
export type AppView = 'onboarding' | 'chat' | 'relaxation' | 'settings' | 'history' | 'whatsapp-coming-soon';
export type Language = 'en' | 'yo' | 'ha' | 'ig';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  language: Language;
  preferences: {
    saveHistory: boolean;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  isEmergency?: boolean;
  groundingData?: GroundingData[];
  image?: string; // Base64 string for image inputs
  feedback?: 'up' | 'down';
}

export interface GroundingData {
  title: string;
  uri: string;
  address?: string;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  lastUpdated: number;
  preview: string;
  title?: string;
}

export interface AnalysisResult {
  themes: string[];
  distortions: string[];
  feedback: string;
  suggestions: string[];
}
