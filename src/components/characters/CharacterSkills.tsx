import { useState, useEffect } from 'react';
import { Upload, Plus, Trash2, Zap, Shield, Copy, Check } from 'lucide-react';
import { Personaje, HabilidadActiva, HabilidadPasiva, HabilidadesPersonaje } from '../../types';
import { WorkspaceService } from '../../services/WorkspaceService';
import { ImageExtractionPromptService } from '../../services/ImageExtractionPromptService';

interface Props {
  personaje: Personaje;
  onChange: (skillsRefs: { activas: string[]; pasivas: string[] }) => void;
}

const CharacterSkills: React.FC<Props> = ({ personaje, onChange }) => {
  const [importing, setImporting] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<HabilidadesPersonaje | null>(null);
  const [activeSkillsData, setActiveSkillsData] = useState<HabilidadActiva[]>([]);
  const [passiveSkillsData, setPassiveSkillsData] = useState<HabilidadPasiva[]>([]);
  const [skillsRefs, setSkillsRefs] = useState<{ activas: string[]; pasivas: string[] }>(
    personaje.habilidades_refs || { activas: [], pasivas: [] }
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [modalType, setModalType] = useState<'activa' | 'pasiva'>('activa');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadHeroSkills();
  }, [personaje.clase]);

  useEffect(() => {
    loadCharacterSkillsData();
  }, [skillsRefs, availableSkills]);

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

    const activasData = skillsRefs.activas.map(id => {
      return availableSkills.habilidades_activas.find(s => s.id === id);
    }).filter(Boolean) as HabilidadActiva[];

    const pasivasData = skillsRefs.pasivas.map(id => {
      return availableSkills.habilidades_pasivas.find(s => s.id === id);
    }).filter(Boolean) as HabilidadPasiva[];

    setActiveSkillsData(activasData);
    setPassiveSkillsData(pasivasData);
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const content = await file.text();
      await processJSONImport(content);
    } catch (error) {
      console.error('Error importando habilidades:', error);
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
      console.error('Error importando habilidades:', error);
      alert('Error al procesar el JSON. Verifica el formato.');
    } finally {
      setImporting(false);
    }
  };

  const processJSONImport = async (content: string) => {
    const data = JSON.parse(content) as HabilidadesPersonaje;

    if (!data.habilidades_activas || !data.habilidades_pasivas) {
      alert('El archivo no tiene el formato correcto de habilidades');
      return;
    }

    // Primero sincronizar con el héroe
    const heroSkills = await WorkspaceService.loadHeroSkills(personaje.clase);
    const updatedHeroSkills: HabilidadesPersonaje = heroSkills || {
      habilidades_activas: [],
      habilidades_pasivas: []
    };

    // Agregar habilidades activas que no existan
    data.habilidades_activas.forEach(skill => {
      const exists = updatedHeroSkills.habilidades_activas.some(s => s.nombre === skill.nombre);
      if (!exists) {
        const skillWithId = {
          ...skill,
          id: skill.id || `skill_activa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        updatedHeroSkills.habilidades_activas.push(skillWithId);
      }
    });

    // Agregar habilidades pasivas que no existan
    data.habilidades_pasivas.forEach(skill => {
      const exists = updatedHeroSkills.habilidades_pasivas.some(s => s.nombre === skill.nombre);
      if (!exists) {
        const skillWithId = {
          ...skill,
          id: skill.id || `skill_pasiva_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        updatedHeroSkills.habilidades_pasivas.push(skillWithId);
      }
    });

    await WorkspaceService.saveHeroSkills(personaje.clase, updatedHeroSkills);
    setAvailableSkills(updatedHeroSkills);

    // Ahora agregar referencias al personaje
    const activasIds = data.habilidades_activas.map(skill => {
      const heroSkill = updatedHeroSkills.habilidades_activas.find(s => s.nombre === skill.nombre);
      return heroSkill?.id || skill.id || '';
    }).filter(Boolean);

    const pasivasIds = data.habilidades_pasivas.map(skill => {
      const heroSkill = updatedHeroSkills.habilidades_pasivas.find(s => s.nombre === skill.nombre);
      return heroSkill?.id || skill.id || '';
    }).filter(Boolean);

    const updatedRefs = {
      activas: [...skillsRefs.activas, ...activasIds],
      pasivas: [...skillsRefs.pasivas, ...pasivasIds]
    };
    
    setSkillsRefs(updatedRefs);
    onChange(updatedRefs);
    
    alert(`${activasIds.length} activas y ${pasivasIds.length} pasivas importadas`);
  };

  const handleAddSkill = (skill: HabilidadActiva | HabilidadPasiva, type: 'activa' | 'pasiva') => {
    if (!skill.id) return;

    if (type === 'activa') {
      if (skillsRefs.activas.includes(skill.id)) {
        alert('Esta habilidad ya está en tu personaje');
        return;
      }
      const updatedRefs = {
        ...skillsRefs,
        activas: [...skillsRefs.activas, skill.id]
      };
      setSkillsRefs(updatedRefs);
      onChange(updatedRefs);
    } else {
      if (skillsRefs.pasivas.includes(skill.id)) {
        alert('Esta habilidad ya está en tu personaje');
        return;
      }
      const updatedRefs = {
        ...skillsRefs,
        pasivas: [...skillsRefs.pasivas, skill.id]
      };
      setSkillsRefs(updatedRefs);
      onChange(updatedRefs);
    }
    
    setShowAddModal(false);
  };

  const handleRemoveSkill = (skillId: string, type: 'activa' | 'pasiva') => {
    if (type === 'activa') {
      const updatedRefs = {
        ...skillsRefs,
        activas: skillsRefs.activas.filter(id => id !== skillId)
      };
      setSkillsRefs(updatedRefs);
      onChange(updatedRefs);
    } else {
      const updatedRefs = {
        ...skillsRefs,
        pasivas: skillsRefs.pasivas.filter(id => id !== skillId)
      };
      setSkillsRefs(updatedRefs);
      onChange(updatedRefs);
    }
  };

  const handleCopyPrompt = async () => {
    const prompt = ImageExtractionPromptService.generateFullSkillsPrompt();
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
          <Zap className="w-5 h-5 text-d4-accent" />
          <span className="text-sm text-d4-text">
            Total: {activeSkillsData.length + passiveSkillsData.length}
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

      {/* Habilidades Activas */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-d4-accent mb-2 flex items-center gap-1.5">
          <Zap className="w-4 h-4" />
          Activas ({activeSkillsData.length})
        </h4>
        {activeSkillsData.length === 0 ? (
          <div className="text-center py-4 text-d4-text-dim bg-d4-bg/50 rounded">
            <p className="text-xs">No hay habilidades activas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {activeSkillsData.map((skill) => (
              <div key={skill.id} className="bg-d4-bg p-2 rounded border border-d4-border hover:border-d4-accent transition-colors">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-d4-accent text-xs truncate" title={skill.nombre}>
                      {skill.nombre}
                    </h5>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      <span className="text-[10px] badge-raro px-1 py-0.5">{skill.tipo}</span>
                      <span className="text-[10px] badge-normal px-1 py-0.5">{skill.rama}</span>
                      <span className="text-[10px] badge-normal px-1 py-0.5">Nv. {skill.nivel}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveSkill(skill.id!, 'activa')}
                    className="p-0.5 hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
                <p className="text-[10px] text-d4-text-dim mt-1.5 line-clamp-2">{skill.descripcion}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Habilidades Pasivas */}
      <div>
        <h4 className="text-sm font-semibold text-d4-accent mb-2 flex items-center gap-1.5">
          <Shield className="w-4 h-4" />
          Pasivas ({passiveSkillsData.length})
        </h4>
        {passiveSkillsData.length === 0 ? (
          <div className="text-center py-4 text-d4-text-dim bg-d4-bg/50 rounded">
            <p className="text-xs">No hay habilidades pasivas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {passiveSkillsData.map((skill) => (
              <div key={skill.id} className="bg-d4-bg p-2 rounded border border-d4-border hover:border-d4-accent transition-colors">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-d4-accent text-xs truncate" title={skill.nombre}>
                      {skill.nombre}
                    </h5>
                    {skill.nivel && (
                      <span className="text-[10px] badge-normal px-1 py-0.5 mt-0.5 inline-block">
                        Nv. {skill.nivel}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveSkill(skill.id!, 'pasiva')}
                    className="p-0.5 hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
                <p className="text-[10px] text-d4-text-dim mt-1.5 line-clamp-2">{skill.efecto}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
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
                      disabled={skillsRefs.activas.includes(skill.id || '')}
                    >
                      <h4 className="font-bold text-d4-accent text-xs">{skill.nombre}</h4>
                      <div className="flex gap-1 mt-1">
                        <span className="text-[10px] badge-raro px-1 py-0.5">{skill.tipo}</span>
                        <span className="text-[10px] badge-normal px-1 py-0.5">{skill.rama}</span>
                        <span className="text-[10px] badge-normal px-1 py-0.5">Nv. {skill.nivel}</span>
                      </div>
                      <p className="text-[10px] text-d4-text-dim mt-1 line-clamp-2">{skill.descripcion}</p>
                      {skillsRefs.activas.includes(skill.id || '') && (
                        <p className="text-[10px] text-d4-accent mt-1">✓ Ya equipada</p>
                      )}
                    </button>
                  ))
                ) : (
                  availableSkills.habilidades_pasivas.map((skill, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAddSkill(skill, 'pasiva')}
                      className="bg-d4-bg p-2 rounded border border-d4-border hover:border-d4-accent transition-colors text-left"
                      disabled={skillsRefs.pasivas.includes(skill.id || '')}
                    >
                      <h4 className="font-bold text-d4-accent text-xs">{skill.nombre}</h4>
                      {skill.nivel && (
                        <span className="text-[10px] badge-normal px-1 py-0.5 mt-0.5 inline-block">
                          Nv. {skill.nivel}
                        </span>
                      )}
                      <p className="text-[10px] text-d4-text-dim mt-1 line-clamp-2">{skill.efecto}</p>
                      {skillsRefs.pasivas.includes(skill.id || '') && (
                        <p className="text-[10px] text-d4-accent mt-1">✓ Ya equipada</p>
                      )}
                    </button>
                  ))
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
    </>
  );
};

export default CharacterSkills;
