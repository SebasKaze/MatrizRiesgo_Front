import { api } from './api';
import { calculateRiskScore, getRiskSeverity } from '../utils/riskCalculations';

const STORAGE_KEY = 'matriz_riesgos_registrados';
const ESTANDARES_STORAGE_KEY = 'matriz_catalogo_estandares';
const SUBESTANDARES_STORAGE_KEY = 'matriz_catalogo_subestandares';

/**
 * Normaliza un registro de riesgo (proveniente de PostgreSQL o del formulario)
 * para asegurar compatibilidad entre las columnas de BD (riesgo, descripcion, consec, prob, impacto, nivel)
 * y las propiedades usadas en el frontend (title, description, consecuencia, probability, impact).
 */
export function normalizeRiskRecord(item = {}, index = 0) {
  const probability = Number(item.prob ?? item.probability ?? 3);
  const impact = Number(item.impacto ?? item.impact ?? 3);
  const score = calculateRiskScore(probability, impact);
  const computedSeverity = getRiskSeverity(score).label;

  const title = item.riesgo || item.title || 'Riesgo sin título';
  const description = item.descripcion || item.description || title;
  const causa = item.causa || 'Sin causa especificada';
  const consecuencia = item.consec || item.consecuencia || 'Sin consecuencia especificada';
  const factor = item.factor || 'Interno';
  const nivel = item.nivel || computedSeverity;
  const estandar = item.codigo_estandar || item.estandar || 'N/A';
  const subestandar =
    item.codigo_subestandar ||
    item.subestandar ||
    (item.subestandar_id ? String(item.subestandar_id) : 'N/A');

  return {
    ...item,
    id: item.id ?? `RSK-${index + 1}`,
    subestandar_id: item.subestandar_id ?? null,
    // Campos de visualización en tabla y formulario
    estandar,
    subestandar,
    title,
    description,
    causa,
    consecuencia,
    factor,
    probability,
    impact,
    nivel,
    category: item.category || item.categoria || 'Operacional',
    responsible: item.responsible || 'Asignado',
    // Campos espejo con nombres de columna de la tabla `riesgo` en BD
    riesgo: title,
    descripcion: description,
    consec: consecuencia,
    prob: probability,
    impacto: impact,
  };
}

