import { useState, useEffect } from 'react';
import { Upload, TrendingUp, Copy, Check } from 'lucide-react';
import { Personaje, Estadisticas, Tag } from '../../types';
import { TagService } from '../../services/TagService';
import { ImageExtractionPromptService } from '../../services/ImageExtractionPromptService';
import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';
import ConfirmImportModal, { ImportSummary } from '../common/ConfirmImportModal';

interface Props {
  personaje: Personaje;
  onChange: (stats: Estadisticas, nivel?: number, nivelParagon?: number) => void;
}

const CharacterStats: React.FC<Props> = ({ personaje, onChange }) => {
  const modal = useModal();
  const [importing, setImporting] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [activeTab, setActiveTab] = useState<string>('personaje');
  const [copied, setCopied] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [estadisticas, setEstadisticas] = useState<Estadisticas>(
    personaje.estadisticas || {}
  );

  // Convertir formato V2 a V1 (formato interno actual)
  const convertV2ToV1 = (v2Data: any): { stats: Estadisticas; nivel?: number; nivelParagon?: number } => {
    // Si ya es formato V1, retornar directamente
    if (!v2Data.estadisticas || typeof v2Data.estadisticas !== 'object' || Array.isArray(v2Data.estadisticas)) {
      return {
        stats: v2Data as Estadisticas,
        nivel: v2Data.atributosPrincipales?.nivel,
        nivelParagon: v2Data.nivel_paragon
      };
    }

    // Formato V2 detectado - convertir a V1
    const v2Stats = v2Data.estadisticas;
    const convertedStats: Estadisticas = {};

    // Extraer nivel del personaje (puede venir como objeto o como número)
    let nivelPersonaje: number | undefined;
    if (v2Data.nivel) {
      // Si nivel es un objeto con estructura completa
      if (typeof v2Data.nivel === 'object' && v2Data.nivel.nivel) {
        nivelPersonaje = v2Data.nivel.nivel;
      } else if (typeof v2Data.nivel === 'number') {
        nivelPersonaje = v2Data.nivel;
      }
    }

    // Convertir atributos_principales a atributosPrincipales
    if (v2Stats.atributos_principales && Array.isArray(v2Stats.atributos_principales)) {
      const attrs: any = {};
      v2Stats.atributos_principales.forEach((attr: any) => {
        attrs[attr.id] = attr.valor;
      });
      // Agregar nivel si existe
      if (nivelPersonaje) {
        attrs.nivel = nivelPersonaje;
      }
      convertedStats.atributosPrincipales = attrs;
    }

    // Convertir ofensivo (array a objeto plano)
    if (v2Stats.ofensivo && Array.isArray(v2Stats.ofensivo)) {
      const ofensivo: any = {};
      v2Stats.ofensivo.forEach((stat: any) => {
        // Mapear IDs a campos conocidos
        const fieldMap: any = {
          'probabilidad_de_golpe_critico': 'probabilidadGolpeCritico',
          'danio_de_golpe_critico': 'danioGolpeCritico',
          'danio_contra_enemigos_vulnerables': 'danioContraEnemigosVulnerables',
          'danio_con_corrupcion': 'danioConCorrupcion',
          'danio_base_arma': 'danioBaseArma',
          'todo_el_danio': 'todoElDanio',
          'danio_con_sangrado': 'danioConSangrado',
          'danio_con_quemadura': 'danioConQuemadura',
          'danio_con_veneno': 'danioConVeneno',
          'probabilidad_abrumar': 'probabilidadAbrumar',
          'danio_abrumador': 'danioAbrumador',
          'danio_vs_enemigos_elite': 'danioVsEnemigosElite',
          'danio_vs_enemigos_saludables': 'danioVsEnemigosSaludables',
          'espinas': 'espinas',
          'velocidad_arma': 'velocidadArma',
          'bonificacion_velocidad_ataque': 'bonificacionVelocidadAtaque'
        };
        const field = fieldMap[stat.id] || stat.id;
        ofensivo[field] = stat.valor;
      });
      convertedStats.ofensivo = ofensivo;
    }

    // Convertir defensivo (array a objeto plano)
    if (v2Stats.defensivo && Array.isArray(v2Stats.defensivo)) {
      const defensivo: any = {};
      v2Stats.defensivo.forEach((stat: any) => {
        const fieldMap: any = {
          'vida_maxima': 'vidaMaxima',
          'probabilidad_de_bloqueo': 'probabilidadBloqueo',
          'reduccion_bloqueo': 'reduccionBloqueo',
          'generacion_de_barrera': 'bonificacionBarrera',
          'bonificacion_fortificacion': 'bonificacionFortificacion',
          'probabilidad_esquivar': 'probabilidadEsquivar',
          'sanacion_recibida': 'sanacionRecibida',
          'vida_por_eliminacion': 'vidaPorEliminacion',
          'vida_cada_5_segundos': 'vidaCada5Segundos',
          'cantidad_pociones': 'cantidadPociones'
        };
        const field = fieldMap[stat.id] || stat.id;
        defensivo[field] = stat.valor;
      });
      convertedStats.defensivo = defensivo;
    }

    // Convertir recursos
    if (v2Stats.recursos && Array.isArray(v2Stats.recursos)) {
      const utilidad: any = {};
      v2Stats.recursos.forEach((stat: any) => {
        const fieldMap: any = {
          'maximo_de_furia': 'maximoFe',
          'maximo_de_fe': 'maximoFe',
          'coste_de_reduccion_de_furia': 'reduccionCostoFe',
          'coste_de_reduccion_de_fe': 'reduccionCostoFe',
          'regeneracion_fe': 'regeneracionFe',
          'fe_con_cada_eliminacion': 'feConCadaEliminacion'
        };
        const field = fieldMap[stat.id] || stat.id;
        utilidad[field] = stat.valor;
      });
      convertedStats.utilidad = { ...convertedStats.utilidad, ...utilidad };
    }

    // Convertir utilidad
    if (v2Stats.utilidad && Array.isArray(v2Stats.utilidad)) {
      const utilidad: any = convertedStats.utilidad || {};
      v2Stats.utilidad.forEach((stat: any) => {
        const fieldMap: any = {
          'velocidad_de_movimiento': 'velocidadMovimiento',
          'velocidad_de_ataque': 'bonificacionVelocidadAtaque',
          'reduccion_recuperacion': 'reduccionRecuperacion',
          'bonificacion_probabilidad_golpe_afortunado': 'bonificacionProbabilidadGolpeAfortunado',
          'bonificacion_experiencia': 'bonificacionExperiencia'
        };
        const field = fieldMap[stat.id] || stat.id;
        utilidad[field] = stat.valor;
      });
      convertedStats.utilidad = utilidad;
    }

    // Convertir armadura y resistencias
    if (v2Stats.defensivo && Array.isArray(v2Stats.defensivo)) {
      const armadura: any = {};
      v2Stats.defensivo.forEach((stat: any) => {
        if (stat.id === 'armadura') {
          armadura.armadura = stat.valor;
        } else if (stat.id.startsWith('resistencia')) {
          const fieldMap: any = {
            'resistencia_fisica': 'resistenciaDanioFisico',
            'resistencia_al_danio_fisico': 'resistenciaDanioFisico',
            'resistencia_danio_fisico': 'resistenciaDanioFisico',
            'resistencia_fuego': 'resistenciaFuego',
            'resistencia_al_fuego': 'resistenciaFuego',
            'resistencia_rayo': 'resistenciaRayo',
            'resistencia_al_rayo': 'resistenciaRayo',
            'resistencia_frio': 'resistenciaFrio',
            'resistencia_al_frio': 'resistenciaFrio',
            'resistencia_veneno': 'resistenciaVeneno',
            'resistencia_al_veneno': 'resistenciaVeneno',
            'resistencia_sombra': 'resistenciaSombra',
            'resistencia_a_la_sombra': 'resistenciaSombra'
          };
          const field = fieldMap[stat.id] || stat.id;
          armadura[field] = stat.valor;
        }
      });
      if (Object.keys(armadura).length > 0) {
        convertedStats.armaduraYResistencias = armadura;
      }
    }

    return {
      stats: convertedStats,
      nivel: nivelPersonaje,
      nivelParagon: v2Data.nivel_paragon
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

  const analyzeImportChanges = (jsonText: string): ImportSummary => {
    try {
      const JSONObjects = parseMultipleJSON(jsonText);
      const seccionesActualizadas: string[] = [];
      let palabrasClaveCount = 0;

      JSONObjects.forEach(jsonStr => {
        try {
          const parsed = JSON.parse(jsonStr);
          
          // Contar palabras clave
          if (parsed.palabras_clave && Array.isArray(parsed.palabras_clave)) {
            palabrasClaveCount += parsed.palabras_clave.length;
          }
          
          const { stats, nivel } = convertV2ToV1(parsed);
          
          // Detectar si hay nivel
          if (nivel !== undefined) {
            if (!seccionesActualizadas.includes('Nivel del Personaje')) {
              seccionesActualizadas.push('Nivel del Personaje');
            }
          }
          
          // Detectar secciones con datos
          if (stats.personaje && Object.keys(stats.personaje).length > 0) {
            if (!seccionesActualizadas.includes('Personaje')) seccionesActualizadas.push('Personaje');
          }
          if (stats.atributosPrincipales && Object.keys(stats.atributosPrincipales).length > 0) {
            if (!seccionesActualizadas.includes('Atributos')) seccionesActualizadas.push('Atributos');
          }
          if (stats.defensivo && Object.keys(stats.defensivo).length > 0) {
            if (!seccionesActualizadas.includes('Defensivo')) seccionesActualizadas.push('Defensivo');
          }
          if (stats.ofensivo && Object.keys(stats.ofensivo).length > 0) {
            if (!seccionesActualizadas.includes('Ofensivo')) seccionesActualizadas.push('Ofensivo');
          }
          if (stats.utilidad && Object.keys(stats.utilidad).length > 0) {
            if (!seccionesActualizadas.includes('Utilidad')) seccionesActualizadas.push('Utilidad');
          }
          if (stats.armaduraYResistencias && Object.keys(stats.armaduraYResistencias).length > 0) {
            if (!seccionesActualizadas.includes('Armadura y Resistencias')) seccionesActualizadas.push('Armadura y Resistencias');
          }
          if (stats.jcj && Object.keys(stats.jcj).length > 0) {
            if (!seccionesActualizadas.includes('JcJ')) seccionesActualizadas.push('JcJ');
          }
          if (stats.moneda && Object.keys(stats.moneda).length > 0) {
            if (!seccionesActualizadas.includes('Moneda')) seccionesActualizadas.push('Moneda');
          }
        } catch (parseError) {
          console.error('Error parseando JSON individual:', parseError);
          throw new Error('JSON mal formado o incompleto. Verifica que el texto pegado sea un JSON válido.');
        }
      });

      return {
        estadisticas: {
          seccionesActualizadas
        },
        palabrasClave: palabrasClaveCount > 0 ? palabrasClaveCount : undefined
      };
    } catch (error: any) {
      console.error('Error analizando cambios:', error);
      throw error; // Propagar el error para mostrarlo al usuario
    }
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const content = await file.text();
      
      // Analizar cambios primero
      const summary = analyzeImportChanges(content);
      setImportSummary(summary);
      setPendingImportData(content);
      setShowConfirmModal(true);
      
    } catch (error: any) {
      console.error('Error leyendo archivo:', error);
      modal.showError(error.message || 'Error al leer el archivo JSON. Verifica que esté completo y sea válido.');
    } finally {
      setImporting(false);
    }
  };

  const handleImportFromText = async () => {
    if (!jsonText.trim()) {
      modal.showError('Por favor ingresa un JSON válido');
      return;
    }

    try {
      // Analizar cambios primero
      const summary = analyzeImportChanges(jsonText);
      setImportSummary(summary);
      setPendingImportData(jsonText);
      setShowConfirmModal(true);
    } catch (error: any) {
      console.error('Error analizando JSON:', error);
      modal.showError(error.message || 'Error al procesar el JSON. Verifica que esté completo y sea válido.');
    }
  };

  const confirmAndApplyImport = async () => {
    if (!pendingImportData) return;

    setImporting(true);
    try {
      const JSONObjects = parseMultipleJSON(pendingImportData);
      let mergedStats: Estadisticas = { ...estadisticas };
      let extractedNivel: number | undefined;
      let extractedNivelParagon: number | undefined;
      let allTags: Tag[] = [];

      for (const jsonStr of JSONObjects) {
        const parsed = JSON.parse(jsonStr);
        
        // Recolectar todos los tags del JSON V2
        if (parsed.palabras_clave && Array.isArray(parsed.palabras_clave)) {
          allTags = [...allTags, ...parsed.palabras_clave];
        }

        // Convertir V2 a V1
        const { stats, nivel, nivelParagon } = convertV2ToV1(parsed);
        
        // Merge progresivo
        mergedStats = {
          personaje: { ...mergedStats.personaje, ...stats.personaje },
          atributosPrincipales: { ...mergedStats.atributosPrincipales, ...stats.atributosPrincipales },
          defensivo: { ...mergedStats.defensivo, ...stats.defensivo },
          ofensivo: { ...mergedStats.ofensivo, ...stats.ofensivo },
          utilidad: { ...mergedStats.utilidad, ...stats.utilidad },
          armaduraYResistencias: { ...mergedStats.armaduraYResistencias, ...stats.armaduraYResistencias },
          jcj: { ...mergedStats.jcj, ...stats.jcj },
          moneda: { ...mergedStats.moneda, ...stats.moneda },
        };

        // Extraer nivel si existe
        if (nivel !== undefined) extractedNivel = nivel;
        if (nivelParagon !== undefined) extractedNivelParagon = nivelParagon;
      }

      // Procesar y guardar tags globalmente, obtener IDs
      const tagIds = await TagService.processAndSaveTagsV2(allTags, 'estadistica');
      console.log('Tags guardados con IDs:', tagIds);

      // TODO: Agregar campo tag_ids a Estadisticas para guardar las referencias
      // Por ahora solo guardamos los tags globalmente

      setEstadisticas(mergedStats);
      onChange(mergedStats, extractedNivel, extractedNivelParagon);
      
      setJsonText('');
      setShowTextInput(false);
      modal.showSuccess(`Estadísticas importadas correctamente (${tagIds.length} tags procesados)`);
    } catch (error) {
      console.error('Error aplicando importación:', error);
      modal.showError('Error al aplicar los cambios');
    } finally {
      setImporting(false);
      setPendingImportData(null);
      setShowConfirmModal(false);
    }
  };

  useEffect(() => {
    onChange(estadisticas);
  }, [estadisticas]);

  const handleCopyPrompt = async () => {
    const prompt = ImageExtractionPromptService.generateStatsPromptV2();
    const success = await ImageExtractionPromptService.copyToClipboard(prompt);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      modal.showError('Error al copiar al portapapeles');
    }
  };

  const tabs = [
    { id: 'personaje', label: 'Personaje' },
    { id: 'atributos', label: 'Atributos' },
    { id: 'defensivo', label: 'Defensivo' },
    { id: 'ofensivo', label: 'Ofensivo' },
    { id: 'armadura', label: 'Armadura' },
    { id: 'utilidad', label: 'Utilidad' },
    { id: 'principal', label: 'Principal' },
    { id: 'jcj', label: 'JcJ' },
    { id: 'moneda', label: 'Moneda' },
  ];

  const updatePersonaje = (field: string, value: number | string) => {
    setEstadisticas(prev => ({
      ...prev,
      personaje: {
        ...prev.personaje,
        [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
      }
    }));
  };

  const updateAtributosBase = (field: string, value: number | string) => {
    setEstadisticas(prev => ({
      ...prev,
      atributosBase: {
        ...prev.atributosBase,
        [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
      }
    }));
  };

  const updateDefensivo = (field: string, value: number | string) => {
    setEstadisticas(prev => ({
      ...prev,
      defensivo: {
        ...prev.defensivo,
        [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
      }
    }));
  };

  const updateUtilidad = (field: string, value: number | string) => {
    setEstadisticas(prev => ({
      ...prev,
      utilidad: {
        ...prev.utilidad,
        [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
      }
    }));
  };

  const updateJcJ = (field: string, value: number | string) => {
    setEstadisticas(prev => ({
      ...prev,
      jcj: {
        ...prev.jcj,
        [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
      }
    }));
  };

  const updateMoneda = (field: string, value: string | number) => {
    setEstadisticas(prev => ({
      ...prev,
      moneda: {
        ...prev.moneda,
        [field]: value
      }
    }));
  };

  const updateObolos = (field: string, value: number | string) => {
    setEstadisticas(prev => ({
      ...prev,
      moneda: {
        ...prev.moneda,
        obolos: {
          ...prev.moneda?.obolos,
          [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
        }
      }
    }));
  };

  const updateAtributosPrincipales = (field: string, value: number | string) => {
    setEstadisticas(prev => ({
      ...prev,
      atributosPrincipales: {
        ...prev.atributosPrincipales,
        [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
      }
    }));
  };

  const updateArmaduraYResistencias = (field: string, value: number | string) => {
    setEstadisticas(prev => ({
      ...prev,
      armaduraYResistencias: {
        ...prev.armaduraYResistencias,
        [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
      }
    }));
  };

  const updateOfensivo = (field: string, value: number | string) => {
    setEstadisticas(prev => ({
      ...prev,
      ofensivo: {
        ...prev.ofensivo,
        [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
      }
    }));
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-d4-accent" />
          <span className="text-sm text-d4-text">Gestionar estadísticas</span>
        </div>
        <div className="flex gap-2">
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
          <h4 className="font-bold text-d4-accent mb-2 text-sm">Pegar JSON de Estadísticas</h4>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="input w-full font-mono text-xs mb-2"
            rows={6}
            placeholder='{"personaje": {"danioArma": 595, "aguante": 52619}, ...}'
          />
          <div className="flex justify-between items-center gap-2">
            <button
              onClick={handleCopyPrompt}
              className="btn-secondary flex items-center gap-1 text-xs py-1 px-2"
              title="Copiar prompt para extraer estadísticas de imágenes usando IA"
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
              <button onClick={handleImportFromText} className="btn-primary text-xs py-1 px-2" disabled={importing || !jsonText.trim()}>
                {importing ? 'Importando...' : 'Importar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-3 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-d4-accent text-black font-semibold' : 'bg-d4-bg text-d4-text-dim hover:bg-d4-border'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {activeTab === 'personaje' && (
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Daño Arma</label><input type="number" value={estadisticas.personaje?.danioArma || ''} onChange={(e) => updatePersonaje('danioArma', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Aguante</label><input type="number" value={estadisticas.personaje?.aguante || ''} onChange={(e) => updatePersonaje('aguante', e.target.value)} className="input w-full text-xs py-1" /></div>
          </div>
        )}

        {activeTab === 'atributos' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Fuerza</label><input type="number" value={estadisticas.atributosBase?.fuerza || ''} onChange={(e) => updateAtributosBase('fuerza', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Inteligencia</label><input type="number" value={estadisticas.atributosBase?.inteligencia || ''} onChange={(e) => updateAtributosBase('inteligencia', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Voluntad</label><input type="number" value={estadisticas.atributosBase?.voluntad || ''} onChange={(e) => updateAtributosBase('voluntad', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Destreza</label><input type="number" value={estadisticas.atributosBase?.destreza || ''} onChange={(e) => updateAtributosBase('destreza', e.target.value)} className="input w-full text-xs py-1" /></div>
          </div>
        )}

        {activeTab === 'defensivo' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Vida Máxima</label><input type="number" value={estadisticas.defensivo?.vidaMaxima || ''} onChange={(e) => updateDefensivo('vidaMaxima', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Cant. Pociones</label><input type="number" value={estadisticas.defensivo?.cantidadPociones || ''} onChange={(e) => updateDefensivo('cantidadPociones', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Sanación %</label><input type="number" step="0.1" value={estadisticas.defensivo?.sanacionRecibida || ''} onChange={(e) => updateDefensivo('sanacionRecibida', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Vida/Elim</label><input type="number" value={estadisticas.defensivo?.vidaPorEliminacion || ''} onChange={(e) => updateDefensivo('vidaPorEliminacion', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Vida/5s</label><input type="number" value={estadisticas.defensivo?.vidaCada5Segundos || ''} onChange={(e) => updateDefensivo('vidaCada5Segundos', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Prob. Bloqueo %</label><input type="number" step="0.1" value={estadisticas.defensivo?.probabilidadBloqueo || ''} onChange={(e) => updateDefensivo('probabilidadBloqueo', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Red. Bloqueo %</label><input type="number" step="0.1" value={estadisticas.defensivo?.reduccionBloqueo || ''} onChange={(e) => updateDefensivo('reduccionBloqueo', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Bonif. Fortif. %</label><input type="number" step="0.1" value={estadisticas.defensivo?.bonificacionFortificacion || ''} onChange={(e) => updateDefensivo('bonificacionFortificacion', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Bonif. Barrera %</label><input type="number" step="0.1" value={estadisticas.defensivo?.bonificacionBarrera || ''} onChange={(e) => updateDefensivo('bonificacionBarrera', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Prob. Esquivar %</label><input type="number" step="0.1" value={estadisticas.defensivo?.probabilidadEsquivar || ''} onChange={(e) => updateDefensivo('probabilidadEsquivar', e.target.value)} className="input w-full text-xs py-1" /></div>
          </div>
        )}

        {activeTab === 'ofensivo' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Daño Base Arma</label><input type="number" value={estadisticas.ofensivo?.danioBaseArma || ''} onChange={(e) => updateOfensivo('danioBaseArma', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Vel. Arma</label><input type="number" step="0.1" value={estadisticas.ofensivo?.velocidadArma || ''} onChange={(e) => updateOfensivo('velocidadArma', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Vel. Ataque %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.bonificacionVelocidadAtaque || ''} onChange={(e) => updateOfensivo('bonificacionVelocidadAtaque', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Prob. Crítico %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.probabilidadGolpeCritico || ''} onChange={(e) => updateOfensivo('probabilidadGolpeCritico', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Daño Crítico %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.danioGolpeCritico || ''} onChange={(e) => updateOfensivo('danioGolpeCritico', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Prob. Abrumar %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.probabilidadAbrumar || ''} onChange={(e) => updateOfensivo('probabilidadAbrumar', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Daño Abrumador %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.danioAbrumador || ''} onChange={(e) => updateOfensivo('danioAbrumador', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Daño vs Vuln. %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.danioContraEnemigosVulnerables || ''} onChange={(e) => updateOfensivo('danioContraEnemigosVulnerables', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Todo Daño %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.todoElDanio || ''} onChange={(e) => updateOfensivo('todoElDanio', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Sangrado %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.danioConSangrado || ''} onChange={(e) => updateOfensivo('danioConSangrado', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Quemadura %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.danioConQuemadura || ''} onChange={(e) => updateOfensivo('danioConQuemadura', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Veneno %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.danioConVeneno || ''} onChange={(e) => updateOfensivo('danioConVeneno', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Corrupción %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.danioConCorrupcion || ''} onChange={(e) => updateOfensivo('danioConCorrupcion', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">vs Elite %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.danioVsEnemigosElite || ''} onChange={(e) => updateOfensivo('danioVsEnemigosElite', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">vs Saludables %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.danioVsEnemigosSaludables || ''} onChange={(e) => updateOfensivo('danioVsEnemigosSaludables', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Espinas</label><input type="number" value={estadisticas.ofensivo?.espinas || ''} onChange={(e) => updateOfensivo('espinas', e.target.value)} className="input w-full text-xs py-1" /></div>
          </div>
        )}

        {activeTab === 'armadura' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Aguante</label><input type="number" value={estadisticas.armaduraYResistencias?.aguante || ''} onChange={(e) => updateArmaduraYResistencias('aguante', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Armadura</label><input type="number" value={estadisticas.armaduraYResistencias?.armadura || ''} onChange={(e) => updateArmaduraYResistencias('armadura', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Res. Físico</label><input type="number" value={estadisticas.armaduraYResistencias?.resistenciaDanioFisico || ''} onChange={(e) => updateArmaduraYResistencias('resistenciaDanioFisico', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Res. Fuego</label><input type="number" value={estadisticas.armaduraYResistencias?.resistenciaFuego || ''} onChange={(e) => updateArmaduraYResistencias('resistenciaFuego', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Res. Rayo</label><input type="number" value={estadisticas.armaduraYResistencias?.resistenciaRayo || ''} onChange={(e) => updateArmaduraYResistencias('resistenciaRayo', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Res. Frío</label><input type="number" value={estadisticas.armaduraYResistencias?.resistenciaFrio || ''} onChange={(e) => updateArmaduraYResistencias('resistenciaFrio', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Res. Veneno</label><input type="number" value={estadisticas.armaduraYResistencias?.resistenciaVeneno || ''} onChange={(e) => updateArmaduraYResistencias('resistenciaVeneno', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Res. Sombra</label><input type="number" value={estadisticas.armaduraYResistencias?.resistenciaSombra || ''} onChange={(e) => updateArmaduraYResistencias('resistenciaSombra', e.target.value)} className="input w-full text-xs py-1" /></div>
          </div>
        )}

        {activeTab === 'utilidad' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Máximo Fe</label><input type="number" value={estadisticas.utilidad?.maximoFe || ''} onChange={(e) => updateUtilidad('maximoFe', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Red. Costo Fe %</label><input type="number" step="0.1" value={estadisticas.utilidad?.reduccionCostoFe || ''} onChange={(e) => updateUtilidad('reduccionCostoFe', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Regen. Fe</label><input type="number" step="0.1" value={estadisticas.utilidad?.regeneracionFe || ''} onChange={(e) => updateUtilidad('regeneracionFe', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Fe/Elim</label><input type="number" value={estadisticas.utilidad?.feConCadaEliminacion || ''} onChange={(e) => updateUtilidad('feConCadaEliminacion', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Vel. Movimiento %</label><input type="number" step="0.1" value={estadisticas.utilidad?.velocidadMovimiento || ''} onChange={(e) => updateUtilidad('velocidadMovimiento', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Red. Recup. %</label><input type="number" step="0.1" value={estadisticas.utilidad?.reduccionRecuperacion || ''} onChange={(e) => updateUtilidad('reduccionRecuperacion', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Golpe Afort. %</label><input type="number" step="0.1" value={estadisticas.utilidad?.bonificacionProbabilidadGolpeAfortunado || ''} onChange={(e) => updateUtilidad('bonificacionProbabilidadGolpeAfortunado', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Bonif. Exp. %</label><input type="number" step="0.1" value={estadisticas.utilidad?.bonificacionExperiencia || ''} onChange={(e) => updateUtilidad('bonificacionExperiencia', e.target.value)} className="input w-full text-xs py-1" /></div>
          </div>
        )}

        {activeTab === 'principal' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Nivel</label><input type="number" value={estadisticas.atributosPrincipales?.nivel || ''} onChange={(e) => updateAtributosPrincipales('nivel', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Fuerza</label><input type="number" value={estadisticas.atributosPrincipales?.fuerza || ''} onChange={(e) => updateAtributosPrincipales('fuerza', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Inteligencia</label><input type="number" value={estadisticas.atributosPrincipales?.inteligencia || ''} onChange={(e) => updateAtributosPrincipales('inteligencia', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Voluntad</label><input type="number" value={estadisticas.atributosPrincipales?.voluntad || ''} onChange={(e) => updateAtributosPrincipales('voluntad', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Destreza</label><input type="number" value={estadisticas.atributosPrincipales?.destreza || ''} onChange={(e) => updateAtributosPrincipales('destreza', e.target.value)} className="input w-full text-xs py-1" /></div>
          </div>
        )}

        {activeTab === 'jcj' && (
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Reducción Daño %</label><input type="number" step="0.1" value={estadisticas.jcj?.reduccionDanio || ''} onChange={(e) => updateJcJ('reduccionDanio', e.target.value)} className="input w-full text-xs py-1" /></div>
          </div>
        )}

        {activeTab === 'moneda' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Oro</label><input type="text" value={estadisticas.moneda?.oro || ''} onChange={(e) => updateMoneda('oro', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Obolos Actual</label><input type="number" value={estadisticas.moneda?.obolos?.actual || ''} onChange={(e) => updateObolos('actual', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Obolos Máximo</label><input type="number" value={estadisticas.moneda?.obolos?.maximo || ''} onChange={(e) => updateObolos('maximo', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Polvo Rojo</label><input type="number" value={estadisticas.moneda?.polvoRojo || ''} onChange={(e) => updateMoneda('polvoRojo', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Marcas Pálidas</label><input type="number" value={estadisticas.moneda?.marcasPalidas || ''} onChange={(e) => updateMoneda('marcasPalidas', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Monedas Alcázar</label><input type="number" value={estadisticas.moneda?.monedasDelAlcazar || ''} onChange={(e) => updateMoneda('monedasDelAlcazar', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Favor</label><input type="number" value={estadisticas.moneda?.favor || ''} onChange={(e) => updateMoneda('favor', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Carne Fresca</label><input type="text" value={estadisticas.moneda?.carneFresca || ''} onChange={(e) => updateMoneda('carneFresca', e.target.value)} className="input w-full text-xs py-1" /></div>
          </div>
        )}
      </div>
      
      {showConfirmModal && importSummary && (
        <ConfirmImportModal
          isOpen={showConfirmModal}
          summary={importSummary}
          type="estadisticas"
          onClose={() => {
            setShowConfirmModal(false);
            setPendingImportData(null);
            setImportSummary(null);
          }}
          onConfirm={confirmAndApplyImport}
        />
      )}
      
      <Modal {...modal} />
    </>
  );
};

export default CharacterStats;
