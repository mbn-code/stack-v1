import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Placeholder for GitHub OAuth handler
  // This will integrate with Supabase Auth in Phase 3
  res.status(200).json({ message: 'GitHub OAuth endpoint placeholder' });
}
