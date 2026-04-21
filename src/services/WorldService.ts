import { DatosMundo, EventoMundo, GrafoProgresion, IndiceRecurso, RutaOptima, AnalisisEconomia } from '../types';
import { WorkspaceService } from './WorkspaceService';

export class WorldService {
  private static WORLD_FILE = 'world_data.json';

  /**
   * Cargar datos del mundo desde el archivo JSON en el workspace
   */
  static async loadWorldData(): Promise<DatosMundo | null> {
    try {
      const content = await WorkspaceService.readFile(this.WORLD_FILE);
      if (!content) return null;

      const data: DatosMundo = JSON.parse(content);
      console.log('✅ Datos del mundo cargados desde workspace:', this.WORLD_FILE);
      return data;
    } catch (error) {
      if ((error as any).name === 'NotFoundError') {
        console.log('📁 Archivo de mundo no existe aún, se creará al guardar');
        return null;
      }
      console.error('❌ Error cargando datos del mundo:', error);
      return null;
    }
  }

  /**
   * Guardar datos del mundo en el workspace físico
   */
  static async saveWorldData(data: DatosMundo): Promise<void> {
    try {
      // Actualizar timestamp
      data.ultima_actualizacion = new Date().toISOString();
      data.version = data.version || '0.9.0';

      // Guardar en el workspace físico usando WorkspaceService
      await WorkspaceService.saveFile(this.WORLD_FILE, JSON.stringify(data, null, 2));

      console.log('✅ Datos del mundo guardados en workspace:', this.WORLD_FILE);
    } catch (error) {
      console.error('❌ Error guardando datos del mundo:', error);
      throw error;
    }
  }

  /**
   * Agregar evento al mundo
   */
  static async addEvent(evento: EventoMundo): Promise<void> {
    const data = await this.loadWorldData();
    const worldData: DatosMundo = data || {
      eventos: [],
      grafo: { nodos: [], relaciones: [] },
      indice_recursos: [],
      version: '0.9.0',
      ultima_actualizacion: new Date().toISOString()
    };

    // Verificar que no exista un evento con el mismo ID
    if (worldData.eventos.some(e => e.id === evento.id)) {
      throw new Error(`Ya existe un evento con el ID: ${evento.id}`);
    }

    worldData.eventos.push(evento);
    worldData.grafo.nodos.push(evento.id);

    // Actualizar índice de recursos
    this.updateResourceIndex(worldData);

    // Recalcular relaciones automáticamente
    this.recalculateRelations(worldData);

    await this.saveWorldData(worldData);
  }

  /**
   * Actualizar evento existente
   */
  static async updateEvent(eventoId: string, updatedEvento: EventoMundo): Promise<void> {
    const data = await this.loadWorldData();
    if (!data) {
      throw new Error('No hay datos del mundo para actualizar');
    }

    const index = data.eventos.findIndex(e => e.id === eventoId);
    if (index === -1) {
      throw new Error(`Evento con ID ${eventoId} no encontrado`);
    }

    data.eventos[index] = updatedEvento;

    // Actualizar índice y relaciones
    this.updateResourceIndex(data);
    this.recalculateRelations(data);

    await this.saveWorldData(data);
  }

  /**
   * Eliminar evento
   */
  static async deleteEvent(eventoId: string): Promise<void> {
    const data = await this.loadWorldData();
    if (!data) {
      throw new Error('No hay datos del mundo');
    }

    data.eventos = data.eventos.filter(e => e.id !== eventoId);
    data.grafo.nodos = data.grafo.nodos.filter(id => id !== eventoId);
    data.grafo.relaciones = data.grafo.relaciones.filter(
      r => r.from !== eventoId && r.to !== eventoId
    );

    this.updateResourceIndex(data);

    await this.saveWorldData(data);
  }

