import { useState, useEffect } from 'react';
import { Upload, Plus, Trash2, Shield, Copy, Check } from 'lucide-react';
import { Personaje, Aspecto } from '../../types';
import { WorkspaceService } from '../../services/WorkspaceService';
import { TagLinkingService } from '../../services/TagLinkingService';
import { ImageExtractionPromptService } from '../../services/ImageExtractionPromptService';import { TagBadge } from '../tags/TagBadge';import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';

interface Props {
  personaje: Personaje;
  onChange: (aspectosRefs: Array<{ aspecto_id: string; nivel_actual: string; slot_equipado?: string; valores_actuales: Record<string, string> }>) => void;
}

const CharacterAspects: React.FC<Props> = ({ personaje, onChange }) => {
  const modal = useModal();
  const [importing, setImporting] = useState(false);
  const [availableAspects, setAvailableAspects] = useState<Aspecto[]>([]);
  const [characterAspectsData, setCharacterAspectsData] = useState<Array<Aspecto & { nivel_actual?: string; slot_equipado?: string; valores_actuales?: Record<string, string> }>>([]);
  const [aspectsRefs, setAspectsRefs] = useState<Array<{ aspecto_id: string; nivel_actual: string; slot_equipado?: string; valores_actuales: Record<string, string> }>>(
    personaje.aspectos_refs as any || []
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [promptElementCount, setPromptElementCount] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadHeroAspects();
  }, [personaje.clase]);

  useEffect(() => {
    loadCharacterAspectsData();
  }, [aspectsRefs, availableAspects]);

  useEffect(() => {
    setAspectsRefs((personaje.aspectos_refs as any) || []);
  }, [personaje.id, personaje.aspectos_refs]);

  const loadHeroAspects = async () => {
    try {
      const heroAspects = await WorkspaceService.loadHeroAspects(personaje.clase);
      if (heroAspects) {
        setAvailableAspects(heroAspects.aspectos);
      }
    } catch (error) {
      // No es crítico si no hay aspectos disponibles para esta clase
    }
  };

  const loadCharacterAspectsData = () => {
    const aspectsData = aspectsRefs.map(ref => {
      const aspect = availableAspects.find(a => a.id === ref.aspecto_id);
      if (aspect) {
        return {
          ...aspect,
          nivel_actual: ref.nivel_actual,
          slot_equipado: ref.slot_equipado,
          valores_actuales: ref.valores_actuales
        };
      }
      return null;
    }).filter(Boolean) as typeof characterAspectsData;
    
    setCharacterAspectsData(aspectsData);
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const content = await file.text();
      await processJSONImport(content);
    } catch (error) {
      console.error('Error importando aspectos:', error);
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
      await processJSONImport(jsonText);
      setJsonText('');
      setShowTextInput(false);
    } catch (error) {
      console.error('Error importando aspectos:', error);
      modal.showError('Error al procesar el JSON. Verifica el formato.');
    } finally {
      setImporting(false);
    }
  };

  const processJSONImport = async (content: string) => {
    const data = JSON.parse(content);

    if (!data.aspectos_equipados || !Array.isArray(data.aspectos_equipados)) {
      modal.showError('El archivo no tiene el formato correcto de aspectos equipados');
      return;
    }

    // 1) Procesar palabras_clave globales y construir mapa de tags
    const { tagMap, tagsProcessed } = await TagLinkingService.processAndLinkAllTags(
      { palabras_clave: Array.isArray(data.palabras_clave) ? data.palabras_clave : [] },
      'aspecto'
    );

    const normalizeAspectId = (raw: string): string => raw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/aspecto\s+(de|del|de\s+la)\s+/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    // 2) Upsert en héroe con datos completos
    const heroAspects = await WorkspaceService.loadHeroAspects(personaje.clase);
    const updatedHeroAspects: { aspectos: any[] } = heroAspects || { aspectos: [] };

    let agregados = 0;
    let actualizados = 0;

    const incomingAspects = (data.aspectos_equipados as any[]).map((aspectEquip: any) => {
      const fallbackId = aspectEquip.name
        ? `aspecto_${normalizeAspectId(aspectEquip.name)}`
        : undefined;
      const aspectoId = String(aspectEquip.aspecto_id || fallbackId || `aspecto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
      const linked = TagLinkingService.linkAspectTags(aspectEquip, tagMap);

      return {
        ...linked,
        aspecto_id: aspectoId,
        id: aspectoId,
        level: aspectEquip.nivel_actual || aspectEquip.level || '1/21'
      };
    });

    incomingAspects.forEach((aspectEquip: any) => {
      const existingIndex = updatedHeroAspects.aspectos.findIndex((a: any) => a.id === aspectEquip.id);
      const base = existingIndex >= 0 ? updatedHeroAspects.aspectos[existingIndex] : null;

      const mergedAspect = {
        ...(base || {}),
        id: aspectEquip.id,
        name: aspectEquip.name || base?.name || aspectEquip.shortName || aspectEquip.id,
        shortName: aspectEquip.shortName || base?.shortName || aspectEquip.name || aspectEquip.id,
        effect: aspectEquip.effect || base?.effect || '',
        level: aspectEquip.level || base?.level || '1/21',
        category: aspectEquip.category || base?.category || 'ofensivo',
        tags: Array.isArray(aspectEquip.tags) ? aspectEquip.tags : (base?.tags || []),
        detalles: Array.isArray(aspectEquip.detalles) ? aspectEquip.detalles : (base?.detalles || [])
      };

      if (existingIndex >= 0) {
        updatedHeroAspects.aspectos[existingIndex] = mergedAspect;
        actualizados++;
      } else {
        updatedHeroAspects.aspectos.push(mergedAspect);
        agregados++;
      }
    });

    await WorkspaceService.saveHeroAspects(personaje.clase, updatedHeroAspects as any);
    setAvailableAspects(updatedHeroAspects.aspectos as any);

    // 3) Upsert refs del personaje por aspecto_id
    const refsById = new Map<string, { aspecto_id: string; nivel_actual: string; slot_equipado?: string; valores_actuales: Record<string, string> }>();
    (aspectsRefs || []).forEach((ref: any) => {
      if (!ref) return;
      if (typeof ref === 'string') {
        refsById.set(ref, {
          aspecto_id: ref,
          nivel_actual: '1/21',
          valores_actuales: {}
        });
      } else if (ref.aspecto_id) {
        refsById.set(String(ref.aspecto_id), {
          aspecto_id: String(ref.aspecto_id),
          nivel_actual: ref.nivel_actual || '1/21',
          slot_equipado: ref.slot_equipado,
          valores_actuales: ref.valores_actuales || {}
        });
      }
    });

    incomingAspects.forEach((aspectEquip: any) => {
      refsById.set(String(aspectEquip.aspecto_id), {
        aspecto_id: String(aspectEquip.aspecto_id),
        nivel_actual: aspectEquip.nivel_actual || aspectEquip.level || '1/21',
        slot_equipado: aspectEquip.slot_equipado ?? undefined,
        valores_actuales: aspectEquip.valores_actuales || {}
      });
    });

    const updatedRefs = Array.from(refsById.values());
    setAspectsRefs(updatedRefs);
    onChange(updatedRefs);
    
    const mensajes = [];
    if (actualizados > 0) mensajes.push(`${actualizados} actualizados`);
    if (agregados > 0) mensajes.push(`${agregados} nuevos`);
    if (tagsProcessed > 0) mensajes.push(`${tagsProcessed} tags`);
    
    modal.showSuccess(`Aspectos procesados: ${mensajes.join(', ')}`);
  };

  const handleAddAspect = (aspect: Aspecto) => {
    if (!aspect.id) return;
    
    const exists = aspectsRefs.some(a => a.aspecto_id === aspect.id);
    if (exists) {
      modal.showInfo('Este aspecto ya está equipado en tu personaje');
      return;
    }

    const newRefs = [...aspectsRefs, {
      aspecto_id: aspect.id,
      nivel_actual: '1/21',
      slot_equipado: undefined,
      valores_actuales: {}
    }];
    setAspectsRefs(newRefs);
    onChange(newRefs);
    setShowAddModal(false);
    modal.showSuccess(`${aspect.name} agregado`);
  };

  const handleRemoveAspect = (aspectId: string) => {
    const newRefs = aspectsRefs.filter(a => a.aspecto_id !== aspectId);
    setAspectsRefs(newRefs);
    onChange(newRefs);
  };

  const handleLevelChange = (aspectId: string, newLevel: string) => {
    const newRefs = aspectsRefs.map(a => 
      a.aspecto_id === aspectId ? { ...a, nivel_actual: newLevel } : a
    );
    setAspectsRefs(newRefs);
    onChange(newRefs);
  };

  const handleSlotChange = (aspectId: string, newSlot: string) => {
    const newRefs = aspectsRefs.map(a => 
      a.aspecto_id === aspectId ? { ...a, slot_equipado: newSlot } : a
    );
    setAspectsRefs(newRefs);
    onChange(newRefs);
  };

  const handleCopyPrompt = async () => {
    const count = parseInt(promptElementCount, 10);
    const prompt = ImageExtractionPromptService.withElementLimit(
      ImageExtractionPromptService.generateCharacterAspectsPrompt(),
      Number.isFinite(count) ? count : undefined,
      'aspectos equipados'
    );
    const success = await ImageExtractionPromptService.copyToClipboard(prompt);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      modal.showError('Error al copiar al portapapeles');
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, { icon: JSX.Element; color: string }> = {
      ofensivo: { icon: <Shield className="w-4 h-4" />, color: 'text-red-400' },
      defensivo: { icon: <Shield className="w-4 h-4" />, color: 'text-blue-400' },
      recurso: { icon: <Shield className="w-4 h-4" />, color: 'text-green-400' },
      utilidad: { icon: <Shield className="w-4 h-4" />, color: 'text-purple-400' },
      movilidad: { icon: <Shield className="w-4 h-4" />, color: 'text-yellow-400' }
    };
    
    return icons[category?.toLowerCase()] || icons.ofensivo;
  };

  const getCategoryBadge = (category: string) => {
    const badges: Record<string, string> = {
      ofensivo: 'bg-red-900/60 text-red-200 border-red-600/50',
      defensivo: 'bg-blue-900/60 text-blue-200 border-blue-600/50',
      recurso: 'bg-green-900/60 text-green-200 border-green-600/50',
      utilidad: 'bg-purple-900/60 text-purple-200 border-purple-600/50',
      movilidad: 'bg-yellow-900/60 text-yellow-200 border-yellow-600/50'
    };
    
    return badges[category?.toLowerCase()] || badges.ofensivo;
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-d4-accent" />
          <span className="text-sm text-d4-text">Total: {characterAspectsData.length}</span>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => setShowAddModal(true)} 
            className="btn-secondary flex items-center gap-1 text-xs py-1 px-2"
          >
            <Plus className="w-3 h-3" />
            Desde Héroe
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
          <h4 className="font-bold text-d4-accent mb-2 text-sm">Pegar JSON de Aspectos Equipados</h4>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="input w-full font-mono text-xs mb-2"
            rows={6}
            placeholder='{"aspectos_equipados": [{"aspecto_id": "...", "nivel_actual": "5/21", ...}]}'
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

      {characterAspectsData.length === 0 ? (
        <div className="text-center py-6 text-d4-text-dim bg-d4-bg/50 rounded">
          <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">No hay aspectos equipados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {characterAspectsData.map((aspect) => {
            const categoryInfo = getCategoryIcon(aspect.category);
            return (
              <div key={aspect.id} className="bg-d4-bg p-3 rounded-lg border-2 border-d4-border hover:border-d4-accent transition-all duration-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      <span className={categoryInfo.color}>{categoryInfo.icon}</span>
                      <h4 className="font-bold text-d4-accent text-sm truncate" title={aspect.name}>
                        {aspect.shortName}
                      </h4>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded inline-block border ${getCategoryBadge(aspect.category)} font-semibold uppercase`}>
                      {aspect.category}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveAspect(aspect.id!)}
                    className="p-1 hover:bg-red-900/30 rounded transition-colors flex-shrink-0"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>

                <div className="space-y-2 mb-2">
                  <div>
                    <label className="block text-xs text-d4-text-dim mb-1 font-semibold">Nivel</label>
                    <input
                      type="text"
                      value={aspect.nivel_actual || '1/21'}
                      onChange={(e) => handleLevelChange(aspect.id!, e.target.value)}
                      className="input w-full text-sm py-1 px-2"
                      placeholder="5/21"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-d4-text-dim mb-1 font-semibold">Slot Equipado</label>
                    <select
                      value={aspect.slot_equipado || ''}
                      onChange={(e) => handleSlotChange(aspect.id!, e.target.value)}
                      className="input w-full text-sm py-1 px-2"
                    >
                      <option value="">Sin asignar</option>
                      <option value="Casco">Casco</option>
                      <option value="Pecho">Pecho</option>
                      <option value="Guantes">Guantes</option>
                      <option value="Pantalones">Pantalones</option>
                      <option value="Botas">Botas</option>
                      <option value="Amuleto">Amuleto</option>
                      <option value="Anillo 1">Anillo 1</option>
                      <option value="Anillo 2">Anillo 2</option>
                      <option value="Arma">Arma</option>
                      <option value="Arma Offhand">Arma Offhand</option>
                    </select>
                  </div>
                </div>

                {/* Efecto */}
                <div className="bg-d4-surface/50 p-2 rounded border border-d4-border/30 mb-2">
                  <p className="text-xs text-d4-text-dim font-semibold mb-1">Efecto:</p>
                  <p className="text-xs text-d4-text leading-relaxed">
                    {aspect.effect || 'Sin descripción'}
                  </p>
                </div>

                {/* Valores Actuales */}
                {aspect.valores_actuales && Object.keys(aspect.valores_actuales).length > 0 && (
                  <div className="bg-green-900/30 p-2 rounded border border-green-600/30">
                    <p className="text-xs text-d4-text-dim font-semibold mb-1">Valores Actuales:</p>
                    <div className="space-y-1">
                      {Object.entries(aspect.valores_actuales).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-d4-text-dim">{key.replace(/_/g, ' ')}:</span>
                          <span className="text-green-200 font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags del aspecto */}
                {aspect.tags && Array.isArray(aspect.tags) && aspect.tags.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-d4-border/30">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-d4-text-dim font-semibold">Tags:</span>
                      {aspect.tags.map((tagItem, idx) => {
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
          <div className="card max-w-4xl w-full max-h-[80vh] overflow-y-auto animate-fade-in">
            <h3 className="text-lg font-bold text-d4-text mb-4">Seleccionar Aspecto del Héroe</h3>
            
            {availableAspects.length === 0 ? (
              <div className="text-center py-8 text-d4-text-dim">
                <p>No hay aspectos disponibles para esta clase</p>
                <p className="text-xs mt-2">Importa aspectos desde la sección de Héroes primero</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {availableAspects.map((aspect, idx) => {
                  const categoryInfo = getCategoryIcon(aspect.category);
                  const isEquipped = aspectsRefs.some(a => a.aspecto_id === aspect.id);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAddAspect(aspect)}
                      className="bg-d4-bg p-2 rounded border border-d4-border hover:border-d4-accent transition-colors text-left"
                      disabled={isEquipped}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <span className={categoryInfo.color}>{categoryInfo.icon}</span>
                        <h4 className="font-bold text-d4-accent text-xs truncate">{aspect.shortName}</h4>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded inline-block ${getCategoryBadge(aspect.category)}`}>
                        {aspect.category}
                      </span>
                      <p className="text-[10px] text-d4-text-dim mt-1 line-clamp-2">
                        {aspect.effect}
                      </p>
                      {isEquipped && (
                        <p className="text-[10px] text-d4-accent mt-1">✓ Ya equipado</p>
                      )}
                    </button>
                  );
                })}
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
    </>
  );
};

export default CharacterAspects;
