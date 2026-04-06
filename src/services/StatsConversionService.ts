import { Estadisticas, EstadisticaHeroe } from '../types';
import { WorkspaceService } from './WorkspaceService';

/**
 * Servicio para convertir estadísticas del formato anidado
 * al nuevo modelo de referencias (v0.3.7)
 */
export class StatsConversionService {
  
  /**
   * Normaliza el ID de una estadística para mapear con JSON V2
   * Convierte nombre a formato snake_case del JSON V2
   */
  private static normalizeStatId(stat: EstadisticaHeroe): string {
    // Mapeo especial de nombres a IDs del JSON V2
    const nameToIdMap: Record<string, string> = {
      'Nivel': 'nivel',
      'Fuerza': 'fuerza',
      'Inteligencia': 'inteligencia',
      'Voluntad': 'voluntad',
      'Destreza': 'destreza',
      'Aguante': 'aguante',
      'Armadura': 'armadura',
      'Daño de Arma': 'danio_arma',
      'Vida Máxima': 'vida_maxima',
      'Resistencia al Daño Físico': 'resistencia_danio_fisico',
      'Resistencia al Fuego': 'resistencia_fuego',
      'Resistencia al Rayo': 'resistencia_rayo',
      'Resistencia al Frío': 'resistencia_frio',
      'Resistencia al Veneno': 'resistencia_veneno',
      'Resistencia a la Sombra': 'resistencia_sombra',
      'Favor': 'favor',
      'Carne Fresca': 'carne_fresca',
      'Oro': 'oro',
      'Polvo Rojo': 'polvo_rojo',
      // Agregar más mapeos según sea necesario
    };

    // Buscar en el mapeo primero
    if (nameToIdMap[stat.nombre]) {
      return nameToIdMap[stat.nombre];
    }

    // Si no está en el mapeo, normalizar el nombre
    return stat.nombre.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
      .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n')
      .replace(/[()]/g, '');
  }
  
