import { useState, useMemo } from 'react';
import {
  X,
  Layers,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

export function NewStandardModal({
  isOpen,
  onClose,
  estandares = [],
  subestandares = [],
  onAddEstandar,
  onAddSubestandar,
}) {
  // Formulario izquierdo: Nuevo Estándar
  const [codigoEstandar, setCodigoEstandar] = useState('');
  const [descripcionEstandar, setDescripcionEstandar] = useState('');
  const [isSavingEstandar, setIsSavingEstandar] = useState(false);
  const [estandarFeedback, setEstandarFeedback] = useState(null);

  // Formulario derecho (a un costado): Nuevo Subestándar asociado al Estándar
  const [selectedEstandarCode, setSelectedEstandarCode] = useState('');
  const [codigoSubestandar, setCodigoSubestandar] = useState('');
  const [descripcionSubestandar, setDescripcionSubestandar] = useState('');
  const [isSavingSubestandar, setIsSavingSubestandar] = useState(false);
  const [subestandarFeedback, setSubestandarFeedback] = useState(null);

  const selectedEstandarObj = useMemo(() => {
    return estandares.find((e) => e.codigo_estandar === selectedEstandarCode);
  }, [estandares, selectedEstandarCode]);

  const associatedSubestandares = useMemo(() => {
    if (!selectedEstandarCode) return [];
    return subestandares.filter(
      (s) =>
        s.codigo_estandar === selectedEstandarCode ||
        (selectedEstandarObj &&
          String(s.estandar_id) === String(selectedEstandarObj.id))
    );
  }, [subestandares, selectedEstandarCode, selectedEstandarObj]);

  if (!isOpen) return null;

  // Paso 1: Registrar Estándar
  const handleSubmitEstandar = async (e) => {
    e.preventDefault();
    setEstandarFeedback(null);
    setSubestandarFeedback(null);

    if (!codigoEstandar.trim() || !descripcionEstandar.trim()) {
      setEstandarFeedback({
        type: 'error',
        message: 'El código y la descripción del estándar son obligatorios.',
      });
      return;
    }

    setIsSavingEstandar(true);
    try {
      const created = await onAddEstandar({
        codigo_estandar: codigoEstandar.trim(),
        descripcion: descripcionEstandar.trim(),
      });

      const code = created?.codigo_estandar || codigoEstandar.trim();
      setSelectedEstandarCode(code);
      setCodigoEstandar('');
      setDescripcionEstandar('');

      setEstandarFeedback({
        type: 'success',
        message: `Estándar "${code}" registrado. Ahora puedes registrar sus subestándares en el formulario de un costado.`,
      });
    } catch (err) {
      setEstandarFeedback({
        type: 'error',
        message: err.message || 'No se pudo registrar el estándar.',
      });
    } finally {
      setIsSavingEstandar(false);
    }
  };

  // Paso 2 (a un costado): Registrar Subestándar asociado al Estándar
  const handleSubmitSubestandar = async (e) => {
    e.preventDefault();
    setSubestandarFeedback(null);

    if (!selectedEstandarCode) {
      setSubestandarFeedback({
        type: 'error',
        message: 'Primero registra o selecciona un estándar.',
      });
      return;
    }

    if (!codigoSubestandar.trim() || !descripcionSubestandar.trim()) {
      setSubestandarFeedback({
        type: 'error',
        message: 'El código y la descripción del subestándar son obligatorios.',
      });
      return;
    }

    setIsSavingSubestandar(true);
    try {
      await onAddSubestandar({
        estandar_id: selectedEstandarObj?.id ?? 1,
        codigo_estandar: selectedEstandarCode,
        codigo_subestandar: codigoSubestandar.trim(),
        descripcion: descripcionSubestandar.trim(),
      });

      const savedSubCode = codigoSubestandar.trim();
      setCodigoSubestandar('');
      setDescripcionSubestandar('');

      setSubestandarFeedback({
        type: 'success',
        message: `Subestándar "${savedSubCode}" asociado exitosamente al estándar "${selectedEstandarCode}".`,
      });
    } catch (err) {
      setSubestandarFeedback({
        type: 'error',
        message: err.message || 'No se pudo registrar el subestándar.',
      });
    } finally {
      setIsSavingSubestandar(false);
    }
  };

  const isSubestandarEnabled = Boolean(selectedEstandarCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Registrar Nuevo Estándar y Subestándar
              </h3>
              <p className="text-xs text-slate-500">
                Registra primero el Estándar a la izquierda y a un costado registra el Subestándar asociado.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grid de 2 columnas: Izquierda Estándar | A un costado Subestándar */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* COLUMNA IZQUIERDA: FORMULARIO DE ESTÁNDAR */}
          <div className="p-5 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <div>
                <h4 className="text-sm font-bold text-indigo-950">
                  Registrar Estándar
                </h4>
                <p className="text-[11px] text-slate-500">
                  Define el código y descripción del estándar general.
                </p>
              </div>
            </div>

            {estandarFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  estandarFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                {estandarFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{estandarFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmitEstandar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Código del Estándar *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. EST-01 o ISO-27001"
                  value={codigoEstandar}
                  onChange={(e) => setCodigoEstandar(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Descripción del Estándar *
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Descripción del estándar normativo u operativo..."
                  value={descripcionEstandar}
                  onChange={(e) => setDescripcionEstandar(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingEstandar}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingEstandar ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando Estándar...</span>
                  </>
                ) : (
                  <>
                    <span>Registrar Estándar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* COLUMNA DERECHA (A UN COSTADO): FORMULARIO DE SUBESTÁNDAR ASOCIADO */}
          <div
            className={`p-5 rounded-xl border space-y-4 ${
              isSubestandarEnabled
                ? 'bg-emerald-50/40 border-emerald-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${
                  isSubestandarEnabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                2
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Registrar Subestándar Asociado
                </h4>
                <p className="text-[11px] text-slate-500">
                  Se vincula directamente al estándar registrado.
                </p>
              </div>
            </div>

            {subestandarFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  subestandarFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                {subestandarFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{subestandarFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmitSubestandar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Estándar Asociado *
                </label>
                <select
                  required
                  value={selectedEstandarCode}
                  onChange={(e) => setSelectedEstandarCode(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">
                    {estandares.length > 0
                      ? '-- Selecciona un estándar o regístralo a la izquierda --'
                      : '-- Primero registra un estándar a la izquierda --'}
                  </option>
                  {estandares.map((est) => (
                    <option key={est.codigo_estandar} value={est.codigo_estandar}>
                      {est.codigo_estandar}
                      {est.descripcion ? ` — ${est.descripcion}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Código del Subestándar *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isSubestandarEnabled}
                  placeholder="Ej. SUB-01.1"
                  value={codigoSubestandar}
                  onChange={(e) => setCodigoSubestandar(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Descripción del Subestándar *
                </label>
                <textarea
                  rows="2"
                  required
                  disabled={!isSubestandarEnabled}
                  placeholder="Descripción del subestándar..."
                  value={descripcionSubestandar}
                  onChange={(e) => setDescripcionSubestandar(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={!isSubestandarEnabled || isSavingSubestandar}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingSubestandar ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando Subestándar...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Registrar Subestándar</span>
                  </>
                )}
              </button>
            </form>

            {/* Lista rápida de subestándares asociados al estándar actual */}
            {selectedEstandarCode && (
              <div className="pt-3 border-t border-emerald-200/60">
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Subestándares de {selectedEstandarCode} ({associatedSubestandares.length}):
                </p>
                {associatedSubestandares.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {associatedSubestandares.map((sub) => (
                      <span
                        key={`${sub.codigo_estandar}-${sub.codigo_subestandar}`}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-white border border-emerald-200 text-emerald-800"
                        title={sub.descripcion}
                      >
                        {sub.codigo_subestandar}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Aún no hay subestándares registrados para este estándar.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 mt-5 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