  /**
   * Actualizar índice de recursos basado en eventos
   */
  private static updateResourceIndex(data: DatosMundo): void {
    const recursosMap = new Map<string, IndiceRecurso>();

    data.eventos.forEach(evento => {
      // Procesar requisitos
      evento.requisitos.forEach(req => {
        const key = req.nombre.toLowerCase();
        if (!recursosMap.has(key)) {
          recursosMap.set(key, {
            recurso: req.nombre,
            tipo: req.tipo as any,
            generado_por: [],
            requerido_por: []
          });
        }
        const recurso = recursosMap.get(key)!;
        if (!recurso.requerido_por.includes(evento.id)) {
          recurso.requerido_por.push(evento.id);
        }
      });

      // Procesar recompensas
      evento.recompensas.forEach(rec => {
        const key = rec.nombre.toLowerCase();
        if (!recursosMap.has(key)) {
          recursosMap.set(key, {
            recurso: rec.nombre,
            tipo: rec.tipo as any,
            generado_por: [],
            requerido_por: []
          });
        }
        const recurso = recursosMap.get(key)!;
        if (!recurso.generado_por.includes(evento.id)) {
          recurso.generado_por.push(evento.id);
        }
        if (rec.probabilidad) {
          recurso.probabilidad_drop = rec.probabilidad;
        }
      });
    });

    data.indice_recursos = Array.from(recursosMap.values());
  }

  /**
   * Recalcular relaciones entre eventos basado en requisitos y recompensas
   */
  /**
   * Recalcular relaciones automáticamente basándose en requisitos y recompensas
   */
  private static recalculateRelations(data: DatosMundo): void {
    const newRelations: any[] = [];

    // Para cada evento que requiere algo
    data.eventos.forEach(eventoRequiere => {
      eventoRequiere.requisitos.forEach(req => {
        // Buscar eventos que generen ese recurso (por id_recurso o nombre)
        data.eventos.forEach(eventoGenera => {
          const genera = eventoGenera.recompensas.some(rec => {
            // Comparar por id_recurso si ambos lo tienen
            if (req.id_recurso && rec.id_recurso) {
              return req.id_recurso === rec.id_recurso;
            }
            // Sino, comparar nombres (normalizado, singular/plural flexibles)
            const reqNorm = this.normalizeResourceName(req.nombre);
            const recNorm = this.normalizeResourceName(rec.nombre);
            return reqNorm === recNorm;
          });

          if (genera && eventoGenera.id !== eventoRequiere.id) {
            const relacionExiste = newRelations.some(
              r => r.from === eventoGenera.id && 
                   r.to === eventoRequiere.id && 
                   (r.recurso === req.nombre || this.normalizeResourceName(r.recurso) === this.normalizeResourceName(req.nombre))
            );

            if (!relacionExiste) {
              newRelations.push({
                from: eventoGenera.id,
                to: eventoRequiere.id,
                tipo: eventoGenera.repetible ? 'farm' : 'genera',
                recurso: req.nombre,
                descripcion: `${eventoGenera.nombre} genera ${req.nombre} necesario para ${eventoRequiere.nombre}`,
                cantidad: req.cantidad
              });
            }
          }
        });
      });
    });

    // Mantener relaciones manuales que no sean auto-generadas
    const manualRelations = data.grafo.relaciones.filter(
      r => r.tipo === 'desbloquea' || r.tipo === 'precondicion'
    );

    data.grafo.relaciones = [...newRelations, ...manualRelations];
    
    console.log(`🔗 Relaciones recalculadas: ${newRelations.length} automáticas + ${manualRelations.length} manuales`);
  }

  /**
   * Normalizar nombres de recursos para comparación flexible (singular/plural)
   */
  private static normalizeResourceName(nombre: string): string {
    let normalized = nombre.toLowerCase().trim();
    
    // Remover plurales comunes
    normalized = normalized.replace(/s$/, ''); // "Fragmentos" → "Fragmento"
    normalized = normalized.replace(/es$/, 'e'); // "Corazones" → "Corazone" (luego se arregla)
    
    // Casos específicos conocidos
    const mappings: Record<string, string> = {
      'corazon abominable': 'corazon_abominable',
      'corazone abominable': 'corazon_abominable',
      'fragmento de agonia': 'fragmento_agonia',
      'fragmento de agonía': 'fragmento_agonia',
      'muneco con alfilere': 'muneco_alfileres',
      'muñeco con alfilere': 'muneco_alfileres',
      'muneco con alfileres': 'muneco_alfileres',
      'muñeco con alfileres': 'muneco_alfileres'
    };
    
    return mappings[normalized] || normalized.replace(/\s+/g, '_');
  }

