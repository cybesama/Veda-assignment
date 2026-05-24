'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchAssignment } from '@/lib/api';

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    fetchAssignment(id).then((a) => {
      router.replace(`/assignments/${id}/result`);
    }).catch(() => router.replace('/assignments'));
  }, [id, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
