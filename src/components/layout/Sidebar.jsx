import { useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  ShieldAlert,
  X,
  LayoutDashboard,
  Grid3X3,
  ListFilter,
  Database,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Table2,
  FileSpreadsheet,
  UserPlus,
} from 'lucide-react';

export function Sidebar({
  isOpen,
  onClose,
  activeTab = 'dashboard',
  onSelectTab,
}) {
  const { user, logout } = useAuth();

  const isAdmin = useMemo(() => {
    const rolValue = String(user?.rol || user?.roleCode || user?.role || '')
      .trim()
      .toLowerCase();
    return rolValue === 'admin' || rolValue === 'administrador';
  }, [user]);

  // Cerrar sidebar al presionar la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Evitar scroll del body cuando el sidebar está abierto en pantallas pequeñas
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard General',
      icon: LayoutDashboard,
      
    },
    {
      id: 'matrices',
      label: 'Matriz y Tratamiento',
      icon: FileSpreadsheet,
      
    },
    {
      id: 'visualizacion',
      label: 'Identificación y Evaluación',
      icon: Table2,
      
    },
    {
      id: 'matrix',
      label: 'Matriz de Calor 5x5',
      icon: Grid3X3,
      
    },
    ...(isAdmin
      ? [
          {
            id: 'crearUsuario',
            label: 'Crear Usuario',
            icon: UserPlus,
          },
        ]
      : []),
  ];

  const handleNavClick = (tabId) => {
    if (onSelectTab) onSelectTab(tabId);
    onClose();
  };

  return (
    <>
      {/* Backdrop overlay oscuro */}
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menú principal"
      >
        {/* Header con botón para cerrar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm block leading-tight">
                Navegación
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Perfil del Usuario Activo */}
        {user && (
          <div className="p-4 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-full text-white font-bold flex items-center justify-center text-sm shadow-sm ${
                  user.color || 'bg-indigo-600'
                }`}
              >
                {user.avatar ||
                  (user.nombre || user.name || 'US').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate leading-snug">
                  {user.nombre || user.name}
                </p>
                <p className="text-xs text-indigo-600 font-medium truncate">
                  {user.role || user.rol}
                  {user.empresa_id ? ` • Empresa #${user.empresa_id}` : ''}
                </p>
                <p className="text-[11px] text-slate-400 font-mono truncate">
                  {user.correo || user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Enlaces de Navegación */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Navegación
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.id === 'matrices' && activeTab === 'matrizVisualizacion');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-5 h-5 mt-0.5 shrink-0 ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                />
                <div>
                  <span className="text-sm block">{item.label}</span>
                  <span className="text-xs text-slate-400 block font-normal">
                    {item.description}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
        {/* Botón Cerrar Sesión */}
        <div className="p-3 border-t border-slate-100">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl font-medium text-sm transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
