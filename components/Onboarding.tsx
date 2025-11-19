import React, { useState } from 'react';
import { UserProfile, Language } from '../types';
import { Icons, SUPPORTED_LANGUAGES, TRANSLATIONS } from '../constants';

interface OnboardingProps {
  onLogin: (user: UserProfile) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onLogin }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');

  const t = TRANSLATIONS[selectedLanguage];

  const handleGoogleLogin = () => {
    setIsAnimating(true);
    // Simulate API call
    setTimeout(() => {
      const mockUser: UserProfile = {
        id: 'user-' + Date.now(),
        name: 'Naija Padi',
        email: 'user@example.com',
        language: selectedLanguage,
        preferences: { saveHistory: false }
      };
      onLogin(mockUser);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-green-50 to-green-100 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

      <div className="z-10 text-center max-w-md w-full">
        <div className="mb-8 flex justify-center">
          <div className="bg-white p-4 rounded-2xl shadow-lg rotate-3">
            <Icons.Chat className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-slate-800 mb-2">Bremi.AI</h1>
        <p className="text-lg text-slate-600 mb-8">
          {t.subtitle}
        </p>

        <div className="space-y-4 w-full">
          
          {/* Language Selection */}
          <div className="flex justify-center space-x-2 mb-6">
            {SUPPORTED_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  selectedLanguage === lang.code 
                    ? 'bg-green-600 text-white border-green-600' 
                    : 'bg-white text-slate-600 border-gray-200 hover:bg-green-50'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={isAnimating}
            className="w-full bg-white hover:bg-gray-50 text-slate-700 font-medium py-3 px-4 rounded-xl shadow-md border border-gray-200 flex items-center justify-center transition-all transform active:scale-95"
          >
            {isAnimating ? (
              <span className="animate-pulse">Signing in...</span>
            ) : (
              <>
                <Icons.Google className="mr-3" />
                {t.signin}
              </>
            )}
          </button>
          
          <div className="text-xs text-center text-slate-400 mt-4 px-4">
            By signing up, you agree that this is an AI companion, not a replacement for professional medical help.
          </div>
        </div>
      </div>
    </div>
  );
};