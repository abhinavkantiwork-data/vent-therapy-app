import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, LogOut, MessageSquare, Mic } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import ChatSidebar from '../components/ChatSidebar';
import { createSession } from '../services/messageService';
import { fetchVoices, type ElevenVoice } from '../services/voiceService';
import {
  loadAssistantPrefs,
  saveAssistantPrefs,
  setSessionMode,
} from '../utils/assistantPrefs';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState(loadAssistantPrefs);
  const [voices, setVoices] = useState<ElevenVoice[]>([]);
  const [starting, setStarting] = useState<'text' | 'voice' | null>(null);
  const [voiceError, setVoiceError] = useState('');

  useEffect(() => {
    fetchVoices()
      .then(setVoices)
      .catch(() => setVoiceError('Could not load voices. Add ELEVENLABS_API_KEY on the server.'));
  }, []);

  useEffect(() => {
    saveAssistantPrefs(prefs);
  }, [prefs]);

  const startConversation = async (mode: 'text' | 'voice') => {
    if (!user) return;
    setStarting(mode);
    try {
      const session = await createSession(user.email);
      setSessionMode(session.id, mode);
      navigate(`/chat/${session.id}`, { state: { mode } });
    } catch (e) {
      console.error(e);
    } finally {
      setStarting(null);
    }
  };

  return (
    <div className="holographic-bg min-h-screen flex">
      <ChatSidebar
        variant="docked"
        currentSessionId={null}
        onSessionSelect={(id) => navigate(`/chat/${id}`)}
        onNewSession={() => startConversation('text')}
        isOpen
        onToggle={() => undefined}
      />

      <div className="flex-1 flex flex-col min-h-screen md:ml-80">
        <header className="glass-effect p-4 flex justify-between items-center">
          <h1 className="text-charcoal text-xl font-semibold">
            VENT<span className="text-peach">0.01</span>
          </h1>
          <div className="flex items-center gap-3">
            {user && <span className="text-sm text-charcoal opacity-70 hidden sm:inline">{user.email}</span>}
            <button
              onClick={() => logout().then(() => navigate('/login'))}
              className="p-2 rounded-lg hover:bg-white/20 transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-charcoal" />
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full glass-effect p-8 text-center animate-fadeIn">
            <div className="relative mx-auto w-28 h-28 mb-6">
              <div className="absolute inset-0 rounded-full bg-peach/40 animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-white/80 flex items-center justify-center shadow-lg ai-orb">
                <Bot className="w-14 h-14 text-muted-navy" />
              </div>
            </div>

            <label className="block text-left text-sm font-medium text-charcoal mb-1">Name your AI companion</label>
            <input
              className="form-input mb-4"
              value={prefs.name}
              onChange={(e) => setPrefs((p) => ({ ...p, name: e.target.value.slice(0, 32) }))}
              placeholder="e.g. Vent, Luna, Sage..."
            />

            <label className="block text-left text-sm font-medium text-charcoal mb-1">AI voice</label>
            <select
              className="form-select w-full mb-2 text-charcoal"
              value={prefs.voiceId}
              onChange={(e) => setPrefs((p) => ({ ...p, voiceId: e.target.value }))}
            >
              {voices.length === 0 ? (
                <option value={prefs.voiceId}>Default voice</option>
              ) : (
                voices.map((v) => (
                  <option key={v.voice_id} value={v.voice_id}>
                    {v.name}
                    {v.labels?.accent ? ` (${v.labels.accent})` : ''}
                  </option>
                ))
              )}
            </select>
            {voiceError && <p className="text-xs text-amber-800 mb-4 text-left">{voiceError}</p>}

            <p className="text-charcoal opacity-80 mb-6">
              Pick a conversation style when you&apos;re ready. History stays on the left.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                className="btn-primary flex items-center justify-center gap-2 py-3"
                disabled={starting !== null}
                onClick={() => startConversation('text')}
              >
                <MessageSquare className="w-5 h-5" />
                {starting === 'text' ? 'Starting...' : 'Text chat'}
              </button>
              <button
                type="button"
                className="btn-lavender flex items-center justify-center gap-2 py-3"
                disabled={starting !== null}
                onClick={() => startConversation('voice')}
              >
                <Mic className="w-5 h-5" />
                {starting === 'voice' ? 'Starting...' : 'Voice chat'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
