import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Gem } from 'lucide-react';
import { Glifo, GlifosHeroe } from '../../types';
import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';

interface HeroGlyphsProps {
  heroClass: string;
  glyphs: GlifosHeroe;
  onUpdate: (glyphs: GlifosHeroe) => Promise<void>;
}

const HeroGlyphs: React.FC<HeroGlyphsProps> = ({ heroClass, glyphs, onUpdate }) => {
  const modal = useModal();
  const [glyphsList, setGlyphsList] = useState<Glifo[]>(glyphs.glifos || []);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editForm, setEditForm] = useState<Glifo>({
    id: '',
    nombre: '',
    rareza: 'Legendario',
    estado: 'Equipado',
    tamano_radio: 3
  });

  useEffect(() => {
    setGlyphsList(glyphs.glifos || []);
  }, [glyphs]);

  const handleAdd = () => {
    setEditForm({
      id: `glyph-${Date.now()}`,
      nombre: '',
      rareza: 'Legendario',
      estado: 'Equipado',
      tamano_radio: 3
    });
    setIsAddingNew(true);
    setEditingId(null);
  };

  const handleEdit = (glyph: Glifo) => {
    setEditForm({ ...glyph });
    setEditingId(glyph.id || '');
    setIsAddingNew(false);
  };

  const handleSave = async () => {
    if (!editForm.nombre) {
      modal.showWarning('Por favor completa al menos el nombre');
      return;
    }

    let updatedList: Glifo[];
    if (isAddingNew) {
      updatedList = [...glyphsList, editForm];
    } else {
      updatedList = glyphsList.map(g => g.id === editingId ? editForm : g);
    }

    try {
      await onUpdate({ glifos: updatedList });
      setGlyphsList(updatedList);
      handleCancel();
      modal.showSuccess(isAddingNew ? 'Glifo agregado' : 'Glifo actualizado');
    } catch (error) {
      console.error('Error guardando glifo:', error);
      modal.showError('Error al guardar el glifo');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await modal.showConfirm('¿Estás seguro de eliminar este glifo?');
    if (!confirmed) return;

    const updatedList = glyphsList.filter(g => g.id !== id);
    try {
      await onUpdate({ glifos: updatedList });
      setGlyphsList(updatedList);
      modal.showSuccess('Glifo eliminado');
    } catch (error) {
      console.error('Error eliminando glifo:', error);
      modal.showError('Error al eliminar el glifo');
    }
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setEditForm({
      id: '',
      nombre: '',
      rareza: 'Legendario',
      estado: 'Equipado',
      tamano_radio: 3
    });
  };

  const updateFormField = (field: keyof Glifo, value: any) => {
    setEditForm({ ...editForm, [field]: value });
  };

  const filteredGlyphs = glyphsList.filter(glyph => {
    const matchesRarity = filterRarity === 'all' || glyph.rareza === filterRarity;
    const efectoBaseText = typeof glyph.efecto_base === 'string' 
      ? glyph.efecto_base 
      : (glyph.efecto_base?.descripcion || '');
    const matchesSearch = !searchTerm ||
      glyph.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (glyph.atributo_escalado?.atributo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      efectoBaseText.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRarity && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-d4-text">Glifos de {heroClass}</h3>
          <p className="text-sm text-d4-text-dim">Total: {glyphsList.length} glifos</p>
        </div>
        <button
          onClick={handleAdd}
          className="btn-primary flex items-center gap-2"
          disabled={isAddingNew || editingId !== null}
        >
          <Plus className="w-4 h-4" />
          Nuevo Glifo
        </button>
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
              placeholder="Nombre, atributo, efecto..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-d4-text mb-2">Rareza</label>
            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value)}
              className="input w-full"
            >
              <option value="all">Todas</option>
              <option value="Legendario">Legendario</option>
              <option value="Raro">Raro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Edit/Add Form */}
      {(isAddingNew || editingId) && (
        <div className="card bg-d4-accent/10 border-2 border-d4-accent">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-d4-accent">
              {isAddingNew ? 'Nuevo Glifo' : 'Editar Glifo'}
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
                placeholder="glyph-nombre-unico"
                disabled={!isAddingNew}
              />
            </div>

            <div>
              <label className="block text-sm text-d4-text mb-1">Nombre *</label>
              <input
                type="text"
                value={editForm.nombre}
                onChange={(e) => updateFormField('nombre', e.target.value)}
                className="input w-full"
                placeholder="Ej: Glifo del Acechante"
              />
            </div>

            <div>
              <label className="block text-sm text-d4-text mb-1">Rareza *</label>
              <select
                value={editForm.rareza}
                onChange={(e) => updateFormField('rareza', e.target.value)}
                className="input w-full"
              >
                <option value="Legendario">Legendario</option>
                <option value="Raro">Raro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-d4-text mb-1">Estado</label>
              <select
                value={editForm.estado}
                onChange={(e) => updateFormField('estado', e.target.value)}
                className="input w-full"
              >
                <option value="Equipado">Equipado</option>
                <option value="Disponible">Disponible</option>
                <option value="Bloqueado">Bloqueado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-d4-text mb-1">Tamaño Radio *</label>
              <input
                type="number"
                value={editForm.tamano_radio}
                onChange={(e) => updateFormField('tamano_radio', parseInt(e.target.value) || 0)}
                className="input w-full"
                min="0"
                placeholder="Ej: 3"
              />
            </div>

            <div>
              <label className="block text-sm text-d4-text mb-1">Bloqueado</label>
              <select
                value={editForm.bloqueado ? 'true' : 'false'}
                onChange={(e) => updateFormField('bloqueado', e.target.value === 'true')}
                className="input w-full"
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-d4-text mb-2">Atributo Escalado (opcional)</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={editForm.atributo_escalado?.atributo || ''}
                  onChange={(e) => updateFormField('atributo_escalado', { 
                    ...(editForm.atributo_escalado || { cada: 0, bonificacion: '' }), 
                    atributo: e.target.value 
                  })}
                  className="input w-full"
                  placeholder="Atributo (Ej: Voluntad)"
                />
                <input
                  type="number"
                  value={editForm.atributo_escalado?.cada || ''}
                  onChange={(e) => updateFormField('atributo_escalado', { 
                    ...(editForm.atributo_escalado || { atributo: '', bonificacion: '' }), 
                    cada: parseInt(e.target.value) || 0 
                  })}
                  className="input w-full"
                  placeholder="Cada X puntos"
                />
                <input
                  type="text"
                  value={editForm.atributo_escalado?.bonificacion || ''}
                  onChange={(e) => updateFormField('atributo_escalado', { 
                    ...(editForm.atributo_escalado || { atributo: '', cada: 0 }), 
                    bonificacion: e.target.value 
                  })}
                  className="input w-full"
                  placeholder="Bonificación"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-d4-text mb-1">Efecto Base (opcional)</label>
              <textarea
                value={typeof editForm.efecto_base === 'string' 
                  ? editForm.efecto_base 
                  : (editForm.efecto_base?.descripcion || '')}
                onChange={(e) => updateFormField('efecto_base', { descripcion: e.target.value })}
                className="input w-full"
                rows={2}
                placeholder="Descripción del efecto base..."
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

      {/* Glyphs List */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Gem className="w-5 h-5 text-d4-accent" />
          <h4 className="font-bold text-d4-accent">
            Glifos ({filteredGlyphs.length})
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredGlyphs.map(glyph => (
            <div
              key={glyph.id}
              className="bg-d4-bg border border-d4-border rounded p-3 hover:border-d4-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-d4-accent truncate" title={glyph.nombre}>
                    {glyph.nombre}
                  </h5>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      glyph.rareza === 'Legendario' ? 'badge-legendario' : 'badge-raro'
                    }`}>
                      {glyph.rareza}
                    </span>
                    <span className="text-xs text-d4-text-dim">
                      Radio: {glyph.tamano_radio}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(glyph)}
                    className="p-1 hover:bg-d4-accent/20 rounded transition-colors"
                    title="Editar"
                    disabled={isAddingNew || editingId !== null}
                  >
                    <Edit2 className="w-3.5 h-3.5 text-d4-accent" />
                  </button>
                  <button
                    onClick={() => handleDelete(glyph.id || '')}
                    className="p-1 hover:bg-red-900/20 rounded transition-colors"
                    title="Eliminar"
                    disabled={isAddingNew || editingId !== null}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>

              {glyph.atributo_escalado && (
                <div className="text-xs bg-d4-surface p-2 rounded mb-2">
                  <p className="text-d4-text-dim">
                    <span className="text-d4-accent font-medium">{glyph.atributo_escalado.atributo}</span>
                    {' '}cada {glyph.atributo_escalado.cada}
                  </p>
                  <p className="text-d4-text">{glyph.atributo_escalado.bonificacion}</p>
                </div>
              )}

              {glyph.efecto_base && (
                <p className="text-xs text-d4-text-dim">
                  {typeof glyph.efecto_base === 'string' 
                    ? glyph.efecto_base 
                    : glyph.efecto_base.descripcion}
                </p>
              )}
            </div>
          ))}

          {filteredGlyphs.length === 0 && (
            <div className="col-span-full text-center text-d4-text-dim py-6">
              {searchTerm || filterRarity !== 'all'
                ? 'No se encontraron glifos con los filtros aplicados'
                : 'No hay glifos disponibles. Agrega uno nuevo para comenzar.'}
            </div>
          )}
        </div>
      </div>
      <Modal {...modal} />
    </div>
  );
};

export default HeroGlyphs;
