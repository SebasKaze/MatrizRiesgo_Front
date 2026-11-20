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
 * Evalúa una etapa de la matriz (Etapa 1, Etapa 2 o Etapa 3)
 * devolviendo el Grado de Riesgo (Probabilidad * Impacto) y la Zona de Riesgo:
 * - 1 a 2: Aceptable
 * - 3 a 9: Apreciable (ej. 2x4=8 -> Apreciable, 1x3=3 -> Apreciable)
 * - 10 a 16: Importante (ej. 2x5=10 -> Importante)
 * - 17 a 25: Crítico
 */
export function getMatrixZoneEvaluation(probability, impact) {
  if (
    probability === 'N/A' ||
    impact === 'N/A' ||
    probability === undefined ||
    impact === undefined ||
    probability === null ||
    impact === null ||
    probability === '' ||
    impact === ''
  ) {
    return {
      score: null,
      zona: 'N/A',
      variant: 'low',
      colorClass: 'bg-slate-100 text-slate-500 border-slate-200',
      hasValue: false,
    };
  }

  const numP = Number(probability);
  const numI = Number(impact);

  if (isNaN(numP) || isNaN(numI) || numP < 1 || numI < 1) {
    return {
      score: null,
      zona: 'N/A',
      variant: 'low',
      colorClass: 'bg-slate-100 text-slate-500 border-slate-200',
      hasValue: false,
    };
  }

  const score = numP * numI;

  if (score >= 17) {
    return {
      score,
      zona: 'Crítico',
      variant: 'critical',
      colorClass: 'bg-rose-100 text-rose-800 border-rose-300',
      hasValue: true,
    };
  }
  if (score >= 10) {
    return {
      score,
      zona: 'Importante',
      variant: 'high',
      colorClass: 'bg-orange-100 text-orange-800 border-orange-300',
      hasValue: true,
    };
  }
  if (score >= 3) {
    return {
      score,
      zona: 'Apreciable',
      variant: 'medium',
      colorClass: 'bg-amber-100 text-amber-800 border-amber-300',
      hasValue: true,
    };
  }
  return {
    score,
    zona: 'Aceptable',
    variant: 'low',
    colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    hasValue: true,
  };
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
