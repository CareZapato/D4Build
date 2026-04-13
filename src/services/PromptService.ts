import { Personaje, PromptConfig, Glifo, HabilidadActiva, HabilidadPasiva } from '../types';
import { WorkspaceService } from './WorkspaceService';

export class PromptService {
  // Generar prompt de análisis profundo del personaje
  static async generateDeepAnalysisPrompt(personaje: Personaje): Promise<string> {
    let prompt = `# Análisis Profundo de Build - ${personaje.nombre} (${personaje.clase})\n\n`;
    
    prompt += `Eres un experto en Diablo 4 especializado en optimización de builds. Analiza este personaje en detalle.\n\n`;
    
    // Información básica
    prompt += `## Información del Personaje\n`;
    prompt += `- **Clase**: ${personaje.clase}\n`;
    prompt += `- **Nivel**: ${personaje.nivel}`;
    if (personaje.nivel_paragon) {
      prompt += ` | **Nivel Paragon**: ${personaje.nivel_paragon}`;
    }
    prompt += `\n\n`;

    // Estadísticas detalladas
    if (personaje.estadisticas) {
      prompt += await this.formatEstadisticasDetalladas(personaje.estadisticas);
    }

    // Habilidades equipadas
    if (personaje.habilidades_refs) {
      prompt += await this.formatHabilidadesEquipadas(personaje);
    }

    // Glifos equipados
    if (personaje.glifos_refs && personaje.glifos_refs.length > 0) {
      prompt += await this.formatGlifosEquipados(personaje);
    }

    // Aspectos equipados
    if (personaje.aspectos_refs && personaje.aspectos_refs.length > 0) {
      prompt += await this.formatAspectosEquipados(personaje);
    }

    // Pregunta de análisis
    prompt += `\n## Tarea de Análisis\n\n`;
    prompt += `Proporciona un análisis detallado del build:\n\n`;
    prompt += `### 1. Evaluación General (0-10)\n`;
    prompt += `- **Coherencia del Build**: ¿Las habilidades, glifos y aspectos trabajan juntos?\n`;
    prompt += `- **Optimización de Stats**: ¿Las estadísticas están bien distribuidas?\n`;
    prompt += `- **Viabilidad**: ¿Es viable para contenido endgame?\n\n`;
    
    prompt += `### 2. Fortalezas Identificadas\n`;
    prompt += `- ¿Qué está haciendo bien este build?\n`;
    prompt += `- ¿Qué sinergias efectivas existen?\n`;
    prompt += `- ¿Qué aspectos son particularmente fuertes?\n\n`;
    
    prompt += `### 3. Debilidades y Puntos Críticos\n`;
    prompt += `- ¿Qué carencias tiene el build?\n`;
    prompt += `- ¿Hay habilidades/glifos/aspectos que no aportan valor?\n`;
    prompt += `- ¿Qué mecánicas del juego no está aprovechando?\n\n`;
    
    prompt += `### 4. Prioridades de Optimización\n`;
    prompt += `Ordena por importancia (1 = más urgente):\n`;
    prompt += `- Estadísticas a mejorar\n`;
    prompt += `- Habilidades a cambiar\n`;
    prompt += `- Glifos a reemplazar\n`;
    prompt += `- Aspectos a buscar\n\n`;
    
    prompt += `### 5. Plan de Acción Inmediato\n`;
    prompt += `Dame 3-5 cambios concretos que pueda hacer YA para mejorar el rendimiento.\n`;

    return prompt;
  }

