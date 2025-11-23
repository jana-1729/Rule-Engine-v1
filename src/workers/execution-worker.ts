import { dequeueJob, completeJob, failJob, getQueueStats } from '../services/queue-service';
import { workflowEngine } from '../workflows/engine';
import { loadIntegrations } from '../integrations/registry';

/**
 * Execution Worker
 * Processes workflow execution jobs from the queue
 */

const POLL_INTERVAL_MS = 1000;
const MAX_CONCURRENT_JOBS = 5;

let isRunning = false;
let activeJobs = 0;

/**
 * Start the worker
 */
export async function startWorker() {
  console.log('🚀 Starting execution worker...');
  
  // Load integrations
  await loadIntegrations();
  
  isRunning = true;
  
  // Start polling loop
  pollQueue();
  
  // Log stats periodically
  setInterval(logStats, 30000);
  
  console.log('✅ Worker started and listening for jobs');
}

/**
 * Stop the worker
 */
export async function stopWorker() {
  console.log('🛑 Stopping worker...');
  isRunning = false;
  
  // Wait for active jobs to complete
  while (activeJobs > 0) {
    console.log(`Waiting for ${activeJobs} active jobs to complete...`);
    await sleep(1000);
  }
  
  console.log('✅ Worker stopped');
}

/**
 * Poll queue for jobs
 */
async function pollQueue() {
  while (isRunning) {
    try {
      // Check if we can process more jobs
      if (activeJobs >= MAX_CONCURRENT_JOBS) {
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      // Dequeue next job
      const job = await dequeueJob();

      if (!job) {
        // No jobs available, wait before polling again
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      // Process job in background
      processJob(job);
    } catch (error) {
      console.error('Error polling queue:', error);
      await sleep(POLL_INTERVAL_MS);
    }
  }
}

/**
 * Process a single job
 */
async function processJob(job: any) {
  activeJobs++;
  const startTime = Date.now();

  console.log(`\n📦 Processing job: ${job.id}`);
  console.log(`   Type: ${job.type}`);
  console.log(`   Workflow: ${job.payload.workflowId}`);

  try {
    if (job.type === 'workflow_execution') {
      await workflowEngine.executeWorkflow(
        job.payload.workflowId,
        job.payload.organizationId,
        job.payload.triggerPayload,
        job.payload.triggerSource
      );
    } else {
      throw new Error(`Unknown job type: ${job.type}`);
    }

    // Mark job as completed
    await completeJob(job.id);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Job completed: ${job.id} (${duration}ms)`);
  } catch (error: any) {
    console.error(`❌ Job failed: ${job.id}`, error);
    
    // Mark job as failed (will retry or move to dead letter)
    await failJob(job.id, error);
  } finally {
    activeJobs--;
  }
}

/**
 * Log queue statistics
 */
async function logStats() {
  try {
    const stats = await getQueueStats();
    console.log('\n📊 Queue Statistics:');
    console.log(`   Queued: ${stats.queued}`);
    console.log(`   Processing: ${stats.processing} (${activeJobs} active)`);
    console.log(`   Scheduled: ${stats.scheduled}`);
    console.log(`   Dead Letter: ${stats.deadLetter}`);
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
}

/**
 * Utility: Sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await stopWorker();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await stopWorker();
  process.exit(0);
});

// Start worker if run directly
if (require.main === module) {
  startWorker().catch(error => {
    console.error('Fatal error starting worker:', error);
    process.exit(1);
  });
}

