import {
  FileSpreadsheet,
  PlusCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { getMatrixZoneEvaluation } from '../../utils/riskCalculations';
import { PROBABILITY_LEVELS, IMPACT_LEVELS } from '../../constants/riskConstants';

const getProbLabel = (val) => {
  if (val === 'N/A' || val === undefined || val === null || val === '') return 'N/A';
  const item = PROBABILITY_LEVELS.find((p) => p.value === Number(val));
  return item ? `${val} - ${item.label}` : String(val);
};

const getImpactLabel = (val) => {
  if (val === 'N/A' || val === undefined || val === null || val === '') return 'N/A';
  const item = IMPACT_LEVELS.find((i) => i.value === Number(val));
  return item ? `${val} - ${item.label}` : String(val);
};

export function MatrizTable({
  risks,
  filteredRisks,
  isLoadingDatos,
  isCreatingNew,
  isMatrizBloqueada = false,
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
            {/* Encabezado Nivel 1: Las 3 Etapas de la Matriz */}
            <tr className="border-b border-slate-200">
              <th
                colSpan={11}
                className="bg-indigo-700 text-white py-3 px-4 text-center font-bold tracking-wider uppercase text-xs border-r-2 border-indigo-800"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Etapa 1: Identificación y Evaluación del Riesgo (Inherente)</span>
                </div>
              </th>
              <th
                colSpan={5}
                className="bg-amber-600 text-white py-3 px-4 text-center font-bold tracking-wider uppercase text-xs border-r-2 border-amber-700"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Etapa 2: Controles Implementados y Reevaluación</span>
                </div>
              </th>
              <th
                colSpan={7}
                className="bg-emerald-700 text-white py-3 px-4 text-center font-bold tracking-wider uppercase text-xs border-r-2 border-emerald-800"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Etapa 3: Controles Complementarios, Riesgo Residual y Seguimiento</span>
                </div>
              </th>
              <th
                colSpan={1}
                className="bg-slate-800 text-white py-3 px-3 text-center font-bold tracking-wider uppercase text-xs"
              >
                Acciones
              </th>
            </tr>

            {/* Encabezado Nivel 2: Columnas Específicas (Estándar y Subestándar separados) */}
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              {/* === ETAPA 1 (11 columnas) === */}
              <th className="py-3 px-2.5 w-20 text-center border-r border-slate-200 bg-indigo-50/70 text-indigo-950">
                Estándar
              </th>
              <th className="py-3 px-2.5 w-24 text-center border-r border-slate-200 bg-indigo-50/70 text-indigo-950">
                Subestándar
              </th>
              <th className="py-3 px-3 min-w-[150px] text-center border-r border-slate-200 bg-indigo-50/70 text-indigo-950">
                Contexto
              </th>
              <th className="py-3 px-3 min-w-[150px] border-r border-slate-200 bg-indigo-50/40 text-indigo-950">
                Proceso
              </th>
              <th className="py-3 px-3.5 min-w-[190px] border-r border-slate-200 bg-indigo-50/40 text-indigo-950">
                Riesgo
              </th>
              <th className="py-3 px-3.5 min-w-[210px] border-r border-slate-200 bg-indigo-50/40 text-indigo-950">
                Causas
              </th>
              <th className="py-3 px-3.5 min-w-[210px] border-r border-slate-200 bg-indigo-50/40 text-indigo-950">
                Consecuencias
              </th>
              <th className="py-3 px-2.5 w-24 text-center border-r border-slate-200 bg-indigo-50/80 text-indigo-950">
                Probabilidad
              </th>
              <th className="py-3 px-2.5 w-24 text-center border-r border-slate-200 bg-indigo-50/80 text-indigo-950">
                Impacto
              </th>
              <th className="py-3 px-2.5 w-24 text-center border-r border-slate-200 bg-indigo-50/80 text-indigo-950">
                Grado Riesgo
              </th>
              <th className="py-3 px-3 min-w-[130px] text-center border-r-2 border-indigo-200 bg-indigo-50/80 text-indigo-950">
                Tipo de Riesgo
              </th>

              {/* === ETAPA 2 (5 columnas) === */}
              <th className="py-3 px-3.5 min-w-[210px] border-r border-slate-200 bg-amber-50/40 text-amber-950">
                Controles Implementados
              </th>
              <th className="py-3 px-2.5 w-24 text-center border-r border-slate-200 bg-amber-50/70 text-amber-950">
                Probabilidad
              </th>
              <th className="py-3 px-2.5 w-24 text-center border-r border-slate-200 bg-amber-50/70 text-amber-950">
                Impacto
              </th>
              <th className="py-3 px-2.5 w-24 text-center border-r border-slate-200 bg-amber-50/70 text-amber-950">
                Grado Riesgo
              </th>
              <th className="py-3 px-3 min-w-[130px] text-center border-r-2 border-amber-200 bg-amber-50/70 text-amber-950">
                Tipo de Riesgo
              </th>

              {/* === ETAPA 3 (7 columnas) === */}
              <th className="py-3 px-3.5 min-w-[230px] border-r border-slate-200 bg-emerald-50/40 text-emerald-950">
                Controles Complementarios
              </th>
              <th className="py-3 px-2.5 w-24 text-center border-r border-slate-200 bg-emerald-50/70 text-emerald-950">
                Probabilidad
              </th>
              <th className="py-3 px-2.5 w-24 text-center border-r border-slate-200 bg-emerald-50/70 text-emerald-950">
                Impacto
              </th>
              <th className="py-3 px-2.5 w-24 text-center border-r border-slate-200 bg-emerald-50/70 text-emerald-950">
                Grado Riesgo
              </th>
              <th className="py-3 px-3 min-w-[130px] text-center border-r border-slate-200 bg-emerald-50/70 text-emerald-950">
                Tipo de Riesgo
              </th>
              <th className="py-3 px-3.5 min-w-[260px] border-r border-slate-200 bg-emerald-50/40 text-emerald-950">
                Seguimiento y Revisión de Riesgos Residuales
              </th>
              <th className="py-3 px-3 min-w-[180px] border-r-2 border-emerald-200 bg-emerald-50/70 text-emerald-950">
                Responsable
              </th>

              {/* === ACCIONES (1 columna) === */}
              <th className="py-3 px-3 w-20 text-center bg-slate-100 text-slate-800">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredRisks.length > 0 ? (
              filteredRisks.map((risk, index) => {
                // Evaluación Etapa 1
                const evalEtapa1 = getMatrixZoneEvaluation(
                  risk.probability,
                  risk.impact
                );

                // Evaluación Etapa 2
                const prob2 = risk.probabilidadEtapa2 ?? risk.nuevaProbabilidad ?? 'N/A';
                const imp2 = risk.impactoEtapa2 ?? risk.nuevoImpacto ?? 'N/A';
                const evalEtapa2 = getMatrixZoneEvaluation(prob2, imp2);

                // Evaluación Etapa 3
                const prob3 = risk.probabilidadEtapa3 ?? 'N/A';
                const imp3 = risk.impactoEtapa3 ?? 'N/A';
                const evalEtapa3 = getMatrixZoneEvaluation(prob3, imp3);

                const estandarDisplay =
                  risk.codigo_estandar && risk.codigo_estandar !== 'N/A'
                    ? risk.codigo_estandar
                    : risk.estandar && risk.estandar !== 'N/A'
                    ? risk.estandar
                    : risk.numeral && String(risk.numeral).includes('.')
                    ? String(risk.numeral).split('.')[0]
                    : 'N/A';

                const subestandarDisplay =
                  risk.codigo_subestandar && risk.codigo_subestandar !== 'N/A'
                    ? risk.codigo_subestandar
                    : risk.subestandar && risk.subestandar !== 'N/A'
                    ? risk.subestandar
                    : risk.numeral && risk.numeral !== 'N/A'
                    ? risk.numeral
                    : 'N/A';

                const contextoDisplay =
                  risk.contexto ||
                  (risk.factor === 'Interno' || risk.factor === 'Externo'
                    ? risk.factor
                    : 'Contexto interno / Externo');

                const procesoDisplay =
                  risk.proceso || risk.category || 'Análisis de riesgo';

                const controlesImplDisplay =
                  risk.controlesImplementados ?? risk.planAccion ?? 'N/A';

                const controlesCompDisplay =
                  risk.controlesComplementarios ?? risk.mitigacion ?? 'N/A';

                const seguimientoDisplay =
                  risk.seguimientoRevision ?? 'N/A';

                const responsableDisplay =
                  risk.responsable ?? risk.responsible ?? 'N/A';

                return (
                  <tr
                    key={risk.id || `matriz-risk-${index}`}
                    className="hover:bg-slate-50/90 transition-colors leading-relaxed"
                  >
                    {/* ================= ETAPA 1 ================= */}
                    {/* 1. ESTÁNDAR */}
                    <td className="py-3.5 px-2.5 text-center border-r border-slate-100 font-mono bg-slate-50/30">
                      <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[11px]">
                        {estandarDisplay}
                      </span>
                    </td>

                    {/* 2. SUBESTÁNDAR */}
                    <td className="py-3.5 px-2.5 text-center border-r border-slate-100 font-mono bg-slate-50/30">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[11px]">
                        {subestandarDisplay}
                      </span>
                    </td>

                    {/* 3. CONTEXTO */}
                    <td className="py-3.5 px-3 text-center border-r border-slate-100">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                          contextoDisplay === 'Externo'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : contextoDisplay === 'Interno'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {contextoDisplay}
                      </span>
                    </td>

                    {/* 4. PROCESO */}
                    <td className="py-3.5 px-3 border-r border-slate-100 text-slate-800 font-semibold">
                      <p className="text-[11.5px] leading-snug">
                        {procesoDisplay}
                      </p>
                    </td>

                    {/* 5. RIESGO */}
                    <td className="py-3.5 px-3.5 border-r border-slate-100">
                      <div className="font-bold text-slate-900 text-xs leading-snug">
                        {risk.title}
                      </div>
                      {risk.description &&
                        risk.description !== risk.title && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                            {risk.description}
                          </p>
                        )}
                    </td>

                    {/* 6. CAUSAS */}
                    <td className="py-3.5 px-3.5 border-r border-slate-100 text-slate-700 bg-slate-50/20">
                      <p className="text-[11.5px] font-medium leading-normal">
                        {risk.causa || 'N/A'}
                      </p>
                    </td>

                    {/* 7. CONSECUENCIAS */}
                    <td className="py-3.5 px-3.5 border-r border-slate-100 text-slate-700">
                      <p className="text-[11.5px] font-medium leading-normal">
                        {risk.consecuencia || 'N/A'}
                      </p>
                    </td>

                    {/* 8. PROBABILIDAD (Etapa 1) */}
                    <td className="py-3.5 px-2.5 text-center border-r border-slate-100 bg-indigo-50/15">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-xs font-bold text-slate-900">
                          {risk.probability}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {getProbLabel(risk.probability).split(' - ')[1]}
                        </span>
                      </div>
                    </td>

                    {/* 9. IMPACTO (Etapa 1) */}
                    <td className="py-3.5 px-2.5 text-center border-r border-slate-100 bg-indigo-50/15">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-xs font-bold text-slate-900">
                          {risk.impact}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {getImpactLabel(risk.impact).split(' - ')[1]}
                        </span>
                      </div>
                    </td>

                    {/* 10. GRADO RIESGO (Etapa 1) */}
                    <td className="py-3.5 px-2.5 text-center border-r border-slate-100 bg-indigo-50/20">
                      <span className="inline-flex items-center justify-center w-8 h-7 rounded-lg bg-white border border-slate-200 font-mono font-bold text-xs text-slate-900 shadow-2xs">
                        {evalEtapa1.hasValue ? evalEtapa1.score : 'N/A'}
                      </span>
                    </td>

                    {/* 11. ZONA DE RIESGO (Etapa 1) */}
                    <td className="py-3.5 px-3 text-center border-r-2 border-indigo-200 bg-indigo-50/20">
                      {evalEtapa1.hasValue ? (
                        <Badge
                          variant={evalEtapa1.variant}
                          className="px-2.5 py-0.5 text-[10.5px] font-bold"
                        >
                          {evalEtapa1.zona}
                        </Badge>
                      ) : (
                        <span className="text-slate-400 italic font-mono text-[11px]">
                          N/A
                        </span>
                      )}
                    </td>

                    {/* ================= ETAPA 2 ================= */}
                    {/* 12. CONTROLES IMPLEMENTADOS */}
                    <td className="py-3.5 px-3.5 border-r border-slate-100 text-slate-700 bg-amber-50/10">
                      {!controlesImplDisplay || controlesImplDisplay === 'N/A' ? (
                        <span className="text-slate-400 italic font-mono text-[11px]">
                          N/A
                        </span>
                      ) : (
                        <p className="text-[11.5px] leading-normal font-medium text-slate-800">
                          {controlesImplDisplay}
                        </p>
                      )}
                    </td>

                    {/* 13. PROBABILIDAD (Etapa 2) */}
                    <td className="py-3.5 px-2.5 text-center border-r border-slate-100 bg-amber-50/20">
                      {prob2 === 'N/A' || prob2 === '' ? (
                        <span className="text-slate-400 italic font-mono text-[11px]">
                          N/A
                        </span>
                      ) : (
                        <div className="inline-flex flex-col items-center">
                          <span className="text-xs font-bold text-slate-900">
                            {prob2}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {getProbLabel(prob2).split(' - ')[1]}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 14. IMPACTO (Etapa 2) */}
                    <td className="py-3.5 px-2.5 text-center border-r border-slate-100 bg-amber-50/20">
                      {imp2 === 'N/A' || imp2 === '' ? (
                        <span className="text-slate-400 italic font-mono text-[11px]">
                          N/A
                        </span>
                      ) : (
                        <div className="inline-flex flex-col items-center">
                          <span className="text-xs font-bold text-slate-900">
                            {imp2}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {getImpactLabel(imp2).split(' - ')[1]}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 15. GRADO RIESGO (Etapa 2) */}
                    <td className="py-3.5 px-2.5 text-center border-r border-slate-100 bg-amber-50/20">
                      {evalEtapa2.hasValue ? (
                        <span className="inline-flex items-center justify-center w-8 h-7 rounded-lg bg-white border border-amber-200 font-mono font-bold text-xs text-slate-900 shadow-2xs">
                          {evalEtapa2.score}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic font-mono text-[11px]">
                          N/A
                        </span>
                      )}
                    </td>

                    {/* 16. ZONA DE RIESGO (Etapa 2) */}
                    <td className="py-3.5 px-3 text-center border-r-2 border-amber-200 bg-amber-50/20">
                      {evalEtapa2.hasValue ? (
                        <Badge
                          variant={evalEtapa2.variant}
                          className="px-2.5 py-0.5 text-[10.5px] font-bold"
                        >
                          {evalEtapa2.zona}
                        </Badge>
                      ) : (
                        <span className="text-slate-400 italic font-mono text-[11px]">
                          N/A
                        </span>
                      )}
                    </td>

                    {/* ================= ETAPA 3 ================= */}
                    {/* 17. CONTROLES COMPLEMENTARIOS */}
                    <td className="py-3.5 px-3.5 border-r border-slate-100 text-slate-700 bg-emerald-50/10">
                      {!controlesCompDisplay || controlesCompDisplay === 'N/A' ? (
                        <span className="text-slate-400 italic font-mono text-[11px]">
                          N/A
                        </span>
                      ) : (
                        <p className="text-[11.5px] leading-normal font-medium text-slate-800">
                          {controlesCompDisplay}
                        </p>
                      )}
                    </td>

                    {/* 18. PROBABILIDAD (Etapa 3) */}
                    <td className="py-3.5 px-2.5 text-center border-r border-slate-100 bg-emerald-50/20">
                      {prob3 === 'N/A' || prob3 === '' ? (
                        <span className="text-slate-400 italic font-mono text-[11px]">
                          N/A
                        </span>
                      ) : (
                        <div className="inline-flex flex-col items-center">
                          <span className="text-xs font-bold text-slate-900">
                            {prob3}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {getProbLabel(prob3).split(' - ')[1]}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 19. IMPACTO (Etapa 3) */}
                    <td className="py-3.5 px-2.5 text-center border-r border-slate-100 bg-emerald-50/20">
                      {imp3 === 'N/A' || imp3 === '' ? (
                        <span className="text-slate-400 italic font-mono text-[11px]">
                          N/A
                        </span>
                      ) : (
                        <div className="inline-flex flex-col items-center">
                          <span className="text-xs font-bold text-slate-900">
                            {imp3}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {getImpactLabel(imp3).split(' - ')[1]}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 20. GRADO RIESGO (Etapa 3) */}
                    <td className="py-3.5 px-2.5 text-center border-r border-slate-100 bg-emerald-50/20">
                      {evalEtapa3.hasValue ? (
                        <span className="inline-flex items-center justify-center w-8 h-7 rounded-lg bg-white border border-emerald-200 font-mono font-bold text-xs text-slate-900 shadow-2xs">
                          {evalEtapa3.score}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic font-mono text-[11px]">
                          N/A
                        </span>
                      )}
                    </td>

                    {/* 21. ZONA DE RIESGO (Etapa 3) */}
                    <td className="py-3.5 px-3 text-center border-r border-slate-100 bg-emerald-50/20">
                      {evalEtapa3.hasValue ? (
                        <Badge
                          variant={evalEtapa3.variant}
                          className="px-2.5 py-0.5 text-[10.5px] font-bold"
                        >
                          {evalEtapa3.zona}
                        </Badge>
                      ) : (
                        <span className="text-slate-400 italic font-mono text-[11px]">
                          N/A
                        </span>
                      )}
                    </td>

                    {/* 22. SEGUIMIENTO Y REVISIÓN DE RIESGOS RESIDUALES */}
                    <td className="py-3.5 px-3.5 border-r border-slate-100 text-slate-700 bg-emerald-50/10">
                      {!seguimientoDisplay || seguimientoDisplay === 'N/A' ? (
                        <span className="text-slate-400 italic font-mono text-[11px]">
                          N/A
                        </span>
                      ) : (
                        <p className="text-[11.5px] leading-normal font-medium text-slate-800">
                          {seguimientoDisplay}
                        </p>
                      )}
                    </td>

                    {/* 23. RESPONSABLE */}
                    <td className="py-3.5 px-3 border-r-2 border-emerald-200 text-slate-800 bg-emerald-50/15">
                      {!responsableDisplay || responsableDisplay === 'N/A' ? (
                        <span className="text-slate-400 italic font-mono text-[11px]">
                          N/A
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-950 font-semibold text-[11px] leading-snug">
                          {responsableDisplay}
                        </span>
                      )}
                    </td>

                    {/* ================= ACCIONES ================= */}
                    <td className="py-3.5 px-3 text-center bg-slate-50/30">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(risk)}
                          disabled={isMatrizBloqueada}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title={
                            isMatrizBloqueada
                              ? 'Matriz bloqueada (solo consulta)'
                              : 'Modificar riesgo y sus 3 etapas'
                          }
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRisk(risk.id)}
                          disabled={isMatrizBloqueada}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title={
                            isMatrizBloqueada
                              ? 'Matriz bloqueada (solo consulta)'
                              : 'Eliminar riesgo'
                          }
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
                  colSpan={24}
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
                            ? 'Aún no hay riesgos en la matriz. Selecciona estándares para precargar sus riesgos o agrega un riesgo nuevo manualmente.'
                            : 'Esta matriz aún no tiene riesgos registrados.'}
                        </p>
                        <button
                          type="button"
                          onClick={onOpenCreateModal}
                          disabled={isMatrizBloqueada}
                          className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
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
                          className="text-xs text-indigo-600 font-semibold hover:underline mt-1 cursor-pointer"
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

      {/* Footer Informativo con Tipos de Riesgo */}
      <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <span>
          Mostrando <strong>{filteredRisks.length}</strong> de{' '}
          <strong>{risks.length}</strong> riesgos en la matriz.
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-600">Tipo de Riesgo:</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Aceptable (1-2)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Apreciable (3-9)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span> Importante (10-16)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Crítico (17-25)
          </span>
        </div>
      </div>
    </div>
  );
}
