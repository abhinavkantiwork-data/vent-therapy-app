export interface AssistantPrefs {
  name: string;
  voiceId: string;
  answerLength: 'short' | 'detailed' | 'adaptive';
  responseMode: 'advice' | 'listening';
  formatMode: 'structured' | 'conversational' | 'adaptive';
  tone: 'gentle' | 'direct';
}

const PREFS_KEY = 'vent_assistant_prefs';
const DEFAULT_VOICE = '21m00Tcm4TlvDq8ikWAM';

export function loadAssistantPrefs(): AssistantPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      return { name: 'Vent', voiceId: DEFAULT_VOICE, answerLength: 'adaptive', responseMode: 'advice', formatMode: 'adaptive', tone: 'gentle', ...JSON.parse(raw) };
    }
  } catch {
    /* ignore */
  }
  return { name: 'Vent', voiceId: DEFAULT_VOICE, answerLength: 'adaptive', responseMode: 'advice', formatMode: 'adaptive', tone: 'gentle' };
}

export function saveAssistantPrefs(prefs: AssistantPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function sessionModeKey(sessionId: string) {
  return `vent_session_mode_${sessionId}`;
}

export function getSessionMode(sessionId: string): 'text' | 'voice' | null {
  const v = sessionStorage.getItem(sessionModeKey(sessionId));
  return v === 'voice' || v === 'text' ? v : null;
}

export function setSessionMode(sessionId: string, mode: 'text' | 'voice') {
  sessionStorage.setItem(sessionModeKey(sessionId), mode);
}
