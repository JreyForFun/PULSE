export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface Resident {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  birthdate?: string;
  age: number;
  sex: 'Male' | 'Female';
  address: string;
  barangay_zone?: string;
  is_senior: boolean;
  is_pwd: boolean;
  is_pregnant: boolean;
  is_child: boolean;
  risk_score: number;
  risk_level: RiskLevel;
  last_visit?: string;
  conditions?: string[];
  recent_symptoms?: string[];
  follow_up_required?: boolean;
  created_at?: string;
}

export interface Visit {
  id: string;
  resident_id: string;
  visit_date: string;
  provider_name?: string;
  follow_up_required: boolean;
  notes?: string;
  created_at?: string;
}

// ... existing types
export interface VisitSymptom {
  id: string;
  visit_id: string;
  symptom: string;
  severity?: 'Mild' | 'Moderate' | 'Severe';
}

export interface RiskWeights {
  age_over_60: number;
  pregnancy: number;
  chronic_condition: number;
  missed_visit: number;
}

export interface OrganizationSettings {
  id: string;
  barangay_name: string;
  municipality: string;
  health_station_id: string;
  // Encapsulated weights or flattened? Let's use flattened for DB, mapped obj in app
  weight_age_over_60: number;
  weight_pregnancy: number;
  weight_chronic_condition: number;
  weight_missed_visit: number;
  updated_at?: string;
}

