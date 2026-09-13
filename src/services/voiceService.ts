import { API_BASE } from './authService';

export interface ElevenVoice {
  voice_id: string;
  name: string;
  labels?: Record<string, string>;
}

export async function fetchVoices(): Promise<ElevenVoice[]> {
  const response = await fetch(`${API_BASE}/api/voices`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load AI voices');
  }
  const data = await response.json();
  return data.voices || [];
}

export async function playTextToSpeech(text: string, voiceId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId }),
    });
    if (!response.ok) throw new Error('ElevenLabs request failed');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    try {
      const audio = new Audio(url);
      await audio.play();
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error('Audio playback failed'));
      });
      return;
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    await speakWithBrowser(text);
  }
}

export async function transcribeAudio(audio: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('audio', audio, 'recording.webm');
  const response = await fetch(`${API_BASE}/api/stt`, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Speech-to-text request failed');
  }
  return data.text || '';
}

function speakWithBrowser(text: string): Promise<void> {
  if (!('speechSynthesis' in window)) {
    throw new Error('No text-to-speech engine is available in this browser.');
  }
  return new Promise((resolve, reject) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error('Browser speech playback failed'));
    window.speechSynthesis.speak(utterance);
  });
}
