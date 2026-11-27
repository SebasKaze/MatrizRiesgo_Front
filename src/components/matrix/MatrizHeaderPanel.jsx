import {
  Table2,
  PlusCircle,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Layers,
  Lock,
} from 'lucide-react';

export function MatrizHeaderPanel({
  isCreatingNew,
  identificador,
  setIdentificador,
  currentMatrizId,
  versionMatriz,
  isMatrizBloqueada = false,
  isSavingMatriz = false,
  isBlockingMatriz = false,
  onOpenBlockModal,
  onBack,
  onOpenCreateModal,
  saveFeedback,
  hasUnsavedChanges,
}) {
  const numericVersion = Number(versionMatriz) || 1;

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
                  : isMatrizBloqueada
                  ? `Consultar Matriz: ${identificador || `#${currentMatrizId}`}`
                  : `Editar Matriz: ${identificador || `#${currentMatrizId}`}`}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Identificación &bull; Evaluación &bull; Tratamiento
              </span>
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Layers className="w-3.5 h-3.5" />
                Versión v{numericVersion}
              </span>
              {isMatrizBloqueada && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <Lock className="w-3.5 h-3.5" />
                  Bloqueada (Solo Consulta)
                </span>
              )}
              {hasUnsavedChanges && !isMatrizBloqueada && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Cambios sin guardar
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {isMatrizBloqueada
                ? `Esta versión de la matriz (v${numericVersion}) se encuentra bloqueada y es únicamente de consulta. Puedes exportar la información a Excel.`
                : isCreatingNew
                ? 'Se han precargado los riesgos de los estándares seleccionados. Puedes agregar más riesgos manualmente antes de guardar la matriz.'
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
        </div>
      </div>

      {/* Panel de Configuración de la Matriz y Botón Agregar Riesgo */}
      <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 items-start">
        <div className="lg:col-span-2">
          <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
            Riesgos de la Matriz
          </label>
          <button
            type="button"
            onClick={onOpenCreateModal}
            disabled={isMatrizBloqueada}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none text-white text-sm font-semibold rounded-lg shadow-sm shadow-indigo-200 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <PlusCircle className="w-4 h-4" />
            Agregar Riesgo
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Identificador / Nombre de la Matriz *
          </label>
          <input
            type="text"
            value={identificador}
            disabled={isMatrizBloqueada}
            onChange={(e) => setIdentificador(e.target.value)}
            placeholder="Ej. Matriz de Riesgos ISO 27001 - 2026"
            className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Versión de la Matriz (v{numericVersion})
            </label>
            {isMatrizBloqueada && (
              <span className="text-[11px] font-bold text-rose-600">
                Solo consulta
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onOpenBlockModal}
            disabled={isMatrizBloqueada || isSavingMatriz || isBlockingMatriz}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none text-white text-sm font-semibold rounded-lg shadow-sm shadow-amber-200 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Lock className="w-4 h-4" />
            <span>Bloquear Matriz</span>
          </button>
          <p className="text-[11px] text-slate-500 mt-1 leading-tight">
            {isMatrizBloqueada
              ? `Versión v${numericVersion} bloqueada permanentemente para edición.`
              : `Bloquea y guarda la v${numericVersion}, creando una copia en v${numericVersion + 1}.`}
          </p>
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

