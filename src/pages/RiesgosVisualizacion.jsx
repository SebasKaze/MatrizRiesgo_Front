import { useState, useMemo } from 'react';
import { useRiskContext } from '../hooks/useRiskContext';
import { useAuth } from '../hooks/useAuth';
import { calculateRiskScore, getRiskSeverity } from '../utils/riskCalculations';
import { PROBABILITY_LEVELS, IMPACT_LEVELS } from '../constants/riskConstants';
import { Badge } from '../components/ui/Badge';
import { NewRiskModal } from '../components/matrix/NewRiskModal';
import { NewStandardModal } from '../components/matrix/NewStandardModal';
import {
  Table2,
  Search,
  PlusCircle,
  FileSpreadsheet,
  RefreshCw,
  BookOpen,
  Layers,
} from 'lucide-react';

const FUENTES_NORMATIVAS = [
  {
    id: 'fuente-1',
    codigo: 'ISO 31000:2018',
    titulo: 'Gestión del Riesgo — Directrices',
    descripcion:
      'Estándar internacional que proporciona principios, el marco de referencia y el proceso para gestionar cualquier tipo de riesgo de forma sistemática.',
  },
  {
    id: 'fuente-2',
    codigo: 'ISO/IEC 27005',
    titulo: 'Gestión de Riesgos de Seguridad de la Información',
    descripcion:
      'Directrices para la identificación de activos, amenazas, vulnerabilidades y evaluación de riesgos tecnológicos y de seguridad de la información.',
  },
  {
    id: 'fuente-3',
    codigo: 'COSO ERM',
    titulo: 'Marco Integrado de Gestión de Riesgos Empresariales',
    descripcion:
      'Referencia para el control interno, alineación estratégica, gobierno corporativo y evaluación de factores internos y externos.',
  },
  {
    id: 'fuente-4',
    codigo: 'NOM / ISO 9001 / ISO 45001',
    titulo: 'Normatividad Oficial y Estándares de Calidad y Seguridad Operativa',
    descripcion:
      'Lineamientos regulatorios y estándares de gestión aplicables a la continuidad operativa, seguridad en el trabajo y cumplimiento normativo.',
  },
];

