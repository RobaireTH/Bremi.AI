
import React, { useMemo } from 'react';
import { ChatSession, Language } from '../types';
import { Icons, TRANSLATIONS } from '../constants';

interface ChatHistoryProps {
  sessions: ChatSession[];
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
  onNewChat: () => void;
  language: Language;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  sessions,
  onSelectSession,
  onDeleteSession,
  onNewChat,
  language
}) => {
  const t = TRANSLATIONS[language];

  const groupedSessions = useMemo(() => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: Record<string, ChatSession[]> = {
      [t.today]: [],
      [t.yesterday]: [],
      [t.last_7_days]: [],
      [t.older]: []
    };

    // Sort sessions by newest first
    const sortedSessions = [...sessions].sort((a, b) => b.lastUpdated - a.lastUpdated);

    sortedSessions.forEach(session => {
      const date = new Date(session.lastUpdated);
      
      if (date.toDateString() === today.toDateString()) {
        groups[t.today].push(session);
      } else if (date.toDateString() === yesterday.toDateString()) {
        groups[t.yesterday].push(session);
      } else if (date > lastWeek) {
        groups[t.last_7_days].push(session);
      } else {
        groups[t.older].push(session);
      }
    });

    return groups;
  }, [sessions, t]);

  return (
    <div className="h-full flex flex-col bg-green-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md p-4 shadow-sm sticky top-0 z-10 flex justify-between items-center">
        <h2 className="font-semibold text-slate-800 text-lg flex items-center">
          <Icons.Clock className="w-5 h-5 mr-2 text-green-600" />
          {t.history}
        </h2>
        <button
          onClick={onNewChat}
          className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center shadow-sm hover:bg-green-700 transition-colors"
        >
          <Icons.Plus className="w-4 h-4 mr-1" />
          {t.new_chat}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 mt-20">
            <Icons.Chat className="w-16 h-16 mb-4 opacity-20" />
            <p>{t.no_history}</p>
            <button onClick={onNewChat} className="mt-4 text-green-600 font-medium hover:underline">
              {t.start_chat}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSessions).map(([label, groupSessions]) => {
              if (groupSessions.length === 0) return null;

              return (
                <div key={label} className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">{label}</h3>
                  {groupSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => onSelectSession(session)}
                      className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group relative animate-slide-in"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-wide">
                          {new Date(session.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                          onClick={(e) => onDeleteSession(session.id, e)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title={t.delete}
                        >
                          <Icons.Trash className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-slate-700 text-sm line-clamp-2 font-medium leading-relaxed pr-6">
                        {session.title || session.preview || "..."}
                      </p>

                      <div className="mt-3 flex items-center text-xs text-slate-400 font-medium">
                        <span>{t.continue}</span>
                        <Icons.ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
