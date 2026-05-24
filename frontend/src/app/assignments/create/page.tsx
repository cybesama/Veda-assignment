import AppLayout from '@/components/layout/AppLayout';
import Header from '@/components/layout/Header';
import CreateAssignmentForm from '@/components/create/CreateAssignmentForm';

export default function CreateAssignmentPage() {
  return (
    <AppLayout>
      <Header title="Assignment" />
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-veda-text">Create Assignment</h1>
          <p className="text-sm text-veda-muted">Set up a new assignment for your students</p>
        </div>
        <CreateAssignmentForm />
      </div>
    </AppLayout>
  );
}