  // Generar prompt de comparación con pool del héroe
  static async generatePoolComparisonPrompt(personaje: Personaje): Promise<string> {
    let prompt = `# Comparación: Equipado vs Disponible - ${personaje.nombre}\n\n`;
    
    prompt += `Eres un experto en teorycrafting de Diablo 4. Compara lo que el personaje tiene equipado contra todas las opciones disponibles.\n\n`;

    // Habilidades equipadas vs disponibles
    try {
      const heroSkills = await WorkspaceService.loadHeroSkills(personaje.clase);
      if (heroSkills && personaje.habilidades_refs) {
        prompt += `## Habilidades: Equipadas vs Disponibles\n\n`;
        
        // Activas equipadas
        const equipadasActivas = personaje.habilidades_refs.activas || [];
        const equipadasActivasIds = new Set(equipadasActivas.map(ref => ref.skill_id));
        
        prompt += `### Habilidades Activas Equipadas (${equipadasActivas.length})\n`;
        for (const ref of equipadasActivas) {
          const skill = heroSkills.habilidades_activas.find(s => s.id === ref.skill_id);
          if (skill) {
            prompt += `- **${skill.nombre}** (${skill.tipo} - ${skill.rama})\n`;
            prompt += `  - Nivel: ${ref.nivel_actual || skill.nivel}\n`;
            prompt += `  - Descripción: ${skill.descripcion}\n`;
            if (ref.modificadores_ids && ref.modificadores_ids.length > 0) {
              prompt += `  - Modificadores: ${ref.modificadores_ids.length} equipados\n`;
            }
          }
        }

        // Activas disponibles NO equipadas
        const disponiblesActivas = heroSkills.habilidades_activas.filter(s => s.id && !equipadasActivasIds.has(s.id));
        if (disponiblesActivas.length > 0) {
          prompt += `\n### Habilidades Activas Disponibles NO Equipadas (${disponiblesActivas.length})\n`;
          disponiblesActivas.forEach(skill => {
            prompt += `- **${skill.nombre}** (${skill.tipo} - ${skill.rama})\n`;
            prompt += `  - ${skill.descripcion}\n`;
            if (skill.tipo_danio) prompt += `  - Tipo daño: ${skill.tipo_danio}\n`;
          });
        }

        // Pasivas equipadas
        const equipadasPasivas = personaje.habilidades_refs.pasivas || [];
        const equipadasPasivasIds = new Set(equipadasPasivas.map(ref => 
          typeof ref === 'string' ? ref : ref.skill_id
        ));
        
        prompt += `\n### Habilidades Pasivas Equipadas (${equipadasPasivas.length})\n`;
        for (const ref of equipadasPasivas) {
          const skillId = typeof ref === 'string' ? ref : ref.skill_id;
          const skill = heroSkills.habilidades_pasivas.find(s => s.id === skillId);
          if (skill) {
            prompt += `- **${skill.nombre}**: ${skill.efecto}\n`;
          }
        }

        // Pasivas disponibles NO equipadas
        const disponiblesPasivas = heroSkills.habilidades_pasivas.filter(s => s.id && !equipadasPasivasIds.has(s.id));
        if (disponiblesPasivas.length > 0) {
          prompt += `\n### Habilidades Pasivas Disponibles NO Equipadas (${disponiblesPasivas.length})\n`;
          disponiblesPasivas.forEach(skill => {
            prompt += `- **${skill.nombre}**: ${skill.efecto}\n`;
          });
        }
      }
    } catch (error) {
      console.error('Error cargando habilidades:', error);
    }

    // Glifos equipados vs disponibles
    try {
      const heroGlyphs = await WorkspaceService.loadHeroGlyphs(personaje.clase);
      if (heroGlyphs && personaje.glifos_refs) {
        prompt += `\n## Glifos: Equipados vs Disponibles\n\n`;
        
        const equipadosGlifosIds = new Set(personaje.glifos_refs.map(ref => ref.id));
        
        prompt += `### Glifos Equipados (${personaje.glifos_refs.length})\n`;
        personaje.glifos_refs.forEach(ref => {
          const glifo = heroGlyphs.glifos.find(g => g.id === ref.id);
          if (glifo) {
            prompt += `- **${glifo.nombre}** (${glifo.rareza}) - Nivel ${ref.nivel_actual}/${ref.nivel_maximo}\n`;
            if (glifo.efecto_base) prompt += `  - ${glifo.efecto_base}\n`;
          }
        });

        const disponiblesGlifos = heroGlyphs.glifos.filter(g => g.id && !equipadosGlifosIds.has(g.id));
        if (disponiblesGlifos.length > 0) {
          prompt += `\n### Glifos Disponibles NO Equipados (${disponiblesGlifos.length})\n`;
          disponiblesGlifos.forEach(glifo => {
            prompt += `- **${glifo.nombre}** (${glifo.rareza})\n`;
            if (glifo.efecto_base) prompt += `  - ${glifo.efecto_base}\n`;
          });
        }
      }
    } catch (error) {
      console.error('Error cargando glifos:', error);
    }

    // Aspectos equipados vs disponibles
    try {
      const heroAspects = await WorkspaceService.loadHeroAspects(personaje.clase);
      if (heroAspects && personaje.aspectos_refs) {
        prompt += `\n## Aspectos: Equipados vs Disponibles\n\n`;
        
        const equipadosAspectosIds = new Set(personaje.aspectos_refs.map(ref => 
          typeof ref === 'string' ? ref : ref.aspecto_id
        ));
        
        prompt += `### Aspectos Equipados (${personaje.aspectos_refs.length})\n`;
        for (const ref of personaje.aspectos_refs) {
          const aspectoId = typeof ref === 'string' ? ref : ref.aspecto_id;
          const aspecto = heroAspects.aspectos.find(a => a.id === aspectoId);
          if (aspecto) {
            prompt += `- **${aspecto.name}** (${aspecto.category})\n`;
            prompt += `  - ${aspecto.effect}\n`;
          }
        }

        const disponiblesAspectos = heroAspects.aspectos.filter(a => !equipadosAspectosIds.has(a.id));
        if (disponiblesAspectos.length > 0) {
          prompt += `\n### Aspectos Disponibles NO Equipados (${disponiblesAspectos.length})\n`;
          disponiblesAspectos.forEach(aspecto => {
            prompt += `- **${aspecto.name}** (${aspecto.category})\n`;
            prompt += `  - ${aspecto.effect}\n`;
          });
        }
      }
    } catch (error) {
      console.error('Error cargando aspectos:', error);
    }

    // Preguntas de comparación
    prompt += `\n## Análisis Solicitado\n\n`;
    prompt += `### 1. Cambios Recomendados de Habilidades\n`;
    prompt += `- ¿Qué habilidades equipadas deberían reemplazarse y por cuáles?\n`;
    prompt += `- ¿Por qué esos cambios mejorarían el build?\n`;
    prompt += `- ¿Hay modificadores que no están siendo aprovechados?\n\n`;
    
    prompt += `### 2. Optimización de Glifos\n`;
    prompt += `- ¿Qué glifos equipados son subóptimos?\n`;
    prompt += `- ¿Qué glifos disponibles ofrecen mejor valor?\n`;
    prompt += `- Orden de prioridad para nivel de glifos (1-5)\n\n`;
    
    prompt += `### 3. Mejoras de Aspectos\n`;
    prompt += `- ¿Qué aspectos equipados no aportan suficiente valor?\n`;
    prompt += `- ¿Qué aspectos disponibles crean mejores sinergias?\n`;
    prompt += `- Top 3 aspectos a conseguir/equipar\n\n`;
    
    prompt += `### 4. Conclusión\n`;
    prompt += `Resume los 5 cambios más impactantes que puede hacer usando SOLO lo que ya tiene disponible.\n`;

    return prompt;
  }

