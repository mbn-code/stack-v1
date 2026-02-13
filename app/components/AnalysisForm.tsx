'use client';

import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';

export default function AnalysisForm({ onJobCreated }: { onJobCreated: (jobId: string) => void }) {
  const [handle, setHandle] = useState('');
  const [repo, setRepo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateHandle: handle, repositoryUrl: repo }),
      });

      const data = await res.json();
      if (res.ok) {
        onJobCreated(data.jobId);
        setHandle('');
        setRepo('');
      } else {
        alert(data.error || 'Failed to submit job');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Start New Analysis</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">GitHub Handle</label>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="e.g. octocat"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Repository URL</label>
          <input
            type="url"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Run Analysis
        </button>
      </form>
    </div>
  );
}
