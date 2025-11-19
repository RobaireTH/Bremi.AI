
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
        className={`relative flex flex-col items-center justify-center transition-all duration-300 min-w-[60px] ${isSelected ? '-translate-y-4' : ''}`}
      >
        <div 
          className={`
            w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm
            ${isSelected 
              ? 'bg-green-600 text-white shadow-lg scale-110 ring-4 ring-green-50' 
              : 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-gray-50'}
          `}
        >
          <Icon className={`w-6 h-6 transition-transform duration-300 ${isSelected ? 'scale-110' : ''}`} />
        </div>
        
        <span 
          className={`
            absolute -bottom-5 text-[10px] font-bold transition-all duration-300 whitespace-nowrap
            ${isSelected ? 'opacity-100 text-green-700 translate-y-0' : 'opacity-0 translate-y-[-5px]'}
          `}
        >
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="h-[80px] bg-white border-t border-gray-200 flex justify-around items-center px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 pb-safe pt-2">
      <NavItem view="chat" icon={Icons.Chat} label={t.chat} />
      <NavItem view="history" icon={Icons.Clock} label={t.history} />
      <NavItem view="relaxation" icon={Icons.Flower} label={t.relax} />
      <NavItem view="settings" icon={Icons.User} label={t.profile} />
    </div>
  );
};