  // Generar prompt básico del personaje
  static async generatePrompt(personaje: Personaje, config: PromptConfig): Promise<string> {
    let prompt = `# Consulta sobre Build de Diablo 4\n\n`;
    prompt += `## Información del Personaje\n`;
    prompt += `- **Nombre**: ${personaje.nombre}\n`;
    prompt += `- **Clase**: ${personaje.clase}\n`;
    prompt += `- **Nivel**: ${personaje.nivel}\n`;
    
    if (personaje.nivel_paragon) {
      prompt += `- **Nivel Paragon**: ${personaje.nivel_paragon}\n`;
    }

    if (config.incluir_estadisticas && personaje.estadisticas) {
      prompt += `\n## Estadísticas del Personaje\n`;
      Object.entries(personaje.estadisticas).forEach(([key, value]) => {
        if (value) {
          prompt += `- **${this.formatStatName(key)}**: ${value}\n`;
        }
      });
    }

    // Cargar habilidades desde el héroe usando referencias
    if (config.incluir_habilidades && personaje.habilidades_refs) {
      try {
        const heroSkills = await WorkspaceService.loadHeroSkills(personaje.clase);
        
        if (heroSkills) {
          // Resolver habilidades activas
          const activeSkills: HabilidadActiva[] = personaje.habilidades_refs.activas
            .map(ref => heroSkills.habilidades_activas.find(s => s.id === ref.skill_id))
            .filter((skill): skill is HabilidadActiva => skill !== undefined);

          if (activeSkills.length > 0) {
            prompt += `\n## Habilidades Activas\n`;
            activeSkills.forEach(skill => {
              prompt += `\n### ${skill.nombre} (${skill.tipo} - ${skill.rama})\n`;
              prompt += `- **Nivel**: ${skill.nivel}\n`;
              prompt += `- **Descripción**: ${skill.descripcion}\n`;
              
              if (skill.tipo_danio) {
                prompt += `- **Tipo de Daño**: ${skill.tipo_danio}\n`;
              }

              if (skill.modificadores && skill.modificadores.length > 0) {
                prompt += `- **Modificadores**:\n`;
                skill.modificadores.forEach(mod => {
                  prompt += `  - ${mod.nombre}: ${mod.descripcion}\n`;
                });
              }
            });
          }

          // Resolver habilidades pasivas
          const passiveSkills: HabilidadPasiva[] = personaje.habilidades_refs.pasivas
            .map(ref => {
              const skillId = typeof ref === 'string' ? ref : ref.skill_id;
              return heroSkills.habilidades_pasivas.find(s => s.id === skillId);
            })
            .filter((skill): skill is HabilidadPasiva => skill !== undefined);

          if (passiveSkills.length > 0) {
            prompt += `\n## Habilidades Pasivas\n`;
            passiveSkills.forEach(skill => {
              prompt += `- **${skill.nombre}** (Nivel ${skill.nivel}): ${skill.efecto}\n`;
            });
          }
        }
      } catch (error) {
        console.error('Error cargando habilidades del héroe:', error);
      }
    }

    // Cargar glifos desde el héroe usando referencias
    if (config.incluir_glifos && personaje.glifos_refs) {
      try {
        const heroGlyphs = await WorkspaceService.loadHeroGlyphs(personaje.clase);
        
        if (heroGlyphs) {
          // Resolver glifos con nivel actual del personaje
          const characterGlyphs = personaje.glifos_refs
            .map(glyphRef => {
              const glifo = heroGlyphs.glifos.find(g => g.id === glyphRef.id);
              return glifo ? { ...glifo, nivel_actual: glyphRef.nivel_actual } : null;
            })
            .filter((glyph): glyph is Glifo & { nivel_actual: number } => glyph !== null);

          if (characterGlyphs.length > 0) {
            prompt += `\n## Glifos Equipados\n`;
            characterGlyphs.forEach(glyph => {
              prompt += `\n### ${glyph.nombre} (${glyph.rareza})\n`;
              prompt += `- **Nivel Actual**: ${glyph.nivel_actual}\n`;
              
              if (glyph.atributo_escalado) {
                prompt += `- **Escala con**: ${glyph.atributo_escalado.atributo}\n`;
                prompt += `- **Bonificación**: ${glyph.atributo_escalado.bonificacion}\n`;
              }

              if (glyph.efecto_base) {
                prompt += `- **Efecto Base**: ${glyph.efecto_base}\n`;
              }

              if (glyph.bonificacion_adicional) {
                prompt += `- **Bonificación Adicional**: ${glyph.bonificacion_adicional.descripcion}\n`;
              }

              if (glyph.bonificacion_legendaria) {
                prompt += `- **Bonificación Legendaria**: ${glyph.bonificacion_legendaria.descripcion}\n`;
              }

              if (glyph.tamano_radio) {
                prompt += `- **Tamaño/Radio**: ${glyph.tamano_radio}\n`;
              }
            });
          }
        }
      } catch (error) {
        console.error('Error cargando glifos del héroe:', error);
      }
    }

    if (personaje.notas) {
      prompt += `\n## Notas Adicionales\n`;
      prompt += personaje.notas + '\n';
    }

    if (config.pregunta_personalizada) {
      prompt += `\n## Pregunta\n`;
      prompt += config.pregunta_personalizada + '\n';
    }

    return prompt;
  }

