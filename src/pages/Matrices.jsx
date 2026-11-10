import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Badge } from '../components/ui/Badge';
import {
  FileSpreadsheet,
  PlusCircle,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  Calendar,
  Building2,
  Layers,
  AlertCircle,
  ShieldCheck,
  Filter,
} from 'lucide-react';

const MATRICES_STORAGE_KEY = 'matrices_empresa_storage';
export const ACTIVE_MATRIZ_STORAGE_KEY = 'matriz_activa_edicion';

// Datos iniciales de respaldo por si aún no responde el backend
const getInitialLocalMatrices = (empresaId) => [
  {
    id: 1,
    empresa_id: empresaId || 1,
    nombre_empresa: `Empresa #${empresaId || 1}`,
    identificador: 'Matriz Operativa General 2026',
    version_matriz: 1,
    fecha_creacion: '2026-10-15T10:00:00.000Z',
    fecha_actualizacion: '2026-10-21T14:30:00.000Z',
  },
];

export function Matrices({ onCreateMatriz, onEditMatriz }) {
  const { user } = useAuth();
  const empresaId = user?.empresa_id ?? 1;

  // Determinar si el usuario autenticado es de tipo "admin"
  const isAdmin = useMemo(() => {
    const rolValue = String(user?.rol || user?.roleCode || user?.role || '')
      .trim()
      .toLowerCase();
    return rolValue === 'admin' || rolValue === 'administrador';
  }, [user]);

  const [matrices, setMatrices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpresaFilter, setSelectedEmpresaFilter] = useState('Todas');
  const [errorMessage, setErrorMessage] = useState('');

  // Cargar matrices:
  // - Admin: obtiene todas las matrices de todas las empresas (`GET /api/matrices`)
  // - Empresa: obtiene únicamente las matrices asociadas a su empresa (`GET /api/matrices?empresa_id=...`)
  const fetchMatrices = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const endpoint = isAdmin
        ? '/matrices'
        : `/matrices?empresa_id=${empresaId}`;

      const response = await api.get(endpoint);
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.matrices)
        ? response.matrices
        : null;

      if (list) {
        const visibleMatrices = isAdmin
          ? list
          : list.filter(
              (m) => Number(m.empresa_id) === Number(empresaId)
            );

        setMatrices(visibleMatrices);
        localStorage.setItem(
          MATRICES_STORAGE_KEY,
          JSON.stringify(visibleMatrices)
        );
        return;
      }
    } catch {
      // Fallback a localStorage si el backend no está disponible
    } finally {
      setIsLoading(false);
    }

    try {
      const stored = localStorage.getItem(MATRICES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const visibleLocal = isAdmin
            ? parsed
            : parsed.filter(
                (m) => Number(m.empresa_id) === Number(empresaId)
              );
          setMatrices(visibleLocal);
          return;
        }
      }
      const initial = getInitialLocalMatrices(empresaId);
      setMatrices(initial);
      localStorage.setItem(MATRICES_STORAGE_KEY, JSON.stringify(initial));
    } catch {
      setMatrices([]);
    }
  }, [empresaId, isAdmin]);

  useEffect(() => {
    fetchMatrices();
  }, [fetchMatrices]);

  // Lista única de empresas presentes en las matrices (para el filtro de Admin)
  const empresasOptions = useMemo(() => {
    const map = new Map();
    matrices.forEach((m) => {
      const empId = m.empresa_id ?? 1;
      const empName =
        m.nombre_empresa ||
        m.empresa_nombre ||
        m.nombre_razon_social ||
        `Empresa #${empId}`;
      if (!map.has(String(empId))) {
        map.set(String(empId), { id: String(empId), label: empName });
      }
    });
    return Array.from(map.values());
  }, [matrices]);

  // Botón superior: Crear nueva matriz y redirigir a MatrizVisualizacion
  const handleCreateNew = () => {
    try {
      localStorage.removeItem(ACTIVE_MATRIZ_STORAGE_KEY);
    } catch {
      // ignore
    }
    if (onCreateMatriz) {
      onCreateMatriz();
    }
  };

  // Botón Editar: Guardar referencia de la matriz seleccionada (incluyendo su empresa_id) y redirigir a MatrizVisualizacion
  const handleEdit = (matriz) => {
    try {
      localStorage.setItem(ACTIVE_MATRIZ_STORAGE_KEY, JSON.stringify(matriz));
    } catch {
      // ignore
    }
    if (onEditMatriz) {
      onEditMatriz(matriz);
    }
  };

  // Botón Eliminar: Eliminar matriz del backend y actualizar listado
  const handleDelete = async (matriz) => {
    const empLabel =
      matriz.nombre_empresa ||
      matriz.empresa_nombre ||
      matriz.nombre_razon_social ||
      `Empresa #${matriz.empresa_id || empresaId}`;

    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar la matriz "${matriz.identificador}" (Versión ${matriz.version_matriz} - ${empLabel})?`
    );
    if (!confirmed) return;

    setErrorMessage('');
    try {
      await api.delete(`/matrices/${matriz.id}`);
    } catch (error) {
      if (error.status && error.status !== 404) {
        setErrorMessage(
          error.message || 'No se pudo eliminar la matriz en el servidor.'
        );
        return;
      }
    }

    setMatrices((prev) => {
      const updated = prev.filter((item) => item.id !== matriz.id);
      try {
        localStorage.setItem(MATRICES_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Filtrado por buscador y por empresa (en caso de Admin)
  const filteredMatrices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return matrices.filter((m) => {
      // Seguridad adicional en cliente: usuarios tipo "empresa" solo ven las de su empresa_id
      if (!isAdmin && Number(m.empresa_id) !== Number(empresaId)) {
        return false;
      }

      // Filtro por empresa para el usuario Admin
      if (
        isAdmin &&
        selectedEmpresaFilter !== 'Todas' &&
        String(m.empresa_id) !== String(selectedEmpresaFilter)
      ) {
        return false;
      }

      if (!term) return true;

      const empName = (
        m.nombre_empresa ||
        m.empresa_nombre ||
        m.nombre_razon_social ||
        `Empresa #${m.empresa_id || ''}`
      ).toLowerCase();

      return (
        (m.identificador || '').toLowerCase().includes(term) ||
        String(m.id || '').toLowerCase().includes(term) ||
        String(m.version_matriz || '').includes(term) ||
        empName.includes(term)
      );
    });
  }, [matrices, searchTerm, isAdmin, empresaId, selectedEmpresaFilter]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const getEmpresaDisplayName = (matriz) => {
    return (
      matriz.nombre_empresa ||
      matriz.empresa_nombre ||
      matriz.nombre_razon_social ||
      `Empresa #${matriz.empresa_id || empresaId}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header con botón superior para crear nueva matriz */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">
                  Matrices de Riesgo
                </h1>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1.5 text-xs px-3 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    Modo Administrador &bull; Todas las Empresas
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Building2 className="w-3.5 h-3.5" />
                    Empresa #{empresaId}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {isAdmin
                  ? 'Visualización global de todas las matrices registradas por las empresas. Puedes consultar, editar o eliminar cualquier matriz.'
                  : 'Listado de las matrices de riesgo asociadas a tu empresa. Crea una nueva matriz o selecciona una existente para editar su contenido.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={fetchMatrices}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              title="Actualizar listado de matrices"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              />
              Actualizar
            </button>

            <button
              type="button"
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Nueva Matriz
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Barra de búsqueda y filtro por empresa para Admin */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={
                isAdmin
                  ? 'Buscar por identificador, empresa, ID o versión...'
                  : 'Buscar matriz por identificador, ID o versión...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedEmpresaFilter}
                onChange={(e) => setSelectedEmpresaFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Todas">Todas las empresas</option>
                {empresasOptions.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.label} (ID: {emp.id})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500">
          Total mostradas:{' '}
          <strong className="text-slate-800">{filteredMatrices.length}</strong>
        </div>
      </div>

      {/* Tabla de Matrices */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-20 text-center border-r border-slate-200">
                  ID
                </th>
                <th className="py-3.5 px-4 min-w-[240px] border-r border-slate-200">
                  Identificador de la Matriz
                </th>
                <th className="py-3.5 px-4 min-w-[180px] border-r border-slate-200">
                  Empresa
                </th>
                <th className="py-3.5 px-4 w-28 text-center border-r border-slate-200">
                  Versión
                </th>
                <th className="py-3.5 px-4 w-40 text-center border-r border-slate-200">
                  Fecha de Creación
                </th>
                <th className="py-3.5 px-4 w-40 text-center border-r border-slate-200">
                  Última Actualización
                </th>
                <th className="py-3.5 px-4 w-48 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredMatrices.length > 0 ? (
                filteredMatrices.map((matriz) => (
                  <tr
                    key={matriz.id}
                    className="hover:bg-slate-50/90 transition-colors"
                  >
                    {/* ID */}
                    <td className="py-4 px-4 text-center border-r border-slate-100 font-mono text-slate-500 font-semibold">
                      #{matriz.id}
                    </td>

                    {/* Identificador */}
                    <td className="py-4 px-4 border-r border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {matriz.identificador}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Empresa */}
                    <td className="py-4 px-4 border-r border-slate-100">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-xs">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{getEmpresaDisplayName(matriz)}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          (ID: {matriz.empresa_id || empresaId})
                        </span>
                      </div>
                    </td>

                    {/* Versión */}
                    <td className="py-4 px-4 text-center border-r border-slate-100">
                      <Badge
                        variant="low"
                        className="inline-flex items-center gap-1"
                      >
                        <Layers className="w-3 h-3" />
                        v{matriz.version_matriz ?? 1}
                      </Badge>
                    </td>

                    {/* Fecha Creación */}
                    <td className="py-4 px-4 text-center border-r border-slate-100 text-slate-600">
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(matriz.fecha_creacion)}
                      </span>
                    </td>

                    {/* Fecha Actualización */}
                    <td className="py-4 px-4 text-center border-r border-slate-100 text-slate-600">
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(matriz.fecha_actualizacion)}
                      </span>
                    </td>

                    {/* Botones de Acción: Editar y Eliminar */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(matriz)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors cursor-pointer"
                          title="Editar matriz"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(matriz)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs transition-colors cursor-pointer"
                          title="Eliminar matriz"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-slate-500 bg-white"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileSpreadsheet className="w-8 h-8 text-slate-300" />
                      {matrices.length === 0 ? (
                        <>
                          <p className="font-medium text-sm text-slate-700">
                            {isAdmin
                              ? 'No hay matrices registradas en el sistema.'
                              : 'No hay matrices registradas para tu empresa.'}
                          </p>
                          <p className="text-xs text-slate-400">
                            Haz clic en &ldquo;Nueva Matriz&rdquo; para crear la
                            primera matriz de riesgos.
                          </p>
                          <button
                            type="button"
                            onClick={handleCreateNew}
                            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            Nueva Matriz
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-sm">
                            No se encontraron matrices que coincidan con los
                            filtros aplicados.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchTerm('');
                              setSelectedEmpresaFilter('Todas');
                            }}
                            className="text-xs text-indigo-600 font-semibold hover:underline mt-1"
                          >
                            Limpiar filtros
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
