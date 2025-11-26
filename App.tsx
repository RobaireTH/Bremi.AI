import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Onboarding } from './components/Onboarding';
import { ChatInterface } from './components/ChatInterface';
import { Relaxation } from './components/Relaxation';
import { Emergency } from './components/Emergency';
import { Navigation } from './components/Navigation';
import { UserProfile as UserProfileComponent } from './components/UserProfile';
import { ChatHistory } from './components/ChatHistory';
import { ComingSoon } from './components/ComingSoon';
import { AppView, UserProfile } from './types';
import { UserProvider, useUser } from './contexts/UserContext';
import { SessionProvider, useSession } from './contexts/SessionContext';
import { GuidedTour } from './components/GuidedTour';

function AppContent() {
  const { user, login, logout, updateUser } = useUser();
  const { sessions, selectSession, deleteSession, newChat } = useSession();

  const [currentView, setCurrentView] = useState<AppView>('onboarding');
  const [showEmergency, setShowEmergency] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Sync view with user state
  useEffect(() => {
    if (user) {
      if (currentView === 'onboarding') {
        setCurrentView('chat');
      }
      if (user.preferences?.hasSeenTour === false || user.preferences?.hasSeenTour === undefined) {
        setShowTour(true);
      }
    } else {
      setCurrentView('onboarding');
      setShowTour(false);
    }
  }, [user]);

  const handleLogin = (newUser: UserProfile) => {
    login(newUser);
  };

  const handleLogout = () => {
    logout();
    setCurrentView('onboarding');
  };

  const handleSelectSession = (session: any) => {
    selectSession(session.id);
    setCurrentView('chat');
  };

  const handleNewChat = () => {
    newChat();
    setCurrentView('chat');
  };

  const triggerEmergency = () => {
    setShowEmergency(true);
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
            onEmergency={triggerEmergency}
          />
        )}

        {currentView === 'history' && user && (
          <ChatHistory
            sessions={sessions}
            onSelectSession={handleSelectSession}
            onDeleteSession={deleteSession}
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
            onUpdate={updateUser}
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

      {/* Guided Tour Overlay */}
      {user && showTour && currentView !== 'onboarding' && !showEmergency && (
        <GuidedTour
          onFinish={() => {
            if (user) {
              const updated: UserProfile = {
                ...user,
                preferences: {
                  ...user.preferences,
                  hasSeenTour: true,
                },
              };
              updateUser(updated);
            }
            setShowTour(false);
          }}
          onStepChange={(index) => {
            // Map tour steps to underlying views so users "feel" the right background
            // Step 0: Welcome        -> Chat
            // Step 1: Chat Space     -> Chat
            // Step 2: Relax & Calm   -> Relaxation
            // Step 3: Wiki & Privacy -> Chat
            if (index === 2) {
              setCurrentView('relaxation');
            } else {
              setCurrentView('chat');
            }
          }}
        />
      )}

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

export default function App() {
  return (
    <GoogleOAuthProvider clientId="1030781750444-nrlbs7snd6giai42a6dalghf6tlpgmci.apps.googleusercontent.com">
      <UserProvider>
        <SessionProvider>
          <AppContent />
        </SessionProvider>
      </UserProvider>
    </GoogleOAuthProvider>
  );
}
