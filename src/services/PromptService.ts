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
    if (personaje.puertas_anexo) {
      prompt += `\n- **Puertas de Anexo**: ${personaje.puertas_anexo} (otorga +${personaje.puertas_anexo * 5} a todos los atributos principales)`;
    }
    prompt += `\n\n`;

    // Atributos principales con bonus de puertas
    if (personaje.estadisticas?.atributosPrincipales) {
      const atrib = personaje.estadisticas.atributosPrincipales;
      const bonusPuertas = (personaje.puertas_anexo || 0) * 5;
      
      prompt += `## Atributos Principales\n`;
      prompt += `- **Fuerza**: ${(atrib.fuerza || 0) + bonusPuertas}`;
      if (bonusPuertas > 0) prompt += ` (${atrib.fuerza} base + ${bonusPuertas} puertas)`;
      prompt += `\n`;
      prompt += `- **Inteligencia**: ${(atrib.inteligencia || 0) + bonusPuertas}`;
      if (bonusPuertas > 0) prompt += ` (${atrib.inteligencia} base + ${bonusPuertas} puertas)`;
      prompt += `\n`;
      prompt += `- **Voluntad**: ${(atrib.voluntad || 0) + bonusPuertas}`;
      if (bonusPuertas > 0) prompt += ` (${atrib.voluntad} base + ${bonusPuertas} puertas)`;
      prompt += `\n`;
      prompt += `- **Destreza**: ${(atrib.destreza || 0) + bonusPuertas}`;
      if (bonusPuertas > 0) prompt += ` (${atrib.destreza} base + ${bonusPuertas} puertas)`;
      prompt += `\n\n`;
    }

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

    // Sistema Paragon (mejorado con conteo de nodos activos)
    if (personaje.paragon_refs || personaje.paragon || personaje.atributos_paragon) {
      prompt += await this.formatParagonEquipado(personaje);
      
      // Agregar información adicional de nodos activos
      const nodosHuerfanos = personaje.paragon_refs?.nodos_huerfanos || [];
      const nodosEnTableros = personaje.paragon_refs?.tableros_equipados?.flatMap(t => 
        t.nodos_activados_ids || []
      ) || [];
      const totalNodosActivos = nodosHuerfanos.length + nodosEnTableros.length;
      
      if (totalNodosActivos > 0) {
        prompt += `\n**IMPORTANTE**: Nodos activos totales: ${totalNodosActivos}`;
        if (nodosHuerfanos.length > 0) {
          prompt += ` (incluye ${nodosHuerfanos.length} nodos huérfanos sin tablero asignado)`;
        }
        prompt += `\n`;
      }
    }

    // Pregunta de análisis
    prompt += `\n## Tarea de Análisis\n\n`;
    prompt += `Proporciona un análisis detallado del build:\n\n`;
    prompt += `### 1. Evaluación General (0-10)\n`;
    prompt += `- **Coherencia del Build**: ¿Las habilidades, glifos y aspectos trabajan juntos?\n`;
    prompt += `- **Optimización de Stats**: ¿Las estadísticas están bien distribuidas?\n`;
    prompt += `- **Viabilidad**: ¿Es viable para contenido endgame?\n`;
    prompt += `- **Sistema Paragon**: ¿La configuración Paragon es óptima?\n\n`;
    
    prompt += `### 2. Fortalezas Identificadas\n`;
    prompt += `- ¿Qué está haciendo bien este build?\n`;
    prompt += `- ¿Qué sinergias efectivas existen?\n`;
    prompt += `- ¿Qué aspectos son particularmente fuertes?\n`;
    prompt += `- ¿Los tableros y nodos Paragon complementan el build?\n\n`;
    
    prompt += `### 3. Debilidades y Puntos Críticos\n`;
    prompt += `- ¿Qué carencias tiene el build?\n`;
    prompt += `- ¿Hay habilidades/glifos/aspectos que no aportan valor?\n`;
    prompt += `- ¿Qué mecánicas del juego no está aprovechando?\n`;
    prompt += `- ¿La configuración Paragon es óptima para el build?\n`;
    prompt += `- ¿Debería conseguir más puertas de anexo?\n\n`;
    
    prompt += `### 4. Prioridades de Optimización\n`;
    prompt += `Ordena por importancia (1 = más urgente):\n`;
    prompt += `- Estadísticas a mejorar\n`;
    prompt += `- Habilidades a cambiar\n`;
    prompt += `- Glifos a reemplazar\n`;
    prompt += `- Aspectos a buscar\n`;
    prompt += `- Tableros Paragon a optimizar\n`;
    prompt += `- Nodos Paragon a activar/cambiar\n`;
    prompt += `- Puertas de Anexo a conseguir\n\n`;
    
    prompt += `### 5. Plan de Acción Inmediato\n`;
    prompt += `Dame 3-5 cambios concretos que pueda hacer YA para mejorar el rendimiento.\n`;

    return prompt;
  }

  // Generar prompt de comparación con pool del héroe
  static async generatePoolComparisonPrompt(personaje: Personaje): Promise<string> {
    let prompt = `# Comparación: Equipado vs Disponible - ${personaje.nombre}\n\n`;
    
    prompt += `Eres un experto en teorycrafting de Diablo 4. Compara lo que el personaje tiene equipado contra todas las opciones disponibles.\n\n`;

    // Info del personaje con atributos
    prompt += `## Información del Personaje\n`;
    prompt += `- **Clase**: ${personaje.clase} | **Nivel**: ${personaje.nivel}`;
    if (personaje.nivel_paragon) {
      prompt += ` | **Nivel Paragon**: ${personaje.nivel_paragon}`;
    }
    if (personaje.puertas_anexo) {
      prompt += `\n- **Puertas de Anexo**: ${personaje.puertas_anexo} (+${personaje.puertas_anexo * 5} a todos los atributos)`;
    }
    prompt += `\n\n`;

    // Atributos con bonus
    if (personaje.estadisticas?.atributosPrincipales) {
      const atrib = personaje.estadisticas.atributosPrincipales;
      const bonusPuertas = (personaje.puertas_anexo || 0) * 5;
      
      prompt += `### Atributos Principales\n`;
      prompt += `- Fuerza: ${(atrib.fuerza || 0) + bonusPuertas}`;
      if (bonusPuertas > 0) prompt += ` (base: ${atrib.fuerza})`;
      prompt += ` | Inteligencia: ${(atrib.inteligencia || 0) + bonusPuertas}`;
      if (bonusPuertas > 0) prompt += ` (base: ${atrib.inteligencia})`;
      prompt += `\n- Voluntad: ${(atrib.voluntad || 0) + bonusPuertas}`;
      if (bonusPuertas > 0) prompt += ` (base: ${atrib.voluntad})`;
      prompt += ` | Destreza: ${(atrib.destreza || 0) + bonusPuertas}`;
      if (bonusPuertas > 0) prompt += ` (base: ${atrib.destreza})`;
      prompt += `\n\n`;
    }
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
    // Paragon equipado vs disponible
    if (personaje.paragon_refs || personaje.paragon || personaje.atributos_paragon) {
      try {
        const paragonBoards = await WorkspaceService.loadParagonBoards(personaje.clase);
        const paragonNodes = await WorkspaceService.loadParagonNodes(personaje.clase);
        
        if (paragonBoards || paragonNodes) {
          prompt += `\n## Sistema Paragon: Equipado vs Disponible\n\n`;
          
          // Tableros equipados vs disponibles (nuevo modelo de referencias v0.5.1)
          const tablerosEquipados = personaje.paragon_refs?.tableros_equipados || personaje.paragon?.tableros_equipados || [];
          
          if (paragonBoards && tablerosEquipados && tablerosEquipados.length > 0) {
            const equipadosTablerosIds = new Set(
              tablerosEquipados.map((t: any) => t.tablero_id)
            );
            
            prompt += `### Tableros Equipados (${tablerosEquipados.length})\n`;
            tablerosEquipados.forEach((tableroEquip: any) => {
              const tablero = paragonBoards.tableros?.find((t: any) => t.id === tableroEquip.tablero_id);
              if (tablero) {
                prompt += `- **${tablero.nombre}** (Posición ${tableroEquip.posicion})\n`;
                prompt += `  - Nodos activados: ${tableroEquip.nodos_activados?.length || 0}\n`;
                if (tablero.bonificacion_especial) {
                  prompt += `  - Bonificación: ${tablero.bonificacion_especial.descripcion}\n`;
                }
              }
            });
            
            // Tableros disponibles NO equipados
            const disponiblesTableros = paragonBoards.tableros?.filter(
              (t: any) => t.id && !equipadosTablerosIds.has(t.id)
            ) || [];
            
            if (disponiblesTableros.length > 0) {
              prompt += `\n### Tableros Disponibles NO Equipados (${disponiblesTableros.length})\n`;
              disponiblesTableros.forEach((tablero: any) => {
                prompt += `- **${tablero.nombre}**\n`;
                if (tablero.bonificacion_especial) {
                  prompt += `  - ${tablero.bonificacion_especial.descripcion}\n`;
                }
              });
            }
          }
          
          // @deprecated (v0.5.3) - Los atributos acumulados se manejan en estadisticas. atributosPrincipales
          // Los atributos Paragon se suman directamente a los atributos principales del personaje
          // Ya no duplicamos esta información en paragon.atributos_acumulados
        }
      } catch (error) {
        console.error('Error cargando datos Paragon:', error);
      }
    }

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
    
    prompt += `### 4. Optimización del Sistema Paragon\n`;
    prompt += `- ¿Los tableros equipados son los más adecuados para este build?\n`;
    prompt += `- ¿Qué nodos Paragon deberían priorizarse?\n`;
    prompt += `- ¿Hay tableros disponibles que ofrezcan mejores sinergias?\n\n`;
    
    prompt += `### 5. Conclusión\n`;
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

  // Helper: Formatear sistema Paragon equipado
  private static async formatParagonEquipado(personaje: Personaje): Promise<string> {
    let prompt = '';
    
    try {
      // Usar nuevo modelo de referencias (v0.5.1) con retrocompatibilidad
      const paragonRefs = personaje.paragon_refs;
      const atributosParagon = personaje.atributos_paragon;
      const paragonLegacy = personaje.paragon; // Retrocompatibilidad
      
      if (!paragonRefs && !paragonLegacy && !atributosParagon) return prompt;
      
      const paragonBoards = await WorkspaceService.loadParagonBoards(personaje.clase);
      
      prompt += `\n## Sistema Paragon\n`;
      
      // Información general de Paragon (desde atributos_paragon o paragon legacy)
      prompt += `\n### Progresión Paragon\n`;
      const nivelParagon = atributosParagon?.nivel_paragon ?? paragonLegacy?.nivel_paragon;
      const puntosGastados = atributosParagon?.puntos_gastados ?? paragonLegacy?.puntos_gastados;
      const puntosDisponibles = atributosParagon?.puntos_disponibles ?? paragonLegacy?.puntos_disponibles;
      
      if (nivelParagon !== undefined && nivelParagon !== null) {
        prompt += `- **Nivel Paragon**: ${nivelParagon}\n`;
      }
      if (puntosGastados !== undefined) {
        prompt += `- **Puntos Gastados**: ${puntosGastados}\n`;
      }
      if (puntosDisponibles !== undefined) {
        prompt += `- **Puntos Disponibles**: ${puntosDisponibles}\n`;
      }
      
      // Tableros equipados (desde paragon_refs o paragon legacy)
      const tablerosEquipados = paragonRefs?.tableros_equipados || paragonLegacy?.tableros_equipados || [];
      
      if (paragonBoards && tablerosEquipados && tablerosEquipados.length > 0) {
        prompt += `\n### Tableros Equipados (${tablerosEquipados.length})\n`;
        
        tablerosEquipados.forEach((tableroEquip: any) => {
          const tablero = paragonBoards.tableros?.find((t: any) => t.id === tableroEquip.tablero_id);
          if (tablero) {
            prompt += `\n#### ${tablero.nombre}\n`;
            prompt += `- **Posición**: ${tableroEquip.posicion}\n`;
            if (tableroEquip.rotacion !== undefined) {
              prompt += `- **Rotación**: ${tableroEquip.rotacion}°\n`;
            }
            if (tableroEquip.nodos_activados && tableroEquip.nodos_activados.length > 0) {
              prompt += `- **Nodos Activados**: ${tableroEquip.nodos_activados.length}\n`;
            }
            if (tablero.bonificacion_especial) {
              prompt += `- **Bonificación**: ${tablero.bonificacion_especial.descripcion}\n`;
            }
            if (tableroEquip.zocalo_glifo) {
              prompt += `- **Glifo Equipado**: ${tableroEquip.zocalo_glifo.glifo_id} (Nivel ${tableroEquip.zocalo_glifo.nivel_glifo})\n`;
            }
          }
        });
      }
      
      // @deprecated (v0.5.3) - Los atributos acumulados se manejan en estadisticas.atributosPrincipales
      // Los atributos Paragon se suman directamente a los atributos principales del personaje
      // Ya no duplicamos esta información en paragon.atributos_acumulados
      
      // Nodos activados totales (desde paragon_refs o paragon legacy)
      const nodosActivadosTotal = paragonRefs?.nodos_activados_ids || paragonLegacy?.nodos_activados_total || [];
      
      if (nodosActivadosTotal && nodosActivadosTotal.length > 0) {
        prompt += `\n### Total de Nodos Activados: ${nodosActivadosTotal.length}\n`;
      }
      
      // Nodos huérfanos (solo en paragon_refs v0.5.1)
      if (paragonRefs?.nodos_huerfanos && paragonRefs.nodos_huerfanos.length > 0) {
        prompt += `\n### Nodos Huérfanos (sin tablero asignado): ${paragonRefs.nodos_huerfanos.length}\n`;
        prompt += `- Estos nodos se enlazarán automáticamente al agregar los tableros correspondientes\n`;
      }
      
    } catch (error) {
      console.error('Error cargando datos Paragon:', error);
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

  // ============================================================================
  // PROMPTS DE ANÁLISIS DE PARAGON (v0.5.2+)
  // ============================================================================

  /**
   * Generar prompt de análisis completo del sistema Paragon
   * Analiza tableros, nodos, glifos, atributos acumulados y balance general
   */
  static async generateParagonAnalysisPrompt(personaje: Personaje): Promise<string> {
    let prompt = `# Análisis del Sistema Paragon - ${personaje.nombre} (${personaje.clase})\n\n`;
    
    prompt += `Eres un experto en el sistema Paragon de Diablo 4. Analiza la configuración actual de este personaje.\n\n`;
    
    // Información básica del personaje
    prompt += `## Información del Personaje\n`;
    prompt += `- **Clase**: ${personaje.clase}\n`;
    prompt += `- **Nivel**: ${personaje.nivel}\n`;
    if (personaje.nivel_paragon) {
      prompt += `- **Nivel Paragon**: ${personaje.nivel_paragon}\n`;
    }
    if (personaje.puertas_anexo) {
      prompt += `- **Puertas de Anexo**: ${personaje.puertas_anexo} (+${personaje.puertas_anexo * 5} a cada atributo principal)\n`;
    }
    prompt += `\n`;

    // Atributos principales actuales (incluyendo bonus de puertas)
    if (personaje.estadisticas?.atributosPrincipales) {
      const atrib = personaje.estadisticas.atributosPrincipales;
      const bonusPuertas = (personaje.puertas_anexo || 0) * 5;
      
      prompt += `## Atributos Principales\n`;
      prompt += `- **Fuerza**: ${(atrib.fuerza || 0) + bonusPuertas}`;
      if (bonusPuertas > 0) prompt += ` (${atrib.fuerza} base + ${bonusPuertas} puertas)`;
      prompt += `\n`;
      prompt += `- **Inteligencia**: ${(atrib.inteligencia || 0) + bonusPuertas}`;
      if (bonusPuertas > 0) prompt += ` (${atrib.inteligencia} base + ${bonusPuertas} puertas)`;
      prompt += `\n`;
      prompt += `- **Voluntad**: ${(atrib.voluntad || 0) + bonusPuertas}`;
      if (bonusPuertas > 0) prompt += ` (${atrib.voluntad} base + ${bonusPuertas} puertas)`;
      prompt += `\n`;
      prompt += `- **Destreza**: ${(atrib.destreza || 0) + bonusPuertas}`;
      if (bonusPuertas > 0) prompt += ` (${atrib.destreza} base + ${bonusPuertas} puertas)`;
      prompt += `\n\n`;
    }

    // Sistema Paragon detallado
    prompt += await this.formatParagonEquipado(personaje);

    // Cargar catálogos para análisis detallado
    try {
      const paragonNodes = await WorkspaceService.loadParagonNodes(personaje.clase);
      
      // Nodos equipados vs disponibles
      const nodosHuerfanos = personaje.paragon_refs?.nodos_huerfanos || [];
      const nodosEnTableros = personaje.paragon_refs?.tableros_equipados?.flatMap(t => 
        t.nodos_activados_ids || []
      ) || [];
      const totalNodosActivos = nodosHuerfanos.length + nodosEnTableros.length;

      if (paragonNodes) {
        const totalNodosDisponibles = 
          (paragonNodes.nodos_normales?.length || 0) +
          (paragonNodes.nodos_magicos?.length || 0) +
          (paragonNodes.nodos_raros?.length || 0) +
          (paragonNodes.nodos_legendarios?.length || 0);

        prompt += `\n### Resumen de Nodos\n`;
        prompt += `- **Nodos Activos**: ${totalNodosActivos}\n`;
        if (nodosHuerfanos.length > 0) {
          prompt += `- **Nodos Huérfanos** (sin tablero): ${nodosHuerfanos.length}\n`;
        }
        prompt += `- **Nodos Disponibles** (catálogo): ${totalNodosDisponibles}\n`;
        prompt += `- **Utilización**: ${((totalNodosActivos / totalNodosDisponibles) * 100).toFixed(1)}%\n`;
      }
    } catch (error) {
      console.error('Error cargando datos Paragon:', error);
    }

    // Preguntas de análisis
    prompt += `\n## Análisis Solicitado\n\n`;
    
    prompt += `### 1. Evaluación del Estado Actual (0-10)\n`;
    prompt += `- **Eficiencia de Tableros**: ¿Los tableros equipados son óptimos para la clase?\n`;
    prompt += `- **Distribución de Nodos**: ¿Los nodos activados están bien balanceados?\n`;
    prompt += `- **Sinergia con Build**: ¿El Paragon complementa las habilidades/glifos/aspectos?\n`;
    prompt += `- **Aprovechamiento de Puntos**: ¿Se están usando eficientemente los puntos Paragon?\n\n`;
    
    prompt += `### 2. Fortalezas Identificadas\n`;
    prompt += `- ¿Qué aspectos del sistema Paragon están bien configurados?\n`;
    prompt += `- ¿Qué sinergias efectivas existen entre tableros y nodos?\n`;
    prompt += `- ¿Los atributos acumulados están alineados con el build?\n\n`;
    
    prompt += `### 3. Debilidades y Áreas de Mejora\n`;
    prompt += `- ¿Hay tableros subóptimos que deberían reemplazarse?\n`;
    prompt += `- ¿Nodos activados que no aportan valor significativo?\n`;
    prompt += `- ¿Nodos huérfanos que indican configuración incompleta?\n`;
    prompt += `- ¿Falta algún tipo de bonificación importante (daño, defensa, recurso)?\n\n`;
    
    prompt += `### 4. Recomendaciones Prioritarias\n`;
    prompt += `Ordena por prioridad (1 = más urgente):\n`;
    prompt += `1. Tableros a cambiar (especifica cuáles y por cuáles)\n`;
    prompt += `2. Nodos a activar (especifica tipos y ubicación)\n`;
    prompt += `3. Nodos a desactivar (no aportan valor)\n`;
    prompt += `4. Glifos en zócalos de Paragon a optimizar\n`;
    prompt += `5. Puertas de Anexo a conseguir (si aplica)\n\n`;
    
    prompt += `### 5. Plan de Mejora por Fases\n`;
    prompt += `Divide las mejoras en 3 fases:\n`;
    prompt += `- **Fase 1 (Inmediato)**: Cambios que puedo hacer ya con los recursos actuales\n`;
    prompt += `- **Fase 2 (Corto plazo)**: Mejoras que requieren farmeo de nodos específicos\n`;
    prompt += `- **Fase 3 (Largo plazo)**: Optimización completa del sistema Paragon\n`;

    return prompt;
  }

  /**
   * Generar prompt de optimización de nodos Paragon
   * Compara nodos equipados vs disponibles para maximizar eficiencia
   */
  static async generateParagonOptimizationPrompt(personaje: Personaje): Promise<string> {
    let prompt = `# Optimización de Nodos Paragon - ${personaje.nombre}\n\n`;
    
    prompt += `Eres un experto en teorycrafting del sistema Paragon de Diablo 4. Optimiza la selección de nodos.\n\n`;

    try {
      const paragonNodes = await WorkspaceService.loadParagonNodes(personaje.clase);
      
      if (!paragonNodes) {
        prompt += `No hay catálogo de nodos disponible para análisis.\n`;
        return prompt;
      }

      // Nodos equipados
      const nodosHuerfanos = personaje.paragon_refs?.nodos_huerfanos || [];
      const nodosEnTableros = personaje.paragon_refs?.tableros_equipados?.flatMap(t => 
        (t.nodos_activados_ids || []).map(id => ({ nodo_id: id, tablero: t.tablero_id }))
      ) || [];
      
      prompt += `## Nodos Actualmente Equipados\n\n`;
      
      // Resolver datos completos de nodos equipados
      const todosNodosCatalogo = [
        ...(paragonNodes.nodos_normales || []),
        ...(paragonNodes.nodos_magicos || []),
        ...(paragonNodes.nodos_raros || []),
        ...(paragonNodes.nodos_legendarios || [])
      ];

      if (nodosHuerfanos.length > 0) {
        prompt += `### Nodos Huérfanos (${nodosHuerfanos.length})\n`;
        nodosHuerfanos.forEach(h => {
          const nodo = todosNodosCatalogo.find(n => n.id === h.nodo_id);
          if (nodo) {
            prompt += `- **${nodo.nombre}** (${nodo.rareza})\n`;
            
            // Detalles activos (v0.5.3)
            if ((nodo as any).detalles) {
              const detallesActivos = (nodo as any).detalles.filter((d: any) => d.activo !== false);
              detallesActivos.forEach((det: any) => {
                prompt += `  - ${det.texto}\n`;
              });
            }
            
            // Atributos (retrocompatibilidad)
            if ((nodo as any).atributos) {
              (nodo as any).atributos.forEach((attr: any) => {
                prompt += `  - ${attr.tipo}: +${attr.valor}\n`;
              });
            }
            
            // Requisitos (v0.5.3)
            if ((nodo as any).requisitos) {
              const req = (nodo as any).requisitos;
              const cumplido = req.valor_actual >= req.valor_requerido;
              prompt += `  - Requisito: ${req.atributo} ${req.valor_actual}/${req.valor_requerido} ${cumplido ? '✓' : '✗'}\n`;
            }
          }
        });
        prompt += `\n`;
      }

      if (nodosEnTableros.length > 0) {
        prompt += `### Nodos en Tableros (${nodosEnTableros.length})\n`;
        nodosEnTableros.forEach(n => {
          const nodo = todosNodosCatalogo.find(nd => nd.id === n.nodo_id);
          if (nodo) {
            prompt += `- **${nodo.nombre}** (${nodo.rareza}) - Tablero: ${n.tablero}\n`;
          }
        });
        prompt += `\n`;
      }

      // Nodos disponibles (no equipados)
      const idsEquipados = new Set([
        ...nodosHuerfanos.map(h => h.nodo_id),
        ...nodosEnTableros.map(n => n.nodo_id)
      ]);

      const nodosDisponibles = todosNodosCatalogo.filter(n => !idsEquipados.has(n.id));

      prompt += `## Nodos Disponibles NO Equipados\n\n`;
      
      // Agrupar por rareza
      const porRareza = {
        legendario: nodosDisponibles.filter(n => n.rareza === 'legendario'),
        raro: nodosDisponibles.filter(n => n.rareza === 'raro'),
        magico: nodosDisponibles.filter(n => n.rareza === 'magico'),
        normal: nodosDisponibles.filter(n => n.rareza === 'normal')
      };

      ['legendario', 'raro', 'magico', 'normal'].forEach(rareza => {
        const nodos = (porRareza as any)[rareza];
        if (nodos.length > 0) {
          prompt += `### Nodos ${rareza.charAt(0).toUpperCase() + rareza.slice(1)}s (${nodos.length})\n`;
          nodos.slice(0, 10).forEach((nodo: any) => { // Mostrar máximo 10 por rareza
            prompt += `- **${nodo.nombre}**\n`;
            
            // Detalles activos (v0.5.3)
            if (nodo.detalles) {
              const detallesActivos = nodo.detalles.filter((d: any) => d.activo !== false);
              detallesActivos.forEach((det: any) => {
                prompt += `  - ${det.texto}\n`;
              });
            }
            
            // Atributos (retrocompatibilidad)
            if (nodo.atributos) {
              nodo.atributos.forEach((attr: any) => {
                prompt += `  - ${attr.tipo}: +${attr.valor}\n`;
              });
            }
            
           // Efectos especiales
            if (nodo.efecto_especial) {
              prompt += `  - Efecto: ${nodo.efecto_especial}\n`;
            }
            if (nodo.efecto_principal) {
              prompt += `  - Efecto Principal: ${nodo.efecto_principal}\n`;
            }
            
            // Requisitos (v0.5.3)
            if (nodo.requisitos) {
              const req = nodo.requisitos;
              const cumplido = req.valor_actual >= req.valor_requerido;
              prompt += `  - ⚠️ Requisito: ${req.atributo} ${req.valor_actual}/${req.valor_requerido} ${cumplido ? '✓ Cumplido' : '✗ No cumplido'}\n`;
            }
          });
          if (nodos.length > 10) {
            prompt += `- ... y ${nodos.length - 10} nodos más\n`;
          }
          prompt += `\n`;
        }
      });

    } catch (error) {
      console.error('Error cargando nodos:', error);
      prompt += `Error cargando catálogo de nodos.\n`;
    }

    // Preguntas de optimización
    prompt += `## Análisis de Optimización\n\n`;
    
    prompt += `### 1. Nodos a Reemplazar\n`;
    prompt += `- ¿Qué nodos equipados son subóptimos para el build?\n`;
    prompt += `- ¿Por qué nodos disponibles deberían reemplazarse?\n`;
    prompt += `- Prioriza los cambios por impacto en el build\n\n`;
    
    prompt += `### 2. Nodos Prioritarios a Conseguir\n`;
    prompt += `- ¿Qué nodos disponibles ofrecen mayor valor?\n`;
    prompt += `- ¿Qué sinergias crearían con el build actual?\n`;
    prompt += `- Top 5 nodos que mejorarían significativamente el personaje\n\n`;
    
    prompt += `### 3. Balance de Atributos\n`;
    prompt += `- ¿Los nodos actuales están desbalanceados (mucho ofensivo/defensivo)?\n`;
    prompt += `- ¿Qué tipo de nodos faltan (daño, vida, resistencias, recurso)?\n`;
    prompt += `- Sugerencias para equilibrar el Paragon\n\n`;
    
    prompt += `### 4. Plan de Acción Específico\n`;
    prompt += `Dame una lista concreta:\n`;
    prompt += `1. **Desactivar**: [Nodo X] - Motivo\n`;
    prompt += `2. **Activar**: [Nodo Y] - Beneficio\n`;
    prompt += `3. **Farmear**: [Nodo Z] - Prioridad alta/media/baja\n`;

    return prompt;
  }

  /**
   * Generar prompt de comparación de nodos para decisiones estratégicas
   */
  static async generateParagonNodeComparisonPrompt(personaje: Personaje, nodoIds?: string[]): Promise<string> {
    let prompt = `# Comparación de Nodos Paragon - ${personaje.nombre}\n\n`;
    
    prompt += `Compara nodos específicos para ayudar a tomar decisiones estratégicas.\n\n`;

    try {
      const paragonNodes = await WorkspaceService.loadParagonNodes(personaje.clase);
      
      if (!paragonNodes) {
        prompt += `No hay catálogo de nodos disponible.\n`;
        return prompt;
      }

      const todosNodos = [
        ...(paragonNodes.nodos_normales || []),
        ...(paragonNodes.nodos_magicos || []),
        ...(paragonNodes.nodos_raros || []),
        ...(paragonNodes.nodos_legendarios || [])
      ];

      // Si se especifican IDs, comparar esos nodos
      if (nodoIds && nodoIds.length > 0) {
        prompt += `## Nodos a Comparar\n\n`;
        
        nodoIds.forEach(id => {
          const nodo = todosNodos.find(n => n.id === id);
          if (nodo) {
            prompt += `### ${nodo.nombre} (${nodo.rareza})\n`;
            if ((nodo as any).atributos) {
              (nodo as any).atributos.forEach((attr: any) => {
                prompt += `- ${attr.tipo}: +${attr.valor}\n`;
              });
            }
            if ((nodo as any).efecto_especial) {
              prompt += `- **Efecto Especial**: ${(nodo as any).efecto_especial}\n`;
            }
            prompt += `\n`;
          }
        });
      } else {
        // Si no se especifican, mostrar nodos equipados vs top disponibles
        prompt += `## Análisis General de Opciones\n\n`;
        prompt += `Analiza todas las opciones disponibles y recomienda las mejores combinaciones.\n\n`;
      }

    } catch (error) {
      console.error('Error cargando nodos:', error);
    }

    prompt += `## Preguntas de Comparación\n\n`;
    prompt += `1. **Eficiencia por Tipo**: ¿Qué nodos ofrecen mejor retorno por punto invertido?\n`;
    prompt += `2. **Sinergias**: ¿Qué combinaciones de nodos potencian el build?\n`;
    prompt += `3. **Oportunidad de Costo**: ¿Vale la pena invertir en nodo X vs nodo Y?\n`;
    prompt += `4. **Recomendación Final**: ¿Cuál es la combinación óptima de nodos?\n`;

    return prompt;
  }
}

