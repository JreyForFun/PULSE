import type { RiskLevel } from '../types';
import clsx from 'clsx';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export default function RiskBadge({ level, className }: RiskBadgeProps) {
  const colors = {
    Low: 'bg-green-100 text-green-700 border-green-200',
    Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    High: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <span
      className={clsx(
        'px-2.5 py-0.5 rounded-full text-xs font-medium border',
        colors[level],
        className
      )}
    >
      {level} Risk
    </span>
  );
}
