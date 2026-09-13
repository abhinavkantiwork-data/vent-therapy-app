import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Download, LogOut, MessageSquare, Mic, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import ChatSidebar from '../components/ChatSidebar';
import { createSession, deleteAccount, exportAccountData, savePreferences } from '../services/messageService';
import { fetchVoices, playTextToSpeech, stopTextToSpeech, type ElevenVoice } from '../services/voiceService';
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
  const [previewingVoice, setPreviewingVoice] = useState(false);
  const [startError, setStartError] = useState('');

  useEffect(() => {
    fetchVoices()
      .then(setVoices)
      .catch(() => setVoiceError('Could not load voices. Add ELEVENLABS_API_KEY on the server.'));
  }, []);

  useEffect(() => {
    saveAssistantPrefs(prefs);
    if (user) void savePreferences(prefs).catch((error) => console.error('Preference save error:', error));
  }, [prefs, user]);

  const startConversation = async (mode: 'text' | 'voice') => {
    if (!user) return;
    stopTextToSpeech();
    setStarting(mode);
    setStartError('');
    try {
      const session = await createSession(user.email);
      setSessionMode(session.id, mode);
      navigate(`/chat/${session.id}`, { state: { mode } });
    } catch (e) {
      console.error(e);
      setStartError(e instanceof Error ? e.message : 'Could not start the conversation.');
    } finally {
      setStarting(null);
    }
  };

  const previewVoice = async (voiceId: string) => {
    stopTextToSpeech();
    setPrefs((current) => ({ ...current, voiceId }));
    setPreviewingVoice(true);
    setVoiceError('');
    try {
      await playTextToSpeech('Hello, I am here with you. How can I help you today?', voiceId);
    } catch {
      setVoiceError('Voice preview is unavailable right now. Check the ElevenLabs setup on the server.');
    } finally {
      setPreviewingVoice(false);
    }
  };

  const updatePreference = <K extends keyof typeof prefs>(key: K, value: (typeof prefs)[K]) => {
    setPrefs((current) => ({ ...current, [key]: value }));
  };

  const handleExport = async () => {
    const data = await exportAccountData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vent-account-export.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete your account and all conversations permanently?')) return;
    await deleteAccount();
    await logout();
    navigate('/');
  };

  return (
    <div className="start-shell min-h-screen flex">
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
            VENT<span className="text-peach">0.2</span>
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
          <div className="start-card max-w-lg w-full glass-effect p-8 text-center animate-fadeIn">
            <div className="start-orbit" aria-hidden="true"><span /><span /><span /></div>
            <div className="relative mx-auto w-28 h-28 mb-6 start-bot">
              <div className="absolute inset-0 rounded-full bg-peach/40 animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-white/80 flex items-center justify-center shadow-lg ai-orb">
                <Bot className="w-14 h-14 text-muted-navy" />
              </div>
            </div>

            <p className="start-kicker">Your space is ready</p>
            <h2 className="start-title">How would you like to feel heard?</h2>

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
              onChange={(e) => void previewVoice(e.target.value)}
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
            {previewingVoice && <p className="text-xs text-muted-navy mb-2 text-left animate-pulse">Previewing this voice...</p>}

            <div className="grid sm:grid-cols-2 gap-3 text-left mt-4">
              <label className="text-sm text-charcoal">Answer length<select className="form-select w-full mt-1" value={prefs.answerLength} onChange={(e) => updatePreference('answerLength', e.target.value as typeof prefs.answerLength)}><option value="adaptive">Adaptive</option><option value="short">Short</option><option value="detailed">Detailed</option></select></label>
              <label className="text-sm text-charcoal">Response mode<select className="form-select w-full mt-1" value={prefs.responseMode} onChange={(e) => updatePreference('responseMode', e.target.value as typeof prefs.responseMode)}><option value="advice">Advice</option><option value="listening">Just listen</option></select></label>
              <label className="text-sm text-charcoal">Format<select className="form-select w-full mt-1" value={prefs.formatMode} onChange={(e) => updatePreference('formatMode', e.target.value as typeof prefs.formatMode)}><option value="adaptive">Adaptive</option><option value="structured">Structured</option><option value="conversational">Conversational</option></select></label>
              <label className="text-sm text-charcoal">Tone<select className="form-select w-full mt-1" value={prefs.tone} onChange={(e) => updatePreference('tone', e.target.value as typeof prefs.tone)}><option value="gentle">Gentle</option><option value="direct">Direct</option></select></label>
            </div>
            {voiceError && <p className="text-xs text-amber-800 mb-4 text-left">{voiceError}</p>}
            {startError && <p className="text-xs text-red-700 bg-red-100 border border-red-300 rounded p-3 mb-4 text-left">{startError}</p>}

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
            <div className="flex justify-center gap-4 mt-6 text-xs text-charcoal opacity-75">
              <button type="button" onClick={() => void handleExport()} className="inline-flex items-center gap-1 hover:opacity-100"><Download size={14} /> Export data</button>
              <button type="button" onClick={() => void handleDeleteAccount()} className="inline-flex items-center gap-1 text-red-700 hover:opacity-100"><Trash2 size={14} /> Delete account</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
