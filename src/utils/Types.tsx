export interface Answers {
  [key: number]: number | string;
}

export interface QuizResult {
  date: Date;
  score: number;
  totalQuestions: number;
  answers: Answers;
}

export interface TimedOutQuestions {
  [key: number]: boolean;
}

export interface QuestionTimers {
  [key: number]: number;
}



export interface QuizResult {
  id?: number;
  date: Date;
  score: number;
  totalQuestions: number;
  answers: Answers;
}

export interface ChartDataPoint {
  date: string;
  score: number;
}

// Enhanced types to support different question types
export interface BaseQuestion {
  id: number;
  question: string;
  type: 'mcq' | 'integer';
}

export interface McqQuestion extends BaseQuestion {
  type: 'mcq';
  options: string[];
  correct: number;
}

export interface IntegerQuestion extends BaseQuestion {
  type: 'integer';
  correct: number;
  min?: number;
  max?: number;
}

export type Question = McqQuestion | IntegerQuestion;

// Update the Answers type to handle both string and number values
export type AnswersEnhanced = {
  [key: number]: number | string;
};