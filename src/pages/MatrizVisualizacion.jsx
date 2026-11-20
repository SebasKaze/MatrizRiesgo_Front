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
import { Save, RefreshCw, FileSpreadsheet } from 'lucide-react';

// Fecha predeterminada de análisis
const DEFAULT_FECHA_ANALISIS = new Date().toISOString().split('T')[0];
const MATRICES_STORAGE_KEY = 'matrices_empresa_storage';
const getMatrizDatosStorageKey = (matrizId) => `matriz_datos_${matrizId}`;

// Transforma un riesgo del catálogo general (o de matriz_datos guardados) al formato de 3 Etapas de la matriz
function mapCatalogRiskToMatrixRow(r, idx = 0) {
  const estandar =
    r.codigo_estandar ||
    r.estandar ||
    (r.numeral && String(r.numeral).includes('.')
      ? String(r.numeral).split('.')[0]
      : 'N/A');

  const subestandar =
    r.codigo_subestandar ||
    r.subestandar ||
    (r.subestandar_id ? String(r.subestandar_id) : 'N/A');

  const numeral =
    r.numeral ||
    (subestandar && subestandar !== 'N/A'
      ? subestandar
      : estandar && estandar !== 'N/A'
      ? estandar
      : `1.${idx + 1}`);

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
    numeral,
    estandar,
    subestandar,
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
  // Versión base de la matriz que se está editando (impide bajar a una versión menor)
  const [baseVersionMatriz, setBaseVersionMatriz] = useState(
    Number(activeMatriz?.version_matriz) || 1
  );
  const [versionMatriz, setVersionMatriz] = useState(
    Number(activeMatriz?.version_matriz) || 1
  );

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
          setRisks(rawDatos.map((r, i) => mapCatalogRiskToMatrixRow(r, i)));
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
            setRisks(parsed.map((r, i) => mapCatalogRiskToMatrixRow(r, i)));
          }
        } else if (Array.isArray(activeMatriz.datos)) {
          setRisks(
            activeMatriz.datos.map((r, i) => mapCatalogRiskToMatrixRow(r, i))
          );
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
  }, [activeMatriz]);

  const handleIdentificadorChange = (val) => {
    setIdentificador(val);
    setHasUnsavedChanges(true);
    setSaveFeedback(null);
  };

  const handleVersionChange = (val) => {
    const minAllowed = Number(baseVersionMatriz) || 1;
    const nextVersion = Math.max(minAllowed, Number(val) || minAllowed);
    setVersionMatriz(nextVersion);
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
      mapCatalogRiskToMatrixRow(r, idx)
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
    numeral: '',
    estandar: 'N/A',
    subestandar: 'N/A',
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
    setEditingRisk(null);
    setFormData({
      numeral: '',
      estandar: '',
      subestandar: '',
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
    setEditingRisk(risk);
    const numeralVal =
      risk.numeral ||
      (risk.subestandar && risk.subestandar !== 'N/A'
        ? risk.subestandar
        : risk.estandar || '');
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
      numeral: numeralVal,
      estandar: risk.estandar || 'N/A',
      subestandar: risk.subestandar || 'N/A',
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
    if (!formData.title.trim()) return;

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

    const derivedEstandar =
      formData.estandar && formData.estandar !== 'N/A'
        ? formData.estandar
        : formData.numeral && String(formData.numeral).includes('.')
        ? String(formData.numeral).split('.')[0]
        : formData.numeral || 'N/A';

    const derivedSubestandar =
      formData.subestandar && formData.subestandar !== 'N/A'
        ? formData.subestandar
        : formData.numeral || 'N/A';

    const updatedFields = {
      ...formData,
      numeral: formData.numeral.trim() || derivedSubestandar,
      estandar: derivedEstandar,
      subestandar: derivedSubestandar,
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

  const syncLocalMatrizStorage = (matrizRecord) => {
    try {
      const { datos, ...headerOnly } = matrizRecord;
      localStorage.setItem(
        getMatrizDatosStorageKey(matrizRecord.id),
        JSON.stringify(datos)
      );
      localStorage.setItem(
        ACTIVE_MATRIZ_STORAGE_KEY,
        JSON.stringify(headerOnly)
      );

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

  // Guardar la Matriz en la BD:
  // Paso 1: Guardar cabecera en tabla `matriz` (empresa_id, identificador, version_matriz)
  // Paso 2: Guardar contenido JSONB con las 3 etapas en tabla `matriz_datos` (matriz_id, datos)
  const handleSaveMatrizToDatabase = async ({ silentSuccess = false } = {}) => {
    setSaveFeedback(null);

    const finalIdentificador =
      identificador.trim() || 'Matriz Operativa de Riesgos';

    if (!identificador.trim()) {
      setIdentificador(finalIdentificador);
    }

    const empresaId = activeMatriz?.empresa_id ?? user?.empresa_id ?? 1;
    const minVersion = Number(baseVersionMatriz) || 1;
    const version = Math.max(minVersion, Number(versionMatriz) || minVersion);

    const isCreatingNewVersionRecord = Boolean(
      currentMatrizId && version > minVersion
    );

    const datosJsonb = risks.map((r) => {
      const eval1 = getMatrixZoneEvaluation(r.probability, r.impact);
      const prob2 = r.probabilidadEtapa2 ?? r.nuevaProbabilidad ?? 'N/A';
      const imp2 = r.impactoEtapa2 ?? r.nuevoImpacto ?? 'N/A';
      const eval2 = getMatrixZoneEvaluation(prob2, imp2);
      const prob3 = r.probabilidadEtapa3 ?? 'N/A';
      const imp3 = r.impactoEtapa3 ?? 'N/A';
      const eval3 = getMatrixZoneEvaluation(prob3, imp3);

      const controlesImpl = r.controlesImplementados || r.planAccion || 'N/A';
      const controlesComp = r.controlesComplementarios || r.mitigacion || 'N/A';
      const contextoVal =
        r.contexto || r.factor || 'Contexto interno / Externo';
      const procesoVal = r.proceso || r.category || 'Análisis de riesgo';

      return {
        id: r.id,
        numeral:
          r.numeral ||
          (r.subestandar && r.subestandar !== 'N/A'
            ? r.subestandar
            : r.estandar || 'N/A'),
        estandar: r.estandar || 'N/A',
        subestandar: r.subestandar || 'N/A',
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
      };
    });

    setIsSavingMatriz(true);

    try {
      let matrizId = currentMatrizId;
      let savedMatrizHeader = null;

      // PASO 1: Guardar o actualizar registro en la tabla `matriz`
      const matrizPayload = {
        empresa_id: empresaId,
        identificador: finalIdentificador,
        version_matriz: version,
      };

      if (matrizId && !isCreatingNewVersionRecord) {
        const resUpdate = await api.put(
          `/matriz/modificar/${matrizId}`,
          matrizPayload
        );
        savedMatrizHeader = resUpdate?.matriz || resUpdate;
      } else {
        const resCreate = await api.post('/matriz/guardar', {
          ...matrizPayload,
          ...(isCreatingNewVersionRecord
            ? { matriz_origen_id: currentMatrizId }
            : {}),
        });
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
      setBaseVersionMatriz(version);
      setVersionMatriz(version);
      setHasUnsavedChanges(false);

      syncLocalMatrizStorage({
        id: matrizId,
        empresa_id: empresaId,
        identificador: finalIdentificador,
        version_matriz: version,
        fecha_creacion:
          savedMatrizHeader?.fecha_creacion || new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString(),
        datos: datosJsonb,
      });

      if (!silentSuccess) {
        setSaveFeedback({
          type: 'success',
          message: isCreatingNewVersionRecord
            ? `Se creó un nuevo registro para "${finalIdentificador}" (Versión ${version}, ID #${matrizId}) conservando intacta la Versión ${minVersion}.`
            : `Matriz "${finalIdentificador}" (Versión ${version}, ID #${matrizId}) y sus ${datosJsonb.length} riesgos guardados exitosamente en "matriz" y "matriz_datos".`,
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

      const fallbackId =
        !currentMatrizId || isCreatingNewVersionRecord
          ? Date.now()
          : currentMatrizId;

      setCurrentMatrizId(fallbackId);
      setBaseVersionMatriz(version);
      setVersionMatriz(version);
      setHasUnsavedChanges(false);

      syncLocalMatrizStorage({
        id: fallbackId,
        empresa_id: empresaId,
        identificador: finalIdentificador,
        version_matriz: version,
        fecha_creacion: isCreatingNewVersionRecord
          ? new Date().toISOString()
          : activeMatriz?.fecha_creacion || new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString(),
        datos: datosJsonb,
      });

      if (!silentSuccess) {
        setSaveFeedback({
          type: 'success',
          message: isCreatingNewVersionRecord
            ? `Se generó un nuevo registro local para "${finalIdentificador}" (Versión ${version}, ID #${fallbackId}) conservando la Versión ${minVersion}.`
            : `Matriz "${finalIdentificador}" (Versión ${version}) preparada y guardada localmente (${datosJsonb.length} riesgos listos para "matriz_datos").`,
        });
      }

      return fallbackId;
    } finally {
      setIsSavingMatriz(false);
    }
  };

  // Guardar primero cualquier cambio pendiente de la matriz y posteriormente llamar al endpoint para generar el archivo Excel
  const handleExportExcel = async () => {
    setSaveFeedback(null);
    setIsExportingExcel(true);

    try {
      let targetMatrizId = currentMatrizId;

      if (!targetMatrizId || hasUnsavedChanges) {
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
        message: `Cambios guardados y archivo Excel de la matriz "${
          identificador.trim() || `#${targetMatrizId}`
        }" descargado correctamente.`,
      });
    } catch (error) {
      setSaveFeedback({
        type: 'error',
        message:
          error.message ||
          'Se guardaron los cambios de la matriz, pero no se pudo conectar con el endpoint de exportación a Excel.',
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
        r.estandar && r.estandar !== 'N/A'
          ? r.estandar
          : r.numeral && String(r.numeral).includes('.')
          ? String(r.numeral).split('.')[0]
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

  // Filtrado reactivo de la lista (compatible con los campos de las 3 etapas)
  const filteredRisks = useMemo(() => {
    return risks.filter((risk) => {
      const term = String(searchTerm || '').toLowerCase();
      const matchesSearch =
        String(risk.numeral || '').toLowerCase().includes(term) ||
        String(risk.contexto || '').toLowerCase().includes(term) ||
        String(risk.proceso || '').toLowerCase().includes(term) ||
        String(risk.title || '').toLowerCase().includes(term) ||
        String(risk.description || '').toLowerCase().includes(term) ||
        String(risk.causa || '').toLowerCase().includes(term) ||
        String(risk.consecuencia || '').toLowerCase().includes(term) ||
        String(risk.estandar || '').toLowerCase().includes(term) ||
        String(risk.subestandar || '').toLowerCase().includes(term) ||
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
        risk.estandar && risk.estandar !== 'N/A'
          ? risk.estandar
          : risk.numeral && String(risk.numeral).includes('.')
          ? String(risk.numeral).split('.')[0]
          : risk.numeral || ''
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

  return (
    <div className="space-y-6">
      {/* Encabezado y Configuración de la Matriz */}
      <MatrizHeaderPanel
        isCreatingNew={isCreatingNew}
        identificador={identificador}
        setIdentificador={handleIdentificadorChange}
        currentMatrizId={currentMatrizId}
        versionMatriz={versionMatriz}
        minVersionMatriz={baseVersionMatriz}
        setVersionMatriz={handleVersionChange}
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

      {/* Tabla Principal de la Matriz con las 3 Etapas */}
      <MatrizTable
        risks={risks}
        filteredRisks={filteredRisks}
        isLoadingDatos={isLoadingDatos}
        isCreatingNew={isCreatingNew}
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
          disabled={isSavingMatriz || isExportingExcel}
          className="inline-flex items-center gap-2.5 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-200 transition-colors cursor-pointer"
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
          disabled={isSavingMatriz || isExportingExcel}
          className="inline-flex items-center gap-2.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 transition-colors cursor-pointer"
        >
          {isExportingExcel ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Guardando y Exportando...</span>
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel</span>
            </>
          )}
        </button>
      </div>

      {/* Modal de Agregar / Modificar Riesgo en las 3 Etapas */}
      <MatrizRiskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingRisk={editingRisk}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSaveRisk}
        estandares={estandares}
        subestandares={subestandares}
      />

      {/* Pop-up de Selección de Estándares (solo al crear una matriz nueva) */}
      {isCreatingNew && (
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