  /**
   * Generar ruta óptima para conseguir un recurso específico
   */
  static async generateRoute(objetivoRecurso: string): Promise<RutaOptima | null> {
    const data = await this.loadWorldData();
    if (!data) return null;

    // Buscar recurso en índice
    const recurso = data.indice_recursos.find(
      r => r.recurso.toLowerCase() === objetivoRecurso.toLowerCase()
    );

    if (!recurso) {
      console.warn(`Recurso ${objetivoRecurso} no encontrado en índice`);
      return null;
    }

    // Construir ruta inversa desde requisitos
    const pasos: any[] = [];
    const visitados = new Set<string>();
    
    const buildPath = (recursoActual: string, paso: number) => {
      const rec = data.indice_recursos.find(
        r => r.recurso.toLowerCase() === recursoActual.toLowerCase()
      );
      
      if (!rec || visitados.has(recursoActual)) return;
      visitados.add(recursoActual);

      // Eventos que generan este recurso
      rec.generado_por.forEach(eventoId => {
        const evento = data.eventos.find(e => e.id === eventoId);
        if (!evento) return;

        pasos.push({
          paso: paso,
          evento_id: evento.id,
          evento_nombre: evento.nombre,
          tipo: evento.tipo,
          motivo: `Genera ${recursoActual}`,
          recursos_obtenidos: evento.recompensas.map(r => r.nombre),
          recursos_consumidos: evento.requisitos.map(r => r.nombre)
        });

        // Recursivamente buscar requisitos
        evento.requisitos.forEach(req => {
          buildPath(req.nombre, paso + 1);
        });
      });
    };

    buildPath(objetivoRecurso, 1);

    // Ordenar pasos en orden correcto (del primero al último)
    pasos.sort((a, b) => b.paso - a.paso);
    pasos.forEach((p, i) => p.paso = i + 1);

    return {
      objetivo: `Obtener ${objetivoRecurso}`,
      objetivo_recurso: objetivoRecurso,
      pasos: pasos,
      eficiencia: pasos.length <= 3 ? 'Alta - Ruta directa' : 'Media - Múltiples pasos',
      tiempo_estimado: `${pasos.length * 10}-${pasos.length * 15} min estimados`,
      repetible: pasos.every(p => {
        const evt = data.eventos.find(e => e.id === p.evento_id);
        return evt?.repetible || false;
      })
    };
  }

  /**
   * Generar análisis de economía del mundo
   */
  static async generateEconomyAnalysis(): Promise<AnalisisEconomia | null> {
    const data = await this.loadWorldData();
    if (!data || data.eventos.length === 0) return null;

    const analisis: AnalisisEconomia = {
      tipo_economia: 'mixta',
      cuellos_botella: [],
      eventos_clave: [],
      loops_farm: [],
      recursos_escasos: [],
      recursos_abundantes: [],
      recomendaciones: []
    };

    // Detectar cuellos de botella (recursos requeridos por muchos pero generados por pocos)
    data.indice_recursos.forEach(recurso => {
      const ratio = recurso.requerido_por.length / Math.max(recurso.generado_por.length, 1);
      if (ratio > 2) {
        analisis.cuellos_botella.push(recurso.recurso);
        analisis.recursos_escasos.push(recurso.recurso);
      }
      if (recurso.generado_por.length > 3 && recurso.requerido_por.length < 2) {
        analisis.recursos_abundantes.push(recurso.recurso);
      }
    });

    // Eventos clave: los que generan recursos escasos o son bosses únicos
    data.eventos.forEach(evento => {
      const generaEscaso = evento.recompensas.some(rec => 
        analisis.recursos_escasos.includes(rec.nombre)
      );
      if (generaEscaso || evento.subtipo === 'boss' || evento.tags.includes('endgame')) {
        analisis.eventos_clave.push(evento.id);
      }
    });

    // Detectar loops de farm (eventos repetibles encadenados)
    const repetibles = data.eventos.filter(e => e.repetible);
    repetibles.forEach(evento => {
      const loop: string[] = [evento.id];
      
      // Buscar eventos que usan las recompensas de este
      evento.recompensas.forEach(rec => {
        const consumidores = data.eventos.filter(e => 
          e.requisitos.some(req => req.nombre === rec.nombre)
        );
        consumidores.forEach(cons => {
          if (cons.repetible && !loop.includes(cons.id)) {
            loop.push(cons.id);
          }
        });
      });

      if (loop.length > 1) {
        analisis.loops_farm.push(loop);
      }
    });

    // Determinar tipo de economía
    if (analisis.loops_farm.length > 3) {
      analisis.tipo_economia = 'circular';
    } else if (data.eventos.some(e => e.subtipo === 'boss' && e.tags.includes('endgame'))) {
      analisis.tipo_economia = 'jerarquica';
    }

    // Generar recomendaciones
    if (analisis.cuellos_botella.length > 0) {
      analisis.recomendaciones.push(
        `Prioriza eventos que generan: ${analisis.cuellos_botella.slice(0, 3).join(', ')}`
      );
    }
    
    const timeLimited = data.eventos.filter(e => e.tiempo?.expira_en && e.tags.includes('time_limited'));
    if (timeLimited.length > 0) {
      analisis.recomendaciones.push(
        'Completa susurros con timer antes de que expiren para no perder recursos'
      );
    }

    if (analisis.loops_farm.length > 0) {
      analisis.recomendaciones.push(
        `Identifica loops de farm eficientes para recursos específicos`
      );
    }

    return analisis;
  }

