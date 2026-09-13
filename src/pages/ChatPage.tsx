import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { LogOut, Send, XCircle, Mic, MicOff, History, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import ChatMessage from '../components/ChatMessage';
import ChatSidebar from '../components/ChatSidebar';
import {
  Message,
  Session,
  fetchSessionMessages,
  saveMessageFeedback,
  saveSessionMessage,
} from '../services/messageService';
import { playTextToSpeech, stopTextToSpeech, transcribeAudio } from '../services/voiceService';
import {
  getSessionMode,
  loadAssistantPrefs,
  setSessionMode,
} from '../utils/assistantPrefs';

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionMode, setSessionModeState] = useState<'voice' | 'text' | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const silenceFrameRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const shouldContinueListeningRef = useRef(false);
  const lastSpokenAiId = useRef<string | null>(null);
  const speechPlaybackRef = useRef<Promise<void>>(Promise.resolve());
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams<{ sessionId: string }>();
  const assistantPrefs = loadAssistantPrefs();

  const loadSessionMessages = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const sessionMessages = await fetchSessionMessages(id);
      setMessages((current) => sessionMessages.length > 0 ? sessionMessages : current);
      setIsSessionActive(true);
      if (sessionMessages.length > 0 && !getSessionMode(id)) {
        setSessionModeState('text');
      }
    } catch (error) {
      console.error('Error loading session messages:', error);
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const submitMessage = async (text: string) => {
    const activeUser = user;
    const session = currentSession;
    if (!text.trim() || !activeUser || !session) return;

    stopTextToSpeech();
    setIsSpeaking(false);
    setNewMessage('');
    setIsLoading(true);
    try {
      const { userMessage: savedUserMessage, aiMessage } = await saveSessionMessage(session.id, {
        text: text.trim(),
        sender: 'user',
        userEmail: activeUser.email,
        sessionId: session.id,
      }, assistantPrefs);
      setMessages((prev) => [...prev, savedUserMessage, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionId) {
      navigate('/dashboard', { replace: true });
    }
  }, [sessionId, navigate]);

  useEffect(() => {
    if (!user || !sessionId) return;

    const modeFromNav = (location.state as { mode?: 'text' | 'voice' } | null)?.mode;
    const storedMode = getSessionMode(sessionId);
    const mode = modeFromNav ?? storedMode;
    if (mode) {
      setSessionModeState(mode);
      setSessionMode(sessionId, mode);
    }

    setCurrentSession({
      id: sessionId,
      userEmail: user.email,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      title: 'Session',
    });
    setIsSessionActive(true);
    setMessages((existing) => existing.length > 0 ? existing : [{
      id: `welcome-${sessionId}`,
      text: `Hello, I'm ${assistantPrefs.name}. How are you feeling today?`,
      sender: 'ai',
      timestamp: new Date(),
      userEmail: user.email,
      sessionId,
    }]);
    loadSessionMessages(sessionId);
  }, [user, sessionId, location.state, navigate, loadSessionMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => {
    shouldContinueListeningRef.current = false;
    stopTextToSpeech();
    if (silenceFrameRef.current !== null) cancelAnimationFrame(silenceFrameRef.current);
    mediaRecorderRef.current?.stop();
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    void audioContextRef.current?.close();
  }, []);

  useEffect(() => {
    if (sessionMode !== 'voice' || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender !== 'ai' || lastMsg.id === lastSpokenAiId.current) return;
    lastSpokenAiId.current = lastMsg.id;
    setIsSpeaking(true);
    speechPlaybackRef.current = playTextToSpeech(lastMsg.text, assistantPrefs.voiceId).catch((err) => {
      console.error(err);
      setSpeechError('Voice playback is unavailable in this browser. You can continue with text chat.');
    }).finally(() => setIsSpeaking(false));
  }, [messages, sessionMode, assistantPrefs.voiceId, isSessionActive]);

  const handleSessionSelect = (id: string) => {
    navigate(`/chat/${id}`);
    setIsSidebarOpen(false);
  };

  const createNewSession = async () => {
    navigate('/dashboard');
  };

  const endSession = () => {
    if (!user || !currentSession) return;
    shouldContinueListeningRef.current = false;
    mediaRecorderRef.current?.stop();
    stopTextToSpeech();
    setIsSpeaking(false);
    setIsSessionActive(false);
    const farewell: Message = {
      id: Date.now().toString(),
      text: "Thank you for sharing. When you're ready, tell us how the session felt.",
      sender: 'ai',
      timestamp: new Date(),
      userEmail: user.email,
      sessionId: currentSession.id,
    };
    const updated = [...messages, farewell];
    setMessages(updated);
    setTimeout(() => {
      navigate('/mood-result', {
        state: { sessionMessages: updated, userEmail: user.email, sessionId: currentSession.id },
      });
    }, 800);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !currentSession) return;

    const userMessage: Omit<Message, 'id' | 'timestamp'> = {
      text: newMessage.trim(),
      sender: 'user',
      userEmail: user.email,
      sessionId: currentSession.id,
    };

    await submitMessage(userMessage.text);
  };

  const handleFeedback = async (messageId: string, feedback: string) => {
    if (!sessionId) return;
    try {
      await saveMessageFeedback(sessionId, messageId, feedback);
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !('MediaRecorder' in window)) {
      setSpeechError('Audio recording is not supported in this browser. Use Chrome or Edge.');
      return;
    }
    setSpeechError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];
      recordingStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      audioContextRef.current = audioContext;
      const levels = new Uint8Array(analyser.fftSize);
      let heardSpeech = false;
      let quietSince = 0;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        setIsListening(false);
        if (silenceFrameRef.current !== null) cancelAnimationFrame(silenceFrameRef.current);
        silenceFrameRef.current = null;
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        mediaRecorderRef.current = null;
        audioContextRef.current = null;
        await audioContext.close();
        const audio = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (!audio.size) return;
        setSpeechError('');
        try {
          const transcript = await transcribeAudio(audio);
          if (transcript) {
            setNewMessage((current) => (current ? `${current} ${transcript}` : transcript));
            if (shouldContinueListeningRef.current && isSessionActive && currentSession && user) {
              await submitMessage(transcript);
            }
          }
          if (shouldContinueListeningRef.current) {
            await speechPlaybackRef.current;
            if (shouldContinueListeningRef.current) await startRecording();
          }
        } catch (error) {
          console.error('ElevenLabs speech-to-text error:', error);
          setSpeechError('Speech-to-text is unavailable. Check your ElevenLabs key and try again.');
        }
      };
      recorder.start();
      setIsListening(true);
      const detectSilence = () => {
        if (recorder.state !== 'recording') return;
        analyser.getByteTimeDomainData(levels);
        const volume = Math.sqrt(
          levels.reduce((sum, level) => sum + ((level - 128) / 128) ** 2, 0) / levels.length,
        );
        if (volume > 0.025) {
          heardSpeech = true;
          quietSince = 0;
        } else if (heardSpeech) {
          quietSince = quietSince || Date.now();
          if (Date.now() - quietSince >= 1400) {
            recorder.stop();
            return;
          }
        }
        silenceFrameRef.current = requestAnimationFrame(detectSilence);
      };
      silenceFrameRef.current = requestAnimationFrame(detectSilence);
    } catch {
      setSpeechError('Microphone access was blocked. Allow mic permission for this site and try again.');
    }
  };

  const handleMicClick = async () => {
    if (isListening) {
      shouldContinueListeningRef.current = false;
      mediaRecorderRef.current?.stop();
      return;
    }
    stopTextToSpeech();
    setIsSpeaking(false);
    shouldContinueListeningRef.current = true;
    setSpeechError('');
    await speechPlaybackRef.current;
    if (!shouldContinueListeningRef.current) return;
    await startRecording();
  };

  const pickMode = (mode: 'text' | 'voice') => {
    if (!sessionId) return;
    setSessionMode(sessionId, mode);
    setSessionModeState(mode);
  };

  const useTool = (tool: string) => setNewMessage(tool);

  return (
    <div className="chat-shell min-h-screen flex flex-col">
      <ChatSidebar
        variant="docked"
        currentSessionId={currentSession?.id || null}
        onSessionSelect={handleSessionSelect}
        onNewSession={createNewSession}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {sessionMode === null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-soft-white rounded-lg shadow-lg p-8 max-w-sm w-full flex flex-col items-center animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4 text-charcoal text-center">
              How would you like to talk with {assistantPrefs.name}?
            </h2>
            <button type="button" className="btn-primary w-full mb-3" onClick={() => pickMode('voice')}>
              Voice session
            </button>
            <button type="button" className="btn-lavender w-full" onClick={() => pickMode('text')}>
              Text session
            </button>
          </div>
        </div>
      )}

      {sessionMode !== null && (
        <div className="flex flex-col min-h-screen md:ml-80">
          <header className="glass-effect p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-lg hover:bg-white/20 md:hidden"
                title="Back to home"
              >
                <ArrowLeft className="w-5 h-5 text-charcoal" />
              </button>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 bg-soft-white/80 rounded-lg shadow-lg hover:bg-opacity-100 transition-all mr-2 md:hidden"
                title="Chat history"
              >
                <History className="w-5 h-5 text-charcoal" />
              </button>
              <h1 className="text-charcoal text-xl font-semibold">
                {assistantPrefs.name}
                <span className="text-peach text-sm ml-2 hidden sm:inline">
                  · {sessionMode === 'voice' ? 'Voice' : 'Text'}
                </span>
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              {isSessionActive ? (
                <button
                  type="button"
                  onClick={endSession}
                  className="btn-secondary flex items-center text-sm px-2 py-1 md:px-3"
                >
                  <XCircle className="w-4 h-4 mr-1 text-charcoal" />
                  <span className="hidden sm:inline">End session</span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => logout().then(() => navigate('/login'))}
                className="text-charcoal opacity-70 hover:opacity-100 p-2 rounded-lg hover:bg-white/20 transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-3xl mx-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-charcoal opacity-80 p-8">
                  <h2 className="text-xl font-medium mb-2">Your safe space</h2>
                  <p className="text-center mb-4">Your space is ready whenever you are.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} onFeedback={message.sender === 'ai' ? (feedback) => void handleFeedback(message.id, feedback) : undefined} />
                  ))}
                  {isLoading && (
                    <div className="chat-bubble-ai" style={{ padding: '8px 16px' }}>
                      <div className="typing-indicator">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-sm">
            <div className="max-w-3xl mx-auto flex flex-wrap gap-2 mb-3">
              {['Help me organize this', 'Make a plan', 'Challenge this thought', 'Summarize this session', 'Give me a grounding exercise', 'Just listen'].map((tool) => <button key={tool} type="button" onClick={() => useTool(tool)} className="rounded-full border border-black/10 bg-white/60 px-3 py-1 text-xs text-charcoal hover:bg-white">{tool}</button>)}
            </div>
            <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex">
              <input
                id="message-input"
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  isSessionActive
                    ? sessionMode === 'voice'
                      ? 'Tap the mic and speak, or type...'
                      : 'Type your message...'
                    : 'Start a session to begin chatting'
                }
                className={`flex-1 form-input rounded-r-none ${isListening ? 'ring-2 ring-blue-400 animate-pulse' : ''}`}
                disabled={!isSessionActive}
              />
              {sessionMode === 'voice' && (
                <button
                  id="mic-btn"
                  type="button"
                  onClick={handleMicClick}
                  className={`btn ${isListening ? 'btn-danger' : 'btn-outline'} rounded-none border-black text-black flex items-center justify-center`}
                  style={{ minWidth: 44 }}
                  disabled={!isSessionActive}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary rounded-l-none"
                disabled={!isSessionActive || !newMessage.trim()}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            {sessionMode === 'voice' && (
              <div className="max-w-3xl mx-auto flex items-center mt-2 text-sm text-charcoal">
                <span className={isListening ? 'text-blue-600 animate-pulse' : ''}>
                  {isListening ? 'Listening... pause when finished speaking' : isSpeaking ? 'Speaking... tap the mic to interrupt' : 'Tap the mic to start continuous listening'}
                </span>
              </div>
            )}
            <p className="max-w-3xl mx-auto mt-2 text-[11px] text-charcoal opacity-55">VENT offers emotional support and is not a replacement for licensed therapy or emergency care.</p>
            {speechError && (
              <p className="max-w-3xl mx-auto mt-2 text-sm text-red-700 bg-red-50 rounded px-3 py-2">{speechError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
