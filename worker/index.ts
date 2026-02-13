import { prisma } from '../lib/prisma';
import { JobStatus } from '@prisma/client';
import { runGit, cleanup, getJobDir } from '../lib/git-utils';
import { isNoise, calculateCsr } from '../lib/csr-logic';
import fs from 'fs/promises';

const POLL_INTERVAL = 5000;
const CUTOFF_DAYS = 90;

/**
 * Background worker loop that polls for pending analysis jobs.
 * Uses atomic selection to ensure multiple workers don't claim the same job.
 */
async function pollJobs() {
  console.log('👷 Worker started, polling for jobs...');
  while (true) {
    try {
      // Atomic job claiming using SELECT FOR UPDATE SKIP LOCKED
      const job = await prisma.$transaction(async (tx) => {
        const pendingJobs = await tx.$queryRaw<any[]>`
          SELECT * FROM "analysis_jobs"
          WHERE "status" = 'PENDING'
          ORDER BY "created_at" ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        `;

        if (pendingJobs.length === 0) return null;

        const updatedJob = await tx.analysisJob.update({
          where: { id: pendingJobs[0].id },
          data: { status: 'CLONING' },
          include: { candidate: { include: { emails: true } } },
        });

        return updatedJob;
      });

      if (job) {
        await processJob(job);
      } else {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      }
    } catch (error) {
      console.error('❌ Worker error in polling loop:', error);
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    }
  }
}

/**
 * Executes the CSR analysis pipeline for a specific job.
 */
async function processJob(job: any) {
  const jobDir = getJobDir(job.id);
  const commitAuthorCache = new Map<string, boolean>();
  
  try {
    await fs.mkdir(jobDir, { recursive: true });
    
    // Step 1: Blobless Clone
    // We only fetch commit metadata to save bandwidth, downloading file contents on-demand during blame.
    const token = process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;
    let cloneUrl = job.repositoryUrl;
    
    if (token && cloneUrl.includes('github.com')) {
      cloneUrl = cloneUrl.replace('https://github.com/', `https://x-access-token:${token}@github.com/`);
    }

    await runGit(['clone', '--filter=blob:none', '--no-checkout', cloneUrl, '.'], jobDir);
    
    await prisma.analysisJob.update({
      where: { id: job.id },
      data: { status: 'ANALYZING' },
    });

    // Step 2: Resolve Candidate Identity
    // We aggregate all email addresses associated with the candidate's GitHub handle.
    const emails = new Set(job.candidate.emails.map((e: any) => e.email));
    const logEmails = await runGit(['log', '--format=%ae', `--author=${job.candidate.handle}`], jobDir);
    logEmails.split('\n').forEach(e => { if (e.trim()) emails.add(e.trim()); });

    for (const email of emails) {
      await prisma.candidateEmail.upsert({
        where: { email },
        update: {},
        create: { email, candidateId: job.candidate.id },
      });
    }

    // Step 3: Setup Analysis Time Window
    // We define "original" code as anything written before the 90-day cutoff.
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CUTOFF_DAYS);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    const cutoffCommit = (await runGit(['rev-list', '-n', '1', `--before="${cutoffStr}"`, 'HEAD'], jobDir)).trim();

    if (!cutoffCommit) {
      throw new Error(`No commits found before ${cutoffStr}`);
    }

    // Step 4: Extract Code State at Cutoff
    const filesAtCutoff = (await runGit(['ls-tree', '-r', '--name-only', cutoffCommit], jobDir))
      .split('\n')
      .filter(f => f && !isNoise(f));

    let totalOriginal = 0;
    let totalSurviving = 0;

    // Step 5: Verify Survival at HEAD
    for (const file of filesAtCutoff) {
      try {
        // Get lines authored by candidate at the cutoff point (L_original)
        const originalBlame = await runGit(['blame', '-p', cutoffCommit, '--', file], jobDir);
        const originalLines = await getCandidateLines(originalBlame, emails, jobDir, commitAuthorCache);
        totalOriginal += originalLines.size;

        if (originalLines.size === 0) continue;

        // Get lines in current HEAD that were already present at cutoff (L_surviving)
        const currentBlame = await runGit(['blame', '-p', '-w', 'HEAD', '--', file], jobDir);
        const currentLines = await getCandidateLines(currentBlame, emails, jobDir, commitAuthorCache, cutoffCommit);
        totalSurviving += currentLines.size;

      } catch (e) {
        // Continue with other files if one fails (e.g. file deleted or moved in a complex way)
      }
    }

    // Step 6: Persist Final Metrics
    const csrPercentage = calculateCsr(totalSurviving, totalOriginal);

    await prisma.$transaction([
      prisma.csrReport.create({
        data: {
          jobId: job.id,
          candidateId: job.candidate.id,
          linesOriginal: totalOriginal,
          linesSurviving: totalSurviving,
          csrPercentage: csrPercentage,
        },
      }),
      prisma.analysisJob.update({
        where: { id: job.id },
        data: { status: 'COMPLETED' },
      }),
    ]);

  } catch (error: any) {
    await prisma.analysisJob.update({
      where: { id: job.id },
      data: { status: 'FAILED', errorMessage: error.message },
    });
  } finally {
    // Crucial: Clean up temporary clone to prevent disk exhaustion
    await cleanup(jobDir);
  }
}

/**
 * Parses git blame porcelain output and identifies lines belonging to the candidate.
 * If cutoffCommit is provided, it only counts lines whose commit is an ancestor of that cutoff.
 */
async function getCandidateLines(
  blameOutput: string, 
  emails: Set<string>, 
  cwd: string,
  cache: Map<string, boolean>,
  cutoffCommit?: string
) {
  const lines = blameOutput.split('\n');
  const candidateLines = new Set<number>();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headerMatch = line.match(/^([0-9a-f]{40}) (\d+) (\d+) (\d+)/);
    
    if (headerMatch) {
      const sha = headerMatch[1];
      const finalLineNum = parseInt(headerMatch[3]);
      const numLines = parseInt(headerMatch[4]);
      
      let isCandidate = cache.get(sha);
      if (isCandidate === undefined) {
        const authorEmail = (await runGit(['log', '-1', '--format=%ae', sha], cwd)).trim();
        isCandidate = emails.has(authorEmail);
        cache.set(sha, isCandidate);
      }

      if (isCandidate && cutoffCommit) {
        const isOld = await isAncestor(sha, cutoffCommit, cwd);
        if (!isOld) isCandidate = false;
      }

      if (isCandidate) {
        for (let j = 0; j < numLines; j++) {
          candidateLines.add(finalLineNum + j);
        }
      }

      // Skip metadata block for this group of lines
      while (i < lines.length && !lines[i].startsWith('\t')) {
        i++;
      }
    }
  }
  return candidateLines;
}

/**
 * Helper to check if a commit is an ancestor of another.
 */
async function isAncestor(child: string, parent: string, cwd: string) {
  if (child === parent) return true;
  try {
    await runGit(['merge-base', '--is-ancestor', child, parent], cwd);
    return true;
  } catch {
    return false;
  }
}

pollJobs().catch(console.error);
