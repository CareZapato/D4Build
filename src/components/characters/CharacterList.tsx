import React, { useState } from 'react';
import { Plus, User, Trash2, Eye, Zap, Star, Swords, Shield, Hexagon, Gem, Network, BarChart, Target, Lock } from 'lucide-react';
import { Personaje } from '../../types';
import { WorkspaceService } from '../../services/WorkspaceService';
import { useAuth } from '../../context/AuthContext';
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
  const { isPremium } = useAuth();
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharClass, setNewCharClass] = useState('Paladín');
  const [newCharLevel, setNewCharLevel] = useState(1);
  const [creating, setCreating] = useState(false);

  const clases = ['Paladín', 'Bárbaro', 'Hechicero', 'Pícaro', 'Druida', 'Nigromante', 'Espiritista', 'Conjurador'];

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

  // Cuenta solo campos de estadística principales (excluye detalles, palabras_clave, metadatos)
  const countStatFields = (sectionData: any): number => {
    if (!sectionData || typeof sectionData !== 'object') return 0;
    
    let count = 0;
    const excludedKeys = ['detalles', 'palabras_clave', 'valor', 'atributo_ref', 'atributo_nombre', 
                          'aguante_definicion', 'nivel_paragon'];
    
    for (const [key, value] of Object.entries(sectionData)) {
      // Saltar campos de metadatos
      if (excludedKeys.includes(key)) continue;
      
      // Para campos de moneda, verificar si tiene valor
      if (typeof value === 'object' && value !== null && 'valor' in value) {
        const valorActual = (value as any).valor;
        if (valorActual !== null && valorActual !== undefined && valorActual !== '') {
          count++;
        }
      }
      // Para campos normales
      else if (value !== null && value !== undefined && value !== '') {
        count++;
      }
    }
    
    return count;
  };

  const getStatsFillPercentage = (personaje: Personaje): number => {
    if (!personaje.estadisticas) return 0;

    // Valores esperados realistas basados en lo que se puede capturar
    const expectedFieldsBySection: Record<string, number> = {
      personaje: 4,              // danioArma, aguante, vidamaxima, armadura
      atributosPrincipales: 5,   // nivel, fuerza, inteligencia, voluntad, destreza
      defensivo: 11,             // reduccionDanioCercanos, bonificacionFortificacion, bonificacionBarrera, probabilidadEsquivar, vidaMaxima, cantidadPociones, sanacionRecibida, vidaPorEliminacion, vidaCada5Segundos, probabilidadBloqueo, reduccionBloqueo
      ofensivo: 17,              // danioVsEnemigosCercanos, danioVsEnemigosElite, danioVsEnemigosSaludables, danioConCorrupcion, espinas, danioContraEnemigosVulnerables, todoElDanio, danioFisico, danioConSangrado, danioConQuemadura, danioConVeneno, danioBaseArma, velocidadArma, bonificacionVelocidadAtaque, probabilidadGolpeCritico, danioGolpeCritico, probabilidadAbrumar, danioAbrumador
      utilidad: 8,               // maximoFe, reduccionCostoFe, regeneracionFe, feConCadaEliminacion, velocidadMovimiento, reduccionRecuperacion, bonificacionProbabilidadGolpeAfortunado, bonificacionExperiencia
      armaduraYResistencias: 7,  // aguante, armadura, resistenciaDanioFisico, resistenciaFuego, resistenciaFrio, resistenciaRayo, resistenciaVeneno, resistenciaSombra
      jcj: 1,                    // reduccionDanio (solo 1 campo capturado)
      moneda: 7                  // oro, obolos, polvoRojo, marcasPalidas, monedasDelAlcazar, favor, carneFresca
    };

    let filled = 0;
    let expected = 0;

    Object.entries(expectedFieldsBySection).forEach(([section, expectedCount]) => {
      expected += expectedCount;
      const sectionData = (personaje.estadisticas as any)?.[section];
      if (!sectionData) return;
      
      const sectionFilled = countStatFields(sectionData);
      filled += Math.min(sectionFilled, expectedCount);
    });

    return expected > 0 ? Math.min((filled / expected) * 100, 100) : 0;
  };

  const getCompletion = (personaje: Personaje): number => {
    // Conteo de elementos
    const activasCount = personaje.habilidades_refs?.activas.length || 0;
    const pasivasCount = personaje.habilidades_refs?.pasivas.length || 0;
    const glifosCount = personaje.glifos_refs?.length || 0;
    const runasCount = personaje.runas_refs?.length || 0;
    const talismanesCount = personaje.talismanes_refs?.length || 0;
    
    // Contar nodos de Paragon (activados + huérfanos)
    const nodosActivados = personaje.paragon_refs?.nodos_activados_ids?.length || 0;
    const nodosHuerfanos = personaje.paragon_refs?.nodos_huerfanos?.length || 0;
    const nodosCount = nodosActivados + nodosHuerfanos;
    
    // Contar piezas de build
    const buildPiezas = personaje.build?.piezas 
      ? Object.values(personaje.build.piezas).filter(Boolean).length 
      : 0;

    // Nueva distribución v0.8.1:
    // - Estadísticas: 25%
    // - Skills: 20% (activas + pasivas combinadas)
    // - Build: 20%
    // - Glifos: 10%
    // - Runas: 10%
    // - Talismanes: 5%
    // - Nodos: 10%

    const statsProgress = getStatsFillPercentage(personaje);
    const skillsProgress = Math.min((activasCount + pasivasCount) / 17, 1) * 100; // ~17 skills total (4 activas + 13 pasivas)
    const buildProgress = Math.min(buildPiezas / 12, 1) * 100; // 12 slots de equipamiento
    const glifosProgress = Math.min(glifosCount / 4, 1) * 100; // 4 glifos
    const runasProgress = Math.min(runasCount / 4, 1) * 100; // 4 runas máximo
    const talismanesProgress = Math.min(talismanesCount / 6, 1) * 100; // ~6 talismanes promedio en sello horádrico
    const nodosProgress = Math.min(nodosCount / 50, 1) * 100; // ~50 nodos promedio para completar tableros

    const totalCompletion =
      (statsProgress * 0.25) +
      (skillsProgress * 0.20) +
      (buildProgress * 0.20) +
      (glifosProgress * 0.10) +
      (runasProgress * 0.10) +
      (talismanesProgress * 0.05) +
      (nodosProgress * 0.10);

    return Math.min(100, totalCompletion);
  };

  return (
    <div className="animate-fade-in px-2 lg:px-0">
      <div className="card p-3 lg:p-6 mb-4 lg:mb-6 bg-gradient-to-br from-d4-surface via-d4-bg to-d4-surface border-2 border-d4-accent/30">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="p-1.5 lg:p-2 bg-d4-accent/20 rounded-lg border-2 border-d4-accent/40">
              <User className="w-4 lg:w-6 h-4 lg:h-6 text-d4-accent" />
            </div>
            <div>
              <h1 className="text-xl lg:text-3xl font-bold text-d4-accent mb-0.5 lg:mb-1">Mis Personajes</h1>
              <p className="text-d4-text-dim text-xs lg:text-sm">Gestiona todos tus personajes de Diablo 4</p>
            </div>
          </div>
          <button onClick={() => setShowNewModal(true)} className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-bold flex items-center gap-2 transition-all shadow-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 hover:scale-105">
            <Plus className="w-4 lg:w-5 h-4 lg:h-5" />
            <span className="hidden sm:inline">Nuevo Personaje</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-5">
          {personajes.map(personaje => {
            const statsPercentage = getStatsFillPercentage(personaje);
            const completion = getCompletion(personaje);
            
            // Contadores para la tarjeta
            const activasCount = personaje.habilidades_refs?.activas.length || 0;
            const pasivasCount = personaje.habilidades_refs?.pasivas.length || 0;
            const glifosCount = personaje.glifos_refs?.length || 0;
            const runasCount = personaje.runas_refs?.length || 0;
            const talismanesCount = personaje.talismanes_refs?.length || 0;
            const nodosActivados = personaje.paragon_refs?.nodos_activados_ids?.length || 0;
            const nodosHuerfanos = personaje.paragon_refs?.nodos_huerfanos?.length || 0;
            const nodosTotal = nodosActivados + nodosHuerfanos;

            return (
            <div key={personaje.id} className="card-hover group relative overflow-hidden p-3 lg:p-4">
              {/* Decoración de fondo */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-d4-accent/10 to-transparent rounded-full blur-2xl"></div>
              
              <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-2 lg:mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base lg:text-xl font-bold text-d4-accent group-hover:text-d4-accent-hover transition-colors truncate">
                      {personaje.nombre}
                    </h3>
                    <p className="text-xs lg:text-sm text-d4-text-dim uppercase tracking-wide">{personaje.clase}</p>
                  </div>
                  <div className="flex gap-0.5 lg:gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(personaje);
                      }}
                      className="p-1 lg:p-2 hover:bg-d4-accent/20 rounded-md transition-all"
                      title="Ver detalles"
                    >
                      <Eye className="w-3 lg:w-4 h-3 lg:h-4 text-d4-accent" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCharacter(personaje.id, personaje.nombre);
                      }}
                      className="p-1 lg:p-2 hover:bg-red-900/30 rounded-md transition-all"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3 lg:w-4 h-3 lg:h-4 text-red-400" />
                    </button>
                  </div>
                </div>
                
                {/* Grid de 2 columnas con métricas - Blur para Basic */}
                <div className={`relative ${!isPremium() ? 'blur-sm select-none pointer-events-none' : ''}`}>
                  <div className="grid grid-cols-2 gap-x-2 lg:gap-x-4 gap-y-1.5 lg:gap-y-2.5 mb-2 lg:mb-4">
                  {/* Nivel */}
                  <div className="flex items-center gap-1 lg:gap-2" title="Nivel del personaje">
                    <Zap className="w-3 lg:w-4 h-3 lg:h-4 text-yellow-400 flex-shrink-0" />
                    <span className="text-[10px] lg:text-xs text-d4-text-dim">Nivel:</span>
                    <span className="text-xs lg:text-sm text-d4-text font-bold ml-auto">{personaje.nivel}</span>
                  </div>
                  
                  {/* Paragon */}
                  {personaje.nivel_paragon && personaje.nivel_paragon > 0 && (
                    <div className="flex items-center gap-1 lg:gap-2" title="Nivel de Paragon">
                      <Star className="w-3 lg:w-4 h-3 lg:h-4 text-purple-400 flex-shrink-0" />
                      <span className="text-[10px] lg:text-xs text-d4-text-dim">Paragon:</span>
                      <span className="text-xs lg:text-sm text-d4-text font-bold ml-auto">{personaje.nivel_paragon}</span>
                    </div>
                  )}
                  
                  {/* Activas */}
                  <div className="flex items-center gap-1 lg:gap-2" title="Habilidades Activas equipadas">
                    <Swords className="w-3 lg:w-4 h-3 lg:h-4 text-red-400 flex-shrink-0" />
                    <span className="text-[10px] lg:text-xs text-d4-text-dim">Activas:</span>
                    <span className="text-xs lg:text-sm text-d4-text font-bold ml-auto">{activasCount}/4</span>
                  </div>
                  
                  {/* Pasivas */}
                  <div className="flex items-center gap-1 lg:gap-2" title="Habilidades Pasivas equipadas">
                    <Shield className="w-3 lg:w-4 h-3 lg:h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-[10px] lg:text-xs text-d4-text-dim">Pasivas:</span>
                    <span className="text-xs lg:text-sm text-d4-text font-bold ml-auto">{pasivasCount}/13</span>
                  </div>
                  
                  {/* Glifos */}
                  <div className="flex items-center gap-1 lg:gap-2" title="Glifos equipados">
                    <Hexagon className="w-3 lg:w-4 h-3 lg:h-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-[10px] lg:text-xs text-d4-text-dim">Glifos:</span>
                    <span className="text-xs lg:text-sm text-d4-text font-bold ml-auto">{glifosCount}/4</span>
                  </div>
                  
                  {/* Runas */}
                  <div className="flex items-center gap-1 lg:gap-2" title="Runas equipadas">
                    <Gem className="w-3 lg:w-4 h-3 lg:h-4 text-pink-400 flex-shrink-0" />
                    <span className="text-[10px] lg:text-xs text-d4-text-dim">Runas:</span>
                    <span className="text-xs lg:text-sm text-d4-text font-bold ml-auto">{runasCount}/4</span>
                  </div>
                  
                  {/* Talismanes */}
                  <div className="flex items-center gap-1 lg:gap-2" title="Talismanes equipados (Temporada 13)">
                    <svg className="w-3 lg:w-4 h-3 lg:h-4 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2l2.5 5.5L18 9l-4.5 4 1 6-4.5-2.5L5 19l1-6L1.5 9l5.5-1.5L10 2z" />
                    </svg>
                    <span className="text-[10px] lg:text-xs text-d4-text-dim">Talismanes:</span>
                    <span className="text-xs lg:text-sm text-d4-text font-bold ml-auto">{talismanesCount}</span>
                  </div>
                  
                  {/* Nodos Paragon */}
                  <div className="flex items-center gap-1 lg:gap-2" title="Nodos de Paragon activados">
                    <Network className="w-3 lg:w-4 h-3 lg:h-4 text-purple-300 flex-shrink-0" />
                    <span className="text-[10px] lg:text-xs text-d4-text-dim">Nodos:</span>
                    <span className="text-xs lg:text-sm text-d4-text font-bold ml-auto">{nodosTotal}</span>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-1 lg:gap-2" title="Estadísticas cargadas">
                    <BarChart className="w-3 lg:w-4 h-3 lg:h-4 text-green-400 flex-shrink-0" />
                    <span className="text-[10px] lg:text-xs text-d4-text-dim">Stats:</span>
                    <span className="text-xs lg:text-sm text-d4-text font-bold ml-auto">{Math.round(statsPercentage)}%</span>
                  </div>
                </div>
                
                {/* Overlay Premium para usuarios Basic */}
                {!isPremium() && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                    <div className="text-center px-2 lg:px-4">
                      <Lock className="w-6 lg:w-8 h-6 lg:h-8 text-yellow-300 mx-auto mb-1 lg:mb-2" />
                      <p className="text-[10px] lg:text-xs font-bold text-yellow-300 uppercase tracking-wide">Premium</p>
                      <p className="text-[9px] lg:text-xs text-d4-text-dim mt-0.5 lg:mt-1 hidden sm:block">Desbloquea estadísticas completas</p>
                    </div>
                  </div>
                )}
              </div>
                
                {/* Barra de completitud */}
                <div className="pt-2 lg:pt-3 border-t border-d4-border/50">
                  <div className="flex items-center justify-between mb-1 lg:mb-1.5">
                    <div className="flex items-center gap-1 lg:gap-1.5" title="Porcentaje de completitud total">
                      <Target className="w-3 lg:w-3.5 h-3 lg:h-3.5 text-d4-text-dim" />
                      <span className="text-[10px] lg:text-xs font-bold text-d4-text-dim">Completitud:</span>
                    </div>
                    <span className={`text-xs lg:text-sm font-bold ${
                      completion >= 80 ? 'text-green-400' : completion >= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {`${Math.round(completion)}%`}
                    </span>
                  </div>
                  <div className="w-full bg-d4-surface rounded-full h-2 lg:h-2.5 overflow-hidden border border-d4-border">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        completion >= 80 ? 'bg-green-500' : completion >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.round(completion)}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => onSelect(personaje)}
                  className="w-full btn-secondary text-xs lg:text-sm py-1.5 lg:py-2 mt-2 lg:mt-4"
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
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
