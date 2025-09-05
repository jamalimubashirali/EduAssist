export type DummyQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
  timeLimit?: number; // seconds
};

export type DummyQuiz = {
  id: string;
  title: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: DummyQuestion[];
  totalQuestions: number;
  estimatedTime: number; // minutes
  xpReward: number;
  description: string;
};

// Question pools by subject and difficulty
const questionPools = {
  mathematics: {
    easy: [
      {
        question: "What is 15 + 27?",
        options: ["42", "41", "43", "40"],
        correctAnswerIndex: 0,
        explanation: "15 + 27 = 42. Simple addition of two-digit numbers."
      },
      {
        question: "What is 8 × 7?",
        options: ["54", "56", "58", "52"],
        correctAnswerIndex: 1,
        explanation: "8 × 7 = 56. This is a basic multiplication fact."
      },
      {
        question: "What is 100 ÷ 4?",
        options: ["20", "25", "30", "15"],
        correctAnswerIndex: 1,
        explanation: "100 ÷ 4 = 25. Dividing 100 by 4 gives us 25."
      }
    ],
    medium: [
      {
        question: "Solve for x: 2x + 5 = 15",
        options: ["x = 5", "x = 10", "x = 7", "x = 3"],
        correctAnswerIndex: 0,
        explanation: "2x + 5 = 15, so 2x = 10, therefore x = 5."
      },
      {
        question: "What is the area of a rectangle with length 8 and width 6?",
        options: ["48", "28", "14", "42"],
        correctAnswerIndex: 0,
        explanation: "Area = length × width = 8 × 6 = 48 square units."
      }
    ],
    hard: [
      {
        question: "What is the derivative of x² + 3x - 2?",
        options: ["2x + 3", "x² + 3", "2x - 2", "x + 3"],
        correctAnswerIndex: 0,
        explanation: "The derivative of x² is 2x, derivative of 3x is 3, and derivative of constant -2 is 0."
      }
    ]
  },
  science: {
    easy: [
      {
        question: "What is the chemical symbol for water?",
        options: ["H2O", "CO2", "O2", "H2"],
        correctAnswerIndex: 0,
        explanation: "Water is composed of 2 hydrogen atoms and 1 oxygen atom, hence H2O."
      },
      {
        question: "How many planets are in our solar system?",
        options: ["7", "8", "9", "10"],
        correctAnswerIndex: 1,
        explanation: "There are 8 planets in our solar system since Pluto was reclassified as a dwarf planet."
      }
    ],
    medium: [
      {
        question: "What is the speed of light in vacuum?",
        options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "200,000 km/s"],
        correctAnswerIndex: 0,
        explanation: "The speed of light in vacuum is approximately 300,000 kilometers per second."
      }
    ],
    hard: [
      {
        question: "What is the Heisenberg Uncertainty Principle?",
        options: [
          "You cannot simultaneously know position and momentum precisely",
          "Energy cannot be created or destroyed",
          "Matter and energy are equivalent",
          "Time is relative to the observer"
        ],
        correctAnswerIndex: 0,
        explanation: "The Heisenberg Uncertainty Principle states that you cannot simultaneously determine both the position and momentum of a particle with perfect accuracy."
      }
    ]
  },
  english: {
    easy: [
      {
        question: "What is the plural of 'child'?",
        options: ["childs", "children", "childes", "child"],
        correctAnswerIndex: 1,
        explanation: "'Children' is the irregular plural form of 'child'."
      }
    ],
    medium: [
      {
        question: "Who wrote 'Romeo and Juliet'?",
        options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
        correctAnswerIndex: 1,
        explanation: "William Shakespeare wrote the famous tragedy 'Romeo and Juliet' in the early part of his career."
      }
    ],
    hard: [
      {
        question: "What literary device is used in 'The wind whispered through the trees'?",
        options: ["Metaphor", "Simile", "Personification", "Alliteration"],
        correctAnswerIndex: 2,
        explanation: "Personification gives human characteristics (whispering) to non-human things (wind)."
      }
    ]
  }
};

export function generateDummyQuiz(
  subject: string = 'mixed',
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed' = 'mixed',
  questionCount: number = 5
): DummyQuiz {
  const quizId = `dummy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const questions: DummyQuestion[] = [];
  
  // Determine subjects to use
  const subjects = subject === 'mixed' 
    ? Object.keys(questionPools) 
    : [subject.toLowerCase()];
  
  // Determine difficulties to use
  const difficulties = difficulty === 'mixed' 
    ? ['easy', 'medium', 'hard'] as const
    : [difficulty];
  
  // Generate questions
  for (let i = 0; i < questionCount; i++) {
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    
    const pool = questionPools[randomSubject as keyof typeof questionPools]?.[randomDifficulty];
    if (pool && pool.length > 0) {
      const randomQuestion = pool[Math.floor(Math.random() * pool.length)];
      
      questions.push({
        id: `q_${i + 1}_${Date.now()}`,
        question: randomQuestion.question,
        options: randomQuestion.options,
        correctAnswerIndex: randomQuestion.correctAnswerIndex,
        subject: randomSubject,
        difficulty: randomDifficulty,
        explanation: randomQuestion.explanation,
        timeLimit: randomDifficulty === 'easy' ? 30 : randomDifficulty === 'medium' ? 45 : 60
      });
    }
  }
  
  // If we couldn't generate enough questions, fill with random ones
  while (questions.length < questionCount) {
    const fallbackSubject = 'mathematics';
    const fallbackDifficulty = 'easy';
    const fallbackPool = questionPools[fallbackSubject][fallbackDifficulty];
    const randomQuestion = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
    
    questions.push({
      id: `q_fallback_${questions.length + 1}_${Date.now()}`,
      question: randomQuestion.question,
      options: randomQuestion.options,
      correctAnswerIndex: randomQuestion.correctAnswerIndex,
      subject: fallbackSubject,
      difficulty: fallbackDifficulty,
      explanation: randomQuestion.explanation,
      timeLimit: 30
    });
  }
  
  // Calculate XP reward based on difficulty
  const baseXP = 20;
  const difficultyMultiplier = {
    easy: 1,
    medium: 1.5,
    hard: 2
  };
  
  const avgDifficulty = questions.reduce((acc, q) => {
    return acc + difficultyMultiplier[q.difficulty];
  }, 0) / questions.length;
  
  const xpReward = Math.round(baseXP * questionCount * avgDifficulty);
  
  return {
    id: quizId,
    title: subject === 'mixed' ? 'Mixed Knowledge Quiz' : `${subject.charAt(0).toUpperCase() + subject.slice(1)} Quiz`,
    subject: subject === 'mixed' ? 'General Knowledge' : subject,
    difficulty: difficulty === 'mixed' ? 'medium' : difficulty,
    questions,
    totalQuestions: questions.length,
    estimatedTime: Math.ceil(questions.length * 1.5), // 1.5 minutes per question
    xpReward,
    description: `Test your knowledge with ${questions.length} carefully selected questions!`
  };
}

// Helper function to get a quick quiz
export function generateQuickQuiz(): DummyQuiz {
  return generateDummyQuiz('mixed', 'easy', 5);
}

// Helper function to get a challenge quiz
export function generateChallengeQuiz(): DummyQuiz {
  return generateDummyQuiz('mixed', 'hard', 7);
}

// Helper function to get subject-specific quiz
export function generateSubjectQuiz(subject: string): DummyQuiz {
  return generateDummyQuiz(subject, 'mixed', 6);
}
