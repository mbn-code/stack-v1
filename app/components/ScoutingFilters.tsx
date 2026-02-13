'use client';

import { Search, Filter, MapPin, Code2, Loader2, ArrowRight } from 'lucide-react';

type ScoutingFiltersProps = {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
  onSearch: () => void;
  isSearching: boolean;
};

export default function ScoutingFilters({
  searchTerm, setSearchTerm,
  location, setLocation,
  language, setLanguage,
  onSearch, isSearching
}: ScoutingFiltersProps) {
  return (
    <div className="w-80 h-full bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-100 flex items-center space-x-2">
        <Filter className="h-4 w-4 text-indigo-600" />
        <span className="font-black text-slate-900 tracking-tight uppercase text-xs">Scouting Filters</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Identity Search */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identify Handle</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
            <input 
              type="text" 
              placeholder="e.g. mbn-code" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Location Filter */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Geographic Focus</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
            <input 
              type="text" 
              placeholder="e.g. London, UK" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Language Filter */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engineering Stack</label>
          <div className="relative">
            <Code2 className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
            <input 
              type="text" 
              placeholder="e.g. Rust, TS" 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-100 bg-slate-50/50">
        <button 
          onClick={onSearch}
          disabled={isSearching}
          className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-slate-200"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span>Find Talent</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
