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

  const updateEstandar = async (
    id,
    { codigo_estandar, descripcion, oldCodigoEstandar }
  ) => {
    const updated = await riskService.updateEstandar(id, {
      codigo_estandar,
      descripcion,
    });

    setRawEstandares((prev) => {
      const exists = prev.some(
        (e) =>
          String(e.id) === String(id) ||
          (oldCodigoEstandar && e.codigo_estandar === oldCodigoEstandar)
      );
      if (!exists) return [updated, ...prev];
      return prev.map((e) =>
        String(e.id) === String(id) ||
        (oldCodigoEstandar && e.codigo_estandar === oldCodigoEstandar)
          ? updated
          : e
      );
    });

    if (oldCodigoEstandar && oldCodigoEstandar !== updated.codigo_estandar) {
      setRawSubestandares((prev) =>
        prev.map((s) =>
          String(s.estandar_id) === String(id) ||
          s.codigo_estandar === oldCodigoEstandar
            ? { ...s, codigo_estandar: updated.codigo_estandar }
            : s
        )
      );
      setRisks((prev) =>
        prev.map((r) =>
          String(r.estandar_id) === String(id) ||
          r.estandar === oldCodigoEstandar ||
          r.codigo_estandar === oldCodigoEstandar
            ? {
                ...r,
                estandar: updated.codigo_estandar,
                codigo_estandar: updated.codigo_estandar,
              }
            : r
        )
      );
    }

    return updated;
  };

  const removeEstandar = async (estandarObj) => {
    const id = estandarObj?.id ?? estandarObj;
    const codigo = estandarObj?.codigo_estandar;
    await riskService.deleteEstandar(id);

    setRawEstandares((prev) =>
      prev.filter(
        (e) =>
          String(e.id) !== String(id) &&
          (!codigo || e.codigo_estandar !== codigo)
      )
    );
    setRawSubestandares((prev) =>
      prev.filter(
        (s) =>
          String(s.estandar_id) !== String(id) &&
          (!codigo || s.codigo_estandar !== codigo)
      )
    );
    if (codigo) {
      setRisks((prev) =>
        prev.filter(
          (r) =>
            String(r.estandar_id) !== String(id) &&
            r.estandar !== codigo &&
            r.codigo_estandar !== codigo
        )
      );
    }
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

  const updateSubestandar = async (
    id,
    {
      estandar_id,
      codigo_estandar,
      codigo_subestandar,
      descripcion,
      oldCodigoSubestandar,
    }
  ) => {
    const updated = await riskService.updateSubestandar(id, {
      estandar_id,
      codigo_estandar,
      codigo_subestandar,
      descripcion,
    });

    setRawSubestandares((prev) => {
      const exists = prev.some(
        (s) =>
          String(s.id) === String(id) ||
          (oldCodigoSubestandar &&
            s.codigo_subestandar === oldCodigoSubestandar)
      );
      if (!exists) return [updated, ...prev];
      return prev.map((s) =>
        String(s.id) === String(id) ||
        (oldCodigoSubestandar && s.codigo_subestandar === oldCodigoSubestandar)
          ? updated
          : s
      );
    });

    if (
      oldCodigoSubestandar &&
      oldCodigoSubestandar !== updated.codigo_subestandar
    ) {
      setRisks((prev) =>
        prev.map((r) =>
          String(r.subestandar_id) === String(id) ||
          r.subestandar === oldCodigoSubestandar ||
          r.codigo_subestandar === oldCodigoSubestandar
            ? {
                ...r,
                estandar: updated.codigo_estandar || r.estandar,
                codigo_estandar:
                  updated.codigo_estandar || r.codigo_estandar,
                subestandar: updated.codigo_subestandar,
                codigo_subestandar: updated.codigo_subestandar,
              }
            : r
        )
      );
    }

    return updated;
  };

  const removeSubestandar = async (subestandarObj) => {
    const id = subestandarObj?.id ?? subestandarObj;
    const codigoSub = subestandarObj?.codigo_subestandar;
    await riskService.deleteSubestandar(id);

    setRawSubestandares((prev) =>
      prev.filter(
        (s) =>
          String(s.id) !== String(id) &&
          (!codigoSub || s.codigo_subestandar !== codigoSub)
      )
    );
    if (codigoSub) {
      setRisks((prev) =>
        prev.filter(
          (r) =>
            String(r.subestandar_id) !== String(id) &&
            r.subestandar !== codigoSub &&
            r.codigo_subestandar !== codigoSub
        )
      );
    }
  };

  const addRisk = async (newRisk) => {
    const createdRisk = await riskService.createRisk(newRisk);
    setRisks((prev) => [createdRisk, ...prev]);
    return createdRisk;
  };

  const updateRisk = async (id, updatedData) => {
    const updatedRisk = await riskService.updateRisk(id, updatedData);
    setRisks((prev) =>
      prev.map((r) => (String(r.id) === String(id) ? updatedRisk : r))
    );
    return updatedRisk;
  };

  const removeRisk = async (id) => {
    await riskService.deleteRisk(id);
    setRisks((prev) => prev.filter((r) => String(r.id) !== String(id)));
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
    updateEstandar,
    removeEstandar,
    addSubestandar,
    updateSubestandar,
    removeSubestandar,
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
    updateRisk,
    removeRisk,
  };
}