  // Generar prompt enfocado en sinergias
  static async generateSynergyPrompt(personaje: Personaje): Promise<string> {
    return await this.generatePrompt(personaje, {
      incluir_habilidades: true,
      incluir_glifos: true,
      incluir_estadisticas: true,
      pregunta_personalizada: `Analiza las sinergias entre las habilidades activas y los glifos equipados. 
Identifica:
1. Qué combinaciones funcionan bien y por qué
2. Qué glifos podrían optimizarse o cambiarse
3. Sugerencias de modificadores alternativos
4. Posibles debilidades en el build actual`
    });
  }

  // Generar prompt enfocado en optimización
  static async generateOptimizationPrompt(personaje: Personaje): Promise<string> {
    return await this.generatePrompt(personaje, {
      incluir_habilidades: true,
      incluir_glifos: true,
      incluir_estadisticas: true,
      pregunta_personalizada: `Analiza este build y proporciona recomendaciones para optimizarlo:
1. ¿Hay mejores opciones de habilidades para el objetivo del build?
2. ¿Los glifos elegidos son óptimos?
3. ¿Qué estadísticas debería priorizar?
4. ¿Hay sinergias no aprovechadas?
5. Sugerencias de aspectos legendarios que complementen el build`
    });
  }

  // Generar prompt de comparación
  static async generateComparisonPrompt(personaje1: Personaje, personaje2: Personaje): Promise<string> {
    let prompt = `# Comparación de Builds de Diablo 4\n\n`;
    
    prompt += `## Build 1: ${personaje1.nombre}\n`;
    prompt += await this.generatePrompt(personaje1, {
      incluir_habilidades: true,
      incluir_glifos: true,
      incluir_estadisticas: false
    });

    prompt += `\n---\n\n`;
    
    prompt += `## Build 2: ${personaje2.nombre}\n`;
    prompt += await this.generatePrompt(personaje2, {
      incluir_habilidades: true,
      incluir_glifos: true,
      incluir_estadisticas: false
    });

    prompt += `\n## Pregunta\n`;
    prompt += `Compara estos dos builds y proporciona:
1. Principales diferencias en el enfoque y estilo de juego
2. Ventajas y desventajas de cada build
3. Cuál es mejor para diferentes tipos de contenido (campaña, mazmorras, jefes, PvP)
4. Sugerencias para mejorar cada uno`;

    return prompt;
  }

