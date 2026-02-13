import { execSync, spawn } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as net from 'net';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DB_URL = process.env.DATABASE_URL || '';
const API_URL = 'http://localhost:3000/api/health';

/**
 * Validates the database connection before proceeding.
 */
async function checkDatabase() {
  console.log('🔍 Checking database connectivity...');
  
  try {
    const url = new URL(DB_URL);
    const host = url.hostname;
    const port = parseInt(url.port) || 5432;

    return new Promise<void>((resolve, reject) => {
      const socket = net.createConnection(port, host);
      socket.setTimeout(5000);
      
      socket.on('connect', () => {
        console.log(`✅ Database reachable at ${host}:${port}`);
        socket.end();
        resolve();
      });

      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error(`Timeout connecting to database at ${host}:${port}`));
      });

      socket.on('error', (err) => {
        reject(new Error(`Database connection failed: ${err.message}`));
      });
    });
  } catch (err: any) {
    throw new Error(`Invalid DATABASE_URL: ${err.message}`);
  }
}

/**
 * Initializes the database schema and client.
 */
async function initDatabase() {
  console.log('📦 Initializing database schema...');
  try {
    execSync('npx prisma db push', { stdio: 'inherit' });
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Database initialized.');
  } catch (err) {
    throw new Error('Failed to initialize database.');
  }
}

/**
 * Starts a process and returns a handle.
 */
function startProcess(command: string, args: string[], name: string) {
  console.log(`🚀 Starting ${name}...`);
  const proc = spawn(command, args, {
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, FORCE_COLOR: 'true' }
  });

  proc.stdout?.on('data', (data) => {
    process.stdout.write(`[${name}] ${data}`);
  });

  proc.stderr?.on('data', (data) => {
    process.stderr.write(`[${name}] ERROR: ${data}`);
  });

  return proc;
}

/**
 * Validates the environment by calling the health API.
 */
async function validateEnvironment() {
  console.log('🧪 Validating environment...');
  let attempts = 0;
  const maxAttempts = 12; // 60 seconds total

  while (attempts < maxAttempts) {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        console.log('✨ System validation successful:', data);
        return;
      }
    } catch (e) {
      // API not ready yet
    }
    attempts++;
    await new Promise(r => setTimeout(r, 5000));
    console.log(`...waiting for API to be ready (attempt ${attempts}/${maxAttempts})`);
  }
  throw new Error('Environment validation timed out. Next.js might have failed to start.');
}

async function boot() {
  console.log('🚀 Stack V1 Dev Boot Sequence Initiated\n');

  try {
    // 1. Connection Check
    await checkDatabase();

    // 2. Database Sync
    await initDatabase();

    // 3. Start Services
    // We use 'tsx' to run the worker script directly
    const worker = startProcess('npx', ['tsx', 'scripts/start-worker.ts'], 'Worker');
    
    // We start Next.js dev server
    const next = startProcess('npm', ['run', 'dev'], 'Next.js');

    // 4. Self-Validation
    await validateEnvironment();

    console.log('\n✅ Stack V1 is fully operational!');
    console.log('👉 Dashboard: http://localhost:3000/dashboard');
    console.log('💡 Press Ctrl+C to stop all services.');

    // Keep the script running
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down...');
      worker.kill();
      next.kill();
      process.exit();
    });

  } catch (err: any) {
    console.error(`\n❌ Boot failed: ${err.message}`);
    process.exit(1);
  }
}

boot();
