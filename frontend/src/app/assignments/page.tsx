'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AppLayout from '@/components/layout/AppLayout';
import Header from '@/components/layout/Header';
import AssignmentCard from '@/components/assignments/AssignmentCard';
import EmptyState from '@/components/assignments/EmptyState';
import { useAssignmentStore } from '@/store/assignmentStore';
import { fetchAssignments, deleteAssignment } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function AssignmentsPage() {
  const [search, setSearch] = useState('');
  const { assignments, setAssignments, removeAssignment, isLoading, setLoading, setError } = useAssignmentStore();
  useWebSocket();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAssignments({ search: search || undefined });
      setAssignments(data);
    } catch {
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [search, setAssignments, setLoading, setError]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this assignment and its generated paper?')) return;
    try {
      await deleteAssignment(id);
      removeAssignment(id);
      toast.success('Assignment deleted');
    } catch {
      toast.error('Failed to delete assignment');
    }
  }

  const hasResults = assignments.length > 0;

  return (
    <AppLayout>
      <Header title="Assignment" />
      <div className="p-4 lg:p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
          <div>
            <h1 className="text-xl font-bold text-veda-text">Assignments</h1>
            <p className="text-sm text-veda-muted">Manage and create assignments for your classes.</p>
          </div>
        </div>

        {hasResults && (
          <div className="flex items-center gap-3 mb-6">
            <button className="flex items-center gap-1.5 text-sm text-veda-muted border border-veda-border bg-white rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter By
            </button>
            <div className="flex-1 relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-veda-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="input pl-9"
                placeholder="Search Assignment"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : hasResults ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {assignments.map((a) => (
                <AssignmentCard key={a._id} assignment={a} onDelete={handleDelete} />
              ))}
            </div>
            <div className="fixed bottom-20 lg:bottom-8 right-6 lg:right-8">
              <Link href="/assignments/create" className="btn-primary shadow-lg text-base px-6 py-3">
                + Create Assignment
              </Link>
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </AppLayout>
  );
}
