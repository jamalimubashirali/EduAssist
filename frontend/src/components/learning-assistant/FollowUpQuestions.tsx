'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

interface FollowUpQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
}

export function FollowUpQuestions({ questions, onQuestionClick }: FollowUpQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <Card className="p-4 mb-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-700/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle className="w-4 h-4 text-green-400" />
        <h3 className="text-sm font-medium text-green-200 font-primary">
          Follow-up Questions
        </h3>
      </div>
      
      <div className="space-y-2">
        {questions.map((question, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-left h-auto p-2 text-green-200 hover:bg-green-800/30 hover:text-green-100 font-secondary"
            onClick={() => onQuestionClick(question)}
          >
            {question}
          </Button>
        ))}
      </div>
    </Card>
  );
}