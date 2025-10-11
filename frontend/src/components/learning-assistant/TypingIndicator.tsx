'use client';

import { Bot } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <Bot className="w-4 h-4 text-blue-600" />
        </div>
      </div>
      
      <Card className="p-3 bg-gray-50 border-gray-200">
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs text-gray-500 ml-2">AI is thinking...</span>
        </div>
      </Card>
    </div>
  );
}