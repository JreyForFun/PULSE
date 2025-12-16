import { supabase } from '../lib/supabase';
import type { Resident } from '../types';

export const residentsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('residents')
      .select(`
        *,
        resident_conditions (condition)
      `)
      .order('last_name', { ascending: true });

    if (error) throw error;

    // Transform data to match Resident interface
    return data.map((r: any) => ({
      ...r,
      conditions: r.resident_conditions?.map((c: any) => c.condition) || [],
    })) as Resident[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('residents')
      .select(`
        *,
        resident_conditions (condition)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      ...data,
      conditions: data.resident_conditions?.map((c: any) => c.condition) || [],
    } as Resident;
  },

  async create(resident: Omit<Resident, 'id' | 'created_at' | 'risk_score' | 'risk_level' | 'last_visit' | 'recent_symptoms'>) {
    // 1. Insert Resident
    const { data: residentData, error: residentError } = await supabase
      .from('residents')
      .insert({
        first_name: resident.first_name,
        last_name: resident.last_name,
        middle_name: resident.middle_name,
        birthdate: resident.birthdate,
        age: resident.age,
        sex: resident.sex,
        address: resident.address,
        barangay_zone: resident.barangay_zone,
        is_senior: resident.is_senior,
        is_pwd: resident.is_pwd,
        is_pregnant: resident.is_pregnant,
        is_child: resident.is_child,
        // Initial risk default is 0/Low, engine will update later or triggers can handle it
      })
      .select()
      .single();

    if (residentError) throw residentError;

    // 2. Insert Conditions if any
    if (resident.conditions && resident.conditions.length > 0) {
      const conditionsData = resident.conditions.map(c => ({
        resident_id: residentData.id,
        condition: c,
        diagnosed_date: new Date().toISOString().split('T')[0] // Default to today for now
      }));

      const { error: conditionsError } = await supabase
        .from('resident_conditions')
        .insert(conditionsData);

      if (conditionsError) {
        // In a real app we might rollback resident creation here
        console.error('Error adding conditions:', conditionsError);
        throw conditionsError;
      }
    }

    // 3. Calculate and Update Initial Risk
    // We need to construct a temporary resident object to pass to the engine
    const tempResident = {
      ...residentData,
      conditions: resident.conditions || []
    } as any;

    const { settingsService } = await import('./settingsService');
    const settings = await settingsService.getSettings();
    const weights = settings ? {
      age_over_60: settings.weight_age_over_60,
      pregnancy: settings.weight_pregnancy,
      chronic_condition: settings.weight_chronic_condition,
      missed_visit: settings.weight_missed_visit,
    } : undefined;

    const { calculateRisk } = await import('../lib/riskEngine');
    const riskAnalysis = calculateRisk(tempResident, weights);

    // Update with calculated risk
    await supabase.from('residents').update({
      risk_score: riskAnalysis.score,
      risk_level: riskAnalysis.level
    }).eq('id', residentData.id);

    return { ...residentData, risk_score: riskAnalysis.score, risk_level: riskAnalysis.level };
  },

  async update(id: string, updates: Partial<Resident>) {
    // Separate conditions from resident fields
    const { conditions, ...residentFields } = updates;

    // 1. Update Resident Fields
    const { error: residentError } = await supabase
      .from('residents')
      .update(residentFields)
      .eq('id', id);

    if (residentError) throw residentError;

    // 2. Update Conditions (Full Replace Strategy for simplicity)
    if (conditions) {
      // Delete existing
      const { error: deleteError } = await supabase
        .from('resident_conditions')
        .delete()
        .eq('resident_id', id);

      if (deleteError) throw deleteError;

      // Insert new
      if (conditions.length > 0) {
        const conditionsData = conditions.map(c => ({
          resident_id: id,
          condition: c,
          diagnosed_date: new Date().toISOString().split('T')[0]
        }));

        const { error: insertError } = await supabase
          .from('resident_conditions')
          .insert(conditionsData);

        if (insertError) throw insertError;
      }
    }


    // 3. Re-calculate Risk for this resident
    // Fetch full resident data first
    const updatedResident = await this.getById(id);

    const { settingsService } = await import('./settingsService');
    const settings = await settingsService.getSettings();
    const weights = settings ? {
      age_over_60: settings.weight_age_over_60,
      pregnancy: settings.weight_pregnancy,
      chronic_condition: settings.weight_chronic_condition,
      missed_visit: settings.weight_missed_visit,
    } : undefined;

    const { calculateRisk } = await import('../lib/riskEngine');
    const riskAnalysis = calculateRisk(updatedResident, weights);

    await supabase.from('residents').update({
      risk_score: riskAnalysis.score,
      risk_level: riskAnalysis.level
    }).eq('id', id);
  }
};
