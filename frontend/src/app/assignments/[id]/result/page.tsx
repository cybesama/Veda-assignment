'use client';
import { useEffect, useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import AppLayout from '@/components/layout/AppLayout';
import Header from '@/components/layout/Header';
import QuestionPaper from '@/components/output/QuestionPaper';
import GenerationLoading from '@/components/output/GenerationLoading';
import { useAssignmentStore } from '@/store/assignmentStore';
import { fetchAssignment, fetchResult, regenerateAssignment } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import Link from 'next/link';

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const [regenerating, setRegenerating] = useState(false);

  const {
    currentAssignment,
    currentResult,
    jobStatus,
    setCurrentAssignment,
    setCurrentResult,
    setJobStatus,
    isLoading,
    setLoading,
  } = useAssignmentStore();

  useWebSocket(id);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const assignment = await fetchAssignment(id);
      setCurrentAssignment(assignment);

      if (assignment.status === 'completed') {
        const result = await fetchResult(id);
        setCurrentResult(result);
      } else if (assignment.status === 'pending' || assignment.status === 'processing') {
        setJobStatus({
          jobId: assignment.jobId,
          assignmentId: id,
          status: assignment.status === 'pending' ? 'waiting' : 'active',
          progress: assignment.status === 'processing' ? 30 : 5,
        });
      }
    } catch {
      toast.error('Failed to load assignment');
    } finally {
      setLoading(false);
    }
  }, [id, setCurrentAssignment, setCurrentResult, setJobStatus, setLoading]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (jobStatus?.status === 'completed' && !currentResult) {
      fetchResult(id)
        .then(setCurrentResult)
        .catch(() => toast.error('Failed to load result'));
    }
    if (jobStatus?.status === 'failed') {
      toast.error(jobStatus.error || 'Generation failed');
    }
  }, [jobStatus, currentResult, id, setCurrentResult]);

  async function handleRegenerate() {
    if (!confirm('This will discard the current paper and generate a new one. Continue?')) return;
    setRegenerating(true);
    try {
      await regenerateAssignment(id);
      // Clear current result and show loading
      setCurrentResult(null);
      setJobStatus({ jobId: undefined, assignmentId: id, status: 'waiting', progress: 5 });
      setCurrentAssignment(currentAssignment ? { ...currentAssignment, status: 'pending' } : null);
      toast.success('Regenerating question paper…');
    } catch {
      toast.error('Failed to start regeneration');
    } finally {
      setRegenerating(false);
    }
  }

  const isGenerating =
    !currentResult &&
    (currentAssignment?.status === 'pending' ||
      currentAssignment?.status === 'processing' ||
      jobStatus?.status === 'waiting' ||
      jobStatus?.status === 'active');

  const headerRight = currentResult ? (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRegenerate}
        disabled={regenerating}
        className="flex items-center gap-2 text-sm font-medium text-veda-text border border-veda-border bg-white rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <svg className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {regenerating ? 'Starting…' : 'Regenerate'}
      </button>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 text-sm font-medium text-veda-text border border-veda-border bg-white rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download as PDF
      </button>
    </div>
  ) : undefined;

  return (
    <AppLayout>
      <Header title={currentAssignment?.title || 'Assignment'} rightAction={headerRight} />
      <div className="p-4 lg:p-6 pb-16">
        {isLoading && !currentResult && !isGenerating ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isGenerating ? (
          <GenerationLoading jobStatus={jobStatus} assignmentTitle={currentAssignment?.title} />
        ) : currentResult ? (
          <div className="space-y-4">
            <div className="bg-veda-dark text-white rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm leading-relaxed">
                  ✦ Here is your AI-generated question paper for{' '}
                  <strong>{currentResult.paper.subject}</strong> — Class{' '}
                  <strong>{currentResult.paper.className}</strong>. Review the paper below and
                  download it as a PDF when ready.
                </p>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 text-sm border border-white/30 rounded-xl px-4 py-2 hover:bg-white/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download as PDF
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="flex items-center gap-2 text-sm border border-white/30 rounded-xl px-4 py-2 hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  <svg className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {regenerating ? 'Starting…' : 'Regenerate Paper'}
                </button>
              </div>
            </div>
            <QuestionPaper paper={currentResult.paper} />
          </div>
        ) : currentAssignment?.status === 'failed' ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-veda-text mb-2">Generation Failed</h2>
            <p className="text-veda-muted text-sm mb-6">
              {currentAssignment.errorMessage || 'The AI could not generate the question paper. Please try again.'}
            </p>
            <div className="flex items-center gap-3">
              <button onClick={handleRegenerate} disabled={regenerating} className="btn-primary disabled:opacity-50">
                <svg className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {regenerating ? 'Starting…' : 'Try Again'}
              </button>
              <Link href="/assignments/create" className="btn-secondary">
                New Assignment
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