  /**
   * Convierte estadísticas del formato anidado a estadísticas individuales con IDs
   */
  static convertToIndividualStats(stats: Estadisticas): EstadisticaHeroe[] {
    const individualStats: EstadisticaHeroe[] = [];
    let idCounter = 1;

    const generateId = (categoria: string, nombre: string): string => {
      const normalized = nombre.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
        .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n');
      return `stat_${categoria}_${normalized}_${idCounter++}`;
    };

    // Procesar estadísticas de personaje
    if (stats.personaje) {
      if (stats.personaje.danioArma !== undefined) {
        individualStats.push({
          id: generateId('personaje', 'danio_arma'),
          nombre: 'Daño de Arma',
          categoria: 'personaje',
          tipo_valor: 'numero',
          tags: []
        });
      }
      if (stats.personaje.aguante !== undefined) {
        individualStats.push({
          id: generateId('personaje', 'aguante'),
          nombre: 'Aguante',
          categoria: 'personaje',
          tipo_valor: 'numero',
          tags: []
        });
      }
    }

    // Procesar atributos principales
    if (stats.atributosPrincipales) {
      const atributos: Array<{key: keyof typeof stats.atributosPrincipales, nombre: string}> = [
        { key: 'nivel', nombre: 'Nivel' },
        { key: 'fuerza', nombre: 'Fuerza' },
        { key: 'inteligencia', nombre: 'Inteligencia' },
        { key: 'voluntad', nombre: 'Voluntad' },
        { key: 'destreza', nombre: 'Destreza' }
      ];

      atributos.forEach(({ key, nombre }) => {
        if (stats.atributosPrincipales?.[key] !== undefined) {
          individualStats.push({
            id: generateId('atributos', nombre.toLowerCase()),
            nombre,
            categoria: 'atributosPrincipales',
            tipo_valor: 'numero',
            tags: []
          });
        }
      });
    }

    // Procesar defensivo
    if (stats.defensivo) {
      const defensivos: Array<{key: keyof typeof stats.defensivo, nombre: string}> = [
        { key: 'vidaMaxima', nombre: 'Vida Máxima' },
        { key: 'cantidadPociones', nombre: 'Cantidad de Pociones' },
        { key: 'sanacionRecibida', nombre: 'Sanación Recibida' },
        { key: 'vidaPorEliminacion', nombre: 'Vida por Eliminación' },
        { key: 'vidaCada5Segundos', nombre: 'Vida cada 5 Segundos' },
        { key: 'probabilidadBloqueo', nombre: 'Probabilidad de Bloqueo' },
        { key: 'reduccionBloqueo', nombre: 'Reducción de Bloqueo' },
        { key: 'bonificacionFortificacion', nombre: 'Bonificación de Fortificación' },
        { key: 'bonificacionBarrera', nombre: 'Bonificación de Barrera' },
        { key: 'probabilidadEsquivar', nombre: 'Probabilidad de Esquivar' },
      ];

      defensivos.forEach(({ key, nombre }) => {
        if (stats.defensivo?.[key] !== undefined) {
          individualStats.push({
            id: generateId('defensivo', nombre.toLowerCase()),
            nombre,
            categoria: 'defensivo',
            tipo_valor: key.includes('probabilidad') || key.includes('bonificacion') ? 'porcentaje' : 'numero',
            unidad: key.includes('probabilidad') || key.includes('bonificacion') ? '%' : undefined,
            tags: []
          });
        }
      });
    }

    // Procesar ofensivo
    if (stats.ofensivo) {
      const ofensivos: Array<{key: keyof typeof stats.ofensivo, nombre: string}> = [
        { key: 'danioBaseArma', nombre: 'Daño Base de Arma' },
        { key: 'velocidadArma', nombre: 'Velocidad de Arma' },
        { key: 'bonificacionVelocidadAtaque', nombre: 'Bonificación de Velocidad de Ataque' },
        { key: 'probabilidadGolpeCritico', nombre: 'Probabilidad de Golpe Crítico' },
        { key: 'danioGolpeCritico', nombre: 'Daño de Golpe Crítico' },
        { key: 'probabilidadAbrumar', nombre: 'Probabilidad de Abrumar' },
        { key: 'danioAbrumador', nombre: 'Daño Abrumador' },
        { key: 'danioContraEnemigosVulnerables', nombre: 'Daño contra Enemigos Vulnerables' },
        { key: 'todoElDanio', nombre: 'Todo el Daño' },
        { key: 'danioConSangrado', nombre: 'Daño con Sangrado' },
        { key: 'danioConQuemadura', nombre: 'Daño con Quemadura' },
        { key: 'danioConVeneno', nombre: 'Daño con Veneno' },
        { key: 'danioConCorrupcion', nombre: 'Daño con Corrupción' },
        { key: 'danioVsEnemigosElite', nombre: 'Daño vs Enemigos Élite' },
        { key: 'danioVsEnemigosSaludables', nombre: 'Daño vs Enemigos Saludables' },
        { key: 'espinas', nombre: 'Espinas' }
      ];

      ofensivos.forEach(({ key, nombre }) => {
        if (stats.ofensivo?.[key] !== undefined) {
          individualStats.push({
            id: generateId('ofensivo', nombre.toLowerCase()),
            nombre,
            categoria: 'ofensivo',
            tipo_valor: key.includes('probabilidad') || key.includes('bonificacion') || key.includes('danio') && key !== 'danioBaseArma' && key !== 'espinas' ? 'porcentaje' : 'numero',
            unidad: key.includes('probabilidad') || key.includes('bonificacion') || (key.includes('danio') && key !== 'danioBaseArma' && key !== 'espinas') ? '%' : undefined,
            tags: []
          });
        }
      });
    }

    // Procesar utilidad
    if (stats.utilidad) {
      const utilidades: Array<{key: keyof typeof stats.utilidad, nombre: string}> = [
        { key: 'maximoFe', nombre: 'Máximo de Fe' },
        { key: 'reduccionCostoFe', nombre: 'Reducción de Costo de Fe' },
        { key: 'regeneracionFe', nombre: 'Regeneración de Fe' },
        { key: 'feConCadaEliminacion', nombre: 'Fe con cada Eliminación' },
        { key: 'velocidadMovimiento', nombre: 'Velocidad de Movimiento' },
        { key: 'reduccionRecuperacion', nombre: 'Reducción de Recuperación' },
        { key: 'bonificacionProbabilidadGolpeAfortunado', nombre: 'Bonificación de Probabilidad de Golpe Afortunado' },
        { key: 'bonificacionExperiencia', nombre: 'Bonificación de Experiencia' }
      ];

      utilidades.forEach(({ key, nombre }) => {
        if (stats.utilidad?.[key] !== undefined) {
          individualStats.push({
            id: generateId('utilidad', nombre.toLowerCase()),
            nombre,
            categoria: 'utilidad',
            tipo_valor: key.includes('bonificacion') || key.includes('reduccion') ? 'porcentaje' : 'numero',
            unidad: key.includes('bonificacion') || key.includes('reduccion') ? '%' : undefined,
            tags: []
          });
        }
      });
    }

    // Procesar armadura y resistencias
    if (stats.armaduraYResistencias) {
      const resistencias: Array<{key: keyof typeof stats.armaduraYResistencias, nombre: string}> = [
        { key: 'aguante', nombre: 'Aguante' },
        { key: 'armadura', nombre: 'Armadura' },
        { key: 'resistenciaDanioFisico', nombre: 'Resistencia al Daño Físico' },
        { key: 'resistenciaFuego', nombre: 'Resistencia al Fuego' },
        { key: 'resistenciaRayo', nombre: 'Resistencia al Rayo' },
        { key: 'resistenciaFrio', nombre: 'Resistencia al Frío' },
        { key: 'resistenciaVeneno', nombre: 'Resistencia al Veneno' },
        { key: 'resistenciaSombra', nombre: 'Resist encia a la Sombra' }
      ];

      resistencias.forEach(({ key, nombre }) => {
        if (stats.armaduraYResistencias?.[key] !== undefined) {
          individualStats.push({
            id: generateId('resistencias', nombre.toLowerCase()),
            nombre,
            categoria: 'armaduraYResistencias',
            tipo_valor: 'numero',
            subcategoria: key.includes('resistencia') ? 'resistencias' : undefined,
            tags: []
          });
        }
      });
    }

    // Procesar moneda
    if (stats.moneda) {
      const monedas: Array<{key: keyof typeof stats.moneda, nombre: string}> = [
        { key: 'oro', nombre: 'Oro' },
        { key: 'polvoRojo', nombre: 'Polvo Rojo' },
        { key: 'marcasPalidas', nombre: 'Marcas Pálidas' },
        { key: 'monedasDelAlcazar', nombre: 'Monedas del Alcázar' },
        { key: 'favor', nombre: 'Favor' },
        { key: 'carneFresca', nombre: 'Carne Fresca' }
      ];

      monedas.forEach(({ key, nombre }) => {
        // Skip obolos (objeto anidado)
        if (key === 'obolos') return;
        
        if (stats.moneda?.[key] !== undefined) {
          individualStats.push({
            id: generateId('moneda', nombre.toLowerCase()),
            nombre,
            categoria: 'moneda',
            tipo_valor: 'texto',
            tags: []
          });
        }
      });

      // Procesar obolos por separado
      if (stats.moneda.obolos) {
        if (stats.moneda.obolos.actual !== undefined) {
          individualStats.push({
            id: generateId('moneda', 'obolos_actual'),
            nombre: 'Óbolos (Actual)',
            categoria: 'moneda',
            tipo_valor: 'numero',
            subcategoria: 'obolos',
            tags: []
          });
        }
        if (stats.moneda.obolos.maximo !== undefined) {
          individualStats.push({
            id: generateId('moneda', 'obolos_maximo'),
            nombre: 'Óbolos (Máximo)',
            categoria: 'moneda',
            tipo_valor: 'numero',
            subcategoria: 'obolos',
            tags: []
          });
        }
      }
    }

    // Procesar JcJ
    if (stats.jcj) {
      if (stats.jcj.reduccionDanio !== undefined) {
        individualStats.push({
          id: generateId('jcj', 'reduccion_danio'),
          nombre: 'Reducción de Daño (JcJ)',
          categoria: 'jcj',
          tipo_valor: 'porcentaje',
          unidad: '%',
          tags: []
        });
      }
    }

    return individualStats;
  }

