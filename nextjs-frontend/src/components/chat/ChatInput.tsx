'use client'

import { useState } from "react";
import { Send, Paperclip, Smile } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

const ChatInput = ({ onSendMessage }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <div className="bg-white p-3 border-t border-gray-200">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <button 
          type="button" 
          className="text-gray-500 hover:text-gray-700" 
          aria-label="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
          className="flex-1 p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-whatsapp-green"
        />
        
        <button 
          type="button" 
          className="text-gray-500 hover:text-gray-700" 
          aria-label="Add emoji"
        >
          <Smile className="h-5 w-5" />
        </button>
        
        <button 
          type="submit" 
          className="bg-whatsapp-green text-white p-2 rounded-full hover:bg-opacity-90" 
          aria-label="Send message"
          disabled={!message.trim()}
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;