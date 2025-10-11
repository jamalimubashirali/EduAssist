'use client';

import { Bot } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
      </div>
      
      <Card className="p-3 bg-gray-800/80 backdrop-blur-sm border-gray-700 shadow-lg">
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs text-gray-300 ml-2 font-secondary">AI is thinking...</span>
        </div>
      </Card>
    </div>
  );
}