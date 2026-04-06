import { useState, useEffect } from 'react';
import { Upload, Plus, Trash2, Gem, Copy, Check } from 'lucide-react';
import { Personaje, Glifo, GlifosHeroe } from '../../types';
import { WorkspaceService } from '../../services/WorkspaceService';
import { TagLinkingService } from '../../services/TagLinkingService';
import { ImageExtractionPromptService } from '../../services/ImageExtractionPromptService';import { TagBadge } from '../tags/TagBadge';import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';

interface Props {
  personaje: Personaje;
  onChange: (glifosRefs: Array<{ id: string; nivel_actual: number; nivel_maximo?: number }>) => void;
}

const CharacterGlyphs: React.FC<Props> = ({ personaje, onChange }) => {
  const modal = useModal();
  const [importing, setImporting] = useState(false);
  const [availableGlyphs, setAvailableGlyphs] = useState<Glifo[]>([]);
  const [characterGlyphsData, setCharacterGlyphsData] = useState<Glifo[]>([]);
  const [glyphsRefs, setGlyphsRefs] = useState<Array<{ id: string; nivel_actual: number; nivel_maximo?: number }>>(
    personaje.glifos_refs || []
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [promptElementCount, setPromptElementCount] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadHeroGlyphs();
  }, [personaje.clase]);

  useEffect(() => {
    loadCharacterGlyphsData();
  }, [glyphsRefs, availableGlyphs]);

  const loadHeroGlyphs = async () => {
    try {
      const heroGlyphs = await WorkspaceService.loadHeroGlyphs(personaje.clase);
      if (heroGlyphs) {
        setAvailableGlyphs(heroGlyphs.glifos);
      }
    } catch (error) {
      console.error('Error cargando glifos del héroe:', error);
    }
  };

  const loadCharacterGlyphsData = () => {
    const glyphsData = glyphsRefs.map(ref => {
      const glyph = availableGlyphs.find(g => g.id === ref.id);
      if (glyph) {
        return { ...glyph, nivel_actual: ref.nivel_actual };
      }
      return null;
    }).filter(Boolean) as Glifo[];
    
    setCharacterGlyphsData(glyphsData);
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const content = await file.text();
      await processJSONImport(content);
    } catch (error) {
      console.error('Error importando glifos:', error);
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
      console.error('Error importando glifos:', error);
      modal.showError('Error al procesar el JSON. Verifica el formato.');
    } finally {
      setImporting(false);
    }
  };

  const processJSONImport = async (content: string) => {
    const data = JSON.parse(content);

    if (!data.glifos || !Array.isArray(data.glifos)) {
      modal.showError('El archivo no tiene el formato correcto de glifos');
      return;
    }

    // Procesar y vincular tags usando TagLinkingService
    const { linkedData, tagMap, tagsProcessed } = await TagLinkingService.processAndLinkAllTags(
      data,
      'glifo'
    );

    console.log(`${tagsProcessed} tags procesados y vinculados`);

    // Vincular tags en cada glifo
    const glifosConTags = linkedData.glifos.map((glifo: any) => 
      TagLinkingService.linkGlyphTags(glifo, tagMap)
    );

    // Primero sincronizar con el héroe (actualizar existentes o agregar nuevos)
    const heroGlyphs = await WorkspaceService.loadHeroGlyphs(personaje.clase);
    const updatedHeroGlyphs: GlifosHeroe = heroGlyphs || { glifos: [] };

    let actualizados = 0;
    let agregados = 0;

    // Normalizar estructura de glifos
    const normalizedGlyphs = glifosConTags.map((glyph: any) => {
      const normalized: any = { ...glyph };
      
      // Normalizar efecto_base: si es string, convertir a objeto
      if (typeof glyph.efecto_base === 'string') {
        normalized.efecto_base = { descripcion: glyph.efecto_base };
      }
      
      // Normalizar atributo_escalado: si tiene "cada" como número, mantenerlo
      if (glyph.atributo_escalado && !glyph.atributo_escalado.cada) {
        normalized.atributo_escalado = {
          ...glyph.atributo_escalado,
          cada: 5 // valor por defecto
        };
      }
      
      // Normalizar bonificacion_adicional
      if (glyph.bonificacion_adicional && typeof glyph.bonificacion_adicional === 'object') {
        // Si requisito es string, parsearlo
        if (typeof glyph.bonificacion_adicional.requisito === 'string') {
          // Intentar extraer valores del formato "15 / +40 de Fuerza"
          const match = glyph.bonificacion_adicional.requisito.match(/(\d+)\s*\/\s*\+(\d+)\s*de\s*(\w+)/);
          if (match) {
            normalized.bonificacion_adicional = {
              ...glyph.bonificacion_adicional,
              requisito: {
                atributo: match[3],
                valor_actual: parseInt(match[1]),
                valor_requerido: parseInt(match[2])
              }
            };
          } else {
            // Mantener como string si no coincide el patrón
            normalized.bonificacion_adicional = {
              descripcion: glyph.bonificacion_adicional.descripcion,
              requisito_texto: glyph.bonificacion_adicional.requisito
            };
          }
        }
      }
      
      return normalized;
    });

    normalizedGlyphs.forEach((glyph: any) => {
      const existingIndex = updatedHeroGlyphs.glifos.findIndex(g => g.nombre === glyph.nombre);
      
      if (existingIndex >= 0) {
        // Actualizar glifo existente, preservando su ID
        updatedHeroGlyphs.glifos[existingIndex] = {
          ...glyph,
          id: updatedHeroGlyphs.glifos[existingIndex].id
        };
        actualizados++;
      } else {
        // Agregar nuevo glifo con ID generado
        const glyphWithId = {
          ...glyph,
          id: glyph.id || `glifo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        updatedHeroGlyphs.glifos.push(glyphWithId);
        agregados++;
      }
    });

    await WorkspaceService.saveHeroGlyphs(personaje.clase, updatedHeroGlyphs);
    setAvailableGlyphs(updatedHeroGlyphs.glifos);

    // Ahora actualizar referencias del personaje (actualizar nivel o agregar nuevos)
    const updatedRefs = [...glyphsRefs];
    
    glifosConTags.forEach((glyph: any) => {
      const heroGlyph = updatedHeroGlyphs.glifos.find(g => g.nombre === glyph.nombre);
      if (!heroGlyph?.id) return;
      
      const existingRefIndex = updatedRefs.findIndex(ref => ref.id === heroGlyph.id);
      
      if (existingRefIndex >= 0) {
        // Actualizar nivel del glifo existente
        updatedRefs[existingRefIndex] = {
          ...updatedRefs[existingRefIndex],
          nivel_actual: glyph.nivel_actual || updatedRefs[existingRefIndex].nivel_actual
        };
      } else {
        // Agregar nueva referencia
        updatedRefs.push({
          id: heroGlyph.id,
          nivel_actual: glyph.nivel_actual || 1,
          nivel_maximo: 100
        });
      }
    });

    setGlyphsRefs(updatedRefs);
    onChange(updatedRefs);
    
    // Mensaje detallado
    const mensajes = [];
    if (actualizados > 0) mensajes.push(`${actualizados} actualizados`);
    if (agregados > 0) mensajes.push(`${agregados} nuevos`);
    
    modal.showSuccess(`Glifos procesados: ${mensajes.join(', ')}`);
  };

  const handleAddGlyph = (glyph: Glifo) => {
    if (!glyph.id) return;
    
    const exists = glyphsRefs.some(g => g.id === glyph.id);
    if (exists) {
      modal.showInfo('Este glifo ya está en tu personaje');
      return;
    }

    const newRefs = [...glyphsRefs, { id: glyph.id, nivel_actual: 1, nivel_maximo: 100 }];
    setGlyphsRefs(newRefs);
    onChange(newRefs);
    setShowAddModal(false);
    modal.showSuccess(`${glyph.nombre} agregado`);
  };

  const handleRemoveGlyph = (glyphId: string) => {
    const newRefs = glyphsRefs.filter(g => g.id !== glyphId);
    setGlyphsRefs(newRefs);
    onChange(newRefs);
  };

  const handleLevelChange = (glyphId: string, newLevel: number) => {
    const newRefs = glyphsRefs.map(g => 
      g.id === glyphId ? { ...g, nivel_actual: newLevel } : g
    );
    setGlyphsRefs(newRefs);
    onChange(newRefs);
  };

  const handleCopyPrompt = async () => {
    const count = parseInt(promptElementCount, 10);
    const prompt = ImageExtractionPromptService.withElementLimit(
      ImageExtractionPromptService.generateGlyphsPrompt(),
      Number.isFinite(count) ? count : undefined,
      'glifos'
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
          <Gem className="w-5 h-5 text-d4-accent" />
          <span className="text-sm text-d4-text">Total: {characterGlyphsData.length}</span>
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
          <h4 className="font-bold text-d4-accent mb-2 text-sm">Pegar JSON de Glifos</h4>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="input w-full font-mono text-xs mb-2"
            rows={6}
            placeholder='{"glifos": [{"nombre": "...", "rareza": "...", ...}]}'
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

      {characterGlyphsData.length === 0 ? (
        <div className="text-center py-6 text-d4-text-dim bg-d4-bg/50 rounded">
          <Gem className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">No hay glifos equipados</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {characterGlyphsData.map((glyph) => (
            <div key={glyph.id} className="bg-d4-bg p-3 rounded-lg border-2 border-d4-border hover:border-d4-accent transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-d4-accent text-base truncate mb-1" title={glyph.nombre}>
                    {glyph.nombre}
                  </h4>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded inline-block ${
                    glyph.rareza === 'Legendario' 
                      ? 'bg-orange-900/60 text-orange-200 border border-orange-600/50' 
                      : 'bg-blue-900/60 text-blue-200 border border-blue-600/50'
                  } font-semibold uppercase`}>
                    {glyph.rareza}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveGlyph(glyph.id!)}
                  className="p-1 hover:bg-red-900/30 rounded transition-colors flex-shrink-0"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>

              <div className="mt-2 mb-3">
                <label className="block text-xs text-d4-text-dim mb-1 font-semibold">Nivel</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={glyph.nivel_actual || 1}
                    onChange={(e) => handleLevelChange(glyph.id!, parseInt(e.target.value) || 1)}
                    className="input w-full text-sm py-1 px-2"
                    min="1"
                    max="100"
                  />
                  <span className="text-xs text-d4-text-dim flex-shrink-0 font-semibold">/ 100</span>
                </div>
              </div>

              {/* Efecto Base */}
              {glyph.efecto_base && (
                <div className="bg-d4-surface/50 p-2 rounded border border-d4-border/30 mb-2">
                  <p className="text-xs text-d4-text-dim font-semibold mb-1">Efecto Base:</p>
                  <p className="text-sm text-d4-text leading-relaxed">
                    {typeof glyph.efecto_base === 'string' 
                      ? glyph.efecto_base 
                      : (glyph.efecto_base as any).descripcion}
                  </p>
                </div>
              )}

              {/* Atributo Escalado */}
              {glyph.atributo_escalado && (
                <div className="bg-blue-900/30 p-2 rounded border border-blue-600/30 mb-2">
                  <p className="text-xs text-d4-text-dim font-semibold mb-1">Escalado:</p>
                  <p className="text-sm text-d4-text leading-relaxed">
                    <span className="text-d4-accent font-bold">{glyph.atributo_escalado.atributo}</span>
                    {glyph.atributo_escalado.cada && <span className="text-d4-text-dim"> cada {glyph.atributo_escalado.cada}</span>}
                    <br />
                    <span className="text-d4-text-dim">{glyph.atributo_escalado.bonificacion}</span>
                  </p>
                </div>
              )}

              {/* Bonificación Adicional */}
              {glyph.bonificacion_adicional && (
                <div className="bg-green-900/30 p-2 rounded border border-green-600/30 mb-2">
                  <p className="text-xs text-d4-text-dim font-semibold mb-1">
                    Bonificación Adicional:
                    {(glyph.bonificacion_adicional as any).requisito && (
                      <span className="ml-1 text-yellow-300">
                        {typeof (glyph.bonificacion_adicional as any).requisito === 'string'
                          ? ` (${(glyph.bonificacion_adicional as any).requisito})`
                          : (glyph.bonificacion_adicional as any).requisito.atributo
                            ? ` (${(glyph.bonificacion_adicional as any).requisito.atributo}: ${(glyph.bonificacion_adicional as any).requisito.valor_actual || 0} / +${(glyph.bonificacion_adicional as any).requisito.valor_requerido})`
                            : ''}
                      </span>
                    )}
                    {(glyph.bonificacion_adicional as any).requisito_texto && (
                      <span className="ml-1 text-yellow-300">
                        ({(glyph.bonificacion_adicional as any).requisito_texto})
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-green-200 leading-relaxed">
                    {glyph.bonificacion_adicional.descripcion}
                  </p>
                </div>
              )}

              {/* Bonificación Legendaria */}
              {glyph.bonificacion_legendaria && (
                <div className="bg-orange-900/30 p-2 rounded border border-orange-600/30 mb-2">
                  <p className="text-xs text-d4-text-dim font-semibold mb-1">Bonificación Legendaria:</p>
                  <p className="text-sm text-orange-200 leading-relaxed">
                    {glyph.bonificacion_legendaria.descripcion}
                  </p>
                  {glyph.bonificacion_legendaria.requiere_mejora && (
                    <p className="text-xs text-orange-300/70 mt-1">
                      {typeof glyph.bonificacion_legendaria.requiere_mejora === 'string'
                        ? glyph.bonificacion_legendaria.requiere_mejora
                        : `Requiere mejora: ${(glyph.bonificacion_legendaria.requiere_mejora as any).rareza}`}
                    </p>
                  )}
                </div>
              )}

              {/* Información adicional */}
              <div className="flex flex-wrap gap-2 text-xs text-d4-text-dim mt-2">
                {glyph.tamano_radio && (
                  <span className="bg-d4-surface px-2 py-0.5 rounded font-semibold">
                    Radio: {glyph.tamano_radio}
                  </span>
                )}
                {(glyph as any).nivel_requerido && (
                  <span className="bg-d4-surface px-2 py-0.5 rounded font-semibold">
                    Nv. Req: {(glyph as any).nivel_requerido}
                  </span>
                )}
                {(glyph as any).estado && (
                  <span className={`px-2 py-0.5 rounded font-semibold ${
                    (glyph as any).estado === 'Encontrado' 
                      ? 'bg-green-900/50 text-green-200' 
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {(glyph as any).estado}
                  </span>
                )}
              </div>

              {/* Tags del glifo */}
              {glyph.tags && Array.isArray(glyph.tags) && glyph.tags.length > 0 && (
                <div className="mt-3 pt-2 border-t border-d4-border/30">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-d4-text-dim font-semibold">Tags:</span>
                    {glyph.tags.map((tagItem, idx) => {
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
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-4xl w-full max-h-[80vh] overflow-y-auto animate-fade-in">
            <h3 className="text-lg font-bold text-d4-text mb-4">Seleccionar Glifo del Héroe</h3>
            
            {availableGlyphs.length === 0 ? (
              <div className="text-center py-8 text-d4-text-dim">
                <p>No hay glif os disponibles para esta clase</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {availableGlyphs.map((glyph, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAddGlyph(glyph)}
                    className="bg-d4-bg p-2 rounded border border-d4-border hover:border-d4-accent transition-colors text-left"
                    disabled={glyphsRefs.some(g => g.id === glyph.id)}
                  >
                    <h4 className="font-bold text-d4-accent text-xs truncate">{glyph.nombre}</h4>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                      glyph.rareza === 'Legendario' ? 'badge-legendario' : 'badge-raro'
                    }`}>
                      {glyph.rareza}
                    </span>
                    {glyph.atributo_escalado && (
                      <p className="text-[10px] text-d4-text-dim mt-1">
                        {glyph.atributo_escalado.atributo}: {glyph.atributo_escalado.bonificacion}
                      </p>
                    )}
                    {glyphsRefs.some(g => g.id === glyph.id) && (
                      <p className="text-[10px] text-d4-accent mt-1">✓ Ya equipado</p>
                    )}
                  </button>
                ))}
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

export default CharacterGlyphs;
