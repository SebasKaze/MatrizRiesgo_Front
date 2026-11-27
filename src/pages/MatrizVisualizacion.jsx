import { useState, useMemo, useEffect } from 'react';
import { useRiskContext } from '../hooks/useRiskContext';
import { useAuth } from '../hooks/useAuth';
import { api, tokenStorage } from '../services/api';
import { riskService } from '../services/riskService';
import { ACTIVE_MATRIZ_STORAGE_KEY } from './Matrices';
import { getMatrixZoneEvaluation } from '../utils/riskCalculations';
import { MatrizHeaderPanel } from '../components/matrix/MatrizHeaderPanel';
import { MatrizFilterBar } from '../components/matrix/MatrizFilterBar';
import { MatrizTable } from '../components/matrix/MatrizTable';
import { MatrizRiskModal } from '../components/matrix/MatrizRiskModal';
import { MatrizStandardsModal } from '../components/matrix/MatrizStandardsModal';
import { Save, RefreshCw, FileSpreadsheet, Lock, X } from 'lucide-react';

// Fecha predeterminada de análisis
const DEFAULT_FECHA_ANALISIS = new Date().toISOString().split('T')[0];
const MATRICES_STORAGE_KEY = 'matrices_empresa_storage';
const MATRICES_BLOQUEADAS_STORAGE_KEY = 'matrices_bloqueadas_storage';
const getMatrizDatosStorageKey = (matrizId) => `matriz_datos_${matrizId}`;

