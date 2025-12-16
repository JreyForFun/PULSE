import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Calendar, AlertCircle, Loader2, ArrowLeft, Activity } from 'lucide-react';
import Button from '../components/ui/Button';
import { residentsService } from '../services/residentsService';
import { visitsService } from '../services/visitsService';

const COMMON_SYMPTOMS = [
  'Fever', 'Cough', 'Colds', 'Headache', 'Dizziness',
  'High Blood Pressure', 'Body Pain', 'Diarrhea', 'Difficulty Breathing'
];

export default function LogVisit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [residentName, setResidentName] = useState('Loading...');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [bp, setBp] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);

  useEffect(() => {
    if (id) {
      loadResident(id);
    }
  }, [id]);

  const loadResident = async (residentId: string) => {
    try {
      const resident = await residentsService.getById(residentId);
      if (resident) {
        setResidentName(`${resident.first_name} ${resident.last_name}`);
      } else {
        setResidentName("Unknown Resident");
      }
    } catch (err) {
      console.error(err);
      setResidentName("Error loading resident");
    } finally {
      setIsLoading(false);
    }
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
    if (!id) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const fullNotes = bp ? `BP: ${bp}. ${notes}` : notes;

      await visitsService.create(
        {
          resident_id: id,
          visit_date: date,
          follow_up_required: followUpRequired,
          notes: fullNotes,
          provider_name: 'BHW' // Placeholder
        },
        selectedSymptoms
      );
      navigate(`/dashboard/residents/${id}`);
    } catch (err: any) {
      console.error("Failed to log visit:", err);
      setError(err.message || "Failed to save visit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Log Home Visit</h1>
          <p className="text-gray-500 text-sm mt-1">Recording visit for <span className="font-semibold text-indigo-600">{residentName}</span></p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">

        {/* Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" /> Visit Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        {/* Symptoms */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400" /> Symptoms Observed
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {COMMON_SYMPTOMS.map(symptom => (
              <button
                key={symptom}
                type="button"
                onClick={() => toggleSymptom(symptom)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${selectedSymptoms.includes(symptom)
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
              >
                {symptom}
              </button>
            ))}
          </div>
        </div>

        {/* Vitals & Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Detailed Notes</label>

          <input
            type="text"
            placeholder="BP (e.g. 120/80)"
            className="w-full p-2 border border-gray-300 rounded-lg mb-2"
            value={bp}
            onChange={e => setBp(e.target.value)}
          />

          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter specific complaints, temperature, or other observations..."
          />
        </div>

        {/* Follow-up */}
        <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-lg border border-amber-100 text-amber-900">
          <input
            type="checkbox"
            id="followup"
            checked={followUpRequired}
            onChange={(e) => setFollowUpRequired(e.target.checked)}
            className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
          />
          <label htmlFor="followup" className="font-medium cursor-pointer">
            Requires Priority Follow-up?
          </label>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" icon={<Save className="w-4 h-4" />} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Visit Record'}
          </Button>
        </div>
      </form>
    </div>
  );
}
