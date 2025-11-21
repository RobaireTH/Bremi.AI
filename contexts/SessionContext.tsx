
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChatSession, Message } from '../types';
import { syncChatHistory } from '../services/apiService';
import { useUser } from './UserContext';

interface SessionContextType {
    sessions: ChatSession[];
    activeSessionId: string | null;
    activeSession: ChatSession | undefined;
    updateSession: (messages: Message[], save: boolean) => void;
    selectSession: (sessionId: string) => void;
    deleteSession: (sessionId: string) => void;
    newChat: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const { user } = useUser();

    useEffect(() => {
        const storedSessions = localStorage.getItem('bremiAI_sessions');
        if (storedSessions) {
            setSessions(JSON.parse(storedSessions));
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('bremiAI_sessions', JSON.stringify(sessions));
        }
    }, [sessions, isLoaded]);

    const updateSession = async (messages: Message[], save: boolean) => {
        // 1. Empty Chat Prevention: Don't save if no user messages
        const hasUserMessage = messages.some(m => m.role === 'user');
        if (!save || !hasUserMessage) return;

        const sessionId = activeSessionId || Date.now().toString();
        if (!activeSessionId) setActiveSessionId(sessionId);

        const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.text || "No message";
        const preview = lastUserMessage.substring(0, 60);

        // Optimistic update
        setSessions(prev => {
            const exists = prev.find(s => s.id === sessionId);
            const updatedSession: ChatSession = {
                id: sessionId,
                messages,
                lastUpdated: Date.now(),
                preview,
                title: exists?.title // Keep existing title for now
            };

            if (exists) {
                return prev.map(s => s.id === sessionId ? updatedSession : s);
            } else {
                return [updatedSession, ...prev];
            }
        });

        // Sync with backend and get title
        if (user && user.id) {
            try {
                const result = await syncChatHistory(user.id, messages);

                // If backend suggests a title, update the session
                if (result && result.suggested_title) {
                    setSessions(prev => prev.map(s => {
                        if (s.id === sessionId) {
                            return { ...s, title: result.suggested_title };
                        }
                        return s;
                    }));
                }
            } catch (error) {
                console.error("Background sync failed:", error);
            }
        }
    };

    const selectSession = (sessionId: string) => {
        setActiveSessionId(sessionId);
    };

    const deleteSession = (sessionId: string) => {
        const newSessions = sessions.filter(s => s.id !== sessionId);
        setSessions(newSessions);
        localStorage.setItem('bremiAI_sessions', JSON.stringify(newSessions));
        
        // Graceful state handling:
        // If the deleted session was active, switch to the most recent session or start new chat
        if (activeSessionId === sessionId) {
            if (newSessions.length > 0) {
                 // Sort by lastUpdated to get the most recent one
                 const sorted = [...newSessions].sort((a, b) => b.lastUpdated - a.lastUpdated);
                 setActiveSessionId(sorted[0].id);
            } else {
                setActiveSessionId(null); // Reset to new chat state
            }
        }
    };

    const newChat = () => {
        setActiveSessionId(null);
    };

    const activeSession = sessions.find(s => s.id === activeSessionId);

    return (
        <SessionContext.Provider value={{
            sessions,
            activeSessionId,
            activeSession,
            updateSession,
            selectSession,
            deleteSession,
            newChat
        }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
};
