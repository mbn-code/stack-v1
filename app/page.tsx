'use client';

import Link from 'next/link';
import { UserCircle, Briefcase, LayoutDashboard } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="bg-indigo-600 p-4 rounded-2xl mb-8 shadow-xl">
        <LayoutDashboard className="h-12 w-12 text-white" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 mb-2 text-center">Stack V1</h1>
      <p className="text-slate-500 mb-10 text-center max-w-md">
        Engineering Reliability Intelligence. Select your portal to continue.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Recruiter Login */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center">
          <div className="bg-blue-100 p-3 rounded-full mb-4">
            <Briefcase className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Recruiter Portal</h2>
          <p className="text-sm text-slate-500 text-center mb-6">
            Search for top engineers and analyze their code survival stats.
          </p>
          <button 
            onClick={() => login('RECRUITER')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Login as Recruiter
          </button>
        </div>

        {/* Candidate Login */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center">
          <div className="bg-emerald-100 p-3 rounded-full mb-4">
            <UserCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Candidate Portal</h2>
          <p className="text-sm text-slate-500 text-center mb-6">
            View your personal CSR score and claim your work history.
          </p>
          <button 
            onClick={() => login('CANDIDATE')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Login as Candidate
          </button>
        </div>
      </div>
    </div>
  );
}

function login(role: string) {
  // Mock login: set a cookie and redirect
  document.cookie = `user_role=${role}; path=/`;
  window.location.href = role === 'RECRUITER' ? '/dashboard/recruiter' : '/dashboard/candidate';
}