export function RiesgosVisualizacion() {
  const {
    allRisks,
    estandares,
    subestandares,
    addEstandar,
    addSubestandar,
    isLoadingRisks,
    refreshRisks,
    isModalOpen,
    openModal,
    closeModal,
    isStandardModalOpen,
    openStandardModal,
    closeStandardModal,
    addRisk,
  } = useRiskContext();
  const { user } = useAuth();

  // Verificar si el usuario autenticado tiene rol de Administrador ('Admin')
  const isAdmin = useMemo(() => {
    const rolValue = String(
      user?.rol || user?.roleCode || user?.role || ''
    )
      .trim()
      .toLowerCase();
    return rolValue === 'admin' || rolValue === 'administrador';
  }, [user]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFactor, setSelectedFactor] = useState('Todos'); // 'Todos' | 'Interno' | 'Externo'
  const [selectedSeverity, setSelectedSeverity] = useState('Todos'); // 'Todos' | 'Crítico' | 'Alto' | 'Medio' | 'Bajo'

  // Mostrar únicamente los riesgos registrados (sin datos de prueba)
  const sourceRisks = useMemo(() => {
    if (!Array.isArray(allRisks) || allRisks.length === 0) {
      return [];
    }
    return allRisks.map((r, idx) => ({
      ...r,
      id: r.id ?? `RSK-${idx + 1}`,
      estandar: r.codigo_estandar || r.estandar || 'N/A',
      subestandar:
        r.codigo_subestandar ||
        r.subestandar ||
        (r.subestandar_id ? String(r.subestandar_id) : 'N/A'),
      title: r.riesgo || r.title || 'Sin título',
      description: r.descripcion || r.description || r.riesgo || r.title || '',
      causa: r.causa || '',
      consecuencia: r.consec || r.consecuencia || '',
      factor: r.factor || 'Interno',
      probability: Number(r.prob ?? r.probability ?? 3),
      impact: Number(r.impacto ?? r.impact ?? 3),
    }));
  }, [allRisks]);

  // Filtros combinados
  const filteredRisks = useMemo(() => {
    return sourceRisks.filter((risk) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        risk.title.toLowerCase().includes(term) ||
        risk.description.toLowerCase().includes(term) ||
        risk.causa.toLowerCase().includes(term) ||
        risk.consecuencia.toLowerCase().includes(term) ||
        risk.estandar.toLowerCase().includes(term) ||
        risk.subestandar.toLowerCase().includes(term) ||
        String(risk.id || '').toLowerCase().includes(term);

      const matchesFactor =
        selectedFactor === 'Todos' || risk.factor === selectedFactor;

      const score = calculateRiskScore(risk.probability, risk.impact);
      const severity = getRiskSeverity(score);
      const riskSeverityLabel = risk.nivel || severity.label;
      const matchesSeverity =
        selectedSeverity === 'Todos' || riskSeverityLabel === selectedSeverity;

      return matchesSearch && matchesFactor && matchesSeverity;
    });
  }, [sourceRisks, searchTerm, selectedFactor, selectedSeverity]);


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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <Table2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">
                  Visualización de Riesgos
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Identificación y Evaluación
                </span>
                <p className="text-slate-500">Visualizacion de los Riesgos Sugereidos. Solamente es para visualizacion, las modificaciones se haran en la Matriz</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={refreshRisks}
              disabled={isLoadingRisks}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              title="Recargar riesgos desde el servidor"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingRisks ? 'animate-spin' : ''}`}
              />
              Actualizar
            </button>
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={openStandardModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  Nuevo Estándar
                </button>
                <button
                  type="button"
                  onClick={openModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  Nuevo Riesgo
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por riesgo, causa, consecuencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Filtro Factor */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Factor:</span>
            {['Todos', 'Interno', 'Externo'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setSelectedFactor(f)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedFactor === f
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Filtro Severidad */}
          <div className="flex items-center gap-1.5 ml-2">
            <span className="font-semibold text-slate-500">Nivel:</span>
            {['Todos', 'Crítico', 'Alto', 'Medio', 'Bajo'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSeverity(s)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedSeverity === s
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla Seccionada en 2 Bloques: IDENTIFICACIÓN y EVALUACIÓN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs border-collapse">
            {/* Header Nivel 1: Los 2 Grandes Bloques */}
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
                  className="bg-amber-600 text-white py-3 px-4 text-center font-bold tracking-wider uppercase text-xs"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>Evaluación del Riesgo</span>
                  </div>
                </th>
              </tr>

              {/* Header Nivel 2: Las Columnas de Cada Bloque */}
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                {/* Bloque Identificación */}
                <th className="py-3 px-3 w-20 text-center border-r border-slate-200 bg-indigo-50/70 text-indigo-950">
                  Estándar
                </th>
                <th className="py-3 px-3 w-24 text-center border-r border-slate-200 bg-indigo-50/70 text-indigo-950">
                  Subestándar
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
                <th className="py-3 px-4 min-w-[150px] text-center bg-amber-50/70 text-amber-950">
                  Nivel de Riesgo
                </th>
              </tr>
            </thead>

            {/* Cuerpo de la Tabla */}
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRisks.length > 0 ? (
                filteredRisks.map((risk, index) => {
                  const score = calculateRiskScore(
                    risk.probability,
                    risk.impact
                  );
                  const severity = getRiskSeverity(score);

                  return (
                    <tr
                      key={risk.id || `risk-${index}`}
                      className="hover:bg-slate-50/90 transition-colors leading-relaxed"
                    >
                      {/* === BLOQUE 1: IDENTIFICACIÓN === */}
                      {/* Estándar */}
                      <td className="py-3.5 px-3 text-center border-r border-slate-100 font-mono text-slate-400 bg-slate-50/30 font-medium">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold text-[10px]">
                          {risk.estandar || 'N/A'}
                        </span>
                      </td>

                      {/* Subestándar */}
                      <td className="py-3.5 px-3 text-center border-r border-slate-100 font-mono text-slate-400 bg-slate-50/30 font-medium">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold text-[10px]">
                          {risk.subestandar || 'N/A'}
                        </span>
                      </td>

                      {/* Riesgo */}
                      <td className="py-3.5 px-4 border-r border-slate-100">
                        <div className="font-bold text-slate-900 text-xs">
                          {risk.title}
                        </div>
                        {risk.id && (
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            {risk.id}
                          </span>
                        )}
                      </td>

                      {/* Descripción del Riesgo */}
                      <td className="py-3.5 px-4 border-r border-slate-100 text-slate-600">
                        <p className="line-clamp-3 text-[11.5px]">
                          {risk.description || risk.title}
                        </p>
                      </td>

                      {/* Causa */}
                      <td className="py-3.5 px-4 border-r border-slate-100 text-slate-700 bg-slate-50/20">
                        <p className="text-[11.5px] leading-normal font-medium">
                          {risk.causa || 'Causa operativa bajo análisis'}
                        </p>
                      </td>

                      {/* Consecuencia */}
                      <td className="py-3.5 px-4 border-r border-slate-100 text-slate-700">
                        <p className="text-[11.5px] leading-normal font-medium">
                          {risk.consecuencia || 'Impacto potencial evaluado'}
                        </p>
                      </td>

                      {/* Factor (Externo / Interno) */}
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
                      {/* Probabilidad */}
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

                      {/* Impacto */}
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

                      {/* Nivel de Riesgo (Calculado en base a los 2 anteriores) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge
                            variant={getSeverityBadgeVariant(severity.label)}
                            className="px-2.5 py-1 text-[11px] font-bold"
                          >
                            {severity.label}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Valor: {score} (P{risk.probability} &times; I{risk.impact})
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={10}
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
                                onClick={openModal}
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
                            onClick={() => {
                              setSearchTerm('');
                              setSelectedFactor('Todos');
                              setSelectedSeverity('Todos');
                            }}
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

        {/* Footer Informativo de la Tabla */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Mostrando <strong>{filteredRisks.length}</strong> de{' '}
            <strong>{sourceRisks.length}</strong> riesgos registrados.
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Bajo (1-5)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Medio (6-11)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span> Alto (12-16)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Crítico (17-25)
            </span>
          </div>
        </div>
      </div>

      {/* Apartado de Fuentes */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Fuentes y Referencias Normativas
            </h2>
            <p className="text-xs text-slate-500">
              Estándares y marcos de referencia utilizados para la identificación y evaluación de riesgos sugeridos.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {FUENTES_NORMATIVAS.map((fuente) => (
            <div
              key={fuente.id}
              className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-mono font-bold text-[11px]">
                  {fuente.codigo}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                {fuente.titulo}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {fuente.descripcion}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Modales exclusivos para Administradores */}
      {isAdmin && (
        <>
          <NewStandardModal
            isOpen={isStandardModalOpen}
            onClose={closeStandardModal}
            estandares={estandares}
            subestandares={subestandares}
            onAddEstandar={addEstandar}
            onAddSubestandar={addSubestandar}
          />
          <NewRiskModal
            isOpen={isModalOpen}
            onClose={closeModal}
            onAddRisk={addRisk}
          />
        </>
      )}
    </div>
  );
}
