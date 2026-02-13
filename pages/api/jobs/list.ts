import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const jobs = await prisma.analysisJob.findMany({
      include: {
        candidate: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    const serializedJobs = jobs.map(job => ({
      ...job,
      candidate: {
        ...job.candidate,
        githubId: job.candidate.githubId.toString(),
      }
    }));

    return res.status(200).json(serializedJobs);
  } catch (error: any) {
    console.error('Failed to fetch jobs:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
