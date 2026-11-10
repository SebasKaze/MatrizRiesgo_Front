import { api, tokenStorage } from './api';

const USER_STORAGE_KEY = 'matriz_auth_user';
const SOURCE_STORAGE_KEY = 'matriz_auth_source';

/**
 * Decodifica el payload de un token JWT (sin verificar firma en cliente)
 * para extraer { id, empresa_id, rol, exp }.
 */
export function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== 'string' || !token.includes('.')) {
      return null;
    }
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Verifica si un token JWT ha expirado
 */
export function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

/**
 * Normaliza el objeto usuario recibido del backend junto con los datos del JWT
 * para conservar los campos de BD (id, nombre, empresa_id, correo, rol)
 * y mantener compatibilidad con los componentes visuales (name, email, role, roleCode, avatar, color).
 */
function normalizeBackendUser(rawUser = {}, token, correoInput = '') {
  const decoded = decodeJwtPayload(token) || {};
  const id = rawUser.id ?? decoded.id;
  const nombre = rawUser.nombre || rawUser.name || 'Usuario';
  const empresa_id = rawUser.empresa_id ?? decoded.empresa_id ?? null;
  const rol = rawUser.rol || rawUser.tipo_rol || decoded.rol || 'Empresa';
  const correo = rawUser.correo || rawUser.email || correoInput;

  const initials =
    nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'US';

  const isAdmin = String(rol).toLowerCase() === 'admin';

  return {
    // Campos del backend y base de datos
    id,
    nombre,
    empresa_id,
    correo,
    rol,
    // Campos de compatibilidad con la interfaz (Navbar / Sidebar)
    name: nombre,
    email: correo,
    role: isAdmin ? 'Administrador' : rol,
    roleCode: String(rol).toUpperCase(),
    avatar: initials,
    color: isAdmin ? 'bg-indigo-600' : 'bg-emerald-600',
  };
}

export const authService = {
  /**
   * Autentica contra el backend en POST /api/login
   * enviando { correo, password }.
   * Recibe { mensaje, token, usuario: { id, nombre, empresa_id } }.
   */
  async login({ correo, email, password }) {
    const rawCorreo = correo || email || '';
    const cleanCorreo = rawCorreo.trim();

    try {
      const response = await api.post('/login', {
        correo: cleanCorreo,
        password,
      });

      const backendUser = response?.usuario || response?.user;
      if (response && response.token && backendUser) {
        const user = normalizeBackendUser(backendUser, response.token, cleanCorreo);

        tokenStorage.set(response.token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        localStorage.setItem(SOURCE_STORAGE_KEY, 'DATABASE_API');

        return {
          user,
          token: response.token,
          mensaje: response.mensaje || 'Autenticación exitosa',
          source: 'DATABASE_API',
        };
      }

      throw new Error('Respuesta de autenticación inválida del servidor.');
    } catch (error) {
      if (error.status) {
        throw new Error(error.message || 'Credenciales inválidas');
      }
      throw new Error(
        'No se pudo establecer conexión con el servidor. Verifica tu conexión o intenta más tarde.'
      );
    }
  },

  /**
   * Recupera la sesión almacenada validando que el token exista y no haya expirado
   */
  getSession() {
    try {
      const token = tokenStorage.get();
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      const storedSource = localStorage.getItem(SOURCE_STORAGE_KEY);

      if (!token || !storedUser || token.startsWith('mock-jwt-token-')) {
        this.logout();
        return { user: null, token: null, source: null };
      }

      if (isTokenExpired(token)) {
        this.logout();
        return { user: null, token: null, source: null };
      }

      const user = JSON.parse(storedUser);
      const source = storedSource || 'DATABASE_API';

      return { user, token, source };
    } catch {
      return { user: null, token: null, source: null };
    }
  },

  getCurrentUser() {
    return this.getSession().user;
  },

  getToken() {
    return this.getSession().token;
  },

  logout() {
    tokenStorage.clear();
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(SOURCE_STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};
