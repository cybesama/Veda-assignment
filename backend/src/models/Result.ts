import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  number: number;
  text: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  marks: number;
  options?: string[];
}

export interface ISection {
  id: string;
  title: string;
  type: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IAnswerKeyEntry {
  number: number;
  sectionId: string;
  answer: string;
}

export interface IGeneratedPaper {
  school: string;
  subject: string;
  className: string;
  timeAllowed: string;
  maxMarks: number;
  generalInstructions: string[];
  sections: ISection[];
  answerKey: IAnswerKeyEntry[];
}

export interface IResult extends Document {
  assignmentId: mongoose.Types.ObjectId;
  paper: IGeneratedPaper;
  rawPrompt: string;
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  number: { type: Number, required: true },
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'moderate', 'hard'], required: true },
  marks: { type: Number, required: true },
  options: [{ type: String }],
});

const SectionSchema = new Schema<ISection>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: [QuestionSchema],
});

const AnswerKeySchema = new Schema<IAnswerKeyEntry>({
  number: { type: Number, required: true },
  sectionId: { type: String, required: true },
  answer: { type: String, required: true },
});

const GeneratedPaperSchema = new Schema<IGeneratedPaper>({
  school: { type: String, required: true },
  subject: { type: String, required: true },
  className: { type: String, required: true },
  timeAllowed: { type: String, required: true },
  maxMarks: { type: Number, required: true },
  generalInstructions: [{ type: String }],
  sections: [SectionSchema],
  answerKey: [AnswerKeySchema],
});

const ResultSchema = new Schema<IResult>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    paper: { type: GeneratedPaperSchema, required: true },
    rawPrompt: { type: String, required: true },
  },
  { timestamps: true }
);

export const Result = mongoose.model<IResult>('Result', ResultSchema);
