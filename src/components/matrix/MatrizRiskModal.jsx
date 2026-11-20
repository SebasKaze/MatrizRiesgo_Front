import { useMemo } from 'react';
import {
  Table2,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  X,
} from 'lucide-react';
import { getMatrixZoneEvaluation } from '../../utils/riskCalculations';
import { PROBABILITY_LEVELS, IMPACT_LEVELS } from '../../constants/riskConstants';

export function MatrizRiskModal({
  isOpen,
  onClose,
  editingRisk,
  formData,
  setFormData,
  onSubmit,
  estandares = [],
  subestandares = [],
}) {
  // Subestándares disponibles para el formulario modal según el estándar elegido en `formData.estandar`
  const modalSubestandares = useMemo(() => {
    if (!formData.estandar || formData.estandar === 'N/A') return [];
    const estObj = estandares.find(
      (e) => e.codigo_estandar === formData.estandar
    );
    return subestandares.filter(
      (s) =>
        s.codigo_estandar === formData.estandar ||
        (estObj && String(s.estandar_id) === String(estObj.id))
    );
  }, [formData.estandar, estandares, subestandares]);

  if (!isOpen) return null;

  const evalEtapa1 = getMatrixZoneEvaluation(
    formData.probability,
    formData.impact
  );
  const evalEtapa2 = getMatrixZoneEvaluation(
    formData.probabilidadEtapa2,
    formData.impactoEtapa2
  );
  const evalEtapa3 = getMatrixZoneEvaluation(
    formData.probabilidadEtapa3,
    formData.impactoEtapa3
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 my-8 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Table2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {editingRisk
                  ? `Modificar Riesgo de la Matriz (${editingRisk.subestandar || editingRisk.estandar || editingRisk.id})`
                  : 'Agregar Nuevo Riesgo a la Matriz (3 Etapas)'}
              </h3>
              <p className="text-xs text-slate-500">
                Configura las 3 etapas: Evaluación Inicial, Controles Implementados y Controles Complementarios / Seguimiento.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario con Scroll dividido en las 3 Etapas */}
        <form
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto mt-4 pr-1 space-y-6"
        >
          {/* ================================================================= */}
          {/* ETAPA 1: IDENTIFICACIÓN Y EVALUACIÓN DEL RIESGO (INHERENTE)       */}
          {/* ================================================================= */}
          <div className="bg-indigo-50/40 p-5 rounded-xl border border-indigo-100 space-y-4">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              Etapa 1. Identificación, Contexto y Evaluación de Riesgo Inicial
            </h4>

            {/* Estándar y Subestándar (2 columnas separadas) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Estándar *
                </label>
                <select
                  required
                  value={formData.estandar === 'N/A' ? '' : formData.estandar}
                  onChange={(e) => {
                    const nextEst = e.target.value || 'N/A';
                    setFormData({
                      ...formData,
                      estandar: nextEst,
                      codigo_estandar: nextEst,
                      subestandar: '',
                      codigo_subestandar: '',
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Seleccionar Estándar --</option>
                  {estandares.map((est) => (
                    <option
                      key={est.codigo_estandar}
                      value={est.codigo_estandar}
                    >
                      {est.codigo_estandar}
                      {est.descripcion ? ` — ${est.descripcion}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Subestándar *
                </label>
                <select
                  required
                  disabled={!formData.estandar || formData.estandar === 'N/A'}
                  value={
                    formData.subestandar === 'N/A' ? '' : formData.subestandar
                  }
                  onChange={(e) => {
                    const nextSub = e.target.value || 'N/A';
                    setFormData({
                      ...formData,
                      subestandar: nextSub,
                      codigo_subestandar: nextSub,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">
                    {formData.estandar && formData.estandar !== 'N/A'
                      ? '-- Seleccionar Subestándar --'
                      : '-- Elige primero un estándar --'}
                  </option>
                  {modalSubestandares.map((sub) => (
                    <option
                      key={`${sub.codigo_estandar}-${sub.codigo_subestandar}`}
                      value={sub.codigo_subestandar}
                    >
                      {sub.codigo_subestandar}
                      {sub.descripcion ? ` — ${sub.descripcion}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contexto y Proceso */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Contexto *
                </label>
                <select
                  value={formData.contexto}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contexto: e.target.value,
                      factor:
                        e.target.value === 'Interno' ||
                        e.target.value === 'Externo'
                          ? e.target.value
                          : 'Contexto interno / Externo',
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Contexto interno / Externo">
                    Contexto interno / Externo
                  </option>
                  <option value="Interno">Interno</option>
                  <option value="Externo">Externo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Proceso *
                </label>
                <input
                  type="text"
                  required
                  value={formData.proceso}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      proceso: e.target.value,
                      category: e.target.value,
                    })
                  }
                  placeholder="Ej. Análisis de riesgo"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Riesgo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Riesgo *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    title: e.target.value,
                    description: e.target.value,
                  })
                }
                placeholder="Ej. Contaminación de los contenedores y vehículos"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Causas y Consecuencias */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Causas *
                </label>
                <textarea
                  rows="2"
                  required
                  value={formData.causa}
                  onChange={(e) =>
                    setFormData({ ...formData, causa: e.target.value })
                  }
                  placeholder="Ej. No contar con un análisis de riesgos para evitar accesos no autorizados"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Consecuencias *
                </label>
                <textarea
                  rows="2"
                  required
                  value={formData.consecuencia}
                  onChange={(e) =>
                    setFormData({ ...formData, consecuencia: e.target.value })
                  }
                  placeholder="Ej. Daños económicos a la empresa y al personal"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Evaluación Etapa 1: Probabilidad, Impacto, Grado Riesgo, Zona de Riesgo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Probabilidad (Etapa 1)
                </label>
                <select
                  value={formData.probability}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      probability: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PROBABILITY_LEVELS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.value} - {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Impacto (Etapa 1)
                </label>
                <select
                  value={formData.impact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      impact: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {IMPACT_LEVELS.map((imp) => (
                    <option key={imp.value} value={imp.value}>
                      {imp.value} - {imp.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-indigo-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-600">
                Resultado Etapa 1 (Grado y Zona de Riesgo):
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                  Grado Riesgo: {evalEtapa1.score}
                </span>
                <span
                  className={`font-bold px-2.5 py-1 rounded-md border ${evalEtapa1.colorClass}`}
                >
                  Zona: {evalEtapa1.zona}
                </span>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* ETAPA 2: CONTROLES IMPLEMENTADOS Y REEVALUACIÓN                   */}
          {/* ================================================================= */}
          <div className="bg-amber-50/40 p-5 rounded-xl border border-amber-100 space-y-4">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Etapa 2. Controles Implementados y Reevaluación
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Controles Implementados
              </label>
              <textarea
                rows="2"
                value={formData.controlesImplementados}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    controlesImplementados: e.target.value,
                    planAccion: e.target.value,
                  })
                }
                placeholder="Ej. Actualización anual del análisis de riesgo (o N/A)"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Probabilidad (Etapa 2)
                </label>
                <select
                  value={formData.probabilidadEtapa2}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      probabilidadEtapa2: e.target.value,
                      nuevaProbabilidad: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="N/A">N/A</option>
                  {PROBABILITY_LEVELS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.value} - {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Impacto (Etapa 2)
                </label>
                <select
                  value={formData.impactoEtapa2}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      impactoEtapa2: e.target.value,
                      nuevoImpacto: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="N/A">N/A</option>
                  {IMPACT_LEVELS.map((imp) => (
                    <option key={imp.value} value={imp.value}>
                      {imp.value} - {imp.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-600">
                Resultado Etapa 2 (Grado y Zona de Riesgo):
              </span>
              {evalEtapa2.hasValue ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                    Grado Riesgo: {evalEtapa2.score}
                  </span>
                  <span
                    className={`font-bold px-2.5 py-1 rounded-md border ${evalEtapa2.colorClass}`}
                  >
                    Zona: {evalEtapa2.zona}
                  </span>
                </div>
              ) : (
                <span className="text-slate-400 italic font-mono">
                  Selecciona Probabilidad e Impacto de Etapa 2 para calcular Grado y Zona
                </span>
              )}
            </div>
          </div>

          {/* ================================================================= */}
          {/* ETAPA 3: CONTROLES COMPLEMENTARIOS, RIESGO RESIDUAL Y SEGUIMIENTO */}
          {/* ================================================================= */}
          <div className="bg-emerald-50/40 p-5 rounded-xl border border-emerald-100 space-y-4">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Etapa 3. Controles Complementarios, Riesgo Residual y Seguimiento
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Controles Complementarios
              </label>
              <textarea
                rows="2"
                value={formData.controlesComplementarios}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    controlesComplementarios: e.target.value,
                    mitigacion: e.target.value,
                  })
                }
                placeholder="Ej. En caso de incidentes de seguridad se realizará una reevaluación del análisis de riesgo..."
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Probabilidad (Etapa 3)
                </label>
                <select
                  value={formData.probabilidadEtapa3}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      probabilidadEtapa3: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="N/A">N/A</option>
                  {PROBABILITY_LEVELS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.value} - {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Impacto (Etapa 3)
                </label>
                <select
                  value={formData.impactoEtapa3}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      impactoEtapa3: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="N/A">N/A</option>
                  {IMPACT_LEVELS.map((imp) => (
                    <option key={imp.value} value={imp.value}>
                      {imp.value} - {imp.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-600">
                Resultado Etapa 3 (Grado y Zona de Riesgo Residual):
              </span>
              {evalEtapa3.hasValue ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                    Grado Riesgo: {evalEtapa3.score}
                  </span>
                  <span
                    className={`font-bold px-2.5 py-1 rounded-md border ${evalEtapa3.colorClass}`}
                  >
                    Zona: {evalEtapa3.zona}
                  </span>
                </div>
              ) : (
                <span className="text-slate-400 italic font-mono">
                  Selecciona Probabilidad e Impacto de Etapa 3 para calcular Grado y Zona
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Seguimiento y Revisión de Riesgos Residuales
                </label>
                <textarea
                  rows="3"
                  value={formData.seguimientoRevision}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      seguimientoRevision: e.target.value,
                    })
                  }
                  placeholder="Ej. El seguimiento se realiza mediante inspecciones visuales previas a la carga, con registros y evidencias fotográficas..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Responsable
                </label>
                <textarea
                  rows="3"
                  value={formData.responsable}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      responsable: e.target.value,
                    })
                  }
                  placeholder="Ej. Staff y/o Comité de Seguridad OEA - Dirección"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              {editingRisk ? 'Guardar Modificaciones' : 'Agregar Riesgo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
