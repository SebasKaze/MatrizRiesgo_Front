import {
  FileSpreadsheet,
  PlusCircle,
  Pencil,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
  const item = PROBABILITY_LEVELS.find((p) => p.value === val);
  return item ? `${val} - ${item.label}` : String(val);
};

const getImpactLabel = (val) => {
  const item = IMPACT_LEVELS.find((i) => i.value === val);
  return item ? `${val} - ${item.label}` : String(val);
};

export function RiesgosCatalogTable({
  sourceRisks = [],
  filteredRisks = [],
  isAdmin = false,
  sortBy = 'none',
  onToggleColumnSort,
  onOpenCreateRiskModal,
  onOpenEditRiskModal,
  onDeleteRisk,
  onResetFilters,
}) {
  const renderEstandarSortIcon = () => {
    if (sortBy === 'estandar-asc' || sortBy === 'ambos-asc') {
      return <ArrowUp className="w-3.5 h-3.5 text-indigo-700 shrink-0" />;
    }
    if (sortBy === 'estandar-desc' || sortBy === 'ambos-desc') {
      return <ArrowDown className="w-3.5 h-3.5 text-indigo-700 shrink-0" />;
    }
    return <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
  };

  const renderSubestandarSortIcon = () => {
    if (sortBy === 'subestandar-asc' || sortBy === 'ambos-asc') {
      return <ArrowUp className="w-3.5 h-3.5 text-indigo-700 shrink-0" />;
    }
    if (sortBy === 'subestandar-desc' || sortBy === 'ambos-desc') {
      return <ArrowDown className="w-3.5 h-3.5 text-indigo-700 shrink-0" />;
    }
    return <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs border-collapse">
          {/* Header Nivel 1: Los Bloques */}
          <thead>
            <tr className="border-b border-slate-200">
              <th
                colSpan={7}
                className="bg-indigo-700 text-white py-3 px-4 text-center font-bold tracking-wider uppercase text-xs border-r-2 border-indigo-800"
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Identificación del Riesgo</span>
                </div>
              </th>
              <th
                colSpan={3}
                className={`bg-amber-600 text-white py-3 px-4 text-center font-bold tracking-wider uppercase text-xs ${
                  isAdmin ? 'border-r-2 border-amber-700' : ''
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Evaluación del Riesgo</span>
                </div>
              </th>
              {isAdmin && (
                <th
                  colSpan={1}
                  className="bg-slate-800 text-white py-3 px-3 text-center font-bold tracking-wider uppercase text-xs"
                >
                  Acciones
                </th>
              )}
            </tr>

            {/* Header Nivel 2: Las Columnas de Cada Bloque */}
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              {/* Bloque Identificación */}
              <th className="py-3 px-3 w-24 text-center border-r border-slate-200 bg-indigo-50/70 text-indigo-950">
                <button
                  type="button"
                  onClick={() => onToggleColumnSort('estandar')}
                  className="inline-flex items-center justify-center gap-1 uppercase font-bold tracking-wider hover:text-indigo-700 cursor-pointer"
                  title="Ordenar por Estándar"
                >
                  <span>Estándar</span>
                  {renderEstandarSortIcon()}
                </button>
              </th>
              <th className="py-3 px-3 w-28 text-center border-r border-slate-200 bg-indigo-50/70 text-indigo-950">
                <button
                  type="button"
                  onClick={() => onToggleColumnSort('subestandar')}
                  className="inline-flex items-center justify-center gap-1 uppercase font-bold tracking-wider hover:text-indigo-700 cursor-pointer"
                  title="Ordenar por Subestándar"
                >
                  <span>Subestándar</span>
                  {renderSubestandarSortIcon()}
                </button>
              </th>
              <th className="py-3 px-4 min-w-[180px] border-r border-slate-200 bg-indigo-50/40 text-indigo-950">
                Riesgo
              </th>
              <th className="py-3 px-4 min-w-[220px] border-r border-slate-200 bg-indigo-50/40 text-indigo-950">
                Descripción del Riesgo
              </th>
              <th className="py-3 px-4 min-w-[200px] border-r border-slate-200 bg-indigo-50/40 text-indigo-950">
                Causa
              </th>
              <th className="py-3 px-4 min-w-[200px] border-r border-slate-200 bg-indigo-50/40 text-indigo-950">
                Consecuencia
              </th>
              <th className="py-3 px-3 w-24 text-center border-r-2 border-indigo-200 bg-indigo-50/70 text-indigo-950">
                Factor
              </th>

              {/* Bloque Evaluación */}
              <th className="py-3 px-3 w-28 text-center border-r border-slate-200 bg-amber-50/70 text-amber-950">
                Probabilidad
              </th>
              <th className="py-3 px-3 w-28 text-center border-r border-slate-200 bg-amber-50/70 text-amber-950">
                Impacto
              </th>
              <th
                className={`py-3 px-4 min-w-[150px] text-center bg-amber-50/70 text-amber-950 ${
                  isAdmin ? 'border-r-2 border-amber-200' : ''
                }`}
              >
                Nivel de Riesgo
              </th>

              {/* Columna de Acciones (Editar y Eliminar) solo para Admin */}
              {isAdmin && (
                <th className="py-3 px-3 w-28 text-center bg-slate-100 text-slate-800">
                  Acciones
                </th>
              )}
            </tr>
          </thead>

          {/* Cuerpo de la Tabla */}
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredRisks.length > 0 ? (
              filteredRisks.map((risk, index) => {
                const score = calculateRiskScore(risk.probability, risk.impact);
                const severity = getRiskSeverity(score);

                return (
                  <tr
                    key={risk.id || `risk-${index}`}
                    className="hover:bg-slate-50/90 transition-colors leading-relaxed"
                  >
                    {/* === BLOQUE 1: IDENTIFICACIÓN === */}
                    <td className="py-3.5 px-3 text-center border-r border-slate-100 font-mono text-slate-400 bg-slate-50/30 font-medium">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold text-[10px]">
                        {risk.estandar || 'N/A'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center border-r border-slate-100 font-mono text-slate-400 bg-slate-50/30 font-medium">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold text-[10px]">
                        {risk.subestandar || 'N/A'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 border-r border-slate-100">
                      <div className="font-bold text-slate-900 text-xs">
                        {risk.title}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 border-r border-slate-100 text-slate-600">
                      <p className="line-clamp-3 text-[11.5px]">
                        {risk.description || risk.title}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 border-r border-slate-100 text-slate-700 bg-slate-50/20">
                      <p className="text-[11.5px] leading-normal font-medium">
                        {risk.causa || 'Causa operativa bajo análisis'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 border-r border-slate-100 text-slate-700">
                      <p className="text-[11.5px] leading-normal font-medium">
                        {risk.consecuencia || 'Impacto potencial evaluado'}
                      </p>
                    </td>

                    <td className="py-3.5 px-3 text-center border-r-2 border-indigo-200">
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

                    {/* === BLOQUE 2: EVALUACIÓN === */}
                    <td className="py-3.5 px-3 text-center border-r border-slate-100 font-semibold text-slate-700">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-xs font-bold text-slate-900">
                          {risk.probability}
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {getProbLabel(risk.probability).split(' - ')[1]}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center border-r border-slate-100 font-semibold text-slate-700">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-xs font-bold text-slate-900">
                          {risk.impact}
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {getImpactLabel(risk.impact).split(' - ')[1]}
                        </span>
                      </div>
                    </td>

                    <td
                      className={`py-3.5 px-4 text-center ${
                        isAdmin ? 'border-r-2 border-amber-200' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Badge
                          variant={getSeverityBadgeVariant(severity.label)}
                          className="px-2.5 py-1 text-[11px] font-bold"
                        >
                          {severity.label}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Valor: {score} (P{risk.probability} &times; I
                          {risk.impact})
                        </span>
                      </div>
                    </td>

                    {/* === BLOQUE 3: ACCIONES exclusivo para rol="Admin" === */}
                    {isAdmin && (
                      <td className="py-3.5 px-3 text-center bg-slate-50/30">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenEditRiskModal(risk)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Editar riesgo"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRisk(risk)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Eliminar riesgo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={isAdmin ? 11 : 10}
                  className="py-12 text-center text-slate-500 bg-white"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileSpreadsheet className="w-8 h-8 text-slate-300" />
                    {sourceRisks.length === 0 ? (
                      <>
                        <p className="font-medium text-sm text-slate-700">
                          Aún no hay riesgos registrados.
                        </p>
                        {isAdmin ? (
                          <>
                            <p className="text-xs text-slate-400">
                              Haz clic en &ldquo;Nuevo Riesgo&rdquo; para agregar el primer registro.
                            </p>
                            <button
                              type="button"
                              onClick={onOpenCreateRiskModal}
                              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              Registrar Primer Riesgo
                            </button>
                          </>
                        ) : (
                          <p className="text-xs text-slate-400">
                            El catálogo de riesgos sugeridos aún no cuenta con registros cargados por el administrador.
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-sm">
                          No se encontraron riesgos que coincidan con la búsqueda.
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

      {/* Footer Informativo de la Tabla */}
      <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <span>
          Mostrando <strong>{filteredRisks.length}</strong> de{' '}
          <strong>{sourceRisks.length}</strong> riesgos registrados.
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Bajo
            (1-5)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Medio
            (6-11)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span> Alto
            (12-16)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Crítico
            (17-25)
          </span>
        </div>
      </div>
    </div>
  );
}
