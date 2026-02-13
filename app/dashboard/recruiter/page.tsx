'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Code2, Play, Activity, Database, LayoutDashboard } from 'lucide-react';
import JobStatusTable from '@/app/components/JobStatusTable';
import CsrReportTable from '@/app/components/CsrReportTable';
import { useRealtimeJobs } from '@/app/hooks/useRealtimeJobs';

export default function RecruiterDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [language, setLanguage] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const jobs = useRealtimeJobs([]);

  const searchCandidates = async () => {
    try {
      const res = await fetch(`/api/candidates?q=${searchTerm}&loc=${location}&lang=${language}`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setCandidates(data);
      } else {
        console.error('API did not return an array:', data);
        setCandidates([]);
      }
    } catch (err) {
      console.error('Failed to search candidates:', err);
      setCandidates([]);
    }
  };

  useEffect(() => {
    searchCandidates();
  }, []);

  const handleAnalyze = async (handle: string, repo: string) => {
    await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateHandle: handle, repositoryUrl: repo }),
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <LayoutDashboard className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-bold">Stack Recruiter</span>
          </div>
          <div className="text-sm font-medium text-slate-500">Recruiter Session</div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-4 font-bold text-slate-900">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Location</label>
                <div className="mt-1 relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="e.g. London" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Language</label>
                <div className="mt-1 relative">
                  <Code2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="e.g. Rust" 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button 
                onClick={searchCandidates}
                className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Search & Results */}
        <div className="lg:col-span-9 space-y-8">
          <div className="relative">
            <Search className="absolute left-4 top-4 h-6 w-6 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search for candidate handles..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchCandidates()}
              className="w-full pl-12 pr-4 py-4 text-lg border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {candidates.map(c => (
              <div key={c.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">@{c.handle}</h3>
                  <div className="flex space-x-3 text-sm text-slate-500 mt-1">
                    <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {c.location || 'Remote'}</span>
                    <span className="flex items-center"><Code2 className="h-3 w-3 mr-1" /> {c.languages.join(', ')}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleAnalyze(c.handle, 'https://github.com/mbn-code/stack-v1')} // Mocking a repo for demo
                  className="flex items-center bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-bold hover:bg-indigo-100"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Analyze
                </button>
              </div>
            ))}
          </div>

          <section>
            <div className="flex items-center space-x-2 mb-4 font-bold">
              <Activity className="h-5 w-5" />
              <span>Job Queue</span>
            </div>
            <JobStatusTable jobs={jobs} />
          </section>
        </div>
      </main>
    </div>
  );
}