  /**
   * Crea referencias a estadísticas con sus valores
   */
  static createStatsRefs(stats: Estadisticas, individualStats: EstadisticaHeroe[]): Array<{stat_id: string; valor: string | number}> {
    const refs: Array<{stat_id: string; valor: string | number}> = [];

    // Mapear cada categoría y campo a su ID correspondiente
    individualStats.forEach(statDef => {
      let valor: string | number | undefined;

      // Extraer valor según categoría
      if (statDef.categoria === 'personaje' && stats.personaje) {
        if (statDef.nombre === 'Daño de Arma') valor = stats.personaje.danioArma;
        if (statDef.nombre === 'Aguante') valor = stats.personaje.aguante;
      }
      else if (statDef.categoria === 'atributosPrincipales' && stats.atributosPrincipales) {
        const key = statDef.nombre.toLowerCase() as any;
        const rawValue = (stats.atributosPrincipales as any)[key];
        if (typeof rawValue === 'number' || typeof rawValue === 'string') {
          valor = rawValue;
        }
      }
      else if (statDef.categoria === 'defensivo' && stats.defensivo) {
        // Mapear nombre a campo
        const fieldMap: Record<string, keyof typeof stats.defensivo> = {
          'Vida Máxima': 'vidaMaxima',
          'Cantidad de Pociones': 'cantidadPociones',
          'Sanación Recibida': 'sanacionRecibida',
          'Vida por Eliminación': 'vidaPorEliminacion',
          'Vida cada 5 Segundos': 'vidaCada5Segundos',
          'Probabilidad de Bloqueo': 'probabilidadBloqueo',
          'Reducción de Bloqueo': 'reduccionBloqueo',
          'Bonificación de Fortificación': 'bonificacionFortificacion',
          'Bonificación de Barrera': 'bonificacionBarrera',
          'Probabilidad de Esquivar': 'probabilidadEsquivar'
        };
        const field = fieldMap[statDef.nombre];
        if (field) {
          const rawValue = stats.defensivo[field];
          if (typeof rawValue === 'number' || typeof rawValue === 'string') {
            valor = rawValue;
          }
        }
      }
      else if (statDef.categoria === 'ofensivo' && stats.ofensivo) {
        const fieldMap: Record<string, keyof typeof stats.ofensivo> = {
          'Daño Base de Arma': 'danioBaseArma',
          'Velocidad de Arma': 'velocidadArma',
          'Bonificación de Velocidad de Ataque': 'bonificacionVelocidadAtaque',
          'Probabilidad de Golpe Crítico': 'probabilidadGolpeCritico',
          'Daño de Golpe Crítico': 'danioGolpeCritico',
          'Probabilidad de Abrumar': 'probabilidadAbrumar',
          'Daño Abrumador': 'danioAbrumador',
          'Daño contra Enemigos Vulnerables': 'danioContraEnemigosVulnerables',
          'Todo el Daño': 'todoElDanio',
          'Daño con Sangrado': 'danioConSangrado',
          'Daño con Quemadura': 'danioConQuemadura',
          'Daño con Veneno': 'danioConVeneno',
          'Daño con Corrupción': 'danioConCorrupcion',
          'Daño vs Enemigos Élite': 'danioVsEnemigosElite',
          'Daño vs Enemigos Saludables': 'danioVsEnemigosSaludables',
          'Espinas': 'espinas'
        };
        const field = fieldMap[statDef.nombre];
        if (field) {
          const rawValue = stats.ofensivo[field];
          if (typeof rawValue === 'number' || typeof rawValue === 'string') {
            valor = rawValue;
          }
        }
      }
      else if (statDef.categoria === 'utilidad' && stats.utilidad) {
        const fieldMap: Record<string, keyof typeof stats.utilidad> = {
          'Máximo de Fe': 'maximoFe',
          'Reducción de Costo de Fe': 'reduccionCostoFe',
          'Regeneración de Fe': 'regeneracionFe',
          'Fe con cada Eliminación': 'feConCadaEliminacion',
          'Velocidad de Movimiento': 'velocidadMovimiento',
          'Reducción de Recuperación': 'reduccionRecuperacion',
          'Bonificación de Probabilidad de Golpe Afortunado': 'bonificacionProbabilidadGolpeAfortunado',
          'Bonificación de Experiencia': 'bonificacionExperiencia'
        };
        const field = fieldMap[statDef.nombre];
        if (field) {
          const rawValue = stats.utilidad[field];
          if (typeof rawValue === 'number' || typeof rawValue === 'string') {
            valor = rawValue;
          }
        }
      }
      else if (statDef.categoria === 'armaduraYResistencias' && stats.armaduraYResistencias) {
        const fieldMap: Record<string, keyof typeof stats.armaduraYResistencias> = {
          'Aguante': 'aguante',
          'Armadura': 'armadura',
          'Resistencia al Daño Físico': 'resistenciaDanioFisico',
          'Resistencia al Fuego': 'resistenciaFuego',
          'Resistencia al Rayo': 'resistenciaRayo',
          'Resistencia al Frío': 'resistenciaFrio',
          'Resistencia al Veneno': 'resistenciaVeneno',
          'Resistencia a la Sombra': 'resistenciaSombra'
        };
        const field = fieldMap[statDef.nombre];
        if (field) {
          const rawValue = stats.armaduraYResistencias[field];
          if (typeof rawValue === 'number' || typeof rawValue === 'string') {
            valor = rawValue;
          }
        }
      }
      else if (statDef.categoria === 'moneda' && stats.moneda) {
        const fieldMap: Record<string, keyof typeof stats.moneda> = {
          'Oro': 'oro',
          'Polvo Rojo': 'polvoRojo',
          'Marcas Pálidas': 'marcasPalidas',
          'Monedas del Alcázar': 'monedasDelAlcazar',
          'Favor': 'favor',
          'Carne Fresca': 'carneFresca'
        };
        const field = fieldMap[statDef.nombre];
        if (field) {
          const rawValue = stats.moneda[field];
          if (typeof rawValue === 'number' || typeof rawValue === 'string') {
            valor = rawValue;
          }
        }
        
        // Obolos
        if (statDef.nombre === 'Óbolos (Actual)' && stats.moneda.obolos) valor = stats.moneda.obolos.actual;
        if (statDef.nombre === 'Óbolos (Máximo)' && stats.moneda.obolos) valor = stats.moneda.obolos.maximo;
      }
      else if (statDef.categoria === 'jcj' && stats.jcj) {
        if (statDef.nombre === 'Reducción de Daño (JcJ)') valor = stats.jcj.reduccionDanio;
      }

      if (valor !== undefined) {
        refs.push({
          stat_id: statDef.id,
          valor
        });
      }
    });

    return refs;
  }

