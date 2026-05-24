'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Assignment } from '@/types';
import clsx from 'clsx';

interface Props {
  assignment: Assignment;
  onDelete: (id: string) => void;
}

const STATUS_STYLES: Record<Assignment['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export default function AssignmentCard({ assignment, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formattedCreated = format(new Date(assignment.createdAt), 'dd-MM-yyyy');
  const formattedDue = format(new Date(assignment.dueDate), 'dd-MM-yyyy');

  return (
    <div className="card p-4 hover:shadow-card-hover transition-shadow relative group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Link
            href={
              assignment.status === 'completed'
                ? `/assignments/${assignment._id}/result`
                : `/assignments/${assignment._id}`
            }
            className="block"
          >
            <h3 className="font-semibold text-veda-text underline underline-offset-2 text-sm lg:text-base truncate hover:text-primary transition-colors">
              {assignment.title}
            </h3>
          </Link>
          {assignment.subject && (
            <p className="text-xs text-veda-muted mt-0.5">{assignment.subject} · Class {assignment.className}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium capitalize', STATUS_STYLES[assignment.status])}>
            {assignment.status}
          </span>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-veda-muted"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 w-44 bg-white border border-veda-border rounded-xl shadow-lg z-10 overflow-hidden">
                <Link
                  href={
                    assignment.status === 'completed'
                      ? `/assignments/${assignment._id}/result`
                      : `/assignments/${assignment._id}`
                  }
                  className="block px-4 py-2.5 text-sm text-veda-text hover:bg-gray-50 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  View Assignment
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(assignment._id); }}
                  className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-veda-muted">
        <span><span className="font-medium">Assigned on</span> : {formattedCreated}</span>
        <span><span className="font-medium">Due</span> : {formattedDue}</span>
      </div>

      {assignment.status === 'processing' && (
        <div className="mt-3">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
          <p className="text-xs text-veda-muted mt-1">Generating question paper…</p>
        </div>
      )}
    </div>
  );
}
