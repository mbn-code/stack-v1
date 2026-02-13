'use client';

import { useState, useEffect } from 'react';
import AnalysisForm from '@/app/components/AnalysisForm';
import JobStatusTable, { Job } from '@/app/components/JobStatusTable';
import CsrReportTable, { Report } from '@/app/components/CsrReportTable';
import CsrChart, { ChartData } from '@/app/components/CsrChart';
import { useRealtimeJobs } from '@/app/hooks/useRealtimeJobs';
import { LayoutDashboard, Database, Activity, BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const jobs = useRealtimeJobs([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (Array.isArray(data)) setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // Refresh reports when a job completes
    const completedJobs = jobs.filter(j => j.status === 'COMPLETED').length;
    fetchReports();
  }, [jobs]);

  const chartData: ChartData[] = reports.reduce((acc: ChartData[], report) => {
    const existing = acc.find(a => a.handle === report.candidate.handle);
    if (existing) {
      // Average or latest? Let's take latest for V1
      return acc;
    }
    acc.push({ handle: report.candidate.handle, csr: parseFloat(report.csrPercentage.toString()) });
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar / Nav */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">Stack V1</span>
            </div>
            <div className="text-sm text-slate-500 font-medium">
              Hiring Signal Research Dashboard
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Left Column: Form & Chart */}
          <div className="lg:col-span-1 space-y-8">
            <AnalysisForm onJobCreated={() => {}} />
            <CsrChart data={chartData} />
          </div>

          {/* Right Column: Tables */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center mb-4 space-x-2 text-slate-800">
                <Activity className="h-5 w-5" />
                <h2 className="text-xl font-bold">Execution Pipeline</h2>
              </div>
              <JobStatusTable jobs={jobs} />
            </section>

            <section>
              <div className="flex items-center mb-4 space-x-2 text-slate-800">
                <Database className="h-5 w-5" />
                <h2 className="text-xl font-bold">Reliability Reports</h2>
              </div>
              <CsrReportTable reports={reports} />
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
