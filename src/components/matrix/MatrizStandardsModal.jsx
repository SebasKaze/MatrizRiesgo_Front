import { useState, useMemo } from 'react';
import {
  Layers,
  CheckSquare,
  Square,
  Search,
  Sparkles,
  AlertCircle,
  RefreshCw,
  X,
  ShieldAlert,
} from 'lucide-react';

export function MatrizStandardsModal({
  isOpen,
  onClose,
  onConfirmStandards,
  estandares = [],
  subestandares = [],
  allRisks = [],
  isLoadingStandards = false,
  onRefreshStandards,
}) {
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Calcular cuántos riesgos y subestándares están asociados a cada estándar
  const estandaresWithCounts = useMemo(() => {
    return estandares.map((est) => {
      const estCode = (est.codigo_estandar || '').trim();
      const estId = est.id;

      // Subestándares que pertenecen a este estándar
      const matchingSubs = subestandares.filter(
        (s) =>
          (s.codigo_estandar && s.codigo_estandar.trim() === estCode) ||
          (estId !== undefined &&
            estId !== null &&
            String(s.estandar_id) === String(estId))
      );

      const subIds = new Set(matchingSubs.map((s) => String(s.id)));
      const subCodes = new Set(
        matchingSubs
          .map((s) => (s.codigo_subestandar || '').trim())
          .filter(Boolean)
      );

      // Riesgos asociados directa o indirectamente (vía subestándar) al estándar
      const matchingRisks = (allRisks || []).filter((r) => {
        const rEstCode = (r.codigo_estandar || r.estandar || '').trim();
        const rSubCode = (r.codigo_subestandar || r.subestandar || '').trim();
        if (rEstCode && rEstCode === estCode) return true;
        if (
          estId !== undefined &&
          estId !== null &&
          r.estandar_id !== undefined &&
          r.estandar_id !== null &&
          String(r.estandar_id) === String(estId)
        ) {
          return true;
        }
        if (r.subestandar_id && subIds.has(String(r.subestandar_id))) {
          return true;
        }
        if (rSubCode && subCodes.has(rSubCode)) {
          return true;
        }
        return false;
      });

      return {
        ...est,
        codigo_estandar: estCode,
        subCount: matchingSubs.length,
        riskCount: matchingRisks.length,
      };
    });
  }, [estandares, subestandares, allRisks]);

  const filteredEstandares = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return estandaresWithCounts;
    return estandaresWithCounts.filter(
      (e) =>
        (e.codigo_estandar || '').toLowerCase().includes(term) ||
        (e.descripcion || '').toLowerCase().includes(term)
    );
  }, [estandaresWithCounts, searchTerm]);

  const toggleEstandar = (codigo) => {
    setErrorMsg('');
    setSelectedCodes((prev) =>
      prev.includes(codigo)
        ? prev.filter((item) => item !== codigo)
        : [...prev, codigo]
    );
  };

  const handleToggleAll = () => {
    setErrorMsg('');
    const visibleCodes = filteredEstandares.map((e) => e.codigo_estandar);
    const allVisibleSelected =
      visibleCodes.length > 0 &&
      visibleCodes.every((code) => selectedCodes.includes(code));

    if (allVisibleSelected) {
      setSelectedCodes((prev) =>
        prev.filter((code) => !visibleCodes.includes(code))
      );
    } else {
      setSelectedCodes((prev) =>
        Array.from(new Set([...prev, ...visibleCodes]))
      );
    }
  };

  const totalSelectedRisksCount = useMemo(() => {
    return estandaresWithCounts
      .filter((e) => selectedCodes.includes(e.codigo_estandar))
      .reduce((acc, curr) => acc + curr.riskCount, 0);
  }, [estandaresWithCounts, selectedCodes]);

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (selectedCodes.length === 0) {
      setErrorMsg(
        'Por favor selecciona al menos un estándar para precargar sus riesgos asociados.'
      );
      return;
    }

    const selectedObjects = estandaresWithCounts.filter((est) =>
      selectedCodes.includes(est.codigo_estandar)
    );

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onConfirmStandards(selectedObjects);
    } catch (err) {
      setErrorMsg(
        err.message ||
          'Ocurrió un error al precargar los riesgos de los estándares seleccionados.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8 max-h-[90vh] flex flex-col">
        {/* Encabezado */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Seleccionar Estándares para la Nueva Matriz
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Elige los estándares registrados en la base de datos que deseas
                agregar. Se precargarán automáticamente sus riesgos asociados.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Cerrar y crear matriz vacía"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de búsqueda y selección rápida */}
        <div className="pt-4 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar estándar por código o descripción..."
              className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onRefreshStandards && (
              <button
                type="button"
                onClick={onRefreshStandards}
                disabled={isLoadingStandards}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                title="Actualizar estándares desde la BD"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isLoadingStandards ? 'animate-spin' : ''
                  }`}
                />
                Actualizar
              </button>
            )}

            {filteredEstandares.length > 0 && (
              <button
                type="button"
                onClick={handleToggleAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                {filteredEstandares.every((e) =>
                  selectedCodes.includes(e.codigo_estandar)
                )
                  ? 'Deseleccionar todos'
                  : 'Seleccionar todos'}
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Lista de Estándares disponibles en la BD */}
        <form
          onSubmit={handleConfirm}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-80">
            {isLoadingStandards ? (
              <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                <p className="text-xs font-medium">
                  Consultando estándares en la base de datos...
                </p>
              </div>
            ) : filteredEstandares.length > 0 ? (
              filteredEstandares.map((est) => {
                const isSelected = selectedCodes.includes(est.codigo_estandar);
                return (
                  <div
                    key={est.id || est.codigo_estandar}
                    onClick={() => toggleEstandar(est.codigo_estandar)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-400 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-indigo-600 shrink-0">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900">
                            {est.codigo_estandar}
                          </span>
                          {est.id && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                              ID: {est.id}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {est.descripcion || 'Sin descripción registrada'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          est.riskCount > 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        <ShieldAlert className="w-3 h-3" />
                        {est.riskCount}{' '}
                        {est.riskCount === 1 ? 'riesgo' : 'riesgos'}
                      </span>
                      {est.subCount > 0 && (
                        <span className="text-[10px] text-slate-400">
                          {est.subCount}{' '}
                          {est.subCount === 1 ? 'subestándar' : 'subestándares'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 px-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  {estandares.length === 0
                    ? 'No hay estándares registrados en la base de datos.'
                    : 'No se encontraron estándares con ese criterio de búsqueda.'}
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {estandares.length === 0
                    ? 'Puedes continuar con una matriz en blanco y agregar riesgos manualmente, o registrar estándares desde Identificación y Evaluación.'
                    : 'Intenta con otro término de búsqueda.'}
                </p>
              </div>
            )}
          </div>

          {/* Resumen inferior y botones */}
          <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-600">
              Seleccionados:{' '}
              <strong className="text-indigo-700">
                {selectedCodes.length}
              </strong>{' '}
              {selectedCodes.length === 1 ? 'estándar' : 'estándares'} &bull;{' '}
              <strong className="text-emerald-700">
                {totalSelectedRisksCount}
              </strong>{' '}
              {totalSelectedRisksCount === 1
                ? 'riesgo por precargar'
                : 'riesgos por precargar'}
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Omitir (Matriz vacía)
              </button>

              <button
                type="submit"
                disabled={isSubmitting || selectedCodes.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Precargando riesgos...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Precargar Riesgos en la Matriz</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
