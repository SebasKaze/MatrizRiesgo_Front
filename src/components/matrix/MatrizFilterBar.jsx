import { Search, Filter } from 'lucide-react';

export function MatrizFilterBar({
  searchTerm,
  setSearchTerm,
  selectedEstandar = 'Todos',
  setSelectedEstandar,
  availableStandards = [],
  selectedFactor,
  setSelectedFactor,
  treatmentFilter,
  setTreatmentFilter,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por numeral, proceso, riesgo, controles, responsable..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filtro por Estándar a un costado de la barra de búsqueda */}
        {setSelectedEstandar && (
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <label
              htmlFor="matriz-filtro-estandar"
              className="text-xs font-semibold text-slate-500 whitespace-nowrap"
            >
              Estándar:
            </label>
            <select
              id="matriz-filtro-estandar"
              value={selectedEstandar}
              onChange={(e) => setSelectedEstandar(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[180px]"
            >
              <option value="Todos">Todos los estándares</option>
              {availableStandards.map((est) => (
                <option key={est.codigo} value={est.codigo}>
                  {est.codigo}
                  {est.descripcion
                    ? ` — ${est.descripcion.slice(0, 35)}${
                        est.descripcion.length > 35 ? '...' : ''
                      }`
                    : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        {/* Filtro Contexto */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-500">Contexto:</span>
          {['Todos', 'Interno', 'Externo', 'Contexto interno / Externo'].map(
            (f) => (
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
                {f === 'Contexto interno / Externo' ? 'Interno / Externo' : f}
              </button>
            )
          )}
        </div>

        {/* Filtro Tratamiento */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-500">Tratamiento:</span>
          {['Todos', 'Con Tratamiento', 'Sin Tratamiento'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTreatmentFilter(t)}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                treatmentFilter === t
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
