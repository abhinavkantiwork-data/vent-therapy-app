import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { saveMoodLog } from '../services/messageService';

const moodOptions = [
  { label: 'Sad', emoji: '😔', value: 'sad' as const },
  { label: 'Low', emoji: '😐', value: 'negative' as const },
  { label: 'Neutral', emoji: '🙂', value: 'neutral' as const },
  { label: 'Good', emoji: '😊', value: 'positive' as const },
  { label: 'Great', emoji: '🤩', value: 'happy' as const },
];

const MoodResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionMessages, userEmail } = (location.state || {}) as {
    sessionMessages?: unknown[];
    userEmail?: string;
  };
  const [selectedMood, setSelectedMood] = useState<(typeof moodOptions)[number]['value'] | null>(null);
  const [experienceRating, setExperienceRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!sessionMessages || !userEmail) {
      navigate('/dashboard', { replace: true });
    }
  }, [sessionMessages, userEmail, navigate]);

  if (!sessionMessages || !userEmail) {
    return null;
  }

  const sessionId = (location.state || {}).sessionId as string | undefined;

  const handleFinish = async () => {
    if (!selectedMood || experienceRating === 0) return;
    if (sessionId) await saveMoodLog(sessionId, selectedMood, experienceRating);
    setSubmitted(true);
    setTimeout(() => navigate('/dashboard', { replace: true }), 600);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-indigo-50 px-4">
      <div className="bg-white/90 rounded-2xl shadow-lg p-8 max-w-lg w-full animate-fadeIn">
        <h2 className="text-3xl font-bold mb-2 text-gray-900 text-center">Session feedback</h2>
        <p className="text-gray-600 text-center mb-8">How did this conversation feel for you?</p>

        <p className="text-sm font-medium text-gray-800 mb-3">Rate your experience</p>
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setExperienceRating(n)}
              className="p-1 rounded transition-transform hover:scale-110"
              aria-label={`Rate ${n} stars`}
            >
              <Star
                className={`w-8 h-8 ${
                  n <= experienceRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        <p className="text-sm font-medium text-gray-800 mb-3">How are you feeling now?</p>
        <div className="grid grid-cols-5 gap-2 mb-8">
          {moodOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setSelectedMood(item.value)}
              className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${
                selectedMood === item.value
                  ? 'border-blue-400 bg-blue-50 scale-105'
                  : 'border-transparent bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-xs mt-1 text-gray-600">{item.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-primary w-full"
          disabled={!selectedMood || experienceRating === 0 || submitted}
          onClick={handleFinish}
        >
          {submitted ? 'Returning to your space...' : 'Save & continue'}
        </button>
      </div>
    </div>
  );
};

export default MoodResultPage;
