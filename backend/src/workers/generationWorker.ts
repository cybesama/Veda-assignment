import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { getRedis } from '../config/redis';
import { connectDB } from '../config/db';
import { Assignment } from '../models/Assignment';
import { Result } from '../models/Result';
import { generateQuestionPaper } from '../services/aiService';
import { wsManager } from '../websocket/wsManager';
import { GenerationJobData } from '../queues/generationQueue';

async function processJob(job: Job<GenerationJobData>): Promise<void> {
  const { assignmentId } = job.data;

  await job.updateProgress(10);
  wsManager.broadcast(assignmentId, {
    type: 'job:progress',
    payload: { jobId: job.id, assignmentId, status: 'active', progress: 10 },
  });

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

  await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing', jobId: job.id });

  await job.updateProgress(30);
  wsManager.broadcast(assignmentId, {
    type: 'job:progress',
    payload: { jobId: job.id, assignmentId, status: 'active', progress: 30 },
  });

  const { paper, rawPrompt } = await generateQuestionPaper(assignment);

  await job.updateProgress(80);
  wsManager.broadcast(assignmentId, {
    type: 'job:progress',
    payload: { jobId: job.id, assignmentId, status: 'active', progress: 80 },
  });

  const result = await Result.create({ assignmentId, paper, rawPrompt });

  await Assignment.findByIdAndUpdate(assignmentId, { status: 'completed' });

  await job.updateProgress(100);
  wsManager.broadcast(assignmentId, {
    type: 'job:completed',
    payload: {
      jobId: job.id,
      assignmentId,
      status: 'completed',
      progress: 100,
      resultId: result._id.toString(),
    },
  });
}

export async function setupWorker(): Promise<Worker<GenerationJobData>> {
  const worker = new Worker<GenerationJobData>(
    'question-generation',
    processJob,
    {
      connection: getRedis(),
      concurrency: 3,
    }
  );

  worker.on('failed', async (job, err) => {
    if (!job) return;
    const { assignmentId } = job.data;
    await Assignment.findByIdAndUpdate(assignmentId, {
      status: 'failed',
      errorMessage: err.message,
    }).catch(() => {});
    wsManager.broadcast(assignmentId, {
      type: 'job:failed',
      payload: { jobId: job.id, assignmentId, status: 'failed', progress: 0, error: err.message },
    });
  });

  console.log('BullMQ worker started');
  return worker;
}

if (require.main === module) {
  connectDB()
    .then(() => setupWorker())
    .then(() => console.log('Standalone worker running'))
    .catch(console.error);
}
