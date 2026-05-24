import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestionTypeEntry {
  id: string;
  type: string;
  label: string;
  count: number;
  marks: number;
}

export interface IAssignment extends Document {
  title: string;
  subject: string;
  className: string;
  dueDate: Date;
  questionTypes: IQuestionTypeEntry[];
  additionalInstructions: string;
  filePath?: string;
  fileName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionTypeEntrySchema = new Schema<IQuestionTypeEntry>({
  id: { type: String, required: true },
  type: { type: String, required: true },
  label: { type: String, required: true },
  count: { type: Number, required: true, min: 1 },
  marks: { type: Number, required: true, min: 1 },
});

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    className: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    questionTypes: { type: [QuestionTypeEntrySchema], required: true },
    additionalInstructions: { type: String, default: '' },
    filePath: { type: String },
    fileName: { type: String },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    jobId: { type: String },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
