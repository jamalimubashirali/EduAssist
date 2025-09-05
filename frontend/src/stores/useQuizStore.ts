import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Question } from '@/types';

interface QuizState {
  quizId: string | null;
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: (number | null)[];
  startTime: number | null;
  endTime: number | null;
  isSubmitting: boolean;
  error: string | null;

  startQuiz: (quizId: string, questions: Question[]) => void;
  answerQuestion: (questionIndex: number, answerIndex: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  submitQuiz: () => void;
  endQuiz: () => void;
  setError: (error: string | null) => void;
}

export const useQuizStore = create<QuizState>()(
  devtools(
    (set, get) => ({
      quizId: null,
      questions: [],
      currentQuestionIndex: 0,
      userAnswers: [],
      startTime: null,
      endTime: null,
      isSubmitting: false,
      error: null,

      startQuiz: (quizId, questions) => {
        set({
          quizId,
          questions,
          currentQuestionIndex: 0,
          userAnswers: Array(questions.length).fill(null),
          startTime: Date.now(),
          endTime: null,
          isSubmitting: false,
          error: null,
        });
      },

      answerQuestion: (questionIndex, answerIndex) => {
        const { userAnswers } = get();
        const newUserAnswers = [...userAnswers];
        newUserAnswers[questionIndex] = answerIndex;
        set({ userAnswers: newUserAnswers });
      },

      nextQuestion: () => {
        const { currentQuestionIndex, questions } = get();
        if (currentQuestionIndex < questions.length - 1) {
          set({ currentQuestionIndex: currentQuestionIndex + 1 });
        }
      },

      previousQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
      },

      submitQuiz: () => set({ isSubmitting: true }),

      endQuiz: () => {
        set({
          endTime: Date.now(),
          isSubmitting: false,
        });
      },
      
      setError: (error) => set({ error }),
    }),
    { name: 'quiz-store' }
  )
);
