'use client';

import { ChatMessage as ChatMessageType } from '@/services/learningAssistantService';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Bot className="w-4 h-4 text-blue-600" />
          </div>
        </div>
      )}
      
      <div className={cn(
        "max-w-[80%] space-y-2",
        isUser ? "items-end" : "items-start"
      )}>
        <Card className={cn(
          "p-3",
          isUser 
            ? "bg-blue-600 text-white" 
            : "bg-gray-50 border-gray-200"
        )}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </Card>
        
        {/* Assistant metadata */}
        {!isUser && message.metadata && (
          <div className="space-y-2">
            {message.metadata.suggestedTopics && message.metadata.suggestedTopics.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {message.metadata.suggestedTopics.map((topic, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            )}
            
            {message.metadata.difficulty && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  message.metadata.difficulty === 'beginner' && "border-green-300 text-green-700",
                  message.metadata.difficulty === 'intermediate' && "border-yellow-300 text-yellow-700",
                  message.metadata.difficulty === 'advanced' && "border-red-300 text-red-700"
                )}
              >
                {message.metadata.difficulty}
              </Badge>
            )}
          </div>
        )}
        
        <p className="text-xs text-gray-500">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}