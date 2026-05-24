'use client';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  Assignment,
  AssignmentFormData,
  AssignmentResult,
  JobStatus,
  QuestionTypeEntry,
  QuestionTypeName,
  QUESTION_TYPE_OPTIONS,
} from '@/types';

function genId(): string {
  return Math.random().toString(36).slice(2, 9);
}

interface FormState {
  formData: AssignmentFormData;
  setField: <K extends keyof AssignmentFormData>(key: K, value: AssignmentFormData[K]) => void;
  addQuestionType: () => void;
  removeQuestionType: (id: string) => void;
  updateQuestionType: (
    id: string,
    field: 'type' | 'count' | 'marks',
    value: QuestionTypeName | number
  ) => void;
  resetForm: () => void;
  totalQuestions: () => number;
  totalMarks: () => number;
}

interface AssignmentState {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  currentResult: AssignmentResult | null;
  jobStatus: JobStatus | null;
  isLoading: boolean;
  error: string | null;

  setAssignments: (assignments: Assignment[]) => void;
  setCurrentAssignment: (a: Assignment | null) => void;
  setCurrentResult: (r: AssignmentResult | null) => void;
  setJobStatus: (s: JobStatus | null) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  removeAssignment: (id: string) => void;
  updateAssignmentStatus: (id: string, status: Assignment['status']) => void;
}

const defaultQuestionTypes = (): QuestionTypeEntry[] => [
  {
    id: genId(),
    type: 'multiple-choice',
    label: 'Multiple Choice Questions',
    count: 4,
    marks: 1,
  },
];

const defaultFormData = (): AssignmentFormData => ({
  title: '',
  subject: '',
  className: '',
  dueDate: '',
  questionTypes: defaultQuestionTypes(),
  additionalInstructions: '',
  file: null,
});

export const useFormStore = create<FormState>()(
  devtools(
    (set, get) => ({
      formData: defaultFormData(),

      setField: (key, value) =>
        set((s) => ({ formData: { ...s.formData, [key]: value } })),

      addQuestionType: () =>
        set((s) => {
          const used = new Set(s.formData.questionTypes.map((q) => q.type));
          const next = QUESTION_TYPE_OPTIONS.find((o) => !used.has(o.value));
          if (!next) return s;
          const entry: QuestionTypeEntry = {
            id: genId(),
            type: next.value,
            label: next.label,
            count: 3,
            marks: 2,
          };
          return {
            formData: {
              ...s.formData,
              questionTypes: [...s.formData.questionTypes, entry],
            },
          };
        }),

      removeQuestionType: (id) =>
        set((s) => ({
          formData: {
            ...s.formData,
            questionTypes: s.formData.questionTypes.filter((q) => q.id !== id),
          },
        })),

      updateQuestionType: (id, field, value) =>
        set((s) => ({
          formData: {
            ...s.formData,
            questionTypes: s.formData.questionTypes.map((q) => {
              if (q.id !== id) return q;
              if (field === 'type') {
                const opt = QUESTION_TYPE_OPTIONS.find((o) => o.value === value);
                return { ...q, type: value as QuestionTypeName, label: opt?.label ?? q.label };
              }
              return { ...q, [field]: value };
            }),
          },
        })),

      resetForm: () => set({ formData: defaultFormData() }),

      totalQuestions: () =>
        get().formData.questionTypes.reduce((sum, q) => sum + q.count, 0),

      totalMarks: () =>
        get().formData.questionTypes.reduce((sum, q) => sum + q.count * q.marks, 0),
    }),
    { name: 'form-store' }
  )
);

export const useAssignmentStore = create<AssignmentState>()(
  devtools(
    (set) => ({
      assignments: [],
      currentAssignment: null,
      currentResult: null,
      jobStatus: null,
      isLoading: false,
      error: null,

      setAssignments: (assignments) => set({ assignments }),
      setCurrentAssignment: (a) => set({ currentAssignment: a }),
      setCurrentResult: (r) => set({ currentResult: r }),
      setJobStatus: (s) => set({ jobStatus: s }),
      setLoading: (v) => set({ isLoading: v }),
      setError: (e) => set({ error: e }),

      removeAssignment: (id) =>
        set((s) => ({ assignments: s.assignments.filter((a) => a._id !== id) })),

      updateAssignmentStatus: (id, status) =>
        set((s) => ({
          assignments: s.assignments.map((a) => (a._id === id ? { ...a, status } : a)),
          currentAssignment:
            s.currentAssignment?._id === id
              ? { ...s.currentAssignment, status }
              : s.currentAssignment,
        })),
    }),
    { name: 'assignment-store' }
  )
);
