import React, { useState } from 'react';
import { Plus, User, Trash2, Eye } from 'lucide-react';
import { Personaje } from '../../types';
import { WorkspaceService } from '../../services/WorkspaceService';
import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';

interface Props {
  personajes: Personaje[];
  onSelect: (personaje: Personaje) => void;
  onUpdate: () => void;
  loading: boolean;
}

const CharacterList: React.FC<Props> = ({ personajes, onSelect, onUpdate, loading }) => {
  const modal = useModal();
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharClass, setNewCharClass] = useState('Paladín');
  const [newCharLevel, setNewCharLevel] = useState(1);
  const [creating, setCreating] = useState(false);

  const clases = ['Paladín', 'Bárbaro', 'Hechicero', 'Pícaro', 'Druida', 'Nigromante', 'Espiritista'];

  const handleCreateCharacter = async () => {
    if (!newCharName.trim()) return;

    setCreating(true);
    try {
      const nuevoPersonaje: Personaje = {
        id: Date.now().toString(),
        nombre: newCharName,
        clase: newCharClass,
        nivel: newCharLevel,
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString(),
      };

      await WorkspaceService.savePersonaje(nuevoPersonaje);
      setShowNewModal(false);
      setNewCharName('');
      setNewCharLevel(1);
      onUpdate();
    } catch (error) {
      console.error('Error creando personaje:', error);
      modal.showError('Error al crear el personaje');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCharacter = async (id: string, nombre: string) => {
    const confirmed = await modal.showConfirm(`¿Estás seguro de eliminar a ${nombre}?`);
    if (!confirmed) return;

    try {
      await WorkspaceService.deletePersonaje(id);
      onUpdate();
    } catch (error) {
      console.error('Error eliminando personaje:', error);
      modal.showError('Error al eliminar el personaje');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-d4-text-dim">Cargando personajes...</div>
      </div>
    );
  }

  const countNonEmptyStatFields = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return 1;
    if (Array.isArray(value)) return value.reduce((acc, item) => acc + countNonEmptyStatFields(item), 0);
    if (typeof value === 'object') {
      // Soporta estructuras enriquecidas como { valor, atributo_ref, detalles }
      if ('valor' in value) {
        return countNonEmptyStatFields(value.valor);
      }
      return Object.values(value).reduce<number>((acc, item) => acc + countNonEmptyStatFields(item), 0);
    }
    return 0;
  };

  const getStatsFillPercentage = (personaje: Personaje): number => {
    if (!personaje.estadisticas) return 0;

    const expectedFieldsBySection: Record<string, number> = {
      personaje: 2,
      atributosPrincipales: 6,
      defensivo: 12,
      ofensivo: 18,
      utilidad: 16,
      armaduraYResistencias: 6,
      jcj: 4,
      moneda: 4
    };

    let filled = 0;
    let expected = 0;

    Object.entries(expectedFieldsBySection).forEach(([section, expectedCount]) => {
      expected += expectedCount;
      const sectionData = (personaje.estadisticas as any)?.[section];
      if (!sectionData) return;
      const sectionFilled = countNonEmptyStatFields(sectionData);
      filled += Math.min(sectionFilled, expectedCount);
    });

    return expected > 0 ? Math.min((filled / expected) * 100, 100) : 0;
  };

  const getCompletion = (personaje: Personaje): number => {
    const activasCount = personaje.habilidades_refs?.activas.length || 0;
    const pasivasCount = personaje.habilidades_refs?.pasivas.length || 0;
    const glifosCount = personaje.glifos_refs?.length || 0;
    const aspectosCount = personaje.aspectos_refs?.length || 0;

    const statsProgress = getStatsFillPercentage(personaje);
    const activasProgress = Math.min(activasCount / 4, 1) * 100;
    const pasivasProgress = Math.min(pasivasCount / 13, 1) * 100;
    const glifosProgress = Math.min(glifosCount / 4, 1) * 100;
    const aspectosProgress = Math.min(aspectosCount / 8, 1) * 100;

    // 100% depende SOLO de stats + glifos + aspectos + habilidades.
    const totalCompletion =
      (statsProgress * 0.40) +
      (activasProgress * 0.20) +
      (pasivasProgress * 0.20) +
      (glifosProgress * 0.10) +
      (aspectosProgress * 0.10);

    return Math.min(100, totalCompletion);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-d4-text">Mis Personajes</h2>
        <button onClick={() => setShowNewModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nuevo Personaje
        </button>
      </div>

      {personajes.length === 0 ? (
        <div className="card text-center py-12">
          <User className="w-16 h-16 mx-auto mb-4 text-d4-text-dim" />
          <h3 className="text-lg font-semibold text-d4-text mb-2">
            No hay personajes creados
          </h3>
          <p className="text-d4-text-dim mb-4">
            Crea tu primer personaje para comenzar a gestionar tus builds
          </p>
          <button onClick={() => setShowNewModal(true)} className="btn-primary">
            Crear Personaje
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {personajes.map(personaje => {
            const statsPercentage = getStatsFillPercentage(personaje);
            const completion = getCompletion(personaje);

            return (
            <div key={personaje.id} className="card-hover group relative overflow-hidden">
              {/* Decoración de fondo */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-d4-accent/10 to-transparent rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-d4-accent group-hover:text-d4-accent-hover transition-colors truncate">
                      {personaje.nombre}
                    </h3>
                    <p className="text-base text-d4-text-dim uppercase tracking-wide">{personaje.clase}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(personaje);
                      }}
                      className="p-2 hover:bg-d4-accent/20 rounded-md transition-all"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4 text-d4-accent" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCharacter(personaje.id, personaje.nombre);
                      }}
                      className="p-2 hover:bg-red-900/30 rounded-md transition-all"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="stat-label text-sm">Nivel:</span>
                    <span className="stat-value text-lg">{personaje.nivel}</span>
                  </div>
                  {personaje.nivel_paragon && personaje.nivel_paragon > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="stat-label text-sm">Paragon:</span>
                      <span className="stat-value text-lg">{personaje.nivel_paragon}</span>
                    </div>
                  )}
                  
                  {/* Detalles de habilidades */}
                  <div className="flex justify-between items-center">
                    <span className="stat-label text-xs">Activas:</span>
                    <span className="text-d4-text text-sm font-semibold">
                      {personaje.habilidades_refs?.activas.length || 0}/4
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="stat-label text-xs">Pasivas:</span>
                    <span className="text-d4-text text-sm font-semibold">
                      {personaje.habilidades_refs?.pasivas.length || 0}/13
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="stat-label text-xs">Glifos:</span>
                    <span className="text-d4-text text-sm font-semibold">
                      {personaje.glifos_refs?.length || 0}/4
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="stat-label text-xs">Aspectos:</span>
                    <span className="text-d4-text text-sm font-semibold">
                      {personaje.aspectos_refs?.length || 0}
                    </span>
                  </div>
                  
                  {/* Estadísticas cargadas */}
                  <div className="flex justify-between items-center">
                    <span className="stat-label text-xs">Estadísticas:</span>
                    <span className="text-d4-text text-sm font-semibold">
                      {`${Math.round(statsPercentage)}%`}
                    </span>
                  </div>
                  
                  {/* Porcentaje de completitud */}
                  <div className="mt-3 pt-3 border-t border-d4-border/50">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-d4-text-dim">Completitud:</span>
                      <span className={`text-sm font-bold ${
                        completion >= 80 ? 'text-green-400' : completion >= 50 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {`${Math.round(completion)}%`}
                      </span>
                    </div>
                    <div className="w-full bg-d4-surface rounded-full h-2.5 overflow-hidden border border-d4-border">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          completion >= 80 ? 'bg-green-500' : completion >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.round(completion)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelect(personaje)}
                  className="w-full btn-secondary text-sm py-2"
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Modal Nuevo Personaje */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full animate-fade-in">
            <h3 className="text-xl font-bold text-d4-accent mb-4">Nuevo Personaje</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-d4-text mb-2">
                  Nombre del Personaje
                </label>
                <input
                  type="text"
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  className="input w-full"
                  placeholder="Ej: Zaraki"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-d4-text mb-2">
                  Clase
                </label>
                <select
                  value={newCharClass}
                  onChange={(e) => setNewCharClass(e.target.value)}
                  className="input w-full"
                >
                  {clases.map(clase => (
                    <option key={clase} value={clase}>{clase}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-d4-text mb-2">
                  Nivel
                </label>
                <input
                  type="number"
                  value={newCharLevel}
                  onChange={(e) => setNewCharLevel(parseInt(e.target.value) || 1)}
                  className="input w-full"
                  min="1"
                  max="60"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewModal(false)}
                className="btn-secondary flex-1"
                disabled={creating}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCharacter}
                className="btn-primary flex-1"
                disabled={!newCharName.trim() || creating}
              >
                {creating ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Modal {...modal} />
    </div>
  );
};

export default CharacterList;
