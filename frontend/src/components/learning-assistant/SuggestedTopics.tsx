'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

interface SuggestedTopicsProps {
  topics: string[];
  onTopicClick: (topic: string) => void;
}

export function SuggestedTopics({ topics, onTopicClick }: SuggestedTopicsProps) {
  if (topics.length === 0) return null;

  return (
    <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-medium text-blue-900">
          Suggested Topics to Study
        </h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="cursor-pointer hover:bg-blue-200 transition-colors"
            onClick={() => onTopicClick(topic)}
          >
            {topic}
          </Badge>
        ))}
      </div>
    </Card>
  );
}