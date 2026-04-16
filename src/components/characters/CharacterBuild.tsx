import { useState, useEffect } from 'react';
import { Upload, Shield, Copy, Check, X } from 'lucide-react';
import { Personaje, Build, PiezaEquipo } from '../../types';
import { WorkspaceService } from '../../services/WorkspaceService';
import { ImageExtractionPromptService } from '../../services/ImageExtractionPromptService';
import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';

interface Props {
  personaje: Personaje;
  onChange: (build: Build) => void;
}

const CharacterBuild: React.FC<Props> = ({ personaje, onChange }) => {
  const modal = useModal();
  const [importing, setImporting] = useState(false);
  const [build, setBuild] = useState<Build | null>(personaje.build || null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<PiezaEquipo | null>(null);

  useEffect(() => {
    setBuild(personaje.build || null);
  }, [personaje.id, personaje.build]);

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const content = await file.text();
      await processJSONImport(content);
    } catch (error) {
      console.error('Error importando build:', error);
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
      console.error('Error importando build:', error);
      modal.showError('Error al procesar el JSON. Verifica el formato.');
    } finally {
      setImporting(false);
    }
  };

  const processJSONImport = async (content: string) => {
    const data = JSON.parse(content);

    if (!data.build || !data.build.piezas) {
      throw new Error('Formato JSON inválido. Debe contener "build.piezas".');
    }

    const buildId = `build_${Date.now()}`;
    const newBuild: Build = {
      id: buildId,
      nombre: data.build.nombre || `Build ${new Date().toLocaleDateString()}`,
      fecha_creacion: new Date().toISOString(),
      piezas: {}
    };

    // Procesar cada pieza del array y asignarla al espacio correcto
    if (Array.isArray(data.build.piezas)) {
      for (const pieza of data.build.piezas) {
        if (pieza.espacio) {
          newBuild.piezas[pieza.espacio as keyof Build['piezas']] = pieza;
        }
      }
    } else {
      // Si ya viene como objeto con las claves correctas
      newBuild.piezas = data.build.piezas;
    }

    // Calcular poder total
    const poderTotal = Object.values(newBuild.piezas)
      .filter(Boolean)
      .reduce((sum, p) => sum + (p?.poder_objeto || 0), 0);
    newBuild.poder_total = poderTotal;

    // Guardar en el personaje usando merge
    const updatedPersonaje = {
      ...personaje,
      build: newBuild
    };
    await WorkspaceService.savePersonajeMerge(updatedPersonaje);

    setBuild(newBuild);
    onChange(newBuild);
    modal.showSuccess(`Build importada correctamente (${Object.keys(newBuild.piezas).length} piezas)`);
  };

  const handleCopyPrompt = () => {
    const prompt = ImageExtractionPromptService.generateEquipmentPrompt();
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRarezaColor = (rareza: string) => {
    switch (rareza) {
      case 'legendario': return 'border-orange-500/50 bg-orange-900/10';
      case 'raro': return 'border-yellow-500/50 bg-yellow-900/10';
      case 'magico': return 'border-blue-500/50 bg-blue-900/10';
      default: return 'border-gray-500/50 bg-gray-900/10';
    }
  };

  const getEspacioIcon = (espacio: string) => {
    const icons: Record<string, string> = {
      yelmo: '⛑️',
      peto: '🛡️',
      guantes: '🧤',
      pantalones: '👖',
      botas: '🥾',
      arma: '⚔️',
      escudo: '🛡️',
      amuleto: '📿',
      anillo1: '💍',
      anillo2: '💎'
    };
    return icons[espacio] || '📦';
  };

  const getEspacioNombre = (espacio: string) => {
    const nombres: Record<string, string> = {
      yelmo: 'Yelmo',
      peto: 'Peto',
      guantes: 'Guantes',
      pantalones: 'Pantalones',
      botas: 'Botas',
      arma: 'Arma',
      escudo: 'Escudo/Arma 2',
      amuleto: 'Amuleto',
      anillo1: 'Anillo 1',
      anillo2: 'Anillo 2'
    };
    return nombres[espacio] || espacio;
  };

  const piezasOrdenadas: Array<keyof Build['piezas']> = [
    'yelmo',
    'peto',
    'guantes',
    'pantalones',
    'botas',
    'arma',
    'escudo',
    'amuleto',
    'anillo1',
    'anillo2'
  ];

  return (
    <>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-d4-gold mb-1">
            Equipamiento / Build
          </h3>
          {build && (
            <div className="text-sm text-d4-text-dim">
              <span>{Object.values(build.piezas).filter(Boolean).length}/10 piezas</span>
              {build.poder_total && (
                <span className="ml-3">⚡ Poder: {build.poder_total}</span>
              )}
            </div>
          )}
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
            placeholder='{"build": {"piezas": [...]}}'
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

      {/* Grid de piezas */}
      {!build || Object.values(build.piezas).filter(Boolean).length === 0 ? (
        <div className="text-center text-d4-text-dim py-8 border border-dashed border-d4-border rounded">
          <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No hay equipamiento</p>
          <p className="text-xs mt-1">Importa tu build desde JSON usando capturas del juego</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {piezasOrdenadas.map((espacio) => {
            const pieza = build.piezas[espacio];

            if (!pieza) {
              return (
                <div
                  key={espacio}
                  className="card border border-dashed border-d4-border bg-d4-dark/50 opacity-50"
                >
                  <div className="flex items-center gap-2 text-d4-text-dim">
                    <span className="text-2xl">{getEspacioIcon(espacio)}</span>
                    <span className="text-sm">{getEspacioNombre(espacio)}</span>
                  </div>
                  <p className="text-xs text-d4-text-dim mt-2">Vacío</p>
                </div>
              );
            }

            return (
              <div
                key={espacio}
                className={`card border-2 cursor-pointer hover:border-d4-gold/50 transition-colors ${getRarezaColor(pieza.rareza)}`}
                onClick={() => setSelectedPiece(pieza)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getEspacioIcon(espacio)}</span>
                    <div>
                      <p className="text-xs text-d4-text-dim">{getEspacioNombre(espacio)}</p>
                      <h4 className="text-sm font-bold text-d4-gold leading-tight">
                        {pieza.nombre}
                      </h4>
                    </div>
                  </div>
                </div>

                {pieza.poder_objeto && (
                  <div className="flex gap-2 text-xs text-d4-text-dim mb-2">
                    <span>⚡ {pieza.poder_objeto}</span>
                    {pieza.armadura && <span>🛡️ {pieza.armadura}</span>}
                  </div>
                )}

                {/* Mostrar primeros 2 atributos */}
                {pieza.atributos && pieza.atributos.length > 0 && (
                  <div className="space-y-1">
                    {pieza.atributos.slice(0, 2).map((attr, idx) => (
                      <p key={idx} className="text-xs text-d4-text truncate">
                        {attr.texto}
                      </p>
                    ))}
                    {pieza.atributos.length > 2 && (
                      <p className="text-xs text-d4-text-dim">
                        +{pieza.atributos.length - 2} más...
                      </p>
                    )}
                  </div>
                )}

                {/* Efectos especiales */}
                {pieza.efectos_especiales && pieza.efectos_especiales.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-d4-border">
                    {pieza.efectos_especiales.slice(0, 1).map((efecto, idx) => (
                      <p key={idx} className="text-xs text-orange-400 truncate">
                        {efecto.nombre && `${efecto.nombre}: `}
                        {efecto.descripcion}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal detalles de pieza */}
      {selectedPiece && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-d4-text">{selectedPiece.nombre}</h3>
              <button
                onClick={() => setSelectedPiece(null)}
                className="p-1 hover:bg-d4-border/50 rounded transition-colors"
                title="Cerrar"
              >
                <X className="w-5 h-5 text-d4-text-dim" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <div>
                  <p className="text-d4-text-dim">Tipo</p>
                  <p className="text-d4-text">{selectedPiece.tipo}</p>
                </div>
                <div>
                  <p className="text-d4-text-dim">Rareza</p>
                  <p className="text-d4-gold capitalize">{selectedPiece.rareza}</p>
                </div>
                {selectedPiece.poder_objeto && (
                  <div>
                    <p className="text-d4-text-dim">Poder</p>
                    <p className="text-d4-text">⚡ {selectedPiece.poder_objeto}</p>
                  </div>
                )}
                {selectedPiece.armadura && (
                  <div>
                    <p className="text-d4-text-dim">Armadura</p>
                    <p className="text-d4-text">🛡️ {selectedPiece.armadura}</p>
                  </div>
                )}
              </div>

              {/* Atributos */}
              {selectedPiece.atributos && selectedPiece.atributos.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-d4-gold mb-2">Atributos</h4>
                  <div className="space-y-1">
                    {selectedPiece.atributos.map((attr, idx) => (
                      <p key={idx} className="text-sm text-d4-text">
                        {attr.texto}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Efectos especiales */}
              {selectedPiece.efectos_especiales && selectedPiece.efectos_especiales.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-d4-gold mb-2">Efectos Especiales</h4>
                  <div className="space-y-2">
                    {selectedPiece.efectos_especiales.map((efecto, idx) => (
                      <div key={idx} className="p-2 bg-d4-surface rounded border border-orange-500/30">
                        {efecto.nombre && (
                          <p className="text-sm font-semibold text-orange-400 mb-1">{efecto.nombre}</p>
                        )}
                        <p className="text-sm text-d4-text">{efecto.descripcion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Engarces */}
              {selectedPiece.engarces && selectedPiece.engarces.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-d4-gold mb-2">Engarces</h4>
                  <div className="flex gap-2">
                    {selectedPiece.engarces.map((engarce, idx) => (
                      <div key={idx} className="px-3 py-1 bg-d4-surface rounded border border-d4-border text-xs">
                        {engarce.tipo === 'vacio' ? '⚪ Vacío' : `💎 ${engarce.tipo}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Durabilidad y templados */}
              <div className="flex gap-4 text-xs text-d4-text-dim">
                {selectedPiece.durabilidad && (
                  <div>
                    Durabilidad: {selectedPiece.durabilidad.actual}/{selectedPiece.durabilidad.maxima}
                  </div>
                )}
                {selectedPiece.templados && (
                  <div>
                    Templados: {selectedPiece.templados.usados}/{selectedPiece.templados.maximos}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button onClick={() => setSelectedPiece(null)} className="btn-secondary text-sm">
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

export default CharacterBuild;
