export type QuestionTypeName =
  | 'multiple-choice'
  | 'short-answer'
  | 'long-answer'
  | 'diagram-graph'
  | 'numerical'
  | 'true-false'
  | 'fill-blank';

export const QUESTION_TYPE_OPTIONS: { value: QuestionTypeName; label: string }[] = [
  { value: 'multiple-choice', label: 'Multiple Choice Questions' },
  { value: 'short-answer', label: 'Short Answer Questions' },
  { value: 'long-answer', label: 'Long Answer Questions' },
  { value: 'diagram-graph', label: 'Diagram/Graph-Based Questions' },
  { value: 'numerical', label: 'Numerical Problems' },
  { value: 'true-false', label: 'True/False Questions' },
  { value: 'fill-blank', label: 'Fill in the Blanks' },
];

export interface QuestionTypeEntry {
  id: string;
  type: QuestionTypeName;
  label: string;
  count: number;
  marks: number;
}

export interface AssignmentFormData {
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  questionTypes: QuestionTypeEntry[];
  additionalInstructions: string;
  file: File | null;
}

export type DifficultyLevel = 'easy' | 'moderate' | 'hard';

export interface Question {
  number: number;
  text: string;
  difficulty: DifficultyLevel;
  marks: number;
  options?: string[];
}

export interface Section {
  id: string;
  title: string;
  type: string;
  instruction: string;
  questions: Question[];
}

export interface AnswerKeyEntry {
  number: number;
  sectionId: string;
  answer: string;
}

export interface GeneratedPaper {
  school: string;
  subject: string;
  className: string;
  timeAllowed: string;
  maxMarks: number;
  generalInstructions: string[];
  sections: Section[];
  answerKey: AnswerKeyEntry[];
}

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  questionTypes: QuestionTypeEntry[];
  additionalInstructions: string;
  filePath?: string;
  fileName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentResult {
  _id: string;
  assignmentId: string;
  paper: GeneratedPaper;
  createdAt: string;
}

export interface JobStatus {
  jobId: string | undefined;
  assignmentId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  error?: string;
  resultId?: string;
}

export type WSMessage =
  | { type: 'connected'; id: string }
  | { type: 'job:progress'; payload: JobStatus }
  | { type: 'job:completed'; payload: JobStatus & { resultId: string } }
  | { type: 'job:failed'; payload: JobStatus };
