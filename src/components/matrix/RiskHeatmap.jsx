import { PROBABILITY_LEVELS, IMPACT_LEVELS } from '../../constants/riskConstants';
import { getMatrixCellColor } from '../../utils/riskCalculations';

export function RiskHeatmap({ risks = [] }) {
  // Map probability 5 down to 1
  const probabilitiesDesc = [...PROBABILITY_LEVELS].reverse();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Matriz de Calor 5x5 (Probabilidad vs Impacto)
          </h3>
          <p className="text-sm text-slate-500">
            Distribución visual de severidad y concentración de riesgos
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Bajo (1-5)
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-full bg-amber-400"></span> Medio (6-11)
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span> Alto (12-16)
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span> Crítico (17-25)
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Y Axis Label */}
          <div className="flex">
            <div className="w-28 flex items-center justify-center font-semibold text-xs text-slate-500 uppercase tracking-wider rotate-[-90deg]">
              Probabilidad
            </div>

            {/* Matrix Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-5 gap-2">
                {probabilitiesDesc.map((prob) => {
                  return IMPACT_LEVELS.map((imp) => {
                    const cellColor = getMatrixCellColor(prob.value, imp.value);
                    const matchingRisks = risks.filter(
                      (r) => Number(r.probability) === prob.value && Number(r.impact) === imp.value
                    );
                    const score = prob.value * imp.value;

                    return (
                      <div
                        key={`cell-${prob.value}-${imp.value}`}
                        className={`h-20 rounded-lg p-2 flex flex-col justify-between transition-transform hover:scale-105 shadow-sm border border-black/5 ${cellColor}`}
                        title={`P: ${prob.label} (${prob.value}), I: ${imp.label} (${imp.value}) - Valor: ${score}`}
                      >
                        <div className="flex justify-between items-start text-xs font-bold opacity-80">
                          <span>{score}</span>
                          <span className="text-[10px]">P{prob.value}/I{imp.value}</span>
                        </div>

                        {matchingRisks.length > 0 ? (
                          <div className="flex items-center justify-center">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-black rounded-full bg-white text-slate-900 shadow">
                              {matchingRisks.length} {matchingRisks.length === 1 ? 'riesgo' : 'riesgos'}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-center opacity-40">0</div>
                        )}
                      </div>
                    );
                  });
                })}
              </div>

              {/* X Axis Impact Header */}
              <div className="grid grid-cols-5 gap-2 mt-3 text-center">
                {IMPACT_LEVELS.map((imp) => (
                  <div key={`imp-label-${imp.value}`} className="text-xs text-slate-600 font-medium">
                    <div className="font-semibold">{imp.value}</div>
                    <div className="truncate text-[11px] text-slate-500">{imp.label}</div>
                  </div>
                ))}
              </div>

              <div className="text-center font-semibold text-xs text-slate-500 uppercase tracking-wider mt-2">
                Impacto
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
