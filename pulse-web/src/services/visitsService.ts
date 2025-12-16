import { supabase } from '../lib/supabase';
import type { Visit } from '../types';

export const visitsService = {
  async getAll() {
    // Join with resident info for global feed
    const { data, error } = await supabase
      .from('visits')
      .select(`
        *,
        residents (first_name, last_name, id)
      `)
      .order('visit_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getByResidentId(residentId: string) {
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .eq('resident_id', residentId)
      .order('visit_date', { ascending: false });

    if (error) throw error;
    return data as Visit[];
  },

  async create(visit: Omit<Visit, 'id' | 'created_at'>, symptoms: string[]) {
    // 1. Insert Visit
    const { data: visitData, error: visitError } = await supabase
      .from('visits')
      .insert({
        resident_id: visit.resident_id,
        visit_date: visit.visit_date,
        // provider_name: 'BHW User', // Can come from Auth later
        follow_up_required: visit.follow_up_required,
        notes: visit.notes,
      })
      .select()
      .single();

    if (visitError) throw visitError;

    // 2. Insert Symptoms
    if (symptoms.length > 0) {
      const symptomsData = symptoms.map(s => ({
        visit_id: visitData.id,
        symptom: s
      }));

      const { error: symptomsError } = await supabase
        .from('visit_symptoms')
        .insert(symptomsData);

      if (symptomsError) {
        console.error('Error adding symptoms:', symptomsError);
        // non-critical, so maybe just log it
      }
    }

    // 3. Update Resident's last_visit and follow_up_required
    // This keeps the Resident table "cached" with latest status as per PRD risk logic
    await supabase
      .from('residents')
      .update({
        last_visit: visit.visit_date,
        follow_up_required: visit.follow_up_required
      })
      .eq('id', visit.resident_id);

    // 4. Trigger Risk Recalculation
    try {
      const { residentsService } = await import('./residentsService');
      // We call update with empty object just to trigger the risk calc logic we added? 
      // No, that logic is inside update() but we need to trigger it.
      // Better: We just manually run the same logic here or expose a method.
      // Let's manually run it to avoid circular deps or weird hack.

      const resident = await residentsService.getById(visit.resident_id);
      const { settingsService } = await import('./settingsService');
      const settings = await settingsService.getSettings();
      const weights = settings ? {
        age_over_60: settings.weight_age_over_60,
        pregnancy: settings.weight_pregnancy,
        chronic_condition: settings.weight_chronic_condition,
        missed_visit: settings.weight_missed_visit,
      } : undefined;

      const { calculateRisk } = await import('../lib/riskEngine');
      const riskAnalysis = calculateRisk(resident, weights);

      await supabase.from('residents').update({
        risk_score: riskAnalysis.score,
        risk_level: riskAnalysis.level
      }).eq('id', visit.resident_id);

    } catch (e) {
      console.error("Failed to auto-recalculate risk after visit:", e);
      // Don't fail the visit creation just because risk calc failed
    }

    return visitData;
  }
};
