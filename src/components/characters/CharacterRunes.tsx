import { useState, useEffect } from 'react';
import { Upload, Plus, Trash2, Sparkles, Copy, Check, X } from 'lucide-react';
import { Personaje, Runa } from '../../types';
import { WorkspaceService } from '../../services/WorkspaceService';
import { ImageExtractionPromptService } from '../../services/ImageExtractionPromptService';
import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';

interface Props {
  personaje: Personaje;
  onChange: (runasRefs: Array<{ runa_id: string; vinculada_a?: 'arma' | 'escudo' }>) => void;
}

const CharacterRunes: React.FC<Props> = ({ personaje, onChange }) => {
  const modal = useModal();
  const [importing, setImporting] = useState(false);
  const [availableRunes, setAvailableRunes] = useState<Runa[]>([]);
  const [characterRunesData, setCharacterRunesData] = useState<Runa[]>([]);
  const [runasRefs, setRunasRefs] = useState<Array<{ runa_id: string; vinculada_a?: 'arma' | 'escudo' }>>(
    personaje.runas_refs || []
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadHeroRunes();
  }, [personaje.clase]);

  useEffect(() => {
    loadCharacterRunesData();
  }, [runasRefs, availableRunes]);

  useEffect(() => {
    setRunasRefs(personaje.runas_refs || []);
  }, [personaje.id, personaje.runas_refs]);

  const loadHeroRunes = async () => {
    try {
      const heroRunes = await WorkspaceService.loadHeroRunes(personaje.clase);
      if (heroRunes) {
        setAvailableRunes(heroRunes.runas);
      }
    } catch (error) {
      console.error('Error cargando runas del héroe:', error);
    }
  };

  const loadCharacterRunesData = () => {
    const runesData = runasRefs.map(ref => {
      const rune = availableRunes.find(r => r.id === ref.runa_id);
      if (rune) {
        return { ...rune, vinculada_a: ref.vinculada_a };
      }
      return null;
    }).filter(Boolean) as Runa[];
    
    setCharacterRunesData(runesData);
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const content = await file.text();
      await processJSONImport(content);
    } catch (error) {
      console.error('Error importando runas:', error);
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
      console.error('Error importando runas:', error);
      modal.showError('Error al procesar el JSON. Verifica el formato.');
    } finally {
      setImporting(false);
    }
  };

  const processJSONImport = async (content: string) => {
    const data = JSON.parse(content);

    if (!data.runas || !Array.isArray(data.runas)) {
      throw new Error('Formato JSON inválido. Debe contener un array "runas".');
    }

    // Cargar runas del héroe desde el disco
    const personajeFromDisk = await WorkspaceService.loadPersonaje(personaje.id);
    const existingRefs = personajeFromDisk?.runas_refs || [];

    // Cargar catálogo del héroe
    const heroRunes = await WorkspaceService.loadHeroRunes(personaje.clase);
    
    // Procesar cada runa importada
    for (const runaData of data.runas) {
      // Verificar si la runa ya existe en el catálogo
      const existingRuneIndex = heroRunes.runas.findIndex(r => r.nombre === runaData.nombre);
      
      let runeId: string;
      if (existingRuneIndex >= 0) {
        // Actualizar runa existente
        runeId = heroRunes.runas[existingRuneIndex].id;
        heroRunes.runas[existingRuneIndex] = {
          ...heroRunes.runas[existingRuneIndex],
          ...runaData
        };
      } else {
        // Crear nueva runa
        runeId = runaData.id || `runa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        heroRunes.runas.push({ ...runaData, id: runeId });
      }

      // Agregar referencia si no existe (máximo 4 runas)
      if (!existingRefs.find(r => r.runa_id === runeId) && existingRefs.length < 4) {
        existingRefs.push({
          runa_id: runeId,
          vinculada_a: runaData.tipo === 'invocacion' ? 'arma' : undefined
        });
      }
    }

    // Guardar catálogo actualizado
    await WorkspaceService.saveHeroRunes(personaje.clase, heroRunes);

    // Actualizar referencias del personaje usando merge
    const updatedPersonaje = {
      ...personaje,
      runas_refs: existingRefs
    };
    await WorkspaceService.savePersonajeMerge(updatedPersonaje);

    // Actualizar estado local
    setRunasRefs(existingRefs);
    onChange(existingRefs);
    loadHeroRunes();
    modal.showSuccess(`${data.runas.length} runa(s) importada(s) correctamente`);
  };

  const handleAddRune = (runeId: string) => {
    if (runasRefs.length >= 4) {
      modal.showError('Máximo 4 runas equipadas (2 invocación, 2 ritual)');
      return;
    }

    const rune = availableRunes.find(r => r.id === runeId);
    if (!rune) return;

    // Contar runas por tipo
    const invocacionCount = runasRefs.filter(ref => {
      const r = availableRunes.find(ar => ar.id === ref.runa_id);
      return r?.tipo === 'invocacion';
    }).length;

    const ritualCount = runasRefs.filter(ref => {
      const r = availableRunes.find(ar => ar.id === ref.runa_id);
      return r?.tipo === 'ritual';
    }).length;

    // Validar límites por tipo
    if (rune.tipo === 'invocacion' && invocacionCount >= 2) {
      modal.showError('Máximo 2 runas de invocación');
      return;
    }

    if (rune.tipo === 'ritual' && ritualCount >= 2) {
      modal.showError('Máximo 2 runas de ritual');
      return;
    }

    const newRefs = [
      ...runasRefs,
      {
        runa_id: runeId,
        vinculada_a: rune.tipo === 'invocacion' ? 'arma' as const : undefined
      }
    ];

    setRunasRefs(newRefs);
    onChange(newRefs);
    setShowAddModal(false);
  };

  const handleRemoveRune = (runeId: string) => {
    const newRefs = runasRefs.filter(ref => ref.runa_id !== runeId);
    setRunasRefs(newRefs);
    onChange(newRefs);
  };

  const handleToggleWeapon = (runeId: string) => {
    const newRefs = runasRefs.map(ref => {
      if (ref.runa_id === runeId) {
        return {
          ...ref,
          vinculada_a: ref.vinculada_a === 'arma' ? 'escudo' as const : 'arma' as const
        };
      }
      return ref;
    });
    setRunasRefs(newRefs);
    onChange(newRefs);
  };

  const handleCopyPrompt = () => {
    const prompt = ImageExtractionPromptService.generateRunesPrompt();
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRarezaColor = (rareza: string) => {
    switch (rareza) {
      case 'legendario': return 'text-orange-400 border-orange-500/30';
      case 'raro': return 'text-yellow-400 border-yellow-500/30';
      case 'magico': return 'text-blue-400 border-blue-500/30';
      default: return 'text-gray-400 border-gray-500/30';
    }
  };

  const getTipoColor = (tipo: string) => {
    return tipo === 'invocacion' ? 'text-red-400' : 'text-purple-400';
  };

  const getTipoIcon = (tipo: string) => {
    return tipo === 'invocacion' ? '🔴' : '🟣';
  };

  return (
    <>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-d4-gold mb-1">
            Runas Equipadas ({runasRefs.length}/4)
          </h3>
          <p className="text-sm text-d4-text-dim">
            Máximo: 2 invocación, 2 ritual
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopyPrompt}
            className="btn-secondary flex items-center gap-2"
            title="Copiar prompt para IA"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado!' : 'Prompt IA'}
          </button>

          <label className="btn-secondary flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            Importar JSON
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
              disabled={importing}
            />
          </label>

          <button
            onClick={() => setShowTextInput(!showTextInput)}
            className="btn-secondary"
            title="Importar desde texto"
          >
            📝
          </button>

          {availableRunes.length > 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
              disabled={runasRefs.length >= 4}
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          )}
        </div>
      </div>

      {/* Importar desde texto */}
      {showTextInput && (
        <div className="mb-4 p-4 bg-d4-surface rounded border border-d4-border">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-d4-gold">Pegar JSON</h4>
            <button
              onClick={() => {
                setShowTextInput(false);
                setJsonText('');
              }}
              className="text-d4-text-dim hover:text-d4-text"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='{"runas": [...]}'
            className="input w-full h-32 font-mono text-xs"
          />
          <button
            onClick={handleImportFromText}
            className="btn-primary mt-2"
            disabled={importing || !jsonText.trim()}
          >
            {importing ? 'Importando...' : 'Importar'}
          </button>
        </div>
      )}

      {/* Grid de runas equipadas */}
      {characterRunesData.length === 0 ? (
        <div className="text-center text-d4-text-dim py-8 border border-dashed border-d4-border rounded">
          <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No hay runas equipadas</p>
          <p className="text-xs mt-1">Importa runas o agrégalas desde el catálogo</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {characterRunesData.map((rune: any) => {
            const ref = runasRefs.find(r => r.runa_id === rune.id);
            return (
              <div
                key={rune.id}
                className={`card border-2 ${getRarezaColor(rune.rareza)}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{getTipoIcon(rune.tipo)}</span>
                      <h4 className={`text-lg font-bold ${getRarezaColor(rune.rareza)}`}>
                        {rune.nombre}
                      </h4>
                    </div>
                    <p className={`text-sm font-semibold ${getTipoColor(rune.tipo)}`}>
                      Runa de {rune.tipo === 'invocacion' ? 'Invocación' : 'Ritual'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveRune(rune.id)}
                    className="text-red-400 hover:text-red-300"
                    title="Desequipar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Requerimiento/Obtención */}
                {rune.requerimiento && (
                  <div className="mb-3 p-2 bg-d4-surface/50 rounded border border-d4-border">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-d4-text-dim">
                        {rune.requerimiento.tipo === 'requiere' ? '🔸 Requiere:' : '🔹 Obtiene:'}
                      </span>
                      <span className="text-d4-gold font-semibold">
                        ofrenda de {rune.requerimiento.ofrenda}
                      </span>
                    </div>
                  </div>
                )}

                {/* Efecto */}
                <div className="mb-3">
                  <p className={`text-sm ${getTipoColor(rune.tipo)}`}>
                    {rune.efecto}
                  </p>
                </div>

                {/* Descripción */}
                {rune.descripcion && (
                  <p className="text-xs text-d4-text-dim italic mb-3">
                    {rune.descripcion}
                  </p>
                )}

                {/* Vinculación (solo para invocación) */}
                {rune.tipo === 'invocacion' && ref && (
                  <div className="mt-3 pt-3 border-t border-d4-border">
                    <p className="text-xs text-d4-text-dim mb-2">Vinculada a:</p>
                    <button
                      onClick={() => handleToggleWeapon(rune.id)}
                      className="btn-secondary text-xs w-full"
                    >
                      {ref.vinculada_a === 'arma' ? '⚔️ Arma Principal' : '🛡️ Escudo/Arma 2'}
                    </button>
                  </div>
                )}

                {/* Tags */}
                {rune.tags && rune.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {rune.tags.slice(0, 3).map((tag: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 bg-d4-surface/50 rounded text-xs text-d4-text-dim">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Agregar Runa */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
          <div className="card max-w-4xl w-full max-h-[80vh] overflow-y-auto animate-fade-in">
            <h3 className="text-lg font-bold text-d4-text mb-4">Agregar Runa del Catálogo</h3>
            
            <div className="space-y-3">
              {availableRunes.length === 0 ? (
                <p className="text-d4-text-dim text-center py-4">
                  No hay runas en el catálogo. Importa runas primero.
                </p>
              ) : (
                availableRunes.map((rune) => {
                  const isEquipped = runasRefs.find(r => r.runa_id === rune.id);
                  return (
                    <div
                      key={rune.id}
                      className={`p-3 border rounded ${getRarezaColor(rune.rareza)} ${
                        isEquipped ? 'opacity-50' : 'hover:bg-d4-surface/30 cursor-pointer'
                      }`}
                      onClick={() => !isEquipped && handleAddRune(rune.id)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span>{getTipoIcon(rune.tipo)}</span>
                        <span className="font-semibold">{rune.nombre}</span>
                        {isEquipped && <span className="text-xs text-green-400">(Equipada)</span>}
                      </div>
                      <p className={`text-xs ${getTipoColor(rune.tipo)}`}>
                        {rune.efecto}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end mt-4">
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

export default CharacterRunes;
