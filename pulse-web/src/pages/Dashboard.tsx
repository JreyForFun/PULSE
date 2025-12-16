import { useState, useEffect } from 'react';
import { Users, AlertTriangle, Calendar, Activity, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { residentsService } from '../services/residentsService';
import { visitsService } from '../services/visitsService';
import type { Resident, Visit } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [residentsData, visitsData] = await Promise.all([
        residentsService.getAll(),
        visitsService.getAll()
      ]);
      setResidents(residentsData);
      setVisits(visitsData);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Stats Calculations
  const totalResidents = residents.length;
  const highRisk = residents.filter(r => r.risk_level === 'High').length;
  const mediumRisk = residents.filter(r => r.risk_level === 'Medium').length;
  const lowRisk = residents.filter(r => r.risk_level === 'Low').length;

  // Visits this month
  const now = new Date();
  const visitsThisMonth = visits.filter(v => {
    const d = new Date(v.visit_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const highRiskPct = totalResidents > 0 ? (highRisk / totalResidents) * 100 : 0;
  const medRiskPct = totalResidents > 0 ? (mediumRisk / totalResidents) * 100 : 0;
  const lowRiskPct = totalResidents > 0 ? (lowRisk / totalResidents) * 100 : 0;

  // 2. Derive Priority Queue (High Risk OR Follow Up, limit 3)
  const priorityQueue = residents
    .filter(r => r.risk_level === 'High' || r.follow_up_required)
    // Sort: Follow-up first, then High Risk
    .sort((a, b) => (b.follow_up_required === a.follow_up_required ? 0 : b.follow_up_required ? 1 : -1))
    .slice(0, 3);

  // 3. Recent Activity (Latest 5 visits)
  const recentActivity = visits.slice(0, 5);

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Pulse Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of Barangay Health Status</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="text-sm text-indigo-600 font-medium bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors">
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Residents"
          value={totalResidents}
          icon={Users}
          trend="Registered"
        />
        <StatCard
          label="Visits This Month"
          value={visitsThisMonth}
          icon={Calendar}
          color="green"
          trend="Health checks"
        />
        <StatCard
          label="High Risk Residents"
          value={highRisk}
          icon={AlertTriangle}
          color="red"
          trend={`${Math.round(highRiskPct)}% of total`}
        />
        <StatCard
          label="Need Follow-up"
          value={residents.filter(r => r.follow_up_required).length}
          icon={Activity}
          color="amber"
          trend="Action required"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Action Queue */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Priority Follow-Ups
              </h3>
              <p className="text-sm text-gray-500">Residents needing immediate attention</p>
            </div>
          </div>

          <div className="space-y-4">
            {priorityQueue.length === 0 ? (
              <div className="text-center p-6 bg-green-50 rounded-lg text-green-700">
                All caught up! No priority follow-ups needed.
              </div>
            ) : (
              priorityQueue.map(resident => (
                <div key={resident.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-lg transition-colors hover:bg-red-100 cursor-pointer" onClick={() => navigate(`/dashboard/residents/${resident.id}`)}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-red-100 font-bold text-red-600 shrink-0">
                      {resident.risk_level === 'High' ? '!' : '?'}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{resident.last_name}, {resident.first_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {resident.risk_level === 'High' && <span className="text-xs bg-red-200 text-red-800 px-1.5 py-0.5 rounded">High Risk</span>}
                        {resident.follow_up_required && <span className="text-xs bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded">Follow-up</span>}
                        <span className="text-xs text-red-700 font-medium">• {resident.address}</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-red-400" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Risk Distribution Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-1">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Risk Overview</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">High ({highRisk})</span>
                <span className="text-gray-500">{Math.round(highRiskPct)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className="bg-red-500 h-3 rounded-full transition-all duration-500" style={{ width: `${highRiskPct}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Medium ({mediumRisk})</span>
                <span className="text-gray-500">{Math.round(medRiskPct)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className="bg-amber-400 h-3 rounded-full transition-all duration-500" style={{ width: `${medRiskPct}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Low ({lowRisk})</span>
                <span className="text-gray-500">{Math.round(lowRiskPct)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className="bg-green-500 h-3 rounded-full transition-all duration-500" style={{ width: `${lowRiskPct}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-3">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 italic">No recent activity.</p>
            ) : (
              recentActivity.map((visit) => {
                // Try to find resident name if available in visit object (depends on service join) or fallback
                const residentName = (visit as any).residents
                  ? `${(visit as any).residents.first_name} ${(visit as any).residents.last_name}`
                  : 'Resident';

                return (
                  <div key={visit.id} className="flex gap-3 items-start pb-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 p-2 rounded transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/visits`)}>
                    <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-gray-900">{residentName}</span> visit logged.
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(visit.created_at || visit.visit_date).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <button className="w-full mt-4 text-center text-sm text-indigo-600 font-medium hover:underline" onClick={() => navigate('/dashboard/visits')}>
            View Log History
          </button>
        </div>
      </div>
    </div>
  );
}
