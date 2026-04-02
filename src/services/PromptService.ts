import { Personaje, PromptConfig, Glifo, HabilidadActiva, HabilidadPasiva } from '../types';
import { WorkspaceService } from './WorkspaceService';

export class PromptService {
  // Generar prompt completo para consulta en IA
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
