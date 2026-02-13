import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { q, loc, lang } = req.query;

  try {
    // Basic search/filter logic
    const candidates = await prisma.candidate.findMany({
      where: {
        AND: [
          q ? { handle: { contains: q as string, mode: 'insensitive' } } : {},
          loc ? { location: { contains: loc as string, mode: 'insensitive' } } : {},
          lang ? { languages: { has: lang as string } } : {},
        ]
      },
      take: 20,
    });

    // If no results, let's return some mock data for the demo if it's an initial search
    if (candidates.length === 0 && !q && !loc && !lang) {
      return res.status(200).json([
        { id: '1', handle: 'mbn-code', location: 'Remote', languages: ['Rust', 'TypeScript', 'C++'] },
        { id: '2', handle: 'octocat', location: 'San Francisco', languages: ['Ruby', 'JavaScript'] },
        { id: '3', handle: 'torvalds', location: 'Portland', languages: ['C', 'Assembly'] },
      ]);
    }

    return res.status(200).json(candidates);
  } catch (error: any) {
    console.error('Failed to fetch candidates:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
