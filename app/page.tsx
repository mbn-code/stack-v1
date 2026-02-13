import Link from 'next/link';
import { ArrowRight, LayoutDashboard } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="bg-indigo-600 p-4 rounded-2xl mb-8 shadow-xl shadow-indigo-200">
        <LayoutDashboard className="h-12 w-12 text-white" />
      </div>
      <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-center">
        Stack <span className="text-indigo-600">V1</span>
      </h1>
      <p className="text-slate-500 text-lg mb-10 max-w-md text-center">
        Quantify engineering reliability with the Code Survival Rate (CSR) hiring signal.
      </p>
      
      <Link 
        href="/dashboard"
        className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg hover:shadow-indigo-200 active:scale-95"
      >
        <span>Enter Dashboard</span>
        <ArrowRight className="h-5 w-5" />
      </Link>
    </div>
  );
}
