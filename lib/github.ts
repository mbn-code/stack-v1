import { Octokit } from 'octokit';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

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
  };
}
