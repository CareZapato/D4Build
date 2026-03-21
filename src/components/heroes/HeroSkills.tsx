import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Zap, Shield } from 'lucide-react';
import { HabilidadActiva, HabilidadPasiva, HabilidadesPersonaje } from '../../types';
import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';

interface HeroSkillsProps {
  heroClass: string;
  skills: HabilidadesPersonaje;
  onUpdate: (skills: HabilidadesPersonaje) => Promise<void>;
}

const HeroSkills: React.FC<HeroSkillsProps> = ({ heroClass, skills, onUpdate }) => {
  const modal = useModal();
  const [activeSkills, setActiveSkills] = useState<HabilidadActiva[]>(skills.habilidades_activas || []);
  const [passiveSkills, setPassiveSkills] = useState<HabilidadPasiva[]>(skills.habilidades_pasivas || []);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [skillType, setSkillType] = useState<'activa' | 'pasiva'>('activa');
  const [searchTerm, setSearchTerm] = useState('');
  const [editFormActive, setEditFormActive] = useState<HabilidadActiva>({
    id: '',
    nombre: '',
    tipo: '',
    rama: '',
    nivel: 1,
    descripcion: '',
    modificadores: []
  });
  const [editFormPassive, setEditFormPassive] = useState<HabilidadPasiva>({
    id: '',
    nombre: '',
    nivel: 1,
    efecto: ''
  });

  useEffect(() => {
    setActiveSkills(skills.habilidades_activas || []);
    setPassiveSkills(skills.habilidades_pasivas || []);
  }, [skills]);

  const handleAdd = (type: 'activa' | 'pasiva') => {
    setSkillType(type);
    if (type === 'activa') {
      setEditFormActive({
        id: `skill-active-${Date.now()}`,
        nombre: '',
        tipo: '',
        rama: '',
        nivel: 1,
        descripcion: '',
        modificadores: []
      });
    } else {
      setEditFormPassive({
        id: `skill-passive-${Date.now()}`,
        nombre: '',
        nivel: 1,
        efecto: ''
      });
    }
    setIsAddingNew(true);
    setEditingId(null);
  };

  const handleEdit = (skill: HabilidadActiva | HabilidadPasiva, type: 'activa' | 'pasiva') => {
    setSkillType(type);
    if (type === 'activa') {
      setEditFormActive({ ...skill as HabilidadActiva });
    } else {
      setEditFormPassive({ ...skill as HabilidadPasiva });
    }
    setEditingId(skill.id || '');
    setIsAddingNew(false);
  };

  const handleSave = async () => {
    const currentForm = skillType === 'activa' ? editFormActive : editFormPassive;
    
    if (!currentForm.nombre) {
      modal.showWarning('Por favor completa al menos el nombre');
      return;
    }

    try {
      let updatedActiveSkills = [...activeSkills];
      let updatedPassiveSkills = [...passiveSkills];

      if (skillType === 'activa') {
        if (isAddingNew) {
          updatedActiveSkills = [...activeSkills, editFormActive];
        } else {
          updatedActiveSkills = activeSkills.map(s => s.id === editingId ? editFormActive : s);
        }
      } else {
        if (isAddingNew) {
          updatedPassiveSkills = [...passiveSkills, editFormPassive];
        } else {
          updatedPassiveSkills = passiveSkills.map(s => s.id === editingId ? editFormPassive : s);
        }
      }

      await onUpdate({
        habilidades_activas: updatedActiveSkills,
        habilidades_pasivas: updatedPassiveSkills
      });

      setActiveSkills(updatedActiveSkills);
      setPassiveSkills(updatedPassiveSkills);
      handleCancel();
    } catch (error) {
      console.error('Error guardando habilidad:', error);
      modal.showError('Error al guardar la habilidad');
    }
  };

  const handleDelete = async (id: string, type: 'activa' | 'pasiva') => {
    const confirmed = await modal.showConfirm('¿Estás seguro de eliminar esta habilidad?');
    if (!confirmed) return;

    try {
      let updatedActiveSkills = [...activeSkills];
      let updatedPassiveSkills = [...passiveSkills];

      if (type === 'activa') {
        updatedActiveSkills = activeSkills.filter(s => s.id !== id);
      } else {
        updatedPassiveSkills = passiveSkills.filter(s => s.id !== id);
      }

      await onUpdate({
        habilidades_activas: updatedActiveSkills,
        habilidades_pasivas: updatedPassiveSkills
      });

      setActiveSkills(updatedActiveSkills);
      setPassiveSkills(updatedPassiveSkills);
    } catch (error) {
      console.error('Error eliminando habilidad:', error);
      modal.showError('Error al eliminar la habilidad');
    }
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setEditFormActive({
      id: '',
      nombre: '',
      tipo: '',
      rama: '',
      nivel: 1,
      descripcion: '',
      modificadores: []
    });
    setEditFormPassive({
      id: '',
      nombre: '',
      nivel: 1,
      efecto: ''
    });
  };

  const filteredActiveSkills = activeSkills.filter(skill =>
    !searchTerm ||
    skill.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    skill.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    skill.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    skill.rama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPassiveSkills = passiveSkills.filter(skill =>
    !searchTerm ||
    skill.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    skill.efecto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-d4-text">Habilidades de {heroClass}</h3>
          <p className="text-sm text-d4-text-dim">
            Activas: {activeSkills.length} | Pasivas: {passiveSkills.length}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleAdd('activa')}
            className="btn-primary flex items-center gap-2"
            disabled={isAddingNew || editingId !== null}
          >
            <Plus className="w-4 h-4" />
            Nueva Activa
          </button>
          <button
            onClick={() => handleAdd('pasiva')}
            className="btn-secondary flex items-center gap-2"
            disabled={isAddingNew || editingId !== null}
          >
            <Plus className="w-4 h-4" />
            Nueva Pasiva
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <label className="block text-sm font-medium text-d4-text mb-2">Buscar</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input w-full"
          placeholder="Nombre, descripción, tipo, rama..."
        />
      </div>

      {/* Edit/Add Form */}
      {(isAddingNew || editingId) && (
        <div className="card bg-d4-accent/10 border-2 border-d4-accent">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-d4-accent">
              {isAddingNew ? `Nueva Habilidad ${skillType === 'activa' ? 'Activa' : 'Pasiva'}` : 'Editar Habilidad'}
            </h4>
            <button onClick={handleCancel} className="text-d4-text-dim hover:text-d4-text">
              <X className="w-5 h-5" />
            </button>
          </div>

          {skillType === 'activa' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-d4-text mb-1">ID *</label>
                <input
                  type="text"
                  value={editFormActive.id}
                  onChange={(e) => setEditFormActive({ ...editFormActive, id: e.target.value })}
                  className="input w-full"
                  disabled={!isAddingNew}
                />
              </div>

              <div>
                <label className="block text-sm text-d4-text mb-1">Nombre *</label>
                <input
                  type="text"
                  value={editFormActive.nombre}
                  onChange={(e) => setEditFormActive({ ...editFormActive, nombre: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-d4-text mb-1">Tipo</label>
                <input
                  type="text"
                  value={editFormActive.tipo}
                  onChange={(e) => setEditFormActive({ ...editFormActive, tipo: e.target.value })}
                  className="input w-full"
                  placeholder="Ej: Habilidad principal"
                />
              </div>

              <div>
                <label className="block text-sm text-d4-text mb-1">Rama</label>
                <input
                  type="text"
                  value={editFormActive.rama}
                  onChange={(e) => setEditFormActive({ ...editFormActive, rama: e.target.value })}
                  className="input w-full"
                  placeholder="Ej: Fe"
                />
              </div>

              <div>
                <label className="block text-sm text-d4-text mb-1">Nivel</label>
                <input
                  type="number"
                  value={editFormActive.nivel}
                  onChange={(e) => setEditFormActive({ ...editFormActive, nivel: parseInt(e.target.value) || 1 })}
                  className="input w-full"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm text-d4-text mb-1">Tipo de Daño</label>
                <input
                  type="text"
                  value={editFormActive.tipo_danio || ''}
                  onChange={(e) => setEditFormActive({ ...editFormActive, tipo_danio: e.target.value })}
                  className="input w-full"
                  placeholder="Ej: Sagrado"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-d4-text mb-1">Descripción *</label>
                <textarea
                  value={editFormActive.descripcion}
                  onChange={(e) => setEditFormActive({ ...editFormActive, descripcion: e.target.value })}
                  className="input w-full"
                  rows={4}
                  placeholder="Descripción completa de la habilidad..."
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-d4-text mb-1">ID *</label>
                <input
                  type="text"
                  value={editFormPassive.id}
                  onChange={(e) => setEditFormPassive({ ...editFormPassive, id: e.target.value })}
                  className="input w-full"
                  disabled={!isAddingNew}
                />
              </div>

              <div>
                <label className="block text-sm text-d4-text mb-1">Nombre *</label>
                <input
                  type="text"
                  value={editFormPassive.nombre}
                  onChange={(e) => setEditFormPassive({ ...editFormPassive, nombre: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-d4-text mb-1">Nivel</label>
                <input
                  type="number"
                  value={editFormPassive.nivel || 1}
                  onChange={(e) => setEditFormPassive({ ...editFormPassive, nivel: parseInt(e.target.value) || 1 })}
                  className="input w-full"
                  min="1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-d4-text mb-1">Efecto *</label>
                <textarea
                  value={editFormPassive.efecto}
                  onChange={(e) => setEditFormPassive({ ...editFormPassive, efecto: e.target.value })}
                  className="input w-full"
                  rows={4}
                  placeholder="Descripción del efecto pasivo..."
                />
              </div>
            </div>
          )}

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

      {/* Active Skills List */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-d4-accent" />
          <h4 className="font-bold text-d4-accent">
            Habilidades Activas ({filteredActiveSkills.length})
          </h4>
        </div>

        <div className="space-y-2">
          {filteredActiveSkills.map(skill => (
            <div
              key={skill.id}
              className="bg-d4-bg border border-d4-border rounded p-3 hover:border-d4-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h5 className="font-bold text-d4-accent">{skill.nombre}</h5>
                    <span className="text-xs badge-normal px-2 py-0.5">Nv. {skill.nivel}</span>
                    {skill.tipo && (
                      <span className="text-xs text-d4-text-dim">| {skill.tipo}</span>
                    )}
                    {skill.rama && (
                      <span className="text-xs text-d4-text-dim">| {skill.rama}</span>
                    )}
                    {skill.tipo_danio && (
                      <span className="text-xs text-orange-400">| {skill.tipo_danio}</span>
                    )}
                  </div>
                  <p className="text-sm text-d4-text">{skill.descripcion}</p>
                  {skill.modificadores && skill.modificadores.length > 0 && (
                    <p className="text-xs text-d4-text-dim mt-1">
                      Modificadores: {skill.modificadores.length}
                    </p>
                  )}
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(skill, 'activa')}
                    className="p-1.5 hover:bg-d4-accent/20 rounded transition-colors"
                    title="Editar"
                    disabled={isAddingNew || editingId !== null}
                  >
                    <Edit2 className="w-4 h-4 text-d4-accent" />
                  </button>
                  <button
                    onClick={() => handleDelete(skill.id || '', 'activa')}
                    className="p-1.5 hover:bg-red-900/20 rounded transition-colors"
                    title="Eliminar"
                    disabled={isAddingNew || editingId !== null}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredActiveSkills.length === 0 && (
            <p className="text-center text-d4-text-dim py-4">
              {searchTerm ? 'No se encontraron habilidades activas' : 'No hay habilidades activas'}
            </p>
          )}
        </div>
      </div>

      {/* Passive Skills List */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-purple-400" />
          <h4 className="font-bold text-purple-400">
            Habilidades Pasivas ({filteredPassiveSkills.length})
          </h4>
        </div>

        <div className="space-y-2">
          {filteredPassiveSkills.map(skill => (
            <div
              key={skill.id}
              className="bg-d4-bg border border-d4-border rounded p-3 hover:border-purple-400 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-bold text-purple-400">{skill.nombre}</h5>
                    {skill.nivel && (
                      <span className="text-xs badge-normal px-2 py-0.5">Nv. {skill.nivel}</span>
                    )}
                  </div>
                  <p className="text-sm text-d4-text">{skill.efecto}</p>
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(skill, 'pasiva')}
                    className="p-1.5 hover:bg-purple-400/20 rounded transition-colors"
                    title="Editar"
                    disabled={isAddingNew || editingId !== null}
                  >
                    <Edit2 className="w-4 h-4 text-purple-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(skill.id || '', 'pasiva')}
                    className="p-1.5 hover:bg-red-900/20 rounded transition-colors"
                    title="Eliminar"
                    disabled={isAddingNew || editingId !== null}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredPassiveSkills.length === 0 && (
            <p className="text-center text-d4-text-dim py-4">
              {searchTerm ? 'No se encontraron habilidades pasivas' : 'No hay habilidades pasivas'}
            </p>
          )}
        </div>
      </div>
      <Modal {...modal} />
    </div>
  );
};

export default HeroSkills;
