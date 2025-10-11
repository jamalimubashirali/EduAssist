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
    <Card className="p-4 mb-4 bg-green-50 border-green-200">
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle className="w-4 h-4 text-green-600" />
        <h3 className="text-sm font-medium text-green-900">
          Follow-up Questions
        </h3>
      </div>
      
      <div className="space-y-2">
        {questions.map((question, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-left h-auto p-2 text-green-800 hover:bg-green-100"
            onClick={() => onQuestionClick(question)}
          >
            {question}
          </Button>
        ))}
      </div>
    </Card>
  );
}