'use client';

import { useState, useEffect } from 'react';
import { User, ShieldCheck, Github, LayoutDashboard, Database, TrendingUp } from 'lucide-react';
import CsrReportTable from '@/app/components/CsrReportTable';

export default function CandidateDashboard() {
  const [reports, setReports] = useState([]);
  const handle = 'mbn-code'; // Mocking current user session

  useEffect(() => {
    fetch(`/api/reports?candidateHandle=${handle}`)
      .then(res => res.json())
      .then(setReports);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <LayoutDashboard className="h-6 w-6 text-emerald-600" />
            <span className="text-xl font-bold">Stack Candidate</span>
          </div>
          <div className="flex items-center space-x-4">
             <div className="flex items-center bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">
               <ShieldCheck className="h-4 w-4 mr-1.5" /> Verified
             </div>
             <span className="text-sm font-medium text-slate-500">@{handle}</span>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm md:col-span-1 flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <User className="h-12 w-12 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold">@{handle}</h2>
            <p className="text-slate-500 text-sm mt-1">Software Engineer</p>
            <div className="mt-6 w-full space-y-3">
              <button className="w-full flex items-center justify-center space-x-2 bg-slate-900 text-white py-2 rounded-lg text-sm font-bold">
                <Github className="h-4 w-4" />
                <span>Link New Repository</span>
              </button>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center text-slate-400 mb-2">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">Average CSR</span>
                </div>
                <div className="text-3xl font-black text-emerald-600">98.4%</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center text-slate-400 mb-2">
                  <Database className="h-4 w-4 mr-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">Lines Analyzed</span>
                </div>
                <div className="text-3xl font-black text-slate-900">48,251</div>
              </div>
            </div>

            <section>
              <h2 className="text-lg font-bold mb-4">Your Reliability Reports</h2>
              <CsrReportTable reports={reports} />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
