
import React, { useState, useEffect } from 'react';
import { Onboarding } from './components/Onboarding';
import { ChatInterface } from './components/ChatInterface';
import { Relaxation } from './components/Relaxation';
import { Emergency } from './components/Emergency';
import { Navigation } from './components/Navigation';
import { UserProfile as UserProfileComponent } from './components/UserProfile';
import { ChatHistory } from './components/ChatHistory';
import { ComingSoon } from './components/ComingSoon';
import { UserProfile, AppView, ChatSession, Message } from './types';
import { TRANSLATIONS } from './constants';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('onboarding');
  const [showEmergency, setShowEmergency] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Load user and sessions from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('bremiAI_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setCurrentView('chat');
    }
    const storedSessions = localStorage.getItem('bremiAI_sessions');
    if (storedSessions) {
      setChatSessions(JSON.parse(storedSessions));
    }
  }, []);

  const handleLogin = (newUser: UserProfile) => {
    setUser(newUser);
    localStorage.setItem('bremiAI_user', JSON.stringify(newUser));
    setCurrentView('chat');
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('bremiAI_user', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    localStorage.removeItem('bremiAI_user');
    setUser(null);
    setCurrentView('onboarding');
  };

  const triggerEmergency = () => {
    setShowEmergency(true);
  };

  // Session Management
  const handleSessionUpdate = (messages: Message[], save: boolean) => {
    if (!save || messages.length <= 1) return; // Don't save empty chats (only welcome msg)

    // Determine session ID
    const sessionId = activeSessionId || Date.now().toString();
    if (!activeSessionId) setActiveSessionId(sessionId);

    const preview = messages.filter(m => m.role === 'user').pop()?.text || "No message";
    
    const updatedSession: ChatSession = {
      id: sessionId,
      messages,
      lastUpdated: Date.now(),
      preview: preview.substring(0, 60)
    };

    setChatSessions(prev => {
      const exists = prev.find(s => s.id === sessionId);
      let newSessions;
      if (exists) {
        newSessions = prev.map(s => s.id === sessionId ? updatedSession : s);
      } else {
        newSessions = [updatedSession, ...prev];
      }
      localStorage.setItem('bremiAI_sessions', JSON.stringify(newSessions));
      return newSessions;
    });
  };

  const handleSelectSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    setCurrentView('chat');
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this chat?")) {
      const newSessions = chatSessions.filter(s => s.id !== sessionId);
      setChatSessions(newSessions);
      localStorage.setItem('bremiAI_sessions', JSON.stringify(newSessions));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
      }
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setCurrentView('chat');
  };

  const getInitialMessages = () => {
    if (activeSessionId) {
      const session = chatSessions.find(s => s.id === activeSessionId);
      if (session) return session.messages;
    }
    // Default welcome message
    if (!user) return [];
    const t = TRANSLATIONS[user.language];
    return [{
      id: 'welcome',
      role: 'model' as const,
      text: t.welcome.replace('${user.name}', user.name),
      timestamp: Date.now()
    }];
  };

  return (
    <div className="h-screen w-full flex flex-col bg-green-50 text-slate-800 overflow-hidden relative font-sans">
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {currentView === 'onboarding' && (
          <Onboarding onLogin={handleLogin} />
        )}

        {currentView === 'chat' && user && (
          <ChatInterface 
            key={activeSessionId || 'new'} // Force remount on session change
            user={user} 
            initialMessages={getInitialMessages()}
            onEmergency={triggerEmergency}
            onSessionUpdate={handleSessionUpdate}
            sessionId={activeSessionId}
          />
        )}

        {currentView === 'history' && user && (
          <ChatHistory 
            sessions={chatSessions}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            onNewChat={handleNewChat}
            language={user.language}
          />
        )}

        {currentView === 'relaxation' && user && (
          <Relaxation language={user.language} />
        )}

        {currentView === 'settings' && user && (
          <UserProfileComponent 
            user={user} 
            onUpdate={handleUpdateUser}
            onLogout={handleLogout}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'whatsapp-coming-soon' && user && (
          <ComingSoon 
            language={user.language}
            onNavigate={setCurrentView}
          />
        )}
      </main>

      {/* Emergency Overlay Modal */}
      {showEmergency && user && (
        <div className="absolute inset-0 z-50 bg-white">
           <Emergency onClose={() => setShowEmergency(false)} language={user.language} />
        </div>
      )}

      {/* Navigation Bar - Only show if logged in and not in onboarding or fullscreen feature views */}
      {currentView !== 'onboarding' && !showEmergency && currentView !== 'whatsapp-coming-soon' && user && (
        <Navigation 
          currentView={currentView} 
          onChangeView={setCurrentView} 
          onTriggerEmergency={triggerEmergency}
          language={user.language}
        />
      )}
    </div>
  );
}
