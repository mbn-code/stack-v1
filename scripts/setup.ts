import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function setup() {
  console.log('🚀 Starting Stack V1 Environment Setup...');

  // 1. Check for .env file
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env file not found. Please create one based on .env.example');
    process.exit(1);
  }

  // 2. Validate GITHUB_TOKEN
  if (!process.env.GITHUB_TOKEN && !process.env.GITHUB_ACCESS_TOKEN) {
    console.warn('⚠️  Warning: GITHUB_TOKEN or GITHUB_ACCESS_TOKEN is missing in .env. API rate limits will be restricted and private repos will fail.');
  }

  // 3. Run Prisma DB Push
  console.log('📦 Syncing database schema with Prisma...');
  try {
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Database schema synced successfully.');
  } catch (error) {
    console.error('❌ Error: Failed to sync database schema.');
    process.exit(1);
  }

  // 4. Generate Prisma Client
  console.log('⚙️  Generating Prisma Client...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma Client generated.');
  } catch (error) {
    console.error('❌ Error: Failed to generate Prisma Client.');
    process.exit(1);
  }

  console.log('\n✨ Setup complete! You can now start the worker and the Next.js app.');
}

setup().catch(console.error);
