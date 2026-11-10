import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import {
  UserPlus,
  Building2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Mail,
  Lock,
  User,
  Briefcase,
  MapPin,
  FileText,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

// Catálogo base de los 32 Estados de la República Mexicana (compatible con tabla `estados`)
const ESTADOS_MEXICO = [
  { id: 1, nombre: 'Aguascalientes' },
  { id: 2, nombre: 'Baja California' },
  { id: 3, nombre: 'Baja California Sur' },
  { id: 4, nombre: 'Campeche' },
  { id: 5, nombre: 'Chiapas' },
  { id: 6, nombre: 'Chihuahua' },
  { id: 7, nombre: 'Ciudad de México' },
  { id: 8, nombre: 'Coahuila' },
  { id: 9, nombre: 'Colima' },
  { id: 10, nombre: 'Durango' },
  { id: 11, nombre: 'Estado de México' },
  { id: 12, nombre: 'Guanajuato' },
  { id: 13, nombre: 'Guerrero' },
  { id: 14, nombre: 'Hidalgo' },
  { id: 15, nombre: 'Jalisco' },
  { id: 16, nombre: 'Michoacán' },
  { id: 17, nombre: 'Morelos' },
  { id: 18, nombre: 'Nayarit' },
  { id: 19, nombre: 'Nuevo León' },
  { id: 20, nombre: 'Oaxaca' },
  { id: 21, nombre: 'Puebla' },
  { id: 22, nombre: 'Querétaro' },
  { id: 23, nombre: 'Quintana Roo' },
  { id: 24, nombre: 'San Luis Potosí' },
  { id: 25, nombre: 'Sinaloa' },
  { id: 26, nombre: 'Sonora' },
  { id: 27, nombre: 'Tabasco' },
  { id: 28, nombre: 'Tamulipas' },
  { id: 29, nombre: 'Tlaxcala' },
  { id: 30, nombre: 'Veracruz' },
  { id: 31, nombre: 'Yucatán' },
  { id: 32, nombre: 'Zacatecas' },
];

export function CrearUsuario() {
  const { user } = useAuth();

  const isAdmin = useMemo(() => {
    const rolValue = String(user?.rol || user?.roleCode || user?.role || '')
      .trim()
      .toLowerCase();
    return rolValue === 'admin' || rolValue === 'administrador';
  }, [user]);

  // Catálogos desde BD
  const [empresas, setEmpresas] = useState([]);
  const [estados, setEstados] = useState(ESTADOS_MEXICO);

  // Estado del Paso 1: Formulario de Empresa (`empresas`)
  const [empresaForm, setEmpresaForm] = useState({
    nombre_razon_social: '',
    rfc: '',
    sector: '',
    estado_id: '',
  });
  const [isCreatingEmpresa, setIsCreatingEmpresa] = useState(false);
  const [empresaFeedback, setEmpresaFeedback] = useState(null);
  const [createdEmpresa, setCreatedEmpresa] = useState(null);

  // Estado del Paso 2: Formulario de Usuario (`usuarios`)
  const [usuarioForm, setUsuarioForm] = useState({
    empresa_id: '',
    nombre: '',
    correo: '',
    password: '',
    tipo_rol: 'Empresa',
  });
  const [isCreatingUsuario, setIsCreatingUsuario] = useState(false);
  const [usuarioFeedback, setUsuarioFeedback] = useState(null);

  // Cargar empresas y estados existentes al montar
  useEffect(() => {
    let isMounted = true;

    api
      .get('/empresas')
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : res?.empresas;
        if (Array.isArray(list)) {
          setEmpresas(list);
        }
      })
      .catch(() => {
        // Si aún no hay empresas o endpoint offline
      });

    api
      .get('/estados')
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : res?.estados;
        if (Array.isArray(list) && list.length > 0) {
          setEstados(list);
        }
      })
      .catch(() => {
        // Usa el catálogo base ESTADOS_MEXICO
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-sm">
        <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Acceso Restringido</h2>
        <p className="text-sm text-slate-500 mt-1">
          Esta vista únicamente está disponible para usuarios de tipo Administrador.
        </p>
      </div>
    );
  }

  // PASO 1: Crear Empresa en la tabla `empresas`
  const handleCreateEmpresa = async (e) => {
    e.preventDefault();
    setEmpresaFeedback(null);
    setUsuarioFeedback(null);

    if (!empresaForm.nombre_razon_social.trim()) {
      setEmpresaFeedback({
        type: 'error',
        message: 'La razón social o nombre de la empresa es obligatorio.',
      });
      return;
    }

    setIsCreatingEmpresa(true);
    try {
      const payload = {
        nombre_razon_social: empresaForm.nombre_razon_social.trim(),
        rfc: empresaForm.rfc.trim() || null,
        sector: empresaForm.sector.trim() || null,
        estado_id: empresaForm.estado_id ? Number(empresaForm.estado_id) : null,
      };

      const response = await api.post('/empresas', payload);
      const nuevaEmpresa = response?.empresa || response;

      if (!nuevaEmpresa || !nuevaEmpresa.id) {
        throw new Error('El servidor no devolvió el ID de la empresa creada.');
      }

      setEmpresas((prev) => [nuevaEmpresa, ...prev]);
      setCreatedEmpresa(nuevaEmpresa);

      // Asignar automáticamente el `empresa_id` recién creado al formulario del Paso 2
      setUsuarioForm((prev) => ({
        ...prev,
        empresa_id: String(nuevaEmpresa.id),
      }));

      setEmpresaForm({
        nombre_razon_social: '',
        rfc: '',
        sector: '',
        estado_id: '',
      });

      setEmpresaFeedback({
        type: 'success',
        message: `Empresa "${nuevaEmpresa.nombre_razon_social}" registrada con éxito (ID #${nuevaEmpresa.id}). Ahora puedes crear su usuario en el Paso 2.`,
      });
    } catch (error) {
      setEmpresaFeedback({
        type: 'error',
        message:
          error.message ||
          'No se pudo registrar la empresa. Verifica la conexión con el servidor.',
      });
    } finally {
      setIsCreatingEmpresa(false);
    }
  };

  // PASO 2: Crear Usuario en la tabla `usuarios` asociado a la empresa
  const handleCreateUsuario = async (e) => {
    e.preventDefault();
    setUsuarioFeedback(null);

    if (!usuarioForm.empresa_id) {
      setUsuarioFeedback({
        type: 'error',
        message: 'Primero debes registrar o seleccionar una empresa en el Paso 1.',
      });
      return;
    }

    if (
      !usuarioForm.nombre.trim() ||
      !usuarioForm.correo.trim() ||
      !usuarioForm.password
    ) {
      setUsuarioFeedback({
        type: 'error',
        message: 'Todos los campos del usuario son obligatorios.',
      });
      return;
    }

    setIsCreatingUsuario(true);
    try {
      const payload = {
        empresa_id: Number(usuarioForm.empresa_id),
        nombre: usuarioForm.nombre.trim(),
        correo: usuarioForm.correo.trim().toLowerCase(),
        password: usuarioForm.password,
        tipo_rol: usuarioForm.tipo_rol,
      };

      const response = await api.post('/usuarios', payload);
      const nuevoUsuario = response?.usuario || response;

      setUsuarioForm((prev) => ({
        ...prev,
        nombre: '',
        correo: '',
        password: '',
        tipo_rol: 'Empresa',
      }));

      setUsuarioFeedback({
        type: 'success',
        message: `Usuario "${nuevoUsuario?.nombre || payload.nombre}" (${payload.correo}) creado exitosamente para la Empresa #${payload.empresa_id}.`,
      });
    } catch (error) {
      setUsuarioFeedback({
        type: 'error',
        message:
          error.message ||
          'No se pudo registrar el usuario. Verifica que el correo no esté duplicado.',
      });
    } finally {
      setIsCreatingUsuario(false);
    }
  };

  const isStep2Enabled = Boolean(usuarioForm.empresa_id);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">
                Crear Empresa y Usuario
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Panel de Administración
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Sigue el orden secuencial: <strong>Paso 1</strong> registra los datos de la empresa y <strong>Paso 2</strong> crea la cuenta de usuario vinculada a dicha empresa.
            </p>
          </div>
        </div>
      </div>

      {/* Contenedor de los 2 Pasos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ==================== PASO 1: CREAR EMPRESA ==================== */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm border border-indigo-100">
                1
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  Paso 1: Registrar Empresa
                </h2>
                <p className="text-xs text-slate-500">
                  Registra la organización en la tabla <code className="font-mono text-indigo-600">empresas</code>.
                </p>
              </div>
            </div>
          </div>

          {empresaFeedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                empresaFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {empresaFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium leading-relaxed">
                {empresaFeedback.message}
              </span>
            </div>
          )}

          <form onSubmit={handleCreateEmpresa} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nombre o Razón Social *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={empresaForm.nombre_razon_social}
                  onChange={(e) =>
                    setEmpresaForm({
                      ...empresaForm,
                      nombre_razon_social: e.target.value,
                    })
                  }
                  placeholder="Ej. Corporativo Industrial del Norte S.A. de C.V."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  RFC
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    maxLength={50}
                    value={empresaForm.rfc}
                    onChange={(e) =>
                      setEmpresaForm({
                        ...empresaForm,
                        rfc: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Ej. CIN260101AAA"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sector
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={empresaForm.sector}
                    onChange={(e) =>
                      setEmpresaForm({ ...empresaForm, sector: e.target.value })
                    }
                    placeholder="Ej. Manufactura, Salud, TI..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Estado de la República
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={empresaForm.estado_id}
                  onChange={(e) =>
                    setEmpresaForm({
                      ...empresaForm,
                      estado_id: e.target.value,
                    })
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Seleccionar Estado --</option>
                  {estados.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isCreatingEmpresa}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCreatingEmpresa ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando Empresa...</span>
                  </>
                ) : (
                  <>
                    <span>Guardar Empresa y Continuar al Paso 2</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ==================== PASO 2: CREAR USUARIO ==================== */}
        <div
          className={`bg-white rounded-2xl border p-6 shadow-sm space-y-5 transition-opacity ${
            isStep2Enabled
              ? 'border-emerald-200'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center text-sm border ${
                  isStep2Enabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                2
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  Paso 2: Registrar Usuario
                </h2>
                <p className="text-xs text-slate-500">
                  Vincula el usuario a la empresa creada en la tabla <code className="font-mono text-emerald-700">usuarios</code>.
                </p>
              </div>
            </div>
          </div>

          {usuarioFeedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                usuarioFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {usuarioFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium leading-relaxed">
                {usuarioFeedback.message}
              </span>
            </div>
          )}

          <form onSubmit={handleCreateUsuario} className="space-y-4">
            {/* Selección de Empresa (autoseleccionada tras el Paso 1 o seleccionable de la lista) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Empresa Asociada *
              </label>
              <select
                required
                value={usuarioForm.empresa_id}
                onChange={(e) =>
                  setUsuarioForm({ ...usuarioForm, empresa_id: e.target.value })
                }
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">
                  {empresas.length > 0
                    ? '-- Selecciona una empresa o crea una en el Paso 1 --'
                    : '-- Primero registra una empresa en el Paso 1 --'}
                </option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    #{emp.id} - {emp.nombre_razon_social}
                    {emp.rfc ? ` (${emp.rfc})` : ''}
                  </option>
                ))}
              </select>
              {createdEmpresa &&
                Number(usuarioForm.empresa_id) === Number(createdEmpresa.id) && (
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">
                    Empresa recién creada seleccionada automáticamente: #{createdEmpresa.id} {createdEmpresa.nombre_razon_social}
                  </p>
                )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nombre Completo del Usuario *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  disabled={!isStep2Enabled}
                  value={usuarioForm.nombre}
                  onChange={(e) =>
                    setUsuarioForm({ ...usuarioForm, nombre: e.target.value })
                  }
                  placeholder="Ej. María Fernanda López"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Correo Electrónico *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  disabled={!isStep2Enabled}
                  value={usuarioForm.correo}
                  onChange={(e) =>
                    setUsuarioForm({ ...usuarioForm, correo: e.target.value })
                  }
                  placeholder="usuario@empresa.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contraseña *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    disabled={!isStep2Enabled}
                    value={usuarioForm.password}
                    onChange={(e) =>
                      setUsuarioForm({
                        ...usuarioForm,
                        password: e.target.value,
                      })
                    }
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tipo de Rol *
                </label>
                <select
                  value={usuarioForm.tipo_rol}
                  disabled={!isStep2Enabled}
                  onChange={(e) =>
                    setUsuarioForm({ ...usuarioForm, tipo_rol: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Empresa">Empresa</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!isStep2Enabled || isCreatingUsuario}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCreatingUsuario ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creando Usuario...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Registrar Usuario</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

