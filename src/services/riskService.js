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
   * Actualiza un riesgo existente en el backend (PUT /api/riesgos/:id)
   */
  async updateRisk(id, updatedRisk) {
    const probability = Number(
      updatedRisk.probability ?? updatedRisk.prob ?? 3
    );
    const impact = Number(updatedRisk.impact ?? updatedRisk.impacto ?? 3);
    const score = calculateRiskScore(probability, impact);
    const nivel = updatedRisk.nivel || getRiskSeverity(score).label;

    const payload = {
      estandar: updatedRisk.estandar?.trim() || 'N/A',
      subestandar: updatedRisk.subestandar?.trim() || 'N/A',
      subestandar_id: updatedRisk.subestandar_id
        ? Number(updatedRisk.subestandar_id)
        : undefined,
      riesgo: (updatedRisk.title || updatedRisk.riesgo || '').trim(),
      descripcion: (
        updatedRisk.description ||
        updatedRisk.descripcion ||
        updatedRisk.title ||
        ''
      ).trim(),
      causa: (updatedRisk.causa || '').trim(),
      consec: (updatedRisk.consecuencia || updatedRisk.consec || '').trim(),
      factor: updatedRisk.factor || 'Interno',
      prob: probability,
      impacto: impact,
      nivel,
    };

    try {
      const response = await api.put(`/riesgos/${id}`, payload);
      const updated =
        response?.riesgo && typeof response.riesgo === 'object'
          ? response.riesgo
          : response;

      return normalizeRiskRecord({
        ...payload,
        ...updated,
        id: updated?.id ?? id,
        estandar:
          updated?.codigo_estandar || updated?.estandar || payload.estandar,
        subestandar:
          updated?.codigo_subestandar ||
          updated?.subestandar ||
          payload.subestandar,
      });
    } catch (error) {
      if (error.status && error.status !== 404) {
        throw new Error(
          error.message || 'Error al actualizar el riesgo en el servidor'
        );
      }

      return normalizeRiskRecord({
        ...payload,
        id,
      });
    }
  },

  /**
   * Elimina un riesgo en el backend (DELETE /api/riesgos/:id)
   */
  async deleteRisk(id) {
    try {
      await api.delete(`/riesgos/${id}`);
    } catch (error) {
      if (error.status && error.status !== 404) {
        throw new Error(
          error.message || 'Error al eliminar el riesgo en el servidor'
        );
      }
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

  /**
   * Obtiene todos los riesgos asociados a una lista de estándares seleccionados
   * consultando el endpoint POST /api/riesgos/por-estandares (con respaldo local).
   */
  async fetchRisksByEstandares(
    selectedEstandares = [],
    { allRisks = [], subestandares = [] } = {}
  ) {
    const estandarIds = selectedEstandares
      .map((e) => Number(e.id))
      .filter((id) => !isNaN(id) && id > 0);
    const codigosEstandar = selectedEstandares
      .map((e) => (e.codigo_estandar || '').trim())
      .filter(Boolean);

    try {
      const response = await api.post('/riesgos/por-estandares', {
        estandar_ids: estandarIds,
        codigos_estandar: codigosEstandar,
      });

      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.riesgos)
        ? response.riesgos
        : null;

      if (list) {
        return list.map((item, idx) => normalizeRiskRecord(item, idx));
      }
    } catch {
      // Fallback a filtrado sobre el catálogo disponible en cliente si el endpoint no responde
    }

    const estIdSet = new Set(estandarIds.map(String));
    const estCodeSet = new Set(codigosEstandar);

    const matchingSubs = (
      subestandares.length > 0 ? subestandares : this.getSubestandares()
    ).filter(
      (s) =>
        (s.estandar_id !== undefined &&
          s.estandar_id !== null &&
          estIdSet.has(String(s.estandar_id))) ||
        (s.codigo_estandar && estCodeSet.has(s.codigo_estandar.trim()))
    );

    const subById = new Map();
    const subByCode = new Map();
    matchingSubs.forEach((s) => {
      if (s.id !== undefined && s.id !== null) {
        subById.set(String(s.id), s);
      }
      if (s.codigo_subestandar) {
        subByCode.set(s.codigo_subestandar.trim(), s);
      }
    });

    const estById = new Map();
    selectedEstandares.forEach((e) => {
      if (e.id !== undefined && e.id !== null) {
        estById.set(String(e.id), e);
      }
    });

    const sourceRisks = allRisks.length > 0 ? allRisks : this.getRisks();

    return sourceRisks
      .filter((r) => {
        const rEstCode = (r.codigo_estandar || r.estandar || '').trim();
        const rSubCode = (r.codigo_subestandar || r.subestandar || '').trim();

        if (rEstCode && estCodeSet.has(rEstCode)) return true;
        if (
          r.estandar_id !== undefined &&
          r.estandar_id !== null &&
          estIdSet.has(String(r.estandar_id))
        ) {
          return true;
        }
        if (
          r.subestandar_id !== undefined &&
          r.subestandar_id !== null &&
          subById.has(String(r.subestandar_id))
        ) {
          return true;
        }
        if (rSubCode && subByCode.has(rSubCode)) {
          return true;
        }
        return false;
      })
      .map((r, idx) => {
        const matchedSub =
          (r.subestandar_id && subById.get(String(r.subestandar_id))) ||
          subByCode.get((r.codigo_subestandar || r.subestandar || '').trim());
        const matchedEst =
          (matchedSub?.estandar_id &&
            estById.get(String(matchedSub.estandar_id))) ||
          (r.estandar_id && estById.get(String(r.estandar_id)));

        return normalizeRiskRecord(
          {
            ...r,
            codigo_estandar:
              r.codigo_estandar && r.codigo_estandar !== 'N/A'
                ? r.codigo_estandar
                : r.estandar && r.estandar !== 'N/A'
                ? r.estandar
                : matchedSub?.codigo_estandar ||
                  matchedEst?.codigo_estandar ||
                  'N/A',
            codigo_subestandar:
              r.codigo_subestandar && r.codigo_subestandar !== 'N/A'
                ? r.codigo_subestandar
                : r.subestandar && r.subestandar !== 'N/A'
                ? r.subestandar
                : matchedSub?.codigo_subestandar || 'N/A',
          },
          idx
        );
      });
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
   * Actualiza un Estándar existente (PUT /api/estandares/:id)
   */
  async updateEstandar(id, { codigo_estandar, descripcion }) {
    const payload = {
      codigo_estandar: String(codigo_estandar || '').trim(),
      descripcion: String(descripcion || '').trim(),
    };

    try {
      const response = await api.put(`/estandares/${id}`, payload);
      const updated = response?.estandar || response;
      if (updated && (updated.id || updated.codigo_estandar)) {
        return {
          id: updated.id ?? id,
          codigo_estandar: updated.codigo_estandar || payload.codigo_estandar,
          descripcion: updated.descripcion || payload.descripcion,
        };
      }
    } catch (error) {
      if (error.status && error.status !== 404) {
        throw new Error(error.message || 'Error al actualizar el estándar');
      }
    }

    return {
      id,
      codigo_estandar: payload.codigo_estandar,
      descripcion: payload.descripcion,
    };
  },

  /**
   * Elimina un Estándar existente (DELETE /api/estandares/:id)
   */
  async deleteEstandar(id) {
    try {
      await api.delete(`/estandares/${id}`);
    } catch (error) {
      if (error.status && error.status !== 404) {
        throw new Error(error.message || 'Error al eliminar el estándar');
      }
    }
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

  /**
   * Actualiza un Subestándar existente (PUT /api/subestandares/:id)
   */
  async updateSubestandar(
    id,
    { estandar_id, codigo_estandar, codigo_subestandar, descripcion }
  ) {
    const payload = {
      estandar_id: estandar_id ? Number(estandar_id) : undefined,
      codigo_estandar: String(codigo_estandar || '').trim(),
      codigo_subestandar: String(codigo_subestandar || '').trim(),
      descripcion: String(descripcion || '').trim(),
    };

    try {
      const response = await api.put(`/subestandares/${id}`, payload);
      const updated = response?.subestandar || response;
      if (updated && (updated.id || updated.codigo_subestandar)) {
        return {
          id: updated.id ?? id,
          estandar_id: Number(updated.estandar_id ?? payload.estandar_id),
          codigo_estandar: updated.codigo_estandar || payload.codigo_estandar,
          codigo_subestandar:
            updated.codigo_subestandar || payload.codigo_subestandar,
          descripcion: updated.descripcion || payload.descripcion,
        };
      }
    } catch (error) {
      if (error.status && error.status !== 404) {
        throw new Error(error.message || 'Error al actualizar el subestándar');
      }
    }

    return {
      id,
      estandar_id: payload.estandar_id,
      codigo_estandar: payload.codigo_estandar,
      codigo_subestandar: payload.codigo_subestandar,
      descripcion: payload.descripcion,
    };
  },

  /**
   * Elimina un Subestándar existente (DELETE /api/subestandares/:id)
   */
  async deleteSubestandar(id) {
    try {
      await api.delete(`/subestandares/${id}`);
    } catch (error) {
      if (error.status && error.status !== 404) {
        throw new Error(error.message || 'Error al eliminar el subestándar');
      }
    }
  },
};
