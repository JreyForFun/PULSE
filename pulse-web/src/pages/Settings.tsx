import { useState, useEffect } from 'react';
import { User, Shield, Sliders, Loader2, AlertTriangle, Building2, BrainCircuit } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { settingsService } from '../services/settingsService';
import type { OrganizationSettings } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);

  // Local state for form values
  const [formData, setFormData] = useState<Partial<OrganizationSettings>>({});

  const isAdmin = role === 'admin';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      let data = await settingsService.getSettings();
      if (!data) {
        data = await settingsService.initializeDefaults();
      }
      setSettings(data);
      if (data) {
        setFormData(data);
      }
    } catch (error) {
      console.error("Failed to load settings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof OrganizationSettings, value: string | number) => {
    if (!isAdmin) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!settings?.id || !isAdmin) return;
    try {
      setLoading(true);
      await settingsService.updateSettings(settings.id, formData);
      alert('Settings saved successfully');
    } catch (error) {
      console.error(error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !settings) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings & Administration</h1>
        <p className="text-gray-500 text-sm mt-1">Manage barangay profile, risk weights, and user preferences.</p>
        {!isAdmin && (
          <div className="mt-4 p-3 bg-amber-50 text-amber-800 text-sm rounded-lg flex items-center gap-2 border border-amber-100">
            <AlertTriangle className="w-4 h-4" />
            <span><strong>View Only:</strong> You need Admin privileges to modify settings.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* User Profile */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">User Profile</h2>
          </div>
          <div className="space-y-4">
            <Input label="Email" value={user?.email || ''} disabled />
            <Input label="Role" value={role === 'admin' ? 'Administrator' : 'Barangay Health Worker'} disabled />
          </div>
        </section>

        {/* Organization Details */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Organization</h2>
          </div>

          <div className="space-y-4">
            <Input
              label="Barangay Name"
              value={formData.barangay_name || ''}
              onChange={e => handleChange('barangay_name', e.target.value)}
              disabled={!isAdmin}
            />
            <Input
              label="City / Municipality"
              value={formData.municipality || ''}
              onChange={e => handleChange('municipality', e.target.value)}
              disabled={!isAdmin}
            />
            <Input
              label="Health Station ID"
              value={formData.health_station_id || ''}
              onChange={e => handleChange('health_station_id', e.target.value)}
              disabled={!isAdmin}
            />
          </div>
        </section>

        {/* Risk Algorithm Configuration */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Risk Algorithm Weights</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Age &gt; 60 Weight</label>
              <input
                type="range" className={`w-full accent-indigo-600 ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`} min="0" max="50"
                value={formData.weight_age_over_60 || 0}
                onChange={e => handleChange('weight_age_over_60', parseInt(e.target.value))}
                disabled={!isAdmin}
              />
              <div className="flex justify-between text-xs text-gray-500"><span>0</span><span>Current: {formData.weight_age_over_60}</span><span>50</span></div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Pregnancy Weight</label>
              <input
                type="range" className={`w-full accent-indigo-600 ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`} min="0" max="50"
                value={formData.weight_pregnancy || 0}
                onChange={e => handleChange('weight_pregnancy', parseInt(e.target.value))}
                disabled={!isAdmin}
              />
              <div className="flex justify-between text-xs text-gray-500"><span>0</span><span>Current: {formData.weight_pregnancy}</span><span>50</span></div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Chronic Cond. Weight</label>
              <input
                type="range" className={`w-full accent-indigo-600 ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`} min="0" max="50"
                value={formData.weight_chronic_condition || 0}
                onChange={e => handleChange('weight_chronic_condition', parseInt(e.target.value))}
                disabled={!isAdmin}
              />
              <div className="flex justify-between text-xs text-gray-500"><span>0</span><span>Current: {formData.weight_chronic_condition}</span><span>50</span></div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Missed Visit Weight</label>
              <input
                type="range" className={`w-full accent-indigo-600 ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`} min="0" max="50"
                value={formData.weight_missed_visit || 0}
                onChange={e => handleChange('weight_missed_visit', parseInt(e.target.value))}
                disabled={!isAdmin}
              />
              <div className="flex justify-between text-xs text-gray-500"><span>0</span><span>Current: {formData.weight_missed_visit}</span><span>50</span></div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button onClick={handleSave} disabled={loading || !isAdmin}>
              {loading ? 'Saving...' : isAdmin ? 'Update Weights' : 'Admin Only'}
            </Button>
          </div>
        </section>

        {/* Maintenance */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-50 text-gray-600 rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">System Maintenance</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Recompute Risk Scores</h3>
              <p className="text-sm text-gray-500">Recalculate all resident risk scores based on current weights.</p>
            </div>
            <Button variant="outline" onClick={async () => {
              if (!confirm('This will update all resident risk scores. Continue?')) return;
              setLoading(true);
              try {
                // Note: In a real app, this should be an Edge Function or Database Function
                // For MVP, we iterate on the client
                const { residentsService } = await import('../services/residentsService');
                const { calculateRisk } = await import('../lib/riskEngine');

                const allResidents = await residentsService.getAll();
                let updatedCount = 0;

                // Map weights
                const weights = {
                  age_over_60: formData.weight_age_over_60 || 30,
                  pregnancy: formData.weight_pregnancy || 30,
                  chronic_condition: formData.weight_chronic_condition || 10,
                  missed_visit: formData.weight_missed_visit || 25,
                };

                for (const r of allResidents) {
                  const analysis = calculateRisk(r, weights);
                  if (analysis.score !== r.risk_score || analysis.level !== r.risk_level) {
                    await residentsService.update(r.id, {
                      risk_score: analysis.score,
                      risk_level: analysis.level
                    });
                    updatedCount++;
                  }
                }
                alert(`Successfully recomputed scores. Updated ${updatedCount} residents.`);
              } catch (e) {
                console.error(e);
                alert('Failed to recompute scores.');
              } finally {
                setLoading(false);
              }
            }}>Recompute Scores</Button>
          </div>
        </section>

        {/* Privacy & Disclaimer */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Privacy & Compliance</h2>
          </div>

          <div className="prose prose-sm text-gray-600 max-w-none">
            <p>
              <strong>Data Privacy Integrity:</strong> PULSE adheres to the Philippine Data Privacy Act of 2012.
              All resident data is locally secured and accessible only to authorized Barangay Health Workers.
            </p>
            <p className="mt-2">
              <strong>Medical Disclaimer:</strong> The algorithm scores are for prioritization assistance only and do NOT constitute a medical diagnosis.
              Always refer to a licensed medical professional for clinical decisions.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
