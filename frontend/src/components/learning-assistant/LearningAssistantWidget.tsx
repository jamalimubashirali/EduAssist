'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, MessageCircle, ArrowRight, Sparkles } from 'lucide-react';

interface LearningAssistantWidgetProps {
  weakTopics?: string[];
  className?: string;
}

export function LearningAssistantWidget({ 
  weakTopics = [], 
  className = "" 
}: LearningAssistantWidgetProps) {
  const [isHovered, setIsHovered] = useState(false);

  const quickQuestions = [
    "What are my weak areas?",
    "Help me with algebra",
    "Explain linear equations",
    "Give me practice problems"
  ];

  return (
    <Card 
      className={`p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              AI Learning Assistant
            </h3>
            <p className="text-sm text-gray-600">
              Get personalized help with your studies
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            New
          </Badge>
        </div>
      </div>

      {/* Weak Topics Preview */}
      {weakTopics.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Topics you might need help with:
          </p>
          <div className="flex flex-wrap gap-2">
            {weakTopics.slice(0, 3).map((topic, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {topic}
              </Badge>
            ))}
            {weakTopics.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{weakTopics.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Quick Questions */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Quick questions to get started:</p>
        <div className="grid grid-cols-1 gap-1">
          {quickQuestions.slice(0, 2).map((question, index) => (
            <div key={index} className="text-xs text-gray-500 flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              "{question}"
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <Link href="/learning-assistant">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Start Chatting
          <ArrowRight className={`w-4 h-4 ml-2 transition-transform duration-200 ${
            isHovered ? 'translate-x-1' : ''
          }`} />
        </Button>
      </Link>
    </Card>
  );
}