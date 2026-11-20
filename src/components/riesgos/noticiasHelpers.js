const NOTICIAS_STORAGE_KEY = 'matriz_catalogo_noticias';
export const DEFAULT_FECHA_HOY = new Date().toISOString().split('T')[0];

export const FUENTES_NORMATIVAS = [
  {
    id: 'fuente-1',
    codigo: 'ISO 31000:2018',
    titulo: 'Gestión del Riesgo — Directrices',
    descripcion:
      'Estándar internacional que proporciona principios, el marco de referencia y el proceso para gestionar cualquier tipo de riesgo de forma sistemática.',
  },
  {
    id: 'fuente-2',
    codigo: 'ISO/IEC 27005',
    titulo: 'Gestión de Riesgos de Seguridad de la Información',
    descripcion:
      'Directrices para la identificación de activos, amenazas, vulnerabilidades y evaluación de riesgos tecnológicos y de seguridad de la información.',
  },
  {
    id: 'fuente-3',
    codigo: 'COSO ERM',
    titulo: 'Marco Integrado de Gestión de Riesgos Empresariales',
    descripcion:
      'Referencia para el control interno, alineación estratégica, gobierno corporativo y evaluación de factores internos y externos.',
  },
  {
    id: 'fuente-4',
    codigo: 'NOM / ISO 9001 / ISO 45001',
    titulo: 'Normatividad Oficial y Estándares de Calidad y Seguridad Operativa',
    descripcion:
      'Lineamientos regulatorios y estándares de gestión aplicables a la continuidad operativa, seguridad en el trabajo y cumplimiento normativo.',
  },
];

const INITIAL_NOTICIAS = [
  {
    id: 1,
    nombre:
      'Fortalecimiento de controles en cadena de suministro y cumplimiento aduanero',
    area: 'Logística y Aduanas',
    fecha: '2026-11-15',
    texto:
      'Se recomienda revisar periódicamente los estándares asociados a seguridad en la cadena logística, trazabilidad de socios comerciales y evaluación de riesgos de terceros.',
    estandar_id: null,
    codigo_estandar: '1',
  },
  {
    id: 2,
    nombre:
      'Nuevas directrices para gestión de riesgos tecnológicos e integridad de datos',
    area: 'Seguridad TI',
    fecha: '2026-10-28',
    texto:
      'Integración de medidas preventivas ante incidentes cibernéticos, respaldos críticos y continuidad de negocio bajo los marcos ISO/IEC 27005 e ISO 22301.',
    estandar_id: null,
    codigo_estandar: '2',
  },
  {
    id: 3,
    nombre:
      'Evaluación periódica de matrices de riesgo por estándar y subestándar',
    area: 'Cumplimiento Normativo',
    fecha: '2026-09-10',
    texto:
      'Mantener clasificados y ordenados los riesgos por estándar y subestándar facilita las auditorías internas y la asignación oportuna de planes de mitigación.',
    estandar_id: null,
    codigo_estandar: '3',
  },
];

export function normalizeNoticiaRecord(item = {}, index = 0) {
  const rawFecha = item.fecha ? String(item.fecha) : DEFAULT_FECHA_HOY;
  const formattedFecha = rawFecha.includes('T')
    ? rawFecha.split('T')[0]
    : rawFecha;

  return {
    id: item.id ?? index + 1,
    nombre:
      item.nombre || item.nombre_noticia || item.titulo || 'Noticia sin título',
    area: item.area || item.categoria || 'General',
    fecha: formattedFecha,
    texto: item.texto || item.resumen || item.descripcion || '',
    estandar_id: item.estandar_id ?? null,
    codigo_estandar: item.codigo_estandar || item.estandar || 'General',
  };
}

export function getStoredNoticias() {
  try {
    const stored = localStorage.getItem(NOTICIAS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.map((n, i) => normalizeNoticiaRecord(n, i));
      }
    }
  } catch {
    // ignore storage errors
  }
  return INITIAL_NOTICIAS.map((n, i) => normalizeNoticiaRecord(n, i));
}

export function saveStoredNoticias(list) {
  try {
    localStorage.setItem(NOTICIAS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

// Comparador natural para códigos de Estándar y Subestándar (ej. "1", "2", "10", "1.1", "1.2", "1.10", "EST-01")
export function compareNaturalCodes(valA, valB, direction = 'asc') {
  const strA = String(valA || '').trim();
  const strB = String(valB || '').trim();

  const isEmptyA = !strA || strA.toUpperCase() === 'N/A';
  const isEmptyB = !strB || strB.toUpperCase() === 'N/A';

  if (isEmptyA && isEmptyB) return 0;
  if (isEmptyA) return 1;
  if (isEmptyB) return -1;

  const cmp = strA.localeCompare(strB, undefined, {
    numeric: true,
    sensitivity: 'base',
  });

  return direction === 'desc' ? -cmp : cmp;
}
