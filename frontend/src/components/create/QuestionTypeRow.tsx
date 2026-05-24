'use client';
import { QuestionTypeEntry, QuestionTypeName, QUESTION_TYPE_OPTIONS } from '@/types';
import { useFormStore } from '@/store/assignmentStore';

interface Props {
  entry: QuestionTypeEntry;
  disableDelete: boolean;
  usedTypes: Set<QuestionTypeName>;
}

export default function QuestionTypeRow({ entry, disableDelete, usedTypes }: Props) {
  const { updateQuestionType, removeQuestionType } = useFormStore();

  function counter(field: 'count' | 'marks', delta: number) {
    const next = entry[field] + delta;
    if (next >= 1) updateQuestionType(entry.id, field, next);
  }

  return (
    <div className="bg-white border border-veda-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1">
          <select
            value={entry.type}
            onChange={(e) => updateQuestionType(entry.id, 'type', e.target.value as QuestionTypeName)}
            className="input pr-8 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%236b7280%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22m6 8 4 4 4-4%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] bg-[length:16px]"
          >
            {QUESTION_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={usedTypes.has(opt.value) && opt.value !== entry.type}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {!disableDelete && (
          <button
            type="button"
            onClick={() => removeQuestionType(entry.id)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-veda-border text-veda-muted hover:text-red-500 hover:border-red-200 transition-colors flex-shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-veda-text mb-2">No. of Questions</p>
          <div className="flex items-center gap-2">
            <button type="button" className="counter-btn" onClick={() => counter('count', -1)} disabled={entry.count <= 1}>−</button>
            <span className="w-8 text-center text-sm font-semibold">{entry.count}</span>
            <button type="button" className="counter-btn" onClick={() => counter('count', 1)}>+</button>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-veda-text mb-2">Marks per Question</p>
          <div className="flex items-center gap-2">
            <button type="button" className="counter-btn" onClick={() => counter('marks', -1)} disabled={entry.marks <= 1}>−</button>
            <span className="w-8 text-center text-sm font-semibold">{entry.marks}</span>
            <button type="button" className="counter-btn" onClick={() => counter('marks', 1)}>+</button>
          </div>
        </div>
      </div>
    </div>
  );
}
