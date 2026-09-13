import { API_BASE } from './authService';

export interface ElevenVoice {
  voice_id: string;
  name: string;
  labels?: Record<string, string>;
}

const activeAudios = new Set<HTMLAudioElement>();
let playbackGeneration = 0;

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
  const generation = ++playbackGeneration;
  activeAudios.forEach((audio) => audio.pause());
  activeAudios.clear();
  window.speechSynthesis?.cancel();
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId }),
    });
  } catch {
    throw new Error('ElevenLabs voice service is unreachable.');
  }
  if (generation !== playbackGeneration) return;
  if (!response.ok) {
    throw new Error('ElevenLabs voice playback failed.');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  if (generation !== playbackGeneration) {
    URL.revokeObjectURL(url);
    return;
  }
  const audio = new Audio(url);
  activeAudios.add(audio);
  try {
    await audio.play();
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Audio playback failed'));
    });
  } finally {
    URL.revokeObjectURL(url);
    activeAudios.delete(audio);
  }
}

export function stopTextToSpeech() {
  playbackGeneration += 1;
  activeAudios.forEach((audio) => audio.pause());
  activeAudios.clear();
  window.speechSynthesis?.cancel();
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

