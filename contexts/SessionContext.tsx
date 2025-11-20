import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChatSession, Message } from '../types';

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

    useEffect(() => {
        const storedSessions = localStorage.getItem('bremiAI_sessions');
        if (storedSessions) {
            setSessions(JSON.parse(storedSessions));
        }
    }, []);

    const updateSession = (messages: Message[], save: boolean) => {
        if (!save || messages.length <= 1) return;

        const sessionId = activeSessionId || Date.now().toString();
        if (!activeSessionId) setActiveSessionId(sessionId);

        const preview = messages.filter(m => m.role === 'user').pop()?.text || "No message";

        const updatedSession: ChatSession = {
            id: sessionId,
            messages,
            lastUpdated: Date.now(),
            preview: preview.substring(0, 60)
        };

        setSessions(prev => {
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

    const selectSession = (sessionId: string) => {
        setActiveSessionId(sessionId);
    };

    const deleteSession = (sessionId: string) => {
        const newSessions = sessions.filter(s => s.id !== sessionId);
        setSessions(newSessions);
        localStorage.setItem('bremiAI_sessions', JSON.stringify(newSessions));
        if (activeSessionId === sessionId) {
            setActiveSessionId(null);
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
