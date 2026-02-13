import type { NextApiRequest, NextApiResponse } from 'next';
import { searchGitHubUsers } from '@/lib/github';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { q, loc, lang } = req.query;

  try {
    const candidates = await searchGitHubUsers(
      q as string, 
      loc as string, 
      lang as string
    );

    return res.status(200).json(candidates);
  } catch (error: any) {
    console.error('Failed to fetch candidates:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
