import { Queue } from 'bullmq';
import { getRedis } from '../config/redis';

export interface GenerationJobData {
  assignmentId: string;
}

let generationQueue: Queue<GenerationJobData> | null = null;

export function getGenerationQueue(): Queue<GenerationJobData> {
  if (!generationQueue) {
    generationQueue = new Queue<GenerationJobData>('question-generation', {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 20 },
      },
    });
  }
  return generationQueue;
}
