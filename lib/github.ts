import { Octokit } from 'octokit';

const token = process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;

const octokit = new Octokit({
  auth: token,
});

if (token) {
  // console.log('✅ GitHub Octokit initialized with Authentication Token');
} else {
  console.warn('⚠️  WARNING: No GITHUB_TOKEN or GITHUB_ACCESS_TOKEN found in environment. GitHub API rate limits will be severely restricted.');
}

// Simple in-memory cache for user details and repos to save API quota
const userCache = new Map<string, any>();
const repoCache = new Map<string, any[]>();
let rateLimitHit = false;

export async function getRepoInfo(url: string) {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error('Invalid GitHub URL');
  
  const [, owner, repo] = match;
  const { data } = await octokit.rest.repos.get({ owner, repo });
  
  return {
    owner,
    repo,
    defaultBranch: data.default_branch,
    headSha: data.default_branch, // We'll get the actual SHA in the next step
  };
}

export async function getLatestCommitSha(owner: string, repo: string, branch: string) {
  const { data } = await octokit.rest.repos.getBranch({ owner, repo, branch });
  return data.commit.sha;
}

export async function getGitHubUserInfo(handle: string) {
  const { data } = await octokit.rest.users.getByUsername({ username: handle });
  return {
    githubId: BigInt(data.id),
    handle: data.login,
    avatarUrl: data.avatar_url,
    location: data.location,
    bio: data.bio
  };
}

export async function searchGitHubUsers(query: string, location?: string, language?: string) {
  let q = (query || '').trim();
  const loc = (location || '').trim();
  const lang = (language || '').trim();

  if (loc) q += ` location:${loc}`;
  if (lang) q += ` language:${lang}`;
  
  if (!q.trim()) return [];

  try {
    const { data } = await octokit.rest.search.users({ q, per_page: 10 });
    
    return Promise.all(data.items.map(async (user: any) => {
      // Check cache first
      if (userCache.has(user.login)) {
        return { ...userCache.get(user.login), languages: lang ? [lang] : [] };
      }

      // If we've hit a rate limit recently, don't even try the detail fetch
      if (rateLimitHit) {
        return {
          id: user.id.toString(),
          handle: user.login,
          avatarUrl: user.avatar_url,
          location: loc || null,
          bio: null,
          languages: lang ? [lang] : []
        };
      }

      try {
        const detail = await octokit.rest.users.getByUsername({ username: user.login });
        const userInfo = {
          id: detail.data.id.toString(),
          handle: detail.data.login,
          avatarUrl: detail.data.avatar_url,
          location: detail.data.location,
          bio: detail.data.bio,
        };
        
        userCache.set(user.login, userInfo);
        return { ...userInfo, languages: lang ? [lang] : [] };
      } catch (e: any) {
        if (e.status === 403) {
          rateLimitHit = true;
          // Reset rate limit flag after 1 minute
          setTimeout(() => { rateLimitHit = false; }, 60000);
        }
        return {
          id: user.id.toString(),
          handle: user.login,
          avatarUrl: user.avatar_url,
          location: loc || null,
          bio: null,
          languages: lang ? [lang] : []
        };
      }
    }));
  } catch (error: any) {
    if (error.status === 403) {
      throw new Error('GitHub Search API rate limit exceeded. Please wait a minute.');
    }
    throw error;
  }
}

export async function getUserTopRepos(handle: string) {
  if (repoCache.has(handle)) return repoCache.get(handle);

  try {
    const { data } = await octokit.rest.repos.listForUser({
      username: handle,
      sort: 'updated',
      per_page: 5,
      type: 'owner'
    });

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