export const riskService = {
  /**
   * Obtiene los riesgos registrados desde el backend (GET /api/riesgos).
   * Si el backend no está disponible, devuelve únicamente los riesgos guardados localmente (sin riesgos de prueba).
   */
  async fetchRisks() {
    try {
      const response = await api.get('/riesgos/verriesgos');
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.riesgos)
        ? response.riesgos
        : null;

      if (list) {
        const normalized = list.map((item, idx) => normalizeRiskRecord(item, idx));
        this.saveRisks(normalized);
        return { data: normalized, source: 'DATABASE_API' };
      }
    } catch {
      // Backend offline o endpoint aún no disponible
    }

    return { data: this.getRisks(), source: 'LOCAL_STORAGE' };
  },

  /**
   * Obtiene los riesgos almacenados localmente (sin datos de prueba)
   */
  getRisks: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map((item, idx) => normalizeRiskRecord(item, idx));
        }
      }
    } catch {
      // Error de lectura en localStorage
    }
    return [];
  },

  saveRisks: (risks) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(risks));
    } catch {
      // Ignorar errores de cuota
    }
  },

  /**
   * Registra un nuevo riesgo en el backend (POST /api/riesgos)
   */
  async createRisk(newRisk) {
    const probability = Number(newRisk.probability ?? newRisk.prob ?? 3);
    const impact = Number(newRisk.impact ?? newRisk.impacto ?? 3);
    const score = calculateRiskScore(probability, impact);
    const nivel = newRisk.nivel || getRiskSeverity(score).label;

    const payload = {
      estandar: newRisk.estandar?.trim() || 'N/A',
      subestandar: newRisk.subestandar?.trim() || 'N/A',
      subestandar_id: newRisk.subestandar_id ? Number(newRisk.subestandar_id) : undefined,
      riesgo: (newRisk.title || newRisk.riesgo || '').trim(),
      descripcion: (newRisk.description || newRisk.descripcion || newRisk.title || '').trim(),
      causa: (newRisk.causa || '').trim(),
      consec: (newRisk.consecuencia || newRisk.consec || '').trim(),
      factor: newRisk.factor || 'Interno',
      prob: probability,
      impacto: impact,
      nivel,
    };

    try {
      const response = await api.post('/riesgos/registrarnuevo', payload);
      const created = response?.riesgo && typeof response.riesgo === 'object'
        ? response.riesgo
        : response;

      return normalizeRiskRecord({
        ...payload,
        ...created,
        estandar: created?.codigo_estandar || created?.estandar || payload.estandar,
        subestandar: created?.codigo_subestandar || created?.subestandar || payload.subestandar,
      });
    } catch (error) {
      // Si el backend respondió con un error de validación/servidor (status HTTP), lo propagamos
      if (error.status) {
        throw new Error(error.message || 'Error al registrar el riesgo en el servidor');
      }

      // Si el backend está apagado, se registra localmente para poder visualizarlo de inmediato
      return normalizeRiskRecord({
        ...payload,
        id: `RSK-${String(Date.now()).slice(-4)}`,
      });
    }
  },

  /**
   * Elimina un riesgo en el backend si está activo
   */
  async deleteRisk(id) {
    try {
      await api.delete(`/riesgos/${id}`);
    } catch {
      // Backend no disponible
    }
  },

  resetDefaults: () => {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  },

  /**
   * Obtiene el catálogo de estándares desde el backend (GET /api/estandares) o almacenamiento local
   */
  async fetchEstandares() {
    try {
      const response = await api.get('/estandares');
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.estandares)
        ? response.estandares
        : null;
      if (list) {
        this.saveEstandares(list);
        return list;
      }
    } catch {
      // Backend offline o endpoint en construcción
    }
    return this.getEstandares();
  },

  getEstandares: () => {
    try {
      const stored = localStorage.getItem(ESTANDARES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveEstandares: (list) => {
    try {
      localStorage.setItem(ESTANDARES_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  },

  /**
   * Registra un nuevo Estándar (POST /api/estandares)
   */
  async createEstandar({ codigo_estandar, descripcion }) {
    const payload = {
      codigo_estandar: codigo_estandar.trim(),
      descripcion: descripcion.trim(),
    };

    try {
      const response = await api.post('/estandares', payload);
      const created = response?.estandar || response;
      if (created && (created.id || created.codigo_estandar)) {
        return {
          id: created.id ?? Date.now(),
          codigo_estandar: created.codigo_estandar || payload.codigo_estandar,
          descripcion: created.descripcion || payload.descripcion,
        };
      }
    } catch (error) {
      if (error.status) {
        throw new Error(error.message || 'Error al registrar el estándar');
      }
    }

    return {
      id: Date.now(),
      codigo_estandar: payload.codigo_estandar,
      descripcion: payload.descripcion,
    };
  },

  /**
   * Obtiene el catálogo de subestándares desde el backend (GET /api/subestandares) o almacenamiento local
   */
  async fetchSubestandares() {
    try {
      const response = await api.get('/subestandares');
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.subestandares)
        ? response.subestandares
        : null;
      if (list) {
        this.saveSubestandares(list);
        return list;
      }
    } catch {
      // Backend offline o endpoint en construcción
    }
    return this.getSubestandares();
  },

  getSubestandares: () => {
    try {
      const stored = localStorage.getItem(SUBESTANDARES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveSubestandares: (list) => {
    try {
      localStorage.setItem(SUBESTANDARES_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  },

  /**
   * Registra un nuevo Subestándar asociado a un Estándar (POST /api/subestandares)
   */
  async createSubestandar({
    estandar_id,
    codigo_estandar,
    codigo_subestandar,
    descripcion,
  }) {
    const payload = {
      estandar_id: Number(estandar_id),
      codigo_estandar,
      codigo_subestandar: codigo_subestandar.trim(),
      descripcion: descripcion.trim(),
    };

    try {
      const response = await api.post('/subestandares', payload);
      const created = response?.subestandar || response;
      if (created && (created.id || created.codigo_subestandar)) {
        return {
          id: created.id ?? Date.now(),
          estandar_id: Number(created.estandar_id ?? payload.estandar_id),
          codigo_estandar: created.codigo_estandar || payload.codigo_estandar,
          codigo_subestandar:
            created.codigo_subestandar || payload.codigo_subestandar,
          descripcion: created.descripcion || payload.descripcion,
        };
      }
    } catch (error) {
      if (error.status) {
        throw new Error(error.message || 'Error al registrar el subestándar');
      }
    }

    return {
      id: Date.now(),
      estandar_id: payload.estandar_id,
      codigo_estandar: payload.codigo_estandar,
      codigo_subestandar: payload.codigo_subestandar,
      descripcion: payload.descripcion,
    };
  },
};
