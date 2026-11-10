import { Search } from 'lucide-react';

export function MatrizFilterBar({
  searchTerm,
  setSearchTerm,
  selectedFactor,
  setSelectedFactor,
  treatmentFilter,
  setTreatmentFilter,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por riesgo, causa, consecuencia, plan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
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

