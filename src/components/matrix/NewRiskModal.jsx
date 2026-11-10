import { useState, useMemo } from 'react';
import { X, AlertCircle, RefreshCw } from 'lucide-react';
import { useRiskContext } from '../../hooks/useRiskContext';
import { PROBABILITY_LEVELS, IMPACT_LEVELS } from '../../constants/riskConstants';
import { calculateRiskScore, getRiskSeverity } from '../../utils/riskCalculations';

const INITIAL_FORM_STATE = {
  estandar: '',
  subestandar: '',
  title: '',
  description: '',
  category: 'Operacional',
  causa: '',
  consecuencia: '',
  factor: 'Interno',
  probability: 3,
  impact: 3,
  responsible: '',
  status: 'Abierto',
  plan: '',
};

export function NewRiskModal({ isOpen, onClose, onAddRisk }) {
  const { estandares = [], subestandares = [] } = useRiskContext();
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Filtrar subestándares asociados al estándar seleccionado
  const availableSubestandares = useMemo(() => {
    if (!formData.estandar) return [];
    const selectedEstObj = estandares.find(
      (e) => e.codigo_estandar === formData.estandar
    );
    return subestandares.filter(
      (s) =>
        s.codigo_estandar === formData.estandar ||
        (selectedEstObj &&
          String(s.estandar_id) === String(selectedEstObj.id))
    );
  }, [formData.estandar, estandares, subestandares]);

  if (!isOpen) return null;

  const currentScore = calculateRiskScore(formData.probability, formData.impact);
  const currentSeverity = getRiskSeverity(currentScore);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.estandar || !formData.subestandar) {
      setErrorMessage('Por favor selecciona un Estándar y un Subestándar.');
      return;
    }

    if (!formData.title.trim()) {
      setErrorMessage('El nombre o título del riesgo es obligatorio.');
      return;
    }

    const matchedSub = availableSubestandares.find(
      (s) => s.codigo_subestandar === formData.subestandar
    );

    setIsSubmitting(true);
    try {
      await onAddRisk({
        ...formData,
        estandar: formData.estandar,
        subestandar: formData.subestandar,
        subestandar_id: matchedSub?.id ?? undefined,
        title: formData.title.trim(),
        riesgo: formData.title.trim(),
        description: formData.description.trim() || formData.title.trim(),
        descripcion: formData.description.trim() || formData.title.trim(),
        causa: formData.causa.trim() || 'Causa bajo evaluación técnica',
        consecuencia:
          formData.consecuencia.trim() || 'Impacto potencial en la continuidad operativa',
        consec:
          formData.consecuencia.trim() || 'Impacto potencial en la continuidad operativa',
        probability: Number(formData.probability),
        prob: Number(formData.probability),
        impact: Number(formData.impact),
        impacto: Number(formData.impact),
        nivel: currentSeverity.label,
      });

      setFormData(INITIAL_FORM_STATE);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'No se pudo registrar el riesgo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 my-8 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Registrar Nuevo Riesgo</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Selectores de Estándar y Subestándar */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Estándar *
              </label>
              <select
                required
                value={formData.estandar}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estandar: e.target.value,
                    subestandar: '',
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Seleccionar Estándar --</option>
                {estandares.map((est) => (
                  <option key={est.codigo_estandar} value={est.codigo_estandar}>
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
                disabled={!formData.estandar}
                value={formData.subestandar}
                onChange={(e) =>
                  setFormData({ ...formData, subestandar: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">
                  {formData.estandar
                    ? '-- Seleccionar Subestándar --'
                    : '-- Elige primero un estándar --'}
                </option>
                {availableSubestandares.map((sub) => (
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
              Nombre o Título del Riesgo *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Falla en el suministro eléctrico"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Descripción Detallada del Riesgo
            </label>
            <textarea
              rows="2"
              placeholder="Detalle o contexto del evento de riesgo..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Causa Raíz
              </label>
              <input
                type="text"
                placeholder="Origen o factor desencadenante..."
                value={formData.causa}
                onChange={(e) => setFormData({ ...formData, causa: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Consecuencia / Efecto
              </label>
              <input
                type="text"
                placeholder="Impacto directo o daño resultante..."
                value={formData.consecuencia}
                onChange={(e) => setFormData({ ...formData, consecuencia: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Factor
              </label>
              <select
                value={formData.factor}
                onChange={(e) => setFormData({ ...formData, factor: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Operacional">Operacional</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Financiero">Financiero</option>
                <option value="Legal">Legal</option>
                <option value="Logística">Logística</option>
                <option value="Estratégico">Estratégico</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Responsable
              </label>
              <input
                type="text"
                placeholder="Ej. Mantenimiento"
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Probabilidad (1 a 5)
              </label>
              <select
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
                onChange={(e) => setFormData({ ...formData, impact: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {IMPACT_LEVELS.map((imp) => (
                  <option key={imp.value} value={imp.value}>
                    {imp.value} - {imp.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Severity Preview */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">Severidad Resultante:</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${currentSeverity.color}`}>
              {currentSeverity.label} (Score: {currentScore})
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Plan de Mitigación / Acción
            </label>
            <textarea
              rows="2"
              placeholder="Medidas preventivas o de contingencia..."
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Riesgo</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
