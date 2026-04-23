import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Save, X, Tag as TagIcon, Filter, AlertCircle } from 'lucide-react';
import { TagGlobal } from '../../types';
import { TagService } from '../../services/TagService';
import { useModal } from '../../hooks/useModal';

type CategoryType = TagGlobal['categoria'];
type OriginType = TagGlobal['origen'];

const CATEGORIAS: { value: CategoryType; label: string; color: string }[] = [
  { value: 'atributo', label: 'Atributo', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { value: 'efecto', label: 'Efecto', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { value: 'condicion', label: 'Condición', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  { value: 'recurso', label: 'Recurso', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  { value: 'mecanica', label: 'Mecánica', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { value: 'tipo_de_danio', label: 'Tipo de Daño', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  { value: 'defensivo', label: 'Defensivo', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { value: 'otro', label: 'Otro', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' }
];

const ORIGENES: { value: OriginType; label: string }[] = [
  { value: 'tooltip', label: 'Tooltip' },
  { value: 'estadistica', label: 'Estadística' },
  { value: 'habilidad', label: 'Habilidad' },
  { value: 'aspecto', label: 'Aspecto' },
  { value: 'glifo', label: 'Glifo' },
  { value: 'manual', label: 'Manual' }
];

export function TagsManager() {
  const modal = useModal();
  const [tags, setTags] = useState<TagGlobal[]>([]);
  const [filteredTags, setFilteredTags] = useState<TagGlobal[]>([]);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType | 'all'>('all');
  const [originFilter, setOriginFilter] = useState<OriginType | 'all'>('all');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  
  // Estados de edición
  const [editingTag, setEditingTag] = useState<TagGlobal | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTag, setNewTag] = useState<Partial<TagGlobal>>({
    tag: '',
    texto_original: '',
    significado: '',
    categoria: 'otro',
    origen: 'manual',
    sinonimos: [],
    pendiente_revision: false
  });

  // Cargar tags al montar
  useEffect(() => {
    loadTags();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Resetear a página 1 cuando cambian filtros
  }, [tags, searchQuery, categoryFilter, originFilter, showPendingOnly]);

  // Calcular tags de la página actual
  const totalPages = Math.ceil(filteredTags.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTags = filteredTags.slice(startIndex, endIndex);

  const loadTags = () => {
    const loadedTags = TagService.getTags();
    setTags(loadedTags);
  };

  const applyFilters = () => {
    let result = [...tags];

    // Búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(tag =>
        tag.tag.includes(query) ||
        tag.texto_original.toLowerCase().includes(query) ||
        (tag.significado && tag.significado.toLowerCase().includes(query)) ||
        tag.sinonimos.some(s => s.toLowerCase().includes(query))
      );
    }

    // Filtro categoría
    if (categoryFilter !== 'all') {
      result = result.filter(tag => tag.categoria === categoryFilter);
    }

    // Filtro origen
    if (originFilter !== 'all') {
      result = result.filter(tag => tag.origen === originFilter);
    }

    // Solo pendientes
    if (showPendingOnly) {
      result = result.filter(tag => tag.pendiente_revision);
    }

    setFilteredTags(result);
  };

  const handleSaveEdit = async () => {
    if (!editingTag) return;

    try {
      // Validaciones
      if (!editingTag.tag.trim() || !editingTag.texto_original.trim()) {
        modal.showError('Tag y texto original son obligatorios');
        return;
      }

      await TagService.addOrUpdateTag(editingTag);
      loadTags();
      setEditingTag(null);
      modal.showSuccess('Tag actualizado');
    } catch (error) {
      modal.showError('Error al guardar tag');
      console.error(error);
    }
  };

  const handleDeleteTag = async (tag: TagGlobal) => {
    const confirmed = await modal.showConfirm(
      `¿Eliminar el tag "${tag.texto_original}"?`,
      'Esta acción no se puede deshacer.'
    );

    if (!confirmed) return;

    try {
      await TagService.deleteTag(tag.id);
      loadTags();
      modal.showSuccess('Tag eliminado');
    } catch (error) {
      modal.showError('Error al eliminar tag');
      console.error(error);
    }
  };

  const handleAddTag = async () => {
    try {
      // Validaciones
      if (!newTag.tag?.trim() || !newTag.texto_original?.trim()) {
        modal.showError('Tag y texto original son obligatorios');
        return;
      }

      // Verificar si ya existe
      const existing = TagService.findTagByNormalizedName(newTag.tag.trim());
      if (existing) {
        modal.showError('Ya existe un tag con ese nombre normalizado');
        return;
      }

      // Crear nuevo tag
      const tagToAdd: TagGlobal = {
        id: `tag_${newTag.tag}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        tag: newTag.tag.trim(),
        texto_original: newTag.texto_original.trim(),
        significado: newTag.significado?.trim() || null,
        categoria: newTag.categoria || 'otro',
        descripcion_jugabilidad: null,
        sinonimos: newTag.sinonimos || [],
        origen: newTag.origen || 'manual',
        pendiente_revision: newTag.pendiente_revision || false,
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      };

      await TagService.addOrUpdateTag(tagToAdd);
      loadTags();
      setShowAddModal(false);
      setNewTag({
        tag: '',
        texto_original: '',
        significado: '',
        categoria: 'otro',
        origen: 'manual',
        sinonimos: [],
        pendiente_revision: false
      });
      modal.showSuccess('Tag creado');
    } catch (error) {
      modal.showError('Error al crear tag');
      console.error(error);
    }
  };

  const getCategoryInfo = (categoria: CategoryType) => {
    return CATEGORIAS.find(c => c.value === categoria) || CATEGORIAS[7];
  };

  const togglePendingRevision = async (tag: TagGlobal) => {
    const updated = { ...tag, pendiente_revision: !tag.pendiente_revision };
    await TagService.addOrUpdateTag(updated);
    loadTags();
  };

  return (
    <div className="space-y-4">
      {/* Header mejorado con estilo uniforme */}
      <div className="card p-6 bg-gradient-to-br from-d4-surface via-d4-bg to-d4-surface border-2 border-d4-accent/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-d4-accent/20 rounded-lg border-2 border-d4-accent/40">
              <TagIcon className="w-6 h-6 text-d4-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-d4-accent mb-1">
                Gestor de Tags
              </h1>
              <p className="text-d4-text-dim text-sm">
                Sistema de etiquetado y categorización global
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg bg-gradient-to-r from-amber-600 to-yellow-600 text-black hover:from-amber-500 hover:to-yellow-500 hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Tag</span>
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center border-2 border-d4-border hover:border-d4-accent/50 transition-colors">
          <div className="text-3xl font-bold text-d4-accent">{tags.length}</div>
          <div className="text-xs text-d4-text-dim font-semibold mt-1">Total Tags</div>
        </div>
        <div className="card p-4 text-center border-2 border-d4-border hover:border-yellow-500/50 transition-colors">
          <div className="text-3xl font-bold text-yellow-400">
            {tags.filter(t => t.pendiente_revision).length}
          </div>
          <div className="text-xs text-d4-text-dim font-semibold mt-1">Pendientes Revisión</div>
        </div>
        <div className="card p-4 text-center border-2 border-d4-border hover:border-green-500/50 transition-colors">
          <div className="text-3xl font-bold text-green-400">{filteredTags.length}</div>
          <div className="text-xs text-d4-text-dim font-semibold mt-1">Filtrados</div>
        </div>
      </div>

      {/* Panel de filtros separado */}
      <div className="card">
        <div className="p-4 border-b-2 border-d4-border">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-d4-accent" />
            <h3 className="text-lg font-bold text-d4-text">Filtros de Búsqueda</h3>
          </div>
        </div>
        <div className="p-4 space-y-3 bg-gradient-to-r from-d4-surface/80 to-d4-bg/80">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-d4-accent" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por tag, texto original, significado o sinónimos..."
              className="input w-full !pl-10"
            />
          </div>

          {/* Filtros de categoría y origen */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-d4-text-dim mb-1 font-semibold">Categoría</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as CategoryType | 'all')}
                className="input w-full text-sm"
              >
                <option value="all">Todas</option>
                {CATEGORIAS.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-d4-text-dim mb-1 font-semibold">Origen</label>
              <select
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value as OriginType | 'all')}
                className="input w-full text-sm"
              >
                <option value="all">Todos</option>
                {ORIGENES.map(orig => (
                  <option key={orig.value} value={orig.value}>{orig.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPendingOnly}
                  onChange={(e) => setShowPendingOnly(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-d4-text">Solo pendientes</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de tags */}
      <div className="space-y-3">
        {/* Paginador superior */}
        {filteredTags.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 bg-d4-bg rounded-lg border border-d4-border">
            <div className="flex items-center gap-3 text-sm text-d4-text">
              <span>Mostrando {startIndex + 1}-{Math.min(endIndex, filteredTags.length)} de {filteredTags.length}</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="input py-1 px-2 text-xs"
              >
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
                <option value={100}>100 por página</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded text-xs bg-d4-surface hover:bg-d4-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Primera
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded text-xs bg-d4-surface hover:bg-d4-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ‹ Anterior
              </button>
              <span className="text-xs text-d4-text-dim">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded text-xs bg-d4-surface hover:bg-d4-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded text-xs bg-d4-surface hover:bg-d4-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Última
              </button>
            </div>
          </div>
        )}
        
        {filteredTags.length === 0 ? (
          <div className="card p-8 text-center">
            <TagIcon className="w-12 h-12 text-d4-text-dim mx-auto mb-2" />
            <p className="text-d4-text-dim">No hay tags que mostrar</p>
          </div>
        ) : (
          <div className="space-y-2">
          {paginatedTags.map(tag => (
            <div key={tag.id} className="card p-3">
              {editingTag?.id === tag.id ? (
                // Modo edición
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-d4-text-dim mb-1">Tag Normalizado</label>
                      <input
                        type="text"
                        value={editingTag.tag}
                        onChange={(e) => setEditingTag({ ...editingTag, tag: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-d4-text-dim mb-1">Texto Original</label>
                      <input
                        type="text"
                        value={editingTag.texto_original}
                        onChange={(e) => setEditingTag({ ...editingTag, texto_original: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-d4-text-dim mb-1">Significado</label>
                    <textarea
                      value={editingTag.significado || ''}
                      onChange={(e) => setEditingTag({ ...editingTag, significado: e.target.value })}
                      className="input w-full"
                      rows={2}
                      placeholder="Definición del término..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-d4-text-dim mb-1">Categoría</label>
                      <select
                        value={editingTag.categoria}
                        onChange={(e) => setEditingTag({ ...editingTag, categoria: e.target.value as CategoryType })}
                        className="input w-full"
                      >
                        {CATEGORIAS.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-d4-text-dim mb-1">Origen</label>
                      <select
                        value={editingTag.origen}
                        onChange={(e) => setEditingTag({ ...editingTag, origen: e.target.value as OriginType })}
                        className="input w-full"
                      >
                        {ORIGENES.map(orig => (
                          <option key={orig.value} value={orig.value}>{orig.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-d4-text-dim mb-1">Sinónimos (separados por coma)</label>
                    <input
                      type="text"
                      value={editingTag.sinonimos.join(', ')}
                      onChange={(e) => setEditingTag({
                        ...editingTag,
                        sinonimos: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      className="input w-full"
                      placeholder="crítico, crit, golpe_critico"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingTag.pendiente_revision}
                      onChange={(e) => setEditingTag({ ...editingTag, pendiente_revision: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label className="text-sm text-d4-text">Pendiente de revisión</label>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingTag(null)}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                // Modo visualización
                <div className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded border ${getCategoryInfo(tag.categoria).color}`}>
                        {getCategoryInfo(tag.categoria).label}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-d4-surface/50 text-d4-text-dim border border-d4-border/30">
                        {ORIGENES.find(o => o.value === tag.origen)?.label}
                      </span>
                      {tag.pendiente_revision && (
                        <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Pendiente
                        </span>
                      )}
                    </div>

                    <div className="mb-2">
                      <div className="flex items-baseline gap-2">
                        <code className="text-sm font-mono text-d4-accent">{tag.tag}</code>
                        <span className="text-xs text-d4-text-dim">({tag.texto_original})</span>
                      </div>
                    </div>

                    {tag.significado && (
                      <p className="text-sm text-d4-text mb-2">{tag.significado}</p>
                    )}

                    {tag.sinonimos.length > 0 && (
                      <div className="text-xs text-d4-text-dim">
                        <span className="font-semibold">Sinónimos:</span> {tag.sinonimos.join(', ')}
                      </div>
                    )}

                    <div className="text-xs text-d4-text-dim mt-2">
                      Creado: {new Date(tag.fecha_creacion).toLocaleDateString('es-ES')}
                      {tag.fecha_actualizacion && tag.fecha_actualizacion !== tag.fecha_creacion && (
                        <> • Actualizado: {new Date(tag.fecha_actualizacion).toLocaleDateString('es-ES')}</>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => togglePendingRevision(tag)}
                      className="btn-secondary p-2"
                      title={tag.pendiente_revision ? 'Marcar como revisado' : 'Marcar como pendiente'}
                    >
                      <AlertCircle className={`w-4 h-4 ${tag.pendiente_revision ? 'text-yellow-400' : ''}`} />
                    </button>
                    <button
                      onClick={() => setEditingTag({ ...tag })}
                      className="btn-secondary p-2"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTag(tag)}
                      className="btn-danger p-2"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
          }
          </div>
        )}
        
        {/* Paginador inferior */}
        {filteredTags.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 bg-d4-bg rounded-lg border border-d4-border">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded text-sm bg-d4-surface hover:bg-d4-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Primera
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded text-sm bg-d4-surface hover:bg-d4-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ‹ Anterior
            </button>
            <span className="text-sm text-d4-text px-3">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded text-sm bg-d4-surface hover:bg-d4-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded text-sm bg-d4-surface hover:bg-d4-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Última
            </button>
          </div>
        )}
      </div>

      {/* Modal de agregar */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-d4-accent">Nuevo Tag</h3>
              <button onClick={() => setShowAddModal(false)} className="btn-secondary p-2">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-d4-text-dim mb-1">Tag Normalizado *</label>
                  <input
                    type="text"
                    value={newTag.tag}
                    onChange={(e) => setNewTag({ ...newTag, tag: e.target.value })}
                    className="input w-full"
                    placeholder="golpe_critico"
                  />
                </div>
                <div>
                  <label className="block text-xs text-d4-text-dim mb-1">Texto Original *</label>
                  <input
                    type="text"
                    value={newTag.texto_original}
                    onChange={(e) => setNewTag({ ...newTag, texto_original: e.target.value })}
                    className="input w-full"
                    placeholder="golpe crítico"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-d4-text-dim mb-1">Significado</label>
                <textarea
                  value={newTag.significado || ''}
                  onChange={(e) => setNewTag({ ...newTag, significado: e.target.value })}
                  className="input w-full"
                  rows={2}
                  placeholder="Definición del término..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-d4-text-dim mb-1">Categoría</label>
                  <select
                    value={newTag.categoria}
                    onChange={(e) => setNewTag({ ...newTag, categoria: e.target.value as CategoryType })}
                    className="input w-full"
                  >
                    {CATEGORIAS.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-d4-text-dim mb-1">Origen</label>
                  <select
                    value={newTag.origen}
                    onChange={(e) => setNewTag({ ...newTag, origen: e.target.value as OriginType })}
                    className="input w-full"
                  >
                    {ORIGENES.map(orig => (
                      <option key={orig.value} value={orig.value}>{orig.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-d4-text-dim mb-1">Sinónimos (separados por coma)</label>
                <input
                  type="text"
                  value={newTag.sinonimos?.join(', ') || ''}
                  onChange={(e) => setNewTag({
                    ...newTag,
                    sinonimos: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="input w-full"
                  placeholder="crítico, crit, golpe_critico"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newTag.pendiente_revision}
                  onChange={(e) => setNewTag({ ...newTag, pendiente_revision: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm text-d4-text">Pendiente de revisión</label>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddTag}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Crear Tag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
