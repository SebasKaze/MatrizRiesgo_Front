import {
  Table2,
  RefreshCw,
  Layers,
  PlusCircle,
  BookOpen,
} from 'lucide-react';

export function RiesgosHeaderNav({
  isAdmin,
  isLoading,
  onRefresh,
  onOpenStandardModal,
  onOpenCreateRiskModal,
  activeSection,
  onSelectSection,
  counts = { riesgos: 0, estandares: 0, referencias: 0 },
}) {
  const navigationSections = [
    {
      id: 'riesgos',
      label: 'Riesgos',
      icon: Table2,
      count: counts.riesgos,
    },
    {
      id: 'estandar_subestandar',
      label: 'Estándar y subestándar',
      icon: Layers,
      count: counts.estandares,
    },
    {
      id: 'referencias_noticias',
      label: 'Referencias y Noticias',
      icon: BookOpen,
      count: counts.referencias,
    },
  ];

  return (
    <>
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

        {/* Botones de acción centrados */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-nowrap items-center justify-center gap-3 overflow-x-auto">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer shrink-0"
            title="Recargar datos desde el servidor"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Actualizar
          </button>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={onOpenStandardModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm font-semibold rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <Layers className="w-4 h-4" />
                Nuevo Estándar
              </button>

              <button
                type="button"
                onClick={onOpenCreateRiskModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 transition-colors cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                Nuevo Riesgo
              </button>
            </>
          )}
        </div>
      </div>

      {/* Navegación Superior de la Visualización (3 Secciones) */}
      <nav
        aria-label="Secciones de visualización de riesgos"
        className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {navigationSections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => onSelectSection(sec.id)}
                className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-indigo-600'
                  }`}
                />
                <span>{sec.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {sec.count}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
