import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRiskContext } from '../hooks/useRiskContext';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { calculateRiskScore, getRiskSeverity } from '../utils/riskCalculations';
import { NewRiskModal } from '../components/matrix/NewRiskModal';
import { NewStandardModal } from '../components/matrix/NewStandardModal';
import { RiesgosHeaderNav } from '../components/riesgos/RiesgosHeaderNav';
import { RiesgosFilterBar } from '../components/riesgos/RiesgosFilterBar';
import { RiesgosCatalogTable } from '../components/riesgos/RiesgosCatalogTable';
import { EstandaresCatalogSection } from '../components/riesgos/EstandaresCatalogSection';
import { ReferenciasNoticiasSection } from '../components/riesgos/ReferenciasNoticiasSection';
import {
  FUENTES_NORMATIVAS,
  getStoredNoticias,
  saveStoredNoticias,
  normalizeNoticiaRecord,
  compareNaturalCodes,
} from '../components/riesgos/noticiasHelpers';

export function RiesgosVisualizacion() {
  const {
    allRisks,
    estandares,
    subestandares,
    addEstandar,
    updateEstandar,
    removeEstandar,
    addSubestandar,
    updateSubestandar,
    removeSubestandar,
    isLoadingRisks,
    refreshRisks,
    isModalOpen,
    openModal,
    closeModal,
    isStandardModalOpen,
    openStandardModal,
    closeStandardModal,
    addRisk,
    updateRisk,
    removeRisk,
  } = useRiskContext();
  const { user } = useAuth();

  // Verificar si el usuario autenticado tiene rol="Admin"
  const isAdmin = useMemo(() => {
    const rolValue = String(
      user?.rol || user?.roleCode || user?.role || ''
    )
      .trim()
      .toLowerCase();
    return rolValue === 'admin' || rolValue === 'administrador';
  }, [user]);

  // Navegación superior entre las 3 secciones:
  // 'riesgos' | 'estandar_subestandar' | 'referencias_noticias'
  const [activeSection, setActiveSection] = useState('riesgos');

  // Estados de búsqueda, filtros y ordenamiento para la sección "Riesgos"
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstandar, setSelectedEstandar] = useState('Todos');
  const [selectedFactor, setSelectedFactor] = useState('Todos');
  const [selectedSeverity, setSelectedSeverity] = useState('Todos');
  const [sortBy, setSortBy] = useState('none');
  const [editingRisk, setEditingRisk] = useState(null);

  // Estado de Noticias para la sección "Referencias y Noticias"
  const [noticias, setNoticias] = useState(() => getStoredNoticias());
  const [isLoadingNoticias, setIsLoadingNoticias] = useState(false);

  const fetchNoticias = useCallback(async () => {
    setIsLoadingNoticias(true);
    try {
      const response = await api.get('/noticias');
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.noticias)
        ? response.noticias
        : null;

      if (list) {
        const normalized = list.map((item, idx) =>
          normalizeNoticiaRecord(item, idx)
        );
        setNoticias(normalized);
        saveStoredNoticias(normalized);
      }
    } catch {
      // Respaldo local mientras la tabla/endpoints de noticias aún no estén desplegados en el backend
    } finally {
      setIsLoadingNoticias(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    api
      .get('/noticias')
      .then((response) => {
        if (!isMounted) return;
        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.noticias)
          ? response.noticias
          : null;
        if (list) {
          const normalized = list.map((item, idx) =>
            normalizeNoticiaRecord(item, idx)
          );
          setNoticias(normalized);
          saveStoredNoticias(normalized);
        }
      })
      .catch(() => {
        // Respaldo local si el endpoint aún no está disponible
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenCreateRiskModal = () => {
    setEditingRisk(null);
    openModal();
  };

  const handleOpenEditRiskModal = (risk) => {
    setEditingRisk(risk);
    openModal();
  };

  const handleCloseRiskModal = () => {
    setEditingRisk(null);
    closeModal();
  };

  const handleDeleteRisk = async (risk) => {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar el riesgo "${risk.title}"?`
    );
    if (!confirmed) return;
    await removeRisk(risk.id);
  };

  // Alternar ordenamiento al hacer clic en los encabezados de columna Estándar o Subestándar
  const handleToggleColumnSort = (column) => {
    if (column === 'estandar') {
      if (sortBy === 'estandar-asc' || sortBy === 'ambos-asc') {
        setSortBy('estandar-desc');
      } else if (sortBy === 'estandar-desc' || sortBy === 'ambos-desc') {
        setSortBy('none');
      } else {
        setSortBy('estandar-asc');
      }
    } else if (column === 'subestandar') {
      if (sortBy === 'subestandar-asc') {
        setSortBy('subestandar-desc');
      } else if (sortBy === 'subestandar-desc') {
        setSortBy('none');
      } else {
        setSortBy('subestandar-asc');
      }
    }
  };

  // Normalizar riesgos registrados
  const sourceRisks = useMemo(() => {
    if (!Array.isArray(allRisks) || allRisks.length === 0) {
      return [];
    }
    return allRisks.map((r, idx) => ({
      ...r,
      id: r.id ?? `RSK-${idx + 1}`,
      estandar: r.codigo_estandar || r.estandar || 'N/A',
      subestandar:
        r.codigo_subestandar ||
        r.subestandar ||
        (r.subestandar_id ? String(r.subestandar_id) : 'N/A'),
      title: r.riesgo || r.title || 'Sin título',
      description: r.descripcion || r.description || r.riesgo || r.title || '',
      causa: r.causa || '',
      consecuencia: r.consec || r.consecuencia || '',
      factor: r.factor || 'Interno',
      probability: Number(r.prob ?? r.probability ?? 3),
      impact: Number(r.impacto ?? r.impact ?? 3),
    }));
  }, [allRisks]);

  // Opciones únicas de Estándar disponibles para el filtro y para el formulario de noticias
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
    sourceRisks.forEach((r) => {
      const code = String(r.estandar || '').trim();
      if (code && code !== 'N/A' && !map.has(code)) {
        map.set(code, {
          codigo: code,
          descripcion: '',
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      compareNaturalCodes(a.codigo, b.codigo, 'asc')
    );
  }, [estandares, sourceRisks]);

  // Filtros combinados y ordenamiento por Estándar y Subestándar
  const filteredRisks = useMemo(() => {
    const filtered = sourceRisks.filter((risk) => {
      const term = String(searchTerm || '').toLowerCase();
      const matchesSearch =
        String(risk.title || '').toLowerCase().includes(term) ||
        String(risk.description || '').toLowerCase().includes(term) ||
        String(risk.causa || '').toLowerCase().includes(term) ||
        String(risk.consecuencia || '').toLowerCase().includes(term) ||
        String(risk.estandar || '').toLowerCase().includes(term) ||
        String(risk.subestandar || '').toLowerCase().includes(term) ||
        String(risk.id ?? '').toLowerCase().includes(term);

      const matchesEstandar =
        selectedEstandar === 'Todos' ||
        String(risk.estandar || '').trim().toLowerCase() ===
          String(selectedEstandar).trim().toLowerCase();

      const matchesFactor =
        selectedFactor === 'Todos' || risk.factor === selectedFactor;

      const score = calculateRiskScore(risk.probability, risk.impact);
      const severity = getRiskSeverity(score);
      const riskSeverityLabel = risk.nivel || severity.label;
      const matchesSeverity =
        selectedSeverity === 'Todos' || riskSeverityLabel === selectedSeverity;

      return (
        matchesSearch && matchesEstandar && matchesFactor && matchesSeverity
      );
    });

    if (sortBy === 'none') {
      return filtered;
    }

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === 'ambos-asc' || sortBy === 'estandar-asc') {
        const cmpEst = compareNaturalCodes(a.estandar, b.estandar, 'asc');
        if (cmpEst !== 0) return cmpEst;
        return compareNaturalCodes(a.subestandar, b.subestandar, 'asc');
      }

      if (sortBy === 'ambos-desc' || sortBy === 'estandar-desc') {
        const cmpEst = compareNaturalCodes(a.estandar, b.estandar, 'desc');
        if (cmpEst !== 0) return cmpEst;
        return compareNaturalCodes(a.subestandar, b.subestandar, 'desc');
      }

      if (sortBy === 'subestandar-asc') {
        const cmpSub = compareNaturalCodes(a.subestandar, b.subestandar, 'asc');
        if (cmpSub !== 0) return cmpSub;
        return compareNaturalCodes(a.estandar, b.estandar, 'asc');
      }

      if (sortBy === 'subestandar-desc') {
        const cmpSub = compareNaturalCodes(
          a.subestandar,
          b.subestandar,
          'desc'
        );
        if (cmpSub !== 0) return cmpSub;
        return compareNaturalCodes(a.estandar, b.estandar, 'desc');
      }

      return 0;
    });

    return sorted;
  }, [
    sourceRisks,
    searchTerm,
    selectedEstandar,
    selectedFactor,
    selectedSeverity,
    sortBy,
  ]);

  const handleResetRiskFilters = () => {
    setSearchTerm('');
    setSelectedEstandar('Todos');
    setSelectedFactor('Todos');
    setSelectedSeverity('Todos');
    setSortBy('none');
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Navegación Superior (3 Secciones) */}
      <RiesgosHeaderNav
        isAdmin={isAdmin}
        isLoading={isLoadingRisks || isLoadingNoticias}
        onRefresh={() => {
          refreshRisks();
          fetchNoticias();
        }}
        onOpenStandardModal={openStandardModal}
        onOpenCreateRiskModal={handleOpenCreateRiskModal}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        counts={{
          riesgos: sourceRisks.length,
          estandares: estandares.length,
          referencias: FUENTES_NORMATIVAS.length + noticias.length,
        }}
      />

      {/* SECCIÓN 1: RIESGOS */}
      {activeSection === 'riesgos' && (
        <div className="space-y-6">
          <RiesgosFilterBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedEstandar={selectedEstandar}
            setSelectedEstandar={setSelectedEstandar}
            availableStandards={availableStandards}
            sortBy={sortBy}
            setSortBy={setSortBy}
            selectedFactor={selectedFactor}
            setSelectedFactor={setSelectedFactor}
            selectedSeverity={selectedSeverity}
            setSelectedSeverity={setSelectedSeverity}
            onResetFilters={handleResetRiskFilters}
          />

          <RiesgosCatalogTable
            sourceRisks={sourceRisks}
            filteredRisks={filteredRisks}
            isAdmin={isAdmin}
            sortBy={sortBy}
            onToggleColumnSort={handleToggleColumnSort}
            onOpenCreateRiskModal={handleOpenCreateRiskModal}
            onOpenEditRiskModal={handleOpenEditRiskModal}
            onDeleteRisk={handleDeleteRisk}
            onResetFilters={handleResetRiskFilters}
          />
        </div>
      )}

      {/* SECCIÓN 2: ESTÁNDAR Y SUBESTÁNDAR */}
      {activeSection === 'estandar_subestandar' && (
        <EstandaresCatalogSection
          estandares={estandares}
          subestandares={subestandares}
          isAdmin={isAdmin}
          onOpenStandardModal={openStandardModal}
          onUpdateEstandar={updateEstandar}
          onRemoveEstandar={removeEstandar}
          onUpdateSubestandar={updateSubestandar}
          onRemoveSubestandar={removeSubestandar}
        />
      )}

      {/* SECCIÓN 3: REFERENCIAS Y NOTICIAS */}
      {activeSection === 'referencias_noticias' && (
        <ReferenciasNoticiasSection
          noticias={noticias}
          setNoticias={setNoticias}
          estandares={estandares}
          availableStandards={availableStandards}
          isAdmin={isAdmin}
        />
      )}

      {/* Modales Globales para Crear/Editar Estándar y Riesgo (exclusivos Admin) */}
      {isAdmin && (
        <>
          <NewStandardModal
            isOpen={isStandardModalOpen}
            onClose={closeStandardModal}
            estandares={estandares}
            subestandares={subestandares}
            onAddEstandar={addEstandar}
            onAddSubestandar={addSubestandar}
          />
          <NewRiskModal
            key={editingRisk?.id || 'new-risk-modal'}
            isOpen={isModalOpen}
            onClose={handleCloseRiskModal}
            onAddRisk={addRisk}
            onUpdateRisk={updateRisk}
            editingRisk={editingRisk}
          />
        </>
      )}
    </div>
  );
}
