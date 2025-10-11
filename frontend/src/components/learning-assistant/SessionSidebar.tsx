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
      <div className="w-12 border-r border-gray-700 bg-gray-800/50 backdrop-blur-sm flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="mb-4 text-gray-300 hover:text-white hover:bg-gray-700/50"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewSession}
          disabled={isLoading}
          className="mb-2 text-gray-300 hover:text-white hover:bg-gray-700/50"
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
                "w-8 h-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700/50",
                currentSessionId === session.sessionId && "bg-purple-600/50 text-white"
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
    <div className="w-80 border-r border-gray-700 bg-gray-800/50 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800/30">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white font-primary">Chat Sessions</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="text-gray-300 hover:text-white hover:bg-gray-700/50"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        
        <Button
          onClick={onNewSession}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-secondary">No chat sessions yet</p>
            <p className="text-xs font-secondary">Start a new conversation!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <Card
                key={session.sessionId}
                className={cn(
                  "p-3 cursor-pointer transition-colors hover:bg-gray-700/30 bg-gray-800/30 border-gray-700",
                  currentSessionId === session.sessionId 
                    ? "bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-600/50" 
                    : "border-gray-700/50"
                )}
                onClick={() => onSessionSelect(session.sessionId)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-200 font-secondary">
                      Chat Session
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {formatDate(session.lastActivity)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                    {session.messageCount} messages
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}