  /**
   * Importar datos desde JSON (para modal de captura)
   */
  /**
   * Normalizar evento importado para asegurar que tenga todas las propiedades requeridas
   */
  private static normalizeEvent(evento: any): EventoMundo {
    return {
      id: evento.id || `evento_${Date.now()}`,
      nombre: evento.nombre || 'Evento sin nombre',
      tipo: evento.tipo || 'evento',
      subtipo: evento.subtipo,
      boss: evento.boss !== undefined ? evento.boss : null,
      objetivo: evento.objetivo || {
        tipo: 'completar',
        descripcion: 'Sin descripción',
        progreso: null
      },
      requisitos: Array.isArray(evento.requisitos) ? evento.requisitos : [],
      recompensas: Array.isArray(evento.recompensas) ? evento.recompensas : [],
      tiempo: evento.tiempo || (evento.tiempo_estimado || evento.nivel_recomendado ? {
        expira_en: evento.expira_en || null,
        tiempo_completar: evento.tiempo_estimado || null,
        cooldown: evento.cooldown || null
      } : undefined),
      ubicacion: evento.ubicacion !== undefined ? evento.ubicacion : undefined,
      dificultad: evento.dificultad,
      repetible: evento.repetible !== undefined ? evento.repetible : true, // Por defecto repetible
      descripcion: evento.descripcion || evento.objetivo?.descripcion || 'Sin descripción',
      tags: Array.isArray(evento.tags) ? evento.tags : [],
      notas: evento.notas || ''
    };
  }

  /**
   * Importar datos desde JSON externo
   */
  static async importFromJSON(jsonData: any): Promise<void> {
    // Validar estructura básica
    if (!jsonData.eventos || !Array.isArray(jsonData.eventos)) {
      throw new Error('JSON inválido: falta campo "eventos" o no es un array');
    }

    // Cargar datos existentes o crear nuevos
    let data = await this.loadWorldData();
    if (!data) {
      data = {
        eventos: [],
        grafo: { nodos: [], relaciones: [] },
        indice_recursos: [],
        version: '0.9.0',
        ultima_actualizacion: new Date().toISOString()
      };
    }

    // Agregar nuevos eventos (evitar duplicados)
    jsonData.eventos.forEach((evento: any) => {
      const normalizedEvento = this.normalizeEvent(evento);
      const existingIndex = data!.eventos.findIndex(e => e.id === normalizedEvento.id);
      if (existingIndex >= 0) {
        // Actualizar existente
        data!.eventos[existingIndex] = normalizedEvento;
        console.log(`✏️ Evento actualizado: ${normalizedEvento.nombre}`);
      } else {
        // Agregar nuevo
        data!.eventos.push(normalizedEvento);
        data!.grafo.nodos.push(normalizedEvento.id);
        console.log(`➕ Evento agregado: ${normalizedEvento.nombre}`);
      }
    });

    // Si el JSON tiene grafo, agregar relaciones
    if (jsonData.grafo?.relaciones) {
      jsonData.grafo.relaciones.forEach((rel: any) => {
        const exists = data!.grafo.relaciones.some(
          r => r.from === rel.from && r.to === rel.to && r.recurso === rel.recurso
        );
        if (!exists) {
          data!.grafo.relaciones.push(rel);
        }
      });
    }

    // Si el JSON tiene análisis, agregarlo
    if (jsonData.analisis) {
      data!.analisis = jsonData.analisis;
    }

    // Si el JSON tiene rutas, agregarlas
    if (jsonData.rutas_sugeridas) {
      data!.rutas_sugeridas = jsonData.rutas_sugeridas;
    }

    // Actualizar temporada si viene
    if (jsonData.temporada) {
      data!.temporada = jsonData.temporada;
    }

    // Recalcular índice y relaciones
    this.updateResourceIndex(data);
    this.recalculateRelations(data);

    await this.saveWorldData(data);
  }

