// Shared type definitions for frontend/backend contract

export interface User {
  id: string;
  email: string;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name?: string;
  education_level?: string;
  subjects: string[];
  goals?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  filename: string;
  status: "queued" | "processing" | "ready" | "failed";
  page_count?: number;
  error_message?: string;
  created_at: string;
}

export interface TutorChat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface TutorMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  is_grounded: boolean;
  citations: Citation[];
  created_at: string;
}

export interface Citation {
  document_id: string;
  document_name: string;
  chunk_index: number;
  page_number?: number;
  excerpt: string;
}

export interface Quiz {
  id: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  status: "generating" | "ready" | "failed";
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  question_text: string;
  options: { label: string; text: string }[];
  order_index: number;
}

export interface QuizAttempt {
  attempt_id: string;
  score: number;
  total_correct: number;
  total_questions: number;
  evaluation: QuizEvaluation;
  details: AttemptDetail[];
}

export interface QuizEvaluation {
  weak_topics: string[];
  strong_topics: string[];
  recommendations: string[];
}

export interface AttemptDetail {
  question_id: string;
  selected: string;
  correct: string;
  is_correct: boolean;
  explanation?: string;
}
