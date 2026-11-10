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
  Pencil,
  Trash2,
  X,
  AlertCircle,
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
    updateEstandar,
    removeEstandar,
    addSubestandar,
    updateSubestandar,
    removeSubestandar,
    isLoadingRisks,
    refreshRisks,
    isModalOpen,
    openModal,
    closeModal,
    isStandardModalOpen,
    openStandardModal,
    closeStandardModal,
    addRisk,
    updateRisk,
    removeRisk,
  } = useRiskContext();
  const { user } = useAuth();

  // Verificar si el usuario autenticado tiene rol="Admin"
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
  const [editingRisk, setEditingRisk] = useState(null);

  const handleOpenCreateRiskModal = () => {
    setEditingRisk(null);
    openModal();
  };

  const handleOpenEditRiskModal = (risk) => {
    setEditingRisk(risk);
    openModal();
  };

  const handleCloseRiskModal = () => {
    setEditingRisk(null);
    closeModal();
  };

  const handleDeleteRisk = async (risk) => {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar el riesgo "${risk.title}"?`
    );
    if (!confirmed) return;
    await removeRisk(risk.id);
  };

  // Estado para editar Estándares y Subestándares en la nueva tabla inferior
  const [editingCatalogRow, setEditingCatalogRow] = useState(null);
  const [catalogForm, setCatalogForm] = useState({
    codigo_estandar: '',
    descripcion_estandar: '',
    codigo_subestandar: '',
    descripcion_subestandar: '',
  });
  const [isSavingCatalogEdit, setIsSavingCatalogEdit] = useState(false);
  const [catalogEditError, setCatalogEditError] = useState('');

  // Construir las filas de la tabla de Estándares y Subestándares registrados
  const standardsTableRows = useMemo(() => {
    const rows = [];
    const matchedSubIds = new Set();

    estandares.forEach((est) => {
      const associatedSubs = subestandares.filter(
        (sub) =>
          sub.codigo_estandar === est.codigo_estandar ||
          (est.id !== undefined &&
            est.id !== null &&
            String(sub.estandar_id) === String(est.id))
      );

      if (associatedSubs.length === 0) {
        rows.push({
          rowKey: `est-${est.id || est.codigo_estandar}`,
          estandar: est,
          subestandar: null,
        });
      } else {
        associatedSubs.forEach((sub) => {
          matchedSubIds.add(
            String(sub.id ?? `${sub.codigo_estandar}-${sub.codigo_subestandar}`)
          );
          rows.push({
            rowKey: `est-${est.id || est.codigo_estandar}-sub-${
              sub.id || sub.codigo_subestandar
            }`,
            estandar: est,
            subestandar: sub,
          });
        });
      }
    });

    // Incluir cualquier subestándar huérfano si existiera
    subestandares.forEach((sub) => {
      const key = String(
        sub.id ?? `${sub.codigo_estandar}-${sub.codigo_subestandar}`
      );
      if (!matchedSubIds.has(key)) {
        rows.push({
          rowKey: `orphan-sub-${key}`,
          estandar: {
            id: sub.estandar_id ?? null,
            codigo_estandar: sub.codigo_estandar || 'N/A',
            descripcion: '',
          },
          subestandar: sub,
        });
      }
    });

    return rows;
  }, [estandares, subestandares]);

  const handleOpenEditCatalogRow = (row) => {
    setCatalogEditError('');
    setEditingCatalogRow(row);
    setCatalogForm({
      codigo_estandar: row.estandar?.codigo_estandar || '',
      descripcion_estandar: row.estandar?.descripcion || '',
      codigo_subestandar: row.subestandar?.codigo_subestandar || '',
      descripcion_subestandar: row.subestandar?.descripcion || '',
    });
  };

  const handleSaveCatalogEdit = async (e) => {
    e.preventDefault();
    if (!editingCatalogRow) return;
    setCatalogEditError('');

    if (!catalogForm.codigo_estandar.trim()) {
      setCatalogEditError('El código del estándar es obligatorio.');
      return;
    }

    if (
      editingCatalogRow.subestandar &&
      !catalogForm.codigo_subestandar.trim()
    ) {
      setCatalogEditError('El código del subestándar es obligatorio.');
      return;
    }

    setIsSavingCatalogEdit(true);
    try {
      const updatedEst = await updateEstandar(editingCatalogRow.estandar.id, {
        codigo_estandar: catalogForm.codigo_estandar.trim(),
        descripcion: catalogForm.descripcion_estandar.trim(),
        oldCodigoEstandar: editingCatalogRow.estandar.codigo_estandar,
      });

      if (editingCatalogRow.subestandar) {
        await updateSubestandar(editingCatalogRow.subestandar.id, {
          estandar_id:
            updatedEst?.id ??
            editingCatalogRow.subestandar.estandar_id ??
            editingCatalogRow.estandar.id,
          codigo_estandar:
            updatedEst?.codigo_estandar || catalogForm.codigo_estandar.trim(),
          codigo_subestandar: catalogForm.codigo_subestandar.trim(),
          descripcion: catalogForm.descripcion_subestandar.trim(),
          oldCodigoSubestandar:
            editingCatalogRow.subestandar.codigo_subestandar,
        });
      }

      setEditingCatalogRow(null);
    } catch (err) {
      setCatalogEditError(
        err.message ||
          'No se pudieron guardar los cambios del estándar/subestándar.'
      );
    } finally {
      setIsSavingCatalogEdit(false);
    }
  };

  const handleDeleteSubestandarRow = async (subestandar) => {
    if (!subestandar) return;
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar el subestándar "${subestandar.codigo_subestandar}"?`
    );
    if (!confirmed) return;
    await removeSubestandar(subestandar);
  };

  const handleDeleteEstandarRow = async (estandar) => {
    if (!estandar) return;
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar el estándar "${estandar.codigo_estandar}" y todos sus subestándares asociados?`
    );
    if (!confirmed) return;
    await removeEstandar(estandar);
  };

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
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Visualizacion de los Riesgos Sugereidos. Solamente es para visualizacion, las modificaciones se haran en la Matriz
            </p>
          </div>
        </div>

        {/* Espacio debajo de Visualización de Riesgos con los botones centrados en una sola fila */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-nowrap items-center justify-center gap-3 overflow-x-auto">
          <button
            type="button"
            onClick={refreshRisks}
            disabled={isLoadingRisks}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer shrink-0"
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
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm font-semibold rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <Layers className="w-4 h-4" />
                Nuevo Estándar
              </button>

              <button
                type="button"
                onClick={handleOpenCreateRiskModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 transition-colors cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                Nuevo Riesgo
              </button>
            </>
          )}
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

      {/* Tabla Seccionada en Bloques: IDENTIFICACIÓN, EVALUACIÓN y ACCIONES */}
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

                      {/* Riesgo (sin mostrar el ID del riesgo) */}
                      <td className="py-3.5 px-4 border-r border-slate-100">
                        <div className="font-bold text-slate-900 text-xs">
                          {risk.title}
                        </div>
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
                            Valor: {score} (P{risk.probability} &times; I{risk.impact})
                          </span>
                        </div>
                      </td>

                      {/* === BLOQUE 3: ACCIONES (Editar y Eliminar) exclusivo para rol="Admin" === */}
                      {isAdmin && (
                        <td className="py-3.5 px-3 text-center bg-slate-50/30">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditRiskModal(risk)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Editar riesgo"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRisk(risk)}
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
                                onClick={handleOpenCreateRiskModal}
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

      {/* Nueva Tabla de Estándares y Subestándares Registrados (debajo de la tabla de Riesgos) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Estándares y Subestándares Registrados
              </h2>
              <p className="text-xs text-slate-500">
                Catálogo normativo de estándares y sus subestándares asociados en la base de datos.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Estándares: <strong className="text-slate-800">{estandares.length}</strong>{' '}
            &bull; Subestándares:{' '}
            <strong className="text-slate-800">{subestandares.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th
                  colSpan={2}
                  className="bg-indigo-700 text-white py-3 px-4 text-center font-bold tracking-wider uppercase text-xs border-r-2 border-indigo-800"
                >
                  Estándar
                </th>
                <th
                  colSpan={2}
                  className={`bg-teal-700 text-white py-3 px-4 text-center font-bold tracking-wider uppercase text-xs ${
                    isAdmin ? 'border-r-2 border-teal-800' : ''
                  }`}
                >
                  Subestándar
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

              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-36 text-center border-r border-slate-200 bg-indigo-50/70 text-indigo-950">
                  Código Estándar
                </th>
                <th className="py-3 px-4 min-w-[220px] border-r-2 border-indigo-200 bg-indigo-50/40 text-indigo-950">
                  Descripción del Estándar
                </th>
                <th className="py-3 px-4 w-40 text-center border-r border-slate-200 bg-teal-50/70 text-teal-950">
                  Código Subestándar
                </th>
                <th
                  className={`py-3 px-4 min-w-[220px] bg-teal-50/40 text-teal-950 ${
                    isAdmin ? 'border-r-2 border-teal-200' : ''
                  }`}
                >
                  Descripción del Subestándar
                </th>
                {isAdmin && (
                  <th className="py-3 px-3 w-44 text-center bg-slate-100 text-slate-800">
                    Modificar / Eliminar
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {standardsTableRows.length > 0 ? (
                standardsTableRows.map((row) => (
                  <tr
                    key={row.rowKey}
                    className="hover:bg-slate-50/90 transition-colors leading-relaxed"
                  >
                    {/* Código Estándar */}
                    <td className="py-3.5 px-4 text-center border-r border-slate-100 font-mono bg-slate-50/30">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[11px]">
                        {row.estandar?.codigo_estandar || 'N/A'}
                      </span>
                    </td>

                    {/* Descripción del Estándar */}
                    <td className="py-3.5 px-4 border-r-2 border-indigo-100 text-slate-700">
                      <p className="text-[11.5px] font-medium">
                        {row.estandar?.descripcion || 'Sin descripción registrada'}
                      </p>
                    </td>

                    {/* Código Subestándar */}
                    <td className="py-3.5 px-4 text-center border-r border-slate-100 font-mono bg-slate-50/20">
                      {row.subestandar ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-bold text-[11px]">
                          {row.subestandar.codigo_subestandar}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic font-sans">
                          Sin subestándar
                        </span>
                      )}
                    </td>

                    {/* Descripción del Subestándar */}
                    <td
                      className={`py-3.5 px-4 text-slate-600 ${
                        isAdmin ? 'border-r-2 border-teal-100' : ''
                      }`}
                    >
                      {row.subestandar ? (
                        <p className="text-[11.5px]">
                          {row.subestandar.descripcion || 'Sin descripción registrada'}
                        </p>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Aún no se han registrado subestándares para este estándar
                        </span>
                      )}
                    </td>

                    {/* Columna de Acciones exclusiva para rol="Admin" */}
                    {isAdmin && (
                      <td className="py-3 px-3 text-center bg-slate-50/30">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCatalogRow(row)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold text-[11px] transition-colors cursor-pointer"
                            title="Modificar estándar y subestándar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </button>

                          {row.subestandar && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteSubestandarRow(row.subestandar)
                              }
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 font-semibold text-[11px] transition-colors cursor-pointer"
                              title={`Eliminar subestándar ${row.subestandar.codigo_subestandar}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Sub
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteEstandarRow(row.estandar)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 font-semibold text-[11px] transition-colors cursor-pointer"
                            title={`Eliminar estándar ${row.estandar?.codigo_estandar}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Est
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    className="py-10 text-center text-slate-500 bg-white"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Layers className="w-7 h-7 text-slate-300" />
                      <p className="font-medium text-sm text-slate-700">
                        No hay estándares ni subestándares registrados aún.
                      </p>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={openStandardModal}
                          className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Registrar Nuevo Estándar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

      {/* Modales para Gestión de Estándares y Riesgos (exclusivos para rol="Admin") */}
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
            key={editingRisk?.id || 'new-risk-modal'}
            isOpen={isModalOpen}
            onClose={handleCloseRiskModal}
            onAddRisk={addRisk}
            onUpdateRisk={updateRisk}
            editingRisk={editingRisk}
          />

          {/* Modal para editar Estándar y Subestándar */}
          {editingCatalogRow && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 my-8">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Modificar Estándar / Subestándar
                      </h3>
                      <p className="text-xs text-slate-500">
                        Actualiza el código o descripción en la base de datos.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingCatalogRow(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {catalogEditError && (
                  <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{catalogEditError}</span>
                  </div>
                )}

                <form
                  onSubmit={handleSaveCatalogEdit}
                  className="mt-4 space-y-4"
                >
                  {/* Bloque Estándar */}
                  <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-3">
                    <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                      Datos del Estándar
                    </h4>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Código del Estándar *
                      </label>
                      <input
                        type="text"
                        required
                        value={catalogForm.codigo_estandar}
                        onChange={(e) =>
                          setCatalogForm({
                            ...catalogForm,
                            codigo_estandar: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Descripción del Estándar *
                      </label>
                      <textarea
                        rows="2"
                        required
                        value={catalogForm.descripcion_estandar}
                        onChange={(e) =>
                          setCatalogForm({
                            ...catalogForm,
                            descripcion_estandar: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Bloque Subestándar (si la fila cuenta con subestándar) */}
                  {editingCatalogRow.subestandar && (
                    <div className="p-4 rounded-xl bg-teal-50/40 border border-teal-100 space-y-3">
                      <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                        Datos del Subestándar Asociado
                      </h4>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Código del Subestándar *
                        </label>
                        <input
                          type="text"
                          required
                          value={catalogForm.codigo_subestandar}
                          onChange={(e) =>
                            setCatalogForm({
                              ...catalogForm,
                              codigo_subestandar: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Descripción del Subestándar *
                        </label>
                        <textarea
                          rows="2"
                          required
                          value={catalogForm.descripcion_subestandar}
                          onChange={(e) =>
                            setCatalogForm({
                              ...catalogForm,
                              descripcion_subestandar: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingCatalogRow(null)}
                      disabled={isSavingCatalogEdit}
                      className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingCatalogEdit}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
                    >
                      {isSavingCatalogEdit ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <span>Guardar Cambios</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
