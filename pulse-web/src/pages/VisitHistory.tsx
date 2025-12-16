import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Loader2, AlertCircle } from 'lucide-react';
import { visitsService } from '../services/visitsService';
import { residentsService } from '../services/residentsService';
import type { Visit } from '../types';

export default function VisitHistory() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [residentName, setResidentName] = useState('');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (residentId: string) => {
    try {
      setIsLoading(true);
      const [resident, visitsData] = await Promise.all([
        residentsService.getById(residentId),
        visitsService.getByResidentId(residentId)
      ]);

      if (resident) {
        setResidentName(`${resident.last_name}, ${resident.first_name}`);
      } else {
        setResidentName('Unknown Resident');
      }
      setVisits(visitsData);
    } catch (err) {
      console.error("Failed to load history", err);
      setError("Failed to load visit history.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visit History</h1>
          <p className="text-gray-500 text-sm">for {residentName}</p>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">All Recorded Visits</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {visits.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No visits recorded.</div>
            ) : (
              visits.map((visit) => (
                <div key={visit.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Health Visit</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(visit.visit_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {visit.follow_up_required && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                        Follow-up
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm ml-12 mt-2">{visit.notes || 'No notes provided.'}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
