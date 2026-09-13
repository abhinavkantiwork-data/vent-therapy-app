import React from 'react';
import { Message } from '../services/messageService';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
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
    </div>
  );
};

export default ChatMessage;