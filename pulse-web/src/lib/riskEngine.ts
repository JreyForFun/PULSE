import type { Resident, RiskLevel } from '../types';

interface RiskResult {
  score: number;
  level: RiskLevel;
  factors: string[];
}

export function calculateRisk(resident: Resident, weights?: { age_over_60: number; pregnancy: number; chronic_condition: number; missed_visit: number; }): RiskResult {
  let score = 0;
  const factors: string[] = [];

  // Defaults (if not provided)
  const W_AGE = weights?.age_over_60 ?? 30;
  const W_PREG = weights?.pregnancy ?? 40;
  const W_CHRONIC = weights?.chronic_condition ?? 10;
  const W_MISSED = weights?.missed_visit ?? 25;

  // Age Factor
  if (resident.age >= 60) {
    score += W_AGE;
    factors.push(`Age is ${resident.age} (+${W_AGE})`);
  } else if (resident.age < 5) {
    // Keep child weight constant or add to settings later? Keeping hardcoded for MVP
    score += 20;
    factors.push(`Child under 5 years old (+20)`);
  }

  // Vulnerability Factors
  if (resident.is_pregnant) {
    score += W_PREG;
    factors.push(`Pregnant (+${W_PREG})`);
  }
  if (resident.is_pwd) {
    score += 15; // PWD fixed for now
    factors.push('PWD Status (+15)');
  }

  // Chronic Conditions
  if (resident.conditions && resident.conditions.length > 0) {
    const conditionScore = resident.conditions.length * W_CHRONIC;
    score += conditionScore;
    factors.push(`${resident.conditions.length} Chronic Condition(s) (+${conditionScore})`);
  }

  // Repeated Symptoms
  if (resident.recent_symptoms && resident.recent_symptoms.length > 1) {
    const uniqueSymptoms = new Set(resident.recent_symptoms);
    if (uniqueSymptoms.size < resident.recent_symptoms.length) {
      score += 20;
      factors.push('Repeated symptoms reported (+20)');
    }
  }

  // Visit History (Missed Visits Logic)
  if (!resident.last_visit) {
    score += 10;
    factors.push('No visits recorded (+10)');
  } else {
    // Check days since last visit
    const lastVisitDate = new Date(resident.last_visit);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastVisitDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 90) { // 3 months
      score += W_MISSED;
      factors.push(`No visit in >3 months (${diffDays} days) (+${W_MISSED})`);
    } else if (diffDays > 30 && resident.risk_level !== 'Low') {
      score += 10;
      factors.push(`Overdue follow-up (${diffDays} days) (+10)`);
    }
  }

  // Determine Level
  let level: RiskLevel = 'Low';
  if (score >= 70) level = 'High';
  else if (score >= 30) level = 'Medium';

  return { score, level, factors };
}