  /**
   * Exportar datos a JSON
   */
  /**
   * Exportar datos a JSON
   */
  static async exportToJSON(): Promise<string> {
    const data = await this.loadWorldData();
    if (!data) {
      throw new Error('No hay datos para exportar');
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Recalcular relaciones y guardar (método público para UI)
   */
  static async recalculateAndSave(): Promise<void> {
    const data = await this.loadWorldData();
    if (!data) {
      throw new Error('No hay datos cargados');
    }

    console.log('🔄 Recalculando índice de recursos y relaciones...');
    this.updateResourceIndex(data);
    this.recalculateRelations(data);
    
    await this.saveWorldData(data);
    console.log('✅ Relaciones recalculadas y guardadas');
  }

  /**
   * Calcular ruta completa de progresión para enfrentar un jefe específico
   */
  static async calculateBossRoute(jefeId: string): Promise<any> {
    const data = await this.loadWorldData();
    if (!data) {
      throw new Error('No hay datos cargados');
    }

    const jefeObjetivo = data.eventos.find(e => e.id === jefeId);
    if (!jefeObjetivo) {
      throw new Error(`Jefe con ID ${jefeId} no encontrado`);
    }

    // Estructura para almacenar la ruta
    const pasos: any[] = [];
    const visitados = new Set<string>();

    // Función recursiva para construir la cadena hacia atrás
    const buildChain = (eventoId: string, nivel: number = 0): void => {
      if (visitados.has(eventoId)) return;
      visitados.add(eventoId);

      const evento = data.eventos.find(e => e.id === eventoId);
      if (!evento) return;

      // Buscar qué jefes generan los recursos necesarios para este jefe
      const jefesRequeridos: any[] = [];

      evento.requisitos.forEach(req => {
        // Buscar relaciones que apuntan a este evento con este recurso
        const relaciones = data.grafo.relaciones.filter(
          rel => rel.to === eventoId && 
                 this.normalizeResourceName(rel.recurso || '') === this.normalizeResourceName(req.nombre)
        );

        relaciones.forEach(rel => {
          const jefeGenerador = data.eventos.find(e => e.id === rel.from);
          if (jefeGenerador && !visitados.has(jefeGenerador.id)) {
            jefesRequeridos.push({
              jefe: jefeGenerador,
              recurso: req.nombre,
              cantidad: req.cantidad,
              nivel: nivel + 1
            });

            // Recursivamente construir la cadena para este jefe
            buildChain(jefeGenerador.id, nivel + 1);
          }
        });
      });

      // Agregar este paso a la ruta
      if (nivel > 0 || jefesRequeridos.length > 0) {
        pasos.push({
          nivel,
          jefe: evento,
          requisitos_previos: jefesRequeridos
        });
      }
    };

    // Construir la cadena desde el jefe objetivo
    buildChain(jefeId);

    // Ordenar por nivel (de mayor a menor nivel = de base a objetivo)
    pasos.sort((a, b) => b.nivel - a.nivel);

    // Renumerar niveles para que sean ascendentes (paso 1, 2, 3...)
    const maxNivel = Math.max(...pasos.map(p => p.nivel), 0);
    pasos.forEach(p => {
      p.paso = maxNivel - p.nivel + 1;
    });

    // Construir resumen de recursos necesarios
    const recursosNecesarios = jefeObjetivo.requisitos.map(req => {
      const generadores = data.grafo.relaciones
        .filter(rel => rel.to === jefeId && 
                      this.normalizeResourceName(rel.recurso || '') === this.normalizeResourceName(req.nombre))
        .map(rel => {
          const jefe = data.eventos.find(e => e.id === rel.from);
          return jefe?.nombre || rel.from;
        });

      return {
        nombre: req.nombre,
        tipo: req.tipo,
        cantidad: req.cantidad,
        generado_por: generadores
      };
    });

    return {
      jefe_objetivo: jefeObjetivo,
      pasos,
      recursos_necesarios: recursosNecesarios,
      tiene_requisitos: jefeObjetivo.requisitos.length > 0,
      acceso_directo: jefeObjetivo.requisitos.length === 0
    };
  }
}
