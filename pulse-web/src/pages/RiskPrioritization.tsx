import { useState, useEffect } from 'react';
import { AlertTriangle, Info, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { residentsService } from '../services/residentsService';
import { settingsService } from '../services/settingsService';
import { calculateRisk } from '../lib/riskEngine';
import type { Resident, RiskWeights } from '../types';

export default function RiskPrioritization() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskWeights, setRiskWeights] = useState<RiskWeights | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [residentsData, settings] = await Promise.all([
        residentsService.getAll(),
        settingsService.getSettings()
      ]);

      let weights: RiskWeights | undefined = undefined;
      if (settings) {
        weights = {
          age_over_60: settings.weight_age_over_60,
          pregnancy: settings.weight_pregnancy,
          chronic_condition: settings.weight_chronic_condition,
          missed_visit: settings.weight_missed_visit,
        };
        setRiskWeights(weights);
      }

      // Enhance residents with real-time risk calculation
      const enhancedData = residentsData.map((r) => {
        const analysis = calculateRisk(r, weights);

        // CHECK FOR MISMATCH: If stored risk differs from live calculation, update DB
        if (r.risk_level !== analysis.level || r.risk_score !== analysis.score) {
          // Fire and forget update to self-heal the data
          residentsService.update(r.id, {
            risk_score: analysis.score,
            risk_level: analysis.level
          }).catch(console.error);
        }

        return {
          ...r,
          risk_score: analysis.score,
          risk_level: analysis.level,
        };
      });

      // Sort descending by risk score
      enhancedData.sort((a, b) => b.risk_score - a.risk_score);
      setResidents(enhancedData);
    } catch (err) {
      console.error("Failed to load risk data", err);
      setError("Failed to load resident data.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  const highRiskCount = residents.filter(r => r.risk_level === 'High').length;
  const mediumRiskCount = residents.filter(r => r.risk_level === 'Medium').length;
  const lowRiskCount = residents.filter(r => r.risk_level === 'Low').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Risk Prioritization</h1>
        <p className="text-gray-500 text-sm mt-1">Explainable risk scoring and prioritization engine.</p>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-red-600">{highRiskCount}</span>
              <span className="text-xs font-medium text-red-800 uppercase tracking-wide mt-1">High Risk</span>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-amber-600">{mediumRiskCount}</span>
              <span className="text-xs font-medium text-amber-800 uppercase tracking-wide mt-1">Medium Risk</span>
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-green-600">{lowRiskCount}</span>
              <span className="text-xs font-medium text-green-800 uppercase tracking-wide mt-1">Low Risk</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Prioritized List */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">Prioritized Resident Queue</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {residents.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No residents found.</div>
                ) : (
                  residents.map((resident, idx) => {
                    const riskAnalysis = calculateRisk(resident, riskWeights); // Pass dynamic weights
                    return (

                      <div
                        key={resident.id}
                        className={`p-4 transition-colors cursor-pointer border-l-4 ${selectedId === resident.id ? 'bg-indigo-50 border-indigo-600' : 'border-transparent hover:bg-gray-50'}`}
                        onClick={() => setSelectedId(resident.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-bold w-6 text-center ${idx < 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
                              #{idx + 1}
                            </span>
                            <div>
                              <h4 className="font-bold text-gray-900">{resident.first_name} {resident.last_name}</h4>
                              <p className="text-xs text-gray-500">ID: {resident.id.slice(0, 8)}... • Age: {resident.age}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-bold text-gray-900">Score: {resident.risk_score}</span>
                            <RiskBadge level={resident.risk_level} />
                          </div>
                        </div>
                        {/* Compact Explainability */}
                        <div className="ml-9 p-2 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1">
                          {resident.risk_score > 50 && (
                            <p className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3 h-3 text-red-500" />
                              <span className="font-medium">Primary Factor:</span>
                              {riskAnalysis.factors[0] || 'General Risk'}
                            </p>
                          )}
                          <p className="pl-4.5">
                            Breakdown: {riskAnalysis.factors.slice(0, 3).join(', ') || 'Base score'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Explainability Panel */}
            <div className="space-y-6 lg:sticky lg:top-24 h-fit">
              {selectedId ? (() => {
                const resident = residents.find(r => r.id === selectedId);
                if (!resident) return null;
                const analysis = calculateRisk(resident, riskWeights);

                return (
                  <div className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{resident.first_name} {resident.last_name}</h3>
                        <p className="text-sm text-gray-500">{resident.age} y/o • {resident.sex}</p>
                      </div>
                      <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600">
                        &times;
                      </button>
                    </div>

                    <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Total Risk Score</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-gray-900 block leading-none">{analysis.score}</span>
                        <RiskBadge level={analysis.level} />
                      </div>
                    </div>

                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-indigo-600" />
                      Risk Factors
                    </h4>
                    <ul className="space-y-3">
                      {analysis.factors.length > 0 ? (
                        analysis.factors.map((factor, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700 bg-red-50 p-2 rounded border border-red-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                            <span>{factor}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-gray-500 italic">No specific risk factors identified. Base score only.</li>
                      )}
                    </ul>

                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-2 text-sm">Recommendations</h4>
                      <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg">
                        {analysis.level === 'High' ? 'Immediate follow-up required. Prioritize home visit this week.' :
                          analysis.level === 'Medium' ? 'Schedule check-up within 14 days. Monitor symptoms.' :
                            'Routine monitoring. Maintain regular wellness checks.'}
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-2 mb-3 text-indigo-800">
                    <Info className="w-5 h-5" />
                    <h3 className="font-bold">How Scoring Works</h3>
                  </div>
                  <p className="text-sm text-indigo-700 mb-4 leading-relaxed">
                    Select a resident from the queue to see their specific calculation.
                  </p>
                  <p className="text-sm text-indigo-700 mb-4 leading-relaxed">
                    The AI Risk Engine calculates a score (0-100) based on:
                  </p>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Age &gt; 60</span>
                      <span className="font-mono font-bold text-indigo-600">+{riskWeights?.age_over_60 ?? 30} pts</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Pregnancy</span>
                      <span className="font-mono font-bold text-indigo-600">+{riskWeights?.pregnancy ?? 40} pts</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Chronic Cond.</span>
                      <span className="font-mono font-bold text-indigo-600">+{riskWeights?.chronic_condition ?? 10} pts/ea</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Missed Visit</span>
                      <span className="font-mono font-bold text-indigo-600">+{riskWeights?.missed_visit ?? 25} pts</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
