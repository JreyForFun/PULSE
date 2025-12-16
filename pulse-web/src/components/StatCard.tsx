import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: 'default' | 'red' | 'yellow' | 'green' | 'amber';
}

export default function StatCard({ label, value, icon: Icon, trend, color = 'default' }: StatCardProps) {
  const colors = {
    default: 'bg-indigo-50 text-indigo-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  const textColors = {
    default: 'text-gray-900',
    red: 'text-red-600',
    yellow: 'text-amber-600',
    green: 'text-green-600',
    amber: 'text-amber-700',
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className={clsx('p-3 rounded-lg', colors[color])}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && <span className="text-xs font-medium text-gray-400">{trend}</span>}
      </div>
      <div>
        <h3 className="text-gray-500 text-sm font-medium">{label}</h3>
        <p className={clsx('text-2xl font-bold mt-1', textColors[color])}>{value}</p>
      </div>
    </div>
  );
}