  // Formatear nombres de estadísticas
  private static formatStatName(key: string): string {
    const translations: { [key: string]: string } = {
      vida_maxima: 'Vida Máxima',
      armadura: 'Armadura',
      fuerza: 'Fuerza',
      destreza: 'Destreza',
      inteligencia: 'Inteligencia',
      voluntad: 'Voluntad'
    };
    return translations[key] || key;
  }

  // Helper: Formatear estadísticas detalladas
  private static async formatEstadisticasDetalladas(estadisticas: any): Promise<string> {
    let prompt = `\n## Estadísticas del Personaje\n\n`;
    
    const extractValue = (field: any): string => {
      if (field === undefined || field === null) return 'N/A';
      if (typeof field === 'object' && 'valor' in field) return String(field.valor);
      if (typeof field === 'object' && 'actual' in field) return String(field.actual);
      return String(field);
    };

    // Personaje
    if (estadisticas.personaje) {
      prompt += `### Core\n`;
      if (estadisticas.personaje.danioArma) prompt += `- Daño Arma: ${extractValue(estadisticas.personaje.danioArma)}\n`;
      if (estadisticas.personaje.aguante) prompt += `- Aguante: ${extractValue(estadisticas.personaje.aguante)}\n`;
    }

    // Atributos principales
    if (estadisticas.atributosPrincipales) {
      prompt += `\n### Atributos Principales\n`;
      const attrs = estadisticas.atributosPrincipales;
      if (attrs.nivel) prompt += `- Nivel: ${extractValue(attrs.nivel)}\n`;
      if (attrs.fuerza) prompt += `- Fuerza: ${extractValue(attrs.fuerza)}\n`;
      if (attrs.destreza) prompt += `- Destreza: ${extractValue(attrs.destreza)}\n`;
      if (attrs.inteligencia) prompt += `- Inteligencia: ${extractValue(attrs.inteligencia)}\n`;
      if (attrs.voluntad) prompt += `- Voluntad: ${extractValue(attrs.voluntad)}\n`;
    }

    // Ofensivo
    if (estadisticas.ofensivo) {
      prompt += `\n### Estadísticas Ofensivas\n`;
      const off = estadisticas.ofensivo;
      if (off.probabilidadGolpeCritico) prompt += `- Probabilidad Crítico: ${extractValue(off.probabilidadGolpeCritico)}%\n`;
      if (off.danioGolpeCritico) prompt += `- Daño Crítico: ${extractValue(off.danioGolpeCritico)}%\n`;
      if (off.danioContraEnemigosVulnerables) prompt += `- Daño vs Vulnerables: ${extractValue(off.danioContraEnemigosVulnerables)}%\n`;
      if (off.todoElDanio) prompt += `- Todo el Daño: ${extractValue(off.todoElDanio)}%\n`;
      if (off.probabilidadAbrumar) prompt += `- Probabilidad Abrumar: ${extractValue(off.probabilidadAbrumar)}%\n`;
      if (off.danioAbrumador) prompt += `- Daño Abrumador: ${extractValue(off.danioAbrumador)}%\n`;
    }

    // Defensivo
    if (estadisticas.defensivo) {
      prompt += `\n### Estadísticas Defensivas\n`;
      const def = estadisticas.defensivo;
      if (def.vidaMaxima) prompt += `- Vida Máxima: ${extractValue(def.vidaMaxima)}\n`;
      if (def.probabilidadBloqueo) prompt += `- Prob. Bloqueo: ${extractValue(def.probabilidadBloqueo)}%\n`;
      if (def.reduccionBloqueo) prompt += `- Reducción Bloqueo: ${extractValue(def.reduccionBloqueo)}%\n`;
      if (def.bonificacionBarrera) prompt += `- Bonif. Barrera: ${extractValue(def.bonificacionBarrera)}%\n`;
      if (def.bonificacionFortificacion) prompt += `- Bonif. Fortificación: ${extractValue(def.bonificacionFortificacion)}%\n`;
      if (def.probabilidadEsquivar) prompt += `- Prob. Esquivar: ${extractValue(def.probabilidadEsquivar)}%\n`;
    }

    // Armadura y resistencias
    if (estadisticas.armaduraYResistencias) {
      prompt += `\n### Armadura y Resistencias\n`;
      const arm = estadisticas.armaduraYResistencias;
      if (arm.armadura) prompt += `- Armadura: ${extractValue(arm.armadura)}\n`;
      if (arm.resistenciaDanioFisico) prompt += `- Resist. Físico: ${extractValue(arm.resistenciaDanioFisico)}\n`;
      if (arm.resistenciaFuego) prompt += `- Resist. Fuego: ${extractValue(arm.resistenciaFuego)}\n`;
      if (arm.resistenciaRayo) prompt += `- Resist. Rayo: ${extractValue(arm.resistenciaRayo)}\n`;
      if (arm.resistenciaFrio) prompt += `- Resist. Frío: ${extractValue(arm.resistenciaFrio)}\n`;
      if (arm.resistenciaVeneno) prompt += `- Resist. Veneno: ${extractValue(arm.resistenciaVeneno)}\n`;
      if (arm.resistenciaSombra) prompt += `- Resist. Sombra: ${extractValue(arm.resistenciaSombra)}\n`;
    }

    return prompt;
  }

