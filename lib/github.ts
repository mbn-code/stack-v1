import { Octokit } from 'octokit';
import { prisma } from './prisma';

const token = process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;

const octokit = new Octokit({
  auth: token,
});

if (!token) {
  console.warn('⚠️  WARNING: No GITHUB_TOKEN or GITHUB_ACCESS_TOKEN found in environment. GitHub API rate limits will be severely restricted.');
}

// In-memory cache for repository lists (stays for the duration of the process)
const repoCache = new Map<string, any[]>();
let rateLimitHit = false;

/**
 * Executes a GitHub API call with automatic retry on secondary rate limits.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.status === 403 || error.message.includes('SecondaryRateLimit'))) {
      console.warn(`⚠️ GitHub Secondary Rate Limit hit. Retrying in ${delay}ms... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Fetches basic repository metadata and current default branch HEAD.
 */
export async function getRepoInfo(url: string) {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error('Invalid GitHub URL');
  
  const [, owner, repo] = match;
  const { data } = await withRetry(() => octokit.rest.repos.get({ owner, repo }));
  
  return {
    owner,
    repo,
    defaultBranch: data.default_branch,
    headSha: data.default_branch, 
  };
}

/**
 * Gets the SHA of the latest commit on a specific branch.
 */
export async function getLatestCommitSha(owner: string, repo: string, branch: string) {
  const { data } = await withRetry(() => octokit.rest.repos.getBranch({ owner, repo, branch }));
  return data.commit.sha;
}

/**
 * Fetches GitHub user information, checking the database cache first.
 * This is highly conservative on API usage.
 */
export async function getGitHubUserInfo(handle: string) {
  // Check Database Cache first
  const cached = await prisma.candidate.findFirst({
    where: { handle: { equals: handle, mode: 'insensitive' } }
  });

  if (cached && cached.avatarUrl) {
    return {
      githubId: cached.githubId,
      handle: cached.handle,
      avatarUrl: cached.avatarUrl,
      location: cached.location,
      bio: cached.bio
    };
  }

  // If not cached, hit the API
  const { data } = await withRetry(() => octokit.rest.users.getByUsername({ username: handle }));
  const userInfo = {
    githubId: BigInt(data.id),
    handle: data.login,
    avatarUrl: data.avatar_url,
    location: data.location,
    bio: data.bio
  };

  // Upsert into cache
  await prisma.candidate.upsert({
    where: { githubId: userInfo.githubId },
    update: { 
      avatarUrl: userInfo.avatarUrl,
      location: userInfo.location,
      bio: userInfo.bio,
      handle: userInfo.handle 
    },
    create: userInfo,
  });

  return userInfo;
}

/**
 * Searches for users on GitHub using location and language filters.
 * Implements sequential profile fetching and database caching.
 */
export async function searchGitHubUsers(query: string, location?: string, language?: string, page = 1) {
  let q = (query || '').trim();
  const loc = (location || '').trim();
  const lang = (language || '').trim();

  if (loc) q += ` location:${loc}`;
  if (lang) q += ` language:${lang}`;
  
  if (!q.trim()) return [];

  try {
    const { data } = await withRetry(() => octokit.rest.search.users({ q, per_page: 10, page }));
    
    const results = [];
    for (const user of data.items) {
      // Try to find in DB cache first
      const cached = await prisma.candidate.findUnique({
        where: { githubId: BigInt(user.id) }
      });

      if (cached && cached.avatarUrl) {
        results.push({
          id: cached.githubId.toString(),
          handle: cached.handle,
          avatarUrl: cached.avatarUrl,
          location: cached.location,
          bio: cached.bio,
          languages: lang ? [lang] : (cached.languages || [])
        });
        continue;
      }

      // If we've hit a rate limit recently, fallback to basic search info
      if (rateLimitHit) {
        results.push({
          id: user.id.toString(),
          handle: user.login,
          avatarUrl: user.avatar_url,
          location: loc || null,
          bio: null,
          languages: lang ? [lang] : []
        });
        continue;
      }

      try {
        // Sequential fetch with delay to respect secondary rate limits
        await new Promise(r => setTimeout(r, 500));
        
        const detail = await withRetry(() => octokit.rest.users.getByUsername({ username: user.login }), 2, 1000);
        const userInfo = {
          githubId: BigInt(detail.data.id),
          handle: detail.data.login,
          avatarUrl: detail.data.avatar_url,
          location: detail.data.location,
          bio: detail.data.bio,
          languages: lang ? [lang] : []
        };
        
        // Cache in DB
        await prisma.candidate.upsert({
          where: { githubId: userInfo.githubId },
          update: { 
            avatarUrl: userInfo.avatarUrl,
            location: userInfo.location,
            bio: userInfo.bio,
            handle: userInfo.handle
          },
          create: {
            githubId: userInfo.githubId,
            handle: userInfo.handle,
            avatarUrl: userInfo.avatarUrl,
            location: userInfo.location,
            bio: userInfo.bio,
            languages: userInfo.languages
          },
        });

        results.push({ ...userInfo, id: userInfo.githubId.toString() });
      } catch (e: any) {
        if (e.status === 403) {
          rateLimitHit = true;
          setTimeout(() => { rateLimitHit = false; }, 60000);
        }
        results.push({
          id: user.id.toString(),
          handle: user.login,
          avatarUrl: user.avatar_url,
          location: loc || null,
          bio: null,
          languages: lang ? [lang] : []
        });
      }
    }
    return results;
  } catch (error: any) {
    if (error.status === 403) {
      throw new Error('GitHub Search API rate limit exceeded. Please wait a minute.');
    }
    throw error;
  }
}

/**
 * Lists the top repositories for a user, using an in-memory cache.
 */
export async function getUserTopRepos(handle: string) {
  if (repoCache.has(handle)) return repoCache.get(handle);

  try {
    const { data } = await withRetry(() => octokit.rest.repos.listForUser({
      username: handle,
      sort: 'updated',
      per_page: 5,
      type: 'owner'
    }));

    const repos = data
      .filter(repo => !repo.fork)
      .map(repo => ({
        name: repo.name,
        url: repo.html_url,
        stars: repo.stargazers_count
      }));

    repoCache.set(handle, repos);
    return repos;
  } catch (error: any) {
    if (error.status === 403) {
      rateLimitHit = true;
      setTimeout(() => { rateLimitHit = false; }, 60000);
      throw new Error('GitHub API rate limit exceeded. Please wait a minute.');
    }
    throw error;
  }
}
