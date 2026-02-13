'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Job } from '@/app/components/JobStatusTable';

export function useRealtimeJobs(initialJobs: Job[]) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);

  useEffect(() => {
    // Initial fetch to ensure sync
    const fetchJobs = async () => {
      const res = await fetch('/api/jobs/list');
      const data = await res.json();
      if (Array.isArray(data)) setJobs(data);
    };

    fetchJobs();

    // Subscribe to changes in analysis_jobs table
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_jobs',
        },
        () => {
          // Re-fetch when any change occurs for simplicity in V1
          // In V2, we can update individual records in state
          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return jobs;
}
