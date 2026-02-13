import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserTopRepos } from '@/lib/github';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { handle } = req.query;

  if (!handle || typeof handle !== 'string') {
    return res.status(400).json({ error: 'Handle is required' });
  }

  try {
    const repos = await getUserTopRepos(handle);
    return res.status(200).json(repos);
  } catch (error: any) {
    console.error('Failed to fetch repos:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
