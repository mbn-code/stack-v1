import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export async function runGit(args: string[], cwd: string) {
  const { stdout, stderr } = await execAsync(`git ${args.join(' ')}`, { cwd });
  if (stderr && !args.includes('blame')) {
    // git blame --incremental writes to stderr sometimes or has warnings
    // we should be careful what we consider a fatal error
  }
  return stdout;
}

export async function cleanup(dir: string) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    console.error(`Failed to cleanup ${dir}:`, error);
  }
}

export function getJobDir(jobId: string) {
  return path.join('/tmp/stack-v1-jobs', jobId);
}
