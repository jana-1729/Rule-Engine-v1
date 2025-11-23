import { Redis } from '@upstash/redis';
import { nanoid } from 'nanoid';

/**
 * Queue Service using Upstash Redis
 * Manages workflow execution queue
 */

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface QueueJob {
  id: string;
  type: 'workflow_execution';
  payload: {
    workflowId: string;
    organizationId: string;
    triggerPayload: any;
    triggerSource: string;
  };
  priority?: number;
  retryCount?: number;
  maxRetries?: number;
  scheduledFor?: Date;
  createdAt: Date;
}

const QUEUE_KEY = 'workflow:queue';
const PROCESSING_KEY = 'workflow:processing';
const DEAD_LETTER_KEY = 'workflow:dead_letter';

/**
 * Enqueue a workflow for execution
 */
export async function enqueueWorkflow(
  workflowId: string,
  organizationId: string,
  triggerPayload: any,
  triggerSource: string = 'manual',
  options: {
    priority?: number;
    scheduledFor?: Date;
  } = {}
): Promise<string> {
  const jobId = nanoid();
  
  const job: QueueJob = {
    id: jobId,
    type: 'workflow_execution',
    payload: {
      workflowId,
      organizationId,
      triggerPayload,
      triggerSource,
    },
    priority: options.priority || 0,
    retryCount: 0,
    maxRetries: 3,
    scheduledFor: options.scheduledFor,
    createdAt: new Date(),
  };

  if (options.scheduledFor && options.scheduledFor > new Date()) {
    // Schedule for future execution
    const score = options.scheduledFor.getTime();
    await redis.zadd('workflow:scheduled', { score, member: JSON.stringify(job) });
  } else {
    // Add to queue immediately
    const score = Date.now() - (options.priority || 0) * 1000000; // Higher priority = lower score
    await redis.zadd(QUEUE_KEY, { score, member: JSON.stringify(job) });
  }

  console.log(`📥 Enqueued workflow: ${workflowId} (job: ${jobId})`);
  
  return jobId;
}

/**
 * Dequeue next job for processing
 */
export async function dequeueJob(): Promise<QueueJob | null> {
  // Move scheduled jobs to queue if ready
  await moveScheduledJobsToQueue();

  // Get job with lowest score (highest priority or oldest)
  const jobs = await redis.zrange(QUEUE_KEY, 0, 0);
  
  if (!jobs || jobs.length === 0) {
    return null;
  }

  const jobData = jobs[0];
  const job = JSON.parse(jobData as string) as QueueJob;

  // Move to processing set
  await redis.zrem(QUEUE_KEY, jobData);
  await redis.hset(PROCESSING_KEY, job.id, JSON.stringify(job));

  return job;
}

/**
 * Mark job as completed
 */
export async function completeJob(jobId: string): Promise<void> {
  await redis.hdel(PROCESSING_KEY, jobId);
  console.log(`✅ Job completed: ${jobId}`);
}

/**
 * Mark job as failed and handle retry logic
 */
export async function failJob(jobId: string, error: any): Promise<void> {
  const jobData = await redis.hget(PROCESSING_KEY, jobId);
  
  if (!jobData) {
    console.error(`Job ${jobId} not found in processing set`);
    return;
  }

  const job = JSON.parse(jobData as string) as QueueJob;
  job.retryCount = (job.retryCount || 0) + 1;

  if (job.retryCount < (job.maxRetries || 3)) {
    // Retry with exponential backoff
    const delayMs = Math.pow(2, job.retryCount) * 1000;
    const scheduledFor = new Date(Date.now() + delayMs);
    
    console.log(`🔄 Retrying job ${jobId} (attempt ${job.retryCount + 1}/${job.maxRetries})`);
    
    await redis.hdel(PROCESSING_KEY, jobId);
    await redis.zadd('workflow:scheduled', {
      score: scheduledFor.getTime(),
      member: JSON.stringify(job),
    });
  } else {
    // Move to dead letter queue
    console.error(`💀 Job ${jobId} moved to dead letter queue after ${job.retryCount} retries`);
    
    await redis.hdel(PROCESSING_KEY, jobId);
    await redis.zadd(DEAD_LETTER_KEY, {
      score: Date.now(),
      member: JSON.stringify({
        ...job,
        error: {
          message: error.message,
          stack: error.stack,
        },
      }),
    });
  }
}

/**
 * Move scheduled jobs to queue if ready
 */
async function moveScheduledJobsToQueue(): Promise<void> {
  const now = Date.now();
  const jobs = await redis.zrange('workflow:scheduled', 0, -1, {
    withScores: true,
  });

  if (!jobs || jobs.length === 0) return;

  for (let i = 0; i < jobs.length; i += 2) {
    const jobData = jobs[i] as string;
    const score = jobs[i + 1] as number;

    if (score <= now) {
      const job = JSON.parse(jobData) as QueueJob;
      
      // Move to main queue
      await redis.zrem('workflow:scheduled', jobData);
      await redis.zadd(QUEUE_KEY, {
        score: now - (job.priority || 0) * 1000000,
        member: jobData,
      });
    }
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [queueSize, processingSize, deadLetterSize, scheduledSize] = await Promise.all([
    redis.zcard(QUEUE_KEY),
    redis.hlen(PROCESSING_KEY),
    redis.zcard(DEAD_LETTER_KEY),
    redis.zcard('workflow:scheduled'),
  ]);

  return {
    queued: queueSize || 0,
    processing: processingSize || 0,
    deadLetter: deadLetterSize || 0,
    scheduled: scheduledSize || 0,
  };
}

/**
 * Clear all queues (for testing)
 */
export async function clearQueues(): Promise<void> {
  await Promise.all([
    redis.del(QUEUE_KEY),
    redis.del(PROCESSING_KEY),
    redis.del(DEAD_LETTER_KEY),
    redis.del('workflow:scheduled'),
  ]);
  console.log('🗑️  All queues cleared');
}