  // Helper: Formatear habilidades equipadas
  private static async formatHabilidadesEquipadas(personaje: Personaje): Promise<string> {
    let prompt = '';
    
    try {
      const heroSkills = await WorkspaceService.loadHeroSkills(personaje.clase);
      
      if (heroSkills && personaje.habilidades_refs) {
        // Activas
        const activeSkills: HabilidadActiva[] = (personaje.habilidades_refs.activas || [])
          .map(ref => heroSkills.habilidades_activas.find(s => s.id === ref.skill_id))
          .filter((skill): skill is HabilidadActiva => skill !== undefined);

        if (activeSkills.length > 0) {
          prompt += `\n## Habilidades Activas\n`;
          activeSkills.forEach(skill => {
            prompt += `\n### ${skill.nombre} (${skill.tipo} - ${skill.rama})\n`;
            prompt += `- **Descripción**: ${skill.descripcion}\n`;
            if (skill.tipo_danio) prompt += `- **Tipo de Daño**: ${skill.tipo_danio}\n`;
            if (skill.modificadores && skill.modificadores.length > 0) {
              prompt += `- **Modificadores**:\n`;
              skill.modificadores.forEach(mod => {
                prompt += `  - ${mod.nombre}: ${mod.descripcion}\n`;
              });
            }
          });
        }

        // Pasivas
        const passiveSkills: HabilidadPasiva[] = (personaje.habilidades_refs.pasivas || [])
          .map(ref => {
            const skillId = typeof ref === 'string' ? ref : ref.skill_id;
            return heroSkills.habilidades_pasivas.find(s => s.id === skillId);
          })
          .filter((skill): skill is HabilidadPasiva => skill !== undefined);

        if (passiveSkills.length > 0) {
          prompt += `\n## Habilidades Pasivas\n`;
          passiveSkills.forEach(skill => {
            prompt += `- **${skill.nombre}**: ${skill.efecto}\n`;
          });
        }
      }
    } catch (error) {
      console.error('Error cargando habilidades:', error);
    }

    return prompt;
  }

