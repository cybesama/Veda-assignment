import Link from 'next/link';

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] px-4 text-center">
      <div className="relative w-48 h-48 mb-8">
        <div className="absolute inset-0 bg-gray-200 rounded-full opacity-40" />
        <div className="absolute inset-4 flex items-center justify-center">
          <svg viewBox="0 0 160 140" className="w-full h-full">
            <rect x="30" y="10" width="80" height="100" rx="8" fill="white" stroke="#E5E5EA" strokeWidth="2" />
            <rect x="40" y="28" width="60" height="4" rx="2" fill="#1C1C1E" />
            <rect x="40" y="40" width="50" height="3" rx="1.5" fill="#E5E5EA" />
            <rect x="40" y="50" width="55" height="3" rx="1.5" fill="#E5E5EA" />
            <rect x="40" y="60" width="45" height="3" rx="1.5" fill="#E5E5EA" />
            <circle cx="85" cy="75" r="28" fill="white" stroke="#E5E5EA" strokeWidth="2" />
            <circle cx="85" cy="75" r="22" fill="#FEF2F2" />
            <path d="M75 65 L95 85 M95 65 L75 85" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
            <path d="M20 20 Q10 35 25 45" stroke="#1C1C1E" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M23 17 Q18 25 30 30" stroke="#1C1C1E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M110 25 L130 20 M125 30 L140 25" stroke="#E5E5EA" strokeWidth="2" strokeLinecap="round" />
            <circle cx="45" cy="115" r="4" fill="#3B82F6" />
            <path d="M55 5 L55 15 M50 10 L60 10" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <h2 className="text-xl font-bold text-veda-text mb-2">No assignments yet</h2>
      <p className="text-veda-muted text-sm max-w-xs leading-relaxed mb-8">
        Create your first assignment to start collecting and grading student submissions.
        You can set up rubrics, define marking criteria, and let AI assist with grading.
      </p>

      <Link href="/assignments/create" className="btn-primary text-base px-8 py-3">
        <span>+</span>
        Create Your First Assignment
      </Link>
    </div>
  );
}
