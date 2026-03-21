import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Shield, Swords, Zap, Heart, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Aspecto, AspectosHeroe } from '../../types';
import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';

interface HeroAspectsProps {
  heroClass: string;
  aspects: AspectosHeroe;
  onUpdate: (aspects: AspectosHeroe) => Promise<void>;
}

  // Normalize aspect data from old format to new format
  const normalizeAspect = (aspect: any): Aspecto => {
    // If already in new format, return as is
    if (aspect.name && aspect.category && aspect.effect) {
      return aspect as Aspecto;
    }

    // Convert from old format (nombre/categoria/descripcion) to new format
    const normalized: Aspecto = {
      id: aspect.id || `aspect-${Date.now()}`,
      name: aspect.nombre || aspect.name || 'Sin nombre',
      shortName: aspect.shortName || aspect.nombre?.split(' ').slice(0, 2).join(' ') || 'Sin nombre',
      effect: aspect.descripcion || aspect.effect || 'Sin descripción',
      level: aspect.level || '1/21',
      category: (aspect.categoria || aspect.category || 'ofensivo').toLowerCase(),
      keywords: aspect.keywords || [],
      tags: aspect.tags || []
    };

    return normalized;
  };

const HeroAspects: React.FC<HeroAspectsProps> = ({ heroClass, aspects, onUpdate }) => {
  const modal = useModal();
  const [aspectsList, setAspectsList] = useState<Aspecto[]>(
    (aspects.aspectos || []).map(normalizeAspect)
  );
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editForm, setEditForm] = useState<Aspecto>({
    id: '',
    name: '',
    shortName: '',
    effect: '',
    level: '1/21',
    category: 'ofensivo',
    keywords: [],
    tags: []
  });

  useEffect(() => {
    setAspectsList((aspects.aspectos || []).map(normalizeAspect));
    setCurrentPage(1); // Reset page when aspects change
  }, [aspects]);

  const categories = [
    { value: 'ofensivo', label: 'Ofensivo', icon: Swords, color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-600' },
    { value: 'defensivo', label: 'Defensivo', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-900/30', border: 'border-blue-600' },
    { value: 'recurso', label: 'Recurso', icon: Zap, color: 'text-green-400', bg: 'bg-green-900/30', border: 'border-green-600' },
    { value: 'utilidad', label: 'Utilidad', icon: Heart, color: 'text-purple-400', bg: 'bg-purple-900/30', border: 'border-purple-600' },
    { value: 'movilidad', label: 'Movilidad', icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-600' }
  ];

  const handleAdd = () => {
    setEditForm({
      id: `aspect-${Date.now()}`,
      name: '',
      shortName: '',
      effect: '',
      level: '1/21',
      category: 'ofensivo',
      keywords: [],
      tags: []
    });
    setIsAddingNew(true);
    setEditingId(null);
  };

  const handleEdit = (aspect: Aspecto) => {
    setEditForm({ ...aspect });
    setEditingId(aspect.id);
    setIsAddingNew(false);
  };

  const handleSave = async () => {
    if (!editForm.name || !editForm.effect) {
      modal.showWarning('Por favor completa al menos el nombre y efecto');
      return;
    }

    let updatedList: Aspecto[];
    if (isAddingNew) {
      updatedList = [...aspectsList, editForm];
    } else {
      updatedList = aspectsList.map(a => a.id === editingId ? editForm : a);
    }

    try {
      await onUpdate({ aspectos: updatedList });
      setAspectsList(updatedList);
      handleCancel();
    } catch (error) {
      console.error('Error guardando aspecto:', error);
      modal.showError('Error al guardar el aspecto');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await modal.showConfirm('¿Estás seguro de eliminar este aspecto?');
    if (!confirmed) return;

    const updatedList = aspectsList.filter(a => a.id !== id);
    try {
      await onUpdate({ aspectos: updatedList });
      setAspectsList(updatedList);
    } catch (error) {
      console.error('Error eliminando aspecto:', error);
      modal.showError('Error al eliminar el aspecto');
    }
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setEditForm({
      id: '',
      name: '',
      shortName: '',
      effect: '',
      level: '1/21',
      category: 'ofensivo',
      keywords: [],
      tags: []
    });
  };

  const updateFormField = (field: keyof Aspecto, value: any) => {
    setEditForm({ ...editForm, [field]: value });
  };

  const updateArrayField = (field: 'keywords' | 'tags', value: string) => {
    const items = value.split(',').map(s => s.trim()).filter(s => s);
    setEditForm({ ...editForm, [field]: items });
  };

  const filteredAspects = aspectsList.filter(aspect => {
    const matchesCategory = filterCategory === 'all' || aspect.category === filterCategory;
    const matchesSearch = !searchTerm || 
      aspect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aspect.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aspect.effect.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aspect.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Pagination logic
  const totalItems = filteredAspects.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAspects = filteredAspects.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-bold text-d4-text">Aspectos de {heroClass}</h3>
          <p className="text-sm text-d4-text-dim">
            Total: {aspectsList.length} aspectos | Mostrando: {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-d4-text-dim">Por página:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="input py-1 px-2 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <button
            onClick={handleAdd}
            className="btn-primary flex items-center gap-2"
            disabled={isAddingNew || editingId !== null}
          >
            <Plus className="w-4 h-4" />
            Nuevo Aspecto
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-d4-text mb-2">Buscar</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full"
              placeholder="Nombre, efecto, palabras clave..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-d4-text mb-2">Categoría</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input w-full"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Edit/Add Form */}
      {(isAddingNew || editingId) && (
        <div className="card bg-d4-accent/10 border-2 border-d4-accent">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-d4-accent">
              {isAddingNew ? 'Nuevo Aspecto' : 'Editar Aspecto'}
            </h4>
            <button onClick={handleCancel} className="text-d4-text-dim hover:text-d4-text">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-d4-text mb-1">ID *</label>
              <input
                type="text"
                value={editForm.id}
                onChange={(e) => updateFormField('id', e.target.value)}
                className="input w-full"
                placeholder="aspect-nombre-unico"
                disabled={!isAddingNew}
              />
            </div>

            <div>
              <label className="block text-sm text-d4-text mb-1">Nombre Corto *</label>
              <input
                type="text"
                value={editForm.shortName}
                onChange={(e) => updateFormField('shortName', e.target.value)}
                className="input w-full"
                placeholder="Ej: Acelerante"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-d4-text mb-1">Nombre Completo *</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => updateFormField('name', e.target.value)}
                className="input w-full"
                placeholder="Ej: Aspecto Acelerante"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-d4-text mb-1">Efecto *</label>
              <textarea
                value={editForm.effect}
                onChange={(e) => updateFormField('effect', e.target.value)}
                className="input w-full"
                rows={3}
                placeholder="Descripción completa del efecto..."
              />
            </div>

            <div>
              <label className="block text-sm text-d4-text mb-1">Nivel</label>
              <input
                type="text"
                value={editForm.level}
                onChange={(e) => updateFormField('level', e.target.value)}
                className="input w-full"
                placeholder="Ej: 3/21"
              />
            </div>

            <div>
              <label className="block text-sm text-d4-text mb-1">Categoría *</label>
              <select
                value={editForm.category}
                onChange={(e) => updateFormField('category', e.target.value as Aspecto['category'])}
                className="input w-full"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-d4-text mb-1">Keywords (separadas por coma)</label>
              <input
                type="text"
                value={editForm.keywords.join(', ')}
                onChange={(e) => updateArrayField('keywords', e.target.value)}
                className="input w-full"
                placeholder="critico, velocidad ataque"
              />
            </div>

            <div>
              <label className="block text-sm text-d4-text mb-1">Tags (separadas por coma)</label>
              <input
                type="text"
                value={editForm.tags.join(', ')}
                onChange={(e) => updateArrayField('tags', e.target.value)}
                className="input w-full"
                placeholder="damage, attack speed"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              Guardar
            </button>
            <button onClick={handleCancel} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Aspects List */}
      <div className="space-y-4">
        {paginatedAspects.length > 0 ? (
          <div className="card">
            <div className="space-y-2">
              {paginatedAspects.map(aspect => {
                const cat = categories.find(c => c.value === aspect.category) || categories[0];
                return (
                  <div
                    key={aspect.id}
                    className="bg-d4-bg border border-d4-border rounded p-3 hover:border-d4-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Category Icon */}
                      <div className={`flex-shrink-0 p-2 rounded ${cat.bg} border ${cat.border}`} title={cat.label}>
                        <cat.icon className={`w-4 h-4 ${cat.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h5 className={`font-bold ${cat.color}`}>
                            {aspect.name}
                          </h5>
                          <span className="text-xs text-d4-text-dim">
                            ({aspect.shortName})
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-d4-surface border border-d4-border rounded">
                            {aspect.level}
                          </span>
                        </div>
                        
                        <p className="text-sm text-d4-text mb-2">{aspect.effect}</p>
                        
                        {aspect.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {aspect.keywords.map((kw, idx) => (
                              <span key={idx} className="text-xs px-1.5 py-0.5 bg-d4-surface/50 rounded text-d4-text-dim border border-d4-border/50">
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {aspect.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {aspect.tags.map((tag, idx) => (
                              <span key={idx} className="text-xs px-1.5 py-0.5 bg-d4-accent/20 rounded text-d4-accent border border-d4-accent/30">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(aspect)}
                          className="p-1.5 hover:bg-d4-accent/20 rounded transition-colors"
                          title="Editar"
                          disabled={isAddingNew || editingId !== null}
                        >
                          <Edit2 className="w-4 h-4 text-d4-accent" />
                        </button>
                        <button
                          onClick={() => handleDelete(aspect.id)}
                          className="p-1.5 hover:bg-red-900/20 rounded transition-colors"
                          title="Eliminar"
                          disabled={isAddingNew || editingId !== null}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="card text-center py-8">
            <p className="text-d4-text-dim">
              {searchTerm || filterCategory !== 'all' 
                ? 'No se encontraron aspectos con los filtros aplicados'
                : 'No hay aspectos disponibles. Agrega uno nuevo para comenzar.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="card">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="text-sm text-d4-text-dim">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-d4-surface text-d4-text border border-d4-border hover:bg-d4-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Primera
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded bg-d4-surface text-d4-text border border-d4-border hover:bg-d4-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Page Numbers */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded border transition-colors ${
                        currentPage === pageNum
                          ? 'bg-d4-accent text-black border-d4-accent font-semibold'
                          : 'bg-d4-surface text-d4-text border-d4-border hover:bg-d4-border'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded bg-d4-surface text-d4-text border border-d4-border hover:bg-d4-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded bg-d4-surface text-d4-text border border-d4-border hover:bg-d4-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Última
              </button>
            </div>
          </div>
        </div>
      )}
      <Modal {...modal} />
    </div>
  );
};

export default HeroAspects;
