import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { candidateHandle, repositoryUrl } = req.query;

  try {
    const reports = await prisma.csrReport.findMany({
      where: {
        candidate: {
          handle: candidateHandle ? (candidateHandle as string) : undefined,
        },
        job: {
          repositoryUrl: repositoryUrl ? (repositoryUrl as string) : undefined,
        },
      },
      include: {
        candidate: true,
        job: true,
      },
      orderBy: {
        calculatedAt: 'desc',
      },
    });

    // Transform BigInt to string for JSON serialization
    const serializedReports = reports.map(report => ({
      ...report,
      candidate: {
        ...report.candidate,
        githubId: report.candidate.githubId.toString(),
      }
    }));

    return res.status(200).json(serializedReports);
  } catch (error: any) {
    console.error('Failed to fetch reports:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
