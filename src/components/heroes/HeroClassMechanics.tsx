import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Sparkles, Shield, CheckCircle, Circle } from 'lucide-react';
import { MecanicaClase, MecanicasClaseHeroe, SeleccionMecanica } from '../../types';
import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';

interface HeroClassMechanicsProps {
  heroClass: string;
  mechanics: MecanicasClaseHeroe;
  onUpdate: (mechanics: MecanicasClaseHeroe) => Promise<void>;
}

const HeroClassMechanics: React.FC<HeroClassMechanicsProps> = ({ heroClass, mechanics, onUpdate }) => {
  const modal = useModal();
  const [mechanicsList, setMechanicsList] = useState<MecanicaClase[]>(mechanics.mecanicas || []);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMechanic, setExpandedMechanic] = useState<string | null>(null);

  useEffect(() => {
    setMechanicsList(mechanics.mecanicas || []);
  }, [mechanics]);

  const handleAdd = () => {
    const newMechanic: MecanicaClase = {
      id: `mecanica_${heroClass.toLowerCase()}_${Date.now()}`,
      nombre: '',
      tipo: 'mecanica_clase',
      clase: heroClass,
      selecciones: []
    };
    setEditingId(newMechanic.id);
    setIsAddingNew(true);
    setMechanicsList([...mechanicsList, newMechanic]);
    setExpandedMechanic(newMechanic.id);
  };

  const handleEdit = (mechanicId: string) => {
    setEditingId(mechanicId);
    setIsAddingNew(false);
    setExpandedMechanic(mechanicId);
  };

  const handleSave = async (mechanicId: string) => {
    const mechanic = mechanicsList.find(m => m.id === mechanicId);
    if (!mechanic || !mechanic.nombre) {
      modal.showWarning('Por favor completa al menos el nombre de la mecánica');
      return;
    }

    try {
      await onUpdate({ mecanicas: mechanicsList });
      setEditingId(null);
      setIsAddingNew(false);
      modal.showSuccess(isAddingNew ? 'Mecánica agregada' : 'Mecánica actualizada');
    } catch (error) {
      console.error('Error guardando mecánica:', error);
      modal.showError('Error al guardar la mecánica');
    }
  };

  const handleDelete = async (mechanicId: string) => {
    const confirmed = await modal.showConfirm('¿Estás seguro de eliminar esta mecánica de clase?');
    if (!confirmed) return;

    const updatedList = mechanicsList.filter(m => m.id !== mechanicId);
    try {
      await onUpdate({ mecanicas: updatedList });
      setMechanicsList(updatedList);
      modal.showSuccess('Mecánica eliminada');
    } catch (error) {
      console.error('Error eliminando mecánica:', error);
      modal.showError('Error al eliminar la mecánica');
    }
  };

  const handleCancel = (mechanicId: string) => {
    if (isAddingNew) {
      setMechanicsList(mechanicsList.filter(m => m.id !== mechanicId));
    }
    setEditingId(null);
    setIsAddingNew(false);
    setExpandedMechanic(null);
  };

  const handleUpdateMechanic = (mechanicId: string, field: keyof MecanicaClase, value: any) => {
    setMechanicsList(mechanicsList.map(m => 
      m.id === mechanicId ? { ...m, [field]: value } : m
    ));
  };

  const handleAddSelection = (mechanicId: string) => {
    const newSelection: SeleccionMecanica = {
      id: `sel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nombre: '',
      categoria: 'general',
      grupo: 'principal',
      nivel: 1,
      nivel_maximo: 1,
      activo: true,
      efecto: '',
      detalles: [],
      tags: []
    };

    setMechanicsList(mechanicsList.map(m =>
      m.id === mechanicId
        ? { ...m, selecciones: [...m.selecciones, newSelection] }
        : m
    ));
  };

  const handleUpdateSelection = (mechanicId: string, selectionId: string, field: keyof SeleccionMecanica, value: any) => {
    setMechanicsList(mechanicsList.map(m =>
      m.id === mechanicId
        ? {
            ...m,
            selecciones: m.selecciones.map(s =>
              s.id === selectionId ? { ...s, [field]: value } : s
            )
          }
        : m
    ));
  };

  const handleDeleteSelection = (mechanicId: string, selectionId: string) => {
    setMechanicsList(mechanicsList.map(m =>
      m.id === mechanicId
        ? { ...m, selecciones: m.selecciones.filter(s => s.id !== selectionId) }
        : m
    ));
  };

  const filteredMechanics = mechanicsList.filter(m =>
    !searchTerm || m.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-d4-accent/10">
            <Sparkles className="w-6 h-6 text-d4-accent" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-d4-text">Mecánicas de Clase</h3>
            <p className="text-sm text-d4-text-dim">{mechanicsList.length} mecánicas configuradas</p>
          </div>
        </div>
        <button onClick={handleAdd} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Agregar Mecánica
        </button>
      </div>

      {/* Search */}
      {mechanicsList.length > 0 && (
        <input
          type="text"
          className="input w-full"
          placeholder="Buscar mecánica por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      )}

      {/* Lista de mecánicas */}
      {filteredMechanics.length === 0 ? (
        <div className="text-center py-12 bg-d4-surface/30 rounded-lg border border-dashed border-d4-border">
          <div className="p-4 rounded-full bg-d4-surface inline-block mb-3">
            <Sparkles className="w-12 h-12 text-d4-text-dim opacity-50" />
          </div>
          <p className="text-d4-text font-medium mb-1">No hay mecánicas configuradas</p>
          <p className="text-sm text-d4-text-dim">Agrega mecánicas de clase específicas para {heroClass}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMechanics.map((mechanic) => {
            const isEditing = editingId === mechanic.id;
            const isExpanded = expandedMechanic === mechanic.id || isEditing;

            return (
              <div key={mechanic.id} className="card p-4 bg-gradient-to-br from-d4-surface to-d4-bg border-2 border-d4-accent/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-d4-accent/10 mt-1">
                      <Shield className="w-5 h-5 text-d4-accent" />
                    </div>
                    <div className="flex-1">
                      {isEditing ? (
                        <input
                          type="text"
                          className="input w-full mb-2"
                          placeholder="Nombre de la mecánica"
                          value={mechanic.nombre}
                          onChange={(e) => handleUpdateMechanic(mechanic.id, 'nombre', e.target.value)}
                        />
                      ) : (
                        <h4 className="font-bold text-d4-accent text-lg mb-1">{mechanic.nombre}</h4>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-d4-bg border border-d4-border text-d4-text-dim">
                          {mechanic.clase}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-d4-accent/10 border border-d4-accent/30 text-d4-accent">
                          {mechanic.selecciones.length} selecciones
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => setExpandedMechanic(isExpanded ? null : mechanic.id)}
                          className="btn btn-sm"
                          title={isExpanded ? 'Contraer' : 'Expandir'}
                        >
                          {isExpanded ? 'Contraer' : 'Ver'}
                        </button>
                        <button
                          onClick={() => handleEdit(mechanic.id)}
                          className="text-blue-400 hover:text-blue-300 transition-colors p-2"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSave(mechanic.id)}
                          className="text-emerald-400 hover:text-emerald-300 transition-colors p-2"
                          title="Guardar"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancel(mechanic.id)}
                          className="text-gray-400 hover:text-gray-300 transition-colors p-2"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDelete(mechanic.id)}
                        className="text-red-400 hover:text-red-300 transition-colors p-2"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="space-y-4 mt-4 pt-4 border-t border-d4-border">
                    {/* Selecciones */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-d4-text">Selecciones</h5>
                        {isEditing && (
                          <button
                            onClick={() => handleAddSelection(mechanic.id)}
                            className="btn btn-sm btn-primary"
                          >
                            <Plus className="w-4 h-4" />
                            Agregar Selección
                          </button>
                        )}
                      </div>

                      {mechanic.selecciones.length === 0 ? (
                        <p className="text-sm text-d4-text-dim italic">No hay selecciones configuradas</p>
                      ) : (
                        <div className="space-y-2">
                          {mechanic.selecciones.map((selection) => (
                            <div key={selection.id} className="p-3 bg-d4-surface rounded-lg border border-d4-border">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      className="input flex-1"
                                      placeholder="Nombre"
                                      value={selection.nombre}
                                      onChange={(e) => handleUpdateSelection(mechanic.id, selection.id, 'nombre', e.target.value)}
                                    />
                                    <input
                                      type="text"
                                      className="input w-32"
                                      placeholder="Categoría"
                                      value={selection.categoria}
                                      onChange={(e) => handleUpdateSelection(mechanic.id, selection.id, 'categoria', e.target.value)}
                                    />
                                    <button
                                      onClick={() => handleDeleteSelection(mechanic.id, selection.id)}
                                      className="text-red-400 hover:text-red-300 p-2"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <textarea
                                    className="input w-full h-20"
                                    placeholder="Efecto de la selección"
                                    value={selection.efecto}
                                    onChange={(e) => handleUpdateSelection(mechanic.id, selection.id, 'efecto', e.target.value)}
                                  />
                                  <div className="flex gap-2">
                                    <input
                                      type="number"
                                      className="input w-20"
                                      placeholder="Nivel"
                                      value={selection.nivel}
                                      onChange={(e) => handleUpdateSelection(mechanic.id, selection.id, 'nivel', parseInt(e.target.value))}
                                    />
                                    <input
                                      type="number"
                                      className="input w-20"
                                      placeholder="Máx"
                                      value={selection.nivel_maximo}
                                      onChange={(e) => handleUpdateSelection(mechanic.id, selection.id, 'nivel_maximo', parseInt(e.target.value))}
                                    />
                                    <label className="flex items-center gap-2 text-d4-text">
                                      <input
                                        type="checkbox"
                                        checked={selection.activo}
                                        onChange={(e) => handleUpdateSelection(mechanic.id, selection.id, 'activo', e.target.checked)}
                                      />
                                      Activo por defecto
                                    </label>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start gap-3">
                                  {selection.activo ? (
                                    <CheckCircle className="w-5 h-5 text-d4-accent mt-1" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-d4-text-dim mt-1" />
                                  )}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-d4-text">{selection.nombre}</span>
                                      <span className="text-xs px-2 py-0.5 rounded bg-d4-bg border border-d4-border text-d4-text-dim">
                                        {selection.categoria}
                                      </span>
                                      <span className="text-xs text-d4-text-dim">
                                        Nv {selection.nivel}/{selection.nivel_maximo}
                                      </span>
                                    </div>
                                    <p className="text-sm text-d4-text-dim">{selection.efecto}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HeroClassMechanics;
