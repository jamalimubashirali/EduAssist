'use client'

import React, { useState, useEffect } from 'react'
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation'
import { useUserStore } from '@/stores/useUserStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, ArrowLeft, ArrowRight, Send } from 'lucide-react'
import { toast } from 'sonner'
import { generateAssessment } from '@/services/assessmentService'
import { Question } from '@/types'

import { userService } from '@/services/userService'
import { convertBackendQuestion } from '@/lib/typeConverters'
import { useAssessmentResultsStore } from '@/stores/assessmentResultsStore'

export default function Assessment() {
  const { handleNext, isLoading: isNavigating, error: navigationError } = useOnboardingNavigation({
    currentStep: 'assessment',
    nextStep: 'onboarding-assessment-results', // Show results page after assessment
  });
  const { user, setUser } = useUserStore();
  const { setResults } = useAssessmentResultsStore();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: string; timeTaken: number }>>({});
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
  
  // Timer state - 30 minutes = 1800 seconds
  const [timeLeft, setTimeLeft] = useState(1800);
  const [assessmentStartTime, setAssessmentStartTime] = useState<number | null>(null);

  useEffect(() => {
    console.log('user:', user);
    console.log('user.preferences:', user?.preferences);
    if (!user) return;
    // Only fetch questions if user has preferences (should be subject IDs)
    if (Array.isArray(user.preferences) && user.preferences.length > 0) {
      setIsLoadingQuestions(true);
      generateAssessment(user.preferences, user.id)
        .then((assessmentQuestions) => {
          console.log('Fetched assessment questions:', assessmentQuestions);
          // Convert backend questions to frontend format
          const convertedQuestions = assessmentQuestions.map(q => convertBackendQuestion(q));
          console.log('Converted assessment questions:', convertedQuestions);
          if (convertedQuestions && convertedQuestions.length > 0 && convertedQuestions.every(q => q.id && typeof q.id === 'string')) {
            setQuestions(convertedQuestions);
            setCurrentQuestionIndex(0);
            setQuestionStartTime(Date.now());
            setAssessmentStartTime(Date.now()); // Start the assessment timer
          } else {
            setQuestions([]);
          }
        })
        .catch(() => setQuestions([]))
        .finally(() => setIsLoadingQuestions(false));
    } else {
      setQuestions([]);
      setIsLoadingQuestions(false);
    }
  }, [user]);

  useEffect(() => {
    // Fix: set timer when question index changes
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  // Timer countdown effect
  useEffect(() => {
    if (!assessmentStartTime || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-submit when time runs out
          handleSubmitAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [assessmentStartTime, timeLeft]);

  // Format time display (MM:SS)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoadingQuestions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-semibold">Loading Assessment...</p>
          <p className="text-sm text-gray-600">Please wait while we prepare your questions.</p>
        </div>
      </div>
    );
  }

  // If no valid questions, show message
  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-semibold">No Assessment Available</p>
          <p className="text-sm text-gray-600">No valid questions found for your preferences. Please update your subjects or try again later.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestion?.id]?.answer || '';

  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswerSelect = (answer: string) => {
    if (!questionStartTime) return; // Prevent timing error before mount
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: { answer, timeTaken },
    };
    console.log('Selected answer:', answer, 'for question:', currentQuestion.id, 'All answers:', newAnswers);
    setAnswers(newAnswers);
  };

  const goToNextQuestion = () => {
    if (!isLastQuestion) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      setQuestionStartTime(Date.now());
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(newIndex);
      setQuestionStartTime(Date.now());
    }
  };

  const handleSubmitAssessment = async () => {
    if (Object.keys(answers).length !== questions.length) {
      toast.warning("Please answer all questions before submitting.");
      return;
    }

    if (!user) {
      toast.error('User not found. Please log in again.');
      return;
    }

    // Prepare answers in backend format
    const formattedAnswers = Object.entries(answers).map(([question_id, value]) => ({
      question_id,
      user_answer: value.answer,
      time_taken: value.timeTaken,
    }));

    // Use userService.submitAssessment to send to backend
    try {
      const results = await userService.submitAssessment(user.id, {
        answers: formattedAnswers,
        started_at: new Date().toISOString(), // You may want to track actual start time
        completed_at: new Date().toISOString(),
      });
      setResults(results); // Save results to store
      toast.success('Assessment submitted successfully!');
      handleNext(); // Navigate to results page
    } catch (error) {
      toast.error('Failed to submit assessment. Please try again.');
    }
  };

  // Get subject name, avoid showing 'General'
  const getSubjectDisplay = () => {
    const subjectName = currentQuestion.subject?.subjectName || currentQuestion.subject?.name;
    if (!subjectName || subjectName.toLowerCase() === 'general') {
      return null; // Don't show anything for General
    }
    return subjectName;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-4xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Onboarding Assessment</CardTitle>
            <div className="flex justify-between items-center mt-4">
              <Badge 
                variant="secondary" 
                className={`flex items-center gap-2 ${timeLeft < 300 ? 'bg-red-100 text-red-800' : timeLeft < 600 ? 'bg-yellow-100 text-yellow-800' : ''}`}
              >
                <Clock className="h-4 w-4" />
                <span>Time Left: {formatTime(timeLeft)}</span>
              </Badge>
              <div>
                {getSubjectDisplay() && (
                  <Badge variant="outline">{getSubjectDisplay()}</Badge>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 text-center mt-2">{`Question ${currentQuestionIndex + 1} of ${questions.length}`}</p>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">{currentQuestion.questionText}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.answerOptions.map((option) => (
                  <Button
                    key={option}
                    variant={selectedAnswer === option ? 'default' : 'outline'}
                    className="w-full h-auto text-left justify-start p-4 whitespace-normal"
                    onClick={() => handleAnswerSelect(option)}
                  >
                    <div className="flex items-center">
                      {selectedAnswer === option && <CheckCircle className="h-5 w-5 mr-3 text-white" />}
                      <span>{option}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={goToPreviousQuestion} disabled={currentQuestionIndex === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              {!isLastQuestion ? (
                <Button onClick={goToNextQuestion} disabled={!selectedAnswer}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmitAssessment} disabled={!selectedAnswer} className="bg-green-600 hover:bg-green-700">
                  Submit Assessment <Send className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}