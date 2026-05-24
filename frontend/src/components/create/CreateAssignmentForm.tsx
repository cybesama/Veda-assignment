'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import FileUpload from './FileUpload';
import QuestionTypeRow from './QuestionTypeRow';
import { useFormStore, useAssignmentStore } from '@/store/assignmentStore';
import { createAssignment } from '@/lib/api';
import { QUESTION_TYPE_OPTIONS, QuestionTypeName } from '@/types';
import clsx from 'clsx';

const STEPS = ['Assignment Details', 'Additional Info'];

export default function CreateAssignmentForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { formData, setField, addQuestionType, totalQuestions, totalMarks, resetForm } = useFormStore();
  const { setCurrentAssignment } = useAssignmentStore();

  useEffect(() => { resetForm(); }, []);

  const usedTypes = new Set(formData.questionTypes.map((q) => q.type)) as Set<QuestionTypeName>;
  const canAddMore = QUESTION_TYPE_OPTIONS.length > formData.questionTypes.length;

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!formData.title.trim()) errs.title = 'Title is required';
    if (!formData.subject.trim()) errs.subject = 'Subject is required';
    if (!formData.className.trim()) errs.className = 'Class is required';
    if (!formData.dueDate) errs.dueDate = 'Due date is required';
    else if (new Date(formData.dueDate) < new Date()) errs.dueDate = 'Due date must be in the future';
    if (formData.questionTypes.length === 0) errs.questionTypes = 'Add at least one question type';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) { toast.error('Please fix the errors before submitting'); return; }
    setSubmitting(true);
    try {
      const assignment = await createAssignment(formData);
      setCurrentAssignment(assignment);
      toast.success('Assignment created! Generating question paper…');
      resetForm();
      router.push(`/assignments/${assignment._id}/result`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create assignment';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className={clsx('h-1.5 flex-1 rounded-full transition-all', i <= step ? 'bg-veda-dark' : 'bg-gray-200')} />
          ))}
        </div>
      </div>

      <div className="card p-6">
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-veda-text">Assignment Details</h2>
              <p className="text-sm text-veda-muted">Basic information about your assignment</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-veda-text block mb-1.5">
                  Assignment Title <span className="text-red-500">*</span>
                </label>
                <input
                  className={clsx('input', errors.title && 'border-red-400 focus:border-red-400 focus:ring-red-100')}
                  placeholder="e.g. Quiz on Electricity"
                  value={formData.title}
                  onChange={(e) => { setField('title', e.target.value); setErrors((p) => ({ ...p, title: '' })); }}
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-veda-text block mb-1.5">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  className={clsx('input', errors.subject && 'border-red-400')}
                  placeholder="e.g. Physics"
                  value={formData.subject}
                  onChange={(e) => { setField('subject', e.target.value); setErrors((p) => ({ ...p, subject: '' })); }}
                />
                {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-veda-text block mb-1.5">
                  Class <span className="text-red-500">*</span>
                </label>
                <input
                  className={clsx('input', errors.className && 'border-red-400')}
                  placeholder="e.g. 8th or Grade 10"
                  value={formData.className}
                  onChange={(e) => { setField('className', e.target.value); setErrors((p) => ({ ...p, className: '' })); }}
                />
                {errors.className && <p className="text-red-500 text-xs mt-1">{errors.className}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-veda-text block mb-1.5">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className={clsx('input', errors.dueDate && 'border-red-400')}
                  value={formData.dueDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => { setField('dueDate', e.target.value); setErrors((p) => ({ ...p, dueDate: '' })); }}
                />
                {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-veda-text block mb-1.5">
                Reference File <span className="text-veda-muted font-normal">(optional)</span>
              </label>
              <FileUpload value={formData.file} onChange={(f) => setField('file', f)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-veda-text">Question Paper Setup</h2>
              <p className="text-sm text-veda-muted">Configure question types and marks</p>
            </div>

            <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-x-4 px-1">
              <span className="text-xs font-semibold text-veda-muted uppercase tracking-wide">Question Type</span>
              <span className="text-xs font-semibold text-veda-muted uppercase tracking-wide w-28 text-center">No. of Questions</span>
              <span className="text-xs font-semibold text-veda-muted uppercase tracking-wide w-24 text-center">Marks</span>
            </div>

            <div className="space-y-3">
              {formData.questionTypes.map((entry) => (
                <QuestionTypeRow
                  key={entry.id}
                  entry={entry}
                  disableDelete={formData.questionTypes.length === 1}
                  usedTypes={usedTypes}
                />
              ))}
            </div>

            {errors.questionTypes && <p className="text-red-500 text-xs">{errors.questionTypes}</p>}

            {canAddMore && (
              <button
                type="button"
                onClick={addQuestionType}
                className="flex items-center gap-2 text-sm font-medium text-veda-text hover:text-primary transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-veda-dark text-white flex items-center justify-center text-lg leading-none">+</span>
                Add Question Type
              </button>
            )}

            <div className="flex justify-end gap-6 pt-2 border-t border-veda-border text-sm">
              <span className="text-veda-muted">Total Questions: <strong className="text-veda-text">{totalQuestions()}</strong></span>
              <span className="text-veda-muted">Total Marks: <strong className="text-veda-text">{totalMarks()}</strong></span>
            </div>

            <div>
              <label className="text-sm font-medium text-veda-text block mb-1.5">
                Additional Instructions <span className="text-veda-muted font-normal">(For better output)</span>
              </label>
              <div className="relative">
                <textarea
                  className="input resize-none h-28 pr-10"
                  placeholder="e.g. Generate a question paper for 3 hour exam duration, CBSE pattern..."
                  value={formData.additionalInstructions}
                  onChange={(e) => setField('additionalInstructions', e.target.value)}
                />
                <button type="button" className="absolute right-3 bottom-3 text-veda-muted hover:text-primary transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6 pb-8">
        <button
          type="button"
          onClick={() => step === 0 ? router.back() : setStep(0)}
          className="btn-secondary"
        >
          ← Previous
        </button>
        {step === 0 ? (
          <button type="button" onClick={() => setStep(1)} className="btn-primary">
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating…
              </>
            ) : (
              <>✦ Generate Paper</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
