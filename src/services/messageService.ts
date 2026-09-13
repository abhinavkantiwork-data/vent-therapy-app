import { API_BASE } from './authService';
import { loadToken } from '../utils/authStorage';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  userEmail: string;
  sessionId?: string;
}

export interface Session {
  id: string;
  userEmail: string;
  createdAt: string;
  lastActivity: string;
  title: string;
}

function authHeaders(contentType = false): HeadersInit {
  const token = loadToken();
  return {
    ...(contentType ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

type SerializedMessage = Omit<Message, 'timestamp'> & { timestamp: string };

// Session management functions
export const createSession = async (userEmail: string): Promise<Session> => {
  try {
    const response = await fetch(`${API_BASE}/api/sessions`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({ userEmail })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Failed to create session (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

export const fetchSessions = async (userEmail: string): Promise<Session[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/sessions?email=${encodeURIComponent(userEmail)}`, {
      headers: authHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch sessions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
};

export const fetchSessionMessages = async (sessionId: string): Promise<Message[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/messages`, {
      headers: authHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch session messages');
    }

    const messages = (await response.json()) as SerializedMessage[];
    return messages.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
  } catch (error) {
    console.error('Error fetching session messages:', error);
    return [];
  }
};

export const saveSessionMessage = async (
  sessionId: string,
  message: Omit<Message, 'id' | 'timestamp'>
): Promise<{ userMessage: Message; aiMessage: Message; currentMood?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({
        text: message.text
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save message');
    }

    const data = await response.json();
    window.dispatchEvent(new CustomEvent('vent:session-updated', { detail: { sessionId } }));
    return {
      userMessage: {
        ...data.userMessage,
        timestamp: new Date(data.userMessage.timestamp)
      },
      aiMessage: {
        ...data.aiMessage,
        timestamp: new Date(data.aiMessage.timestamp)
      },
      currentMood: data.currentMood ?? 'neutral',
    };
  } catch (error) {
    console.error('Error saving session message:', error);
    throw error;
  }
};

export const getSessionMood = async (sessionId: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/mood`, {
      headers: authHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch session mood');
    }

    const data = await response.json();
    return data.mood;
  } catch (error) {
    console.error('Error fetching session mood:', error);
    return 'neutral';
  }
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete session');
    }
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};

// Legacy functions for backward compatibility (deprecated)
export const saveMessage = (message: Message): void => {
  console.warn('saveMessage is deprecated. Use saveSessionMessage instead.');
  try {
    const existingMessagesJSON = localStorage.getItem(`messages_${message.userEmail}`);
    const existingMessages: Message[] = existingMessagesJSON 
      ? JSON.parse(existingMessagesJSON)
      : [];
    
    const messagesWithDateObjects = [
      ...existingMessages, 
      { 
        ...message, 
        timestamp: message.timestamp instanceof Date 
          ? message.timestamp.toISOString() 
          : message.timestamp 
      }
    ];
    
    localStorage.setItem(
      `messages_${message.userEmail}`, 
      JSON.stringify(messagesWithDateObjects)
    );
  } catch (error) {
    console.error('Error saving message:', error);
  }
};

export const fetchMessages = (userEmail: string): Promise<Message[]> => {
  console.warn('fetchMessages is deprecated. Use fetchSessionMessages instead.');
  return new Promise((resolve) => {
    try {
      const messagesJSON = localStorage.getItem(`messages_${userEmail}`);
      
      if (!messagesJSON) {
        resolve([]);
        return;
      }
      
      const messages: Message[] = (JSON.parse(messagesJSON) as SerializedMessage[]).map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      
      resolve(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      resolve([]);
    }
  });
};