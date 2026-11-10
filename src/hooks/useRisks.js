import { useState, useEffect, useMemo, useCallback } from 'react';
import { riskService } from '../services/riskService';
import { calculateRiskScore, getRiskSeverity } from '../utils/riskCalculations';

export function useRisks() {
  const [risks, setRisks] = useState(() => riskService.getRisks());
  const [rawEstandares, setRawEstandares] = useState(() =>
    riskService.getEstandares()
  );
  const [rawSubestandares, setRawSubestandares] = useState(() =>
    riskService.getSubestandares()
  );
  const [isLoadingRisks, setIsLoadingRisks] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStandardModalOpen, setIsStandardModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openStandardModal = () => setIsStandardModalOpen(true);
  const closeStandardModal = () => setIsStandardModalOpen(false);

  const refreshRisks = useCallback(async () => {
    setIsLoadingRisks(true);
    try {
      const [{ data }, estList, subList] = await Promise.all([
        riskService.fetchRisks(),
        riskService.fetchEstandares(),
        riskService.fetchSubestandares(),
      ]);
      setRisks(data);
      if (Array.isArray(estList)) setRawEstandares(estList);
      if (Array.isArray(subList)) setRawSubestandares(subList);
    } finally {
      setIsLoadingRisks(false);
    }
  }, []);

  useEffect(() => {
    refreshRisks();
  }, [refreshRisks]);

  useEffect(() => {
    riskService.saveRisks(risks);
  }, [risks]);

  useEffect(() => {
    riskService.saveEstandares(rawEstandares);
  }, [rawEstandares]);

  useEffect(() => {
    riskService.saveSubestandares(rawSubestandares);
  }, [rawSubestandares]);

  // Combinar estándares registrados con los códigos presentes en los riesgos existentes
  const estandares = useMemo(() => {
    const map = new Map();
    rawEstandares.forEach((e, idx) => {
      const code = (e.codigo_estandar || e.estandar || '').trim();
      if (code && code !== 'N/A') {
        map.set(code, {
          id: e.id ?? idx + 1,
          codigo_estandar: code,
          descripcion: e.descripcion || '',
        });
      }
    });
    risks.forEach((r, idx) => {
      const code = (r.codigo_estandar || r.estandar || '').trim();
      if (code && code !== 'N/A' && !map.has(code)) {
        map.set(code, {
          id: r.estandar_id ?? `est-${idx + 1}`,
          codigo_estandar: code,
          descripcion: `Estándar ${code}`,
        });
      }
    });
    return Array.from(map.values());
  }, [rawEstandares, risks]);

  // Combinar subestándares registrados con los presentes en los riesgos existentes
  const subestandares = useMemo(() => {
    const map = new Map();
    rawSubestandares.forEach((s, idx) => {
      const subCode = (s.codigo_subestandar || s.subestandar || '').trim();
      if (!subCode || subCode === 'N/A') return;
      const parentEst = estandares.find(
        (e) =>
          String(e.id) === String(s.estandar_id) ||
          e.codigo_estandar === s.codigo_estandar
      );
      const estCode = s.codigo_estandar || parentEst?.codigo_estandar || '';
      const key = `${estCode}::${subCode}`;
      map.set(key, {
        id: s.id ?? idx + 1,
        estandar_id: s.estandar_id ?? parentEst?.id ?? null,
        codigo_estandar: estCode,
        codigo_subestandar: subCode,
        descripcion: s.descripcion || '',
      });
    });

    risks.forEach((r, idx) => {
      const estCode = (r.codigo_estandar || r.estandar || '').trim();
      const subCode = (r.codigo_subestandar || r.subestandar || '').trim();
      if (!subCode || subCode === 'N/A') return;
      const key = `${estCode}::${subCode}`;
      if (!map.has(key)) {
        const parentEst = estandares.find(
          (e) => e.codigo_estandar === estCode
        );
        map.set(key, {
          id: r.subestandar_id ?? `sub-${idx + 1}`,
          estandar_id: parentEst?.id ?? null,
          codigo_estandar: estCode,
          codigo_subestandar: subCode,
          descripcion: `Subestándar ${subCode}`,
        });
      }
    });

    return Array.from(map.values());
  }, [rawSubestandares, estandares, risks]);

  const addEstandar = async ({ codigo_estandar, descripcion }) => {
    const created = await riskService.createEstandar({
      codigo_estandar,
      descripcion,
    });
    setRawEstandares((prev) => {
      const filtered = prev.filter(
        (e) => e.codigo_estandar !== created.codigo_estandar
      );
      return [created, ...filtered];
    });
    return created;
  };

  const addSubestandar = async ({
    estandar_id,
    codigo_estandar,
    codigo_subestandar,
    descripcion,
  }) => {
    const created = await riskService.createSubestandar({
      estandar_id,
      codigo_estandar,
      codigo_subestandar,
      descripcion,
    });
    setRawSubestandares((prev) => [created, ...prev]);
    return created;
  };

  const addRisk = async (newRisk) => {
    const createdRisk = await riskService.createRisk(newRisk);
    setRisks((prev) => [createdRisk, ...prev]);
    return createdRisk;
  };

  const removeRisk = async (id) => {
    await riskService.deleteRisk(id);
    setRisks((prev) => prev.filter((r) => r.id !== id));
  };

  const filteredRisks = useMemo(() => {
    return risks.filter((risk) => {
      const term = search.toLowerCase();
      const matchesSearch =
        (risk.title || '').toLowerCase().includes(term) ||
        (risk.responsible || '').toLowerCase().includes(term) ||
        String(risk.id || '').toLowerCase().includes(term);

      const matchesCategory =
        selectedCategory === 'Todas' || risk.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [risks, search, selectedCategory]);

  const stats = useMemo(() => {
    const total = risks.length;
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    risks.forEach((r) => {
      const score = calculateRiskScore(r.probability, r.impact);
      const severity = getRiskSeverity(score);
      if (severity.label === 'Crítico') critical++;
      else if (severity.label === 'Alto') high++;
      else if (severity.label === 'Medio') medium++;
      else low++;
    });

    return { total, critical, high, medium, low };
  }, [risks]);

  return {
    risks: filteredRisks,
    allRisks: risks,
    estandares,
    subestandares,
    addEstandar,
    addSubestandar,
    isLoadingRisks,
    refreshRisks,
    stats,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    isModalOpen,
    openModal,
    closeModal,
    isStandardModalOpen,
    openStandardModal,
    closeStandardModal,
    addRisk,
    removeRisk,
  };
}
