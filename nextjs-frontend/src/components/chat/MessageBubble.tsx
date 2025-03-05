'use client'

import { Check, Bot } from "lucide-react";

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isAI?: boolean;
  isSent: boolean;
}

const MessageBubble = ({
  content,
  timestamp,
  isAI = false,
  isSent
}: MessageBubbleProps) => {
  return (
    <div className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
      <div 
        className={`max-w-md py-2 px-3 rounded-lg ${
          isSent 
            ? "bg-whatsapp-light-green" 
            : "bg-white"
        }`}
      >
        {isAI && isSent && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Bot className="h-3 w-3" />
            <span>AI Response</span>
          </div>
        )}
        
        <p className="text-sm">{content}</p>
        
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-xs text-gray-500">{timestamp}</span>
          {isSent && (
            <Check className="h-3 w-3 text-gray-500" />
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;