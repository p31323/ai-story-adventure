
import React from 'react';
import { ChatMessage } from '../types';
import { InsightIcon } from './IconComponents';

interface ChatBubbleProps {
  message: ChatMessage;
  onPeekThoughts: () => void;
  isPeeking: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onPeekThoughts, isPeeking }) => {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';
  const isNarration = message.sender === 'ai' && !message.characterName;
  const isDialogue = message.sender === 'ai' && !!message.characterName;

  const formatText = (text: string) => {
    return text.split('\n').map((line, index) => {
      // This regex is for dialogue quotes, let's make it more specific for dialogue bubbles
      if (isDialogue && (/^「.*」$/.test(line.trim()) || /^“.*”$/.test(line.trim()))) {
        return <p key={index} className="italic text-cyan-200/90">{line}</p>;
      }
      return <p key={index}>{line}</p>;
    });
  };
  
  // Handle system event messages
  if (isSystem) {
    return (
      <div className="flex justify-center animate-fadeIn my-4">
        <div className="bg-slate-700/80 rounded-lg p-3 max-w-md text-center">
          <p className="text-slate-300 text-sm italic whitespace-pre-wrap">{message.text.replace('系統事件：', '')}</p>
        </div>
      </div>
    );
  }

  // Handle narration messages
  if (isNarration) {
    return (
      <div className="flex justify-center animate-fadeIn my-2">
        <div className="max-w-prose text-center">
          <p className="text-slate-400 italic whitespace-pre-wrap font-serif leading-relaxed">{message.text}</p>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex justify-end animate-fadeIn">
        <div className="bg-cyan-800/80 rounded-lg rounded-br-none p-4 max-w-prose">
          <p className="text-white whitespace-pre-wrap">{message.text}</p>
        </div>
      </div>
    );
  }

  // AI Dialogue Bubble
  if (isDialogue) {
    return (
      <div className="group flex justify-start animate-fadeIn gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0 mt-2 flex items-center justify-center font-bold text-cyan-400 text-lg shadow-md">
          {message.characterName?.charAt(0)}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-cyan-300 mb-1">{message.characterName}</p>
          <div className="bg-slate-800/80 rounded-lg rounded-bl-none p-4 max-w-prose relative inline-block">
            <div className="text-slate-200 font-serif whitespace-pre-wrap leading-relaxed">
              {formatText(message.text)}
            </div>
            <button 
              onClick={onPeekThoughts} 
              disabled={isPeeking}
              className="absolute -bottom-2 -right-2 p-1.5 text-slate-400 bg-slate-700/80 rounded-full opacity-0 group-hover:opacity-100 hover:bg-slate-600 hover:text-cyan-400 focus:opacity-100 focus:ring-2 focus:ring-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-wait"
              title="窺探此刻的內心"
            >
              <InsightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ChatBubble;
