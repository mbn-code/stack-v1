import { spawn } from 'child_process';
import * as path from 'path';
import { cleanup } from '@/lib/git-utils';

async function startWorker() {
  console.log('👷 Starting Stack V1 Background Worker...');

  // Target the worker entry point
  const workerPath = path.resolve(process.cwd(), 'worker/index.ts');
  
  // Start the worker using tsx for direct TypeScript execution
  const worker = spawn('npx', ['tsx', workerPath], {
    stdio: 'inherit',
    env: process.env,
  });

  // Handle cleanup on exit
  const handleExit = async () => {
    console.log('\n🛑 Shutting down worker...');
    
    // Cleanup the main temp directory used by workers
    const tempDir = '/tmp/stack-v1-jobs';
    await cleanup(tempDir);
    
    worker.kill();
    process.exit();
  };

  process.on('SIGINT', handleExit);
  process.on('SIGTERM', handleExit);

  worker.on('error', (err) => {
    console.error('❌ Worker process error:', err);
  });

  worker.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Worker exited with code ${code}`);
    }
  });
}

startWorker().catch(console.error);
