import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Badge } from '../components/ui/Badge';
import {
  UserPlus,
  Building2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Mail,
  Lock,
  User,
  Briefcase,
  MapPin,
  FileText,
  ShieldAlert,
  ArrowRight,
  Pencil,
  Trash2,
  Search,
  X,
  Users,
  Calendar,
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

const EMPRESAS_STORAGE_KEY = 'admin_empresas_storage';
const USUARIOS_STORAGE_KEY = 'admin_usuarios_storage';

export function CrearUsuario() {
  const { user } = useAuth();

  const isAdmin = useMemo(() => {
    const rolValue = String(user?.rol || user?.roleCode || user?.role || '')
      .trim()
      .toLowerCase();
    return rolValue === 'admin' || rolValue === 'administrador';
  }, [user]);

  // Catálogos y listados desde BD
  const [empresas, setEmpresas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [estados, setEstados] = useState(ESTADOS_MEXICO);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Buscadores para las tablas de Empresas y Usuarios
  const [searchUsuario, setSearchUsuario] = useState('');
  const [searchEmpresa, setSearchEmpresa] = useState('');

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

  // Estado para Modal de Edición de Usuario
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [editUsuarioForm, setEditUsuarioForm] = useState({
    empresa_id: '',
    nombre: '',
    correo: '',
    password: '',
    tipo_rol: 'Empresa',
  });
  const [isUpdatingUsuario, setIsUpdatingUsuario] = useState(false);
  const [editUsuarioError, setEditUsuarioError] = useState('');

  // Estado para Modal de Edición de Empresa
  const [editingEmpresa, setEditingEmpresa] = useState(null);
  const [editEmpresaForm, setEditEmpresaForm] = useState({
    nombre_razon_social: '',
    rfc: '',
    sector: '',
    estado_id: '',
  });
  const [isUpdatingEmpresa, setIsUpdatingEmpresa] = useState(false);
  const [editEmpresaError, setEditEmpresaError] = useState('');

  // Estado para Modal de Advertencia de Eliminación (compartido para Usuario y Empresa)
  const [deleteWarning, setDeleteWarning] = useState(null);
  // deleteWarning = { type: 'usuario' | 'empresa', item: obj, title: string, description: string }
  const [isDeleting, setIsDeleting] = useState(false);

  // Cargar empresas, usuarios y estados desde el backend (con respaldo local)
  const fetchAdminData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [empRes, usrRes, estRes] = await Promise.allSettled([
        api.get('/empresas'),
        api.get('/usuarios'),
        api.get('/estados'),
      ]);

      if (empRes.status === 'fulfilled') {
        const list = Array.isArray(empRes.value)
          ? empRes.value
          : empRes.value?.empresas;
        if (Array.isArray(list)) {
          setEmpresas(list);
          localStorage.setItem(EMPRESAS_STORAGE_KEY, JSON.stringify(list));
        }
      } else {
        const storedEmp = localStorage.getItem(EMPRESAS_STORAGE_KEY);
        if (storedEmp) {
          const parsed = JSON.parse(storedEmp);
          if (Array.isArray(parsed)) setEmpresas(parsed);
        }
      }

      if (usrRes.status === 'fulfilled') {
        const list = Array.isArray(usrRes.value)
          ? usrRes.value
          : usrRes.value?.usuarios;
        if (Array.isArray(list)) {
          setUsuarios(list);
          localStorage.setItem(USUARIOS_STORAGE_KEY, JSON.stringify(list));
        }
      } else {
        const storedUsr = localStorage.getItem(USUARIOS_STORAGE_KEY);
        if (storedUsr) {
          const parsed = JSON.parse(storedUsr);
          if (Array.isArray(parsed)) setUsuarios(parsed);
        }
      }

      if (estRes.status === 'fulfilled') {
        const list = Array.isArray(estRes.value)
          ? estRes.value
          : estRes.value?.estados;
        if (Array.isArray(list) && list.length > 0) {
          setEstados(list);
        }
      }
    } catch {
      // ignore fallback errors
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Helpers para resolver nombres de empresa y estado
  const getEstadoNombre = useCallback(
    (estadoId) => {
      if (!estadoId) return 'No especificado';
      const found = estados.find((e) => Number(e.id) === Number(estadoId));
      return found ? found.nombre : `Estado #${estadoId}`;
    },
    [estados]
  );

  const getEmpresaNombre = useCallback(
    (empresaId, fallbackName) => {
      if (fallbackName) return fallbackName;
      if (!empresaId) return 'Sin empresa (Global)';
      const found = empresas.find((e) => Number(e.id) === Number(empresaId));
      return found ? found.nombre_razon_social : `Empresa #${empresaId}`;
    },
    [empresas]
  );

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

  // Filtrado de usuarios
  const filteredUsuarios = useMemo(() => {
    const term = searchUsuario.trim().toLowerCase();
    if (!term) return usuarios;
    return usuarios.filter((u) => {
      const empName = getEmpresaNombre(
        u.empresa_id,
        u.nombre_empresa || u.nombre_razon_social
      ).toLowerCase();
      return (
        (u.nombre || '').toLowerCase().includes(term) ||
        (u.correo || '').toLowerCase().includes(term) ||
        (u.tipo_rol || u.rol || '').toLowerCase().includes(term) ||
        String(u.id || '').toLowerCase().includes(term) ||
        empName.includes(term)
      );
    });
  }, [usuarios, searchUsuario, getEmpresaNombre]);

  // Filtrado de empresas
  const filteredEmpresas = useMemo(() => {
    const term = searchEmpresa.trim().toLowerCase();
    if (!term) return empresas;
    return empresas.filter((e) => {
      const estName = getEstadoNombre(e.estado_id).toLowerCase();
      return (
        (e.nombre_razon_social || '').toLowerCase().includes(term) ||
        (e.rfc || '').toLowerCase().includes(term) ||
        (e.sector || '').toLowerCase().includes(term) ||
        String(e.id || '').toLowerCase().includes(term) ||
        estName.includes(term)
      );
    });
  }, [empresas, searchEmpresa, getEstadoNombre]);

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

  // ==================== PASO 1: CREAR EMPRESA ====================
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

      setEmpresas((prev) => {
        const updated = [nuevaEmpresa, ...prev];
        localStorage.setItem(EMPRESAS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
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

  // ==================== PASO 2: CREAR USUARIO ====================
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

      const userRecord = {
        id: nuevoUsuario?.id ?? Date.now(),
        empresa_id: payload.empresa_id,
        nombre: nuevoUsuario?.nombre || payload.nombre,
        correo: nuevoUsuario?.correo || payload.correo,
        tipo_rol: nuevoUsuario?.tipo_rol || payload.tipo_rol,
        fecha_creacion:
          nuevoUsuario?.fecha_creacion || new Date().toISOString(),
      };

      setUsuarios((prev) => {
        const updated = [userRecord, ...prev];
        localStorage.setItem(USUARIOS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

      setUsuarioForm((prev) => ({
        ...prev,
        nombre: '',
        correo: '',
        password: '',
        tipo_rol: 'Empresa',
      }));

      setUsuarioFeedback({
        type: 'success',
        message: `Usuario "${userRecord.nombre}" (${userRecord.correo}) creado exitosamente para la Empresa #${payload.empresa_id}.`,
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

  // ==================== ACTUALIZAR USUARIO ====================
  const handleOpenEditUsuario = (u) => {
    setEditUsuarioError('');
    setEditingUsuario(u);
    setEditUsuarioForm({
      empresa_id: u.empresa_id ? String(u.empresa_id) : '',
      nombre: u.nombre || '',
      correo: u.correo || '',
      password: '',
      tipo_rol: u.tipo_rol || u.rol || 'Empresa',
    });
  };

  const handleSaveEditUsuario = async (e) => {
    e.preventDefault();
    if (!editingUsuario) return;
    setEditUsuarioError('');

    if (!editUsuarioForm.nombre.trim() || !editUsuarioForm.correo.trim()) {
      setEditUsuarioError('El nombre y el correo electrónico son obligatorios.');
      return;
    }

    setIsUpdatingUsuario(true);
    try {
      const payload = {
        empresa_id: editUsuarioForm.empresa_id
          ? Number(editUsuarioForm.empresa_id)
          : null,
        nombre: editUsuarioForm.nombre.trim(),
        correo: editUsuarioForm.correo.trim().toLowerCase(),
        tipo_rol: editUsuarioForm.tipo_rol,
        ...(editUsuarioForm.password.trim()
          ? { password: editUsuarioForm.password.trim() }
          : {}),
      };

      let updatedRecord = {
        ...editingUsuario,
        ...payload,
      };

      try {
        const response = await api.put(
          `/usuarios/${editingUsuario.id}`,
          payload
        );
        const serverUser = response?.usuario || response;
        if (serverUser && typeof serverUser === 'object') {
          updatedRecord = { ...updatedRecord, ...serverUser };
        }
      } catch (err) {
        if (err.status && err.status !== 404) {
          throw err;
        }
      }

      setUsuarios((prev) => {
        const updated = prev.map((item) =>
          Number(item.id) === Number(editingUsuario.id) ? updatedRecord : item
        );
        localStorage.setItem(USUARIOS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

      setEditingUsuario(null);
      setUsuarioFeedback({
        type: 'success',
        message: `Usuario "${updatedRecord.nombre}" actualizado correctamente.`,
      });
    } catch (err) {
      setEditUsuarioError(
        err.message || 'No se pudo actualizar el usuario en el servidor.'
      );
    } finally {
      setIsUpdatingUsuario(false);
    }
  };

  // ==================== ACTUALIZAR EMPRESA ====================
  const handleOpenEditEmpresa = (emp) => {
    setEditEmpresaError('');
    setEditingEmpresa(emp);
    setEditEmpresaForm({
      nombre_razon_social: emp.nombre_razon_social || '',
      rfc: emp.rfc || '',
      sector: emp.sector || '',
      estado_id: emp.estado_id ? String(emp.estado_id) : '',
    });
  };

  const handleSaveEditEmpresa = async (e) => {
    e.preventDefault();
    if (!editingEmpresa) return;
    setEditEmpresaError('');

    if (!editEmpresaForm.nombre_razon_social.trim()) {
      setEditEmpresaError(
        'El nombre o razón social de la empresa es obligatorio.'
      );
      return;
    }

    setIsUpdatingEmpresa(true);
    try {
      const payload = {
        nombre_razon_social: editEmpresaForm.nombre_razon_social.trim(),
        rfc: editEmpresaForm.rfc.trim() || null,
        sector: editEmpresaForm.sector.trim() || null,
        estado_id: editEmpresaForm.estado_id
          ? Number(editEmpresaForm.estado_id)
          : null,
      };

      let updatedRecord = {
        ...editingEmpresa,
        ...payload,
      };

      try {
        const response = await api.put(
          `/empresas/${editingEmpresa.id}`,
          payload
        );
        const serverEmp = response?.empresa || response;
        if (serverEmp && typeof serverEmp === 'object') {
          updatedRecord = { ...updatedRecord, ...serverEmp };
        }
      } catch (err) {
        if (err.status && err.status !== 404) {
          throw err;
        }
      }

      setEmpresas((prev) => {
        const updated = prev.map((item) =>
          Number(item.id) === Number(editingEmpresa.id) ? updatedRecord : item
        );
        localStorage.setItem(EMPRESAS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

      setEditingEmpresa(null);
      setEmpresaFeedback({
        type: 'success',
        message: `Empresa "${updatedRecord.nombre_razon_social}" actualizada correctamente.`,
      });
    } catch (err) {
      setEditEmpresaError(
        err.message || 'No se pudo actualizar la empresa en el servidor.'
      );
    } finally {
      setIsUpdatingEmpresa(false);
    }
  };

  // ==================== ADVERTENCIA Y ELIMINACIÓN (USUARIO Y EMPRESA) ====================
  const handleAskDeleteUsuario = (u) => {
    setDeleteWarning({
      type: 'usuario',
      item: u,
      title: `¿Eliminar al usuario "${u.nombre}"?`,
      subtitle: `Correo: ${u.correo} (ID #${u.id})`,
      warningText:
        'Esta acción eliminará permanentemente la cuenta de acceso del usuario en la base de datos y no se puede deshacer.',
    });
  };

  const handleAskDeleteEmpresa = (emp) => {
    setDeleteWarning({
      type: 'empresa',
      item: emp,
      title: `¿Eliminar la empresa "${emp.nombre_razon_social}"?`,
      subtitle: `ID #${emp.id}${emp.rfc ? ` • RFC: ${emp.rfc}` : ''}`,
      warningText:
        '¡Atención! Al eliminar esta empresa también se eliminarán en cascada todos los usuarios y matrices de riesgo asociados a ella. Esta acción no se puede deshacer.',
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteWarning) return;
    setIsDeleting(true);

    try {
      if (deleteWarning.type === 'usuario') {
        const targetUser = deleteWarning.item;
        try {
          await api.delete(`/usuarios/${targetUser.id}`);
        } catch (err) {
          if (err.status && err.status !== 404) {
            throw err;
          }
        }

        setUsuarios((prev) => {
          const updated = prev.filter(
            (item) => Number(item.id) !== Number(targetUser.id)
          );
          localStorage.setItem(USUARIOS_STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });

        setUsuarioFeedback({
          type: 'success',
          message: `Usuario "${targetUser.nombre}" eliminado correctamente.`,
        });
      } else if (deleteWarning.type === 'empresa') {
        const targetEmpresa = deleteWarning.item;
        try {
          await api.delete(`/empresas/${targetEmpresa.id}`);
        } catch (err) {
          if (err.status && err.status !== 404) {
            throw err;
          }
        }

        setEmpresas((prev) => {
          const updated = prev.filter(
            (item) => Number(item.id) !== Number(targetEmpresa.id)
          );
          localStorage.setItem(EMPRESAS_STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });

        // También remover en cliente los usuarios vinculados a esa empresa (ON DELETE CASCADE)
        setUsuarios((prev) => {
          const updated = prev.filter(
            (u) => Number(u.empresa_id) !== Number(targetEmpresa.id)
          );
          localStorage.setItem(USUARIOS_STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });

        if (Number(usuarioForm.empresa_id) === Number(targetEmpresa.id)) {
          setUsuarioForm((prev) => ({ ...prev, empresa_id: '' }));
        }

        setEmpresaFeedback({
          type: 'success',
          message: `Empresa "${targetEmpresa.nombre_razon_social}" eliminada correctamente.`,
        });
      }

      setDeleteWarning(null);
    } catch (err) {
      if (deleteWarning.type === 'usuario') {
        setUsuarioFeedback({
          type: 'error',
          message: err.message || 'Error al eliminar el usuario.',
        });
      } else {
        setEmpresaFeedback({
          type: 'error',
          message: err.message || 'Error al eliminar la empresa.',
        });
      }
      setDeleteWarning(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const isStep2Enabled = Boolean(usuarioForm.empresa_id);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">
                  Gestión de Empresas y Usuarios
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Panel de Administración
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Sigue el orden secuencial: <strong>Paso 1</strong> registra los datos de la empresa y <strong>Paso 2</strong> crea la cuenta de usuario vinculada. Debajo puedes consultar, actualizar o eliminar empresas y usuarios.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchAdminData}
            disabled={isLoadingData}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`}
            />
            Actualizar Listados
          </button>
        </div>
      </div>

      {/* Contenedor de los 2 Pasos de Registro */}
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
                  Registra la organización en la tabla{' '}
                  <code className="font-mono text-indigo-600">empresas</code>.
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
            isStep2Enabled ? 'border-emerald-200' : 'border-slate-200'
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
                  Vincula el usuario a la empresa creada en la tabla{' '}
                  <code className="font-mono text-emerald-700">usuarios</code>.
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
                Number(usuarioForm.empresa_id) ===
                  Number(createdEmpresa.id) && (
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">
                    Empresa recién creada seleccionada automáticamente: #
                    {createdEmpresa.id} {createdEmpresa.nombre_razon_social}
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

      {/* ==================== TABLA DE USUARIOS REGISTRADOS ==================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Usuarios Registrados
              </h2>
              <p className="text-xs text-slate-500">
                Visualización de cuentas de usuario, su empresa asignada y permisos de acceso.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchUsuario}
                onChange={(e) => setSearchUsuario(e.target.value)}
                placeholder="Buscar usuario, correo o empresa..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-500 shrink-0">
              Total: <strong className="text-slate-800">{filteredUsuarios.length}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-16 text-center border-r border-slate-200">
                  ID
                </th>
                <th className="py-3 px-4 min-w-[180px] border-r border-slate-200">
                  Nombre del Usuario
                </th>
                <th className="py-3 px-4 min-w-[200px] border-r border-slate-200">
                  Correo Electrónico
                </th>
                <th className="py-3 px-4 min-w-[180px] border-r border-slate-200">
                  Empresa Asociada
                </th>
                <th className="py-3 px-4 w-28 text-center border-r border-slate-200">
                  Rol
                </th>
                <th className="py-3 px-4 w-36 text-center border-r border-slate-200">
                  Fecha Creación
                </th>
                <th className="py-3 px-4 w-44 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredUsuarios.length > 0 ? (
                filteredUsuarios.map((u) => {
                  const rolLabel = u.tipo_rol || u.rol || 'Empresa';
                  const isUserAdmin =
                    String(rolLabel).toLowerCase() === 'admin' ||
                    String(rolLabel).toLowerCase() === 'administrador';

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/90 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center border-r border-slate-100 font-mono text-slate-500 font-semibold">
                        #{u.id}
                      </td>
                      <td className="py-3.5 px-4 border-r border-slate-100 font-bold text-slate-900">
                        {u.nombre}
                      </td>
                      <td className="py-3.5 px-4 border-r border-slate-100 text-slate-600 font-mono text-[11px]">
                        {u.correo}
                      </td>
                      <td className="py-3.5 px-4 border-r border-slate-100">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-xs">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>
                            {getEmpresaNombre(
                              u.empresa_id,
                              u.nombre_empresa || u.nombre_razon_social
                            )}
                          </span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center border-r border-slate-100">
                        <Badge variant={isUserAdmin ? 'high' : 'low'}>
                          {rolLabel}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center border-r border-slate-100 text-slate-500 font-mono text-[11px]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(u.fecha_creacion)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditUsuario(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors cursor-pointer"
                            title="Actualizar usuario"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Actualizar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAskDeleteUsuario(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs transition-colors cursor-pointer"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-slate-500 bg-white"
                  >
                    <Users className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-sm text-slate-700">
                      No hay usuarios registrados para mostrar.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== TABLA DE EMPRESAS REGISTRADAS ==================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Empresas Registradas
              </h2>
              <p className="text-xs text-slate-500">
                Catálogo de empresas dadas de alta en el sistema.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchEmpresa}
                onChange={(e) => setSearchEmpresa(e.target.value)}
                placeholder="Buscar empresa, RFC, sector..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <span className="text-xs text-slate-500 shrink-0">
              Total: <strong className="text-slate-800">{filteredEmpresas.length}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-16 text-center border-r border-slate-200">
                  ID
                </th>
                <th className="py-3 px-4 min-w-[220px] border-r border-slate-200">
                  Nombre o Razón Social
                </th>
                <th className="py-3 px-4 w-36 text-center border-r border-slate-200">
                  RFC
                </th>
                <th className="py-3 px-4 min-w-[150px] border-r border-slate-200">
                  Sector
                </th>
                <th className="py-3 px-4 min-w-[150px] border-r border-slate-200">
                  Estado
                </th>
                <th className="py-3 px-4 w-36 text-center border-r border-slate-200">
                  Fecha Registro
                </th>
                <th className="py-3 px-4 w-44 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredEmpresas.length > 0 ? (
                filteredEmpresas.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/90 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-center border-r border-slate-100 font-mono text-slate-500 font-semibold">
                      #{emp.id}
                    </td>
                    <td className="py-3.5 px-4 border-r border-slate-100 font-bold text-slate-900">
                      {emp.nombre_razon_social}
                    </td>
                    <td className="py-3.5 px-4 text-center border-r border-slate-100 font-mono text-slate-600">
                      {emp.rfc || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 border-r border-slate-100 text-slate-700">
                      {emp.sector || 'No especificado'}
                    </td>
                    <td className="py-3.5 px-4 border-r border-slate-100 text-slate-700">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {emp.estado_nombre || getEstadoNombre(emp.estado_id)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center border-r border-slate-100 text-slate-500 font-mono text-[11px]">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(emp.fecha_registro)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditEmpresa(emp)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors cursor-pointer"
                          title="Actualizar empresa"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Actualizar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAskDeleteEmpresa(emp)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs transition-colors cursor-pointer"
                          title="Eliminar empresa"
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
                    className="py-10 text-center text-slate-500 bg-white"
                  >
                    <Building2 className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-sm text-slate-700">
                      No hay empresas registradas para mostrar.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== MODAL ACTUALIZAR USUARIO ==================== */}
      {editingUsuario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Actualizar Usuario (#{editingUsuario.id})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Modifica los datos de la cuenta del usuario.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUsuario(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editUsuarioError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editUsuarioError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditUsuario} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Empresa Asociada
                </label>
                <select
                  value={editUsuarioForm.empresa_id}
                  onChange={(e) =>
                    setEditUsuarioForm({
                      ...editUsuarioForm,
                      empresa_id: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Sin empresa específica --</option>
                  {empresas.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      #{emp.id} - {emp.nombre_razon_social}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={editUsuarioForm.nombre}
                  onChange={(e) =>
                    setEditUsuarioForm({
                      ...editUsuarioForm,
                      nombre: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={editUsuarioForm.correo}
                  onChange={(e) =>
                    setEditUsuarioForm({
                      ...editUsuarioForm,
                      correo: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nueva Contraseña (Opcional)
                  </label>
                  <input
                    type="password"
                    value={editUsuarioForm.password}
                    onChange={(e) =>
                      setEditUsuarioForm({
                        ...editUsuarioForm,
                        password: e.target.value,
                      })
                    }
                    placeholder="Dejar en blanco para mantener"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Tipo de Rol *
                  </label>
                  <select
                    value={editUsuarioForm.tipo_rol}
                    onChange={(e) =>
                      setEditUsuarioForm({
                        ...editUsuarioForm,
                        tipo_rol: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Empresa">Empresa</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUsuario(null)}
                  disabled={isUpdatingUsuario}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingUsuario}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  {isUpdatingUsuario ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL ACTUALIZAR EMPRESA ==================== */}
      {editingEmpresa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Actualizar Empresa (#{editingEmpresa.id})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Modifica la información fiscal y operativa de la empresa.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingEmpresa(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editEmpresaError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editEmpresaError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditEmpresa} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre o Razón Social *
                </label>
                <input
                  type="text"
                  required
                  value={editEmpresaForm.nombre_razon_social}
                  onChange={(e) =>
                    setEditEmpresaForm({
                      ...editEmpresaForm,
                      nombre_razon_social: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    RFC
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    value={editEmpresaForm.rfc}
                    onChange={(e) =>
                      setEditEmpresaForm({
                        ...editEmpresaForm,
                        rfc: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Sector
                  </label>
                  <input
                    type="text"
                    value={editEmpresaForm.sector}
                    onChange={(e) =>
                      setEditEmpresaForm({
                        ...editEmpresaForm,
                        sector: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Estado de la República
                </label>
                <select
                  value={editEmpresaForm.estado_id}
                  onChange={(e) =>
                    setEditEmpresaForm({
                      ...editEmpresaForm,
                      estado_id: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Seleccionar Estado --</option>
                  {estados.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEmpresa(null)}
                  disabled={isUpdatingEmpresa}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingEmpresa}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  {isUpdatingEmpresa ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL DE ADVERTENCIA DE ELIMINACIÓN ==================== */}
      {deleteWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  {deleteWarning.title}
                </h3>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  {deleteWarning.subtitle}
                </p>
                <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                  {deleteWarning.warningText}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteWarning(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, Eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
