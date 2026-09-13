import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { API_BASE } from '../services/authService';
import { loadToken } from '../utils/authStorage';

interface Session {
  id: string;
  userEmail: string;
  createdAt: string;
  lastActivity: string;
  title: string;
}

interface ChatSidebarProps {
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  isOpen: boolean;
  onToggle: () => void;
  variant?: 'drawer' | 'docked';
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  currentSessionId,
  onSessionSelect,
  onNewSession,
  isOpen,
  onToggle,
  variant = 'drawer',
}) => {
  const isDocked = variant === 'docked';
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const loadSessions = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const token = loadToken();
      const response = await fetch(`${API_BASE}/api/sessions?email=${encodeURIComponent(user.email)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    const refresh = () => loadSessions();
    window.addEventListener('vent:session-updated', refresh);
    return () => window.removeEventListener('vent:session-updated', refresh);
  }, [loadSessions]);

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      const token = loadToken();
      const response = await fetch(`${API_BASE}/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      
      if (response.ok) {
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        // If we deleted the current session, start a new one
        if (currentSessionId === sessionId) {
          onNewSession();
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <>
      {/* Sidebar Toggle Button removed; now handled in header */}

      {/* Sidebar Overlay */}
      {!isDocked && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-80 bg-soft-white shadow-lg transform transition-transform duration-300 z-50 ${
          isDocked
            ? isOpen
              ? 'translate-x-0'
              : '-translate-x-full md:translate-x-0'
            : isOpen
              ? 'translate-x-0'
              : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-charcoal">Chat History</h2>
              <button
                onClick={onNewSession}
                className="p-2 bg-peach text-white rounded-lg hover:bg-peach-dark transition-colors"
                title="Start New Session"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-peach"></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No chat history yet</p>
                <p className="text-sm">Start your first session to begin</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      currentSessionId === session.id
                        ? 'bg-peach text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-charcoal'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex-1 min-w-0"
                        onClick={() => onSessionSelect(session.id)}
                      >
                        <h3 className="font-medium truncate">
                          {session.title}
                        </h3>
                        <p className={`text-xs mt-1 ${
                          currentSessionId === session.id ? 'text-white opacity-80' : 'text-gray-500'
                        }`}>
                          {formatDate(session.lastActivity)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className={`ml-2 p-1 rounded hover:bg-opacity-20 transition-colors ${
                          currentSessionId === session.id 
                            ? 'hover:bg-white text-white' 
                            : 'hover:bg-red-500 text-gray-400 hover:text-red-600'
                        }`}
                        title="Delete Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={onNewSession}
              className="w-full btn-primary flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatSidebar; 