'use client'

import { Info } from "lucide-react";

interface ChatHeaderProps {
  customerName: string;
}

const ChatHeader = ({ customerName }: ChatHeaderProps) => {
  return (
    <div className="bg-white p-4 shadow-sm flex justify-between items-center border-b border-gray-200">
      <div className="flex items-center">
        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
          {customerName.charAt(0).toUpperCase()}
        </div>
        <h2 className="font-medium">{customerName}</h2>
      </div>
      <button className="text-gray-500 hover:text-gray-700" aria-label="Customer info">
        <Info className="h-5 w-5" />
      </button>
    </div>
  );
};

export default ChatHeader;