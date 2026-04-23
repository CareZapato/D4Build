import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Sparkles, Search, Filter } from 'lucide-react';
import { Charm, CharmsHeroe, StatTalisman, EfectoTalisman, SetTalisman, BonusSet } from '../../types';
import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';

interface HeroCharmsProps {
  heroClass: string;
  charms: CharmsHeroe;
  onUpdate: (charms: CharmsHeroe) => Promise<void>;
}

const HeroCharms: React.FC<HeroCharmsProps> = ({ heroClass, charms, onUpdate }) => {
  const modal = useModal();
  const [charmsList, setCharmsList] = useState<Charm[]>(charms.talismanes || []);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editForm, setEditForm] = useState<Charm>({
    id: '',
    nombre: '',
    rareza: 'rare',
    stats: [],
    efectos: []
  });

  // Estados para agregar stats/efectos
  const [newStat, setNewStat] = useState<StatTalisman>({ nombre: '', valor: '' });
  const [newEfecto, setNewEfecto] = useState<EfectoTalisman>({ tipo: 'pasivo', descripcion: '' });

  useEffect(() => {
    setCharmsList(charms.talismanes || []);
  }, [charms]);

  const handleAdd = () => {
    setEditForm({
      id: `charm-${Date.now()}`,
      nombre: '',
      rareza: 'rare',
      stats: [],
      efectos: []
    });
    setIsAddingNew(true);
    setEditingId(null);
  };

  const handleEdit = (charm: Charm) => {
    setEditForm({ ...charm });
    setEditingId(charm.id);
    setIsAddingNew(false);
  };

  const handleSave = async () => {
    if (!editForm.nombre) {
      modal.showWarning('Por favor completa al menos el nombre');
      return;
    }

    let updatedList: Charm[];
    if (isAddingNew) {
      updatedList = [...charmsList, editForm];
    } else {
      updatedList = charmsList.map(c => c.id === editingId ? editForm : c);
    }

    try {
      await onUpdate({ talismanes: updatedList });
      setCharmsList(updatedList);
      handleCancel();
      modal.showSuccess(isAddingNew ? 'Talismán agregado' : 'Talismán actualizado');
    } catch (error) {
      console.error('Error guardando talismán:', error);
      modal.showError('Error al guardar el talismán');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await modal.showConfirm('¿Estás seguro de eliminar este talismán?');
    if (!confirmed) return;

    const updatedList = charmsList.filter(c => c.id !== id);
    try {
      await onUpdate({ talismanes: updatedList });
      setCharmsList(updatedList);
      modal.showSuccess('Talismán eliminado');
    } catch (error) {
      console.error('Error eliminando talismán:', error);
      modal.showError('Error al eliminar el talismán');
    }
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setEditForm({
      id: '',
      nombre: '',
      rareza: 'rare',
      stats: [],
      efectos: []
    });
    setNewStat({ nombre: '', valor: '' });
    setNewEfecto({ tipo: 'pasivo', descripcion: '' });
  };

  const addStat = () => {
    if (!newStat.nombre || !newStat.valor) {
      modal.showWarning('Completa nombre y valor del stat');
      return;
    }
    setEditForm(prev => ({
      ...prev,
      stats: [...prev.stats, newStat]
    }));
    setNewStat({ nombre: '', valor: '' });
  };

  const removeStat = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      stats: prev.stats.filter((_, i) => i !== index)
    }));
  };

  const addEfecto = () => {
    if (!newEfecto.descripcion) {
      modal.showWarning('Completa la descripción del efecto');
      return;
    }
    setEditForm(prev => ({
      ...prev,
      efectos: [...prev.efectos, newEfecto]
    }));
    setNewEfecto({ tipo: 'pasivo', descripcion: '' });
  };

  const removeEfecto = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      efectos: prev.efectos.filter((_, i) => i !== index)
    }));
  };

  const filteredCharms = charmsList.filter(charm => {
    const matchesRarity = filterRarity === 'all' || charm.rareza === filterRarity;
    const matchesSearch = searchTerm === '' || 
      charm.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      charm.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRarity && matchesSearch;
  });

  const getRarityColor = (rareza: string) => {
    switch (rareza) {
      case 'rare': return 'text-yellow-400 border-yellow-500';
      case 'unique': return 'text-orange-400 border-orange-500';
      case 'set': return 'text-green-400 border-green-500';
      default: return 'text-gray-400 border-gray-500';
    }
  };

  const getRarityLabel = (rareza: string) => {
    switch (rareza) {
      case 'rare': return '🟡 Raro';
      case 'unique': return '🟠 Único';
      case 'set': return '🟢 Set';
      default: return rareza;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header con controles */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-d4-text flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-d4-accent" />
            Talismanes {heroClass && `- ${heroClass}`}
            <span className="text-sm text-d4-text-dim">({filteredCharms.length})</span>
          </h3>
          <button
            onClick={handleAdd}
            className="px-3 py-2 bg-d4-accent text-black font-semibold rounded flex items-center gap-2 hover:bg-d4-accent/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>

        {/* Búsqueda y filtros */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-d4-text-dim" />
              <input
                type="text"
                placeholder="Buscar por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-d4-surface border border-d4-border rounded text-d4-text text-sm"
              />
            </div>
          </div>
          <select
            value={filterRarity}
            onChange={(e) => setFilterRarity(e.target.value)}
            className="px-3 py-2 bg-d4-surface border border-d4-border rounded text-d4-text text-sm"
          >
            <option value="all">Todas las rarezas</option>
            <option value="rare">🟡 Raro</option>
            <option value="unique">🟠 Único</option>
            <option value="set">🟢 Set</option>
          </select>
        </div>
      </div>

      {/* Formulario de edición/creación */}
      {(isAddingNew || editingId) && (
        <div className="card bg-d4-surface border-2 border-d4-accent">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-bold text-d4-accent">
              {isAddingNew ? '✨ Nuevo Talismán' : '✏️ Editar Talismán'}
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
                  placeholder="Nombre del talismán"
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
                  <option value="unique">🟠 Único</option>
                  <option value="set">🟢 Set</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                <label className="block text-sm font-semibold text-d4-text mb-1">Nivel Requerido</label>
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
                placeholder="Descripción breve del talismán"
              />
            </div>

            {/* Stats */}
            <div>
              <label className="block text-sm font-bold text-d4-accent mb-2">📊 Stats</label>
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

                {/* Agregar nuevo stat */}
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

            {/* Efectos */}
            <div>
              <label className="block text-sm font-bold text-d4-accent mb-2">⚡ Efectos</label>
              <div className="space-y-2">
                {editForm.efectos.map((efecto, index) => (
                  <div key={index} className="flex items-start gap-2 bg-d4-bg p-2 rounded">
                    <div className="flex-1 text-sm text-d4-text">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-d4-surface rounded text-xs font-semibold text-d4-accent">
                          {efecto.tipo}
                        </span>
                        {efecto.valor && <span className="text-d4-text-dim">Valor: {efecto.valor}</span>}
                      </div>
                      <p className="text-d4-text">{efecto.descripcion}</p>
                      {efecto.condicion && (
                        <p className="text-xs text-d4-text-dim mt-1">Condición: {efecto.condicion}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeEfecto(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Agregar nuevo efecto */}
                <div className="space-y-2 p-2 bg-d4-bg rounded">
                  <div className="flex gap-2">
                    <select
                      value={newEfecto.tipo}
                      onChange={(e) => setNewEfecto({ ...newEfecto, tipo: e.target.value as any })}
                      className="p-2 bg-d4-surface border border-d4-border rounded text-d4-text text-sm"
                    >
                      <option value="pasivo">Pasivo</option>
                      <option value="condicion">Condición</option>
                      <option value="proc">Proc</option>
                      <option value="stacking">Stacking</option>
                    </select>
                    {newEfecto.tipo === 'stacking' && (
                      <input
                        type="number"
                        value={newEfecto.stacks || ''}
                        onChange={(e) => setNewEfecto({ ...newEfecto, stacks: parseInt(e.target.value) || undefined })}
                        className="w-20 p-2 bg-d4-surface border border-d4-border rounded text-d4-text text-sm"
                        placeholder="Stacks"
                      />
                    )}
                  </div>
                  <textarea
                    value={newEfecto.descripcion}
                    onChange={(e) => setNewEfecto({ ...newEfecto, descripcion: e.target.value })}
                    className="w-full p-2 bg-d4-surface border border-d4-border rounded text-d4-text text-sm"
                    rows={2}
                    placeholder="Descripción del efecto"
                  />
                  {newEfecto.tipo === 'condicion' && (
                    <input
                      type="text"
                      value={newEfecto.condicion || ''}
                      onChange={(e) => setNewEfecto({ ...newEfecto, condicion: e.target.value })}
                      className="w-full p-2 bg-d4-surface border border-d4-border rounded text-d4-text text-sm"
                      placeholder="Condición requerida"
                    />
                  )}
                  <button
                    onClick={addEfecto}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Agregar Efecto
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

      {/* Lista de talismanes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filteredCharms.length === 0 ? (
          <div className="col-span-full text-center py-8 text-d4-text-dim">
            {searchTerm || filterRarity !== 'all' 
              ? 'No se encontraron talismanes con los filtros aplicados'
              : 'No hay talismanes registrados. Haz clic en "Agregar" para crear uno.'
            }
          </div>
        ) : (
          filteredCharms.map(charm => (
            <div
              key={charm.id}
              className={`card bg-d4-surface border-l-4 ${getRarityColor(charm.rareza)} hover:bg-d4-border/50 transition-colors`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-bold text-d4-text">{charm.nombre}</h4>
                  <p className="text-xs text-d4-text-dim">{getRarityLabel(charm.rareza)}</p>
                  {charm.nivel_item && (
                    <p className="text-xs text-d4-text-dim">Nivel: {charm.nivel_item}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(charm)}
                    className="p-1.5 text-blue-400 hover:text-blue-300"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(charm.id)}
                    className="p-1.5 text-red-400 hover:text-red-300"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {charm.descripcion && (
                <p className="text-sm text-d4-text-dim mb-2">{charm.descripcion}</p>
              )}

              {charm.stats.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-d4-accent mb-1">Stats:</p>
                  <div className="space-y-1">
                    {charm.stats.map((stat, idx) => (
                      <p key={idx} className="text-xs text-d4-text">
                        • {stat.nombre}: <span className="text-d4-accent">{stat.valor}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {charm.efectos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-d4-accent mb-1">Efectos:</p>
                  <div className="space-y-1">
                    {charm.efectos.map((efecto, idx) => (
                      <div key={idx} className="text-xs">
                        <span className="px-1.5 py-0.5 bg-d4-accent/20 text-d4-accent rounded text-[10px] font-semibold mr-1">
                          {efecto.tipo}
                        </span>
                        <span className="text-d4-text">{efecto.descripcion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {charm.set && (
                <div className="mt-2 pt-2 border-t border-d4-border">
                  <p className="text-xs font-semibold text-green-400">🟢 Set: {charm.set.nombre}</p>
                  <p className="text-[10px] text-d4-text-dim">{charm.set.piezas.length} piezas en el set</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HeroCharms;
