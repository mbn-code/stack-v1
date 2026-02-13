import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getRepoInfo, getLatestCommitSha, getGitHubUserInfo } from '@/lib/github';

const submitJobSchema = z.object({
  candidateHandle: z.string().min(1),
  repositoryUrl: z.string().url().includes('github.com'),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { candidateHandle, repositoryUrl } = submitJobSchema.parse(req.body);
    const signalVersion = '1.0.0';

    // 1. Get Candidate Info (Uses DB Cache first)
    const { githubId, handle } = await getGitHubUserInfo(candidateHandle);
    
    // 2. Get Repository Info (for idempotency check with headSha)
    const repoInfo = await getRepoInfo(repositoryUrl);
    const headSha = await getLatestCommitSha(repoInfo.owner, repoInfo.repo, repoInfo.defaultBranch);

    // 3. Find the candidate in DB (they are guaranteed to exist now because of getGitHubUserInfo)
    const candidate = await prisma.candidate.findUnique({
      where: { githubId },
    });

    if (!candidate) throw new Error('Candidate sync failed');

    // 4. Check for existing completed job (Idempotency)
    const existingJob = await prisma.analysisJob.findUnique({
      where: {
        candidateId_repositoryUrl_headSha_signalVersion: {
          candidateId: candidate.id,
          repositoryUrl,
          headSha,
          signalVersion,
        },
      },
      include: { report: true },
    });

    if (existingJob?.status === 'COMPLETED' && existingJob.report) {
      return res.status(200).json({
        jobId: existingJob.id,
        status: 'EXISTING',
        report: existingJob.report,
      });
    }

    // 5. Create new job or return pending one
    // Note: requestedBy should come from auth session
    // For this demo, ensure a system user exists
    const systemUser = await prisma.user.upsert({
      where: { email: 'system@stack.v1' },
      update: {},
      create: { email: 'system@stack.v1', role: 'RECRUITER' },
    });

    const job = await prisma.analysisJob.upsert({
      where: {
        candidateId_repositoryUrl_headSha_signalVersion: {
          candidateId: candidate.id,
          repositoryUrl,
          headSha,
          signalVersion,
        },
      },
      update: {}, // Don't change anything if it exists
      create: {
        candidateId: candidate.id,
        repositoryUrl,
        headSha,
        signalVersion,
        requestedById: systemUser.id,
        status: 'PENDING',
      },
    });

    return res.status(201).json({
      jobId: job.id,
      status: job.status,
    });

  } catch (error: any) {
    console.error('Job submission error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
