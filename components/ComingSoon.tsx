
import React from 'react';
import { Icons, TRANSLATIONS } from '../constants';
import { AppView, Language } from '../types';

interface ComingSoonProps {
  onNavigate: (view: AppView) => void;
  language: Language;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ onNavigate, language }) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="h-full flex flex-col items-center justify-center bg-green-50 p-6 relative overflow-hidden text-center">
      
      {/* Background Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>

      <div className="z-10 flex flex-col items-center max-w-md w-full">
        <div className="mb-8 relative">
           <div className="absolute inset-0 bg-green-400 rounded-full opacity-20 animate-ping"></div>
           <div className="bg-white p-6 rounded-full shadow-xl relative z-10">
             <Icons.WhatsApp className="w-16 h-16 text-green-600" />
           </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-800 mb-3">{t.coming_soon_title}</h1>
        <p className="text-slate-600 mb-10 leading-relaxed">
          {t.coming_soon_desc}
        </p>

        <button 
          onClick={() => onNavigate('settings')}
          className="flex items-center bg-white text-slate-700 px-6 py-3 rounded-xl shadow-md hover:bg-gray-50 transition-all font-medium border border-gray-100"
        >
          <Icons.ArrowLeft className="w-5 h-5 mr-2" />
          {t.go_back}
        </button>
      </div>
    </div>
  );
};
