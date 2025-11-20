import { Message } from '../types';

const API_BASE_URL = 'http://localhost:8000';

export const syncChatHistory = async (userId: string, messages: Message[]) => {
    try {
        // Convert messages to the format expected by the backend
        const history = messages.map(msg => ({
            role: msg.role,
            text: msg.text
        }));

        const response = await fetch(`${API_BASE_URL}/sync-chat?user_id=${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(history),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Chat Sync Result:", data);
        return data;

    } catch (error) {
        console.error("Failed to sync chat history:", error);
        // We don't want to break the UI if the background analysis fails
        return null;
    }
};
