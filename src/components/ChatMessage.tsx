import React from 'react';
import { Message } from '../services/messageService';

interface ChatMessageProps {
  message: Message;
  onFeedback?: (feedback: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onFeedback }) => {
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(message.timestamp);

  return (
    <div className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
      <div className={message.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
        {message.text}
      </div>
      <span className="text-xs text-white opacity-50 mt-1 px-2">
        {formattedTime}
      </span>
      {message.sender === 'ai' && onFeedback && (
        <div className="flex gap-2 mt-1 px-2 text-[10px] text-charcoal opacity-60">
          <button type="button" onClick={() => onFeedback('helpful')}>Helpful</button>
          <button type="button" onClick={() => onFeedback('too_vague')}>Too vague</button>
          <button type="button" onClick={() => onFeedback('too_long')}>Too long</button>
          <button type="button" onClick={() => onFeedback('not_relevant')}>Not relevant</button>
          <button type="button" onClick={() => onFeedback('more_detail')}>More detail</button>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;