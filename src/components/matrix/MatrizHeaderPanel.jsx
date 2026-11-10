import {
  Table2,
  PlusCircle,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export function MatrizHeaderPanel({
  isCreatingNew,
  identificador,
  setIdentificador,
  currentMatrizId,
  versionMatriz,
  setVersionMatriz,
  onBack,
  onOpenCreateModal,
  selectedCatalogRiskId,
  onSelectCatalogRisk,
  allRisks,
  risks,
  saveFeedback,
  hasUnsavedChanges,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
            <Table2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">
                {isCreatingNew
                  ? 'Crear Nueva Matriz de Riesgos'
                  : `Editar Matriz: ${identificador || `#${currentMatrizId}`}`}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Identificación &bull; Evaluación &bull; Tratamiento
              </span>
              {hasUnsavedChanges && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Cambios sin guardar
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {isCreatingNew
                ? 'Selecciona riesgos del catálogo para cargarlos o agrega nuevos riesgos personalizados a la matriz antes de guardarla.'
                : 'Visualización y modificación de la Matriz de Riesgo. Los cambios hechos aquí existen dentro de la matriz hasta que presiones Guardar Matriz.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Regresar a Matrices
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Agregar Riesgo
          </button>
        </div>
      </div>

      {/* Panel de Configuración de la Matriz y Selector de Riesgos */}
      <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/70">
        <div className="lg:col-span-2">
          <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
            Seleccionar Riesgo para Cargar en la Matriz
          </label>
          <select
            value={selectedCatalogRiskId}
            onChange={(e) => onSelectCatalogRisk(e.target.value)}
            className="w-full px-3.5 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
          >
            <option value="">
              -- Selecciona un riesgo registrado para agregarlo --
            </option>
            {(allRisks || []).map((r) => {
              const rEst = r.codigo_estandar || r.estandar || 'N/A';
              const rSub = r.codigo_subestandar || r.subestandar || 'N/A';
              const rTitle = r.title || r.riesgo || 'Sin título';
              const alreadyInMatrix = risks.some(
                (item) => String(item.id) === String(r.id)
              );
              return (
                <option key={r.id} value={r.id} disabled={alreadyInMatrix}>
                  [{rEst} / {rSub}] {rTitle}
                  {alreadyInMatrix ? ' (Ya cargado)' : ''}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Identificador / Nombre de la Matriz *
          </label>
          <input
            type="text"
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            placeholder="Ej. Matriz de Riesgos ISO 27001 - 2026"
            className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Versión de la Matriz
          </label>
          <input
            type="number"
            min="1"
            value={versionMatriz}
            onChange={(e) => setVersionMatriz(Number(e.target.value) || 1)}
            className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Notificación de resultado al guardar o exportar la matriz */}
      {saveFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            saveFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {saveFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{saveFeedback.message}</span>
          </div>
          {saveFeedback.type === 'success' && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shrink-0 transition-colors cursor-pointer"
            >
              Ver en Matrices
            </button>
          )}
        </div>
      )}
    </div>
  );
}

