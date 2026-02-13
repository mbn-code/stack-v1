import type { NextApiRequest, NextApiResponse } from 'next';
import { searchGitHubUsers } from '@/lib/github';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { q, loc, lang, page } = req.query;

  try {
    const candidates = await searchGitHubUsers(
      q as string, 
      loc as string, 
      lang as string,
      page ? parseInt(page as string) : 1
    );

    // Transform BigInt to string for JSON serialization
    const serializedCandidates = candidates.map((c: any) => ({
      ...c,
      id: c.githubId ? c.githubId.toString() : c.id,
      githubId: c.githubId ? c.githubId.toString() : undefined,
    }));

    return res.status(200).json(serializedCandidates);
  } catch (error: any) {
    console.error('Failed to fetch candidates:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
