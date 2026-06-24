'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Cell,
} from 'recharts';
import { useTechnicians } from '../../hooks/useDashboard';
import type { HealthStatus } from '../../types';

// RAG colors selaras ProjectHealthPieChart (chart kesehatan kanonik).
const RAG_COLORS: Record<HealthStatus, string> = {
  green: '#06d6a0',
  amber: '#ffd700',
  red: '#ef4444',
};

interface Technician {
  id: number;
  name: string;
  spi_value: number | null;
  health_status: HealthStatus | null;
}

function CardWrapper({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function TechnicianSPIComparisonChart() {
  const { data: rawData, isLoading } = useTechnicians();
  const title = 'Perbandingan SPI Teknisi';

  if (isLoading) {
    return (
      <CardWrapper title={title}>
        <div className="flex items-center justify-center h-56">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" aria-label="Memuat grafik..." />
        </div>
      </CardWrapper>
    );
  }

  const techs = (rawData ?? []) as Technician[];
  const unrated = techs.filter((d) => d.spi_value == null).length;
  const chartData = techs
    .filter((d) => d.spi_value != null)
    .map((d) => ({ name: d.name, spi: Number(d.spi_value), status: d.health_status }))
    .sort((a, b) => b.spi - a.spi);

  if (chartData.length === 0) {
    return (
      <CardWrapper title={title}>
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Belum ada data SPI teknisi</p>
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
          />
          <ReferenceLine x={0.95} stroke="#22c55e" strokeDasharray="5 4" strokeWidth={1.5}
            label={{ value: 'Tepat Waktu', position: 'top', fontSize: 10, fill: '#22c55e' }} />
          <ReferenceLine x={0.85} stroke="#ef4444" strokeDasharray="5 4" strokeWidth={1.5}
            label={{ value: 'Kritis', position: 'top', fontSize: 10, fill: '#ef4444' }} />
          <Bar dataKey="spi" name="SPI" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.status ? RAG_COLORS[entry.status] : '#9ca3af'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {unrated > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{unrated} teknisi belum dinilai</p>
      )}
    </CardWrapper>
  );
}
