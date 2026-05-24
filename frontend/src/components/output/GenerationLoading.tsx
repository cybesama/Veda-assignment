'use client';
import { JobStatus } from '@/types';

interface Props {
  jobStatus: JobStatus | null;
  assignmentTitle?: string;
}

export default function GenerationLoading({ jobStatus, assignmentTitle }: Props) {
  const progress = jobStatus?.progress ?? 0;

  const stages = [
    { label: 'Analyzing requirements', threshold: 20 },
    { label: 'Building prompt', threshold: 30 },
    { label: 'Generating questions with AI', threshold: 75 },
    { label: 'Structuring paper', threshold: 90 },
    { label: 'Finalizing output', threshold: 100 },
  ];

  const currentStage = stages.findLast((s) => progress >= s.threshold - 20) || stages[0];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="relative w-24 h-24 mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E5EA" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="42" fill="none" stroke="#E95C2F" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 42}`}
            strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-veda-text">{progress}%</span>
        </div>
      </div>

      <h2 className="text-xl font-bold text-veda-text mb-2">Generating Question Paper</h2>
      {assignmentTitle && (
        <p className="text-veda-muted text-sm mb-4">for "{assignmentTitle}"</p>
      )}

      <div className="w-full max-w-sm mb-6">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="text-sm text-veda-muted animate-pulse">{currentStage.label}…</p>

      <div className="mt-8 grid grid-cols-1 gap-2 w-full max-w-xs">
        {stages.map((stage) => (
          <div key={stage.label} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
              progress >= stage.threshold ? 'bg-primary' : 'bg-gray-200'
            }`}>
              {progress >= stage.threshold && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`text-xs ${progress >= stage.threshold ? 'text-veda-text font-medium' : 'text-veda-muted'}`}>
              {stage.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
