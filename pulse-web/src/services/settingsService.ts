import { supabase } from '../lib/supabase';
import type { OrganizationSettings } from '../types';

export const settingsService = {
  async getSettings() {
    const { data, error } = await supabase
      .from('organization_settings')
      .select('*')
      .single();

    if (error) {
      // If no settings exist yet, returning null is fine or we could create default
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as OrganizationSettings;
  },

  async initializeDefaults() {
    const defaultSettings: OrganizationSettings = {
      id: crypto.randomUUID(),
      barangay_name: 'Brgy. Santa Rosa',
      municipality: 'Santa Rosa City',
      health_station_id: 'BHS-001',
      weight_age_over_60: 30,
      weight_pregnancy: 30,
      weight_chronic_condition: 10,
      weight_missed_visit: 25,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('organization_settings')
      .insert(defaultSettings)
      .select()
      .single();

    if (error) {
      console.error('Failed to init defaults', error);
      return null;
    }
    return data as OrganizationSettings;
  },

  async updateSettings(_id: string, updates: Partial<OrganizationSettings>) {
    // We accept _id to match the call signature but we look up the singleton or use the passed ID.
    // Ideally we use the ID passed to be safe.

    const { error } = await supabase
      .from('organization_settings')
      .update(updates)
      .eq('id', _id);

    if (error) throw error;
  }
};
