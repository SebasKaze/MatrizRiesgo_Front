import { ShieldAlert, PlusCircle, Menu, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRiskContext } from '../../hooks/useRiskContext';
import { useAuth } from '../../hooks/useAuth';

export function Navbar({ onToggleSidebar }) {
  const { openModal } = useRiskContext();
  const { user, backendStatus } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-3">
          {/* Left: Hamburger Button + Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Abrir menú lateral hamburguesa"
              title="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg text-slate-900 tracking-tight block leading-tight">
                  Matriz de Riesgos
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Gestión y Control Operativo
                </span>
              </div>
            </div>
          </div>


          {/* Right: New Risk Button + User Mini Avatar */}
          <div className="flex items-center gap-3">

            {user && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="Ver perfil y menú"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {(user.nombre || user.name || 'Usuario').split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate max-w-[100px]">
                    {user.roleCode || user.rol}
                  </p>
                </div>
                <div
                  className={`w-9 h-9 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-xs ${
                    user.color || 'bg-indigo-600'
                  }`}
                >
                  {user.avatar ||
                    (user.nombre || user.name || 'US').slice(0, 2).toUpperCase()}
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
