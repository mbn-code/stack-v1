'use client';

import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, XCircle, Clock, Search } from 'lucide-react';

export type Job = {
  id: string;
  status: 'PENDING' | 'CLONING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
  repositoryUrl: string;
  createdAt: string;
  candidate: { handle: string };
};

export default function JobStatusTable({ jobs }: { jobs: Job[] }) {
  return (
    <div className="overflow-hidden bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Recent Jobs</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-6 py-3">Candidate</th>
              <th className="px-6 py-3">Repository</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
            {jobs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                  No jobs found. Start an analysis above.
                </td>
              </tr>
            )}
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                <td className="whitespace-nowrap px-6 py-4 font-medium text-indigo-600">
                  @{job.candidate.handle}
                </td>
                <td className="max-w-xs truncate px-6 py-4 text-slate-500">
                  {job.repositoryUrl.replace('https://github.com/', '')}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <StatusBadge status={job.status} />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                  {new Date(job.createdAt).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Job['status'] }) {
  const styles = {
    PENDING: 'bg-slate-100 text-slate-600 border-slate-200',
    CLONING: 'bg-blue-100 text-blue-600 border-blue-200',
    ANALYZING: 'bg-indigo-100 text-indigo-600 border-indigo-200',
    COMPLETED: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    FAILED: 'bg-rose-100 text-rose-600 border-rose-200',
  };

  const icons = {
    PENDING: <Clock className="mr-1.5 h-3.5 w-3.5" />,
    CLONING: <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />,
    ANALYZING: <Search className="mr-1.5 h-3.5 w-3.5 animate-pulse" />,
    COMPLETED: <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />,
    FAILED: <XCircle className="mr-1.5 h-3.5 w-3.5" />,
  };

  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
      styles[status]
    )}>
      {icons[status]}
      {status}
    </span>
  );
}
