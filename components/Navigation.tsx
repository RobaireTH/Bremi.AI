
import React from 'react';
import { Icons, TRANSLATIONS } from '../constants';
import { AppView, Language } from '../types';

interface NavigationProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onTriggerEmergency: () => void;
  language: Language;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onChangeView, onTriggerEmergency, language }) => {
  const t = TRANSLATIONS[language];

  const NavItem = ({ view, icon: Icon, label }: { view: AppView, icon: any, label: string }) => {
    const isSelected = currentView === view;
    
    return (
      <button 
        onClick={() => onChangeView(view)}
        className={`relative flex flex-col items-center justify-center transition-all duration-300 min-w-[60px] z-10 ${isSelected ? '-translate-y-6' : ''}`}
      >
        <div 
          className={`
            w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm
            ${isSelected 
              ? 'bg-green-600 text-white shadow-xl scale-100 ring-4 ring-white' 
              : 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-gray-50'}
          `}
        >
          <Icon className={`w-6 h-6 transition-transform duration-300 ${isSelected ? 'scale-110' : ''}`} />
        </div>
        
        <span 
          className={`
            absolute -bottom-6 text-[10px] font-bold transition-all duration-300 whitespace-nowrap
            ${isSelected ? 'opacity-100 text-green-700 translate-y-0' : 'opacity-0 translate-y-[-5px]'}
          `}
        >
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[80px] z-40 pb-safe">
      {/* Animated Background with Curve */}
      <div className="absolute inset-0 flex items-start pointer-events-none drop-shadow-[0_-4px_6px_rgba(0,0,0,0.05)]">
        <div 
          className="h-full bg-white transition-[width] duration-300 ease-in-out"
          style={{ 
            width: `calc(${
              currentView === 'chat' ? '12.5%' : 
              currentView === 'history' ? '37.5%' : 
              currentView === 'relaxation' ? '62.5%' : '87.5%'
            } - 48px)` 
          }}
        />
        <div className="w-24 h-full flex-shrink-0 bg-transparent relative">
           {/* The Curve SVG */}
           <svg className="w-full h-full fill-white" viewBox="0 0 96 80" preserveAspectRatio="none">
             <path d="M0,0 C15,0 20,35 48,35 C76,35 81,0 96,0 V80 H0 Z" />
           </svg>
        </div>
        <div className="h-full bg-white flex-1" />
      </div>

      {/* Navigation Items Container */}
      <div className="relative h-full flex justify-around items-center px-4 pt-2">
        <NavItem view="chat" icon={Icons.Chat} label={t.chat} />
        <NavItem view="history" icon={Icons.Clock} label={t.history} />
        <NavItem view="relaxation" icon={Icons.Flower} label={t.relax} />
        <NavItem view="settings" icon={Icons.User} label={t.profile} />
      </div>
    </div>
  );
};
