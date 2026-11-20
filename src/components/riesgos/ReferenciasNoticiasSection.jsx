import { useState } from 'react';
import {
  BookOpen,
  Newspaper,
  PlusCircle,
  Building2,
  Layers,
  Calendar,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  DEFAULT_FECHA_HOY,
  FUENTES_NORMATIVAS,
  normalizeNoticiaRecord,
  saveStoredNoticias,
} from './noticiasHelpers';

export function ReferenciasNoticiasSection({
  noticias = [],
  setNoticias,
  estandares = [],
  availableStandards = [],
  isAdmin = false,
}) {
  const [isNoticiaModalOpen, setIsNoticiaModalOpen] = useState(false);
  const [editingNoticia, setEditingNoticia] = useState(null);
  const [noticiaForm, setNoticiaForm] = useState({
    nombre: '',
    area: '',
    fecha: DEFAULT_FECHA_HOY,
    texto: '',
    codigo_estandar: '',
  });
  const [isSavingNoticia, setIsSavingNoticia] = useState(false);
  const [noticiaError, setNoticiaError] = useState('');

  const handleOpenCreateNoticiaModal = () => {
    if (!isAdmin) return;
    setNoticiaError('');
    setEditingNoticia(null);
    setNoticiaForm({
      nombre: '',
      area: '',
      fecha: DEFAULT_FECHA_HOY,
      texto: '',
      codigo_estandar:
        availableStandards[0]?.codigo || estandares[0]?.codigo_estandar || '',
    });
    setIsNoticiaModalOpen(true);
  };

  const handleOpenEditNoticiaModal = (noticia) => {
    if (!isAdmin) return;
    setNoticiaError('');
    setEditingNoticia(noticia);
    setNoticiaForm({
      nombre: noticia.nombre || '',
      area: noticia.area || '',
      fecha: noticia.fecha || DEFAULT_FECHA_HOY,
      texto: noticia.texto || '',
      codigo_estandar: noticia.codigo_estandar || '',
    });
    setIsNoticiaModalOpen(true);
  };

  const handleCloseNoticiaModal = () => {
    setEditingNoticia(null);
    setNoticiaError('');
    setIsNoticiaModalOpen(false);
  };

  const handleSaveNoticia = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setNoticiaError('');

    const cleanNombre = noticiaForm.nombre.trim();
    const cleanArea = noticiaForm.area.trim();
    const cleanFecha = noticiaForm.fecha.trim() || DEFAULT_FECHA_HOY;
    const cleanTexto = noticiaForm.texto.trim();
    const cleanCodigoEstandar = noticiaForm.codigo_estandar.trim();

    if (
      !cleanNombre ||
      !cleanArea ||
      !cleanFecha ||
      !cleanTexto ||
      !cleanCodigoEstandar
    ) {
      setNoticiaError(
        'Todos los campos (Nombre, Área, Fecha, Estándar asociado y Texto) son obligatorios.'
      );
      return;
    }

    const matchedEstandar = estandares.find(
      (est) =>
        String(est.codigo_estandar).trim().toLowerCase() ===
        cleanCodigoEstandar.toLowerCase()
    );

    const payload = {
      nombre: cleanNombre,
      area: cleanArea,
      fecha: cleanFecha,
      texto: cleanTexto,
      estandar_id: matchedEstandar?.id ? Number(matchedEstandar.id) : null,
      codigo_estandar: cleanCodigoEstandar,
    };

    setIsSavingNoticia(true);
    try {
      if (editingNoticia) {
        let updatedRecord = normalizeNoticiaRecord({
          ...editingNoticia,
          ...payload,
          id: editingNoticia.id,
        });

        try {
          const response = await api.put(
            `/noticias/${editingNoticia.id}`,
            payload
          );
          const serverNoticia = response?.noticia || response;
          if (serverNoticia && typeof serverNoticia === 'object') {
            updatedRecord = normalizeNoticiaRecord({
              ...payload,
              ...serverNoticia,
              id: serverNoticia.id ?? editingNoticia.id,
            });
          }
        } catch (err) {
          if (err.status && err.status !== 404) {
            throw new Error(
              err.message || 'No se pudo actualizar la noticia en el servidor.'
            );
          }
        }

        setNoticias((prev) => {
          const next = prev.map((n) =>
            String(n.id) === String(editingNoticia.id) ? updatedRecord : n
          );
          saveStoredNoticias(next);
          return next;
        });
      } else {
        let createdRecord = normalizeNoticiaRecord({
          ...payload,
          id: Date.now(),
        });

        try {
          const response = await api.post('/noticias', payload);
          const serverNoticia = response?.noticia || response;
          if (serverNoticia && typeof serverNoticia === 'object') {
            createdRecord = normalizeNoticiaRecord({
              ...payload,
              ...serverNoticia,
              id: serverNoticia.id ?? Date.now(),
            });
          }
        } catch (err) {
          if (err.status && err.status !== 404) {
            throw new Error(
              err.message || 'No se pudo registrar la noticia en el servidor.'
            );
          }
        }

        setNoticias((prev) => {
          const next = [createdRecord, ...prev];
          saveStoredNoticias(next);
          return next;
        });
      }

      handleCloseNoticiaModal();
    } catch (err) {
      setNoticiaError(
        err.message || 'Ocurrió un error al guardar la noticia.'
      );
    } finally {
      setIsSavingNoticia(false);
    }
  };

  const handleDeleteNoticia = async (noticia) => {
    if (!isAdmin || !noticia) return;
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar la noticia "${noticia.nombre}"?`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/noticias/${noticia.id}`);
    } catch (err) {
      if (err.status && err.status !== 404) {
        alert(err.message || 'No se pudo eliminar la noticia del servidor.');
        return;
      }
    }

    setNoticias((prev) => {
      const next = prev.filter((n) => String(n.id) !== String(noticia.id));
      saveStoredNoticias(next);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Bloque de Referencias Normativas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Fuentes y Referencias Normativas
            </h2>
            <p className="text-xs text-slate-500">
              Estándares y marcos de referencia utilizados para la identificación y evaluación de riesgos sugeridos.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {FUENTES_NORMATIVAS.map((fuente) => (
            <div
              key={fuente.id}
              className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-mono font-bold text-[11px]">
                  {fuente.codigo}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                {fuente.titulo}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {fuente.descripcion}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Apartado de Noticias (CRUD exclusivo para Admin, solo visualización para otros usuarios) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900">
                  Noticias y Boletines de Gestión de Riesgos
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  {noticias.length}{' '}
                  {noticias.length === 1 ? 'publicación' : 'publicaciones'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAdmin
                  ? 'Panel de administración de noticias asociadas a los estándares. Puedes agregar, editar o eliminar noticias.'
                  : 'Consulta de noticias, avisos normativos y comunicados asociados a los estándares.'}
              </p>
            </div>
          </div>

          {/* Botón Agregar Noticia únicamente para rol="Admin" */}
          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenCreateNoticiaModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 transition-colors cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              Nueva Noticia
            </button>
          )}
        </div>

        {noticias.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {noticias.map((noticia) => (
              <div
                key={noticia.id}
                className="p-5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between gap-4 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-3">
                  {/* Metadatos superiores: Área, Estándar Asociado y Fecha */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-semibold text-[11px]"
                        title="Área a la que pertenece"
                      >
                        <Building2 className="w-3 h-3 shrink-0" />
                        {noticia.area}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-mono font-bold text-[11px]"
                        title="Estándar asociado"
                      >
                        <Layers className="w-3 h-3 shrink-0" />
                        Estándar: {noticia.codigo_estandar}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono font-medium">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {noticia.fecha}
                    </span>
                  </div>

                  {/* Nombre de la noticia */}
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {noticia.nombre}
                  </h3>

                  {/* Texto de la noticia */}
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {noticia.texto}
                  </p>
                </div>

                {/* Acciones de Editar y Eliminar únicamente visibles para usuario tipo Admin */}
                {isAdmin && (
                  <div className="pt-3 border-t border-slate-200/70 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditNoticiaModal(noticia)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold text-xs transition-colors cursor-pointer"
                      title="Editar noticia"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNoticia(noticia)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 font-semibold text-xs transition-colors cursor-pointer"
                      title="Eliminar noticia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 py-10 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
            <Newspaper className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">
              No hay noticias registradas actualmente.
            </p>
            {isAdmin ? (
              <button
                type="button"
                onClick={handleOpenCreateNoticiaModal}
                className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Agregar Primera Noticia
              </button>
            ) : (
              <p className="text-xs text-slate-400">
                El administrador aún no ha publicado noticias en este apartado.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal para Agregar o Editar Noticia (exclusivo Admin) */}
      {isAdmin && isNoticiaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <Newspaper className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingNoticia
                      ? 'Editar Noticia'
                      : 'Registrar Nueva Noticia'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Completa los datos de la noticia y el estándar al que se asocia.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseNoticiaModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {noticiaError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{noticiaError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNoticia} className="mt-4 space-y-4">
              {/* Nombre de la noticia */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre de la Noticia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Actualización de controles en cadena de suministro"
                  value={noticiaForm.nombre}
                  onChange={(e) =>
                    setNoticiaForm({
                      ...noticiaForm,
                      nombre: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Área a la que pertenece y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Área a la que pertenece *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Seguridad TI, Aduanas, Operaciones..."
                    value={noticiaForm.area}
                    onChange={(e) =>
                      setNoticiaForm({
                        ...noticiaForm,
                        area: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={noticiaForm.fecha}
                    onChange={(e) =>
                      setNoticiaForm({
                        ...noticiaForm,
                        fecha: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Estándar al que se asocia */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Estándar al que se asocia *
                </label>
                <select
                  required
                  value={noticiaForm.codigo_estandar}
                  onChange={(e) =>
                    setNoticiaForm({
                      ...noticiaForm,
                      codigo_estandar: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Seleccionar Estándar --</option>
                  {availableStandards.map((est) => (
                    <option key={est.codigo} value={est.codigo}>
                      {est.codigo}
                      {est.descripcion ? ` — ${est.descripcion}` : ''}
                    </option>
                  ))}
                  <option value="General">General (Todos los estándares)</option>
                </select>
              </div>

              {/* Texto de la noticia */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Texto *
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Escribe el contenido completo de la noticia o comunicado..."
                  value={noticiaForm.texto}
                  onChange={(e) =>
                    setNoticiaForm({
                      ...noticiaForm,
                      texto: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseNoticiaModal}
                  disabled={isSavingNoticia}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingNoticia}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  {isSavingNoticia ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>
                      {editingNoticia
                        ? 'Guardar Cambios'
                        : 'Publicar Noticia'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
