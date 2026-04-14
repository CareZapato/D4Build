import { useState, useEffect, useRef } from 'react';
import { Upload, TrendingUp, Copy, Check } from 'lucide-react';
import { Personaje, Estadisticas, Tag, EstadisticaHeroe } from '../../types';
import { TagService } from '../../services/TagService';
import { ImageExtractionPromptService } from '../../services/ImageExtractionPromptService';
import { StatsConversionService } from '../../services/StatsConversionService';
import { WorkspaceService } from '../../services/WorkspaceService';
import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';
import ConfirmImportModal, { ImportSummary } from '../common/ConfirmImportModal';
import StatField from '../common/StatField';

interface Props {
  personaje: Personaje;
  onChange: (
    stats: Estadisticas, 
    nivel?: number, 
    nivelParagon?: number,
    statsRefs?: Array<{stat_id: string; valor: string | number}>
  ) => void;
}

const CharacterStats: React.FC<Props> = ({ personaje, onChange }) => {
  const modal = useModal();
  const [importing, setImporting] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [promptElementCount, setPromptElementCount] = useState('');
  const [activeTab, setActiveTab] = useState<string>('principal');
  const [copied, setCopied] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  
  // Helper para extraer el valor de moneda (solo para mostrar, no para guardar)
  const getMonedaValue = (field: any): string | number => {
    if (field === undefined || field === null) return '';
    if (typeof field === 'object' && 'valor' in field) return field.valor;
    return field;
  };
  
  // Helper para extraer detalles de estructura enriquecida (personaje)
  const getMonedaDetalles = (field: any): any[] => {
    if (field && typeof field === 'object' && 'detalles' in field) {
      return field.detalles || [];
    }
    return [];
  };
  
  // Helper para extraer descripción de estructura enriquecida (personaje)
  const getMonedaDescripcion = (field: any): string | undefined => {
    // NO construir descripción desde detalles - los detalles deben mostrarse
    // individualmente en el tooltip con su formato, tags y colores
    if (field && typeof field === 'object' && 'descripcion' in field) {
      return field.descripcion;
    }
    return undefined;
  };
  
  const [estadisticas, setEstadisticas] = useState<Estadisticas>(
    personaje.estadisticas || {}
  );
  const [baseHeroStats, setBaseHeroStats] = useState<Map<string, EstadisticaHeroe>>(new Map());
  const [heroStats, setHeroStats] = useState<Map<string, EstadisticaHeroe>>(new Map());  // v0.3.7: Mapa de estadísticas del héroe
  const isFirstRender = useRef(true); // evitar auto-save en montaje inicial

  const loadHeroStats = async () => {
    try {
      const stats = await WorkspaceService.loadHeroStats(personaje.clase);
      if (stats && stats.estadisticas) {
        const statsMap = new Map<string, EstadisticaHeroe>();
        stats.estadisticas.forEach(stat => {
          // Crear índice por nombre normalizado para búsqueda rápida
          const key = stat.nombre.toLowerCase();
          statsMap.set(key, stat);
        });
        setBaseHeroStats(statsMap);
        setHeroStats(statsMap);
      }
    } catch (error) {
      console.log('No se pudieron cargar estadísticas del héroe (normal si no existen aún)');
    }
  };

  // Cargar estadísticas del héroe para tooltips (v0.3.7)
  useEffect(() => {
    loadHeroStats();
  }, [personaje.clase]);

  // Sincronizar estadísticas cuando cambia el personaje (desde fuera) y normalizar campos
  useEffect(() => {
    setEstadisticas(normalizeAllStats(personaje.estadisticas));
  }, [personaje.id]);

  // Complementar tooltips con detalles del JSON del personaje (sin depender solo del héroe)
  useEffect(() => {
    const normalize = (value: string): string => value
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
      .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n')
      .replace(/[()%]/g, '')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const mapBySection: Record<string, Record<string, string>> = {
      personaje: {
        danioArma: 'daño de arma',
        aguante: 'aguante'
      },
      atributosPrincipales: {
        nivel: 'nivel',
        fuerza: 'fuerza',
        inteligencia: 'inteligencia',
        voluntad: 'voluntad',
        destreza: 'destreza'
      },
      defensivo: {
        vidaMaxima: 'vida máxima',
        cantidadPociones: 'cantidad pociones',
        sanacionRecibida: 'sanación recibida',
        vidaPorEliminacion: 'vida por eliminación',
        vidaCada5Segundos: 'vida cada 5 segundos',
        probabilidadBloqueo: 'probabilidad bloqueo',
        reduccionBloqueo: 'reducción bloqueo',
        bonificacionFortificacion: 'bonificación fortificación',
        bonificacionBarrera: 'bonificación barrera',
        probabilidadEsquivar: 'probabilidad esquivar'
      },
      ofensivo: {
        danioBaseArma: 'daño base arma',
        velocidadArma: 'velocidad arma',
        bonificacionVelocidadAtaque: 'bonificación velocidad ataque',
        probabilidadGolpeCritico: 'probabilidad golpe crítico',
        danioGolpeCritico: 'daño golpe crítico',
        probabilidadAbrumar: 'probabilidad abrumar',
        danioAbrumador: 'daño abrumador',
        danioContraEnemigosVulnerables: 'daño contra enemigos vulnerables',
        todoElDanio: 'todo el daño',
        danioConSangrado: 'daño con sangrado',
        danioConQuemadura: 'daño con quemadura',
        danioConVeneno: 'daño con veneno',
        danioConCorrupcion: 'daño con corrupción',
        danioVsEnemigosElite: 'daño vs enemigos elite',
        danioVsEnemigosSaludables: 'daño vs enemigos saludables',
        espinas: 'espinas'
      },
      armaduraYResistencias: {
        aguante: 'aguante',
        armadura: 'armadura',
        resistenciaDanioFisico: 'resistencia al daño físico',
        resistenciaFuego: 'resistencia al fuego',
        resistenciaRayo: 'resistencia al rayo',
        resistenciaFrio: 'resistencia al frío',
        resistenciaVeneno: 'resistencia al veneno',
        resistenciaSombra: 'resistencia a la sombra'
      },
      utilidad: {
        maximoFe: 'máximo fe',
        reduccionCostoFe: 'reducción costo fe',
        regeneracionFe: 'regeneración fe',
        feConCadaEliminacion: 'fe con cada eliminación',
        velocidadMovimiento: 'velocidad movimiento',
        reduccionRecuperacion: 'reducción recuperación',
        bonificacionProbabilidadGolpeAfortunado: 'golpe afortunado',
        bonificacionExperiencia: 'bonificación experiencia'
      },
      jcj: {
        reduccionDanio: 'reducción daño'
      },
      moneda: {
        oro: 'oro',
        polvoRojo: 'polvo rojo',
        marcasPalidas: 'marcas pálidas',
        monedasDelAlcazar: 'monedas alcázar',
        favor: 'favor',
        carneFresca: 'carne fresca'
      }
    };

    const next = new Map(baseHeroStats);

    const sections = Object.keys(mapBySection);
    sections.forEach((sectionKey) => {
      const sectionData: any = (estadisticas as any)[sectionKey];
      if (!sectionData || typeof sectionData !== 'object' || Array.isArray(sectionData)) return;

      const detailGroups = new Map<string, any[]>();
      const details = Array.isArray(sectionData.detalles) ? sectionData.detalles : [];

      details.forEach((detail: any) => {
        const candidates = [
          detail?.atributo_ref,
          detail?.stat_key,
          detail?.campo,
          detail?.id,
          detail?.atributo_nombre,
          detail?.nombre_atributo,
          detail?.atributo,
          detail?.stat_name
        ].filter(Boolean);

        let key = '';
        if (candidates.length > 0) {
          key = normalize(String(candidates[0]));
        } else if (typeof detail?.texto === 'string' && detail.texto.includes(':')) {
          key = normalize(detail.texto.split(':')[0]);
        }

        if (!key) return;
        const existing = detailGroups.get(key) || [];
        existing.push(detail);
        detailGroups.set(key, existing);
      });

      Object.entries(mapBySection[sectionKey]).forEach(([fieldKey, lookupLabel]) => {
        const normalizedField = normalize(fieldKey);
        const normalizedLabel = normalize(lookupLabel);
        const fieldDetails = detailGroups.get(normalizedField) || detailGroups.get(normalizedLabel) || [];

        const current = next.get(lookupLabel);
        const descripcionFromSection = sectionKey === 'personaje' && fieldKey === 'aguante'
          ? sectionData.aguante_definicion
          : undefined;

        if (!current && fieldDetails.length === 0 && !descripcionFromSection) return;

        next.set(lookupLabel, {
          id: current?.id || `temp_${sectionKey}_${fieldKey}`,
          nombre: current?.nombre || lookupLabel,
          categoria: (current?.categoria || sectionKey) as any,
          tipo_valor: current?.tipo_valor || 'texto',
          ...current,
          descripcion: descripcionFromSection || current?.descripcion,
          detalles: fieldDetails.length > 0 ? fieldDetails : current?.detalles
        });
      });

      // Obolos (actual/máximo) comparten tooltip
      if (sectionKey === 'moneda' && sectionData.obolos) {
        const obolosDetails = detailGroups.get(normalize('obolos')) || [];
        if (obolosDetails.length > 0) {
          const current = next.get('obolos');
          next.set('obolos', {
            id: current?.id || 'temp_moneda_obolos',
            nombre: current?.nombre || 'obolos',
            categoria: (current?.categoria || 'moneda') as any,
            tipo_valor: current?.tipo_valor || 'texto',
            ...current,
            detalles: obolosDetails
          });
        }
      }
    });

    setHeroStats(next);
  }, [estadisticas, baseHeroStats]);

  /**
   * Normaliza nombres de campos que pueden venir de la IA con nombres diferentes
   * a los que espera el código de visualización.
   * También elimina campos duplicados consolidando sus valores.
   */
  const normalizeFieldNames = (section: any, sectionType: string): any => {
    if (!section || typeof section !== 'object' || Array.isArray(section)) return section;

    const normalized = { ...section };

    // Mapeos de campos por sección (key: nombre correcto, value: array de nombres incorrectos)
    const fieldMappings: Record<string, { correct: string; incorrect: string[] }> = {
      defensivo: {
        correct: 'vidaCada5Segundos',
        incorrect: ['regeneracionVida5s', 'regeneracion_vida_5s', 'vida5s']
      },
      utilidad: {
        correct: 'bonificacionProbabilidadGolpeAfortunado',
        incorrect: ['probabilidadGolpeAfortunado', 'golpeAfortunado']
      }
    };

    const mapping = fieldMappings[sectionType];
    if (mapping) {
      const { correct, incorrect } = mapping;
      let correctValue = normalized[correct];

      // Buscar valores en campos incorrectos
      incorrect.forEach(oldName => {
        if (oldName in normalized) {
          // Si el campo correcto no tiene valor, usar el del incorrecto
          if (correctValue === undefined || correctValue === null) {
            correctValue = normalized[oldName];
          }
          // Eliminar el campo incorrecto
          delete normalized[oldName];
        }
      });

      // Asignar valor consolidado al campo correcto
      if (correctValue !== undefined && correctValue !== null) {
        normalized[correct] = correctValue;
      }
    }

    return normalized;
  };

  /**
   * Normaliza todas las secciones de estadísticas eliminando campos duplicados
   */
  const normalizeAllStats = (stats: Estadisticas | undefined): Estadisticas => {
    if (!stats) return {};

    const normalized: Estadisticas = { ...stats };

    // Normalizar secciones
    if (normalized.defensivo) {
      normalized.defensivo = normalizeFieldNames(normalized.defensivo, 'defensivo');
    }
    if (normalized.utilidad) {
      const normalizedUtilidad = normalizeFieldNames(normalized.utilidad, 'utilidad');
      
      // Mover reduccionDanioJcJ de utilidad a jcj
      if ('reduccionDanioJcJ' in normalizedUtilidad) {
        if (!normalized.jcj) normalized.jcj = {};
        normalized.jcj.reduccionDanio = (normalizedUtilidad as any).reduccionDanioJcJ;
        delete (normalizedUtilidad as any).reduccionDanioJcJ;
      }
      
      normalized.utilidad = normalizedUtilidad;
    }
    if (normalized.ofensivo) {
      normalized.ofensivo = normalizeFieldNames(normalized.ofensivo, 'ofensivo');
    }
    if (normalized.armaduraYResistencias) {
      normalized.armaduraYResistencias = normalizeFieldNames(normalized.armaduraYResistencias, 'armaduraYResistencias');
    }

    // Compatibilidad: algunos JSON guardan aguante en personaje.aguante.
    // Lo reflejamos en armaduraYResistencias para que la pestaña Armaduras lo renderice.
    const aguantePersonaje = normalized.personaje?.aguante;
    if (aguantePersonaje !== undefined && aguantePersonaje !== null) {
      normalized.armaduraYResistencias = {
        ...(normalized.armaduraYResistencias || {}),
        aguante: normalized.armaduraYResistencias?.aguante ?? aguantePersonaje
      };
    }

    return normalized;
  };

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

    // === Rama principal: secciones camelCase objeto (puede venir parcial: solo ofensivo, solo defensivo, etc.) ===
    const hasObjectSections =
      !!v2Stats.personaje ||
      !!v2Stats.atributosPrincipales ||
      (!!v2Stats.defensivo && !Array.isArray(v2Stats.defensivo)) ||
      (!!v2Stats.ofensivo && !Array.isArray(v2Stats.ofensivo)) ||
      (!!v2Stats.utilidad && !Array.isArray(v2Stats.utilidad)) ||
      !!v2Stats.armaduraYResistencias ||
      !!v2Stats.jcj ||
      !!v2Stats.moneda;

    if (hasObjectSections) {
      const stats: Estadisticas = {};
      if (v2Stats.personaje) stats.personaje = v2Stats.personaje;
      if (v2Stats.atributosPrincipales) stats.atributosPrincipales = v2Stats.atributosPrincipales;
      if (v2Stats.defensivo && !Array.isArray(v2Stats.defensivo)) {
        stats.defensivo = normalizeFieldNames(v2Stats.defensivo, 'defensivo');
      }
      if (v2Stats.ofensivo && !Array.isArray(v2Stats.ofensivo)) {
        stats.ofensivo = normalizeFieldNames(v2Stats.ofensivo, 'ofensivo');
      }
      if (v2Stats.utilidad && !Array.isArray(v2Stats.utilidad)) {
        const normalizedUtilidad = normalizeFieldNames(v2Stats.utilidad, 'utilidad');
        
        // Si utilidad tiene reduccionDanioJcJ, moverlo a la sección jcj
        if ('reduccionDanioJcJ' in normalizedUtilidad) {
          stats.jcj = { 
            ...stats.jcj, 
            reduccionDanio: normalizedUtilidad.reduccionDanioJcJ 
          };
          delete normalizedUtilidad.reduccionDanioJcJ;
        }
        
        stats.utilidad = normalizedUtilidad;
      }
      if (v2Stats.armaduraYResistencias) {
        stats.armaduraYResistencias = normalizeFieldNames(v2Stats.armaduraYResistencias, 'armaduraYResistencias');
      }
      if (v2Stats.jcj) stats.jcj = v2Stats.jcj;
      // Preservar moneda con su estructura completa (detalles incluidos)
      if (v2Stats.moneda) stats.moneda = v2Stats.moneda;
      return {
        stats,
        nivel: v2Stats.atributosPrincipales?.nivel,
        nivelParagon: v2Data.nivel_paragon
      };
    }

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
      const mergeSection = (current: any, incoming: any) => {
        if (!current && !incoming) return undefined;
        const base = { ...(current || {}), ...(incoming || {}) };

        const currentDetails = Array.isArray(current?.detalles) ? current.detalles : [];
        const incomingDetails = Array.isArray(incoming?.detalles) ? incoming.detalles : [];
        if (currentDetails.length > 0 || incomingDetails.length > 0) {
          base.detalles = [...currentDetails, ...incomingDetails];
        }

        const currentKeywords = Array.isArray(current?.palabras_clave) ? current.palabras_clave : [];
        const incomingKeywords = Array.isArray(incoming?.palabras_clave) ? incoming.palabras_clave : [];
        if (currentKeywords.length > 0 || incomingKeywords.length > 0) {
          base.palabras_clave = Array.from(new Set([...currentKeywords, ...incomingKeywords]));
        }

        return base;
      };

      const mergeMoneda = (current: any, incoming: any) => {
        const merged = mergeSection(current, incoming) || {};
        if (current?.obolos || incoming?.obolos) {
          merged.obolos = { ...(current?.obolos || {}), ...(incoming?.obolos || {}) };
        }
        // NO normalizar - preservar estructura completa con detalles
        return merged;
      };

      // CRÍTICO: Leer personaje del disco para obtener estadísticas más recientes
      const personajeFromDisk = await WorkspaceService.loadPersonaje(personaje.id);
      const estadisticasFromDisk = personajeFromDisk?.estadisticas || {};

      const JSONObjects = parseMultipleJSON(pendingImportData);
      let mergedStats: Estadisticas = { ...estadisticasFromDisk };  // USAR DISCO en lugar de estado
      let extractedNivel: number | undefined;
      let extractedNivelParagon: number | undefined;
      let allTags: Tag[] = [];
      const parsedV2Array: any[] = [];  // v0.3.7: Guardar JSONs V2 originales para extraer detalles

      for (const jsonStr of JSONObjects) {
        const parsed = JSON.parse(jsonStr);
        parsedV2Array.push(parsed);  // v0.3.7: Guardar JSON V2 original
        
        // Recolectar todos los tags del JSON V2
        if (parsed.palabras_clave && Array.isArray(parsed.palabras_clave)) {
          allTags = [...allTags, ...parsed.palabras_clave];
        }

        // Convertir V2 a V1
        const { stats, nivel, nivelParagon } = convertV2ToV1(parsed);
        
        // Merge progresivo
        mergedStats = {
          personaje: mergeSection(mergedStats.personaje, stats.personaje),
          atributosPrincipales: mergeSection(mergedStats.atributosPrincipales, stats.atributosPrincipales),
          defensivo: mergeSection(mergedStats.defensivo, stats.defensivo),
          ofensivo: mergeSection(mergedStats.ofensivo, stats.ofensivo),
          utilidad: mergeSection(mergedStats.utilidad, stats.utilidad),
          armaduraYResistencias: mergeSection(mergedStats.armaduraYResistencias, stats.armaduraYResistencias),
          jcj: mergeSection(mergedStats.jcj, stats.jcj),
          moneda: mergeMoneda(mergedStats.moneda, stats.moneda),
        };

        // Extraer nivel si existe
        if (nivel !== undefined) extractedNivel = nivel;
        if (nivelParagon !== undefined) extractedNivelParagon = nivelParagon;
      }

      // Procesar y guardar tags globalmente, obtener IDs
      const tagIds = await TagService.processAndSaveTagsV2(allTags, 'estadistica');
      console.log('Tags guardados con IDs:', tagIds);

      // v0.3.7: Guardar estadísticas en héroe y crear referencias (con detalles del JSON V2)
      let statsRefs: Array<{stat_id: string; valor: string | number}> | undefined;
      try {
        statsRefs = await StatsConversionService.saveAndCreateRefs(
          personaje.clase, 
          mergedStats,
          parsedV2Array  // v0.3.7: Pasar JSONs V2 originales para extraer detalles
        );
        console.log(`Estadísticas guardadas en héroe: ${statsRefs.length} referencias creadas`);
      } catch (error) {
        console.error('Error creando referencias de estadísticas:', error);
        // Continuar sin referencias si hay error (backward compatibility)
      }

      setEstadisticas(mergedStats);
      onChange(mergedStats, extractedNivel, extractedNivelParagon, statsRefs);

      // Refrescar metadatos del héroe para tooltips inmediatamente
      await loadHeroStats();
      
      setJsonText('');
      setShowTextInput(false);
      
      const successMessage = statsRefs 
        ? `Estadísticas importadas correctamente (${tagIds.length} tags procesados, ${statsRefs.length} estadísticas guardadas en héroe)`
        : `Estadísticas importadas correctamente (${tagIds.length} tags procesados)`;
      modal.showSuccess(successMessage);
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
    // No disparar en el primer render para no sobreescribir datos guardados
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onChange(estadisticas);
  }, [estadisticas]);

  const handleCopyPrompt = async () => {
    const count = parseInt(promptElementCount, 10);
    const prompt = ImageExtractionPromptService.withElementLimit(
      ImageExtractionPromptService.generateStatsPrompt(),
      Number.isFinite(count) ? count : undefined,
      'atributos de estadísticas'
    );
    const success = await ImageExtractionPromptService.copyToClipboard(prompt);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      modal.showError('Error al copiar al portapapeles');
    }
  };

  const tabs = [
    { id: 'principal', label: 'Principal' },
    { id: 'moneda', label: 'Moneda' },
    { id: 'armadura', label: 'Armaduras' },
    { id: 'ofensivo', label: 'Ofensivo' },
    { id: 'defensivo', label: 'Defensivo' },
    { id: 'utilidad', label: 'Utilidad' },
    { id: 'jcj', label: 'JcJ' },
  ];

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
    setEstadisticas(prev => {
      const current = prev.moneda?.[field as keyof typeof prev.moneda];
      let newValue: any;
      
      // Si existe estructura enriquecida, preservarla y actualizar solo el valor
      if (current && typeof current === 'object' && 'valor' in current) {
        newValue = { ...current, valor: value };
      } else {
        // Si no hay estructura, guardar valor simple
        newValue = value;
      }
      
      return {
        ...prev,
        moneda: {
          ...prev.moneda,
          [field]: newValue
        }
      };
    });
  };

  const updateObolos = (field: string, value: number | string) => {
    setEstadisticas(prev => {
      const current = prev.moneda?.obolos;
      let newObolos: any;
      
      // Si existe estructura enriquecida, preservarla
      if (current && typeof current === 'object') {
        if ('valor' in current && field === 'actual') {
          // Estructura enriquecida: actualizar 'valor' para 'actual'
          newObolos = { 
            ...current, 
            valor: typeof value === 'string' ? parseFloat(value) || 0 : value,
            actual: typeof value === 'string' ? parseFloat(value) || 0 : value
          };
        } else {
          // Estructura simple o actualizando 'maximo'
          newObolos = { 
            ...current, 
            [field]: typeof value === 'string' ? parseFloat(value) || 0 : value 
          };
        }
      } else {
        // Nueva estructura simple
        newObolos = { [field]: typeof value === 'string' ? parseFloat(value) || 0 : value };
      }
      
      return {
        ...prev,
        moneda: {
          ...prev.moneda,
          obolos: newObolos
        }
      };
    });
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
    const parsedValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    setEstadisticas(prev => {
      const next: Estadisticas = {
        ...prev,
        armaduraYResistencias: {
          ...prev.armaduraYResistencias,
          [field]: parsedValue
        }
      };

      // Mantener sincronizado aguante también en personaje para no perderlo en guardados futuros.
      if (field === 'aguante') {
        next.personaje = {
          ...prev.personaje,
          aguante: typeof parsedValue === 'number' ? parsedValue : Number(parsedValue) || 0
        };
      }

      return next;
    });
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
            <div className="flex items-center gap-2">
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
        {activeTab === 'defensivo' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <StatField 
              label="Vida Máxima" 
              value={estadisticas.defensivo?.vidaMaxima || ''} 
              onChange={(v) => updateDefensivo('vidaMaxima', v)}
              descripcion={heroStats.get('vida máxima')?.descripcion}
              detalles={heroStats.get('vida máxima')?.detalles}
            />
            <StatField 
              label="Cant. Pociones" 
              value={estadisticas.defensivo?.cantidadPociones || ''} 
              onChange={(v) => updateDefensivo('cantidadPociones', v)}
              descripcion={heroStats.get('cantidad pociones')?.descripcion}
              detalles={heroStats.get('cantidad pociones')?.detalles}
            />
            <StatField 
              label="Sanación %" 
              value={estadisticas.defensivo?.sanacionRecibida || ''} 
              onChange={(v) => updateDefensivo('sanacionRecibida', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('sanación recibida')?.descripcion}
              detalles={heroStats.get('sanación recibida')?.detalles}
            />
            <StatField 
              label="Vida/Elim" 
              value={estadisticas.defensivo?.vidaPorEliminacion || ''} 
              onChange={(v) => updateDefensivo('vidaPorEliminacion', v)}
              descripcion={heroStats.get('vida por eliminación')?.descripcion}
              detalles={heroStats.get('vida por eliminación')?.detalles}
            />
            <StatField 
              label="Vida/5s" 
              value={estadisticas.defensivo?.vidaCada5Segundos || ''} 
              onChange={(v) => updateDefensivo('vidaCada5Segundos', v)}
              descripcion={heroStats.get('vida cada 5 segundos')?.descripcion}
              detalles={heroStats.get('vida cada 5 segundos')?.detalles}
            />
            <StatField 
              label="Prob. Bloqueo %" 
              value={estadisticas.defensivo?.probabilidadBloqueo || ''} 
              onChange={(v) => updateDefensivo('probabilidadBloqueo', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('probabilidad bloqueo')?.descripcion}
              detalles={heroStats.get('probabilidad bloqueo')?.detalles}
            />
            <StatField 
              label="Red. Bloqueo %" 
              value={estadisticas.defensivo?.reduccionBloqueo || ''} 
              onChange={(v) => updateDefensivo('reduccionBloqueo', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('reducción bloqueo')?.descripcion}
              detalles={heroStats.get('reducción bloqueo')?.detalles}
            />
            <StatField 
              label="Bonif. Fortif. %" 
              value={estadisticas.defensivo?.bonificacionFortificacion || ''} 
              onChange={(v) => updateDefensivo('bonificacionFortificacion', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('bonificación fortificación')?.descripcion}
              detalles={heroStats.get('bonificación fortificación')?.detalles}
            />
            <StatField 
              label="Bonif. Barrera %" 
              value={estadisticas.defensivo?.bonificacionBarrera || ''} 
              onChange={(v) => updateDefensivo('bonificacionBarrera', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('bonificación barrera')?.descripcion}
              detalles={heroStats.get('bonificación barrera')?.detalles}
            />
            <StatField 
              label="Prob. Esquivar %" 
              value={estadisticas.defensivo?.probabilidadEsquivar || ''} 
              onChange={(v) => updateDefensivo('probabilidadEsquivar', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('probabilidad esquivar')?.descripcion}
              detalles={heroStats.get('probabilidad esquivar')?.detalles}
            />
          </div>
        )}

        {activeTab === 'ofensivo' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <StatField 
              label="Daño Base Arma" 
              value={estadisticas.ofensivo?.danioBaseArma || ''} 
              onChange={(v) => updateOfensivo('danioBaseArma', v)}
              descripcion={heroStats.get('daño base arma')?.descripcion}
              detalles={heroStats.get('daño base arma')?.detalles}
            />
            <StatField 
              label="Vel. Arma" 
              value={estadisticas.ofensivo?.velocidadArma || ''} 
              onChange={(v) => updateOfensivo('velocidadArma', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('velocidad arma')?.descripcion}
              detalles={heroStats.get('velocidad arma')?.detalles}
            />
            <StatField 
              label="Vel. Ataque %" 
              value={estadisticas.ofensivo?.bonificacionVelocidadAtaque || ''} 
              onChange={(v) => updateOfensivo('bonificacionVelocidadAtaque', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('bonificación velocidad ataque')?.descripcion}
              detalles={heroStats.get('bonificación velocidad ataque')?.detalles}
            />
            <StatField 
              label="Prob. Crítico %" 
              value={estadisticas.ofensivo?.probabilidadGolpeCritico || ''} 
              onChange={(v) => updateOfensivo('probabilidadGolpeCritico', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('probabilidad golpe crítico')?.descripcion}
              detalles={heroStats.get('probabilidad golpe crítico')?.detalles}
            />
            <StatField 
              label="Daño Crítico %" 
              value={estadisticas.ofensivo?.danioGolpeCritico || ''} 
              onChange={(v) => updateOfensivo('danioGolpeCritico', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('daño golpe crítico')?.descripcion}
              detalles={heroStats.get('daño golpe crítico')?.detalles}
            />
            <StatField 
              label="Prob. Abrumar %" 
              value={estadisticas.ofensivo?.probabilidadAbrumar || ''} 
              onChange={(v) => updateOfensivo('probabilidadAbrumar', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('probabilidad abrumar')?.descripcion}
              detalles={heroStats.get('probabilidad abrumar')?.detalles}
            />
            <StatField 
              label="Daño Abrumador %" 
              value={estadisticas.ofensivo?.danioAbrumador || ''} 
              onChange={(v) => updateOfensivo('danioAbrumador', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('daño abrumador')?.descripcion}
              detalles={heroStats.get('daño abrumador')?.detalles}
            />
            <StatField 
              label="Daño vs Vuln. %" 
              value={estadisticas.ofensivo?.danioContraEnemigosVulnerables || ''} 
              onChange={(v) => updateOfensivo('danioContraEnemigosVulnerables', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('daño contra enemigos vulnerables')?.descripcion}
              detalles={heroStats.get('daño contra enemigos vulnerables')?.detalles}
            />
            <StatField 
              label="Todo Daño %" 
              value={estadisticas.ofensivo?.todoElDanio || ''} 
              onChange={(v) => updateOfensivo('todoElDanio', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('todo el daño')?.descripcion}
              detalles={heroStats.get('todo el daño')?.detalles}
            />
            <StatField 
              label="Sangrado %" 
              value={estadisticas.ofensivo?.danioConSangrado || ''} 
              onChange={(v) => updateOfensivo('danioConSangrado', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('daño con sangrado')?.descripcion}
              detalles={heroStats.get('daño con sangrado')?.detalles}
            />
            <StatField 
              label="Quemadura %" 
              value={estadisticas.ofensivo?.danioConQuemadura || ''} 
              onChange={(v) => updateOfensivo('danioConQuemadura', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('daño con quemadura')?.descripcion}
              detalles={heroStats.get('daño con quemadura')?.detalles}
            />
            <StatField 
              label="Veneno %" 
              value={estadisticas.ofensivo?.danioConVeneno || ''} 
              onChange={(v) => updateOfensivo('danioConVeneno', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('daño con veneno')?.descripcion}
              detalles={heroStats.get('daño con veneno')?.detalles}
            />
            <StatField 
              label="Corrupción %" 
              value={estadisticas.ofensivo?.danioConCorrupcion || ''} 
              onChange={(v) => updateOfensivo('danioConCorrupcion', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('daño con corrupción')?.descripcion}
              detalles={heroStats.get('daño con corrupción')?.detalles}
            />
            <StatField 
              label="vs Elite %" 
              value={estadisticas.ofensivo?.danioVsEnemigosElite || ''} 
              onChange={(v) => updateOfensivo('danioVsEnemigosElite', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('daño vs enemigos elite')?.descripcion}
              detalles={heroStats.get('daño vs enemigos elite')?.detalles}
            />
            <StatField 
              label="vs Saludables %" 
              value={estadisticas.ofensivo?.danioVsEnemigosSaludables || ''} 
              onChange={(v) => updateOfensivo('danioVsEnemigosSaludables', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('daño vs enemigos saludables')?.descripcion}
              detalles={heroStats.get('daño vs enemigos saludables')?.detalles}
            />
            <StatField 
              label="Espinas" 
              value={estadisticas.ofensivo?.espinas || ''} 
              onChange={(v) => updateOfensivo('espinas', v)}
              descripcion={heroStats.get('espinas')?.descripcion}
              detalles={heroStats.get('espinas')?.detalles}
            />
          </div>
        )}

        {activeTab === 'armadura' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <StatField 
              label="Aguante" 
              value={estadisticas.armaduraYResistencias?.aguante ?? estadisticas.personaje?.aguante ?? ''} 
              onChange={(v) => updateArmaduraYResistencias('aguante', v)}
              descripcion={heroStats.get('aguante')?.descripcion}
              detalles={heroStats.get('aguante')?.detalles}
            />
            <StatField 
              label="Armadura" 
              value={estadisticas.armaduraYResistencias?.armadura || ''} 
              onChange={(v) => updateArmaduraYResistencias('armadura', v)}
              descripcion={heroStats.get('armadura')?.descripcion}
              detalles={heroStats.get('armadura')?.detalles}
            />
            <StatField 
              label="Res. Físico" 
              value={estadisticas.armaduraYResistencias?.resistenciaDanioFisico || ''} 
              onChange={(v) => updateArmaduraYResistencias('resistenciaDanioFisico', v)}
              descripcion={heroStats.get('resistencia al daño físico')?.descripcion}
              detalles={heroStats.get('resistencia al daño físico')?.detalles}
            />
            <StatField 
              label="Res. Fuego" 
              value={estadisticas.armaduraYResistencias?.resistenciaFuego || ''} 
              onChange={(v) => updateArmaduraYResistencias('resistenciaFuego', v)}
              descripcion={heroStats.get('resistencia al fuego')?.descripcion}
              detalles={heroStats.get('resistencia al fuego')?.detalles}
            />
            <StatField 
              label="Res. Rayo" 
              value={estadisticas.armaduraYResistencias?.resistenciaRayo || ''} 
              onChange={(v) => updateArmaduraYResistencias('resistenciaRayo', v)}
              descripcion={heroStats.get('resistencia al rayo')?.descripcion}
              detalles={heroStats.get('resistencia al rayo')?.detalles}
            />
            <StatField 
              label="Res. Frío" 
              value={estadisticas.armaduraYResistencias?.resistenciaFrio || ''} 
              onChange={(v) => updateArmaduraYResistencias('resistenciaFrio', v)}
              descripcion={heroStats.get('resistencia al frío')?.descripcion}
              detalles={heroStats.get('resistencia al frío')?.detalles}
            />
            <StatField 
              label="Res. Veneno" 
              value={estadisticas.armaduraYResistencias?.resistenciaVeneno || ''} 
              onChange={(v) => updateArmaduraYResistencias('resistenciaVeneno', v)}
              descripcion={heroStats.get('resistencia al veneno')?.descripcion}
              detalles={heroStats.get('resistencia al veneno')?.detalles}
            />
            <StatField 
              label="Res. Sombra" 
              value={estadisticas.armaduraYResistencias?.resistenciaSombra || ''} 
              onChange={(v) => updateArmaduraYResistencias('resistenciaSombra', v)}
              descripcion={heroStats.get('resistencia a la sombra')?.descripcion}
              detalles={heroStats.get('resistencia a la sombra')?.detalles}
            />
          </div>
        )}

        {activeTab === 'utilidad' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <StatField 
              label="Máximo Fe" 
              value={estadisticas.utilidad?.maximoFe || ''} 
              onChange={(v) => updateUtilidad('maximoFe', v)}
              descripcion={heroStats.get('máximo fe')?.descripcion}
              detalles={heroStats.get('máximo fe')?.detalles}
            />
            <StatField 
              label="Red. Costo Fe %" 
              value={estadisticas.utilidad?.reduccionCostoFe || ''} 
              onChange={(v) => updateUtilidad('reduccionCostoFe', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('reducción costo fe')?.descripcion}
              detalles={heroStats.get('reducción costo fe')?.detalles}
            />
            <StatField 
              label="Regen. Fe" 
              value={estadisticas.utilidad?.regeneracionFe || ''} 
              onChange={(v) => updateUtilidad('regeneracionFe', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('regeneración fe')?.descripcion}
              detalles={heroStats.get('regeneración fe')?.detalles}
            />
            <StatField 
              label="Fe/Elim" 
              value={estadisticas.utilidad?.feConCadaEliminacion || ''} 
              onChange={(v) => updateUtilidad('feConCadaEliminacion', v)}
              descripcion={heroStats.get('fe con cada eliminación')?.descripcion}
              detalles={heroStats.get('fe con cada eliminación')?.detalles}
            />
            <StatField 
              label="Vel. Movimiento %" 
              value={estadisticas.utilidad?.velocidadMovimiento || ''} 
              onChange={(v) => updateUtilidad('velocidadMovimiento', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('velocidad movimiento')?.descripcion}
              detalles={heroStats.get('velocidad movimiento')?.detalles}
            />
            <StatField 
              label="Red. Recup. %" 
              value={estadisticas.utilidad?.reduccionRecuperacion || ''} 
              onChange={(v) => updateUtilidad('reduccionRecuperacion', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('reducción recuperación')?.descripcion}
              detalles={heroStats.get('reducción recuperación')?.detalles}
            />
            <StatField 
              label="Golpe Afort. %" 
              value={estadisticas.utilidad?.bonificacionProbabilidadGolpeAfortunado || ''} 
              onChange={(v) => updateUtilidad('bonificacionProbabilidadGolpeAfortunado', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('golpe afortunado')?.descripcion}
              detalles={heroStats.get('golpe afortunado')?.detalles}
            />
            <StatField 
              label="Bonif. Exp. %" 
              value={estadisticas.utilidad?.bonificacionExperiencia || ''} 
              onChange={(v) => updateUtilidad('bonificacionExperiencia', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('bonificación experiencia')?.descripcion}
              detalles={heroStats.get('bonificación experiencia')?.detalles}
            />
          </div>
        )}

        {activeTab === 'principal' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <StatField 
              label="Nivel" 
              value={estadisticas.atributosPrincipales?.nivel || ''} 
              onChange={(v) => updateAtributosPrincipales('nivel', v)}
              descripcion={heroStats.get('nivel')?.descripcion}
              detalles={heroStats.get('nivel')?.detalles}
            />
            <StatField 
              label="Fuerza" 
              value={estadisticas.atributosPrincipales?.fuerza || ''} 
              onChange={(v) => updateAtributosPrincipales('fuerza', v)}
              descripcion={heroStats.get('fuerza')?.descripcion}
              detalles={heroStats.get('fuerza')?.detalles}
            />
            <StatField 
              label="Inteligencia" 
              value={estadisticas.atributosPrincipales?.inteligencia || ''} 
              onChange={(v) => updateAtributosPrincipales('inteligencia', v)}
              descripcion={heroStats.get('inteligencia')?.descripcion}
              detalles={heroStats.get('inteligencia')?.detalles}
            />
            <StatField 
              label="Voluntad" 
              value={estadisticas.atributosPrincipales?.voluntad || ''} 
              onChange={(v) => updateAtributosPrincipales('voluntad', v)}
              descripcion={heroStats.get('voluntad')?.descripcion}
              detalles={heroStats.get('voluntad')?.detalles}
            />
            <StatField 
              label="Destreza" 
              value={estadisticas.atributosPrincipales?.destreza || ''} 
              onChange={(v) => updateAtributosPrincipales('destreza', v)}
              descripcion={heroStats.get('destreza')?.descripcion}
              detalles={heroStats.get('destreza')?.detalles}
            />
          </div>
        )}

        {activeTab === 'jcj' && (
          <div className="grid grid-cols-2 gap-2">
            <StatField 
              label="Reducción Daño %" 
              value={estadisticas.jcj?.reduccionDanio || ''} 
              onChange={(v) => updateJcJ('reduccionDanio', v)}
              type="number"
              step="0.1"
              descripcion={heroStats.get('reducción daño')?.descripcion}
              detalles={heroStats.get('reducción daño')?.detalles}
            />
          </div>
        )}

        {activeTab === 'moneda' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <StatField 
              label="Oro" 
              value={getMonedaValue(estadisticas.moneda?.oro) || ''} 
              onChange={(v) => updateMoneda('oro', v)}
              type="text"
              descripcion={getMonedaDescripcion(estadisticas.moneda?.oro) || heroStats.get('oro')?.descripcion}
              detalles={getMonedaDetalles(estadisticas.moneda?.oro).length > 0 ? getMonedaDetalles(estadisticas.moneda?.oro) : heroStats.get('oro')?.detalles}
            />
            <StatField 
              label="Obolos Actual" 
              value={getMonedaValue(estadisticas.moneda?.obolos?.actual) || getMonedaValue(estadisticas.moneda?.obolos?.valor) || ''} 
              onChange={(v) => updateObolos('actual', v)}
              descripcion={getMonedaDescripcion(estadisticas.moneda?.obolos) || heroStats.get('obolos')?.descripcion}
              detalles={getMonedaDetalles(estadisticas.moneda?.obolos).length > 0 ? getMonedaDetalles(estadisticas.moneda?.obolos) : heroStats.get('obolos')?.detalles}
            />
            <StatField 
              label="Obolos Máximo" 
              value={getMonedaValue(estadisticas.moneda?.obolos?.maximo) || ''} 
              onChange={(v) => updateObolos('maximo', v)}
              descripcion={getMonedaDescripcion(estadisticas.moneda?.obolos) || heroStats.get('obolos')?.descripcion}
              detalles={getMonedaDetalles(estadisticas.moneda?.obolos).length > 0 ? getMonedaDetalles(estadisticas.moneda?.obolos) : heroStats.get('obolos')?.detalles}
            />
            <StatField 
              label="Polvo Rojo" 
              value={getMonedaValue(estadisticas.moneda?.polvoRojo) || ''} 
              onChange={(v) => updateMoneda('polvoRojo', v)}
              descripcion={getMonedaDescripcion(estadisticas.moneda?.polvoRojo) || heroStats.get('polvo rojo')?.descripcion}
              detalles={getMonedaDetalles(estadisticas.moneda?.polvoRojo).length > 0 ? getMonedaDetalles(estadisticas.moneda?.polvoRojo) : heroStats.get('polvo rojo')?.detalles}
            />
            <StatField 
              label="Marcas Pálidas" 
              value={getMonedaValue(estadisticas.moneda?.marcasPalidas) || ''} 
              onChange={(v) => updateMoneda('marcasPalidas', v)}
              descripcion={getMonedaDescripcion(estadisticas.moneda?.marcasPalidas) || heroStats.get('marcas pálidas')?.descripcion}
              detalles={getMonedaDetalles(estadisticas.moneda?.marcasPalidas).length > 0 ? getMonedaDetalles(estadisticas.moneda?.marcasPalidas) : heroStats.get('marcas pálidas')?.detalles}
            />
            <StatField 
              label="Monedas Alcázar" 
              value={getMonedaValue(estadisticas.moneda?.monedasDelAlcazar) || ''} 
              onChange={(v) => updateMoneda('monedasDelAlcazar', v)}
              descripcion={getMonedaDescripcion(estadisticas.moneda?.monedasDelAlcazar) || heroStats.get('monedas alcázar')?.descripcion}
              detalles={getMonedaDetalles(estadisticas.moneda?.monedasDelAlcazar).length > 0 ? getMonedaDetalles(estadisticas.moneda?.monedasDelAlcazar) : heroStats.get('monedas alcázar')?.detalles}
            />
            <StatField 
              label="Favor" 
              value={getMonedaValue(estadisticas.moneda?.favor) || ''} 
              onChange={(v) => updateMoneda('favor', v)}
              descripcion={getMonedaDescripcion(estadisticas.moneda?.favor) || heroStats.get('favor')?.descripcion}
              detalles={getMonedaDetalles(estadisticas.moneda?.favor).length > 0 ? getMonedaDetalles(estadisticas.moneda?.favor) : heroStats.get('favor')?.detalles}
            />
            <StatField 
              label="Carne Fresca" 
              value={getMonedaValue(estadisticas.moneda?.carneFresca) || ''} 
              onChange={(v) => updateMoneda('carneFresca', v)}
              type="text"
              descripcion={getMonedaDescripcion(estadisticas.moneda?.carneFresca) || heroStats.get('carne fresca')?.descripcion}
              detalles={getMonedaDetalles(estadisticas.moneda?.carneFresca).length > 0 ? getMonedaDetalles(estadisticas.moneda?.carneFresca) : heroStats.get('carne fresca')?.detalles}
            />
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
