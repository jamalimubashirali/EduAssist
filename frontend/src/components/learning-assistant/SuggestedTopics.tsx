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
    <Card className="p-4 mb-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-medium text-blue-200 font-primary">
          Suggested Topics to Study
        </h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="cursor-pointer bg-gray-700/80 text-gray-200 hover:bg-gray-600/80 transition-colors border-gray-600 font-secondary"
            onClick={() => onTopicClick(topic)}
          >
            {topic}
          </Badge>
        ))}
      </div>
    </Card>
  );
}