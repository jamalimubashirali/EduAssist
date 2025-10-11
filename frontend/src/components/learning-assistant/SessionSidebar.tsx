'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChatSession } from '@/services/learningAssistantService';
import { 
  MessageCircle, 
  Plus, 
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  isLoading: boolean;
}

export function SessionSidebar({ 
  sessions, 
  currentSessionId, 
  onSessionSelect, 
  onNewSession,
  isLoading 
}: SessionSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const formatDate = (date: Date) => {
    const now = new Date();
    const sessionDate = new Date(date);
    const diffInHours = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return sessionDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return sessionDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 border-r bg-gray-50 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="mb-4"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewSession}
          disabled={isLoading}
          className="mb-2"
        >
          <Plus className="w-4 h-4" />
        </Button>
        
        <div className="flex flex-col gap-1">
          {sessions.slice(0, 5).map((session) => (
            <Button
              key={session.sessionId}
              variant="ghost"
              size="sm"
              onClick={() => onSessionSelect(session.sessionId)}
              className={cn(
                "w-8 h-8 p-0",
                currentSessionId === session.sessionId && "bg-blue-100"
              )}
            >
              <MessageCircle className="w-3 h-3" />
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Chat Sessions</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        
        <Button
          onClick={onNewSession}
          disabled={isLoading}
          className="w-full"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No chat sessions yet</p>
            <p className="text-xs">Start a new conversation!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <Card
                key={session.sessionId}
                className={cn(
                  "p-3 cursor-pointer transition-colors hover:bg-white",
                  currentSessionId === session.sessionId 
                    ? "bg-blue-50 border-blue-200" 
                    : "bg-transparent border-transparent"
                )}
                onClick={() => onSessionSelect(session.sessionId)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">
                      Chat Session
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {formatDate(session.lastActivity)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {session.messageCount} messages
                  </Badge>
                  
                  {session.contextTopics.length > 0 && (
                    <div className="flex gap-1">
                      {session.contextTopics.slice(0, 2).map((topic, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                      {session.contextTopics.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{session.contextTopics.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}