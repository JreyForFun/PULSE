import { useState, useEffect } from 'react';
import { Calendar, User, Loader2, AlertCircle, Plus, Search, X, Activity, Save } from 'lucide-react';

import { visitsService } from '../services/visitsService';
import { residentsService } from '../services/residentsService';
import type { Resident } from '../types';
import Button from '../components/ui/Button';

const COMMON_SYMPTOMS = [
  'Fever', 'Cough', 'Colds', 'Headache', 'Dizziness',
  'High Blood Pressure', 'Body Pain', 'Diarrhea', 'Difficulty Breathing'
];

export default function Visits() {
  const [visits, setVisits] = useState<any[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selector Modal State
  const [showSelector, setShowSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New Visit Form State (Inline)
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [bp, setBp] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [visitsData, residentsData] = await Promise.all([
        visitsService.getAll(),
        residentsService.getAll()
      ]);
      setVisits(visitsData);
      setResidents(residentsData);
    } catch (err: any) {
      console.error("Failed to load visits data", err);
      setError("Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredResidents = residents.filter(r =>
    `${r.first_name} ${r.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setSelectedResident(null);
    setSearchQuery('');
    setDate(new Date().toISOString().split('T')[0]);
    setSelectedSymptoms([]);
    setNotes('');
    setBp('');
    setFollowUpRequired(false);
  };

  const handleClose = () => {
    setShowSelector(false);
    resetForm();
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const fullNotes = bp ? `BP: ${bp}. ${notes}` : notes;

      await visitsService.create(
        {
          resident_id: selectedResident.id,
          visit_date: date,
          follow_up_required: followUpRequired,
          notes: fullNotes,
          provider_name: 'BHW'
        },
        selectedSymptoms
      );

      // Refresh list
      await loadData();
      handleClose();

    } catch (err: any) {
      console.error("Failed to log visit:", err);
      // Don't close modal on error so user can retry
      alert("Failed to save visit: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visit Log</h1>
          <p className="text-gray-500 text-sm mt-1">Recent health visits across the barangay.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setShowSelector(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Log New Visit
          </Button>
        </div>
      </div>

      {error ? (
        <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg border border-red-100">
          <AlertCircle className="inline w-6 h-6 mr-2" />
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {visits.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p>No visits recorded yet.</p>
              </div>
            ) : (
              visits.map((visit) => (
                <div key={visit.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">
                          {visit.residents?.first_name} {visit.residents?.last_name || 'Unknown Resident'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <User className="w-3 h-3" /> Resident
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{new Date(visit.visit_date).toLocaleDateString()}</span>
                        </div>
                        {visit.notes && (
                          <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded border border-gray-100 italic">
                            "{visit.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                    {visit.follow_up_required && (
                      <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-100">
                        Follow-up Needed
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Unified Log Visit Modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">
                {selectedResident ? `Log Visit: ${selectedResident.first_name} ${selectedResident.last_name}` : 'Select Resident'}
              </h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!selectedResident ? (
              // Step 1: Select Resident
              <>
                <div className="p-4 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search resident..."
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-y-auto p-2 space-y-1 flex-1">
                  {filteredResidents.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No residents found.</div>
                  ) : (
                    filteredResidents.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setSelectedResident(r)}
                        className="w-full text-left p-3 hover:bg-indigo-50 rounded-lg flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-indigo-700">{r.last_name}, {r.first_name}</p>
                          <p className="text-xs text-gray-500">{r.age} yo • {r.risk_level} Risk</p>
                        </div>
                        <Plus className="w-4 h-4 text-gray-300 group-hover:text-indigo-600" />
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              // Step 2: Log Visit Form
              <div className="overflow-y-auto p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    {/* Date */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Visit Date</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    {/* Symptoms */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-gray-400" /> Symptoms
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {COMMON_SYMPTOMS.map(symptom => (
                          <button
                            key={symptom}
                            type="button"
                            onClick={() => toggleSymptom(symptom)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${selectedSymptoms.includes(symptom)
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                              }`}
                          >
                            {symptom}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Vitals/Notes */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Observations</label>
                      <input
                        type="text"
                        placeholder="BP (e.g. 120/80)"
                        className="w-full p-2 border border-gray-300 rounded-lg mb-2 text-sm"
                        value={bp}
                        onChange={e => setBp(e.target.value)}
                      />
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 text-sm"
                        placeholder="Specific notes..."
                      />
                    </div>

                    {/* Follow-up */}
                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <input
                        type="checkbox"
                        id="followup"
                        checked={followUpRequired}
                        onChange={(e) => setFollowUpRequired(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                      />
                      <label htmlFor="followup" className="text-sm font-medium text-amber-900 cursor-pointer">
                        Requires Priority Follow-up?
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setSelectedResident(null)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Back to Selection
                    </button>

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                      <Button type="submit" icon={<Save className="w-4 h-4" />} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Record'}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
