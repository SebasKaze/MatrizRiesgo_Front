import { Search, Filter, ArrowUpDown } from 'lucide-react';

export function RiesgosFilterBar({
  searchTerm,
  setSearchTerm,
  selectedEstandar,
  setSelectedEstandar,
  availableStandards = [],
  sortBy,
  setSortBy,
  selectedFactor,
  setSelectedFactor,
  selectedSeverity,
  setSelectedSeverity,
  onResetFilters,
}) {
  const hasActiveFilters =
    Boolean(searchTerm) ||
    selectedEstandar !== 'Todos' ||
    selectedFactor !== 'Todos' ||
    selectedSeverity !== 'Todos' ||
    sortBy !== 'none';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Buscador + Filtro por Estándar a un costado */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por riesgo, causa, consecuencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filtro por Estándar a un costado de la barra de búsqueda */}
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <label
              htmlFor="filtro-estandar-select"
              className="text-xs font-semibold text-slate-500 whitespace-nowrap"
            >
              Estándar:
            </label>
            <select
              id="filtro-estandar-select"
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
        </div>

        {/* Control de Ordenamiento por Estándar y Subestándar */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-4 h-4 text-indigo-600 shrink-0" />
          <label
            htmlFor="ordenar-riesgos-select"
            className="text-xs font-semibold text-slate-500 whitespace-nowrap"
          >
            Ordenar por:
          </label>
          <select
            id="ordenar-riesgos-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="none">Orden predeterminado</option>
            <option value="ambos-asc">
              Estándar y Subestándar (Ascendente ↑)
            </option>
            <option value="ambos-desc">
              Estándar y Subestándar (Descendente ↓)
            </option>
            <option value="estandar-asc">Estándar (Ascendente ↑)</option>
            <option value="estandar-desc">Estándar (Descendente ↓)</option>
            <option value="subestandar-asc">Subestándar (Ascendente ↑)</option>
            <option value="subestandar-desc">Subestándar (Descendente ↓)</option>
          </select>
        </div>
      </div>

      {/* Segunda fila de filtros rápidos: Factor y Nivel de Severidad */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro Factor */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Factor:</span>
            {['Todos', 'Interno', 'Externo'].map((f) => (
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
                {f}
              </button>
            ))}
          </div>

          {/* Filtro Severidad */}
          <div className="flex items-center gap-1.5 sm:ml-2">
            <span className="font-semibold text-slate-500">Nivel:</span>
            {['Todos', 'Crítico', 'Alto', 'Medio', 'Bajo'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSeverity(s)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedSeverity === s
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline cursor-pointer"
          >
            Restablecer filtros y orden
          </button>
        )}
      </div>
    </div>
  );
}
