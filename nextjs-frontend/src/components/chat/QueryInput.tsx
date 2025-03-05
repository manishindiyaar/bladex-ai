'use client'

import { useState } from "react";
import { Bot, ArrowRight, Loader2 } from "lucide-react";

interface QueryInputProps {
  onSubmit: (query: string) => void;
  isProcessing?: boolean;
}

const QueryInput = ({ onSubmit, isProcessing = false }: QueryInputProps) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (query.trim() && !isProcessing) {
      onSubmit(query);
      setQuery("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-3 items-center">
        <div className={`p-2 rounded-full ${isProcessing ? 'bg-primary bg-opacity-20' : 'bg-gray-100'}`}>
          {isProcessing ? (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          ) : (
            <Bot className="h-5 w-5 text-gray-600" />
          )}
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything (e.g., 'Show me contacts who said Hello')"
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={isProcessing}
          />
        </div>
        <button
          type="submit"
          className="bg-primary text-white p-2 rounded-full hover:bg-opacity-90 disabled:bg-opacity-50 disabled:cursor-not-allowed"
          disabled={!query.trim() || isProcessing}
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </form>
      {isProcessing && (
        <p className="text-xs text-center mt-1 text-gray-500">Processing your query...</p>
      )}
    </div>
  );
};

export default QueryInput;