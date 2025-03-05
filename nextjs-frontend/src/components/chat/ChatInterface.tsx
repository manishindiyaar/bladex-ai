'use client'

import { useRef, useEffect } from "react";
import { Message } from "./ChatDashboard";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { Loader2 } from "lucide-react";

interface ChatInterfaceProps {
  customerName: string;
  messages: Message[];
  onSendMessage: (message: string) => void;
  isTyping?: boolean;
}

const ChatInterface = ({
  customerName,
  messages,
  onSendMessage,
  isTyping = false,
}: ChatInterfaceProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full bg-whatsapp-bg">
      <ChatHeader customerName={customerName} />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            content={message.content}
            timestamp={message.timestamp}
            isAI={message.isAI}
            isSent={message.isSent}
          />
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">AI is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSendMessage={onSendMessage} />
    </div>
  );
};

export default ChatInterface;