'use client';

import { MapPin, Code2, Play, Loader2, CheckCircle2, TrendingUp, Github, ExternalLink } from 'lucide-react';
import { cn, formatPercent } from '@/lib/utils';

export type Candidate = {
  id: string;
  handle: string;
  avatarUrl: string;
  location?: string;
  bio?: string;
  languages: string[];
};

type CandidateCardProps = {
  candidate: Candidate;
  onAnalyze: (handle: string) => void;
  isAnalyzing: boolean;
  status?: 'PENDING' | 'CLONING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
  csrReport?: {
    csrPercentage: number;
    linesOriginal: number;
  };
};

export default function CandidateCard({ 
  candidate, 
  onAnalyze, 
  isAnalyzing, 
  status,
  csrReport 
}: CandidateCardProps) {
  
  const isAnalyzed = status === 'COMPLETED' && csrReport;

  return (
    <div className={cn(
      "bg-white rounded-xl border border-slate-200 p-5 transition-all group",
      isAnalyzed ? "border-emerald-100 bg-emerald-50/10" : "hover:border-indigo-300 hover:shadow-md"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <img 
            src={candidate.avatarUrl} 
            alt={candidate.handle} 
            className="w-12 h-12 rounded-full border border-slate-100 shadow-sm" 
          />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600">@{candidate.handle}</h3>
              {isAnalyzed && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            </div>
            <div className="flex items-center space-x-3 mt-0.5">
              <span className="flex items-center text-xs text-slate-400">
                <MapPin className="h-3 w-3 mr-1" /> {candidate.location || 'Remote'}
              </span>
              <span className="flex items-center text-xs text-slate-400 font-medium">
                <Code2 className="h-3 w-3 mr-1" /> {candidate.languages[0] || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2">
          {isAnalyzed ? (
            <div className="text-right">
              <div className="flex items-center text-emerald-600 font-black text-xl leading-none">
                <TrendingUp className="h-4 w-4 mr-1.5" />
                {formatPercent(csrReport.csrPercentage)}
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Reliability Score</span>
            </div>
          ) : (
            <button 
              onClick={() => onAnalyze(candidate.handle)}
              disabled={isAnalyzing || !!status}
              className={cn(
                "flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95",
                status 
                  ? "bg-slate-100 text-slate-400 cursor-default"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
              )}
            >
              {isAnalyzing || (status && status !== 'COMPLETED') ? (
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 mr-2" />
              )}
              {status === 'PENDING' ? 'Queued' : 
               status === 'CLONING' || status === 'ANALYZING' ? 'Processing' : 
               status === 'FAILED' ? 'Retry' : 'Analyze Talent'}
            </button>
          )}
        </div>
      </div>

      {/* Candidate Bio / Repo Snippets */}
      <div className="mt-4">
        <p className="text-sm text-slate-500 line-clamp-1 mb-3 italic">
          {candidate.bio || "No biography provided by user."}
        </p>
        
        <div className="flex items-center space-x-2 overflow-hidden">
          <div className="bg-slate-50 text-[10px] font-bold text-slate-500 px-2 py-1 rounded flex items-center border border-slate-100">
            <Github className="h-3 w-3 mr-1.5" /> REPOS: TOP 3 AUTO-SELECTED
          </div>
          {isAnalyzed && (
            <div className="bg-emerald-50 text-[10px] font-bold text-emerald-600 px-2 py-1 rounded flex items-center border border-emerald-100">
              <Database className="h-3 w-3 mr-1.5" /> {csrReport.linesOriginal.toLocaleString()} LINES VERIFIED
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Database({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>
    </svg>
  );
}
