'use client';

import { useRequireAuth } from '@/hooks/useAuthProtection';
import GameLayout from '@/app/components/layout/GameLayout';
import { LearningAssistantChat } from '@/components/learning-assistant/LearningAssistantChat';

export default function LearningAssistantPage() {
  // Protect this page - require authentication
  const { isLoading, shouldRedirect, user: authUser } = useRequireAuth();

  // Show loading while auth is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white font-secondary">Loading AI Tutor...</p>
        </div>
      </div>
    );
  }

  // Show redirecting message if not authenticated
  if (shouldRedirect || !authUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white font-secondary">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <GameLayout>
      <div className="h-[calc(100vh-4rem)] -m-6">
        <LearningAssistantChat />
      </div>
    </GameLayout>
  );
}