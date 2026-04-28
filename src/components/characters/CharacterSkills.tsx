import { useState, useEffect, useMemo } from 'react';
import { Upload, Plus, Trash2, Zap, Shield, Copy, Check, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Personaje, HabilidadActiva, HabilidadPasiva, HabilidadesPersonaje, Tag, TipoHabilidad } from '../../types';
import { WorkspaceService } from '../../services/WorkspaceService';
import { TagLinkingService } from '../../services/TagLinkingService';
import { ImageExtractionPromptService } from '../../services/ImageExtractionPromptService';
import { TagBadge } from '../tags/TagBadge';
import Modal from '../common/Modal';
import ConfirmImportModal, { ImportSummary } from '../common/ConfirmImportModal';
import { useModal } from '../../hooks/useModal';

interface Props {
  personaje: Personaje;
  onChange: (skillsRefs: { 
    activas: Array<{ skill_id: string; modificadores_ids: string[]; nivel_actual?: number; en_batalla?: boolean }>; 
    pasivas: Array<{ skill_id: string; puntos_asignados?: number }>;
  }) => void;
}

const CharacterSkills: React.FC<Props> = ({ personaje, onChange }) => {
  const modal = useModal();
  const [importing, setImporting] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<HabilidadesPersonaje | null>(null);
  const [activeSkillsData, setActiveSkillsData] = useState<HabilidadActiva[]>([]);
  const [passiveSkillsData, setPassiveSkillsData] = useState<HabilidadPasiva[]>([]);
  const [skillsRefs, setSkillsRefs] = useState<{ 
    activas: Array<{ skill_id: string; modificadores_ids: string[]; nivel_actual?: number; en_batalla?: boolean }>; 
    pasivas: Array<{ skill_id: string; puntos_asignados?: number }> 
  }>(
    personaje.habilidades_refs || { activas: [], pasivas: [] }
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [promptElementCount, setPromptElementCount] = useState('');
  const [modalType, setModalType] = useState<'activa' | 'pasiva'>('activa');
  const [copied, setCopied] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<HabilidadesPersonaje | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  
  // Estados para filtros y ordenamiento
  const [filterText, setFilterText] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [sortBy, setSortBy] = useState<'nombre' | 'tipo' | 'nivel'>('nombre');
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadHeroSkills();
  }, [personaje.clase]);

  useEffect(() => {
    loadCharacterSkillsData();
  }, [skillsRefs, availableSkills]);

  useEffect(() => {
    setSkillsRefs(personaje.habilidades_refs || { activas: [], pasivas: [] });
  }, [personaje.id, personaje.habilidades_refs]);

  const loadHeroSkills = async () => {
    try {
      const heroSkills = await WorkspaceService.loadHeroSkills(personaje.clase);
      if (heroSkills) {
        setAvailableSkills(heroSkills);
      }
    } catch (error) {
      console.error('Error cargando habilidades del héroe:', error);
    }
  };

  const loadCharacterSkillsData = () => {
    if (!availableSkills) return;

    // Cargar habilidades activas con modificadores equipados filtrados
    const activasData = skillsRefs.activas.map(ref => {
      const skill = availableSkills.habilidades_activas.find(s => s.id === ref.skill_id);
      if (!skill) return null;
      
      // Filtrar solo los modificadores que el personaje tiene equipados
      const modificadoresEquipados = skill.modificadores?.filter(mod => 
        ref.modificadores_ids.includes(mod.id || '')
      ) || [];

      return {
        ...skill,
        modificadores: modificadoresEquipados,
        // El nivel_actual viene del ref del personaje, no del héroe
        nivel: ref.nivel_actual ?? skill.nivel
      };
    }).filter(Boolean) as HabilidadActiva[];

    // Compatibilidad hacia atrás: pasivas puede ser string[] o array de objetos
    const pasivasData = skillsRefs.pasivas.map(pasiva => {
      // Si es string (formato viejo), convertir
      const skillId = typeof pasiva === 'string' ? pasiva : pasiva.skill_id;
      const skill = availableSkills.habilidades_pasivas.find(s => s.id === skillId);
      if (!skill) return null;
      
      // Si tiene puntos_asignados, usarlo
      if (typeof pasiva !== 'string' && pasiva.puntos_asignados !== undefined) {
        return {
          ...skill,
          nivel: pasiva.puntos_asignados
        };
      }
      
      return skill;
    }).filter(Boolean) as HabilidadPasiva[];

    setActiveSkillsData(activasData);
    setPassiveSkillsData(pasivasData);
  };

  // Filtrar y ordenar habilidades activas
  const filteredAndSortedActives = useMemo(() => {
    let filtered = [...activeSkillsData];

    // Filtrar por texto
    if (filterText) {
      const searchLower = filterText.toLowerCase();
      filtered = filtered.filter(skill => 
        skill.nombre.toLowerCase().includes(searchLower) ||
        skill.descripcion?.toLowerCase().includes(searchLower) ||
        skill.rama?.toLowerCase().includes(searchLower) ||
        skill.modificadores?.some(mod => mod.nombre.toLowerCase().includes(searchLower))
      );
    }

    // Filtrar por tipo
    if (filterTipo) {
      filtered = filtered.filter(skill => skill.tipo === filterTipo);
    }

    // Ordenar
    filtered.sort((a, b) => {
      if (sortBy === 'nombre') return a.nombre.localeCompare(b.nombre);
      if (sortBy === 'tipo') return (a.tipo || '').localeCompare(b.tipo || '');
      if (sortBy === 'nivel') return (b.nivel || 0) - (a.nivel || 0);
      return 0;
    });

    return filtered;
  }, [activeSkillsData, filterText, filterTipo, sortBy]);

  // Filtrar y ordenar habilidades pasivas
  const filteredAndSortedPassives = useMemo(() => {
    let filtered = [...passiveSkillsData];

    // Filtrar por texto
    if (filterText) {
      const searchLower = filterText.toLowerCase();
      filtered = filtered.filter(skill => 
        skill.nombre.toLowerCase().includes(searchLower) ||
        skill.efecto?.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por tipo
    if (filterTipo) {
      filtered = filtered.filter(skill => skill.tipo === filterTipo);
    }

    // Ordenar
    filtered.sort((a, b) => {
      if (sortBy === 'nombre') return a.nombre.localeCompare(b.nombre);
      if (sortBy === 'tipo') return (a.tipo || '').localeCompare(b.tipo || '');
      if (sortBy === 'nivel') return (b.nivel || 0) - (a.nivel || 0);
      return 0;
    });

    return filtered;
  }, [passiveSkillsData, filterText, filterTipo, sortBy]);

  // Obtener tipos únicos para el filtro
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    activeSkillsData.forEach(s => s.tipo && types.add(s.tipo));
    passiveSkillsData.forEach(s => s.tipo && types.add(s.tipo));
    return Array.from(types).sort();
  }, [activeSkillsData, passiveSkillsData]);

  // Toggle expandir/colapsar skill
  const toggleSkillExpanded = (skillId: string) => {
    setExpandedSkills(prev => {
      const newSet = new Set(prev);
      if (newSet.has(skillId)) {
        newSet.delete(skillId);
      } else {
        newSet.add(skillId);
      }
      return newSet;
    });
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const content = await file.text();
      // Usar el mismo flujo de confirmación que importación de texto
      const summary = await analyzeImportChanges(content);
      setImportSummary(summary);
      setShowConfirmModal(true);
    } catch (error) {
      console.error('Error importando habilidades:', error);
      modal.showError('Error al importar el archivo JSON. Verifica el formato.');
    } finally {
      setImporting(false);
    }
  };

  const handleImportFromText = async () => {
    if (!jsonText.trim()) {
      modal.showError('Por favor ingresa un JSON válido');
      return;
    }

    setImporting(true);
    try {
      // Analizar cambios sin aplicar
      const summary = await analyzeImportChanges(jsonText);
      setImportSummary(summary);
      setShowConfirmModal(true);
    } catch (error) {
      console.error('Error analizando JSON:', error);
      modal.showError('Error al procesar el JSON. Verifica el formato.');
    } finally {
      setImporting(false);
    }
  };

  const analyzeImportChanges = async (content: string): Promise<ImportSummary> => {
    // Parsear múltiples JSON si existen (separados por líneas vacías o detección de múltiples objetos)
    const JSONObjects = parseMultipleJSON(content);
    
    // Combinar todos los JSON en uno solo
    const combinedData: HabilidadesPersonaje = {
      habilidades_activas: [],
      habilidades_pasivas: []
    };

    let allPalabrasClave: Tag[] = [];

    for (const jsonStr of JSONObjects) {
      const data = JSON.parse(jsonStr);
      
      if (data.habilidades_activas) {
        combinedData.habilidades_activas.push(...data.habilidades_activas);
      }
      if (data.habilidades_pasivas) {
        combinedData.habilidades_pasivas.push(...data.habilidades_pasivas);
      }
      
      // Recolectar palabras_clave globales
      if (data.palabras_clave && Array.isArray(data.palabras_clave)) {
        allPalabrasClave.push(...data.palabras_clave);
      }
    }

    // Procesar tags y crear mapa de vinculación
    const { tagMap: newTagMap, tagsProcessed } = await TagLinkingService.processAndLinkAllTags(
      { palabras_clave: allPalabrasClave },
      'habilidad'
    );

    // Vincular tags en habilidades activas
    const linkedActivas = combinedData.habilidades_activas.map(skill => 
      TagLinkingService.linkSkillTags(skill, newTagMap)
    );

    // Vincular tags en habilidades pasivas
    const linkedPasivas = combinedData.habilidades_pasivas.map(skill => 
      TagLinkingService.linkSkillTags(skill, newTagMap)
    );

    const linkedData: HabilidadesPersonaje = {
      habilidades_activas: linkedActivas,
      habilidades_pasivas: linkedPasivas
    };

    setPendingImportData(linkedData);

    // Calcular resumen de cambios
    const heroSkills = await WorkspaceService.loadHeroSkills(personaje.clase) || {
      habilidades_activas: [],
      habilidades_pasivas: []
    };

    let activasActualizadas = 0;
    let activasAgregadas = 0;
    let pasivasActualizadas = 0;
    let pasivasAgregadas = 0;

    // Analizar habilidades activas
    linkedData.habilidades_activas.forEach(skill => {
      const exists = heroSkills.habilidades_activas.some(s => s.nombre === skill.nombre);
      if (exists) {
        activasActualizadas++;
      } else {
        activasAgregadas++;
      }
    });

    // Analizar habilidades pasivas
    linkedData.habilidades_pasivas.forEach(skill => {
      const exists = heroSkills.habilidades_pasivas.some(s => s.nombre === skill.nombre);
      if (exists) {
        pasivasActualizadas++;
      } else {
        pasivasAgregadas++;
      }
    });

    return {
      habilidadesActivas: {
        actualizadas: activasActualizadas,
        agregadas: activasAgregadas
      },
      habilidadesPasivas: {
        actualizadas: pasivasActualizadas,
        agregadas: pasivasAgregadas
      },
      palabrasClave: tagsProcessed
    };
  };

  const parseMultipleJSON = (text: string): string[] => {
    // Intentar parsear como un solo JSON primero
    try {
      JSON.parse(text);
      return [text];
    } catch {
      // Si falla, buscar múltiples objetos JSON
      const jsonObjects: string[] = [];
      const regex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
      const matches = text.match(regex);
      
      if (matches) {
        for (const match of matches) {
          try {
            JSON.parse(match);
            jsonObjects.push(match);
          } catch {
            // Ignorar JSON inválidos
          }
        }
      }
      
      return jsonObjects.length > 0 ? jsonObjects : [text];
    }
  };

  const confirmAndApplyImport = async () => {
    if (!pendingImportData) return;

    setImporting(true);
    setShowConfirmModal(false);
    
    try {
      // Aplicar cambios
      await applyImportChanges(pendingImportData);
      
      // Generar mensaje detallado basado en el summary
      const mensajes: string[] = [];
      if (importSummary) {
        const { habilidadesActivas, habilidadesPasivas, palabrasClave } = importSummary;
        
        if (habilidadesActivas?.actualizadas) {
          mensajes.push(`${habilidadesActivas.actualizadas} activas actualizadas`);
        }
        if (habilidadesActivas?.agregadas) {
          mensajes.push(`${habilidadesActivas.agregadas} activas nuevas`);
        }
        if (habilidadesPasivas?.actualizadas) {
          mensajes.push(`${habilidadesPasivas.actualizadas} pasivas actualizadas`);
        }
        if (habilidadesPasivas?.agregadas) {
          mensajes.push(`${habilidadesPasivas.agregadas} pasivas nuevas`);
        }
        if (palabrasClave) {
          mensajes.push(`${palabrasClave} tags procesados`);
        }
      }
      
      setJsonText('');
      setShowTextInput(false);
      modal.showSuccess(`Habilidades procesadas: ${mensajes.join(', ')}`);
    } catch (error) {
      console.error('Error aplicando importación:', error);
      modal.showError('Error al aplicar los cambios');
    } finally {
      setImporting(false);
      setPendingImportData(null);
      setImportSummary(null);
    }
  };

  const applyImportChanges = async (data: HabilidadesPersonaje) => {
    // Cargar skills del héroe
    const heroSkills = await WorkspaceService.loadHeroSkills(personaje.clase);
    const updatedHeroSkills: HabilidadesPersonaje = heroSkills || {
      habilidades_activas: [],
      habilidades_pasivas: []
    };

    // Actualizar o agregar habilidades activas con IDs para modificadores
    data.habilidades_activas.forEach(skill => {
      const existingIndex = updatedHeroSkills.habilidades_activas.findIndex(s => s.nombre === skill.nombre);
      if (existingIndex >= 0) {
        // Actualizar existente - asignar IDs a modificadores
        const existingSkill = updatedHeroSkills.habilidades_activas[existingIndex];
        const modificadoresConIds = (skill.modificadores || []).map(mod => {
          const existingMod = existingSkill.modificadores?.find(m => m.nombre === mod.nombre);
          return {
            ...mod,
            id: mod.id || existingMod?.id || `mod_${skill.nombre}_${mod.nombre}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`.replace(/\s+/g, '_').toLowerCase(),
            tipo_habilidad: 'modificador' as TipoHabilidad
          };
        });
        
        updatedHeroSkills.habilidades_activas[existingIndex] = {
          ...skill,
          id: existingSkill.id,
          modificadores: modificadoresConIds
        };
      } else {
        // Agregar nueva - asignar IDs a modificadores
        const skillId = skill.id || `skill_activa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const modificadoresConIds = (skill.modificadores || []).map(mod => ({
          ...mod,
          id: mod.id || `mod_${skill.nombre}_${mod.nombre}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`.replace(/\s+/g, '_').toLowerCase(),
          tipo_habilidad: 'modificador' as TipoHabilidad
        }));
        
        const skillWithId = {
          ...skill,
          id: skillId,
          modificadores: modificadoresConIds
        };
        updatedHeroSkills.habilidades_activas.push(skillWithId);
      }
    });

    // Actualizar o agregar habilidades pasivas
    data.habilidades_pasivas.forEach(skill => {
      const existingIndex = updatedHeroSkills.habilidades_pasivas.findIndex(s => s.nombre === skill.nombre);
      if (existingIndex >= 0) {
        updatedHeroSkills.habilidades_pasivas[existingIndex] = {
          ...skill,
          id: updatedHeroSkills.habilidades_pasivas[existingIndex].id
        };
      } else {
        const skillWithId = {
          ...skill,
          id: skill.id || `skill_pasiva_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        updatedHeroSkills.habilidades_pasivas.push(skillWithId);
      }
    });

    // Guardar en el héroe
    await WorkspaceService.saveHeroSkills(personaje.clase, updatedHeroSkills);

    // Actualizar referencias del personaje con TODOS los modificadores del JSON
    const newActiveRefs: Array<{ skill_id: string; modificadores_ids: string[]; nivel_actual?: number }> = [];
    data.habilidades_activas.forEach(skill => {
      const heroSkill = updatedHeroSkills.habilidades_activas.find(s => s.nombre === skill.nombre);
      if (heroSkill?.id) {
        // Extraer IDs de TODOS los modificadores del JSON (todos están activos)
        const modificadoresIds = (skill.modificadores || [])
          .map(mod => {
            const heroMod = heroSkill.modificadores?.find(m => m.nombre === mod.nombre);
            return heroMod?.id || null;
          })
          .filter((id): id is string => id !== null);

        newActiveRefs.push({ 
          skill_id: heroSkill.id, 
          modificadores_ids: modificadoresIds,
          nivel_actual: (skill as any).nivel_actual ?? (skill as any).nivel ?? 1  // Capturar nivel del JSON
        });
      }
    });

    const newPassiveRefs = data.habilidades_pasivas.map(skill => {
      const found = updatedHeroSkills.habilidades_pasivas.find(s => s.nombre === skill.nombre);
      if (!found?.id) return null;
      return {
        skill_id: found.id,
        puntos_asignados: (skill as any).puntos_asignados ?? (skill as any).nivel ?? 0
      };
    }).filter((ref): ref is { skill_id: string; puntos_asignados: number } => ref !== null);

    // CRÍTICO: Leer referencias del disco para evitar sobrescribir datos
    const personajeFromDisk = await WorkspaceService.loadPersonaje(personaje.id);
    const existingRefs = personajeFromDisk?.habilidades_refs || { activas: [], pasivas: [] };

    // Upsert por skill_id: si ya existe, se actualiza (nivel/modificadores), si no existe, se agrega.
    const activeById = new Map<string, { skill_id: string; modificadores_ids: string[]; nivel_actual?: number }>();
    existingRefs.activas.forEach(ref => activeById.set(ref.skill_id, ref));  // Referencias del DISCO
    newActiveRefs.forEach(ref => activeById.set(ref.skill_id, ref));

    const passiveById = new Map<string, { skill_id: string; puntos_asignados?: number }>();
    existingRefs.pasivas.forEach(ref => {
      const normalized = typeof ref === 'string' ? { skill_id: ref, puntos_asignados: undefined } : ref;
      passiveById.set(normalized.skill_id, normalized);
    });
    newPassiveRefs.forEach(ref => passiveById.set(ref.skill_id, ref));

    const updatedRefs = {
      activas: Array.from(activeById.values()),
      pasivas: Array.from(passiveById.values())
    };

    setSkillsRefs(updatedRefs);
    onChange(updatedRefs);
    
    // Recargar skills del héroe para actualizar la UI
    await loadHeroSkills();
  };

  const handleAddSkill = (skill: HabilidadActiva | HabilidadPasiva, type: 'activa' | 'pasiva') => {
    if (!skill.id) return;

    if (type === 'activa') {
      // Verificar si ya existe
      if (skillsRefs.activas.some(ref => ref.skill_id === skill.id)) {
        modal.showInfo('Esta habilidad ya está en tu personaje');
        return;
      }
      
      // Agregar skill sin modificadores inicialmente
      const updatedRefs = {
        ...skillsRefs,
        activas: [...skillsRefs.activas, { 
          skill_id: skill.id, 
          modificadores_ids: [],
          nivel_actual: (skill as HabilidadActiva).nivel ?? 1
        }]
      };
      setSkillsRefs(updatedRefs);
      onChange(updatedRefs);
    } else {
      // Verificar si ya existe (compatibilidad con formato viejo)
      const exists = skillsRefs.pasivas.some(ref => 
        typeof ref === 'string' ? ref === skill.id : ref.skill_id === skill.id
      );
      if (exists) {
        modal.showInfo('Esta habilidad ya está en tu personaje');
        return;
      }
      const updatedRefs = {
        ...skillsRefs,
        pasivas: [...skillsRefs.pasivas, { 
          skill_id: skill.id,
          puntos_asignados: (skill as HabilidadPasiva).nivel ?? 0
        }]
      };
      setSkillsRefs(updatedRefs);
      onChange(updatedRefs);
    }
    
    setShowAddModal(false);
    modal.showSuccess(`${skill.nombre} agregada`);
  };

  const handleRemoveSkill = (skillId: string, type: 'activa' | 'pasiva') => {
    if (type === 'activa') {
      const updatedRefs = {
        ...skillsRefs,
        activas: skillsRefs.activas.filter(ref => ref.skill_id !== skillId)
      };
      setSkillsRefs(updatedRefs);
      onChange(updatedRefs);
    } else {
      const updatedRefs = {
        ...skillsRefs,
        pasivas: skillsRefs.pasivas.filter(ref => 
          typeof ref === 'string' ? ref !== skillId : ref.skill_id !== skillId
        )
      };
      setSkillsRefs(updatedRefs);
      onChange(updatedRefs);
    }
  };

  // Toggle habilidad "en batalla" (barra de acciones)
  const handleToggleBattle = (skillId: string) => {
    const updatedRefs = {
      ...skillsRefs,
      activas: skillsRefs.activas.map(ref => 
        ref.skill_id === skillId 
          ? { ...ref, en_batalla: !ref.en_batalla }
          : ref
      )
    };
    setSkillsRefs(updatedRefs);
    onChange(updatedRefs);
  };

  // Gestión de modificadores
  const handleCopyPrompt = async () => {
    const count = parseInt(promptElementCount, 10);
    const prompt = ImageExtractionPromptService.withElementLimit(
      ImageExtractionPromptService.generateFullSkillsPrompt(),
      Number.isFinite(count) ? count : undefined,
      'habilidades'
    );
    const success = await ImageExtractionPromptService.copyToClipboard(prompt);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      modal.showError('Error al copiar al portapapeles');
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-d4-accent" />
          <span className="text-sm text-d4-text">
            Total: {activeSkillsData.length + passiveSkillsData.length}
          </span>
          <span className="text-xs text-d4-text-dim">|</span>
          <span className="text-sm text-d4-accent font-semibold">
            En Batalla: {skillsRefs.activas.filter(r => r.en_batalla).length}/6
          </span>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => { setModalType('activa'); setShowAddModal(true); }} 
            className="btn-secondary flex items-center gap-1 text-xs py-1 px-2"
          >
            <Plus className="w-3 h-3" />
            Activa
          </button>
          <button 
            onClick={() => { setModalType('pasiva'); setShowAddModal(true); }} 
            className="btn-secondary flex items-center gap-1 text-xs py-1 px-2"
          >
            <Plus className="w-3 h-3" />
            Pasiva
          </button>
          <button 
            onClick={() => setShowTextInput(!showTextInput)} 
            className="btn-secondary flex items-center gap-1 text-xs py-1 px-2"
          >
            <Upload className="w-3 h-3" />
            JSON
          </button>
          <label className="btn-secondary cursor-pointer flex items-center gap-1 text-xs py-1 px-2">
            <Upload className="w-3 h-3" />
            Archivo
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
              disabled={importing}
            />
          </label>
        </div>
      </div>

      {showTextInput && (
        <div className="bg-d4-bg p-3 rounded border border-d4-accent mb-3">
          <h4 className="font-bold text-d4-accent mb-2 text-sm">Pegar JSON de Habilidades</h4>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="input w-full font-mono text-xs mb-2"
            rows={6}
            placeholder='{"habilidades_activas": [...], "habilidades_pasivas": [...]}'
          />
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyPrompt}
                className="btn-secondary flex items-center gap-1 text-xs py-1 px-2"
                title="Copiar prompt para extraer datos de imágenes usando IA"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Prompt IA
                  </>
                )}
              </button>
              <input
                type="number"
                min="1"
                value={promptElementCount}
                onChange={(e) => setPromptElementCount(e.target.value)}
                className="input text-xs py-1 px-2 w-20"
                placeholder="#"
                title="Cantidad de elementos a extraer (opcional)"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowTextInput(false)} className="btn-secondary text-xs py-1 px-2">
                Cancelar
              </button>
              <button 
                onClick={handleImportFromText} 
                className="btn-primary text-xs py-1 px-2"
                disabled={importing || !jsonText.trim()}
              >
                {importing ? 'Importando...' : 'Importar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros y Ordenamiento */}
      {(activeSkillsData.length > 0 || passiveSkillsData.length > 0) && (
        <div className="bg-d4-bg/50 p-3 rounded border border-d4-border mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* Buscar por texto */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-d4-text-dim" />
              <input
                type="text"
                placeholder="Buscar habilidad..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="input w-full pl-8 text-xs"
              />
            </div>

            {/* Filtrar por tipo */}
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="input text-xs"
            >
              <option value="">Todos los tipos</option>
              {availableTypes.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>

            {/* Ordenar por */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input text-xs"
            >
              <option value="nombre">Ordenar: Nombre</option>
              <option value="tipo">Ordenar: Tipo</option>
              <option value="nivel">Ordenar: Nivel</option>
            </select>
          </div>
        </div>
      )}

      {/* Habilidades Activas */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-d4-accent mb-2 flex items-center gap-1.5">
          <Zap className="w-4 h-4" />
          Activas ({filteredAndSortedActives.length}{filterText || filterTipo ? ` de ${activeSkillsData.length}` : ''})
        </h4>
        {filteredAndSortedActives.length === 0 ? (
          <div className="text-center py-4 text-d4-text-dim bg-d4-bg/50 rounded">
            <p className="text-xs">
              {filterText || filterTipo ? 'No se encontraron habilidades con esos filtros' : 'No hay habilidades activas'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAndSortedActives.map((skill) => {
              const isExpanded = expandedSkills.has(skill.id!);
              // Obtener estado "en batalla" desde skillsRefs
              const skillRef = skillsRefs.activas.find(r => r.skill_id === skill.id);
              const enBatalla = skillRef?.en_batalla || false;
              // Obtener modificadores del personaje
              const modificadoresPersonaje = skill.modificadores || [];
              const hasModifiers = modificadoresPersonaje.length > 0;

              return (
                <div 
                  key={skill.id} 
                  className="bg-d4-bg rounded-lg border-2 border-d4-border hover:border-d4-accent/50 transition-all duration-200"
                >
                  {/* Header de la skill */}
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="checkbox"
                            checked={enBatalla}
                            onChange={() => handleToggleBattle(skill.id!)}
                            className="w-4 h-4 accent-d4-accent cursor-pointer flex-shrink-0"
                            title="Marcar como habilidad en batalla (barra de acciones, máx. 6)"
                          />
                          <h5 className="font-bold text-d4-accent text-base" title={skill.nombre}>
                            {skill.nombre}
                          </h5>
                          <span className="text-sm text-d4-text-dim">Nv. {skill.nivel}/{skill.nivel_maximo || 5}</span>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-600/50 font-semibold uppercase">
                            {skill.tipo}
                          </span>
                          {skill.rama && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800/60 text-gray-300 border border-gray-600/50 font-semibold uppercase">
                              {skill.rama}
                            </span>
                          )}
                          {skill.tipo_danio && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-900/60 text-red-200 border border-red-600/50 font-semibold uppercase">
                              {skill.tipo_danio}
                            </span>
                          )}
                          {skill.requiere && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-900/60 text-orange-200 border border-orange-600/50 font-semibold uppercase">
                              📋 {skill.requiere}
                            </span>
                          )}
                          {skill.genera_recurso && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-900/60 text-green-200 border border-green-600/50 font-semibold">
                              ⬆️ {skill.genera_recurso.tipo}: +{skill.genera_recurso.cantidad}
                            </span>
                          )}
                          {skill.costo_recurso && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-900/60 text-yellow-200 border border-yellow-600/50 font-semibold">
                              ⬇️ {skill.costo_recurso.tipo}: {skill.costo_recurso.cantidad}
                            </span>
                          )}
                          {skill.recuperacion_segundos && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-200 border border-cyan-600/50 font-semibold">
                              ⏱️ {skill.recuperacion_segundos}s
                            </span>
                          )}
                          {hasModifiers && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-600/50 font-semibold">
                              {modificadoresPersonaje.length} modificador{modificadoresPersonaje.length !== 1 ? 'es' : ''}
                            </span>
                          )}
                          {(skill as any).habilidades_pasivas && (skill as any).habilidades_pasivas.length > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-900/60 text-green-200 border border-green-600/50 font-semibold">
                              {(skill as any).habilidades_pasivas.length} pasiva{(skill as any).habilidades_pasivas.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {(hasModifiers || ((skill as any).habilidades_pasivas && (skill as any).habilidades_pasivas.length > 0)) && (
                          <button
                            onClick={() => toggleSkillExpanded(skill.id!)}
                            className="p-1 hover:bg-d4-accent/20 rounded transition-colors"
                            title={isExpanded ? 'Ocultar detalles' : 'Mostrar detalles'}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-d4-accent" /> : <ChevronDown className="w-4 h-4 text-d4-accent" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveSkill(skill.id!, 'activa')}
                          className="p-1 hover:bg-red-900/30 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>

                    {/* Descripción de la skill */}
                    <p className="text-sm text-d4-text leading-relaxed">
                      {skill.descripcion}
                    </p>

                    {/* Tags de la habilidad */}
                    {skill.tags && Array.isArray(skill.tags) && skill.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] text-d4-text-dim font-semibold">Tags:</span>
                        {skill.tags.map((tagItem, idx) => {
                          const tagId = typeof tagItem === 'string' ? tagItem : (tagItem as any).tag || (tagItem as any).id;
                          if (!tagId) return null;
                          return (
                            <TagBadge 
                              key={idx} 
                              tagId={tagId} 
                              iconSize={12} 
                              textSize="text-[10px]"
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Modificadores y Pasivas Relacionadas (colapsable) */}
                  {isExpanded && (
                    <div className="border-t border-d4-border/50 bg-d4-bg-secondary/30 p-3 space-y-3">
                      {/* Modificadores */}
                      <div>
                        <h6 className="text-xs font-semibold text-purple-400 mb-2 uppercase flex items-center gap-2">
                          <span>🔷 Modificadores</span>
                          <span className="text-[10px] text-d4-text-dim font-normal">(solo 1 activo)</span>
                        </h6>
                        {(() => {
                          // Mostrar TODOS los modificadores que tiene el personaje (todos activos)
                          const modificadoresPersonaje = skill.modificadores || [];

                          if (modificadoresPersonaje.length === 0) {
                            return (
                              <p className="text-xs text-d4-text-dim italic">
                                Esta habilidad no tiene modificadores
                              </p>
                            );
                          }

                          return (
                            <div className="space-y-2">
                              {modificadoresPersonaje.map((mod, idx) => (
                                <div 
                                  key={idx} 
                                  className="bg-purple-900/20 border border-purple-500/70 p-2 rounded"
                                >
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-sm text-purple-300 mb-1">
                                        {mod.nombre}
                                      </div>
                                      <p className="text-xs text-d4-text-dim leading-relaxed">
                                        {mod.descripcion}
                                      </p>
                                      {/* Tags del modificador */}
                                      {mod.tags && Array.isArray(mod.tags) && mod.tags.length > 0 && (
                                        <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                                          <span className="text-[9px] text-d4-text-dim font-semibold">Tags:</span>
                                          {mod.tags.map((tagItem, idx) => {
                                            const tagId = typeof tagItem === 'string' ? tagItem : (tagItem as any).tag || (tagItem as any).id;
                                            if (!tagId) return null;
                                            return (
                                              <TagBadge 
                                                key={idx} 
                                                tagId={tagId} 
                                                iconSize={10} 
                                                textSize="text-[9px]"
                                              />
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                      
                      {/* Pasivas Relacionadas */}
                      {(skill as any).habilidades_pasivas && (skill as any).habilidades_pasivas.length > 0 && (
                        <div>
                          <h6 className="text-xs font-semibold text-green-400 mb-2 uppercase flex items-center gap-2">
                            <span>🔸 Pasivas Relacionadas ({(skill as any).habilidades_pasivas.length})</span>
                          </h6>
                          <div className="space-y-2">
                            {(skill as any).habilidades_pasivas.map((pasiva: any, idx: number) => (
                              <div 
                                key={idx} 
                                className="bg-green-900/20 border border-green-500/70 p-2 rounded"
                              >
                                <div className="flex items-start gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="font-semibold text-sm text-green-300">
                                        {pasiva.nombre}
                                      </div>
                                      {pasiva.nivel && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800/60 text-gray-300">
                                          Nv. {pasiva.nivel}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-d4-text-dim leading-relaxed">
                                      {pasiva.efecto}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Habilidades Pasivas */}
      <div>
        <h4 className="text-sm font-semibold text-d4-accent mb-2 flex items-center gap-1.5">
          <Shield className="w-4 h-4" />
          Pasivas ({filteredAndSortedPassives.length}{filterText || filterTipo ? ` de ${passiveSkillsData.length}` : ''})
        </h4>
        {filteredAndSortedPassives.length === 0 ? (
          <div className="text-center py-4 text-d4-text-dim bg-d4-bg/50 rounded">
            <p className="text-xs">
              {filterText || filterTipo ? 'No se encontraron habilidades con esos filtros' : 'No hay habilidades pasivas'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredAndSortedPassives.map((skill) => (
              <div key={skill.id} className="bg-d4-bg p-3 rounded-lg border-2 border-d4-border hover:border-d4-accent/50 transition-all duration-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-bold text-d4-accent text-base" title={skill.nombre}>
                        {skill.nombre}
                      </h5>
                      {skill.nivel && (
                        <span className="text-sm text-d4-text-dim">Nv. {skill.nivel}/{skill.nivel_maximo || 3}</span>
                      )}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {skill.tipo && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800/60 text-gray-300 border border-gray-600/50 font-semibold uppercase">
                          {skill.tipo}
                        </span>
                      )}
                      {(skill as any).habilidad_activa_vinculada && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-600/50 font-semibold">
                          🔗 {(skill as any).habilidad_activa_vinculada}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveSkill(skill.id!, 'pasiva')}
                    className="p-1 hover:bg-red-900/30 rounded transition-colors flex-shrink-0"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
                <p className="text-sm text-d4-text leading-relaxed">
                  {skill.descripcion || skill.efecto}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
          <div className="card max-w-4xl w-full max-h-[80vh] overflow-y-auto animate-fade-in">
            <h3 className="text-lg font-bold text-d4-text mb-4">
              Seleccionar Habilidad {modalType === 'activa' ? 'Activa' : 'Pasiva'} del Héroe
            </h3>
            
            {!availableSkills || (modalType === 'activa' && availableSkills.habilidades_activas.length === 0) || 
             (modalType === 'pasiva' && availableSkills.habilidades_pasivas.length === 0) ? (
              <div className="text-center py-8 text-d4-text-dim">
                <p>No hay habilidades disponibles para esta clase</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                {modalType === 'activa' ? (
                  availableSkills.habilidades_activas.map((skill, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAddSkill(skill, 'activa')}
                      className="bg-d4-bg p-2 rounded border border-d4-border hover:border-d4-accent transition-colors text-left"
                      disabled={skillsRefs.activas.some(ref => ref.skill_id === (skill.id || ''))}
                    >
                      <h4 className="font-bold text-d4-accent text-xs">{skill.nombre}</h4>
                      <div className="flex gap-1 mt-1">
                        <span className="text-[10px] badge-raro px-1 py-0.5">{skill.tipo}</span>
                        <span className="text-[10px] badge-normal px-1 py-0.5">{skill.rama}</span>
                        <span className="text-[10px] badge-normal px-1 py-0.5">Nv. {skill.nivel}</span>
                      </div>
                      <p className="text-[10px] text-d4-text-dim mt-1 line-clamp-2">{skill.descripcion}</p>
                      {skillsRefs.activas.some(ref => ref.skill_id === (skill.id || '')) && (
                        <p className="text-[10px] text-d4-accent mt-1">✓ Ya equipada</p>
                      )}
                    </button>
                  ))
                ) : (
                  availableSkills.habilidades_pasivas.map((skill, idx) => {
                    const isEquipped = skillsRefs.pasivas.some(ref => 
                      (typeof ref === 'string' ? ref : ref.skill_id) === skill.id
                    );
                    return (
                      <button
                        key={idx}
                        onClick={() => handleAddSkill(skill, 'pasiva')}
                        className="bg-d4-bg p-2 rounded border border-d4-border hover:border-d4-accent transition-colors text-left"
                        disabled={isEquipped}
                      >
                        <h4 className="font-bold text-d4-accent text-xs">{skill.nombre}</h4>
                        {skill.nivel && (
                          <span className="text-[10px] badge-normal px-1 py-0.5 mt-0.5 inline-block">
                            Nv. {skill.nivel}
                          </span>
                        )}
                        <p className="text-[10px] text-d4-text-dim mt-1 line-clamp-2">{skill.efecto}</p>
                        {isEquipped && (
                          <p className="text-[10px] text-d4-accent mt-1">✓ Ya equipada</p>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary text-sm">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Modal {...modal} />
      
      {importSummary && (
        <ConfirmImportModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmAndApplyImport}
          summary={importSummary}
          type="habilidades"
        />
      )}
    </>
  );
};

export default CharacterSkills;
