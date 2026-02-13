'use client';

import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Activity, CheckCircle2, TrendingUp, Search } from 'lucide-react';
import ScoutingFilters from '@/app/components/ScoutingFilters';
import CandidateCard, { Candidate } from '@/app/components/CandidateCard';
import { useRealtimeJobs } from '@/app/hooks/useRealtimeJobs';

export default function RecruiterDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [language, setLanguage] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [analyzingHandles, setAnalyzingHandles] = useState<Set<string>>(new Set());
  
  const jobs = useRealtimeJobs([]);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (Array.isArray(data)) setReports(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Initial load: Fetch reports and show "Top Talent"
  useEffect(() => {
    fetchReports();
    loadInitialTalent();
  }, []);

  const loadInitialTalent = async () => {
    setIsSearching(true);
    try {
      // Fetch already analyzed candidates first
      const res = await fetch('/api/candidates?q=type:user&limit=10');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCandidates(data);
        setPage(1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [jobs]);

  const searchCandidates = async (isNewSearch = true) => {
    // Prevent overlapping searches
    if (isSearching) return;

    const currentQuery = (searchTerm.trim() || location.trim() || language.trim());
    if (!currentQuery && isNewSearch) {
      loadInitialTalent();
      return;
    }

    setIsSearching(true);
    const currentPage = isNewSearch ? 1 : page + 1;
    
    try {
      const res = await fetch(`/api/candidates?q=${searchTerm}&loc=${location}&lang=${language}&page=${currentPage}`);
      const data = await res.json();
      
      if (res.ok && Array.isArray(data)) {
        if (isNewSearch) {
          setCandidates(data);
          setPage(1);
        } else {
          // Deduplicate based on handle
          setCandidates(prev => {
            const handles = new Set(prev.map(c => c.handle));
            const uniqueNew = data.filter(c => !handles.has(c.handle));
            return [...prev, ...uniqueNew];
          });
          setPage(currentPage);
        }
        setHasMore(data.length === 10);
      } else {
        if (!isNewSearch) setHasMore(false); // Stop trying if we hit an error on scroll
      }
    } catch (err) {
      console.error(err);
    } finally {
      // Small artificial delay to prevent scroll "bounce" re-triggering
      setTimeout(() => setIsSearching(false), 500);
    }
  };

  // Infinite Scroll Handler
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Load more when user is 100px from the bottom
    if (scrollHeight - scrollTop <= clientHeight + 100 && !isSearching && hasMore) {
      searchCandidates(false);
    }
  };

  const handleBulkAnalyze = async (handle: string) => {
    setAnalyzingHandles(prev => new Set(prev).add(handle));
    try {
      const repoRes = await fetch(`/api/candidates/repos?handle=${handle}`);
      const repos = await repoRes.json();
      if (!Array.isArray(repos)) return;

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
      setTimeout(() => setAnalyzingHandles(prev => {
        const next = new Set(prev);
        next.delete(handle);
        return next;
      }), 3000);
    }
  };

  // Helper to find the status and report for a candidate card
  const getCandidateAnalysis = (handle: string) => {
    const candidateJobs = jobs.filter(j => j.candidate.handle === handle);
    const candidateReport = reports.find(r => r.candidate.handle === handle);
    
    // Status priority: ANALYZING > CLONING > PENDING > COMPLETED > FAILED
    const statusOrder = ['ANALYZING', 'CLONING', 'PENDING', 'COMPLETED', 'FAILED'];
    const currentStatus = candidateJobs.length > 0 
      ? statusOrder.find(s => candidateJobs.some(j => j.status === s))
      : candidateReport ? 'COMPLETED' : undefined;

    return {
      status: currentStatus as any,
      csrReport: candidateReport ? {
        csrPercentage: parseFloat(candidateReport.csrPercentage),
        linesOriginal: candidateReport.linesOriginal
      } : undefined
    };
  };

  const analyzedCount = reports.length;
  const avgCsr = reports.length > 0 
    ? reports.reduce((acc, r) => acc + parseFloat(r.csrPercentage), 0) / reports.length 
    : 0;

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* LEFT PANEL: Filters */}
      <ScoutingFilters 
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        location={location} setLocation={setLocation}
        language={language} setLanguage={setLanguage}
        onSearch={searchCandidates}
        isSearching={isSearching}
      />

      {/* RIGHT PANEL: Results */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header / Stats */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4">
            <h1 className="text-sm font-black uppercase tracking-widest text-slate-900">Scouting Intelligence</h1>
            <div className="h-4 w-[1px] bg-slate-200" />
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
                <Users className="h-3.5 w-3.5" />
                <span>Found: {candidates.length}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Analyzed: {analyzedCount}</span>
              </div>
              {analyzedCount > 0 && (
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
                  <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Avg CSR: {avgCsr.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">Live Pipeline Connected</span>
          </div>
        </header>

        {/* Scrollable Results Area */}
        <div 
          className="flex-1 overflow-y-auto p-8 custom-scrollbar"
          onScroll={handleScroll}
        >
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Results Grid */}
            <div className="grid grid-cols-1 gap-4">
              {candidates.map(c => {
                const analysis = getCandidateAnalysis(c.handle);
                return (
                  <CandidateCard 
                    key={`${c.id}-${c.handle}`}
                    candidate={c}
                    onAnalyze={handleBulkAnalyze}
                    isAnalyzing={analyzingHandles.has(c.handle)}
                    {...analysis}
                  />
                );
              })}

              {!isSearching && candidates.length > 0 && hasMore && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
                </div>
              )}

              {candidates.length === 0 && !isSearching && (
                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-slate-300">
                  <div className="bg-slate-50 p-6 rounded-full mb-6">
                    <Search className="h-12 w-12 text-slate-200" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Candidates Scouted</h3>
                  <p className="text-slate-500 text-sm max-w-xs text-center">
                    Use the filters on the left to discover engineering talent from GitHub.
                  </p>
                </div>
              )}

              {isSearching && (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-2xl" />
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Margin for scroll safety */}
            <div className="h-8" />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
