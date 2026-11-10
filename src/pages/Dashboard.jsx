import { useState, useEffect, useCallback } from 'react';
import { useRiskContext } from '../hooks/useRiskContext';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { ACTIVE_MATRIZ_STORAGE_KEY } from './Matrices';
import { RiskHeatmap } from '../components/matrix/RiskHeatmap';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Table2,
  Sparkles,
  Layers,
  Calendar,
  ArrowRight,
  PlusCircle,
  Building2,
  Pencil,
  RefreshCw,
} from 'lucide-react';

const MATRICES_STORAGE_KEY = 'matrices_empresa_storage';

export function Dashboard({
  viewMode = 'dashboard',
  onNavigate,
  onEditMatriz,
  onCreateMatriz,
}) {
  const { allRisks, stats } = useRiskContext();
  const { user } = useAuth();
  const empresaId = user?.empresa_id ?? 1;

  const isAdmin =
    String(user?.rol || user?.roleCode || user?.role || '')
      .trim()
      .toLowerCase() === 'admin' ||
    String(user?.rol || user?.roleCode || user?.role || '')
      .trim()
      .toLowerCase() === 'administrador';

  const [matrices, setMatrices] = useState([]);
  const [isLoadingMatrices, setIsLoadingMatrices] = useState(false);

  const fetchMatricesSummary = useCallback(async () => {
    setIsLoadingMatrices(true);
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
        const filtered = isAdmin
          ? list
          : list.filter((m) => Number(m.empresa_id) === Number(empresaId));
        setMatrices(filtered);
        localStorage.setItem(MATRICES_STORAGE_KEY, JSON.stringify(filtered));
        return;
      }
    } catch {
      // Fallback a almacenamiento local si el servidor no responde
    } finally {
      setIsLoadingMatrices(false);
    }

    try {
      const stored = localStorage.getItem(MATRICES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setMatrices(
            isAdmin
              ? parsed
              : parsed.filter(
                  (m) => Number(m.empresa_id) === Number(empresaId)
                )
          );
        }
      }
    } catch {
      setMatrices([]);
    }
  }, [empresaId, isAdmin]);

  useEffect(() => {
    fetchMatricesSummary();
  }, [fetchMatricesSummary]);

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

  const handleOpenMatriz = (matriz) => {
    try {
      localStorage.setItem(ACTIVE_MATRIZ_STORAGE_KEY, JSON.stringify(matriz));
    } catch {
      // ignore
    }
    if (onEditMatriz) {
      onEditMatriz(matriz);
    }
  };

  // Si está en modo "Matriz de Calor 5x5" desde el menú lateral
  if (viewMode === 'matrix') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 border-l-4 border-l-slate-400">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Total Riesgos
              </span>
              <ShieldAlert className="w-5 h-5 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {stats.total}
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-rose-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-600 uppercase">
                Críticos
              </span>
              <AlertCircle className="w-5 h-5 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-rose-600">
              {stats.critical}
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-orange-600 uppercase">
                Altos
              </span>
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-orange-600">
              {stats.high}
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-600 uppercase">
                Medios
              </span>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-600">
              {stats.medium}
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 uppercase">
                Bajos
              </span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-600">
              {stats.low}
            </div>
          </Card>
        </div>

        <RiskHeatmap risks={allRisks} />
      </div>
    );
  }

  const latestMatriz = matrices.length > 0 ? matrices[0] : null;

  return (
    <div className="space-y-6">
      {/* 1. CONTEXTO DE LA APLICACIÓN Y CÓMO FUNCIONA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">
                  Sistema de Gestión de Matriz de Riesgos
                </h1>
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Building2 className="w-3.5 h-3.5" />
                  Empresa #{empresaId}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1.5 max-w-3xl leading-relaxed">
                Esta plataforma permite a tu organización identificar, analizar,
                evaluar y dar tratamiento a los riesgos operativos y normativos.
                A partir de un catálogo de estándares y subestándares, cada
                empresa construye y administra sus propias matrices de riesgo y
                planes de mitigación.
              </p>
            </div>
          </div>

          {onCreateMatriz && (
            <button
              type="button"
              onClick={onCreateMatriz}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 transition-colors cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              Crear Nueva Matriz
            </button>
          )}
        </div>

        {/* Cómo funciona: 3 pasos */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            ¿Cómo funciona la aplicación?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Table2 className="w-4 h-4 text-indigo-600" />
                    Catálogo de Riesgos Base
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Consulta en <strong>Identificación y Evaluación</strong> los
                  riesgos sugeridos clasificados por Estándar y Subestándar, con
                  su causa, consecuencia y severidad inherente.
                </p>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('visualizacion')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                >
                  Ir al catálogo de riesgos <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-600 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                    Generación por Estándar
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Al crear una matriz, selecciona un <strong>Estándar</strong>{' '}
                  para precargar automáticamente sus riesgos asociados y agrega o
                  adapta registros exclusivos para tu organización.
                </p>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('matrices')}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  Gestionar matrices <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Tratamiento y Resguardo
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Establece planes de acción, estrategias de mitigación y evalúa
                  el nuevo nivel de riesgo residual, guardando cada versión de
                  forma segura en la base de datos.
                </p>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('matrix')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  Ver Matriz de Calor 5x5 <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. BREVE RESUMEN DE LAS MATRICES DE LA EMPRESA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Matrices de la Empresa
            </span>
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {matrices.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Asociadas a Empresa #{empresaId}
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Última Matriz Actualizada
            </span>
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-2 text-base font-bold text-slate-900 truncate">
            {latestMatriz ? latestMatriz.identificador : 'Sin matrices aún'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {latestMatriz
              ? `Actualizada: ${formatDate(latestMatriz.fecha_actualizacion)}`
              : 'Crea tu primera matriz de riesgos'}
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Riesgos en Catálogo Base
            </span>
            <Table2 className="w-5 h-5 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {stats.total}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats.critical} críticos &bull; {stats.high} altos &bull;{' '}
            {stats.medium} medios
          </p>
        </Card>
      </div>

      {/* Tabla Resumen de Matrices Recientes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Resumen de Matrices Registradas
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Matrices de riesgo activas pertenecientes a tu empresa.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchMatricesSummary}
              disabled={isLoadingMatrices}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isLoadingMatrices ? 'animate-spin' : ''
                }`}
              />
              Actualizar
            </button>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('matrices')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Ver todas las matrices
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {matrices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-20 text-center">ID</th>
                  <th className="py-3 px-4">Identificador</th>
                  <th className="py-3 px-4 w-28 text-center">Versión</th>
                  <th className="py-3 px-4 w-40 text-center">Creación</th>
                  <th className="py-3 px-4 w-40 text-center">Actualización</th>
                  <th className="py-3 px-4 w-32 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matrices.slice(0, 5).map((matriz) => (
                  <tr
                    key={matriz.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500 font-semibold">
                      #{matriz.id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {matriz.identificador}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant="low"
                        className="inline-flex items-center gap-1"
                      >
                        <Layers className="w-3 h-3" />v
                        {matriz.version_matriz ?? 1}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-500">
                      {formatDate(matriz.fecha_creacion)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-500">
                      {formatDate(matriz.fecha_actualizacion)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenMatriz(matriz)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">
              Aún no hay matrices registradas para tu empresa.
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Comienza creando una matriz a partir de un estándar del catálogo.
            </p>
            {onCreateMatriz && (
              <button
                type="button"
                onClick={onCreateMatriz}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Crear Primera Matriz
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
