import axios from 'axios';
import { Assignment, AssignmentFormData, AssignmentResult } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({ baseURL: `${API_URL}/api` });

export async function fetchAssignments(params?: {
  search?: string;
  status?: string;
}): Promise<Assignment[]> {
  const { data } = await api.get('/assignments', { params });
  return data.data;
}

export async function fetchAssignment(id: string): Promise<Assignment> {
  const { data } = await api.get(`/assignments/${id}`);
  return data.data;
}

export async function fetchResult(assignmentId: string): Promise<AssignmentResult> {
  const { data } = await api.get(`/assignments/${assignmentId}/result`);
  return data.data;
}

export async function createAssignment(
  formData: AssignmentFormData
): Promise<Assignment & { jobId: string }> {
  const fd = new FormData();
  fd.append('title', formData.title);
  fd.append('subject', formData.subject);
  fd.append('className', formData.className);
  fd.append('dueDate', formData.dueDate);
  fd.append('questionTypes', JSON.stringify(formData.questionTypes));
  fd.append('additionalInstructions', formData.additionalInstructions);
  if (formData.file) fd.append('file', formData.file);

  const { data } = await api.post('/assignments', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function deleteAssignment(id: string): Promise<void> {
  await api.delete(`/assignments/${id}`);
}

export async function regenerateAssignment(id: string): Promise<{ jobId: string }> {
  const { data } = await api.post(`/assignments/${id}/regenerate`);
  return data.data;
}
