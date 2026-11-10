import {
  Table2,
  PlusCircle,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Layers,
  Plus,
  Minus,
} from 'lucide-react';

export function MatrizHeaderPanel({
  isCreatingNew,
  identificador,
  setIdentificador,
  currentMatrizId,
  versionMatriz,
  minVersionMatriz = 1,
  setVersionMatriz,
  onBack,
  onOpenCreateModal,
  saveFeedback,
  hasUnsavedChanges,
}) {
  const numericVersion = Number(versionMatriz) || minVersionMatriz;
  const numericMinVersion = Number(minVersionMatriz) || 1;
  const isCreatingNewVersion =
    !isCreatingNew && numericVersion > numericMinVersion;

  const handleDecrementVersion = () => {
    if (numericVersion > numericMinVersion) {
      setVersionMatriz(numericVersion - 1);
    }
  };

  const handleIncrementVersion = () => {
    setVersionMatriz(numericVersion + 1);
  };

  const handleInputVersionChange = (e) => {
    const rawValue = e.target.value;
    if (rawValue === '') {
      setVersionMatriz(numericMinVersion);
      return;
    }
    const parsed = parseInt(rawValue, 10);
    if (isNaN(parsed) || parsed < numericMinVersion) {
      setVersionMatriz(numericMinVersion);
      return;
    }
    setVersionMatriz(parsed);
  };

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
              {isCreatingNewVersion && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Layers className="w-3.5 h-3.5" />
                  Nueva versión v{numericVersion} (conservará v{numericMinVersion})
                </span>
              )}
              {hasUnsavedChanges && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Cambios sin guardar
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {isCreatingNew
                ? 'Se han precargado los riesgos de los estándares seleccionados. Puedes agregar más riesgos manualmente antes de guardar la matriz.'
                : isCreatingNewVersion
                ? `Al guardar con la versión ${numericVersion}, se creará un nuevo registro de matriz conservando intacta la versión ${numericMinVersion}.`
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-indigo-200 transition-colors cursor-pointer"
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
            onChange={(e) => setIdentificador(e.target.value)}
            placeholder="Ej. Matriz de Riesgos ISO 27001 - 2026"
            className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Versión de la Matriz
            </label>
            {!isCreatingNew && (
              <span className="text-[11px] font-semibold text-slate-500">
                Mín. v{numericMinVersion}
              </span>
            )}
          </div>
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleDecrementVersion}
              disabled={numericVersion <= numericMinVersion}
              title={
                numericVersion <= numericMinVersion
                  ? `No es posible reducir la versión por debajo de v${numericMinVersion}. Selecciona una versión anterior desde la vista de Matrices.`
                  : 'Disminuir versión'
              }
              className="px-3 py-2 border border-r-0 border-slate-200 rounded-l-lg bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-300 text-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              min={numericMinVersion}
              step={1}
              value={numericVersion}
              onChange={handleInputVersionChange}
              onKeyDown={(e) => {
                if (
                  e.key === 'ArrowDown' &&
                  numericVersion <= numericMinVersion
                ) {
                  e.preventDefault();
                }
              }}
              className="w-full px-3 py-2 border-y border-slate-200 text-center font-bold text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleIncrementVersion}
              title="Incrementar versión para generar un nuevo registro de matriz"
              className="px-3 py-2 border border-l-0 border-slate-200 rounded-r-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {!isCreatingNew && (
            <p className="text-[11px] text-slate-500 mt-1 leading-tight">
              {isCreatingNewVersion
                ? `Se guardará como nueva Matriz v${numericVersion} y se conservará v${numericMinVersion}.`
                : `Versión base v${numericMinVersion}. Para editar una versión menor, selecciónala en Matrices.`}
            </p>
          )}
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

