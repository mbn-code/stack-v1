'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Code2, Play, Activity, Database, LayoutDashboard, Loader2, User } from 'lucide-react';
import JobStatusTable from '@/app/components/JobStatusTable';
import CsrReportTable from '@/app/components/CsrReportTable';
import { useRealtimeJobs } from '@/app/hooks/useRealtimeJobs';

export default function RecruiterDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [language, setLanguage] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [analyzingHandles, setAnalyzingHandles] = useState<Set<string>>(new Set());
  const jobs = useRealtimeJobs([]);

  const searchCandidates = async () => {
    if (!searchTerm.trim() && !location.trim() && !language.trim()) {
      setCandidates([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/candidates?q=${searchTerm}&loc=${location}&lang=${language}`);
      const data = await res.json();
      
      if (res.ok && Array.isArray(data)) {
        setCandidates(data);
      } else {
        alert(data.error || 'Search failed');
        setCandidates([]);
      }
    } catch (err) {
      console.error(err);
      setCandidates([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    // Only search on mount if there's a default or saved state
    // For now, we leave it empty to wait for user input and save quota
  }, []);


  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (Array.isArray(data)) setReports(data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [jobs]);

  const handleBulkAnalyze = async (handle: string) => {
    setAnalyzingHandles(prev => new Set(prev).add(handle));
    try {
      const repoRes = await fetch(`/api/candidates/repos?handle=${handle}`);
      const repos = await repoRes.json();

      if (!Array.isArray(repos)) throw new Error('Failed to get repos');

      for (const repo of repos.slice(0, 3)) {
        await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateHandle: handle, repositoryUrl: repo.url }),
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => {
        setAnalyzingHandles(prev => {
          const next = new Set(prev);
          next.delete(handle);
          return next;
        });
      }, 3000);
    }
  };

  // Filter candidates locally if we want to show "Best Candidates" based on analyzed reports
  const analyzedHandles = new Set(reports.map(r => r.candidate.handle));
  const bestCandidates = candidates.filter(c => analyzedHandles.has(c.handle));

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
              <span>Scouting Filters</span>
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
                disabled={isSearching}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Search GitHub'
                )}
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
              placeholder="Search GitHub handles..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchCandidates()}
              className="w-full pl-12 pr-4 py-4 text-lg border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {candidates.map(c => (
              <div key={c.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group hover:border-indigo-300 transition-colors">
                <div className="flex items-center space-x-4">
                  <img src={c.avatarUrl} alt={c.handle} className="w-14 h-14 rounded-full border-2 border-slate-100" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600">@{c.handle}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                      {c.location && <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {c.location}</span>}
                      {c.languages.length > 0 && <span className="flex items-center"><Code2 className="h-3 w-3 mr-1" /> {c.languages[0]}</span>}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleBulkAnalyze(c.handle)}
                  disabled={analyzingHandles.has(c.handle)}
                  className="flex items-center bg-indigo-50 text-indigo-600 px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-100 disabled:opacity-50 transition-all"
                >
                  {analyzingHandles.has(c.handle) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {analyzingHandles.has(c.handle) ? 'Analyzing Repos...' : 'Analyze Talent'}
                </button>
              </div>
            ))}
            {candidates.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <User className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No candidates found</h3>
                <p className="text-slate-500">Use the filters to find engineers on GitHub.</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <section className="space-y-4">
              <div className="flex items-center space-x-2 font-bold text-slate-800">
                 <Activity className="h-5 w-5" />
                 <span>Pipeline Status</span>
              </div>
              <JobStatusTable jobs={jobs} />
            </section>

            <section className="space-y-4">
               <div className="flex items-center space-x-2 font-bold text-slate-800">
                  <Database className="h-5 w-5" />
                  <span>Reliability Data</span>
               </div>
               <CsrReportTable reports={reports} /> 
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
