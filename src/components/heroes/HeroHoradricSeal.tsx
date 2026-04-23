import React, { useState, useEffect } from 'react';
import { Shield, Edit2, Save, X, Plus, Trash2, Lock } from 'lucide-react';
import { HoradricSeal, HoradricSealHeroe, StatTalisman, ReglaHoradricSeal } from '../../types';
import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';

interface HeroHoradricSealProps {
  heroClass: string;
  sealData: HoradricSealHeroe;
  onUpdate: (sealData: HoradricSealHeroe) => Promise<void>;
}

const HeroHoradricSeal: React.FC<HeroHoradricSealProps> = ({ heroClass, sealData, onUpdate }) => {
  const modal = useModal();
  const [seal, setSeal] = useState<HoradricSeal | null>(sealData.sello);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<HoradricSeal | null>(null);

  // Estados para agregar stats/reglas/bonus
  const [newStat, setNewStat] = useState<StatTalisman>({ nombre: '', valor: '' });
  const [newRegla, setNewRegla] = useState<ReglaHoradricSeal>({ tipo: 'restriccion', descripcion: '' });
  const [newBonus, setNewBonus] = useState<string>('');

  useEffect(() => {
    setSeal(sealData.sello);
  }, [sealData]);

  const handleCreate = () => {
    const newSeal: HoradricSeal = {
      id: `seal-${Date.now()}`,
      nombre: '',
      rareza: 'rare',
      slots: 4,
      stats: [],
      bonus: [],
      reglas: []
    };
    setEditForm(newSeal);
    setIsEditing(true);
  };

  const handleEdit = () => {
    if (!seal) return;
    setEditForm({ ...seal });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editForm) return;

    if (!editForm.nombre) {
      modal.showWarning('Por favor completa el nombre');
      return;
    }

    if (!editForm.slots || editForm.slots < 1) {
      modal.showWarning('Los slots deben ser al menos 1');
      return;
    }

    try {
      await onUpdate({ sello: editForm });
      setSeal(editForm);
      setIsEditing(false);
      setEditForm(null);
      modal.showSuccess('Sello Horádrico guardado');
    } catch (error) {
      console.error('Error guardando sello:', error);
      modal.showError('Error al guardar el sello');
    }
  };

  const handleDelete = async () => {
    const confirmed = await modal.showConfirm('¿Estás seguro de eliminar el Sello Horádrico?');
    if (!confirmed) return;

    try {
      await onUpdate({ sello: null });
      setSeal(null);
      modal.showSuccess('Sello Horádrico eliminado');
    } catch (error) {
      console.error('Error eliminando sello:', error);
      modal.showError('Error al eliminar el sello');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(null);
    setNewStat({ nombre: '', valor: '' });
    setNewRegla({ tipo: 'restriccion', descripcion: '' });
    setNewBonus('');
  };

  const addStat = () => {
    if (!editForm) return;
    if (!newStat.nombre || !newStat.valor) {
      modal.showWarning('Completa nombre y valor del stat');
      return;
    }
    setEditForm({
      ...editForm,
      stats: [...editForm.stats, newStat]
    });
    setNewStat({ nombre: '', valor: '' });
  };

  const removeStat = (index: number) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      stats: editForm.stats.filter((_, i) => i !== index)
    });
  };

  const addBonus = () => {
    if (!editForm) return;
    if (!newBonus.trim()) {
      modal.showWarning('Escribe la descripción del bonus');
      return;
    }
    setEditForm({
      ...editForm,
      bonus: [...editForm.bonus, newBonus]
    });
    setNewBonus('');
  };

  const removeBonus = (index: number) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      bonus: editForm.bonus.filter((_, i) => i !== index)
    });
  };

  const addRegla = () => {
    if (!editForm) return;
    if (!newRegla.descripcion) {
      modal.showWarning('Completa la descripción de la regla');
      return;
    }
    setEditForm({
      ...editForm,
      reglas: [...editForm.reglas, newRegla]
    });
    setNewRegla({ tipo: 'restriccion', descripcion: '' });
  };

  const removeRegla = (index: number) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      reglas: editForm.reglas.filter((_, i) => i !== index)
    });
  };

  const getRarityColor = (rareza: string) => {
    switch (rareza) {
      case 'rare': return 'text-yellow-400 border-yellow-500';
      case 'legendary': return 'text-orange-400 border-orange-500';
      default: return 'text-gray-400 border-gray-500';
    }
  };

  const getRarityLabel = (rareza: string) => {
    switch (rareza) {
      case 'rare': return '🟡 Raro';
      case 'legendary': return '🟠 Legendario';
      default: return rareza;
    }
  };

  const getTipoReglaIcon = (tipo: string) => {
    switch (tipo) {
      case 'restriccion': return '🚫';
      case 'bonus': return '✨';
      case 'sinergía': return '🔗';
      case 'penalizacion': return '⚠️';
      default: return '📝';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-d4-text flex items-center gap-2">
          <Lock className="w-5 h-5 text-d4-accent" />
          Sello Horádrico {heroClass && `- ${heroClass}`}
        </h3>
        {!seal && !isEditing && (
          <button
            onClick={handleCreate}
            className="px-3 py-2 bg-d4-accent text-black font-semibold rounded flex items-center gap-2 hover:bg-d4-accent/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear Sello
          </button>
        )}
      </div>

      {/* Formulario de edición */}
      {isEditing && editForm && (
        <div className="card bg-d4-surface border-2 border-d4-accent">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-bold text-d4-accent">
              {seal ? '✏️ Editar Sello Horádrico' : '✨ Crear Sello Horádrico'}
            </h4>
            <button onClick={handleCancel} className="text-d4-text-dim hover:text-d4-text">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Información básica */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-d4-text mb-1">Nombre *</label>
                <input
                  type="text"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                  className="w-full p-2 bg-d4-bg border border-d4-border rounded text-d4-text"
                  placeholder="Nombre del sello"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-d4-text mb-1">Rareza *</label>
                <select
                  value={editForm.rareza}
                  onChange={(e) => setEditForm({ ...editForm, rareza: e.target.value as any })}
                  className="w-full p-2 bg-d4-bg border border-d4-border rounded text-d4-text"
                >
                  <option value="rare">🟡 Raro</option>
                  <option value="legendary">🟠 Legendario</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-semibold text-d4-text mb-1">Slots * 🔑</label>
                <input
                  type="number"
                  value={editForm.slots}
                  onChange={(e) => setEditForm({ ...editForm, slots: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 bg-d4-bg border border-d4-border rounded text-d4-text"
                  placeholder="Cantidad"
                  min="1"
                />
                <p className="text-xs text-d4-text-dim mt-1">Espacios para talismanes</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-d4-text mb-1">Nivel Item</label>
                <input
                  type="number"
                  value={editForm.nivel_item || ''}
                  onChange={(e) => setEditForm({ ...editForm, nivel_item: parseInt(e.target.value) || undefined })}
                  className="w-full p-2 bg-d4-bg border border-d4-border rounded text-d4-text"
                  placeholder="Ej: 100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-d4-text mb-1">Nivel Req.</label>
                <input
                  type="number"
                  value={editForm.nivel_requerido || ''}
                  onChange={(e) => setEditForm({ ...editForm, nivel_requerido: parseInt(e.target.value) || undefined })}
                  className="w-full p-2 bg-d4-bg border border-d4-border rounded text-d4-text"
                  placeholder="Ej: 60"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-d4-text mb-1">Descripción</label>
              <textarea
                value={editForm.descripcion || ''}
                onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                className="w-full p-2 bg-d4-bg border border-d4-border rounded text-d4-text"
                rows={2}
                placeholder="Descripción del sello"
              />
            </div>

            {/* Stats */}
            <div>
              <label className="block text-sm font-bold text-d4-accent mb-2">📊 Estadísticas Base</label>
              <div className="space-y-2">
                {editForm.stats.map((stat, index) => (
                  <div key={index} className="flex items-center gap-2 bg-d4-bg p-2 rounded">
                    <span className="flex-1 text-sm text-d4-text">
                      <strong>{stat.nombre}:</strong> {stat.valor}
                      {stat.tipo && <span className="text-d4-text-dim ml-1">({stat.tipo})</span>}
                    </span>
                    <button
                      onClick={() => removeStat(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStat.nombre}
                    onChange={(e) => setNewStat({ ...newStat, nombre: e.target.value })}
                    className="flex-1 p-2 bg-d4-bg border border-d4-border rounded text-d4-text text-sm"
                    placeholder="Nombre del stat"
                  />
                  <input
                    type="text"
                    value={newStat.valor}
                    onChange={(e) => setNewStat({ ...newStat, valor: e.target.value })}
                    className="w-24 p-2 bg-d4-bg border border-d4-border rounded text-d4-text text-sm"
                    placeholder="Valor"
                  />
                  <select
                    value={newStat.tipo || ''}
                    onChange={(e) => setNewStat({ ...newStat, tipo: e.target.value as any || undefined })}
                    className="p-2 bg-d4-bg border border-d4-border rounded text-d4-text text-sm"
                  >
                    <option value="">Tipo</option>
                    <option value="plano">Plano</option>
                    <option value="porcentaje">%</option>
                    <option value="multiplicador">x</option>
                  </select>
                  <button
                    onClick={addStat}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bonificaciones */}
            <div>
              <label className="block text-sm font-bold text-d4-accent mb-2">✨ Bonificaciones</label>
              <div className="space-y-2">
                {editForm.bonus.map((bonus, index) => (
                  <div key={index} className="flex items-center gap-2 bg-d4-bg p-2 rounded">
                    <span className="flex-1 text-sm text-d4-text">{bonus}</span>
                    <button
                      onClick={() => removeBonus(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBonus}
                    onChange={(e) => setNewBonus(e.target.value)}
                    className="flex-1 p-2 bg-d4-bg border border-d4-border rounded text-d4-text text-sm"
                    placeholder="Descripción del bonus"
                  />
                  <button
                    onClick={addBonus}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Reglas */}
            <div>
              <label className="block text-sm font-bold text-d4-accent mb-2">📜 Reglas y Restricciones</label>
              <div className="space-y-2">
                {editForm.reglas.map((regla, index) => (
                  <div key={index} className="flex items-start gap-2 bg-d4-bg p-2 rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getTipoReglaIcon(regla.tipo)}</span>
                        <span className="px-2 py-0.5 bg-d4-surface rounded text-xs font-semibold text-d4-accent">
                          {regla.tipo}
                        </span>
                      </div>
                      <p className="text-sm text-d4-text">{regla.descripcion}</p>
                      {regla.condicion && (
                        <p className="text-xs text-d4-text-dim mt-1">Condición: {regla.condicion}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeRegla(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <div className="space-y-2 p-2 bg-d4-bg rounded">
                  <select
                    value={newRegla.tipo}
                    onChange={(e) => setNewRegla({ ...newRegla, tipo: e.target.value as any })}
                    className="w-full p-2 bg-d4-surface border border-d4-border rounded text-d4-text text-sm"
                  >
                    <option value="restriccion">🚫 Restricción</option>
                    <option value="bonus">✨ Bonus</option>
                    <option value="sinergía">🔗 Sinergía</option>
                    <option value="penalizacion">⚠️ Penalización</option>
                  </select>
                  <textarea
                    value={newRegla.descripcion}
                    onChange={(e) => setNewRegla({ ...newRegla, descripcion: e.target.value })}
                    className="w-full p-2 bg-d4-surface border border-d4-border rounded text-d4-text text-sm"
                    rows={2}
                    placeholder="Descripción de la regla"
                  />
                  {(newRegla.tipo === 'bonus' || newRegla.tipo === 'sinergía') && (
                    <input
                      type="text"
                      value={newRegla.condicion || ''}
                      onChange={(e) => setNewRegla({ ...newRegla, condicion: e.target.value })}
                      className="w-full p-2 bg-d4-surface border border-d4-border rounded text-d4-text text-sm"
                      placeholder="Condición (opcional)"
                    />
                  )}
                  <button
                    onClick={addRegla}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Agregar Regla
                  </button>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-d4-accent text-black font-semibold rounded flex items-center justify-center gap-2 hover:bg-d4-accent/80"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-d4-border text-d4-text rounded hover:bg-d4-surface"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vista del sello existente */}
      {seal && !isEditing && (
        <div className={`card bg-d4-surface border-l-4 ${getRarityColor(seal.rareza)}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="text-xl font-bold text-d4-text">{seal.nombre}</h4>
              <p className="text-sm text-d4-text-dim">{getRarityLabel(seal.rareza)}</p>
              <div className="flex items-center gap-4 mt-1 text-sm text-d4-text-dim">
                {seal.nivel_item && <span>Nivel: {seal.nivel_item}</span>}
                <span className="text-d4-accent font-bold">🔑 {seal.slots} Slots</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="p-2 text-blue-400 hover:text-blue-300"
                title="Editar"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-400 hover:text-red-300"
                title="Eliminar"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {seal.descripcion && (
            <p className="text-sm text-d4-text mb-3 p-2 bg-d4-bg rounded">{seal.descripcion}</p>
          )}

          {/* Stats */}
          {seal.stats.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-bold text-d4-accent mb-2">📊 Estadísticas Base:</p>
              <div className="grid grid-cols-2 gap-2">
                {seal.stats.map((stat, idx) => (
                  <div key={idx} className="text-sm text-d4-text bg-d4-bg p-2 rounded">
                    <strong>{stat.nombre}:</strong> <span className="text-d4-accent">{stat.valor}</span>
                    {stat.tipo && <span className="text-d4-text-dim text-xs ml-1">({stat.tipo})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bonus */}
          {seal.bonus.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-bold text-d4-accent mb-2">✨ Bonificaciones:</p>
              <ul className="list-disc list-inside space-y-1">
                {seal.bonus.map((bonus, idx) => (
                  <li key={idx} className="text-sm text-d4-text">{bonus}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Reglas */}
          {seal.reglas.length > 0 && (
            <div>
              <p className="text-sm font-bold text-d4-accent mb-2">📜 Reglas:</p>
              <div className="space-y-2">
                {seal.reglas.map((regla, idx) => (
                  <div key={idx} className="bg-d4-bg p-2 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{getTipoReglaIcon(regla.tipo)}</span>
                      <span className="px-2 py-0.5 bg-d4-surface rounded text-xs font-semibold text-d4-accent">
                        {regla.tipo}
                      </span>
                    </div>
                    <p className="text-sm text-d4-text">{regla.descripcion}</p>
                    {regla.condicion && (
                      <p className="text-xs text-d4-text-dim mt-1">Condición: {regla.condicion}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mensaje cuando no hay sello */}
      {!seal && !isEditing && (
        <div className="card bg-d4-surface text-center py-8">
          <Lock className="w-16 h-16 text-d4-text-dim mx-auto mb-3" />
          <p className="text-d4-text-dim mb-4">
            No hay un Sello Horádrico registrado para esta clase.
          </p>
          <p className="text-sm text-d4-text-dim mb-4">
            El Sello Horádrico es el núcleo del sistema de talismanes de la Temporada 13.
            Define cuántos talismanes puedes equipar y otorga bonificaciones base.
          </p>
        </div>
      )}
    </div>
  );
};

export default HeroHoradricSeal;
