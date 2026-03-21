import { useState, useEffect } from 'react';
import { Upload, Plus, Trash2, Gem, Copy, Check } from 'lucide-react';
import { Personaje, Glifo, GlifosHeroe } from '../../types';
import { WorkspaceService } from '../../services/WorkspaceService';
import { ImageExtractionPromptService } from '../../services/ImageExtractionPromptService';

interface Props {
  personaje: Personaje;
  onChange: (glifosRefs: Array<{ id: string; nivel_actual: number }>) => void;
}

const CharacterGlyphs: React.FC<Props> = ({ personaje, onChange }) => {
  const [importing, setImporting] = useState(false);
  const [availableGlyphs, setAvailableGlyphs] = useState<Glifo[]>([]);
  const [characterGlyphsData, setCharacterGlyphsData] = useState<Glifo[]>([]);
  const [glyphsRefs, setGlyphsRefs] = useState<Array<{ id: string; nivel_actual: number }>>(
    personaje.glifos_refs || []
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [jsonText, setJsonText] = useState('');
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
      alert('Error al importar el archivo JSON. Verifica el formato.');
    } finally {
      setImporting(false);
    }
  };

  const handleImportFromText = async () => {
    if (!jsonText.trim()) {
      alert('Por favor ingresa un JSON válido');
      return;
    }

    setImporting(true);
    try {
      await processJSONImport(jsonText);
      setJsonText('');
      setShowTextInput(false);
    } catch (error) {
      console.error('Error importando glifos:', error);
      alert('Error al procesar el JSON. Verifica el formato.');
    } finally {
      setImporting(false);
    }
  };

  const processJSONImport = async (content: string) => {
    const data = JSON.parse(content) as GlifosHeroe;

    if (!data.glifos || !Array.isArray(data.glifos)) {
      alert('El archivo no tiene el formato correcto de glifos');
      return;
    }

    // Primero sincronizar con el héroe
    const heroGlyphs = await WorkspaceService.loadHeroGlyphs(personaje.clase);
    const updatedHeroGlyphs: GlifosHeroe = heroGlyphs || { glifos: [] };

    data.glifos.forEach(glyph => {
      const exists = updatedHeroGlyphs.glifos.some(g => g.nombre === glyph.nombre);
      if (!exists) {
        const glyphWithId = {
          ...glyph,
          id: glyph.id || `glifo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        updatedHeroGlyphs.glifos.push(glyphWithId);
      }
    });

    await WorkspaceService.saveHeroGlyphs(personaje.clase, updatedHeroGlyphs);
    setAvailableGlyphs(updatedHeroGlyphs.glifos);

    // Ahora agregar referencias al personaje
    const newRefs = data.glifos.map(glyph => {
      const heroGlyph = updatedHeroGlyphs.glifos.find(g => g.nombre === glyph.nombre);
      return {
        id: heroGlyph?.id || glyph.id || `glifo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nivel_actual: glyph.nivel_actual || 1
      };
    });

    const updatedRefs = [...glyphsRefs, ...newRefs];
    setGlyphsRefs(updatedRefs);
    onChange(updatedRefs);
    
    alert(`${data.glifos.length} glifos importados correctamente`);
  };

  const handleAddGlyph = (glyph: Glifo) => {
    if (!glyph.id) return;
    
    const exists = glyphsRefs.some(g => g.id === glyph.id);
    if (exists) {
      alert('Este glifo ya está en tu personaje');
      return;
    }

    const newRefs = [...glyphsRefs, { id: glyph.id, nivel_actual: 1 }];
    setGlyphsRefs(newRefs);
    onChange(newRefs);
    setShowAddModal(false);
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
    const prompt = ImageExtractionPromptService.generateGlyphsPrompt();
    const success = await ImageExtractionPromptService.copyToClipboard(prompt);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      alert('Error al copiar al portapapeles');
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {characterGlyphsData.map((glyph) => (
            <div key={glyph.id} className="bg-d4-bg p-2 rounded border border-d4-border hover:border-d4-accent transition-colors">
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-d4-accent text-xs truncate" title={glyph.nombre}>
                    {glyph.nombre}
                  </h4>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                    glyph.rareza === 'Legendario' ? 'badge-legendario' : 'badge-raro'
                  }`}>
                    {glyph.rareza}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveGlyph(glyph.id!)}
                  className="p-0.5 hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
                  title="Eliminar"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
              </div>

              <div className="mt-1.5">
                <label className="block text-[10px] text-d4-text-dim mb-0.5">Nivel</label>
                <input
                  type="number"
                  value={glyph.nivel_actual || 1}
                  onChange={(e) => handleLevelChange(glyph.id!, parseInt(e.target.value) || 1)}
                  className="input w-full text-xs py-0.5 px-1.5"
                  min="1"
                  max="100"
                />
              </div>

              {glyph.atributo_escalado && (
                <div className="mt-1.5 pt-1.5 border-t border-d4-border/30">
                  <p className="text-[10px] text-d4-text-dim">
                    <span className="text-d4-accent font-medium">{glyph.atributo_escalado.atributo}</span>
                    <br />
                    {glyph.atributo_escalado.bonificacion}
                  </p>
                </div>
              )}

              {glyph.efecto_base && (
                <div className="mt-1.5 pt-1.5 border-t border-d4-border/30">
                  <p className="text-[10px] text-d4-text-dim">
                    {glyph.efecto_base.descripcion}
                  </p>
                </div>
              )}

              {glyph.tamano_radio && (
                <p className="text-[10px] text-d4-text-dim mt-1">
                  Radio: {glyph.tamano_radio}
                </p>
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
    </>
  );
};

export default CharacterGlyphs;
