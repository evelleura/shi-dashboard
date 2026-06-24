'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Cell,
} from 'recharts';
import { useTechnicianSpiBreakdown } from '../../hooks/useDashboard';
import type { HealthStatus } from '../../types';

// RAG colors selaras ProjectHealthPieChart (chart kesehatan kanonik).
const RAG_COLORS: Record<HealthStatus, string> = {
  green: '#06d6a0',
  amber: '#ffd700',
  red: '#ef4444',
};

function CardWrapper({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function TechnicianSPIBreakdownChart() {
  const { data: rawData, isLoading } = useTechnicianSpiBreakdown();
  const title = 'SPI Saya per Proyek';

  if (isLoading) {
    return (
      <CardWrapper title={title}>
        <div className="flex items-center justify-center h-56">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" aria-label="Memuat grafik..." />
        </div>
      </CardWrapper>
    );
  }

  const chartData = (rawData ?? [])
    .filter((d) => d.spi_value != null)
    .map((d) => ({
      name: d.project_name.length > 18 ? d.project_name.substring(0, 18) + '...' : d.project_name,
      fullName: d.project_name,
      spi: Number(d.spi_value),
      status: d.status,
    }));

  if (chartData.length === 0) {
    return (
      <CardWrapper title={title}>
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Belum ada data SPI proyek</p>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper title={title}>
      <ResponsiveContainer width="100%" height={Math.max(240, chartData.length * 34)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 24, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" domain={[0, 2]} tick={{ fontSize: 11 }} tickFormatter={(v: number) => v.toFixed(2)} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
            formatter={(value) => [Number(value).toFixed(2), 'SPI']}
            labelFormatter={(_label, payload) => payload?.[0]?.payload?.fullName ?? _label}
          />
          <ReferenceLine x={0.95} stroke="#22c55e" strokeDasharray="5 4" strokeWidth={1.5}
            label={{ value: 'Tepat Waktu', position: 'top', fontSize: 10, fill: '#22c55e' }} />
          <ReferenceLine x={0.85} stroke="#ef4444" strokeDasharray="5 4" strokeWidth={1.5}
            label={{ value: 'Kritis', position: 'top', fontSize: 10, fill: '#ef4444' }} />
          <Bar dataKey="spi" name="SPI" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {chartData.map((entry) => (
              <Cell key={entry.fullName} fill={entry.status ? RAG_COLORS[entry.status] : '#9ca3af'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </CardWrapper>
  );
}
