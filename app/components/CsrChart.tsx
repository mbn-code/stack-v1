'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export type ChartData = {
  handle: string;
  csr: number;
};

export default function CsrChart({ data }: { data: ChartData[] }) {
  const sortedData = [...data].sort((a, b) => b.csr - a.csr);

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
      <h2 className="text-lg font-semibold mb-6">Candidate Benchmark</h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} layout="vertical" margin={{ left: 20, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" domain={[0, 100]} fontSize={12} tickFormatter={(v) => `${v}%`} stroke="#64748b" />
            <YAxis
              dataKey="handle"
              type="category"
              fontSize={12}
              width={80}
              stroke="#64748b"
              tickFormatter={(v) => `@${v}`}
            />
            <Tooltip
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
              formatter={(v: number) => [`${v.toFixed(1)}%`, 'CSR']}
            />
            <Bar dataKey="csr" radius={[0, 4, 4, 0]} barSize={20}>
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.csr >= 80 ? '#10b981' : entry.csr >= 50 ? '#f59e0b' : '#f43f5e'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
