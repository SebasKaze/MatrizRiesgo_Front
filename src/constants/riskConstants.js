export const PROBABILITY_LEVELS = [
  { value: 1, label: 'Muy Baja', description: 'Rara vez ocurre (< 10%)' },
  { value: 2, label: 'Baja', description: 'Poco probable (10% - 30%)' },
  { value: 3, label: 'Media', description: 'Posible (31% - 60%)' },
  { value: 4, label: 'Alta', description: 'Probable (61% - 85%)' },
  { value: 5, label: 'Muy Alta', description: 'Casi seguro (> 85%)' },
];

export const IMPACT_LEVELS = [
  { value: 1, label: 'Insignificante', description: 'Impacto operativo o financiero mínimo' },
  { value: 2, label: 'Menor', description: 'Impacto leve con solución rápida' },
  { value: 3, label: 'Moderado', description: 'Requiere atención y recursos moderados' },
  { value: 4, label: 'Mayor', description: 'Impacto severo en objetivos o finanzas' },
  { value: 5, label: 'Catastrófico', description: 'Pérdidas críticas o parálisis de operación' },
];

export const RISK_LEVELS = {
  LOW: {
    label: 'Bajo',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
    badgeColor: 'bg-emerald-500',
    min: 1,
    max: 5,
  },
  MEDIUM: {
    label: 'Medio',
    color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
    badgeColor: 'bg-amber-500',
    min: 6,
    max: 11,
  },
  HIGH: {
    label: 'Alto',
    color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300',
    badgeColor: 'bg-orange-500',
    min: 12,
    max: 16,
  },
  CRITICAL: {
    label: 'Crítico',
    color: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300',
    badgeColor: 'bg-rose-600',
    min: 17,
    max: 25,
  },
};
