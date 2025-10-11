'use client';

import { useEffect, useRef } from 'react';
import { useLearningAssistantStore } from '@/stores/learningAssistantStore';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SuggestedTopics } from './SuggestedTopics';
import { FollowUpQuestions } from './FollowUpQuestions';
import { SessionSidebar } from './SessionSidebar';
import { TypingIndicator } from './TypingIndicator';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Bot, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LearningAssistantChat() {
  const {
    currentSessionId,
    messages,
    isLoading,
    error,
    sessions,
    isTyping,
    suggestedTopics,
    followUpQuestions,
    sendMessage,
    loadUserSessions,
    createNewSession,
    switchSession,
    clearError,
  } = useLearningAssistantStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load user sessions on mount (only if user is authenticated)
  useEffect(() => {
    // Add a small delay to ensure authentication is established
    const timer = setTimeout(() => {
      loadUserSessions().catch(() => {
        // Silently handle authentication errors on initial load
        console.log('Failed to load sessions - user may not be authenticated yet');
      });
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [loadUserSessions]);

  // Create initial session if none exists
  useEffect(() => {
    if (!currentSessionId && sessions.length === 0) {
      createNewSession();
    }
  }, [currentSessionId, sessions.length, createNewSession]);

  const handleSendMessage = async (message: string) => {
    await sendMessage(message);
  };

  const handleTopicClick = (topic: string) => {
    handleSendMessage(`Can you help me understand ${topic}?`);
  };

  const handleQuestionClick = (question: string) => {
    handleSendMessage(question);
  };

  const handleRetry = () => {
    clearError();
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Sidebar */}
      <SessionSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={switchSession}
        onNewSession={createNewSession}
        isLoading={isLoading}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white font-primary">
                AI Learning Assistant
              </h1>
              <p className="text-sm text-gray-300 font-secondary">
                Get personalized help based on your performance
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="ml-2"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/30">
          {messages.length === 0 && !isTyping ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 font-primary">
                Welcome to your AI Learning Assistant!
              </h3>
              <p className="text-gray-300 mb-6 max-w-md font-secondary">
                I'm here to help you understand topics you're struggling with. 
                Ask me anything about your studies, and I'll provide personalized explanations 
                based on your performance data.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg">
                <Button
                  variant="outline"
                  onClick={() => handleSendMessage("What are my weak areas?")}
                  className="text-left bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/50 hover:border-gray-500"
                >
                  What are my weak areas?
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSendMessage("Help me with algebra")}
                  className="text-left bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/50 hover:border-gray-500"
                >
                  Help me with algebra
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSendMessage("Explain linear equations")}
                  className="text-left bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/50 hover:border-gray-500"
                >
                  Explain linear equations
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSendMessage("Give me practice problems")}
                  className="text-left bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/50 hover:border-gray-500"
                >
                  Give me practice problems
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Suggested Topics */}
              <SuggestedTopics
                topics={suggestedTopics}
                onTopicClick={handleTopicClick}
              />

              {/* Follow-up Questions */}
              <FollowUpQuestions
                questions={followUpQuestions}
                onQuestionClick={handleQuestionClick}
              />

              {/* Messages */}
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <ChatMessage key={index} message={message} />
                ))}
                
                {/* Typing Indicator */}
                {isTyping && <TypingIndicator />}
                
                <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </div>

        {/* Chat Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          disabled={!currentSessionId}
          placeholder={
            !currentSessionId 
              ? "Please create a new session to start chatting..."
              : "Ask me anything about your studies..."
          }
        />
      </div>
    </div>
  );
}