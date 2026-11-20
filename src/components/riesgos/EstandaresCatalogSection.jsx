import { useState, useMemo } from 'react';
import {
  Layers,
  Pencil,
  Trash2,
  PlusCircle,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export function EstandaresCatalogSection({
  estandares = [],
  subestandares = [],
  isAdmin = false,
  onOpenStandardModal,
  onUpdateEstandar,
  onRemoveEstandar,
  onUpdateSubestandar,
  onRemoveSubestandar,
}) {
  const [editingCatalogRow, setEditingCatalogRow] = useState(null);
  const [catalogForm, setCatalogForm] = useState({
    codigo_estandar: '',
    descripcion_estandar: '',
    codigo_subestandar: '',
    descripcion_subestandar: '',
  });
  const [isSavingCatalogEdit, setIsSavingCatalogEdit] = useState(false);
  const [catalogEditError, setCatalogEditError] = useState('');

  // Construir las filas de la tabla de Estándares y Subestándares registrados
  const standardsTableRows = useMemo(() => {
    const rows = [];
    const matchedSubIds = new Set();

    estandares.forEach((est) => {
      const associatedSubs = subestandares.filter(
        (sub) =>
          sub.codigo_estandar === est.codigo_estandar ||
          (est.id !== undefined &&
            est.id !== null &&
            String(sub.estandar_id) === String(est.id))
      );

      if (associatedSubs.length === 0) {
        rows.push({
          rowKey: `est-${est.id || est.codigo_estandar}`,
          estandar: est,
          subestandar: null,
        });
      } else {
        associatedSubs.forEach((sub) => {
          matchedSubIds.add(
            String(sub.id ?? `${sub.codigo_estandar}-${sub.codigo_subestandar}`)
          );
          rows.push({
            rowKey: `est-${est.id || est.codigo_estandar}-sub-${
              sub.id || sub.codigo_subestandar
            }`,
            estandar: est,
            subestandar: sub,
          });
        });
      }
    });

    // Incluir cualquier subestándar huérfano si existiera
    subestandares.forEach((sub) => {
      const key = String(
        sub.id ?? `${sub.codigo_estandar}-${sub.codigo_subestandar}`
      );
      if (!matchedSubIds.has(key)) {
        rows.push({
          rowKey: `orphan-sub-${key}`,
          estandar: {
            id: sub.estandar_id ?? null,
            codigo_estandar: sub.codigo_estandar || 'N/A',
            descripcion: '',
          },
          subestandar: sub,
        });
      }
    });

    return rows;
  }, [estandares, subestandares]);

  const handleOpenEditCatalogRow = (row) => {
    setCatalogEditError('');
    setEditingCatalogRow(row);
    setCatalogForm({
      codigo_estandar: row.estandar?.codigo_estandar || '',
      descripcion_estandar: row.estandar?.descripcion || '',
      codigo_subestandar: row.subestandar?.codigo_subestandar || '',
      descripcion_subestandar: row.subestandar?.descripcion || '',
    });
  };

  const handleSaveCatalogEdit = async (e) => {
    e.preventDefault();
    if (!editingCatalogRow) return;
    setCatalogEditError('');

    if (!catalogForm.codigo_estandar.trim()) {
      setCatalogEditError('El código del estándar es obligatorio.');
      return;
    }

    if (
      editingCatalogRow.subestandar &&
      !catalogForm.codigo_subestandar.trim()
    ) {
      setCatalogEditError('El código del subestándar es obligatorio.');
      return;
    }

    setIsSavingCatalogEdit(true);
    try {
      const updatedEst = await onUpdateEstandar(editingCatalogRow.estandar.id, {
        codigo_estandar: catalogForm.codigo_estandar.trim(),
        descripcion: catalogForm.descripcion_estandar.trim(),
        oldCodigoEstandar: editingCatalogRow.estandar.codigo_estandar,
      });

      if (editingCatalogRow.subestandar) {
        await onUpdateSubestandar(editingCatalogRow.subestandar.id, {
          estandar_id:
            updatedEst?.id ??
            editingCatalogRow.subestandar.estandar_id ??
            editingCatalogRow.estandar.id,
          codigo_estandar:
            updatedEst?.codigo_estandar || catalogForm.codigo_estandar.trim(),
          codigo_subestandar: catalogForm.codigo_subestandar.trim(),
          descripcion: catalogForm.descripcion_subestandar.trim(),
          oldCodigoSubestandar:
            editingCatalogRow.subestandar.codigo_subestandar,
        });
      }

      setEditingCatalogRow(null);
    } catch (err) {
      setCatalogEditError(
        err.message ||
          'No se pudieron guardar los cambios del estándar/subestándar.'
      );
    } finally {
      setIsSavingCatalogEdit(false);
    }
  };

  const handleDeleteSubestandarRow = async (subestandar) => {
    if (!subestandar) return;
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar el subestándar "${subestandar.codigo_subestandar}"?`
    );
    if (!confirmed) return;
    await onRemoveSubestandar(subestandar);
  };

  const handleDeleteEstandarRow = async (estandar) => {
    if (!estandar) return;
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar el estándar "${estandar.codigo_estandar}" y todos sus subestándares asociados?`
    );
    if (!confirmed) return;
    await onRemoveEstandar(estandar);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Estándares y Subestándares Registrados
              </h2>
              <p className="text-xs text-slate-500">
                Catálogo normativo de estándares y sus subestándares asociados en la base de datos.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Estándares:{' '}
            <strong className="text-slate-800">{estandares.length}</strong>{' '}
            &bull; Subestándares:{' '}
            <strong className="text-slate-800">{subestandares.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th
                  colSpan={2}
                  className="bg-indigo-700 text-white py-3 px-4 text-center font-bold tracking-wider uppercase text-xs border-r-2 border-indigo-800"
                >
                  Estándar
                </th>
                <th
                  colSpan={2}
                  className={`bg-teal-700 text-white py-3 px-4 text-center font-bold tracking-wider uppercase text-xs ${
                    isAdmin ? 'border-r-2 border-teal-800' : ''
                  }`}
                >
                  Subestándar
                </th>
                {isAdmin && (
                  <th
                    colSpan={1}
                    className="bg-slate-800 text-white py-3 px-3 text-center font-bold tracking-wider uppercase text-xs"
                  >
                    Acciones
                  </th>
                )}
              </tr>

              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-36 text-center border-r border-slate-200 bg-indigo-50/70 text-indigo-950">
                  Código Estándar
                </th>
                <th className="py-3 px-4 min-w-[220px] border-r-2 border-indigo-200 bg-indigo-50/40 text-indigo-950">
                  Descripción del Estándar
                </th>
                <th className="py-3 px-4 w-40 text-center border-r border-slate-200 bg-teal-50/70 text-teal-950">
                  Código Subestándar
                </th>
                <th
                  className={`py-3 px-4 min-w-[220px] bg-teal-50/40 text-teal-950 ${
                    isAdmin ? 'border-r-2 border-teal-200' : ''
                  }`}
                >
                  Descripción del Subestándar
                </th>
                {isAdmin && (
                  <th className="py-3 px-3 w-44 text-center bg-slate-100 text-slate-800">
                    Modificar / Eliminar
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {standardsTableRows.length > 0 ? (
                standardsTableRows.map((row) => (
                  <tr
                    key={row.rowKey}
                    className="hover:bg-slate-50/90 transition-colors leading-relaxed"
                  >
                    {/* Código Estándar */}
                    <td className="py-3.5 px-4 text-center border-r border-slate-100 font-mono bg-slate-50/30">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[11px]">
                        {row.estandar?.codigo_estandar || 'N/A'}
                      </span>
                    </td>

                    {/* Descripción del Estándar */}
                    <td className="py-3.5 px-4 border-r-2 border-indigo-100 text-slate-700">
                      <p className="text-[11.5px] font-medium">
                        {row.estandar?.descripcion ||
                          'Sin descripción registrada'}
                      </p>
                    </td>

                    {/* Código Subestándar */}
                    <td className="py-3.5 px-4 text-center border-r border-slate-100 font-mono bg-slate-50/20">
                      {row.subestandar ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-bold text-[11px]">
                          {row.subestandar.codigo_subestandar}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic font-sans">
                          Sin subestándar
                        </span>
                      )}
                    </td>

                    {/* Descripción del Subestándar */}
                    <td
                      className={`py-3.5 px-4 text-slate-600 ${
                        isAdmin ? 'border-r-2 border-teal-100' : ''
                      }`}
                    >
                      {row.subestandar ? (
                        <p className="text-[11.5px]">
                          {row.subestandar.descripcion ||
                            'Sin descripción registrada'}
                        </p>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Aún no se han registrado subestándares para este estándar
                        </span>
                      )}
                    </td>

                    {/* Columna de Acciones exclusiva para rol="Admin" */}
                    {isAdmin && (
                      <td className="py-3 px-3 text-center bg-slate-50/30">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCatalogRow(row)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold text-[11px] transition-colors cursor-pointer"
                            title="Modificar estándar y subestándar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </button>

                          {row.subestandar && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteSubestandarRow(row.subestandar)
                              }
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 font-semibold text-[11px] transition-colors cursor-pointer"
                              title={`Eliminar subestándar ${row.subestandar.codigo_subestandar}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Sub
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteEstandarRow(row.estandar)
                            }
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 font-semibold text-[11px] transition-colors cursor-pointer"
                            title={`Eliminar estándar ${row.estandar?.codigo_estandar}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Est
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    className="py-10 text-center text-slate-500 bg-white"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Layers className="w-7 h-7 text-slate-300" />
                      <p className="font-medium text-sm text-slate-700">
                        No hay estándares ni subestándares registrados aún.
                      </p>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={onOpenStandardModal}
                          className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Registrar Nuevo Estándar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para editar Estándar y Subestándar (exclusivo Admin) */}
      {isAdmin && editingCatalogRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Modificar Estándar / Subestándar
                  </h3>
                  <p className="text-xs text-slate-500">
                    Actualiza el código o descripción en la base de datos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCatalogRow(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {catalogEditError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{catalogEditError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCatalogEdit} className="mt-4 space-y-4">
              {/* Bloque Estándar */}
              <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-3">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  Datos del Estándar
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Código del Estándar *
                  </label>
                  <input
                    type="text"
                    required
                    value={catalogForm.codigo_estandar}
                    onChange={(e) =>
                      setCatalogForm({
                        ...catalogForm,
                        codigo_estandar: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Descripción del Estándar *
                  </label>
                  <textarea
                    rows="2"
                    required
                    value={catalogForm.descripcion_estandar}
                    onChange={(e) =>
                      setCatalogForm({
                        ...catalogForm,
                        descripcion_estandar: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Bloque Subestándar */}
              {editingCatalogRow.subestandar && (
                <div className="p-4 rounded-xl bg-teal-50/40 border border-teal-100 space-y-3">
                  <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                    Datos del Subestándar Asociado
                  </h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Código del Subestándar *
                    </label>
                    <input
                      type="text"
                      required
                      value={catalogForm.codigo_subestandar}
                      onChange={(e) =>
                        setCatalogForm({
                          ...catalogForm,
                          codigo_subestandar: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Descripción del Subestándar *
                    </label>
                    <textarea
                      rows="2"
                      required
                      value={catalogForm.descripcion_subestandar}
                      onChange={(e) =>
                        setCatalogForm({
                          ...catalogForm,
                          descripcion_subestandar: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCatalogRow(null)}
                  disabled={isSavingCatalogEdit}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingCatalogEdit}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  {isSavingCatalogEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