  /**
   * Extrae detalles enriquecidos del JSON V2 (formato con descripcion y detalles)
   * @param jsonV2 JSON original del formato V2 con estructura estadisticas.{categoria}[]
   * @returns Map con clave: id_stat normalizado → valor: {descripcion, detalles, tags}
   */
  static extractDetailsFromV2(jsonV2: any): Map<string, {descripcion?: string; detalles?: any[]; tags?: string[]}> {
    const detailsMap = new Map<string, {descripcion?: string; detalles?: any[]; tags?: string[]}>();
    
    if (!jsonV2 || !jsonV2.estadisticas) return detailsMap;

    const stats = jsonV2.estadisticas;

    const normalizeText = (value: string): string => value
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
      .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n')
      .replace(/[()%]/g, '')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const canonicalStatKey = (raw: string): string => {
      const snake = normalizeText(raw.replace(/([a-z])([A-Z])/g, '$1_$2'));
      const compact = snake.replace(/_/g, '');

      const aliases: Record<string, string> = {
        nivel: 'nivel',
        fuerza: 'fuerza',
        inteligencia: 'inteligencia',
        voluntad: 'voluntad',
        destreza: 'destreza',
        aguante: 'aguante',
        armadura: 'armadura',
        danioarma: 'danio_arma',
        daniodearma: 'danio_arma',
        daniobasearma: 'danio_base_arma',
        velocidadarma: 'velocidad_arma',
        bonificacionvelocidadataque: 'bonificacion_velocidad_ataque',
        probabilidadgolpecritico: 'probabilidad_de_golpe_critico',
        daniogolpecritico: 'danio_de_golpe_critico',
        probabilidadabrumar: 'probabilidad_abrumar',
        danioabrumador: 'danio_abrumador',
        daniocontraenemigosvulnerables: 'danio_contra_enemigos_vulnerables',
        todoeldanio: 'todo_el_danio',
        danioconsangrado: 'danio_con_sangrado',
        danioconquemadura: 'danio_con_quemadura',
        danioconveneno: 'danio_con_veneno',
        danioconcorrupcion: 'danio_con_corrupcion',
        daniovsenemigoselite: 'danio_vs_enemigos_elite',
        daniovsenemigossaludables: 'danio_vs_enemigos_saludables',
        espinas: 'espinas',
        vidamaxima: 'vida_maxima',
        cantidadpociones: 'cantidad_pociones',
        sanacionrecibida: 'sanacion_recibida',
        vidaporeliminacion: 'vida_por_eliminacion',
        vidacada5segundos: 'vida_cada_5_segundos',
        probabilidadbloqueo: 'probabilidad_de_bloqueo',
        reduccionbloqueo: 'reduccion_bloqueo',
        bonificacionfortificacion: 'bonificacion_fortificacion',
        bonificacionbarrera: 'generacion_de_barrera',
        probabilidadesquivar: 'probabilidad_esquivar',
        resistenciadaniofisico: 'resistencia_danio_fisico',
        resistenciafuego: 'resistencia_fuego',
        resistenciarayo: 'resistencia_rayo',
        resistenciafrio: 'resistencia_frio',
        resistenciaveneno: 'resistencia_veneno',
        resistenciasombra: 'resistencia_sombra',
        maximofe: 'maximo_de_fe',
        reduccioncostofe: 'coste_de_reduccion_de_fe',
        regeneracionfe: 'regeneracion_fe',
        feconcadaeliminacion: 'fe_con_cada_eliminacion',
        velocidadmovimiento: 'velocidad_de_movimiento',
        reduccionrecuperacion: 'reduccion_recuperacion',
        golpeafortunado: 'bonificacion_probabilidad_golpe_afortunado',
        bonificacionexperiencia: 'bonificacion_experiencia',
        reducciondanio: 'reduccion_danio',
        oro: 'oro',
        obolos: 'obolos',
        polvorojo: 'polvo_rojo',
        marcaspalidas: 'marcas_palidas',
        monedasdelalcazar: 'monedas_del_alcazar',
        favor: 'favor',
        carnefresca: 'carne_fresca'
      };

      return aliases[compact] || snake;
    };

    const mergeDetails = (
      key: string,
      payload: {descripcion?: string; detalles?: any[]; tags?: string[]}
    ) => {
      const existing = detailsMap.get(key) || {};
      detailsMap.set(key, {
        descripcion: payload.descripcion || existing.descripcion,
        detalles: payload.detalles && payload.detalles.length > 0
          ? [...(existing.detalles || []), ...payload.detalles]
          : existing.detalles,
        tags: payload.tags && payload.tags.length > 0
          ? Array.from(new Set([...(existing.tags || []), ...payload.tags]))
          : existing.tags
      });
    };

    // Procesar cada categoría del JSON V2
    const categories = [
      { key: 'atributos_principales', normalizeId: (id: string) => id },
      { key: 'defensivo', normalizeId: (id: string) => id },
      { key: 'ofensivo', normalizeId: (id: string) => id },
      { key: 'utilidad', normalizeId: (id: string) => id },
      { key: 'recursos', normalizeId: (id: string) => id },
      { key: 'personaje', normalizeId: (id: string) => id },
      { key: 'armadura_y_resistencias', normalizeId: (id: string) => id },
      { key: 'jcj', normalizeId: (id: string) => id },
      { key: 'moneda', normalizeId: (id: string) => id }
    ];

    categories.forEach(({ key, normalizeId }) => {
      if (stats[key] && Array.isArray(stats[key])) {
        stats[key].forEach((stat: any) => {
          if (stat.id) {
            const details: {descripcion?: string; detalles?: any[]; tags?: string[]} = {};
            
            if (stat.descripcion) details.descripcion = stat.descripcion;
            if (stat.detalles && Array.isArray(stat.detalles)) details.detalles = stat.detalles;
            if (stat.tags && Array.isArray(stat.tags)) details.tags = stat.tags;
            
            // Guardar con ID normalizado (modelo array original)
            mergeDetails(canonicalStatKey(normalizeId(stat.id)), details);
          }
        });
      }
    });

    // Compatibilidad: procesar formato por secciones-objeto (stats.personaje, stats.ofensivo, etc.)
    const objectSections = [
      'personaje',
      'atributosPrincipales',
      'defensivo',
      'ofensivo',
      'armaduraYResistencias',
      'utilidad',
      'jcj',
      'moneda'
    ];

    objectSections.forEach((sectionKey) => {
      const section = stats[sectionKey];
      if (!section || typeof section !== 'object' || Array.isArray(section)) return;

      // Descripción específica conocida de aguante (sección personaje)
      if (sectionKey === 'personaje' && section.aguante_definicion) {
        mergeDetails(canonicalStatKey('aguante'), { descripcion: section.aguante_definicion });
      }

      // Crear entrada base para cada campo numérico/textual visible
      Object.entries(section).forEach(([field, value]) => {
        if (['detalles', 'palabras_clave', 'aguante_definicion'].includes(field)) return;
        if (value === null || value === undefined) return;
        if (typeof value === 'object') return;

        mergeDetails(canonicalStatKey(field), {});
      });

      // Distribuir detalles al stat correcto usando atributo_ref / atributo_nombre / texto
      const sectionDetails = Array.isArray(section.detalles) ? section.detalles : [];
      const grouped: Record<string, any[]> = {};

      sectionDetails.forEach((detail: any) => {
        if (!detail || typeof detail !== 'object') return;

        const ref = detail.atributo_ref || detail.stat_key || detail.id || detail.campo;
        const name = detail.atributo_nombre || detail.nombre_atributo || detail.atributo || detail.stat_name;

        let target = ref ? canonicalStatKey(String(ref)) : '';
        if (!target && name) {
          target = canonicalStatKey(String(name));
        }

        // Fallback por texto: usa el texto antes de ':' como nombre de atributo
        if (!target && typeof detail.texto === 'string' && detail.texto.includes(':')) {
          target = canonicalStatKey(detail.texto.split(':')[0].trim());
        }

        // Si no se pudo inferir, no lo descartamos: lo asociamos a la sección completa
        if (!target) {
          target = canonicalStatKey(sectionKey);
        }

        if (!grouped[target]) grouped[target] = [];
        grouped[target].push(detail);
      });

      Object.entries(grouped).forEach(([target, details]) => {
        mergeDetails(target, { detalles: details });
      });
    });

    // Procesar nivel si existe
    if (jsonV2.nivel && typeof jsonV2.nivel === 'object') {
      const nivelDetails: {descripcion?: string; detalles?: any[]; tags?: string[]} = {};
      if (jsonV2.nivel.descripcion) nivelDetails.descripcion = jsonV2.nivel.descripcion;
      if (jsonV2.nivel.detalles) nivelDetails.detalles = jsonV2.nivel.detalles;
      if (jsonV2.nivel.tags) nivelDetails.tags = jsonV2.nivel.tags;
      mergeDetails('nivel', nivelDetails);
    }

    return detailsMap;
  }

