import React, { useState, useEffect } from 'react';
import { Shield, Upload, Download, FileJson, Copy, Check, Database, Package } from 'lucide-react';
import { WorkspaceService } from '../../services/WorkspaceService';
import { TagService } from '../../services/TagService';
import { HabilidadesPersonaje, GlifosHeroe, AspectosHeroe, MecanicasClaseHeroe, Tag, RunasHeroe, GemasHeroe, CharmsHeroe, HoradricSealHeroe } from '../../types';
import { ImageExtractionPromptService } from '../../services/ImageExtractionPromptService';
import HeroSkills from './HeroSkills';
import HeroGlyphs from './HeroGlyphs';
import HeroAspects from './HeroAspects';
import HeroParagon from './HeroParagon';
import HeroRunes from './HeroRunes';
import HeroGems from './HeroGems';
import HeroClassMechanics from './HeroClassMechanics';
import HeroCharms from './HeroCharms';
import HeroHoradricSeal from './HeroHoradricSeal';
import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';
import { useAppContext } from '../../context/AppContext';

const HeroManager: React.FC = () => {
  const modal = useModal();
  const { personajes, availableClasses } = useAppContext();
  const [selectedClass, setSelectedClass] = useState('Paladín');
  const [currentView, setCurrentView] = useState<'import' | 'manage'>('manage');
  const [importType, setImportType] = useState<'habilidades' | 'glifos' | 'aspectos' | 'mecanicas' | 'paragon' | 'runas' | 'gemas' | 'talismanes'>('habilidades');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [copied, setCopied] = useState(false);

  // Estado para datos cargados
  const [heroSkills, setHeroSkills] = useState<HabilidadesPersonaje | null>(null);
  const [heroGlyphs, setHeroGlyphs] = useState<GlifosHeroe | null>(null);
  const [heroAspects, setHeroAspects] = useState<AspectosHeroe | null>(null);
  const [heroClassMechanics, setHeroClassMechanics] = useState<MecanicasClaseHeroe | null>(null);
  const [heroCharms, setHeroCharms] = useState<CharmsHeroe | null>(null);
  const [heroHoradricSeal, setHeroHoradricSeal] = useState<HoradricSealHeroe | null>(null);
  const [loading, setLoading] = useState(false);

  const clases = ['Paladín', 'Bárbaro', 'Hechicero', 'Pícaro', 'Druida', 'Nigromante', 'Espiritista', 'Conjurador'];

  // Cargar datos cuando cambia la clase o la vista
  useEffect(() => {
    if (currentView === 'manage') {
      loadHeroData();
    }
  }, [selectedClass, currentView]);

  const loadHeroData = async () => {
    setLoading(true);
    try {
      const [skills, glyphs, aspects, mechanics, charms, horadricSeal] = await Promise.all([
        WorkspaceService.loadHeroSkills(selectedClass),
        WorkspaceService.loadHeroGlyphs(selectedClass),
        WorkspaceService.loadHeroAspects(selectedClass),
        WorkspaceService.loadHeroClassMechanics(selectedClass),
        WorkspaceService.loadHeroCharms(selectedClass),
        WorkspaceService.loadHeroHoradricSeal(selectedClass)
      ]);
      
      setHeroSkills(skills);
      setHeroGlyphs(glyphs);
      setHeroAspects(aspects);
      setHeroClassMechanics(mechanics);
      setHeroCharms(charms);
      setHeroHoradricSeal(horadricSeal);
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

  const handleUpdateClassMechanics = async (mechanics: MecanicasClaseHeroe) => {
    await WorkspaceService.saveHeroClassMechanics(selectedClass, mechanics);
    setHeroClassMechanics(mechanics);
  };

  const handleUpdateCharms = async (charms: CharmsHeroe) => {
    await WorkspaceService.saveHeroCharms(selectedClass, charms);
    setHeroCharms(charms);
  };

  const handleUpdateHoradricSeal = async (seal: HoradricSealHeroe) => {
    await WorkspaceService.saveHeroHoradricSeal(selectedClass, seal);
    setHeroHoradricSeal(seal);
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

    // Procesar tags globalmente si existen
    let allTags: Tag[] = [];
    if (data.palabras_clave && Array.isArray(data.palabras_clave)) {
      allTags = data.palabras_clave;
    }

    // Recolectar tags de entidades individuales
    if (importType === 'habilidades') {
      [...(data.habilidades_activas || []), ...(data.habilidades_pasivas || [])].forEach((skill: any) => {
        if (skill.palabras_clave && Array.isArray(skill.palabras_clave)) {
          skill.palabras_clave.forEach((kw: any) => {
            if (typeof kw === 'object' && kw.tag) {
              allTags.push(kw);
            }
          });
        }
      });
    } else if (importType === 'glifos') {
      (data.glifos || []).forEach((glifo: any) => {
        if (glifo.palabras_clave && Array.isArray(glifo.palabras_clave)) {
          glifo.palabras_clave.forEach((kw: any) => {
            if (typeof kw === 'object' && kw.tag) {
              allTags.push(kw);
            }
          });
        }
      });
    } else if (importType === 'aspectos') {
      (data.aspectos || []).forEach((aspecto: any) => {
        if (aspecto.palabras_clave && Array.isArray(aspecto.palabras_clave)) {
          aspecto.palabras_clave.forEach((kw: any) => {
            if (typeof kw === 'object' && kw.tag) {
              allTags.push(kw);
            }
          });
        }
      });
    }

    // Guardar tags globalmente
    if (allTags.length > 0) {
      const origen = importType === 'habilidades' ? 'habilidad' :
                     importType === 'glifos' ? 'glifo' : 'aspecto';
      const tagIds = await TagService.processAndSaveTagsV2(allTags, origen as any);
      console.log(`${tagIds.length} tags guardados desde ${importType}`);
    }

    if (importType === 'habilidades') {
      // Validar que tenga la estructura correcta
      if (!data.habilidades_activas || !data.habilidades_pasivas) {
        modal.showError('El archivo no tiene el formato correcto de habilidades');
        return;
      }
      
      // Cargar datos existentes
      const existingSkills = await WorkspaceService.loadHeroSkills(selectedClass);
      const existing: HabilidadesPersonaje = existingSkills || {
        habilidades_activas: [],
        habilidades_pasivas: []
      };

      let activasActualizadas = 0;
      let activasAgregadas = 0;

      // Actualizar o agregar habilidades activas
      data.habilidades_activas.forEach((hab: any) => {
        const existingIndex = existing.habilidades_activas.findIndex(s => s.nombre === hab.nombre);
        if (existingIndex >= 0) {
          existing.habilidades_activas[existingIndex] = {
            ...hab,
            id: existing.habilidades_activas[existingIndex].id
          };
          activasActualizadas++;
        } else {
          existing.habilidades_activas.push({
            ...hab,
            id: hab.id || `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          });
          activasAgregadas++;
        }
      });

      let pasivasActualizadas = 0;
      let pasivasAgregadas = 0;

      // Actualizar o agregar habilidades pasivas
      data.habilidades_pasivas.forEach((hab: any) => {
        const existingIndex = existing.habilidades_pasivas.findIndex(s => s.nombre === hab.nombre);
        if (existingIndex >= 0) {
          existing.habilidades_pasivas[existingIndex] = {
            ...hab,
            id: existing.habilidades_pasivas[existingIndex].id
          };
          pasivasActualizadas++;
        } else {
          existing.habilidades_pasivas.push({
            ...hab,
            id: hab.id || `passive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          });
          pasivasAgregadas++;
        }
      });
      
      await WorkspaceService.saveHeroSkills(selectedClass, existing);
      setHeroSkills(existing);
      
      const mensajes: string[] = [];
      if (activasActualizadas > 0) mensajes.push(`${activasActualizadas} activas actualizadas`);
      if (activasAgregadas > 0) mensajes.push(`${activasAgregadas} activas nuevas`);
      if (pasivasActualizadas > 0) mensajes.push(`${pasivasActualizadas} pasivas actualizadas`);
      if (pasivasAgregadas > 0) mensajes.push(`${pasivasAgregadas} pasivas nuevas`);
      
      modal.showSuccess(`Habilidades ${selectedClass}: ${mensajes.join(', ')}`);
    } else if (importType === 'glifos') {
      // Validar que tenga la estructura correcta
      if (!data.glifos) {
        modal.showError('El archivo no tiene el formato correcto de glifos');
        return;
      }
      
      // Recolectar tags de glifos individuales si tienen tags
      data.glifos.forEach((glifo: any) => {
        if (glifo.tags && Array.isArray(glifo.tags)) {
          glifo.tags.forEach((tag: any) => {
            if (typeof tag === 'object' && tag.tag) {
              allTags.push(tag);
            }
          });
        }
      });
      
      // Cargar datos existentes
      const existingData = await WorkspaceService.loadHeroGlyphs(selectedClass);
      const existing: GlifosHeroe = existingData || { glifos: [] };

      let actualizados = 0;
      let agregados = 0;

      // Actualizar o agregar glifos
      data.glifos.forEach((glifo: any) => {
        const existingIndex = existing.glifos.findIndex(g => g.nombre === glifo.nombre);
        if (existingIndex >= 0) {
          existing.glifos[existingIndex] = {
            ...glifo,
            id: existing.glifos[existingIndex].id
          };
          actualizados++;
        } else {
          existing.glifos.push({
            ...glifo,
            id: glifo.id || `glyph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          });
          agregados++;
        }
      });
      
      await WorkspaceService.saveHeroGlyphs(selectedClass, existing);
      setHeroGlyphs(existing);
      
      const mensajes: string[] = [];
      if (actualizados > 0) mensajes.push(`${actualizados} actualizados`);
      if (agregados > 0) mensajes.push(`${agregados} nuevos`);
      
      modal.showSuccess(`Glifos ${selectedClass}: ${mensajes.join(', ')}`);
    } else if (importType === 'aspectos') {
      // Validar que tenga la estructura correcta
      if (!data.aspectos) {
        modal.showError('El archivo no tiene el formato correcto de aspectos');
        return;
      }

      // Recolectar tags de aspectos individuales si tienen tags
      data.aspectos.forEach((aspecto: any) => {
        if (aspecto.tags && Array.isArray(aspecto.tags)) {
          aspecto.tags.forEach((tag: any) => {
            if (typeof tag === 'object' && tag.tag) {
              allTags.push(tag);
            }
          });
        }
      });

      // Cargar datos existentes
      const existingData = await WorkspaceService.loadHeroAspects(selectedClass);
      const existing: AspectosHeroe = existingData || { aspectos: [] };

      let actualizados = 0;
      let agregados = 0;

      // Actualizar o agregar aspectos
      data.aspectos.forEach((aspecto: any) => {
        const existingIndex = existing.aspectos.findIndex(a => a.name === aspecto.name);
        if (existingIndex >= 0) {
          existing.aspectos[existingIndex] = {
            ...aspecto,
            id: existing.aspectos[existingIndex].id
          };
          actualizados++;
        } else {
          existing.aspectos.push({
            ...aspecto,
            id: aspecto.id || `aspect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          });
          agregados++;
        }
      });

      await WorkspaceService.saveHeroAspects(selectedClass, existing);
      setHeroAspects(existing);
      
      const mensajes: string[] = [];
      if (actualizados > 0) mensajes.push(`${actualizados} actualizados`);
      if (agregados > 0) mensajes.push(`${agregados} nuevos`);
      
      modal.showSuccess(`Aspectos ${selectedClass}: ${mensajes.join(', ')}`);
    } else if (importType === 'mecanicas') {
      // Validar que tenga la estructura correcta
      if (!data.mecanica_clase) {
        modal.showError('El archivo no tiene el formato correcto de mecánica de clase');
        return;
      }

      const mecanica = data.mecanica_clase;

      // Generar ID único si no lo tiene
      if (!mecanica.id) {
        mecanica.id = `mecanica_${selectedClass.toLowerCase()}_${Date.now()}`;
      }

      // Asegurar que tipo sea 'mecanica_clase' y clase sea la correcta
      mecanica.tipo = 'mecanica_clase';
      mecanica.clase = selectedClass;

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

      // Cargar datos existentes
      const existingData = await WorkspaceService.loadHeroClassMechanics(selectedClass);
      const existing: MecanicasClaseHeroe = existingData || { mecanicas: [] };

      // Buscar si ya existe una mecánica con el mismo nombre
      const existingIndex = existing.mecanicas.findIndex(m => m.nombre === mecanica.nombre);

      if (existingIndex >= 0) {
        // Actualizar existente
        existing.mecanicas[existingIndex] = mecanica;
        await WorkspaceService.saveHeroClassMechanics(selectedClass, existing);
        modal.showSuccess(`Mecánica "${mecanica.nombre}" actualizada`);
      } else {
        // Agregar nueva
        existing.mecanicas.push(mecanica);
        await WorkspaceService.saveHeroClassMechanics(selectedClass, existing);
        modal.showSuccess(`Mecánica "${mecanica.nombre}" agregada`);
      }
    } else if (importType === 'runas') {
      if (!data.runas) {
        modal.showError('El archivo no tiene el formato correcto de runas');
        return;
      }

      const existingData = await WorkspaceService.loadHeroRunes(selectedClass);
      const existing: RunasHeroe = existingData || { runas: [] };

      let actualizados = 0;
      let agregados = 0;

      data.runas.forEach((runa: any) => {
        const existingIndex = existing.runas.findIndex(r => r.nombre === runa.nombre);
        if (existingIndex >= 0) {
          existing.runas[existingIndex] = { ...runa, id: existing.runas[existingIndex].id };
          actualizados++;
        } else {
          existing.runas.push({
            ...runa,
            id: runa.id || `runa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          });
          agregados++;
        }
      });

      await WorkspaceService.saveHeroRunes(selectedClass, existing);

      const mensajesR: string[] = [];
      if (actualizados > 0) mensajesR.push(`${actualizados} actualizadas`);
      if (agregados > 0) mensajesR.push(`${agregados} nuevas`);

      modal.showSuccess(`Runas ${selectedClass}: ${mensajesR.join(', ')}`);
    } else if (importType === 'gemas') {
      if (!data.gemas) {
        modal.showError('El archivo no tiene el formato correcto de gemas');
        return;
      }

      const existingData = await WorkspaceService.loadHeroGems(selectedClass);
      const existing: GemasHeroe = existingData || { gemas: [] };

      let actualizados = 0;
      let agregados = 0;

      data.gemas.forEach((gema: any) => {
        const existingIndex = existing.gemas.findIndex(g => g.nombre === gema.nombre);
        if (existingIndex >= 0) {
          existing.gemas[existingIndex] = { ...gema, id: existing.gemas[existingIndex].id };
          actualizados++;
        } else {
          existing.gemas.push({
            ...gema,
            id: gema.id || `gema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          });
          agregados++;
        }
      });

      await WorkspaceService.saveHeroGems(selectedClass, existing);

      const mensajesG: string[] = [];
      if (actualizados > 0) mensajesG.push(`${actualizados} actualizadas`);
      if (agregados > 0) mensajesG.push(`${agregados} nuevas`);

      modal.showSuccess(`Gemas ${selectedClass}: ${mensajesG.join(', ')}`);
    } else if (importType === 'talismanes') {
      // Detectar si es Charms o Sello Horádrico
      if (data.talismanes && Array.isArray(data.talismanes)) {
        // Importar Charms
        const existingData = await WorkspaceService.loadHeroCharms(selectedClass);
        const existing: CharmsHeroe = existingData || { talismanes: [] };

        let actualizados = 0;
        let agregados = 0;

        data.talismanes.forEach((charm: any) => {
          const existingIndex = existing.talismanes.findIndex((c: any) => c.nombre === charm.nombre);
          if (existingIndex >= 0) {
            existing.talismanes[existingIndex] = { ...charm, id: existing.talismanes[existingIndex].id };
            actualizados++;
          } else {
            existing.talismanes.push({
              ...charm,
              id: charm.id || `charm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            });
            agregados++;
          }
        });

        await WorkspaceService.saveHeroCharms(selectedClass, existing);
        setHeroCharms(existing);

        const mensajes: string[] = [];
        if (actualizados > 0) mensajes.push(`${actualizados} actualizados`);
        if (agregados > 0) mensajes.push(`${agregados} nuevos`);

        modal.showSuccess(`Talismanes ${selectedClass}: ${mensajes.join(', ')}`);
      } else if (data.horadric_seal || data.sello_horadrico) {
        // Importar Sello Horádrico
        const seal = data.horadric_seal || data.sello_horadrico;
        
        if (!seal.id) {
          seal.id = `seal-${Date.now()}`;
        }

        const sealData: HoradricSealHeroe = { sello: seal };
        await WorkspaceService.saveHeroHoradricSeal(selectedClass, sealData);
        setHeroHoradricSeal(sealData);

        modal.showSuccess(`Sello Horádrico "${seal.nombre}" importado`);
      } else {
        modal.showError('El archivo no tiene el formato correcto de talismanes o sello horádrico');
      }
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
      } else if (importType === 'talismanes') {
        // Exportar tanto charms como sello horádrico
        const charms = await WorkspaceService.loadHeroCharms(selectedClass);
        const seal = await WorkspaceService.loadHeroHoradricSeal(selectedClass);
        
        if (!charms && !seal) {
          modal.showWarning('No hay datos de talismanes para exportar');
          return;
        }

        if (charms && charms.talismanes.length > 0) {
          downloadJSON(charms, `${selectedClass}_talismanes.json`);
        }
        if (seal && seal.sello) {
          downloadJSON({ horadric_seal: seal.sello }, `${selectedClass}_sello_horadrico.json`);
        }
        
        modal.showSuccess('Talismanes exportados');
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

  const handleExportAll = async () => {
    setExporting(true);
    try {
      let totalFiles = 0;
      const errors: string[] = [];

      // Exportar datos de héroes para todas las clases
      for (const clase of availableClasses) {
        try {
          // Habilidades
          const skills = await WorkspaceService.loadHeroSkills(clase);
          if (skills) {
            downloadJSON(skills, `heroes_${clase}_habilidades.json`);
            totalFiles++;
            await new Promise(resolve => setTimeout(resolve, 200)); // Delay para evitar bloqueo del navegador
          }

          // Glifos
          const glyphs = await WorkspaceService.loadHeroGlyphs(clase);
          if (glyphs) {
            downloadJSON(glyphs, `heroes_${clase}_glifos.json`);
            totalFiles++;
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          // Aspectos
          const aspects = await WorkspaceService.loadHeroAspects(clase);
          if (aspects) {
            downloadJSON(aspects, `heroes_${clase}_aspectos.json`);
            totalFiles++;
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (error) {
          console.warn(`Error exportando datos de ${clase}:`, error);
          errors.push(clase);
        }
      }

      // Exportar todos los personajes
      for (const personaje of personajes) {
        try {
          downloadJSON(personaje, `personaje_${personaje.nombre.replace(/\s+/g, '_')}.json`);
          totalFiles++;
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.warn(`Error exportando personaje ${personaje.nombre}:`, error);
          errors.push(`personaje_${personaje.nombre}`);
        }
      }

      // Exportar tags si existen
      try {
        const tags = TagService.getTags();
        if (tags && tags.length > 0) {
          downloadJSON({ tags }, 'tags_configurados.json');
          totalFiles++;
        }
      } catch (error) {
        console.warn('Error exportando tags:', error);
      }

      const mensaje = `Exportación completada: ${totalFiles} archivos descargados${errors.length > 0 ? ` (${errors.length} con errores)` : ''}`;
      modal.showSuccess(mensaje);
    } catch (error) {
      console.error('Error en exportación completa:', error);
      modal.showError('Error al exportar todos los datos');
    } finally {
      setExporting(false);
    }
  };

  const handleCopyPrompt = async () => {
    let prompt = '';
    if (importType === 'habilidades') {
      prompt = ImageExtractionPromptService.generateFullSkillsPrompt();
    } else if (importType === 'glifos') {
      prompt = ImageExtractionPromptService.generateGlyphsPrompt();
    } else if (importType === 'aspectos') {
      prompt = ImageExtractionPromptService.generateAspectsPrompt();
    } else if (importType === 'mecanicas') {
      prompt = ImageExtractionPromptService.generateClassMechanicsPrompt();
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
      <div className="card p-6 mb-6 bg-gradient-to-br from-d4-surface via-d4-bg to-d4-surface border-2 border-d4-accent/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-d4-accent/20 rounded-lg border-2 border-d4-accent/40">
            <Shield className="w-6 h-6 text-d4-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-d4-accent mb-1">Gestión de Héroes</h1>
            <p className="text-d4-text-dim text-sm">
              Importa y gestiona la información base de cada clase (habilidades, glifos, aspectos)
            </p>
          </div>
        </div>
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
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importType"
                      value="mecanicas"
                      checked={importType === 'mecanicas'}
                      onChange={() => setImportType('mecanicas')}
                      className="text-d4-accent"
                    />
                    <span className="text-d4-text">Mecánicas</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importType"
                      value="runas"
                      checked={importType === 'runas'}
                      onChange={() => setImportType('runas')}
                      className="text-d4-accent"
                    />
                    <span className="text-d4-text">Runas</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importType"
                      value="gemas"
                      checked={importType === 'gemas'}
                      onChange={() => setImportType('gemas')}
                      className="text-d4-accent"
                    />
                    <span className="text-d4-text">Gemas</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importType"
                      value="talismanes"
                      checked={importType === 'talismanes'}
                      onChange={() => setImportType('talismanes')}
                      className="text-d4-accent"
                    />
                    <span className="text-d4-text">🔮 Talismanes</span>
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

              <button
                onClick={handleExportAll}
                disabled={exporting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Exportando...
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5" />
                    Exportar Todo el Workspace
                  </>
                )}
              </button>
              {!exporting && (
                <p className="text-xs text-d4-text-dim text-center">
                  Descarga todos los datos: héroes ({availableClasses.length} clases), personajes ({personajes.length}) y tags
                </p>
              )}

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
                <button
                  onClick={() => setImportType('paragon')}
                  className={`px-4 py-2 rounded transition-colors ${
                    importType === 'paragon'
                      ? 'bg-d4-accent text-black font-semibold'
                      : 'bg-d4-surface text-d4-text hover:bg-d4-border'
                  }`}
                >
                  Paragon
                </button>
                <button
                  onClick={() => setImportType('runas')}
                  className={`px-4 py-2 rounded transition-colors ${
                    importType === 'runas'
                      ? 'bg-d4-accent text-black font-semibold'
                      : 'bg-d4-surface text-d4-text hover:bg-d4-border'
                  }`}
                >
                  Runas
                </button>
                <button
                  onClick={() => setImportType('mecanicas')}
                  className={`px-4 py-2 rounded transition-colors ${
                    importType === 'mecanicas'
                      ? 'bg-d4-accent text-black font-semibold'
                      : 'bg-d4-surface text-d4-text hover:bg-d4-border'
                  }`}
                >
                  Mecánicas
                </button>
                <button
                  onClick={() => setImportType('gemas')}
                  className={`px-4 py-2 rounded transition-colors ${
                    importType === 'gemas'
                      ? 'bg-d4-accent text-black font-semibold'
                      : 'bg-d4-surface text-d4-text hover:bg-d4-border'
                  }`}
                >
                  Gemas
                </button>
                <button
                  onClick={() => setImportType('talismanes')}
                  className={`px-4 py-2 rounded transition-colors ${
                    importType === 'talismanes'
                      ? 'bg-d4-accent text-black font-semibold'
                      : 'bg-d4-surface text-d4-text hover:bg-d4-border'
                  }`}
                >
                  🔮 Talismanes
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

              {importType === 'paragon' && (
                <div className="card">
                  <HeroParagon clase={selectedClass} />
                </div>
              )}

              {importType === 'runas' && (
                <HeroRunes clase={selectedClass} />
              )}

              {importType === 'mecanicas' && heroClassMechanics && (
                <HeroClassMechanics
                  heroClass={selectedClass}
                  mechanics={heroClassMechanics}
                  onUpdate={handleUpdateClassMechanics}
                />
              )}

              {importType === 'gemas' && (
                <HeroGems clase={selectedClass} />
              )}

              {importType === 'talismanes' && (
                <div className="space-y-6">
                  {/* Talismanes */}
                  {heroCharms && (
                    <HeroCharms
                      heroClass={selectedClass}
                      charms={heroCharms}
                      onUpdate={handleUpdateCharms}
                    />
                  )}
                  
                  {/* Sello Horádrico */}
                  {heroHoradricSeal && (
                    <HeroHoradricSeal
                      heroClass={selectedClass}
                      sealData={heroHoradricSeal}
                      onUpdate={handleUpdateHoradricSeal}
                    />
                  )}
                </div>
              )}

              {/* No data message */}
              {((importType === 'habilidades' && !heroSkills) ||
                (importType === 'glifos' && !heroGlyphs) ||
                (importType === 'aspectos' && !heroAspects) ||
                (importType === 'mecanicas' && !heroClassMechanics)) && (
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
