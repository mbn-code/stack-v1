import { z } from 'zod';

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: npx tsx scripts/submit-job.ts <candidateHandle> <repositoryUrl>');
  process.exit(1);
}

const candidateHandle = args[0];
const repositoryUrl = args[1];

async function submitJob() {
  console.log(`🔍 Submitting CSR Analysis Job for @${candidateHandle}...`);
  console.log(`📂 Repo: ${repositoryUrl}`);

  try {
    const response = await fetch('http://localhost:3000/api/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidateHandle,
        repositoryUrl,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Failed to submit job:', data.error);
      process.exit(1);
    }

    if (data.status === 'EXISTING') {
      console.log('✅ Found existing completed report (Idempotency Hit):');
      console.log(`📊 CSR: ${data.report.csrPercentage}%`);
      console.log(`📏 Lines Original: ${data.report.linesOriginal}`);
      console.log(`🌿 Lines Surviving: ${data.report.linesSurviving}`);
      console.log(`🆔 Job ID: ${data.jobId}`);
    } else {
      console.log('🚀 Job successfully queued!');
      console.log(`🆔 Job ID: ${data.jobId}`);
      console.log(`📡 Status: ${data.status}`);
      console.log('\nKeep the worker running to process this job.');
    }
  } catch (error) {
    console.error('❌ Error connecting to API. Is the Next.js server running on localhost:3000?');
    console.error(error);
  }
}

submitJob();
