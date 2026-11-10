import { useState, useMemo, useEffect } from 'react';
import { useRiskContext } from '../hooks/useRiskContext';
import { useAuth } from '../hooks/useAuth';
import { api, tokenStorage } from '../services/api';
import { riskService } from '../services/riskService';
import { ACTIVE_MATRIZ_STORAGE_KEY } from './Matrices';
import { calculateRiskScore, getRiskSeverity } from '../utils/riskCalculations';
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

// Transforma un riesgo del catálogo general al formato enriquecido de la matriz
function mapCatalogRiskToMatrixRow(r, idx = 0) {
  return {
    id: r.id || `RSK-${idx + 1}`,
    estandar: r.codigo_estandar || r.estandar || 'N/A',
    subestandar:
      r.codigo_subestandar ||
      r.subestandar ||
      (r.subestandar_id ? String(r.subestandar_id) : 'N/A'),
    title: r.riesgo || r.title || 'Sin título',
    description: r.descripcion || r.description || r.riesgo || r.title || '',
    causa: r.causa || 'N/A',
    consecuencia: r.consec || r.consecuencia || 'N/A',
    factor: r.factor || 'Interno',
    category: r.category || r.categoria || 'Operacional',
    probability: Number(r.prob ?? r.probability ?? 3),
    impact: Number(r.impacto ?? r.impact ?? 3),
    fechaAnalisis: r.fechaAnalisis || DEFAULT_FECHA_ANALISIS,
    planAccion: r.planAccion || 'N/A',
    mitigacion: r.mitigacion || 'N/A',
    nuevaProbabilidad: r.nuevaProbabilidad ?? 'N/A',
    nuevoImpacto: r.nuevoImpacto ?? 'N/A',
    nuevoNivelRiesgo: r.nuevoNivelRiesgo || 'N/A',
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
  const [selectedFactor, setSelectedFactor] = useState('Todos');
  const [treatmentFilter, setTreatmentFilter] = useState('Todos');

  // Estado para el modal de agregar o editar riesgo dentro de la matriz
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState(null);

  const [formData, setFormData] = useState({
    estandar: 'N/A',
    subestandar: 'N/A',
    title: '',
    description: '',
    causa: '',
    consecuencia: '',
    factor: 'Interno',
    category: 'Operacional',
    probability: 3,
    impact: 3,
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
      estandar: '',
      subestandar: '',
      title: '',
      description: '',
      causa: '',
      consecuencia: '',
      factor: 'Interno',
      category: 'Operacional',
      probability: 3,
      impact: 3,
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
    setFormData({
      estandar: risk.estandar || 'N/A',
      subestandar: risk.subestandar || 'N/A',
      title: risk.title || '',
      description: risk.description || '',
      causa: risk.causa || '',
      consecuencia: risk.consecuencia || '',
      factor: risk.factor || 'Interno',
      category: risk.category || 'Operacional',
      probability: Number(risk.probability) || 3,
      impact: Number(risk.impact) || 3,
      fechaAnalisis: risk.fechaAnalisis || DEFAULT_FECHA_ANALISIS,
      planAccion: risk.planAccion || 'N/A',
      mitigacion: risk.mitigacion || 'N/A',
      nuevaProbabilidad: risk.nuevaProbabilidad ?? 'N/A',
      nuevoImpacto: risk.nuevoImpacto ?? 'N/A',
      fechaTratamiento: risk.fechaTratamiento || 'N/A',
    });
    setIsModalOpen(true);
  };

  const handleSaveRisk = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    let computedNuevoNivel = 'N/A';
    const numProb = Number(formData.nuevaProbabilidad);
    const numImp = Number(formData.nuevoImpacto);
    if (!isNaN(numProb) && !isNaN(numImp) && numProb >= 1 && numImp >= 1) {
      const score = numProb * numImp;
      computedNuevoNivel = `${getRiskSeverity(score).label} (${score})`;
    }

    if (editingRisk) {
      setRisks((prev) =>
        prev.map((r) =>
          r.id === editingRisk.id
            ? {
                ...r,
                ...formData,
                probability: Number(formData.probability),
                impact: Number(formData.impact),
                nuevaProbabilidad: formData.nuevaProbabilidad,
                nuevoImpacto: formData.nuevoImpacto,
                nuevoNivelRiesgo: computedNuevoNivel,
              }
            : r
        )
      );
    } else {
      const newId = `RSK-MAT-${String(Date.now()).slice(-4)}`;
      const newRecord = {
        ...formData,
        id: newId,
        probability: Number(formData.probability),
        impact: Number(formData.impact),
        nuevaProbabilidad: formData.nuevaProbabilidad,
        nuevoImpacto: formData.nuevoImpacto,
        nuevoNivelRiesgo: computedNuevoNivel,
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
  // Paso 2: Guardar contenido JSONB en tabla `matriz_datos` (matriz_id, datos)
  // Devuelve el ID de la matriz guardada (o null si ocurrió un error del servidor)
  const handleSaveMatrizToDatabase = async ({ silentSuccess = false } = {}) => {
    setSaveFeedback(null);

    const finalIdentificador =
      identificador.trim() || 'Matriz Operativa de Riesgos';

    if (!identificador.trim()) {
      setIdentificador(finalIdentificador);
    }

    // Conservar el empresa_id original de la matriz (útil cuando Admin edita matrices de diferentes empresas)
    const empresaId = activeMatriz?.empresa_id ?? user?.empresa_id ?? 1;
    const minVersion = Number(baseVersionMatriz) || 1;
    const version = Math.max(minVersion, Number(versionMatriz) || minVersion);

    // Si estamos actualizando una matriz existente y el usuario incrementó el número de versión,
    // se registra una nueva matriz en la BD para conservar la versión anterior (ej. v1) y crear la nueva (ej. v2).
    const isCreatingNewVersionRecord = Boolean(
      currentMatrizId && version > minVersion
    );

    const datosJsonb = risks.map((r) => {
      const score = calculateRiskScore(r.probability, r.impact);
      const severity = getRiskSeverity(score);
      return {
        id: r.id,
        estandar: r.estandar || 'N/A',
        subestandar: r.subestandar || 'N/A',
        title: r.title,
        riesgo: r.title,
        description: r.description || r.title,
        descripcion: r.description || r.title,
        causa: r.causa || 'N/A',
        consecuencia: r.consecuencia || 'N/A',
        consec: r.consecuencia || 'N/A',
        factor: r.factor || 'Interno',
        category: r.category || 'Operacional',
        probability: Number(r.probability),
        prob: Number(r.probability),
        impact: Number(r.impact),
        impacto: Number(r.impact),
        nivel: severity.label,
        score,
        fechaAnalisis: r.fechaAnalisis || DEFAULT_FECHA_ANALISIS,
        planAccion: r.planAccion || 'N/A',
        mitigacion: r.mitigacion || 'N/A',
        nuevaProbabilidad: r.nuevaProbabilidad ?? 'N/A',
        nuevoImpacto: r.nuevoImpacto ?? 'N/A',
        nuevoNivelRiesgo: r.nuevoNivelRiesgo || 'N/A',
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
        // Misma versión: actualizar la matriz actual
        const resUpdate = await api.put(
          `/matriz/modificar/${matrizId}`,
          matrizPayload
        );
        savedMatrizHeader = resUpdate?.matriz || resUpdate;
      } else {
        // Matriz nueva o cambio de versión (conservar versión anterior y crear nuevo registro)
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

      // Si se incrementó la versión estando en modo local, generar un nuevo ID para conservar la versión anterior
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

      // Si la matriz es nueva o tiene cambios sin guardar, primero guardamos todos los cambios
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

  // Filtrado reactivo de la lista
  const filteredRisks = useMemo(() => {
    return risks.filter((risk) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        risk.title.toLowerCase().includes(term) ||
        risk.description.toLowerCase().includes(term) ||
        risk.causa.toLowerCase().includes(term) ||
        risk.consecuencia.toLowerCase().includes(term) ||
        (risk.planAccion && risk.planAccion.toLowerCase().includes(term)) ||
        (risk.mitigacion && risk.mitigacion.toLowerCase().includes(term)) ||
        (risk.id && risk.id.toLowerCase().includes(term));

      const matchesFactor =
        selectedFactor === 'Todos' || risk.factor === selectedFactor;

      const hasTreatment =
        risk.planAccion !== 'N/A' ||
        risk.mitigacion !== 'N/A' ||
        risk.nuevaProbabilidad !== 'N/A';

      const matchesTreatment =
        treatmentFilter === 'Todos' ||
        (treatmentFilter === 'Con Tratamiento' && hasTreatment) ||
        (treatmentFilter === 'Sin Tratamiento' && !hasTreatment);

      return matchesSearch && matchesFactor && matchesTreatment;
    });
  }, [risks, searchTerm, selectedFactor, treatmentFilter]);

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
        selectedFactor={selectedFactor}
        setSelectedFactor={setSelectedFactor}
        treatmentFilter={treatmentFilter}
        setTreatmentFilter={setTreatmentFilter}
      />

      {/* Tabla Principal de la Matriz */}
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

      {/* Modal de Agregar / Modificar Riesgo y Tratamiento */}
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
