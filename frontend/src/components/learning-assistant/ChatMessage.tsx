'use client';

import { ChatMessage as ChatMessageType } from '@/services/learningAssistantService';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
      
      <div className={cn(
        "max-w-[80%] space-y-2",
        isUser ? "items-end" : "items-start"
      )}>
        <Card className={cn(
          "p-3 shadow-lg",
          isUser 
            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0" 
            : "bg-gray-800/80 backdrop-blur-sm border-gray-700 text-white"
        )}>
          <div className={cn(
            "text-sm leading-relaxed font-secondary prose prose-invert max-w-none",
            isUser ? "text-white prose-headings:text-white prose-strong:text-white prose-code:text-white" : "text-gray-100"
          )}>
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({children}) => <h1 className="text-lg font-bold mb-2 text-white">{children}</h1>,
                  h2: ({children}) => <h2 className="text-base font-bold mb-2 text-white">{children}</h2>,
                  h3: ({children}) => <h3 className="text-sm font-bold mb-1 text-white">{children}</h3>,
                  p: ({children}) => <p className="mb-2 last:mb-0 text-gray-100">{children}</p>,
                  ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1 text-gray-100">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1 text-gray-100">{children}</ol>,
                  li: ({children}) => <li className="text-gray-100">{children}</li>,
                  strong: ({children}) => <strong className="font-bold text-white">{children}</strong>,
                  em: ({children}) => <em className="italic text-gray-200">{children}</em>,
                  code: ({children}) => <code className="bg-gray-700 px-1 py-0.5 rounded text-xs text-gray-200 font-mono">{children}</code>,
                  pre: ({children}) => <pre className="bg-gray-700 p-2 rounded text-xs overflow-x-auto mb-2">{children}</pre>,
                  blockquote: ({children}) => <blockquote className="border-l-4 border-purple-500 pl-3 italic text-gray-300 mb-2">{children}</blockquote>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        </Card>
        
        {/* Assistant metadata */}
        {!isUser && message.metadata && (
          <div className="space-y-2">
            {message.metadata.suggestedTopics && message.metadata.suggestedTopics.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {message.metadata.suggestedTopics.map((topic, index) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-gray-700 text-gray-200 hover:bg-gray-600">
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
        
        <p className="text-xs text-gray-400 font-secondary">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}