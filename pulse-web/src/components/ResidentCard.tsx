import type { Resident } from '../types';
import RiskBadge from './RiskBadge';
import { Calendar, MapPin, User } from 'lucide-react';

interface ResidentCardProps {
  resident: Resident;
  onClick?: () => void;
}

export default function ResidentCard({ resident, onClick }: ResidentCardProps) {
  return (
    <div
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {resident.last_name}, {resident.first_name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <User className="w-4 h-4" />
            <span>{resident.sex}, {resident.age} y/o</span>
          </div>
        </div>
        <RiskBadge level={resident.risk_level} />
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="truncate">{resident.address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>Last visit: {resident.last_visit || 'Never'}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {resident.is_senior && (
          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md font-medium">Senior</span>
        )}
        {resident.is_pwd && (
          <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md font-medium">PWD</span>
        )}
        {resident.is_pregnant && (
          <span className="px-2 py-1 bg-pink-50 text-pink-700 text-xs rounded-md font-medium">Pregnant</span>
        )}
      </div>
    </div>
  );
}
