export interface Document {
  id: string;
  filename: string;
  status: "queued" | "processing" | "ready" | "failed";
  page_count?: number;
  error_message?: string;
  created_at: string;
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

export interface StudyPlanResponse {
  id: string;
  goal: string;
  available_hours_per_day: number;
  deadline: string;
  created_at: string;
  updated_at: string;
}

export interface StudyTaskResponse {
  id: string;
  plan_id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface StudyPlanWithTasks {
  plan: StudyPlanResponse;
  tasks: StudyTaskResponse[];
}

export interface CareerRecommendationResponse {
  id: string;
  recommended_roles: string[];
  skill_gaps: string[];
  recommended_skills: string[];
  learning_paths: string[];
  created_at: string;
}
