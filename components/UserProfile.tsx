
import React, { useState, useEffect } from 'react';
import { UserProfile as UserProfileType, Language, AppView } from '../types';
import { Icons, SUPPORTED_LANGUAGES, TRANSLATIONS } from '../constants';

interface UserProfileProps {
  user: UserProfileType;
  onUpdate: (user: UserProfileType) => void;
  onLogout: () => void;
  onNavigate: (view: AppView) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate, onLogout, onNavigate }) => {
  const t = TRANSLATIONS[user.language];
  const [language, setLanguage] = useState<Language>(user.language);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setLanguage(user.language);
  }, [user]);

  const handleSave = () => {
    const updatedUser = { ...user, language };
    onUpdate(updatedUser);
    setIsSaved(true);
    
    // Reset saved status after 2 seconds
    setTimeout(() => {
        setIsSaved(false);
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col bg-green-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md p-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-center">
          <h2 className="font-semibold text-slate-800 text-lg">{t.your_profile}</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex flex-col items-center">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-inner">
             {user.name.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-xl font-bold text-slate-800">{user.name}</h3>
          <p className="text-slate-500 text-sm">{user.email || 'No email connected'}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
            {/* Read only Name Field */}
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    {t.name_label}
                </label>
                <div className="w-full p-3 bg-gray-100 rounded-xl text-gray-500 border border-transparent">
                    {user.name}
                </div>
            </div>

            {/* Language Selector */}
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    {t.lang_label}
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => setLanguage(lang.code)}
                            className={`p-3 rounded-xl text-sm font-medium border transition-all ${
                                language === lang.code
                                    ? 'bg-green-600 text-white border-green-600 shadow-md'
                                    : 'bg-white text-slate-600 border-gray-200 hover:border-green-400'
                            }`}
                        >
                            {lang.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={language === user.language}
                className={`w-full py-3.5 rounded-xl font-medium flex items-center justify-center transition-all shadow-md ${
                     isSaved 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : language === user.language
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-slate-800 text-white hover:bg-slate-900'
                }`}
            >
                {isSaved ? (
                    <>
                        <Icons.CheckCircle className="w-5 h-5 mr-2" />
                        {t.saved}
                    </>
                ) : (
                    t.save_changes
                )}
            </button>

            {/* WhatsApp Continue Button */}
            <div className="pt-4 border-t border-gray-100">
              <button 
                 onClick={() => onNavigate('whatsapp-coming-soon')}
                 className="w-full py-3 bg-green-50 hover:bg-green-100 text-green-700 font-medium rounded-xl flex items-center justify-center transition-colors"
              >
                <Icons.WhatsApp className="w-5 h-5 mr-2" />
                {t.continue_whatsapp}
              </button>
            </div>
        </div>

        <div className="mt-6">
             <button 
                onClick={onLogout}
                className="w-full py-3 text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors"
             >
                 {t.logout}
             </button>
        </div>
      </div>
    </div>
  );
};
