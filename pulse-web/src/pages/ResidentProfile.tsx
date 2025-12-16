import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, MapPin, Calendar, Activity, AlertTriangle, FileText, Plus, Loader2, ArrowLeft } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import Button from '../components/ui/Button';
import { calculateRisk } from '../lib/riskEngine';
import { residentsService } from '../services/residentsService';
import { visitsService } from '../services/visitsService';
import { settingsService } from '../services/settingsService';
import type { Resident, Visit, RiskWeights } from '../types';

export default function ResidentProfile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [resident, setResident] = useState<Resident | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskWeights, setRiskWeights] = useState<RiskWeights | undefined>(undefined);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (residentId: string) => {
    try {
      setIsLoading(true);
      const [residentData, visitsData, settings] = await Promise.all([
        residentsService.getById(residentId),
        visitsService.getByResidentId(residentId),
        settingsService.getSettings()
      ]);

      if (!residentData) {
        setError('Resident not found');
      } else {
        setResident(residentData);
        setVisits(visitsData);
      }

      if (settings) {
        setRiskWeights({
          age_over_60: settings.weight_age_over_60,
          pregnancy: settings.weight_pregnancy,
          chronic_condition: settings.weight_chronic_condition,
          missed_visit: settings.weight_missed_visit,
        });
      }

    } catch (err) {
      console.error(err);
      setError('Failed to load resident profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (error || !resident) return <div className="p-8 text-center text-red-600">{error || 'Resident not found'}</div>;

  const riskAnalysis = calculateRisk(resident, riskWeights);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 mb-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{resident.last_name}, {resident.first_name}</h1>
            <RiskBadge level={resident.risk_level} className="text-sm px-3 py-1" />
          </div>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> {resident.address}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/residents/edit/${resident.id}`)}>
            Edit Profile
          </Button>
          <Button
            onClick={() => navigate(`/dashboard/residents/${resident.id}/visit`)}
            icon={<Plus className="w-4 h-4" />}>
            Log Visit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal Info & Conditions */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              Personal Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Age</span>
                <span className="font-medium">{resident.age} years old</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Sex</span>
                <span className="font-medium">{resident.sex}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Birthdate</span>
                <span className="font-medium">{resident.birthdate || 'N/A'}</span>
              </div>
              <div className="pt-2">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Category Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {resident.is_senior && <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">Senior</span>}
                  {resident.is_pwd && <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md">PWD</span>}
                  {resident.is_pregnant && <span className="px-2 py-1 bg-pink-50 text-pink-700 text-xs rounded-md">Pregnant</span>}
                  {resident.is_child && <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md">Child</span>}
                  {!resident.is_senior && !resident.is_pwd && !resident.is_pregnant && !resident.is_child && <span className="text-gray-400 text-sm">None</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-400" />
              Medical Conditions
            </h2>
            {resident.conditions && resident.conditions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {resident.conditions.map(condition => (
                  <span key={condition} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-100">
                    {condition}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No chronic conditions recorded.</p>
            )}
          </div>
        </div>

        {/* Right Column: Risk Analysis & Visits */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-gray-400" />
              Risk Analysis
            </h2>
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg">
              <p className="text-orange-800 font-medium mb-2">Why is this resident {resident.risk_level} Risk?</p>
              <ul className="list-disc list-inside text-sm text-orange-700 space-y-1">
                {riskAnalysis?.factors.map((factor, idx) => (
                  <li key={idx}>{factor}</li>
                ))}
                {!riskAnalysis?.factors.length && <li>No specific risk factors identified.</li>}
              </ul>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                Recent Visits
              </h2>
              <button
                onClick={() => navigate(`/dashboard/residents/${resident.id}/history`)}
                className="text-indigo-600 text-sm font-medium hover:underline">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {visits.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No visits recorded yet.</p>
              ) : (
                visits.slice(0, 3).map((visit) => (
                  <div key={visit.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">Health Visit</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(visit.visit_date).toLocaleDateString()}
                        </p>
                      </div>
                      {visit.follow_up_required && <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Follow-up Needed</span>}
                    </div>
                    {visit.notes && <p className="text-sm text-gray-600">{visit.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
