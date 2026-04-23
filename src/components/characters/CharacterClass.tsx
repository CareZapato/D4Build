import { useState, useEffect } from 'react';
import { Upload, Shield, Copy, Check, ChevronDown, ChevronUp, BookOpen, Sparkles, Trash2, CheckCircle, Circle } from 'lucide-react';
import { Personaje, MecanicaClase, MecanicasClaseHeroe, MecanicaClaseReferencia } from '../../types';
import { WorkspaceService } from '../../services/WorkspaceService';
import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';

interface Props {
  personaje: Personaje;
  onChange: (mecanicasRefs: MecanicaClaseReferencia[]) => void;
}

const CharacterClass: React.FC<Props> = ({ personaje, onChange }) => {
  const modal = useModal();
  const [importing, setImporting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [availableMecanicas, setAvailableMecanicas] = useState<MecanicaClase[]>([]);
  const [mecanicasRefs, setMecanicasRefs] = useState<MecanicaClaseReferencia[]>(
    personaje.mecanicas_clase_refs || []
  );
  const [showTextInput, setShowTextInput] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadHeroMecanicas();
  }, [personaje.clase]);

  useEffect(() => {
    setMecanicasRefs(personaje.mecanicas_clase_refs || []);
  }, [personaje.id, personaje.mecanicas_clase_refs]);

  const loadHeroMecanicas = async () => {
    try {
      const heroMecanicas = await WorkspaceService.loadHeroClassMechanics(personaje.clase);
      if (heroMecanicas) {
        setAvailableMecanicas(heroMecanicas.mecanicas);
      }
    } catch (error) {
      console.error('Error cargando mecánicas del héroe:', error);
    }
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const content = await file.text();
      await processJSONImport(content);
    } catch (error) {
      console.error('Error importando mecánicas de clase:', error);
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
      console.error('Error importando mecánicas:', error);
      modal.showError('Error al procesar el JSON. Verifica el formato.');
    } finally {
      setImporting(false);
    }
  };

  const processJSONImport = async (content: string) => {
    const data = JSON.parse(content);

    if (!data.mecanica_clase) {
      modal.showError('El archivo no tiene el formato correcto de mecánica de clase');
      return;
    }

    const mecanica = data.mecanica_clase;

    // Generar ID único si no lo tiene
    if (!mecanica.id) {
      mecanica.id = `mecanica_${personaje.clase.toLowerCase()}_${Date.now()}`;
    }

    // Asegurar que tipo sea 'mecanica_clase'
    mecanica.tipo = 'mecanica_clase';
    mecanica.clase = personaje.clase;

    // Procesar selecciones para asegurar estructura correcta
    if (mecanica.selecciones && Array.isArray(mecanica.selecciones)) {
      mecanica.selecciones = mecanica.selecciones.map((sel: any) => ({
        id: sel.id || `sel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nombre: sel.nombre || '',
        categoria: sel.categoria || 'general',
        grupo: sel.grupo || 'principal',
        nivel: sel.nivel || 1,
        nivel_maximo: sel.nivel_maximo || 1,
        activo: sel.activo !== undefined ? sel.activo : true,
        efecto: sel.efecto || '',
        detalles: Array.isArray(sel.detalles) ? sel.detalles : [],
        tags: Array.isArray(sel.tags) ? sel.tags : []
      }));
    }

    // Sincronizar con héroe
    const heroMecanicas = await WorkspaceService.loadHeroClassMechanics(personaje.clase);
    const updatedHeroMecanicas: MecanicasClaseHeroe = heroMecanicas || { mecanicas: [] };

    // Buscar si ya existe una mecánica con el mismo nombre
    const existingIndex = updatedHeroMecanicas.mecanicas.findIndex(
      m => m.nombre === mecanica.nombre
    );

    if (existingIndex >= 0) {
      // Actualizar existente
      updatedHeroMecanicas.mecanicas[existingIndex] = mecanica;
      modal.showSuccess(`Mecánica "${mecanica.nombre}" actualizada`);
    } else {
      // Agregar nueva
      updatedHeroMecanicas.mecanicas.push(mecanica);
      modal.showSuccess(`Mecánica "${mecanica.nombre}" agregada`);
    }

    // Guardar en héroe
    await WorkspaceService.saveHeroClassMechanics(personaje.clase, updatedHeroMecanicas);

    // Actualizar estado local
    setAvailableMecanicas(updatedHeroMecanicas.mecanicas);

    // Agregar referencia al personaje si no existe
    const seleccionesActivas = mecanica.selecciones
      .filter((sel: any) => sel.activo)
      .map((sel: any) => sel.id);

    const newRef: MecanicaClaseReferencia = {
      id: mecanica.id,
      selecciones_activas: seleccionesActivas
    };

    const existingRefIndex = mecanicasRefs.findIndex(ref => ref.id === mecanica.id);
    let updatedRefs = [...mecanicasRefs];

    if (existingRefIndex >= 0) {
      updatedRefs[existingRefIndex] = newRef;
    } else {
      updatedRefs.push(newRef);
    }

    setMecanicasRefs(updatedRefs);
    onChange(updatedRefs);
  };

  const handleToggleSeleccion = (mecanicaId: string, seleccionId: string) => {
    const updatedRefs = mecanicasRefs.map(ref => {
      if (ref.id === mecanicaId) {
        const seleccionesActivas = ref.selecciones_activas.includes(seleccionId)
          ? ref.selecciones_activas.filter(id => id !== seleccionId)
          : [...ref.selecciones_activas, seleccionId];
        
        return { ...ref, selecciones_activas: seleccionesActivas };
      }
      return ref;
    });

    setMecanicasRefs(updatedRefs);
    onChange(updatedRefs);
  };

  const handleRemoveMecanica = (mecanicaId: string) => {
    const updatedRefs = mecanicasRefs.filter(ref => ref.id !== mecanicaId);
    setMecanicasRefs(updatedRefs);
    onChange(updatedRefs);
  };

  const handleCopyPrompt = () => {
    const prompt = `Extrae las mecánicas de clase de la imagen y devuelve un JSON con este formato exacto:

{
  "mecanica_clase": {
    "id": "mecanica_${personaje.clase.toLowerCase()}_[nombre_descriptivo]",
    "nombre": "[Nombre de la Mecánica]",
    "tipo": "mecanica_clase",
    "clase": "${personaje.clase}",
    "selecciones": [
      {
        "id": "[id_seleccion]",
        "nombre": "[Nombre]",
        "categoria": "[categoria]",
        "grupo": "[grupo]",
        "nivel": 1,
        "nivel_maximo": 1,
        "activo": true,
        "efecto": "[Descripción del efecto]",
        "detalles": ["[Detalle 1]", "[Detalle 2]"],
        "tags": ["[tag1]", "[tag2]"]
      }
    ]
  },
  "palabras_clave": [
    {
      "tag": "[tag_normalizado]",
      "texto_original": "[texto original]",
      "significado": "[Definición]",
      "categoria": "[categoria]",
      "fuente": "mecanica_clase"
    }
  ]
}

Extrae TODA la información visible sobre las mecánicas de clase del ${personaje.clase}.`;

    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Obtener datos completos de las mecánicas
  const characterMecanicas = mecanicasRefs.map(ref => {
    const mecanica = availableMecanicas.find(m => m.id === ref.id);
    if (!mecanica) return null;

    return {
      ...mecanica,
      selecciones: mecanica.selecciones.map(sel => ({
        ...sel,
        activo: ref.selecciones_activas.includes(sel.id)
      })),
      notas: ref.notas
    };
  }).filter(Boolean) as MecanicaClase[];

  return (
    <>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-d4-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-d4-accent/10">
            <Sparkles className="w-5 h-5 text-d4-accent" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-d4-text">Mecánicas de Clase</h3>
            <p className="text-xs text-d4-text-dim">
              {characterMecanicas.length === 0 
                ? 'No hay mecánicas configuradas'
                : `${characterMecanicas.length} ${characterMecanicas.length === 1 ? 'mecánica' : 'mecánicas'} • ${characterMecanicas.reduce((acc, m) => acc + m.selecciones.filter(s => s.activo).length, 0)} selecciones activas`
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyPrompt}
            className={`btn-secondary flex items-center gap-1 text-xs py-1 px-2 ${copied ? 'bg-emerald-500/20 text-emerald-400' : ''}`}
            title="Copiar prompt para IA"
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

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-secondary flex items-center gap-1 text-xs py-1 px-2"
            title={isExpanded ? 'Contraer' : 'Expandir'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Importación */}
          <div className="bg-d4-surface/50 border border-d4-border rounded-lg p-3">
            <div className="flex flex-wrap gap-2">
              <label className="btn-secondary cursor-pointer flex items-center gap-1 text-xs py-1 px-2">
                <Upload className="w-3 h-3" />
                Importar JSON
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportJSON}
                  disabled={importing}
                />
              </label>

              <button
                onClick={() => setShowTextInput(!showTextInput)}
                className="btn-secondary flex items-center gap-1 text-xs py-1 px-2"
              >
                <BookOpen className="w-3 h-3" />
                Pegar JSON
              </button>
            </div>
          </div>

          {showTextInput && (
            <div className="card p-4 space-y-3">
              <textarea
                className="input w-full h-32 font-mono text-xs"
                placeholder='{"mecanica_clase": {...}, "palabras_clave": [...]}'
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleImportFromText}
                  className="btn-primary text-xs py-1 px-2"
                  disabled={importing || !jsonText.trim()}
                >
                  {importing ? 'Importando...' : 'Importar'}
                </button>
                <button
                  onClick={() => {
                    setShowTextInput(false);
                    setJsonText('');
                  }}
                  className="btn-secondary text-xs py-1 px-2"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de mecánicas */}
          {characterMecanicas.length === 0 ? (
            <div className="text-center py-12 bg-d4-surface/30 rounded-lg border border-dashed border-d4-border">
              <div className="p-4 rounded-full bg-d4-surface inline-block mb-3">
                <Sparkles className="w-12 h-12 text-d4-text-dim opacity-50" />
              </div>
              <p className="text-d4-text font-medium mb-1">No hay mecánicas de clase configuradas</p>
              <p className="text-sm text-d4-text-dim">Importa datos desde JSON para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {characterMecanicas.map((mecanica) => {
                const ref = mecanicasRefs.find(r => r.id === mecanica.id);
                const seleccionesActivas = mecanica.selecciones.filter(s => s.activo).length;
                const totalSelecciones = mecanica.selecciones.length;
                
                return (
                  <div key={mecanica.id} className="card p-4 bg-gradient-to-br from-d4-surface to-d4-bg border-2 border-d4-accent/20 hover:border-d4-accent/40 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-d4-accent/10 mt-1">
                          <Shield className="w-5 h-5 text-d4-accent" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-d4-accent text-lg mb-1">{mecanica.nombre}</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs px-2 py-1 rounded bg-d4-bg border border-d4-border text-d4-text-dim">
                              {mecanica.clase}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-d4-accent/10 border border-d4-accent/30 text-d4-accent">
                              {seleccionesActivas}/{totalSelecciones} activas
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMecanica(mecanica.id)}
                        className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/10 rounded"
                        title="Eliminar mecánica"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {mecanica.selecciones.map((seleccion) => (
                        <div
                          key={seleccion.id}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            seleccion.activo
                              ? 'bg-d4-accent/10 border-d4-accent/40 shadow-md shadow-d4-accent/10'
                              : 'bg-d4-surface/50 border-d4-border hover:border-d4-border/60'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleToggleSeleccion(mecanica.id, seleccion.id)}
                              className="mt-1"
                            >
                              {seleccion.activo ? (
                                <CheckCircle className="w-5 h-5 text-d4-accent" />
                              ) : (
                                <Circle className="w-5 h-5 text-d4-text-dim" />
                              )}
                            </button>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 flex-wrap flex-1">
                                  <span className={`font-semibold ${seleccion.activo ? 'text-d4-accent' : 'text-d4-text-dim'}`}>
                                    {seleccion.nombre}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 rounded bg-d4-bg border border-d4-border text-d4-text-dim">
                                    {seleccion.categoria}
                                  </span>
                                </div>
                                <span className="text-xs text-d4-text-dim whitespace-nowrap bg-d4-bg px-2 py-1 rounded border border-d4-border">
                                  Nv {seleccion.nivel}/{seleccion.nivel_maximo}
                                </span>
                              </div>
                              
                              <p className={`text-sm mb-2 ${seleccion.activo ? 'text-d4-text' : 'text-d4-text-dim'}`}>
                                {seleccion.efecto}
                              </p>
                              
                              {seleccion.detalles.length > 0 && (
                                <ul className="text-xs text-d4-text-dim space-y-1 ml-4 list-disc mb-2">
                                  {seleccion.detalles.map((detalle, idx) => (
                                    <li key={idx}>{detalle}</li>
                                  ))}
                                </ul>
                              )}

                              {seleccion.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {seleccion.tags.map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-0.5 rounded bg-d4-bg/50 border border-d4-accent/20 text-d4-accent/80"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {ref?.notas && (
                      <div className="mt-3 p-3 bg-d4-bg/50 rounded-lg border border-d4-border">
                        <p className="text-xs text-d4-text-dim italic">📝 {ref.notas}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CharacterClass;
