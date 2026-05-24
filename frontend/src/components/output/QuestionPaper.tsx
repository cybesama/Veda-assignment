'use client';
import { GeneratedPaper, Question, Section, DifficultyLevel } from '@/types';
import clsx from 'clsx';

interface Props {
  paper: GeneratedPaper;
}

const DIFFICULTY_STYLES: Record<DifficultyLevel, string> = {
  easy: 'bg-green-100 text-green-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Hard',
};

export default function QuestionPaper({ paper }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-veda-border overflow-hidden print:border-0 print:rounded-none">
      <PaperHeader paper={paper} />
      <div className="p-6 lg:p-10 space-y-8 print:p-8">
        <StudentInfoSection />
        {paper.sections.map((section) => (
          <SectionBlock key={section.id} section={section} />
        ))}
        <div className="pt-4 border-t border-gray-200 text-center">
          <p className="text-sm font-bold text-veda-text">— End of Question Paper —</p>
        </div>
        {paper.answerKey && paper.answerKey.length > 0 && (
          <AnswerKeySection paper={paper} />
        )}
      </div>
    </div>
  );
}

function PaperHeader({ paper }: { paper: GeneratedPaper }) {
  return (
    <div className="text-center border-b border-gray-200 p-6 lg:p-8 bg-gray-50">
      <h1 className="text-xl lg:text-2xl font-bold text-veda-text">{paper.school}</h1>
      <p className="font-semibold text-base lg:text-lg mt-1">Subject: {paper.subject}</p>
      <p className="font-semibold text-base lg:text-lg">Class: {paper.className}</p>

      <div className="flex justify-between items-center mt-4 text-sm">
        <span><strong>Time Allowed:</strong> {paper.timeAllowed}</span>
        <span><strong>Maximum Marks:</strong> {paper.maxMarks}</span>
      </div>

      {paper.generalInstructions && paper.generalInstructions.length > 0 && (
        <div className="mt-4 text-left">
          {paper.generalInstructions.map((inst, i) => (
            <p key={i} className="text-sm font-medium text-veda-text">{inst}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentInfoSection() {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium text-veda-text w-32">Name:</span>
        <div className="flex-1 border-b border-gray-400 h-6" />
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-veda-text w-32">Roll Number:</span>
        <div className="w-40 border-b border-gray-400 h-6" />
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-veda-text w-32">Class & Section:</span>
        <div className="w-32 border-b border-gray-400 h-6" />
      </div>
    </div>
  );
}

function SectionBlock({ section }: { section: Section }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-base lg:text-lg font-bold text-veda-text">{section.title}</h2>
      </div>
      <div>
        <p className="font-semibold text-sm text-veda-text">{section.type}</p>
        <p className="text-sm italic text-veda-muted">{section.instruction}</p>
      </div>
      <ol className="space-y-3">
        {section.questions.map((q) => (
          <QuestionItem key={q.number} question={q} />
        ))}
      </ol>
    </div>
  );
}

function QuestionItem({ question }: { question: Question }) {
  const diff = (question.difficulty?.toLowerCase() as DifficultyLevel) || 'moderate';
  return (
    <li className="flex gap-3">
      <span className="font-medium text-veda-text text-sm flex-shrink-0 w-6">{question.number}.</span>
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-start gap-2">
          <span
            className={clsx(
              'text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0',
              DIFFICULTY_STYLES[diff] || DIFFICULTY_STYLES.moderate
            )}
          >
            {DIFFICULTY_LABELS[diff] || diff}
          </span>
          <p className="text-sm text-veda-text flex-1">{question.text}</p>
          <span className="text-xs font-semibold text-veda-muted flex-shrink-0 whitespace-nowrap">
            [{question.marks} {question.marks === 1 ? 'Mark' : 'Marks'}]
          </span>
        </div>

        {question.options && question.options.length > 0 && (
          <ol className="pl-2 space-y-1" type="a">
            {question.options.map((opt, i) => (
              <li key={i} className="text-sm text-veda-text flex gap-2">
                <span className="font-medium flex-shrink-0">({String.fromCharCode(97 + i)})</span>
                <span>{opt}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </li>
  );
}

function AnswerKeySection({ paper }: { paper: GeneratedPaper }) {
  const grouped: Record<string, typeof paper.answerKey> = {};
  paper.answerKey.forEach((entry) => {
    if (!grouped[entry.sectionId]) grouped[entry.sectionId] = [];
    grouped[entry.sectionId].push(entry);
  });

  return (
    <div className="border-t-2 border-gray-200 pt-6">
      <h2 className="text-base font-bold text-veda-text mb-4">Answer Key:</h2>
      {Object.entries(grouped).map(([sectionId, answers]) => {
        const section = paper.sections.find((s) => s.id === sectionId);
        return (
          <div key={sectionId} className="mb-4">
            {Object.keys(grouped).length > 1 && (
              <p className="text-sm font-semibold text-veda-muted mb-2">
                {section?.title || `Section ${sectionId}`}
              </p>
            )}
            <ol className="space-y-2">
              {answers.map((entry) => (
                <li key={entry.number} className="flex gap-3 text-sm">
                  <span className="font-medium text-veda-text flex-shrink-0 w-6">{entry.number}.</span>
                  <span className="text-veda-text">{entry.answer}</span>
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </div>
  );
}