  /**
   * Guarda estadísticas en el archivo del héroe y devuelve las referencias
   * @param clase Clase del héroe
   * @param stats Estadísticas en formato V1 (anidado)
   * @param jsonV2Array Array de JSONs V2 originales con detalles enriquecidos
   */
  static async saveAndCreateRefs(
    clase: string,
    stats: Estadisticas,
    jsonV2Array?: any[]
  ): Promise<Array<{stat_id: string; valor: string | number}>> {
    try {
      // Convertir a estadísticas individuales
      const individualStats = this.convertToIndividualStats(stats);

      // Extraer detalles del JSON V2 si está disponible
      let detailsMap = new Map<string, {descripcion?: string; detalles?: any[]; tags?: string[]}>();
      if (jsonV2Array && jsonV2Array.length > 0) {
        jsonV2Array.forEach(jsonV2 => {
          const jsonDetails = this.extractDetailsFromV2(jsonV2);
          // Merge detalles de múltiples JSONs
          jsonDetails.forEach((value, key) => {
            detailsMap.set(key, value);
          });
        });
      }

      // Enriquecer estadísticas individuales con detalles del JSON V2
      individualStats.forEach(stat => {
        // Intentar mapear ID de estadística con ID del JSON V2
        const statIdNormalized = this.normalizeStatId(stat);
        const details = detailsMap.get(statIdNormalized);
        
        if (details) {
          if (details.descripcion) stat.descripcion = details.descripcion;
          if (details.detalles) stat.detalles = details.detalles;
          if (details.tags && details.tags.length > 0) {
            // Merge tags (evitar duplicados)
            const existingTags = stat.tags || [];
            const newTags = details.tags.filter(t => !existingTags.includes(t));
            stat.tags = [...existingTags, ...newTags];
          }
        }
      });

      // Cargar estadísticas existentes del héroe
      const existingHeroStats = await WorkspaceService.loadHeroStats(clase);
      const allStats = existingHeroStats?.estadisticas || [];

      // Merge: actualizar existentes o agregar nuevas
      individualStats.forEach(newStat => {
        const existingIndex = allStats.findIndex(
          s => s.nombre === newStat.nombre && s.categoria === newStat.categoria
        );
        
        if (existingIndex >= 0) {
          // Actualizar estadística existente (merge de detalles)
          const existing = allStats[existingIndex];
          allStats[existingIndex] = {
            ...existing,
            ...newStat,
            // Merge detalles: si hay nuevos, reemplazar; si no, mantener existentes
            detalles: newStat.detalles && newStat.detalles.length > 0 ? newStat.detalles : existing.detalles,
            descripcion: newStat.descripcion || existing.descripcion,
            tags: newStat.tags || existing.tags
          };
        } else {
          // Agregar nueva estadística
          allStats.push(newStat);
        }
      });

      // Guardar en el archivo del héroe
      await WorkspaceService.saveHeroStats(clase, { estadisticas: allStats });

      // Crear referencias
      const refs = this.createStatsRefs(stats, individualStats);

      return refs;
    } catch (error) {
      console.error('Error guardando estadísticas del héroe:', error);
      throw error;
    }
  }
}