  // Helper: Formatear glifos equipados
  private static async formatGlifosEquipados(personaje: Personaje): Promise<string> {
    let prompt = '';
    
    try {
      const heroGlyphs = await WorkspaceService.loadHeroGlyphs(personaje.clase);
      
      if (heroGlyphs && personaje.glifos_refs && personaje.glifos_refs.length > 0) {
        prompt += `\n## Glifos Equipados\n`;
        
        personaje.glifos_refs.forEach(glyphRef => {
          const glifo = heroGlyphs.glifos.find(g => g.id === glyphRef.id);
          if (glifo) {
            prompt += `\n### ${glifo.nombre} (${glifo.rareza})\n`;
            prompt += `- **Nivel**: ${glyphRef.nivel_actual}/${glyphRef.nivel_maximo}\n`;
            if (glifo.efecto_base) prompt += `- **Efecto**: ${glifo.efecto_base}\n`;
            if (glifo.atributo_escalado) {
              prompt += `- **Escala con**: ${glifo.atributo_escalado.atributo} (${glifo.atributo_escalado.bonificacion})\n`;
            }
          }
        });
      }
    } catch (error) {
      console.error('Error cargando glifos:', error);
    }

    return prompt;
  }

  // Helper: Formatear aspectos equipados
  private static async formatAspectosEquipados(personaje: Personaje): Promise<string> {
    let prompt = '';
    
    try {
      const heroAspects = await WorkspaceService.loadHeroAspects(personaje.clase);
      
      if (heroAspects && personaje.aspectos_refs && personaje.aspectos_refs.length > 0) {
        prompt += `\n## Aspectos Equipados\n`;
        
        for (const ref of personaje.aspectos_refs) {
          const aspectoId = typeof ref === 'string' ? ref : ref.aspecto_id;
          const aspecto = heroAspects.aspectos.find(a => a.id === aspectoId);
          
          if (aspecto) {
            prompt += `\n### ${aspecto.name} (${aspecto.category})\n`;
            prompt += `- **Efecto**: ${aspecto.effect}\n`;
            if (typeof ref === 'object' && ref.nivel_actual) {
              prompt += `- **Nivel**: ${ref.nivel_actual}\n`;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error cargando aspectos:', error);
    }

    return prompt;
  }

  // Helper: Dividir prompt largo en múltiples partes
  static splitIntoMultiplePrompts(prompt: string, maxTokens: number = 8000): string[] {
    // Estimación: ~4 caracteres por token
    const maxChars = maxTokens * 4;
    
    if (prompt.length <= maxChars) {
      return [prompt];
    }

    const parts: string[] = [];
    const sections = prompt.split(/\n## /); // Dividir por secciones principales
    let currentPart = '';
    let partNumber = 1;

    for (let i = 0; i < sections.length; i++) {
      const section = i === 0 ? sections[i] : `## ${sections[i]}`;
      
      // Si agregar esta sección excede el límite
      if (currentPart.length + section.length > maxChars && currentPart.length > 0) {
        // Guardar la parte actual
        parts.push(this.wrapPromptPart(currentPart, partNumber, -1)); // -1 temporal, lo actualizaremos después
        partNumber++;
        currentPart = '';
      }
      
      currentPart += section + '\n';
    }

    // Agregar la última parte
    if (currentPart.trim().length > 0) {
      parts.push(currentPart);
    }

    // Actualizar todas las partes con el total
    const totalParts = parts.length;
    if (totalParts > 1) {
      return parts.map((part, index) => 
        this.wrapPromptPart(part, index + 1, totalParts)
      );
    }

    return parts;
  }

  // Helper: Envolver parte del prompt con header informativo
  private static wrapPromptPart(content: string, partNumber: number, totalParts: number): string {
    if (totalParts <= 1) return content;
    
    const header = `# PARTE ${partNumber} de ${totalParts}\n\n`;
    const footer = totalParts > 1 && partNumber < totalParts 
      ? `\n\n---\n**Nota**: Esta es la parte ${partNumber} de ${totalParts}. Continúa en la siguiente parte.\n`
      : `\n\n---\n**Nota**: Esta es la última parte (${partNumber} de ${totalParts}).\n`;
    
    return header + content + footer;
  }

  // Generar prompts enriquecidos con tags (versión mejorada)
  static async generateEnrichedPrompt(personaje: Personaje, config: PromptConfig & { incluir_tags?: boolean, max_tokens?: number }): Promise<string[]> {
    const basePrompt = await this.generatePrompt(personaje, config);
    
    // Si se solicita incluir tags, enriquecer el prompt
    let enrichedPrompt = basePrompt;
    if (config.incluir_tags) {
      // Aquí podrías cargar tags globales y enriquecer el prompt
      // Por ahora, solo dividimos el prompt
    }
    
    // Dividir en múltiples partes si es necesario
    const maxTokens = config.max_tokens || 8000;
    return this.splitIntoMultiplePrompts(enrichedPrompt, maxTokens);
  }

  // Estimar longitud del prompt en tokens
  static estimateTokenCount(prompt: string): number {
    // Estimación simple: ~4 caracteres por token
    return Math.ceil(prompt.length / 4);
  }

  // Copiar al portapapeles
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
      return false;
    }
  }
}
