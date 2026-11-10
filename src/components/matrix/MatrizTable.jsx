import {
  FileSpreadsheet,
  PlusCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { calculateRiskScore, getRiskSeverity } from '../../utils/riskCalculations';
import { PROBABILITY_LEVELS, IMPACT_LEVELS } from '../../constants/riskConstants';

const getSeverityBadgeVariant = (label) => {
  switch (label) {
    case 'Crítico':
      return 'critical';
    case 'Alto':
      return 'high';
    case 'Medio':
      return 'medium';
    default:
      return 'low';
  }
};

const getProbLabel = (val) => {
  if (val === 'N/A' || val === undefined || val === null) return 'N/A';
  const item = PROBABILITY_LEVELS.find((p) => p.value === Number(val));
  return item ? `${val} - ${item.label}` : String(val);
};

const getImpactLabel = (val) => {
  if (val === 'N/A' || val === undefined || val === null) return 'N/A';
  const item = IMPACT_LEVELS.find((i) => i.value === Number(val));
  return item ? `${val} - ${item.label}` : String(val);
};

const getResidualSeverityInfo = (risk) => {
  const numP = Number(risk.nuevaProbabilidad);
  const numI = Number(risk.nuevoImpacto);
  if (!isNaN(numP) && !isNaN(numI) && numP >= 1 && numI >= 1) {
    const score = numP * numI;
    const sev = getRiskSeverity(score);
    return { score, label: sev.label, hasValue: true };
  }
  return { score: null, label: 'N/A', hasValue: false };
};

export function MatrizTable({
  risks,
  filteredRisks,
  isLoadingDatos,
  isCreatingNew,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteRisk,
  onResetFilters,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs border-collapse">
          <thead>
            {/* Encabezado Superior: Bloques de Secciones */}
            <tr className="border-b border-slate-200">
              <th
                colSpan={7}
                className="bg-indigo-700 text-white py-3 px-4 text-center font-bold tracking-wider uppercase text-xs border-r-2 border-indigo-800"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Identificación del Riesgo</span>
                </div>
              </th>
              <th
                colSpan={3}
                className="bg-amber-600 text-white py-3 px-4 text-center font-bold tracking-wider uppercase text-xs border-r-2 border-amber-700"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Evaluación</span>
                </div>
              </th>
              <th
                colSpan={1}
                className="bg-slate-700 text-white py-3 px-3 text-center font-bold tracking-wider uppercase text-xs border-r-2 border-slate-800"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Análisis</span>
                </div>
              </th>
              <th
                colSpan={6}
                className="bg-emerald-700 text-white py-3 px-4 text-center font-bold tracking-wider uppercase text-xs border-r-2 border-emerald-800"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Sección: Tratamiento</span>
                </div>
              </th>
              <th
                colSpan={1}
                className="bg-slate-800 text-white py-3 px-3 text-center font-bold tracking-wider uppercase text-xs"
              >
                Acciones
              </th>
            </tr>

            {/* Encabezado Nivel 2: Columnas Específicas */}
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              {/* Identificación */}
              <th className="py-3 px-2.5 w-16 text-center border-r border-slate-200 bg-indigo-50/70 text-indigo-950">
                Estándar
              </th>
              <th className="py-3 px-2.5 w-20 text-center border-r border-slate-200 bg-indigo-50/70 text-indigo-950">
                Subestándar
              </th>
              <th className="py-3 px-3.5 min-w-[170px] border-r border-slate-200 bg-indigo-50/40 text-indigo-950">
                Riesgo
              </th>
              <th className="py-3 px-3.5 min-w-[200px] border-r border-slate-200 bg-indigo-50/40 text-indigo-950">
                Descripción del Riesgo
              </th>
              <th className="py-3 px-3.5 min-w-[180px] border-r border-slate-200 bg-indigo-50/40 text-indigo-950">
                Causa
              </th>
              <th className="py-3 px-3.5 min-w-[180px] border-r border-slate-200 bg-indigo-50/40 text-indigo-950">
                Consecuencia
              </th>
              <th className="py-3 px-2.5 w-20 text-center border-r-2 border-indigo-200 bg-indigo-50/70 text-indigo-950">
                Factor
              </th>

              {/* Evaluación */}
              <th className="py-3 px-2.5 w-24 text-center border-r border-slate-200 bg-amber-50/70 text-amber-950">
                Probabilidad
              </th>
              <th className="py-3 px-2.5 w-24 text-center border-r border-slate-200 bg-amber-50/70 text-amber-950">
                Impacto
              </th>
              <th className="py-3 px-3.5 min-w-[130px] text-center border-r-2 border-amber-200 bg-amber-50/70 text-amber-950">
                Nivel de Riesgo
              </th>

              {/* Fecha Análisis */}
              <th className="py-3 px-3 w-28 text-center border-r-2 border-slate-300 bg-slate-100 text-slate-800">
                Fecha Análisis
              </th>

              {/* Tratamiento */}
              <th className="py-3 px-3.5 min-w-[180px] border-r border-slate-200 bg-emerald-50/40 text-emerald-950">
                Plan de Acción
              </th>
              <th className="py-3 px-3.5 min-w-[180px] border-r border-slate-200 bg-emerald-50/40 text-emerald-950">
                Mitigación
              </th>
              <th className="py-3 px-2.5 w-24 text-center border-r border-slate-200 bg-emerald-50/70 text-emerald-950">
                Nueva Prob.
              </th>
              <th className="py-3 px-2.5 w-24 text-center border-r border-slate-200 bg-emerald-50/70 text-emerald-950">
                Nuevo Imp.
              </th>
              <th className="py-3 px-3.5 min-w-[130px] text-center border-r border-slate-200 bg-emerald-50/70 text-emerald-950">
                Nuevo Nivel
              </th>
              <th className="py-3 px-3 w-28 text-center border-r-2 border-emerald-200 bg-emerald-50/70 text-emerald-950">
                Fecha Tratamiento
              </th>

              {/* Acciones */}
              <th className="py-3 px-3 w-20 text-center bg-slate-100 text-slate-800">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredRisks.length > 0 ? (
              filteredRisks.map((risk, index) => {
                const score = calculateRiskScore(risk.probability, risk.impact);
                const severity = getRiskSeverity(score);
                const residual = getResidualSeverityInfo(risk);

                return (
                  <tr
                    key={risk.id || `matriz-risk-${index}`}
                    className="hover:bg-slate-50/90 transition-colors leading-relaxed"
                  >
                    {/* --- 1. IDENTIFICACIÓN --- */}
                    <td className="py-3.5 px-2.5 text-center border-r border-slate-100 font-mono text-slate-400 bg-slate-50/30">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold text-[10px]">
                        {risk.estandar || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-2.5 text-center border-r border-slate-100 font-mono text-slate-400 bg-slate-50/30">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold text-[10px]">
                        {risk.subestandar || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 border-r border-slate-100">
                      <div className="font-bold text-slate-900 text-xs">
                        {risk.title}
                      </div>
                      {risk.id && (
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {risk.id}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3.5 border-r border-slate-100 text-slate-600">
                      <p className="line-clamp-3 text-[11.5px]">
                        {risk.description || risk.title}
                      </p>
                    </td>
                    <td className="py-3.5 px-3.5 border-r border-slate-100 text-slate-700 bg-slate-50/20">
                      <p className="text-[11.5px] font-medium leading-normal">
                        {risk.causa || 'N/A'}
                      </p>
                    </td>
                    <td className="py-3.5 px-3.5 border-r border-slate-100 text-slate-700">
                      <p className="text-[11.5px] font-medium leading-normal">
                        {risk.consecuencia || 'N/A'}
                      </p>
                    </td>
                    <td className="py-3.5 px-2.5 text-center border-r-2 border-indigo-200">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          risk.factor === 'Externo'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}
                      >
                        {risk.factor || 'Interno'}
                      </span>
                    </td>

                    {/* --- 2. EVALUACIÓN --- */}
                    <td className="py-3.5 px-2.5 text-center border-r border-slate-100">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-xs font-bold text-slate-900">
                          {risk.probability}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {getProbLabel(risk.probability).split(' - ')[1]}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-2.5 text-center border-r border-slate-100">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-xs font-bold text-slate-900">
                          {risk.impact}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {getImpactLabel(risk.impact).split(' - ')[1]}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 text-center border-r-2 border-amber-200">
                      <div className="flex flex-col items-center gap-0.5">
                        <Badge
                          variant={getSeverityBadgeVariant(severity.label)}
                          className="px-2 py-0.5 text-[10.5px] font-bold"
                        >
                          {severity.label}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {score} (P{risk.probability}&times;I{risk.impact})
                        </span>
                      </div>
                    </td>

                    {/* --- 3. FECHA ANÁLISIS --- */}
                    <td className="py-3.5 px-3 text-center border-r-2 border-slate-300 font-mono text-[11px] text-slate-700 bg-slate-50/50">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-200/70 font-semibold text-slate-800">
                        {risk.fechaAnalisis || 'N/A'}
                      </span>
                    </td>

                    {/* --- 4. TRATAMIENTO --- */}
                    <td className="py-3.5 px-3.5 border-r border-slate-100 text-slate-700 bg-emerald-50/10">
                      {risk.planAccion === 'N/A' ? (
                        <span className="text-slate-400 italic font-mono text-[11px]">
                          N/A
                        </span>
                      ) : (
                        <p className="text-[11.5px] leading-normal font-medium text-slate-800">
                          {risk.planAccion}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-3.5 border-r border-slate-100 text-slate-700 bg-emerald-50/10">
                      {risk.mitigacion === 'N/A' ? (
                        <span className="text-slate-400 italic font-mono text-[11px]">
                          N/A
                        </span>
                      ) : (
                        <p className="text-[11.5px] leading-normal font-medium text-slate-800">
                          {risk.mitigacion}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-2.5 text-center border-r border-slate-100 bg-emerald-50/20">
                      {risk.nuevaProbabilidad === 'N/A' ? (
                        <span className="text-slate-400 italic font-mono text-[11px]">
                          N/A
                        </span>
                      ) : (
                        <div className="inline-flex flex-col items-center">
                          <span className="text-xs font-bold text-slate-900">
                            {risk.nuevaProbabilidad}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {getProbLabel(risk.nuevaProbabilidad).split(' - ')[1]}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-2.5 text-center border-r border-slate-100 bg-emerald-50/20">
                      {risk.nuevoImpacto === 'N/A' ? (
                        <span className="text-slate-400 italic font-mono text-[11px]">
                          N/A
                        </span>
                      ) : (
                        <div className="inline-flex flex-col items-center">
                          <span className="text-xs font-bold text-slate-900">
                            {risk.nuevoImpacto}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {getImpactLabel(risk.nuevoImpacto).split(' - ')[1]}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center border-r border-slate-100 bg-emerald-50/20">
                      {residual.hasValue ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <Badge
                            variant={getSeverityBadgeVariant(residual.label)}
                            className="px-2 py-0.5 text-[10.5px] font-bold"
                          >
                            {residual.label}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Score: {residual.score}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic font-mono text-[11px]">
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center border-r-2 border-emerald-200 font-mono text-[11px] text-slate-700 bg-emerald-50/10">
                      {risk.fechaTratamiento === 'N/A' ? (
                        <span className="text-slate-400 italic font-mono text-[11px]">
                          N/A
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                          {risk.fechaTratamiento}
                        </span>
                      )}
                    </td>

                    {/* --- 5. ACCIONES --- */}
                    <td className="py-3.5 px-3 text-center bg-slate-50/30">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(risk)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Modificar riesgo y tratamiento"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRisk(risk.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar riesgo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={18}
                  className="py-12 text-center text-slate-500 bg-white"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileSpreadsheet className="w-8 h-8 text-slate-300" />
                    {isLoadingDatos ? (
                      <p className="font-medium text-sm text-slate-600">
                        Cargando datos de la matriz...
                      </p>
                    ) : risks.length === 0 ? (
                      <>
                        <p className="font-medium text-sm text-slate-700">
                          {isCreatingNew
                            ? 'Selecciona un riesgo en el selector superior para cargarlo en la matriz o agrega un riesgo nuevo manualmente.'
                            : 'Esta matriz aún no tiene riesgos registrados.'}
                        </p>
                        <button
                          type="button"
                          onClick={onOpenCreateModal}
                          className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Agregar Riesgo a la Matriz
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-sm">
                          No se encontraron registros con los filtros seleccionados.
                        </p>
                        <button
                          type="button"
                          onClick={onResetFilters}
                          className="text-xs text-indigo-600 font-semibold hover:underline mt-1"
                        >
                          Limpiar filtros
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Informativo */}
      <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <span>
          Mostrando <strong>{filteredRisks.length}</strong> de{' '}
          <strong>{risks.length}</strong> riesgos en la matriz.
        </span>
      </div>
    </div>
  );
}

