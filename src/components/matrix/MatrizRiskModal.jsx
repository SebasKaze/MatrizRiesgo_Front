import { useMemo } from 'react';
import {
  Table2,
  ShieldAlert,
  AlertTriangle,
  Calendar,
  Sparkles,
  X,
} from 'lucide-react';
import { getRiskSeverity } from '../../utils/riskCalculations';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 my-8 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Table2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {editingRisk
                  ? `Modificar Riesgo (${editingRisk.id})`
                  : 'Agregar Nuevo Riesgo a la Matriz'}
              </h3>
              <p className="text-xs text-slate-500">
                Completa la información de Identificación, Evaluación y
                Tratamiento.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario con Scroll */}
        <form
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto mt-4 pr-1 space-y-6"
        >
          {/* SECCIÓN 1: IDENTIFICACIÓN */}
          <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100 space-y-4">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              1. Bloque de Identificación
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Estándar *
                </label>
                <select
                  required
                  value={formData.estandar === 'N/A' ? '' : formData.estandar}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estandar: e.target.value || 'N/A',
                      subestandar: '',
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Seleccionar Estándar --</option>
                  {estandares.map((est) => (
                    <option
                      key={est.codigo_estandar}
                      value={est.codigo_estandar}
                    >
                      {est.codigo_estandar}
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subestandar: e.target.value || 'N/A',
                    })
                  }
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
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Riesgo (Título / Evento) *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ej. Falla en el suministro eléctrico principal"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Descripción del Riesgo
              </label>
              <textarea
                rows="2"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Detalle o circunstancia del riesgo..."
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Causa
                </label>
                <input
                  type="text"
                  value={formData.causa}
                  onChange={(e) =>
                    setFormData({ ...formData, causa: e.target.value })
                  }
                  placeholder="Origen o motivo desencadenante..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Consecuencia
                </label>
                <input
                  type="text"
                  value={formData.consecuencia}
                  onChange={(e) =>
                    setFormData({ ...formData, consecuencia: e.target.value })
                  }
                  placeholder="Impacto o efecto resultante..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Factor (Externo / Interno)
                </label>
                <select
                  value={formData.factor}
                  onChange={(e) =>
                    setFormData({ ...formData, factor: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Interno">Interno</option>
                  <option value="Externo">Externo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Operacional">Operacional</option>
                  <option value="Tecnología">Tecnología</option>
                  <option value="Financiero">Financiero</option>
                  <option value="Legal">Legal</option>
                  <option value="Logística">Logística</option>
                  <option value="Estratégico">Estratégico</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: EVALUACIÓN INICIAL */}
          <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100 space-y-4">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              2. Bloque de Evaluación Inicial
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Probabilidad (1 a 5)
                </label>
                <select
                  value={formData.probability}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      probability: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  Impacto (1 a 5)
                </label>
                <select
                  value={formData.impact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      impact: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {IMPACT_LEVELS.map((imp) => (
                    <option key={imp.value} value={imp.value}>
                      {imp.value} - {imp.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-amber-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">
                Nivel de Riesgo Resultante:
              </span>
              <span
                className={`font-bold px-2.5 py-1 rounded-md border ${
                  getRiskSeverity(formData.probability * formData.impact).color
                }`}
              >
                {getRiskSeverity(formData.probability * formData.impact).label}{' '}
                (Score: {formData.probability * formData.impact})
              </span>
            </div>
          </div>

          {/* SECCIÓN 3: FECHA ANÁLISIS */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-600" />
              3. Fecha de Análisis
            </label>
            <input
              type="date"
              value={formData.fechaAnalisis}
              onChange={(e) =>
                setFormData({ ...formData, fechaAnalisis: e.target.value })
              }
              className="w-full sm:w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          {/* SECCIÓN 4: TRATAMIENTO */}
          <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100 space-y-4">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              4. Sección de Tratamiento
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Plan de Acción
                </label>
                <textarea
                  rows="2"
                  value={formData.planAccion}
                  onChange={(e) =>
                    setFormData({ ...formData, planAccion: e.target.value })
                  }
                  placeholder="Medidas, acciones correctivas o N/A"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Mitigación
                </label>
                <textarea
                  rows="2"
                  value={formData.mitigacion}
                  onChange={(e) =>
                    setFormData({ ...formData, mitigacion: e.target.value })
                  }
                  placeholder="Estrategia de control residual o N/A"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nueva Probabilidad
                </label>
                <select
                  value={formData.nuevaProbabilidad}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nuevaProbabilidad: e.target.value,
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
                  Nuevo Impacto
                </label>
                <select
                  value={formData.nuevoImpacto}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nuevoImpacto: e.target.value,
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Fecha de Tratamiento
                </label>
                <input
                  type="text"
                  value={formData.fechaTratamiento}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fechaTratamiento: e.target.value,
                    })
                  }
                  placeholder="YYYY-MM-DD o N/A"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
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

