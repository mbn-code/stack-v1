'use client';

import { formatPercent } from '@/lib/utils';

export type Report = {
  id: string;
  csrPercentage: number;
  linesOriginal: number;
  linesSurviving: number;
  calculatedAt: string;
  candidate: { handle: string };
  job: { repositoryUrl: string };
};

export default function CsrReportTable({ reports }: { reports: Report[] }) {
  return (
    <div className="overflow-hidden bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">CSR Reports</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-6 py-3">Candidate</th>
              <th className="px-6 py-3">Repository</th>
              <th className="px-6 py-3 text-right">Original</th>
              <th className="px-6 py-3 text-right">Surviving</th>
              <th className="px-6 py-3 text-right">CSR %</th>
              <th className="px-6 py-3 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
            {reports.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                  No reports available yet.
                </td>
              </tr>
            )}
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                <td className="whitespace-nowrap px-6 py-4 font-medium text-indigo-600">
                  @{report.candidate.handle}
                </td>
                <td className="max-w-xs truncate px-6 py-4 text-slate-500">
                  {report.job.repositoryUrl.replace('https://github.com/', '')}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-slate-500">
                  {report.linesOriginal}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-slate-500">
                  {report.linesSurviving}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-slate-900">
                  <CsrValue value={report.csrPercentage} />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-slate-400">
                  {new Date(report.calculatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CsrValue({ value }: { value: number }) {
  const color = value >= 80 ? 'text-emerald-600' : value >= 50 ? 'text-amber-600' : 'text-rose-600';
  return <span className={color}>{formatPercent(value)}</span>;
}
