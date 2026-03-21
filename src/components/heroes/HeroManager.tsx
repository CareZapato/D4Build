import React, { useState, useEffect } from 'react';
import { Shield, Upload, Download, FileJson, Copy, Check, Database } from 'lucide-react';
import { WorkspaceService } from '../../services/WorkspaceService';
import { HabilidadesPersonaje, GlifosHeroe, AspectosHeroe } from '../../types';
import { ImageExtractionPromptService } from '../../services/ImageExtractionPromptService';
import HeroSkills from './HeroSkills';
import HeroGlyphs from './HeroGlyphs';
import HeroAspects from './HeroAspects';
import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';

const HeroManager: React.FC = () => {
  const modal = useModal();
  const [selectedClass, setSelectedClass] = useState('Paladín');
  const [currentView, setCurrentView] = useState<'import' | 'manage'>('import');
  const [importType, setImportType] = useState<'habilidades' | 'glifos' | 'aspectos'>('habilidades');
  const [importing, setImporting] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [copied, setCopied] = useState(false);

  // Estado para datos cargados
  const [heroSkills, setHeroSkills] = useState<HabilidadesPersonaje | null>(null);
  const [heroGlyphs, setHeroGlyphs] = useState<GlifosHeroe | null>(null);
  const [heroAspects, setHeroAspects] = useState<AspectosHeroe | null>(null);
  const [loading, setLoading] = useState(false);

  const clases = ['Paladín', 'Bárbaro', 'Hechicero', 'Pícaro', 'Druida', 'Nigromante', 'Espiritista'];

  // Cargar datos cuando cambia la clase o la vista
  useEffect(() => {
    if (currentView === 'manage') {
      loadHeroData();
    }
  }, [selectedClass, currentView]);

  const loadHeroData = async () => {
    setLoading(true);
    try {
      const [skills, glyphs, aspects] = await Promise.all([
        WorkspaceService.loadHeroSkills(selectedClass),
        WorkspaceService.loadHeroGlyphs(selectedClass),
        WorkspaceService.loadHeroAspects(selectedClass)
      ]);
      
      setHeroSkills(skills);
      setHeroGlyphs(glyphs);
      setHeroAspects(aspects);
    } catch (error) {
      console.error('Error cargando datos del héroe:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSkills = async (skills: HabilidadesPersonaje) => {
    await WorkspaceService.saveHeroSkills(selectedClass, skills);
    setHeroSkills(skills);
  };

  const handleUpdateGlyphs = async (glyphs: GlifosHeroe) => {
    await WorkspaceService.saveHeroGlyphs(selectedClass, glyphs);
    setHeroGlyphs(glyphs);
  };

  const handleUpdateAspects = async (aspects: AspectosHeroe) => {
    await WorkspaceService.saveHeroAspects(selectedClass, aspects);
    setHeroAspects(aspects);
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const content = await file.text();
      await processJSONImport(content);
    } catch (error) {
      console.error('Error importando JSON:', error);
      modal.showError('Error al importar el archivo JSON');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const handleImportFromText = async () => {
    if (!jsonText.trim()) {
      modal.showWarning('Por favor ingresa un JSON válido');
      return;
    }

    setImporting(true);
    try {
      await processJSONImport(jsonText);
      setJsonText('');
      setShowTextInput(false);
    } catch (error) {
      console.error('Error importando JSON:', error);
      modal.showError('Error al procesar el JSON. Verifica el formato.');
    } finally {
      setImporting(false);
    }
  };

  const processJSONImport = async (content: string) => {
    const data = JSON.parse(content);

    if (importType === 'habilidades') {
      // Validar que tenga la estructura correcta
      if (!data.habilidades_activas || !data.habilidades_pasivas) {
        modal.showError('El archivo no tiene el formato correcto de habilidades');
        return;
      }
      
      // Asignar IDs a habilidades que no los tengan
      const dataWithIds: HabilidadesPersonaje = {
        habilidades_activas: data.habilidades_activas.map((hab: any) => ({
          ...hab,
          id: hab.id || `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })),
        habilidades_pasivas: data.habilidades_pasivas.map((hab: any) => ({
          ...hab,
          id: hab.id || `passive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }))
      };
      
      await WorkspaceService.saveHeroSkills(selectedClass, dataWithIds);
      setHeroSkills(dataWithIds);
      modal.showSuccess(`Habilidades de ${selectedClass} importadas correctamente`);
    } else if (importType === 'glifos') {
      // Validar que tenga la estructura correcta
      if (!data.glifos) {
        modal.showError('El archivo no tiene el formato correcto de glifos');
        return;
      }
      
      // Asignar IDs a glifos que no los tengan
      const dataWithIds: GlifosHeroe = {
        glifos: data.glifos.map((glifo: any) => ({
          ...glifo,
          id: glifo.id || `glyph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }))
      };
      
      await WorkspaceService.saveHeroGlyphs(selectedClass, dataWithIds);
      setHeroGlyphs(dataWithIds);
      modal.showSuccess(`Glifos de ${selectedClass} importados correctamente`);
    } else if (importType === 'aspectos') {
      // Validar que tenga la estructura correcta
      if (!data.aspectos) {
        modal.showError('El archivo no tiene el formato correcto de aspectos');
        return;
      }
      await WorkspaceService.saveHeroAspects(selectedClass, data as AspectosHeroe);
      setHeroAspects(data as AspectosHeroe);
      modal.showSuccess(`Aspectos de ${selectedClass} importados correctamente`);
    }
  };

  const handleExportData = async () => {
    try {
      if (importType === 'habilidades') {
        const data = await WorkspaceService.loadHeroSkills(selectedClass);
        if (!data) {
          modal.showWarning('No hay datos de habilidades para exportar');
          return;
        }
        downloadJSON(data, `${selectedClass}_habilidades.json`);
      } else if (importType === 'glifos') {
        const data = await WorkspaceService.loadHeroGlyphs(selectedClass);
        if (!data) {
          modal.showWarning('No hay datos de glifos para exportar');
          return;
        }
        downloadJSON(data, `${selectedClass}_glifos.json`);
      } else if (importType === 'aspectos') {
        const data = await WorkspaceService.loadHeroAspects(selectedClass);
        if (!data) {
          modal.showWarning('No hay datos de aspectos para exportar');
          return;
        }
        downloadJSON(data, `${selectedClass}_aspectos.json`);
      }
    } catch (error) {
      console.error('Error exportando datos:', error);
      modal.showError('Error al exportar los datos');
    }
  };

  const downloadJSON = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyPrompt = async () => {
    let prompt = '';
    if (importType === 'habilidades') {
      prompt = ImageExtractionPromptService.generateFullSkillsPrompt();
    } else if (importType === 'glifos') {
      prompt = ImageExtractionPromptService.generateGlyphsPrompt();
    } else if (importType === 'aspectos') {
      prompt = ImageExtractionPromptService.generateAspectsPrompt();
    }

    const success = await ImageExtractionPromptService.copyToClipboard(prompt);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      modal.showError('Error al copiar al portapapeles');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-d4-text mb-2">Gestión de Héroes</h2>
        <p className="text-d4-text-dim">
          Importa y gestiona la información base de cada clase (habilidades, glifos, aspectos)
        </p>
      </div>

      {/* Class Selector */}
      <div className="card mb-6">
        <label className="block text-sm font-medium text-d4-text mb-2">
          Clase del Héroe
        </label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="input w-full max-w-md"
        >
          {clases.map(clase => (
            <option key={clase} value={clase}>{clase}</option>
          ))}
        </select>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setCurrentView('import')}
          className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
            currentView === 'import'
              ? 'bg-d4-accent text-black font-semibold'
              : 'bg-d4-surface text-d4-text hover:bg-d4-border'
          }`}
        >
          <Upload className="w-4 h-4" />
          Importar/Exportar
        </button>
        <button
          onClick={() => setCurrentView('manage')}
          className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
            currentView === 'manage'
              ? 'bg-d4-accent text-black font-semibold'
              : 'bg-d4-surface text-d4-text hover:bg-d4-border'
          }`}
        >
          <Database className="w-4 h-4" />
          Gestionar Datos
        </button>
      </div>

      {/* Import/Export View */}
      {currentView === 'import' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de Importación */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-d4-accent" />
              <h3 className="text-lg font-bold text-d4-text">Importar Datos</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-d4-text mb-2">
                  Tipo de Datos
                </label>
                <div className="flex gap-3 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importType"
                      value="habilidades"
                      checked={importType === 'habilidades'}
                      onChange={() => setImportType('habilidades')}
                      className="text-d4-accent"
                    />
                    <span className="text-d4-text">Habilidades</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importType"
                      value="glifos"
                      checked={importType === 'glifos'}
                      onChange={() => setImportType('glifos')}
                      className="text-d4-accent"
                    />
                    <span className="text-d4-text">Glifos</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importType"
                      value="aspectos"
                      checked={importType === 'aspectos'}
                      onChange={() => setImportType('aspectos')}
                      className="text-d4-accent"
                    />
                    <span className="text-d4-text">Aspectos</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-d4-border space-y-3">
                <label className="btn-primary w-full flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-5 h-5" />
                  {importing ? 'Importando...' : 'Subir archivo JSON'}
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
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <FileJson className="w-5 h-5" />
                  {showTextInput ? 'Ocultar' : 'Pegar'} JSON
                </button>

                {showTextInput && (
                  <div className="space-y-2">
                    <textarea
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      className="input w-full font-mono text-xs"
                      rows={10}
                      placeholder={`Pega aquí tu JSON de ${importType}...`}
                    />
                    <button
                      onClick={handleImportFromText}
                      className="btn-primary w-full"
                      disabled={importing || !jsonText.trim()}
                    >
                      {importing ? 'Importando...' : `Importar ${importType}`}
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleExportData}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Exportar {importType}
              </button>

              <div className="pt-4 border-t border-d4-border">
                <button
                  onClick={handleCopyPrompt}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copiar Prompt para IA
                    </>
                  )}
                </button>
                <p className="text-xs text-d4-text-dim mt-2 text-center">
                  Copia el prompt para extraer datos de imágenes usando IA
                </p>
              </div>
            </div>
          </div>

          {/* Panel de Información */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <FileJson className="w-6 h-6 text-d4-accent" />
              <h3 className="text-lg font-bold text-d4-text">Información</h3>
            </div>

            <div className="space-y-4 text-sm text-d4-text">
              <div>
                <h4 className="font-semibold text-d4-accent mb-2">¿Cómo funciona?</h4>
                <ol className="list-decimal list-inside space-y-2 text-d4-text-dim">
                  <li>Selecciona la clase del héroe</li>
                  <li>Elige el tipo de datos a importar</li>
                  <li>Sube el archivo JSON o pega el contenido</li>
                  <li>Los datos se guardarán en tu workspace</li>
                  <li>Ve a "Gestionar Datos" para editar</li>
                </ol>
              </div>

              <div className="pt-4 border-t border-d4-border">
                <h4 className="font-semibold text-d4-accent mb-2">Formato del JSON</h4>
                <p className="text-d4-text-dim mb-2">
                  {importType === 'habilidades' ? (
                    <>El archivo debe contener las propiedades:</>
                  ) : (
                    <>El archivo debe contener la propiedad:</>
                  )}
                </p>
                <ul className="list-disc list-inside space-y-1 text-d4-text-dim ml-4">
                  {importType === 'habilidades' ? (
                    <>
                      <li><code className="text-d4-accent">habilidades_activas</code></li>
                      <li><code className="text-d4-accent">habilidades_pasivas</code></li>
                    </>
                  ) : importType === 'glifos' ? (
                    <li><code className="text-d4-accent">glifos</code></li>
                  ) : (
                    <li><code className="text-d4-accent">aspectos</code></li>
                  )}
                </ul>
                {importType === 'aspectos' && (
                  <div className="mt-3 text-xs text-d4-text-dim bg-d4-bg/50 p-2 rounded">
                    <p className="font-semibold text-d4-accent mb-1">Categorías por color:</p>
                    <ul className="space-y-0.5">
                      <li>🔵 <strong>Azul</strong> = Defensivo</li>
                      <li>🔴 <strong>Rojo</strong> = Ofensivo</li>
                      <li>🟢 <strong>Verde</strong> = Recurso</li>
                      <li>🟣 <strong>Morado</strong> = Utilidad</li>
                      <li>🟡 <strong>Amarillo</strong> = Movilidad</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-d4-border bg-d4-bg p-3 rounded">
                <p className="text-xs text-d4-text-dim">
                  <strong>Nota:</strong> Los datos importados estarán disponibles para asignar
                  a tus personajes. Puedes editarlos individualmente en la vista "Gestionar Datos".
                </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Manage Data View */}
      {currentView === 'manage' && (
        <div>
          {loading ? (
            <div className="card text-center py-12">
              <p className="text-d4-text-dim">Cargando datos...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Data Type Tabs */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setImportType('habilidades')}
                  className={`px-4 py-2 rounded transition-colors ${
                    importType === 'habilidades'
                      ? 'bg-d4-accent text-black font-semibold'
                      : 'bg-d4-surface text-d4-text hover:bg-d4-border'
                  }`}
                >
                  Habilidades
                </button>
                <button
                  onClick={() => setImportType('glifos')}
                  className={`px-4 py-2 rounded transition-colors ${
                    importType === 'glifos'
                      ? 'bg-d4-accent text-black font-semibold'
                      : 'bg-d4-surface text-d4-text hover:bg-d4-border'
                  }`}
                >
                  Glifos
                </button>
                <button
                  onClick={() => setImportType('aspectos')}
                  className={`px-4 py-2 rounded transition-colors ${
                    importType === 'aspectos'
                      ? 'bg-d4-accent text-black font-semibold'
                      : 'bg-d4-surface text-d4-text hover:bg-d4-border'
                  }`}
                >
                  Aspectos
                </button>
              </div>

              {/* Render appropriate component */}
              {importType === 'habilidades' && heroSkills && (
                <HeroSkills
                  heroClass={selectedClass}
                  skills={heroSkills}
                  onUpdate={handleUpdateSkills}
                />
              )}

              {importType === 'glifos' && heroGlyphs && (
                <HeroGlyphs
                  heroClass={selectedClass}
                  glyphs={heroGlyphs}
                  onUpdate={handleUpdateGlyphs}
                />
              )}

              {importType === 'aspectos' && heroAspects && (
                <HeroAspects
                  heroClass={selectedClass}
                  aspects={heroAspects}
                  onUpdate={handleUpdateAspects}
                />
              )}

              {/* No data message */}
              {((importType === 'habilidades' && !heroSkills) ||
                (importType === 'glifos' && !heroGlyphs) ||
                (importType === 'aspectos' && !heroAspects)) && (
                <div className="card text-center py-12">
                  <p className="text-d4-text-dim mb-4">
                    No hay datos de {importType} para {selectedClass}
                  </p>
                  <button
                    onClick={() => setCurrentView('import')}
                    className="btn-primary"
                  >
                    Ir a Importar Datos
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <Modal {...modal} />
    </div>
  );
};

export default HeroManager;
