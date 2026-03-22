import React, { useState } from 'react';
import { ArrowLeft, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { Personaje, Estadisticas } from '../../types';
import { WorkspaceService } from '../../services/WorkspaceService';
import CharacterStats from './CharacterStats';
import CharacterGlyphs from './CharacterGlyphs';
import CharacterSkills from './CharacterSkills';
import CharacterPrompts from './CharacterPrompts';
import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';

interface Props {
  personaje: Personaje;
  onBack: () => void;
  onUpdate: () => void;
}

const CharacterDetail: React.FC<Props> = ({ personaje, onBack, onUpdate }) => {
  const modal = useModal();
  const [editMode, setEditMode] = useState(false);
  const [editedPersonaje, setEditedPersonaje] = useState<Personaje>({ ...personaje });
  const [saving, setSaving] = useState(false);

  // Estados para los cambios pendientes
  const [pendingStats, setPendingStats] = useState<Estadisticas | undefined>(personaje.estadisticas);
  const [pendingGlyphs, setPendingGlyphs] = useState<Array<{ id: string; nivel_actual: number; nivel_maximo?: number }>>(
    personaje.glifos_refs || []
  );
  const [pendingSkills, setPendingSkills] = useState<{ activas: Array<{ skill_id: string; modificadores_ids: string[] }>; pasivas: string[] }>(
    personaje.habilidades_refs || { activas: [], pasivas: [] }
  );
  const [hasChanges, setHasChanges] = useState(false);

  // Estados para secciones colapsables
  const [skillsCollapsed, setSkillsCollapsed] = useState(false);
  const [statsCollapsed, setStatsCollapsed] = useState(false);
  const [glyphsCollapsed, setGlyphsCollapsed] = useState(false);
  const [promptsCollapsed, setPromptsCollapsed] = useState(false);

  const handleSaveBasicInfo = async () => {
    setSaving(true);
    try {
      editedPersonaje.fecha_actualizacion = new Date().toISOString();
      await WorkspaceService.savePersonaje(editedPersonaje);
      setEditMode(false);
      setHasChanges(false);
      onUpdate();
    } catch (error) {
      console.error('Error guardando personaje:', error);
      modal.showError('Error al guardar el personaje');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const updatedPersonaje: Personaje = {
        ...editedPersonaje,
        estadisticas: pendingStats,
        glifos_refs: pendingGlyphs,
        habilidades_refs: pendingSkills,
        fecha_actualizacion: new Date().toISOString(),
      };
      
      await WorkspaceService.savePersonaje(updatedPersonaje);
      setEditedPersonaje(updatedPersonaje);
      setEditMode(false);
      setHasChanges(false);
      onUpdate();
      modal.showSuccess('Todos los cambios guardados correctamente');
    } catch (error) {
      console.error('Error guardando personaje:', error);
      modal.showError('Error al guardar el personaje');
    } finally {
      setSaving(false);
    }
  };

  const handleStatsChange = (stats: Estadisticas, nivel?: number, nivelParagon?: number) => {
    setPendingStats(stats);
    // Si se proporciona nivel, actualizar también en el personaje
    if (nivel !== undefined || nivelParagon !== undefined) {
      setEditedPersonaje(prev => ({
        ...prev,
        ...(nivel !== undefined && { nivel }),
        ...(nivelParagon !== undefined && { nivel_paragon: nivelParagon })
      }));
    }
    setHasChanges(true);
  };

  const handleGlyphsChange = (glifosRefs: Array<{ id: string; nivel_actual: number; nivel_maximo?: number }>) => {
    setPendingGlyphs(glifosRefs);
    setHasChanges(true);
  };

  const handleSkillsChange = (skillsRefs: { activas: Array<{ skill_id: string; modificadores_ids: string[] }>; pasivas: string[] }) => {
    setPendingSkills(skillsRefs);
    setHasChanges(true);
  };

  const formatLastUpdate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
          <div>
            <h2 className="text-2xl font-bold text-d4-accent">{editedPersonaje.nombre}</h2>
            <p className="text-d4-text-dim">{editedPersonaje.clase} - Nivel {editedPersonaje.nivel}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {hasChanges && (
            <button 
              onClick={handleSaveAll} 
              className="btn-primary flex items-center gap-2 animate-pulse"
              disabled={saving}
            >
              <Save className="w-5 h-5" />
              {saving ? 'Guardando...' : 'Guardar Todo'}
            </button>
          )}
          
          {editMode ? (
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setEditedPersonaje({ ...personaje });
                  setEditMode(false);
                }} 
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveBasicInfo} 
                className="btn-primary flex items-center gap-2"
                disabled={saving}
              >
                <Save className="w-5 h-5" />
                {saving ? 'Guardando...' : 'Guardar Info'}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditMode(true)} className="btn-secondary">
              Editar Info
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información General */}
        <div className="card">
          <h3 className="text-lg font-bold text-d4-text mb-4">Información General</h3>
          
          {editMode ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-d4-text-dim mb-1">Nombre</label>
                <input
                  type="text"
                  value={editedPersonaje.nombre}
                  onChange={(e) => setEditedPersonaje({...editedPersonaje, nombre: e.target.value})}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-d4-text-dim mb-1">Nivel</label>
                <input
                  type="number"
                  value={editedPersonaje.nivel}
                  onChange={(e) => setEditedPersonaje({...editedPersonaje, nivel: parseInt(e.target.value)})}
                  className="input w-full"
                  min="1"
                  max="60"
                />
              </div>
              <div>
                <label className="block text-sm text-d4-text-dim mb-1">Nivel Paragon</label>
                <input
                  type="number"
                  value={editedPersonaje.nivel_paragon || 0}
                  onChange={(e) => setEditedPersonaje({...editedPersonaje, nivel_paragon: parseInt(e.target.value) || 0})}
                  className="input w-full"
                  min="0"
                  max="200"
                />
              </div>
              <div>
                <label className="block text-sm text-d4-text-dim mb-1">Notas</label>
                <textarea
                  value={editedPersonaje.notas || ''}
                  onChange={(e) => setEditedPersonaje({...editedPersonaje, notas: e.target.value})}
                  className="input w-full"
                  rows={4}
                  placeholder="Notas sobre el build..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-d4-text-dim">Clase:</span>
                <span className="text-d4-text font-semibold">{editedPersonaje.clase}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-d4-text-dim">Nivel:</span>
                <span className="text-d4-text font-semibold">{editedPersonaje.nivel}</span>
              </div>
              {editedPersonaje.nivel_paragon && (
                <div className="flex justify-between">
                  <span className="text-d4-text-dim">Nivel Paragon:</span>
                  <span className="text-d4-text font-semibold">{editedPersonaje.nivel_paragon}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-d4-text-dim">Creado:</span>
                <span className="text-d4-text text-xs">
                  {new Date(editedPersonaje.fecha_creacion).toLocaleDateString('es-ES')}
                </span>
              </div>
              {editedPersonaje.notas && (
                <div className="mt-4 pt-4 border-t border-d4-border">
                  <p className="text-d4-text-dim text-xs mb-1">Notas:</p>
                  <p className="text-d4-text text-sm whitespace-pre-wrap">{editedPersonaje.notas}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Habilidades */}
        <div className="lg:col-span-3">
          <div className="card">
            <button
              onClick={() => setSkillsCollapsed(!skillsCollapsed)}
              className="w-full flex items-center justify-between p-4 hover:bg-d4-border/20 transition-colors rounded"
            >
              <div>
                <h3 className="text-lg font-bold text-d4-accent">Habilidades del Personaje</h3>
                <p className="text-[10px] text-d4-text-dim mt-0.5">
                  Última actualización: {formatLastUpdate(editedPersonaje.fecha_actualizacion)}
                </p>
              </div>
              {skillsCollapsed ? (
                <ChevronDown className="w-5 h-5 text-d4-accent" />
              ) : (
                <ChevronUp className="w-5 h-5 text-d4-accent" />
              )}
            </button>
            {!skillsCollapsed && (
              <div className="px-4 pb-4">
                <CharacterSkills personaje={editedPersonaje} onChange={handleSkillsChange} />
              </div>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="lg:col-span-3">
          <div className="card">
            <button
              onClick={() => setStatsCollapsed(!statsCollapsed)}
              className="w-full flex items-center justify-between p-4 hover:bg-d4-border/20 transition-colors rounded"
            >
              <div>
                <h3 className="text-lg font-bold text-d4-accent">Estadísticas</h3>
                <p className="text-[10px] text-d4-text-dim mt-0.5">
                  Última actualización: {formatLastUpdate(editedPersonaje.fecha_actualizacion)}
                </p>
              </div>
              {statsCollapsed ? (
                <ChevronDown className="w-5 h-5 text-d4-accent" />
              ) : (
                <ChevronUp className="w-5 h-5 text-d4-accent" />
              )}
            </button>
            {!statsCollapsed && (
              <div className="px-4 pb-4">
                <CharacterStats personaje={editedPersonaje} onChange={handleStatsChange} />
              </div>
            )}
          </div>
        </div>

        {/* Glifos */}
        <div className="lg:col-span-3">
          <div className="card">
            <button
              onClick={() => setGlyphsCollapsed(!glyphsCollapsed)}
              className="w-full flex items-center justify-between p-4 hover:bg-d4-border/20 transition-colors rounded"
            >
              <div>
                <h3 className="text-lg font-bold text-d4-accent">Glifos del Personaje</h3>
                <p className="text-[10px] text-d4-text-dim mt-0.5">
                  Última actualización: {formatLastUpdate(editedPersonaje.fecha_actualizacion)}
                </p>
              </div>
              {glyphsCollapsed ? (
                <ChevronDown className="w-5 h-5 text-d4-accent" />
              ) : (
                <ChevronUp className="w-5 h-5 text-d4-accent" />
              )}
            </button>
            {!glyphsCollapsed && (
              <div className="px-4 pb-4">
                <CharacterGlyphs personaje={editedPersonaje} onChange={handleGlyphsChange} />
              </div>
            )}
          </div>
        </div>

        {/* Prompts Inteligentes */}
        <div className="lg:col-span-3">
          <div className="card">
            <button
              onClick={() => setPromptsCollapsed(!promptsCollapsed)}
              className="w-full flex items-center justify-between p-4 hover:bg-d4-border/20 transition-colors rounded"
            >
              <h3 className="text-lg font-bold text-d4-accent">Generador de Prompts IA</h3>
              {promptsCollapsed ? (
                <ChevronDown className="w-5 h-5 text-d4-accent" />
              ) : (
                <ChevronUp className="w-5 h-5 text-d4-accent" />
              )}
            </button>
            {!promptsCollapsed && (
              <div className="px-4 pb-4">
                <CharacterPrompts personaje={editedPersonaje} />
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal {...modal} />
    </div>
  );
};

export default CharacterDetail;