function getBlockedMatricesMap() {
  try {
    const raw = localStorage.getItem(MATRICES_BLOQUEADAS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function markMatrizAsBlockedInStorage(matrizId) {
  if (!matrizId) return;
  try {
    const map = getBlockedMatricesMap();
    map[String(matrizId)] = true;
    localStorage.setItem(MATRICES_BLOQUEADAS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

function isMatrizBlockedInStorage(matrizId) {
  if (!matrizId) return false;
  const map = getBlockedMatricesMap();
  return Boolean(map[String(matrizId)]);
}

// Transforma un riesgo del catálogo general (proveniente de /api/riesgos/verriesgos o /api/riesgos/por-estandares)
// o de matriz_datos guardados al formato de 3 Etapas con Estándar y Subestándar separados
function mapCatalogRiskToMatrixRow(
  r,
  idx = 0,
  { estandares = [], subestandares = [] } = {}
) {
  const rawEstCode =
    r.codigo_estandar && r.codigo_estandar !== 'N/A'
      ? String(r.codigo_estandar).trim()
      : r.estandar && r.estandar !== 'N/A'
      ? String(r.estandar).trim()
      : '';

  const rawSubCode =
    r.codigo_subestandar && r.codigo_subestandar !== 'N/A'
      ? String(r.codigo_subestandar).trim()
      : r.subestandar && r.subestandar !== 'N/A'
      ? String(r.subestandar).trim()
      : '';

  // Resolver por subestandar_id / estandar_id si provienen de la BD
  const matchedSub =
    (r.subestandar_id !== undefined &&
      r.subestandar_id !== null &&
      subestandares.find((s) => String(s.id) === String(r.subestandar_id))) ||
    (rawSubCode &&
      subestandares.find(
        (s) =>
          String(s.codigo_subestandar).trim().toLowerCase() ===
          rawSubCode.toLowerCase()
      )) ||
    null;

  const targetEstId = r.estandar_id ?? matchedSub?.estandar_id ?? null;
  const matchedEst =
    (targetEstId !== undefined &&
      targetEstId !== null &&
      estandares.find((e) => String(e.id) === String(targetEstId))) ||
    (rawEstCode &&
      estandares.find(
        (e) =>
          String(e.codigo_estandar).trim().toLowerCase() ===
          rawEstCode.toLowerCase()
      )) ||
    null;

  const estandar =
    rawEstCode ||
    matchedSub?.codigo_estandar ||
    matchedEst?.codigo_estandar ||
    (r.numeral && String(r.numeral).includes('.')
      ? String(r.numeral).split('.')[0]
      : r.numeral && r.numeral !== 'N/A'
      ? String(r.numeral)
      : 'N/A');

  const subestandar =
    rawSubCode ||
    matchedSub?.codigo_subestandar ||
    (r.numeral && r.numeral !== 'N/A'
      ? String(r.numeral)
      : r.subestandar_id
      ? String(r.subestandar_id)
      : 'N/A');

  const contexto =
    r.contexto ||
    (r.factor === 'Interno' || r.factor === 'Externo'
      ? r.factor
      : 'Contexto interno / Externo');

  const proceso =
    r.proceso || r.category || r.categoria || 'Análisis de riesgo';

  const probability = Number(
    r.probabilidadEtapa1 ?? r.prob ?? r.probability ?? 3
  );
  const impact = Number(r.impactoEtapa1 ?? r.impacto ?? r.impact ?? 3);
  const eval1 = getMatrixZoneEvaluation(probability, impact);

  const controlesImplementados =
    r.controlesImplementados || r.planAccion || 'N/A';
  const probabilidadEtapa2 =
    r.probabilidadEtapa2 ?? r.nuevaProbabilidad ?? 'N/A';
  const impactoEtapa2 = r.impactoEtapa2 ?? r.nuevoImpacto ?? 'N/A';
  const eval2 = getMatrixZoneEvaluation(probabilidadEtapa2, impactoEtapa2);

  const controlesComplementarios =
    r.controlesComplementarios || r.mitigacion || 'N/A';
  const probabilidadEtapa3 = r.probabilidadEtapa3 ?? 'N/A';
  const impactoEtapa3 = r.impactoEtapa3 ?? 'N/A';
  const eval3 = getMatrixZoneEvaluation(probabilidadEtapa3, impactoEtapa3);

  const seguimientoRevision =
    r.seguimientoRevision || r.seguimiento || 'N/A';
  const responsable =
    r.responsable ||
    (r.responsible && r.responsible !== 'Asignado' ? r.responsible : 'N/A');

  return {
    id: r.id || `RSK-${idx + 1}`,
    estandar_id: r.estandar_id ?? matchedEst?.id ?? matchedSub?.estandar_id ?? null,
    subestandar_id: r.subestandar_id ?? matchedSub?.id ?? null,
    estandar,
    codigo_estandar: estandar,
    subestandar,
    codigo_subestandar: subestandar,
    contexto,
    factor: r.factor || contexto,
    proceso,
    category: proceso,
    title: r.riesgo || r.title || 'Sin título',
    description: r.descripcion || r.description || r.riesgo || r.title || '',
    causa: r.causas || r.causa || 'N/A',
    consecuencia: r.consecuencias || r.consec || r.consecuencia || 'N/A',
    // Etapa 1: Evaluación Inicial
    probability,
    impact,
    gradoRiesgoEtapa1: eval1.score,
    zonaRiesgoEtapa1: eval1.zona,
    // Etapa 2: Controles Implementados y Reevaluación
    controlesImplementados,
    probabilidadEtapa2,
    impactoEtapa2,
    gradoRiesgoEtapa2: eval2.hasValue ? eval2.score : 'N/A',
    zonaRiesgoEtapa2: eval2.hasValue ? eval2.zona : 'N/A',
    // Etapa 3: Controles Complementarios, Riesgo Residual y Seguimiento
    controlesComplementarios,
    probabilidadEtapa3,
    impactoEtapa3,
    gradoRiesgoEtapa3: eval3.hasValue ? eval3.score : 'N/A',
    zonaRiesgoEtapa3: eval3.hasValue ? eval3.zona : 'N/A',
    seguimientoRevision,
    responsable,
    // Campos espejo para compatibilidad
    fechaAnalisis: r.fechaAnalisis || DEFAULT_FECHA_ANALISIS,
    planAccion: controlesImplementados,
    mitigacion: controlesComplementarios,
    nuevaProbabilidad: probabilidadEtapa2,
    nuevoImpacto: impactoEtapa2,
    nuevoNivelRiesgo: eval2.hasValue
      ? `${eval2.zona} (${eval2.score})`
      : r.nuevoNivelRiesgo || 'N/A',
    fechaTratamiento: r.fechaTratamiento || 'N/A',
  };
}

export function MatrizVisualizacion({ selectedMatriz = null, onBack }) {
  const {
    allRisks,
    estandares = [],
    subestandares = [],
    isLoadingRisks,
    refreshRisks,
  } = useRiskContext();
  const { user } = useAuth();

  // Resolver si estamos editando una matriz existente o creando una nueva
  const activeMatriz = useMemo(() => {
    if (selectedMatriz) return selectedMatriz;
    try {
      const stored = localStorage.getItem(ACTIVE_MATRIZ_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, [selectedMatriz]);

  // Metadatos de la tabla `matriz`
  const [currentMatrizId, setCurrentMatrizId] = useState(
    activeMatriz?.id || null
  );
  const [identificador, setIdentificador] = useState(
    activeMatriz?.identificador || ''
  );
  const [versionMatriz, setVersionMatriz] = useState(
    Number(activeMatriz?.version_matriz) || 1
  );
  const [isMatrizBloqueada, setIsMatrizBloqueada] = useState(() =>
    Boolean(
      activeMatriz?.bloqueada ||
        activeMatriz?.matriz_bloqueada ||
        isMatrizBlockedInStorage(activeMatriz?.id)
    )
  );
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isBlockingMatriz, setIsBlockingMatriz] = useState(false);

  const isCreatingNew = !activeMatriz && !currentMatrizId;

  // Pop-up inicial de selección de estándares: únicamente aparece cuando se crea una matriz nueva
  const [isStandardsModalOpen, setIsStandardsModalOpen] = useState(
    () => !activeMatriz
  );

  // Lista de riesgos que existen únicamente dentro de esta matriz
  const [risks, setRisks] = useState([]);
  const [isLoadingDatos, setIsLoadingDatos] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Estado de envío a la BD (`matriz` -> `matriz_datos`) y exportación a Excel
  const [isSavingMatriz, setIsSavingMatriz] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(null);

  // Al abrir el pop-up de nueva matriz, sincronizar estándares y riesgos de la BD
  useEffect(() => {
    if (isCreatingNew && refreshRisks) {
      refreshRisks();
    }
  }, [isCreatingNew, refreshRisks]);

  // Si estamos editando una matriz existente, cargar sus datos desde `matriz_datos`
  useEffect(() => {
    if (!activeMatriz?.id) return;

    let isMounted = true;
    setIsLoadingDatos(true);
    setCurrentMatrizId(activeMatriz.id);
    setIdentificador(activeMatriz.identificador || '');
    setVersionMatriz(Number(activeMatriz.version_matriz) || 1);

    const initialBlocked = Boolean(
      activeMatriz.bloqueada ||
        activeMatriz.matriz_bloqueada ||
        isMatrizBlockedInStorage(activeMatriz.id)
    );
    setIsMatrizBloqueada(initialBlocked);

    const detectBlockedFromRows = (rows) => {
      if (!Array.isArray(rows) || rows.length === 0) return initialBlocked;
      const anyMarkedBlocked = rows.some((r) =>
        Boolean(r?.matriz_bloqueada || r?.bloqueada)
      );
      if (anyMarkedBlocked) {
        markMatrizAsBlockedInStorage(activeMatriz.id);
        return true;
      }
      return initialBlocked;
    };

    const loadExistingMatrixData = async () => {
      try {
        const response = await api.get(`/matriz_datos/${activeMatriz.id}`);
        const rawDatos = Array.isArray(response)
          ? response
          : Array.isArray(response?.datos)
          ? response.datos
          : Array.isArray(response?.matriz_datos?.datos)
          ? response.matriz_datos.datos
          : null;

        if (isMounted && rawDatos) {
          setRisks(
            rawDatos.map((r, i) =>
              mapCatalogRiskToMatrixRow(r, i, { estandares, subestandares })
            )
          );
          setIsMatrizBloqueada(detectBlockedFromRows(rawDatos));
          setHasUnsavedChanges(false);
          setIsLoadingDatos(false);
          return;
        }
      } catch {
        // Fallback a localStorage si el servidor está offline
      }

      if (!isMounted) return;
      try {
        const localDatos = localStorage.getItem(
          getMatrizDatosStorageKey(activeMatriz.id)
        );
        if (localDatos) {
          const parsed = JSON.parse(localDatos);
          if (Array.isArray(parsed)) {
            setRisks(
              parsed.map((r, i) =>
                mapCatalogRiskToMatrixRow(r, i, { estandares, subestandares })
              )
            );
            setIsMatrizBloqueada(detectBlockedFromRows(parsed));
          }
        } else if (Array.isArray(activeMatriz.datos)) {
          setRisks(
            activeMatriz.datos.map((r, i) =>
              mapCatalogRiskToMatrixRow(r, i, { estandares, subestandares })
            )
          );
          setIsMatrizBloqueada(detectBlockedFromRows(activeMatriz.datos));
        }
        setHasUnsavedChanges(false);
      } catch {
        // ignore
      } finally {
        if (isMounted) setIsLoadingDatos(false);
      }
    };

    loadExistingMatrixData();

    return () => {
      isMounted = false;
    };
  }, [activeMatriz, estandares, subestandares]);

  const handleIdentificadorChange = (val) => {
    if (isMatrizBloqueada) return;
    setIdentificador(val);
    setHasUnsavedChanges(true);
    setSaveFeedback(null);
  };

  // Precargar en la matriz nueva todos los riesgos asociados a los estándares seleccionados
  const handleConfirmStandards = async (selectedStandards = []) => {
    setSaveFeedback(null);
    const associatedRisks = await riskService.fetchRisksByEstandares(
      selectedStandards,
      { allRisks, subestandares }
    );

    const mappedRows = associatedRisks.map((r, idx) =>
      mapCatalogRiskToMatrixRow(r, idx, { estandares, subestandares })
    );

    setRisks(mappedRows);
    setHasUnsavedChanges(mappedRows.length > 0);
    setIsStandardsModalOpen(false);

    const standardCodes = selectedStandards
      .map((s) => s.codigo_estandar)
      .join(', ');

    setSaveFeedback({
      type: 'success',
      message:
        mappedRows.length > 0
          ? `Se precargaron ${mappedRows.length} ${
              mappedRows.length === 1 ? 'riesgo asociado' : 'riesgos asociados'
            } a los estándares seleccionados (${standardCodes}).`
          : `Se seleccionaron los estándares (${standardCodes}), pero aún no tienen riesgos registrados en el catálogo.`,
    });
  };

  // Filtros de visualización en tabla
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstandar, setSelectedEstandar] = useState('Todos');
  const [selectedFactor, setSelectedFactor] = useState('Todos');
  const [treatmentFilter, setTreatmentFilter] = useState('Todos');

  // Estado para el modal de agregar o editar riesgo dentro de la matriz (3 Etapas)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState(null);

  const [formData, setFormData] = useState({
    estandar: 'N/A',
    codigo_estandar: 'N/A',
    subestandar: 'N/A',
    codigo_subestandar: 'N/A',
    contexto: 'Contexto interno / Externo',
    factor: 'Contexto interno / Externo',
    proceso: 'Análisis de riesgo',
    category: 'Análisis de riesgo',
    title: '',
    description: '',
    causa: '',
    consecuencia: '',
    probability: 2,
    impact: 5,
    controlesImplementados: 'N/A',
    probabilidadEtapa2: 'N/A',
    impactoEtapa2: 'N/A',
    controlesComplementarios: 'N/A',
    probabilidadEtapa3: 'N/A',
    impactoEtapa3: 'N/A',
    seguimientoRevision: 'N/A',
    responsable: 'N/A',
    fechaAnalisis: DEFAULT_FECHA_ANALISIS,
    planAccion: 'N/A',
    mitigacion: 'N/A',
    nuevaProbabilidad: 'N/A',
    nuevoImpacto: 'N/A',
    fechaTratamiento: 'N/A',
  });

  const handleOpenCreateModal = () => {
    if (isMatrizBloqueada) return;
    setEditingRisk(null);
    setFormData({
      estandar: '',
      codigo_estandar: '',
      subestandar: '',
      codigo_subestandar: '',
      contexto: 'Contexto interno / Externo',
      factor: 'Contexto interno / Externo',
      proceso: 'Análisis de riesgo',
      category: 'Análisis de riesgo',
      title: '',
      description: '',
      causa: '',
      consecuencia: '',
      probability: 2,
      impact: 5,
      controlesImplementados: 'N/A',
      probabilidadEtapa2: 'N/A',
      impactoEtapa2: 'N/A',
      controlesComplementarios: 'N/A',
      probabilidadEtapa3: 'N/A',
      impactoEtapa3: 'N/A',
      seguimientoRevision: 'N/A',
      responsable: 'Staff y/o Comité de Seguridad OEA - Dirección',
      fechaAnalisis: DEFAULT_FECHA_ANALISIS,
      planAccion: 'N/A',
      mitigacion: 'N/A',
      nuevaProbabilidad: 'N/A',
      nuevoImpacto: 'N/A',
      fechaTratamiento: 'N/A',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (risk) => {
    if (isMatrizBloqueada) return;
    setEditingRisk(risk);
    const estVal =
      risk.codigo_estandar && risk.codigo_estandar !== 'N/A'
        ? risk.codigo_estandar
        : risk.estandar && risk.estandar !== 'N/A'
        ? risk.estandar
        : risk.numeral && String(risk.numeral).includes('.')
        ? String(risk.numeral).split('.')[0]
        : 'N/A';

    const subVal =
      risk.codigo_subestandar && risk.codigo_subestandar !== 'N/A'
        ? risk.codigo_subestandar
        : risk.subestandar && risk.subestandar !== 'N/A'
        ? risk.subestandar
        : risk.numeral || 'N/A';

    const contextoVal =
      risk.contexto ||
      (risk.factor === 'Interno' || risk.factor === 'Externo'
        ? risk.factor
        : 'Contexto interno / Externo');
    const procesoVal = risk.proceso || risk.category || 'Análisis de riesgo';
    const controlesImplVal =
      risk.controlesImplementados ?? risk.planAccion ?? 'N/A';
    const prob2Val = risk.probabilidadEtapa2 ?? risk.nuevaProbabilidad ?? 'N/A';
    const imp2Val = risk.impactoEtapa2 ?? risk.nuevoImpacto ?? 'N/A';
    const controlesCompVal =
      risk.controlesComplementarios ?? risk.mitigacion ?? 'N/A';
    const prob3Val = risk.probabilidadEtapa3 ?? 'N/A';
    const imp3Val = risk.impactoEtapa3 ?? 'N/A';

    setFormData({
      estandar: estVal,
      codigo_estandar: estVal,
      subestandar: subVal,
      codigo_subestandar: subVal,
      contexto: contextoVal,
      factor: risk.factor || contextoVal,
      proceso: procesoVal,
      category: procesoVal,
      title: risk.title || '',
      description: risk.description || '',
      causa: risk.causa || '',
      consecuencia: risk.consecuencia || '',
      probability: Number(risk.probability) || 3,
      impact: Number(risk.impact) || 3,
      controlesImplementados: controlesImplVal,
      probabilidadEtapa2: prob2Val,
      impactoEtapa2: imp2Val,
      controlesComplementarios: controlesCompVal,
      probabilidadEtapa3: prob3Val,
      impactoEtapa3: imp3Val,
      seguimientoRevision: risk.seguimientoRevision || 'N/A',
      responsable: risk.responsable || 'N/A',
      fechaAnalisis: risk.fechaAnalisis || DEFAULT_FECHA_ANALISIS,
      planAccion: controlesImplVal,
      mitigacion: controlesCompVal,
      nuevaProbabilidad: prob2Val,
      nuevoImpacto: imp2Val,
      fechaTratamiento: risk.fechaTratamiento || 'N/A',
    });
    setIsModalOpen(true);
  };

  const handleSaveRisk = (e) => {
    e.preventDefault();
    if (isMatrizBloqueada || !formData.title.trim()) return;

    const eval1 = getMatrixZoneEvaluation(
      formData.probability,
      formData.impact
    );
    const eval2 = getMatrixZoneEvaluation(
      formData.probabilidadEtapa2,
      formData.impactoEtapa2
    );
    const eval3 = getMatrixZoneEvaluation(
      formData.probabilidadEtapa3,
      formData.impactoEtapa3
    );

    const cleanEstandar =
      formData.estandar && formData.estandar !== 'N/A'
        ? String(formData.estandar).trim()
        : 'N/A';

    const cleanSubestandar =
      formData.subestandar && formData.subestandar !== 'N/A'
        ? String(formData.subestandar).trim()
        : 'N/A';

    const matchedEst = estandares.find(
      (est) => est.codigo_estandar === cleanEstandar
    );
    const matchedSub = subestandares.find(
      (sub) =>
        sub.codigo_subestandar === cleanSubestandar &&
        (sub.codigo_estandar === cleanEstandar ||
          (matchedEst && String(sub.estandar_id) === String(matchedEst.id)))
    );

    const updatedFields = {
      ...formData,
      estandar_id: matchedEst?.id ?? editingRisk?.estandar_id ?? null,
      subestandar_id: matchedSub?.id ?? editingRisk?.subestandar_id ?? null,
      estandar: cleanEstandar,
      codigo_estandar: cleanEstandar,
      subestandar: cleanSubestandar,
      codigo_subestandar: cleanSubestandar,
      contexto: formData.contexto || 'Contexto interno / Externo',
      factor:
        formData.contexto === 'Interno' || formData.contexto === 'Externo'
          ? formData.contexto
          : 'Contexto interno / Externo',
      proceso: formData.proceso.trim() || 'Análisis de riesgo',
      category: formData.proceso.trim() || 'Análisis de riesgo',
      title: formData.title.trim(),
      description: formData.description.trim() || formData.title.trim(),
      causa: formData.causa.trim() || 'N/A',
      consecuencia: formData.consecuencia.trim() || 'N/A',
      probability: Number(formData.probability),
      impact: Number(formData.impact),
      gradoRiesgoEtapa1: eval1.score,
      zonaRiesgoEtapa1: eval1.zona,
      controlesImplementados:
        formData.controlesImplementados.trim() || 'N/A',
      probabilidadEtapa2: formData.probabilidadEtapa2,
      impactoEtapa2: formData.impactoEtapa2,
      gradoRiesgoEtapa2: eval2.hasValue ? eval2.score : 'N/A',
      zonaRiesgoEtapa2: eval2.hasValue ? eval2.zona : 'N/A',
      controlesComplementarios:
        formData.controlesComplementarios.trim() || 'N/A',
      probabilidadEtapa3: formData.probabilidadEtapa3,
      impactoEtapa3: formData.impactoEtapa3,
      gradoRiesgoEtapa3: eval3.hasValue ? eval3.score : 'N/A',
      zonaRiesgoEtapa3: eval3.hasValue ? eval3.zona : 'N/A',
      seguimientoRevision: formData.seguimientoRevision.trim() || 'N/A',
      responsable: formData.responsable.trim() || 'N/A',
      // Espejos de compatibilidad
      planAccion: formData.controlesImplementados.trim() || 'N/A',
      mitigacion: formData.controlesComplementarios.trim() || 'N/A',
      nuevaProbabilidad: formData.probabilidadEtapa2,
      nuevoImpacto: formData.impactoEtapa2,
      nuevoNivelRiesgo: eval2.hasValue
        ? `${eval2.zona} (${eval2.score})`
        : 'N/A',
    };

    if (editingRisk) {
      setRisks((prev) =>
        prev.map((r) =>
          r.id === editingRisk.id
            ? {
                ...r,
                ...updatedFields,
              }
            : r
        )
      );
    } else {
      const newId = `RSK-MAT-${String(Date.now()).slice(-4)}`;
      const newRecord = {
        ...updatedFields,
        id: newId,
      };
      setRisks((prev) => [newRecord, ...prev]);
    }

    setHasUnsavedChanges(true);
    setSaveFeedback(null);
    setIsModalOpen(false);
  };

  const handleDeleteRisk = (id) => {
    if (isMatrizBloqueada) return;
    if (
      window.confirm(
        '¿Estás seguro de que deseas eliminar este riesgo de la matriz?'
      )
    ) {
      setRisks((prev) => prev.filter((r) => r.id !== id));
      setHasUnsavedChanges(true);
      setSaveFeedback(null);
    }
  };

  const syncLocalMatrizStorage = (
    matrizRecord,
    { setAsActive = true } = {}
  ) => {
    try {
      const { datos, ...headerOnly } = matrizRecord;
      localStorage.setItem(
        getMatrizDatosStorageKey(matrizRecord.id),
        JSON.stringify(datos)
      );
      if (setAsActive) {
        localStorage.setItem(
          ACTIVE_MATRIZ_STORAGE_KEY,
          JSON.stringify(headerOnly)
        );
      }

      const storedList = localStorage.getItem(MATRICES_STORAGE_KEY);
      const parsedList = storedList ? JSON.parse(storedList) : [];
      const list = Array.isArray(parsedList) ? parsedList : [];
      const exists = list.some((m) => Number(m.id) === Number(matrizRecord.id));
      const updatedList = exists
        ? list.map((m) =>
            Number(m.id) === Number(matrizRecord.id) ? headerOnly : m
          )
        : [headerOnly, ...list];

      localStorage.setItem(MATRICES_STORAGE_KEY, JSON.stringify(updatedList));
    } catch {
      // ignore storage errors
    }
  };

  // Construye el arreglo JSONB de riesgos de la matriz con el estado de bloqueo indicado
  const buildDatosJsonb = (risksList, { bloqueada = false } = {}) => {
    return risksList.map((r) => {
      const eval1 = getMatrixZoneEvaluation(r.probability, r.impact);
      const prob2 = r.probabilidadEtapa2 ?? r.nuevaProbabilidad ?? 'N/A';
      const imp2 = r.impactoEtapa2 ?? r.nuevoImpacto ?? 'N/A';
      const eval2 = getMatrixZoneEvaluation(prob2, imp2);
      const prob3 = r.probabilidadEtapa3 ?? 'N/A';
      const imp3 = r.impactoEtapa3 ?? 'N/A';
      const eval3 = getMatrixZoneEvaluation(prob3, imp3);

      const estCode =
        r.codigo_estandar && r.codigo_estandar !== 'N/A'
          ? r.codigo_estandar
          : r.estandar || 'N/A';
      const subCode =
        r.codigo_subestandar && r.codigo_subestandar !== 'N/A'
          ? r.codigo_subestandar
          : r.subestandar || 'N/A';

      const controlesImpl = r.controlesImplementados || r.planAccion || 'N/A';
      const controlesComp = r.controlesComplementarios || r.mitigacion || 'N/A';
      const contextoVal =
        r.contexto || r.factor || 'Contexto interno / Externo';
      const procesoVal = r.proceso || r.category || 'Análisis de riesgo';

      return {
        id: r.id,
        estandar_id: r.estandar_id ?? null,
        subestandar_id: r.subestandar_id ?? null,
        estandar: estCode,
        codigo_estandar: estCode,
        subestandar: subCode,
        codigo_subestandar: subCode,
        contexto: contextoVal,
        factor: r.factor || contextoVal,
        proceso: procesoVal,
        category: procesoVal,
        title: r.title,
        riesgo: r.title,
        description: r.description || r.title,
        descripcion: r.description || r.title,
        causa: r.causa || 'N/A',
        causas: r.causa || 'N/A',
        consecuencia: r.consecuencia || 'N/A',
        consecuencias: r.consecuencia || 'N/A',
        consec: r.consecuencia || 'N/A',
        // Etapa 1
        probability: Number(r.probability),
        prob: Number(r.probability),
        impact: Number(r.impact),
        impacto: Number(r.impact),
        gradoRiesgoEtapa1: eval1.score,
        zonaRiesgoEtapa1: eval1.zona,
        score: eval1.score,
        nivel: eval1.zona,
        // Etapa 2
        controlesImplementados: controlesImpl,
        probabilidadEtapa2: prob2,
        impactoEtapa2: imp2,
        gradoRiesgoEtapa2: eval2.hasValue ? eval2.score : 'N/A',
        zonaRiesgoEtapa2: eval2.hasValue ? eval2.zona : 'N/A',
        // Etapa 3
        controlesComplementarios: controlesComp,
        probabilidadEtapa3: prob3,
        impactoEtapa3: imp3,
        gradoRiesgoEtapa3: eval3.hasValue ? eval3.score : 'N/A',
        zonaRiesgoEtapa3: eval3.hasValue ? eval3.zona : 'N/A',
        seguimientoRevision: r.seguimientoRevision || 'N/A',
        responsable: r.responsable || 'N/A',
        // Campos espejo de compatibilidad con versiones anteriores
        fechaAnalisis: r.fechaAnalisis || DEFAULT_FECHA_ANALISIS,
        planAccion: controlesImpl,
        mitigacion: controlesComp,
        nuevaProbabilidad: prob2,
        nuevoImpacto: imp2,
        nuevoNivelRiesgo: eval2.hasValue
          ? `${eval2.zona} (${eval2.score})`
          : 'N/A',
        fechaTratamiento: r.fechaTratamiento || 'N/A',
        // Estado de bloqueo de la versión
        bloqueada: Boolean(bloqueada),
        matriz_bloqueada: Boolean(bloqueada),
      };
    });
  };

  // Guardar la Matriz en la BD con la versión actual en la que se encuentra (sin permitir cambio manual de versión)
  const handleSaveMatrizToDatabase = async ({ silentSuccess = false } = {}) => {
    if (isMatrizBloqueada) return currentMatrizId;
    setSaveFeedback(null);

    const finalIdentificador =
      identificador.trim() || 'Matriz Operativa de Riesgos';

    if (!identificador.trim()) {
      setIdentificador(finalIdentificador);
    }

    const empresaId = activeMatriz?.empresa_id ?? user?.empresa_id ?? 1;
    const version = Number(versionMatriz) || 1;
    const datosJsonb = buildDatosJsonb(risks, { bloqueada: false });

    setIsSavingMatriz(true);

    try {
      let matrizId = currentMatrizId;
      let savedMatrizHeader = null;

      // PASO 1: Guardar o actualizar registro en la tabla `matriz` manteniendo su versión actual
      const matrizPayload = {
        empresa_id: empresaId,
        identificador: finalIdentificador,
        version_matriz: version,
      };

      if (matrizId) {
        const resUpdate = await api.put(
          `/matriz/modificar/${matrizId}`,
          matrizPayload
        );
        savedMatrizHeader = resUpdate?.matriz || resUpdate;
      } else {
        const resCreate = await api.post('/matriz/guardar', matrizPayload);
        savedMatrizHeader = resCreate?.matriz || resCreate;
        matrizId = savedMatrizHeader?.id;
      }

      if (!matrizId) {
        throw new Error(
          'El servidor no devolvió el ID de la matriz creada en la tabla "matriz".'
        );
      }

      // PASO 2: Guardar los datos JSONB en la tabla `matriz_datos`
      await api.post('/matriz_datos', {
        matriz_id: matrizId,
        datos: datosJsonb,
      });

      setCurrentMatrizId(matrizId);
      setVersionMatriz(version);
      setHasUnsavedChanges(false);

      syncLocalMatrizStorage({
        id: matrizId,
        empresa_id: empresaId,
        identificador: finalIdentificador,
        version_matriz: version,
        bloqueada: false,
        fecha_creacion:
          savedMatrizHeader?.fecha_creacion || new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString(),
        datos: datosJsonb,
      });

      if (!silentSuccess) {
        setSaveFeedback({
          type: 'success',
          message: `Matriz "${finalIdentificador}" (Versión ${version}, ID #${matrizId}) y sus ${datosJsonb.length} riesgos guardados exitosamente en "matriz" y "matriz_datos".`,
        });
      }

      return matrizId;
    } catch (error) {
      if (error.status) {
        setSaveFeedback({
          type: 'error',
          message:
            error.message ||
            'Ocurrió un error al enviar la matriz a la base de datos.',
        });
        return null;
      }

      const fallbackId = currentMatrizId || Date.now();

      setCurrentMatrizId(fallbackId);
      setVersionMatriz(version);
      setHasUnsavedChanges(false);

      syncLocalMatrizStorage({
        id: fallbackId,
        empresa_id: empresaId,
        identificador: finalIdentificador,
        version_matriz: version,
        bloqueada: false,
        fecha_creacion:
          activeMatriz?.fecha_creacion || new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString(),
        datos: datosJsonb,
      });

      if (!silentSuccess) {
        setSaveFeedback({
          type: 'success',
          message: `Matriz "${finalIdentificador}" (Versión ${version}) preparada y guardada localmente (${datosJsonb.length} riesgos listos para "matriz_datos").`,
        });
      }

      return fallbackId;
    } finally {
      setIsSavingMatriz(false);
    }
  };

  // Bloquear la matriz actual:
  // 1) Guarda y bloquea la matriz con su versión actual (quedando únicamente de consulta).
  // 2) Genera una copia de la matriz actual incrementando la versión en 1 (version actual + 1).
  const handleConfirmBlockMatriz = async () => {
    if (isMatrizBloqueada) return;
    setSaveFeedback(null);

    const finalIdentificador =
      identificador.trim() || 'Matriz Operativa de Riesgos';

    if (!identificador.trim()) {
      setIdentificador(finalIdentificador);
    }

    const empresaId = activeMatriz?.empresa_id ?? user?.empresa_id ?? 1;
    const currentVersion = Number(versionMatriz) || 1;
    const nextVersion = currentVersion + 1;

    const lockedDatosJsonb = buildDatosJsonb(risks, { bloqueada: true });
    const copyDatosJsonb = buildDatosJsonb(risks, { bloqueada: false });

    setIsBlockingMatriz(true);

    try {
      let lockedMatrizId = currentMatrizId;
      let savedLockedHeader = null;

      // PASO 1: Guardar la matriz en la versión actual que se va a bloquear
      const currentPayload = {
        empresa_id: empresaId,
        identificador: finalIdentificador,
        version_matriz: currentVersion,
      };

      if (lockedMatrizId) {
        const resUpdate = await api.put(
          `/matriz/modificar/${lockedMatrizId}`,
          currentPayload
        );
        savedLockedHeader = resUpdate?.matriz || resUpdate;
      } else {
        const resCreateCurrent = await api.post(
          '/matriz/guardar',
          currentPayload
        );
        savedLockedHeader = resCreateCurrent?.matriz || resCreateCurrent;
        lockedMatrizId = savedLockedHeader?.id;
      }

      if (!lockedMatrizId) {
        throw new Error(
          'No se pudo obtener el ID al guardar la matriz actual antes de bloquearla.'
        );
      }

      await api.post('/matriz_datos', {
        matriz_id: lockedMatrizId,
        datos: lockedDatosJsonb,
      });

      // PASO 2: Generar la copia de la matriz con versión (versión actual + 1)
      const resCopy = await api.post('/matriz/guardar', {
        empresa_id: empresaId,
        identificador: finalIdentificador,
        version_matriz: nextVersion,
        matriz_origen_id: lockedMatrizId,
      });
      const savedCopyHeader = resCopy?.matriz || resCopy;
      const copyMatrizId = savedCopyHeader?.id;

      if (!copyMatrizId) {
        throw new Error(
          `La matriz v${currentVersion} se guardó, pero el servidor no devolvió el ID de la copia v${nextVersion}.`
        );
      }

      await api.post('/matriz_datos', {
        matriz_id: copyMatrizId,
        datos: copyDatosJsonb,
      });

      // Persistir estado de bloqueo para la versión actual y registrar la nueva copia
      markMatrizAsBlockedInStorage(lockedMatrizId);

      syncLocalMatrizStorage(
        {
          id: lockedMatrizId,
          empresa_id: empresaId,
          identificador: finalIdentificador,
          version_matriz: currentVersion,
          bloqueada: true,
          matriz_bloqueada: true,
          fecha_creacion:
            savedLockedHeader?.fecha_creacion || new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
          datos: lockedDatosJsonb,
        },
        { setAsActive: true }
      );

      syncLocalMatrizStorage(
        {
          id: copyMatrizId,
          empresa_id: empresaId,
          identificador: finalIdentificador,
          version_matriz: nextVersion,
          bloqueada: false,
          matriz_bloqueada: false,
          fecha_creacion:
            savedCopyHeader?.fecha_creacion || new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
          datos: copyDatosJsonb,
        },
        { setAsActive: false }
      );

      setCurrentMatrizId(lockedMatrizId);
      setVersionMatriz(currentVersion);
      setIsMatrizBloqueada(true);
      setHasUnsavedChanges(false);
      setIsBlockModalOpen(false);

      setSaveFeedback({
        type: 'success',
        message: `Matriz "${finalIdentificador}" (Versión ${currentVersion}, ID #${lockedMatrizId}) guardada y bloqueada como solo consulta. Se generó una copia con la Versión ${nextVersion} (ID #${copyMatrizId}).`,
      });
    } catch (error) {
      if (error.status) {
        setSaveFeedback({
          type: 'error',
          message:
            error.message ||
            'Ocurrió un error al bloquear y generar la nueva versión de la matriz.',
        });
        setIsBlockModalOpen(false);
        return;
      }

      // Fallback offline en localStorage
      const fallbackLockedId = currentMatrizId || Date.now();
      const fallbackCopyId = fallbackLockedId + 1;

      markMatrizAsBlockedInStorage(fallbackLockedId);

      syncLocalMatrizStorage(
        {
          id: fallbackLockedId,
          empresa_id: empresaId,
          identificador: finalIdentificador,
          version_matriz: currentVersion,
          bloqueada: true,
          matriz_bloqueada: true,
          fecha_creacion:
            activeMatriz?.fecha_creacion || new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
          datos: lockedDatosJsonb,
        },
        { setAsActive: true }
      );

      syncLocalMatrizStorage(
        {
          id: fallbackCopyId,
          empresa_id: empresaId,
          identificador: finalIdentificador,
          version_matriz: nextVersion,
          bloqueada: false,
          matriz_bloqueada: false,
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
          datos: copyDatosJsonb,
        },
        { setAsActive: false }
      );

      setCurrentMatrizId(fallbackLockedId);
      setVersionMatriz(currentVersion);
      setIsMatrizBloqueada(true);
      setHasUnsavedChanges(false);
      setIsBlockModalOpen(false);

      setSaveFeedback({
        type: 'success',
        message: `Matriz "${finalIdentificador}" (Versión ${currentVersion}, ID #${fallbackLockedId}) bloqueada localmente como solo consulta. Se generó una copia en Versión ${nextVersion} (ID #${fallbackCopyId}).`,
      });
    } finally {
      setIsBlockingMatriz(false);
    }
  };

  // Exportar a Excel (permanece activo incluso cuando la matriz está bloqueada)
  const handleExportExcel = async () => {
    setSaveFeedback(null);
    setIsExportingExcel(true);

    try {
      let targetMatrizId = currentMatrizId;

      if (!isMatrizBloqueada && (!targetMatrizId || hasUnsavedChanges)) {
        targetMatrizId = await handleSaveMatrizToDatabase({
          silentSuccess: true,
        });
      }

      if (!targetMatrizId) {
        return;
      }

      const token = tokenStorage.get();
      const response = await fetch(
        `${api.baseUrl}/matriz/exportar-excel/${targetMatrizId}`,
        {
          method: 'GET',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!response.ok) {
        let errorMsg = `Error HTTP ${response.status} al generar el archivo Excel.`;
        try {
          const errData = await response.json();
          if (errData?.error || errData?.message) {
            errorMsg = errData.error || errData.message;
          }
        } catch {
          // ignore
        }
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = (identificador.trim() || `Matriz_${targetMatrizId}`)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_');

      link.href = downloadUrl;
      link.setAttribute(
        'download',
        `${safeName}_v${Number(versionMatriz) || 1}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setSaveFeedback({
        type: 'success',
        message: isMatrizBloqueada
          ? `Archivo Excel de la matriz bloqueada "${
              identificador.trim() || `#${targetMatrizId}`
            }" (v${Number(versionMatriz) || 1}) descargado correctamente.`
          : `Cambios guardados y archivo Excel de la matriz "${
              identificador.trim() || `#${targetMatrizId}`
            }" descargado correctamente.`,
      });
    } catch (error) {
      setSaveFeedback({
        type: 'error',
        message:
          error.message ||
          'No se pudo conectar con el endpoint de exportación a Excel.',
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Opciones únicas de Estándar disponibles para el filtro en la barra de búsqueda
  const availableStandards = useMemo(() => {
    const map = new Map();
    estandares.forEach((est) => {
      const code = String(est.codigo_estandar || '').trim();
      if (code && code !== 'N/A') {
        map.set(code, {
          codigo: code,
          descripcion: est.descripcion || '',
        });
      }
    });
    risks.forEach((r) => {
      const code = String(
        r.codigo_estandar && r.codigo_estandar !== 'N/A'
          ? r.codigo_estandar
          : r.estandar && r.estandar !== 'N/A'
          ? r.estandar
          : ''
      ).trim();
      if (code && code !== 'N/A' && !map.has(code)) {
        map.set(code, {
          codigo: code,
          descripcion: '',
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.codigo.localeCompare(b.codigo, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    );
  }, [estandares, risks]);

  // Filtrado reactivo de la lista (con Estándar y Subestándar separados)
  const filteredRisks = useMemo(() => {
    return risks.filter((risk) => {
      const term = String(searchTerm || '').toLowerCase();
      const matchesSearch =
        String(risk.estandar || risk.codigo_estandar || '')
          .toLowerCase()
          .includes(term) ||
        String(risk.subestandar || risk.codigo_subestandar || '')
          .toLowerCase()
          .includes(term) ||
        String(risk.contexto || '').toLowerCase().includes(term) ||
        String(risk.proceso || '').toLowerCase().includes(term) ||
        String(risk.title || '').toLowerCase().includes(term) ||
        String(risk.description || '').toLowerCase().includes(term) ||
        String(risk.causa || '').toLowerCase().includes(term) ||
        String(risk.consecuencia || '').toLowerCase().includes(term) ||
        String(risk.controlesImplementados || risk.planAccion || '')
          .toLowerCase()
          .includes(term) ||
        String(risk.controlesComplementarios || risk.mitigacion || '')
          .toLowerCase()
          .includes(term) ||
        String(risk.seguimientoRevision || '').toLowerCase().includes(term) ||
        String(risk.responsable || '').toLowerCase().includes(term) ||
        String(risk.id ?? '').toLowerCase().includes(term);

      const riskEstCode = String(
        risk.codigo_estandar && risk.codigo_estandar !== 'N/A'
          ? risk.codigo_estandar
          : risk.estandar || ''
      )
        .trim()
        .toLowerCase();

      const matchesEstandar =
        selectedEstandar === 'Todos' ||
        riskEstCode === String(selectedEstandar).trim().toLowerCase();

      const contextoRaw = String(
        risk.contexto || risk.factor || ''
      ).toLowerCase();
      const matchesFactor =
        selectedFactor === 'Todos' ||
        String(risk.factor || '') === selectedFactor ||
        String(risk.contexto || '') === selectedFactor ||
        (selectedFactor === 'Interno' && contextoRaw.includes('interno')) ||
        (selectedFactor === 'Externo' && contextoRaw.includes('externo'));

      const controlesImpl =
        risk.controlesImplementados ?? risk.planAccion ?? 'N/A';
      const controlesComp =
        risk.controlesComplementarios ?? risk.mitigacion ?? 'N/A';
      const prob2 = risk.probabilidadEtapa2 ?? risk.nuevaProbabilidad ?? 'N/A';
      const prob3 = risk.probabilidadEtapa3 ?? 'N/A';

      const hasTreatment =
        controlesImpl !== 'N/A' ||
        controlesComp !== 'N/A' ||
        prob2 !== 'N/A' ||
        prob3 !== 'N/A';

      const matchesTreatment =
        treatmentFilter === 'Todos' ||
        (treatmentFilter === 'Con Tratamiento' && hasTreatment) ||
        (treatmentFilter === 'Sin Tratamiento' && !hasTreatment);

      return (
        matchesSearch && matchesEstandar && matchesFactor && matchesTreatment
      );
    });
  }, [risks, searchTerm, selectedEstandar, selectedFactor, treatmentFilter]);

  const currentNumericVersion = Number(versionMatriz) || 1;
  const nextNumericVersion = currentNumericVersion + 1;

  return (
    <div className="space-y-6">
      {/* Encabezado y Configuración de la Matriz */}
      <MatrizHeaderPanel
        isCreatingNew={isCreatingNew}
        identificador={identificador}
        setIdentificador={handleIdentificadorChange}
        currentMatrizId={currentMatrizId}
        versionMatriz={versionMatriz}
        isMatrizBloqueada={isMatrizBloqueada}
        isSavingMatriz={isSavingMatriz}
        isBlockingMatriz={isBlockingMatriz}
        onOpenBlockModal={() => {
          if (!isMatrizBloqueada) {
            setIsBlockModalOpen(true);
          }
        }}
        onBack={onBack}
        onOpenCreateModal={handleOpenCreateModal}
        saveFeedback={saveFeedback}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {/* Barra de Búsqueda y Filtros */}
      <MatrizFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedEstandar={selectedEstandar}
        setSelectedEstandar={setSelectedEstandar}
        availableStandards={availableStandards}
        selectedFactor={selectedFactor}
        setSelectedFactor={setSelectedFactor}
        treatmentFilter={treatmentFilter}
        setTreatmentFilter={setTreatmentFilter}
      />

      {/* Tabla Principal de la Matriz con las 3 Etapas y Estándar/Subestándar separados */}
      <MatrizTable
        risks={risks}
        filteredRisks={filteredRisks}
        isLoadingDatos={isLoadingDatos}
        isCreatingNew={isCreatingNew}
        isMatrizBloqueada={isMatrizBloqueada}
        onOpenCreateModal={handleOpenCreateModal}
        onOpenEditModal={handleOpenEditModal}
        onDeleteRisk={handleDeleteRisk}
        onResetFilters={() => {
          setSearchTerm('');
          setSelectedEstandar('Todos');
          setSelectedFactor('Todos');
          setTreatmentFilter('Todos');
        }}
      />

      {/* Botones de Guardar Matriz y Exportar Excel centrados debajo de la visualización */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2 pb-4">
        <button
          type="button"
          onClick={() => handleSaveMatrizToDatabase()}
          disabled={
            isMatrizBloqueada ||
            isSavingMatriz ||
            isBlockingMatriz ||
            isExportingExcel
          }
          className="inline-flex items-center gap-2.5 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-200 transition-colors cursor-pointer"
        >
          {isSavingMatriz ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Guardando Matriz...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Guardar Matriz</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleExportExcel}
          disabled={isSavingMatriz || isBlockingMatriz || isExportingExcel}
          className="inline-flex items-center gap-2.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 transition-colors cursor-pointer"
        >
          {isExportingExcel ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>
                {isMatrizBloqueada
                  ? 'Exportando Excel...'
                  : 'Guardando y Exportando...'}
              </span>
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel</span>
            </>
          )}
        </button>
      </div>

      {/* Modal de Confirmación para Bloquear Matriz */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Bloquear Matriz (Versión {currentNumericVersion})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Confirmación de bloqueo y generación de nueva versión
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isBlockingMatriz}
                onClick={() => setIsBlockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-slate-800 text-sm leading-relaxed">
              Esta matriz sera bloqueada, una vez bloqueada ya no se podra
              modificar esta version en concreto. Se generara una copia de la
              matriz con la version {nextNumericVersion} ¿Esta seguro?
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isBlockingMatriz}
                onClick={() => setIsBlockModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isBlockingMatriz}
                onClick={handleConfirmBlockMatriz}
                className="inline-flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {isBlockingMatriz ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Bloqueando y copiando...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Sí, Bloquear Matriz</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Agregar / Modificar Riesgo en las 3 Etapas */}
      <MatrizRiskModal
        isOpen={isModalOpen && !isMatrizBloqueada}
        onClose={() => setIsModalOpen(false)}
        editingRisk={editingRisk}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSaveRisk}
        estandares={estandares}
        subestandares={subestandares}
      />

      {/* Pop-up de Selección de Estándares (solo al crear una matriz nueva) */}
      {isCreatingNew && !isMatrizBloqueada && (
        <MatrizStandardsModal
          isOpen={isStandardsModalOpen}
          onClose={() => setIsStandardsModalOpen(false)}
          onConfirmStandards={handleConfirmStandards}
          estandares={estandares}
          subestandares={subestandares}
          allRisks={allRisks}
          isLoadingStandards={isLoadingRisks}
          onRefreshStandards={refreshRisks}
        />
      )}
    </div>
  );
}
