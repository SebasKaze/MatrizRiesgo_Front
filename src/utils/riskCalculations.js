import { RISK_LEVELS } from '../constants/riskConstants';

/**
 * Calcula la severidad del riesgo (Probabilidad * Impacto)
 * @param {number} probability
 * @param {number} impact
 * @returns {number}
 */
export function calculateRiskScore(probability, impact) {
  return Number(probability) * Number(impact);
}

/**
 * Obtiene el nivel de severidad y estilos basados en el puntaje
 * @param {number} score
 * @returns {{ label: string, color: string, badgeColor: string }}
 */
export function getRiskSeverity(score) {
  if (score >= RISK_LEVELS.CRITICAL.min) {
    return RISK_LEVELS.CRITICAL;
  }
  if (score >= RISK_LEVELS.HIGH.min) {
    return RISK_LEVELS.HIGH;
  }
  if (score >= RISK_LEVELS.MEDIUM.min) {
    return RISK_LEVELS.MEDIUM;
  }
  return RISK_LEVELS.LOW;
}

/**
 * Retorna color de celda en la matriz 5x5 según probabilidad e impacto
 * @param {number} probability (1-5)
 * @param {number} impact (1-5)
 * @returns {string} Tailwind CSS class
 */
export function getMatrixCellColor(probability, impact) {
  const score = probability * impact;
  if (score >= 17) return 'bg-rose-500 text-white';
  if (score >= 12) return 'bg-orange-500 text-white';
  if (score >= 6) return 'bg-amber-400 text-slate-900';
  return 'bg-emerald-500 text-white';
}
