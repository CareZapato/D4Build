import { Personaje, PromptConfig, Glifo, HabilidadActiva, HabilidadPasiva } from '../types';
import { WorkspaceService } from './WorkspaceService';

export class PromptService {
  // Generar prompt de análisis profundo del personaje (v0.6.2 - Análisis basado en tags)
  static async generateDeepAnalysisPrompt(personaje: Personaje): Promise<string> {
    let prompt = `# CONTEXTO DEL SISTEMA\n\n`;
    
    prompt += `Esta aplicación utiliza un enfoque basado en datos estructurados JSON para analizar y optimizar personajes de Diablo 4.\n\n`;
    
    prompt += `## Sistema de Tags como Lenguaje Común\n`;
    prompt += `Los elementos del build (habilidades, aspectos, glifos, nodos Paragon, estadísticas) están conectados mediante **tags** (palabras clave).\n`;
    prompt += `Los tags representan mecánicas del juego como: 'crítico', 'vulnerabilidad', 'espinas', 'fortificación', 'sangrado', 'veneno', etc.\n\n`;
    
    prompt += `**OBJETIVO DEL ANÁLISIS**: Identificar tags compartidos entre elementos para descubrir sinergias, optimizar el build y detectar mecánicas desaprovechadas.\n\n`;
    
    prompt += `## ⚠️ REGLAS CRÍTICAS DE HABILIDADES\n`;
    prompt += `**ESTRUCTURA ANIDADA**: Cada Habilidad Activa contiene:\n`;
    prompt += `- **Modificadores** (🔷 rombo, mismo dibujo): Mejoras opcionales de la activa\n`;
    prompt += `- **Pasivas Relacionadas** (🔸 rombo, dibujo diferente): Pasivas que solo funcionan con esa activa\n\n`;
    prompt += `**DEPENDENCIA OBLIGATORIA**:\n`;
    prompt += `- ❌ NO puedes usar una pasiva si su habilidad activa NO está seleccionada/equipada\n`;
    prompt += `- ❌ NO puedes usar un modificador si su habilidad activa NO está seleccionada/equipada\n`;
    prompt += `- ⚠️ Solo 1 modificador puede estar activo por habilidad activa (restricción del juego)\n`;
    prompt += `- ✅ Para recomendar una pasiva o modificador, PRIMERO debes recomendar su habilidad activa\n\n`;
    prompt += `**IMPLICACIÓN PARA ANÁLISIS**:\n`;
    prompt += `Cuando evalúes o recomiendes habilidades, considera:\n`;
    prompt += `1. ¿La habilidad activa está seleccionada? (requisito previo)\n`;
    prompt += `2. ¿Qué pasivas/modificadores de esa activa maximizan sinergias con el build?\n`;
    prompt += `3. Si recomiendas cambiar activas, evalúa si se pierden pasivas/modificadores valiosos\n\n`;
    
    prompt += `---\n\n`;
    prompt += `# ANÁLISIS DE BUILD: ${personaje.nombre} (${personaje.clase})\n\n`;
    
    // Información básica
    prompt += `## 📊 Información General\n`;
    prompt += `- **Clase**: ${personaje.clase}\n`;
    prompt += `- **Nivel**: ${personaje.nivel}`;
    if (personaje.nivel_paragon) {
      prompt += ` | **Paragon**: ${personaje.nivel_paragon}`;
    }
    if (personaje.puertas_anexo) {
      prompt += ` | **Puertas Anexo**: ${personaje.puertas_anexo} (+${personaje.puertas_anexo * 5} atributos)`;
    }
    prompt += `\n\n`;

    // Habilidades EN BATALLA únicamente (v0.6.2)
    if (personaje.habilidades_refs) {
      try {
        const heroSkills = await WorkspaceService.loadHeroSkills(personaje.clase);
        if (heroSkills) {
          const habilidadesEnBatalla = (personaje.habilidades_refs.activas || [])
            .filter(ref => ref.en_batalla === true)
            .map(ref => heroSkills.habilidades_activas.find(s => s.id === ref.skill_id))
            .filter((skill): skill is HabilidadActiva => skill !== undefined);
          
          const habilidadesPasivas = (personaje.habilidades_refs.pasivas || [])
            .map(ref => {
              const skillId = typeof ref === 'string' ? ref : ref.skill_id;
              return heroSkills.habilidades_pasivas.find(s => s.id === skillId);
            })
            .filter((skill): skill is HabilidadPasiva => skill !== undefined);

          if (habilidadesEnBatalla.length > 0 || habilidadesPasivas.length > 0) {
            prompt += `## ⚔️ Habilidades en Batalla (${habilidadesEnBatalla.length}/6 activas)\n`;
            
            // Solo habilidades marcadas como "en batalla"
            habilidadesEnBatalla.forEach(skill => {
              prompt += `- **${skill.nombre}** (${skill.tipo} - ${skill.rama})\n`;
              prompt += `  - ${skill.descripcion}\n`;
              if (skill.tags && skill.tags.length > 0) {
                prompt += `  - 🏷️ Tags: ${skill.tags.join(', ')}\n`;
              }
              
              // Mostrar modificadores activos
              const activaRef = personaje.habilidades_refs?.activas?.find(ref => ref.skill_id === skill.id);
              if (skill.modificadores && skill.modificadores.length > 0) {
                const modificadoresActivos = skill.modificadores.filter(mod => 
                  activaRef?.modificadores_ids?.includes(mod.id || '')
                );
                if (modificadoresActivos.length > 0) {
                  prompt += `  - 🔷 **Modificadores activos** (${modificadoresActivos.length}/${skill.modificadores.length}): ${modificadoresActivos.map(m => m.nombre).join(', ')}\n`;
                }
              }
              
              // Mostrar pasivas relacionadas
              if ((skill as any).habilidades_pasivas && (skill as any).habilidades_pasivas.length > 0) {
                prompt += `  - 🔸 **Pasivas relacionadas disponibles** (${(skill as any).habilidades_pasivas.length}): ${(skill as any).habilidades_pasivas.map((p: any) => p.nombre).join(', ')}\n`;
              }
            });

            if (habilidadesPasivas.length > 0) {
              prompt += `\n**Pasivas** (${habilidadesPasivas.length}):\n`;
              habilidadesPasivas.forEach(skill => {
                prompt += `- **${skill.nombre}**: ${skill.efecto}\n`;
                if (skill.tags && skill.tags.length > 0) {
                  prompt += `  - 🏷️ Tags: ${skill.tags.join(', ')}\n`;
                }
              });
            }
            prompt += `\n`;
          }
        }
      } catch (error) {
        console.error('Error cargando habilidades:', error);
      }
    }

    // Aspectos equipados vs disponibles (comparación)
    if (personaje.aspectos_refs) {
      try {
        const heroAspects = await WorkspaceService.loadHeroAspects(personaje.clase);
        if (heroAspects) {
          const aspectosEquipados = personaje.aspectos_refs
            .map(ref => {
              const aspectoId = typeof ref === 'string' ? ref : ref.aspecto_id;
              return heroAspects.aspectos.find(a => a.id === aspectoId);
            })
            .filter(a => a !== undefined);
          
          const equipadosIds = new Set(personaje.aspectos_refs.map(ref => 
            typeof ref === 'string' ? ref : ref.aspecto_id
          ));
          const aspectosDisponibles = heroAspects.aspectos.filter(a => !equipadosIds.has(a.id));

          prompt += `## 🔮 Aspectos (${aspectosEquipados.length} equipados / ${aspectosDisponibles.length} disponibles)\n`;
          prompt += `### Equipados:\n`;
          aspectosEquipados.forEach(aspecto => {
            prompt += `- **${aspecto.name}** (${aspecto.category})\n`;
            prompt += `  - ${aspecto.effect}\n`;
            if (aspecto.tags && aspecto.tags.length > 0) {
              prompt += `  - 🏷️ Tags: ${aspecto.tags.join(', ')}\n`;
            }
          });
          
          prompt += `\n### Disponibles NO equipados (muestra):\n`;
          aspectosDisponibles.slice(0, 10).forEach(aspecto => {
            prompt += `- **${aspecto.name}** (${aspecto.category})\n`;
            prompt += `  - ${aspecto.effect}\n`;
            if (aspecto.tags && aspecto.tags.length > 0) {
              prompt += `  - 🏷️ Tags: ${aspecto.tags.join(', ')}\n`;
            }
          });
          if (aspectosDisponibles.length > 10) {
            prompt += `- ... y ${aspectosDisponibles.length - 10} más disponibles.\n`;
          }
          prompt += `\n`;
        }
      } catch (error) {
        console.error('Error cargando aspectos:', error);
      }
    }

    // Glifos equipados
    if (personaje.glifos_refs && personaje.glifos_refs.length > 0) {
      prompt += await this.formatGlifosEquipados(personaje);
    }

    // Mecánicas de clase (v0.8.0)
    if (personaje.mecanicas_clase_refs && personaje.mecanicas_clase_refs.length > 0) {
      try {
        const heroMechanics = await WorkspaceService.loadHeroClassMechanics(personaje.clase);
        if (heroMechanics && heroMechanics.mecanicas) {
          prompt += `## ✨ Mecánicas de Clase (${personaje.mecanicas_clase_refs.length})\n`;
          
          personaje.mecanicas_clase_refs.forEach(ref => {
            const mecanica = heroMechanics.mecanicas.find(m => m.id === ref.id);
            if (mecanica) {
              const seleccionesActivas = mecanica.selecciones.filter(s => 
                ref.selecciones_activas?.includes(s.id) || s.activo
              );
              
              prompt += `### ${mecanica.nombre}\n`;
              seleccionesActivas.forEach(sel => {
                prompt += `- **${sel.nombre}** (${sel.categoria}) - Nv ${sel.nivel}/${sel.nivel_maximo}\n`;
                prompt += `  - ${sel.efecto}\n`;
                if (sel.detalles && sel.detalles.length > 0) {
                  sel.detalles.forEach(detalle => {
                    prompt += `    • ${detalle}\n`;
                  });
                }
                if (sel.tags && sel.tags.length > 0) {
                  prompt += `  - 🏷️ Tags: ${sel.tags.join(', ')}\n`;
                }
              });
              
              // Palabras clave de la mecánica
              if (mecanica.palabras_clave && mecanica.palabras_clave.length > 0) {
                prompt += `  - 📖 Palabras clave: ${mecanica.palabras_clave.map(pc => pc.tag).join(', ')}\n`;
              }
              
              if (ref.notas) {
                prompt += `  - 📝 Notas: ${ref.notas}\n`;
              }
              prompt += `\n`;
            }
          });
        }
      } catch (error) {
        console.error('Error cargando mecánicas de clase:', error);
      }
    }

    // Build equipada (items)
    prompt += this.formatBuildEquipada(personaje);

    // Sistema Paragon
    if (personaje.paragon_refs || personaje.paragon || personaje.atributos_paragon) {
      prompt += await this.formatParagonEquipado(personaje);
    }

    // Estadísticas clave
    if (personaje.estadisticas) {
      prompt += await this.formatEstadisticasDetalladas(personaje.estadisticas);
    }

    // Instrucciones de análisis
    prompt += `\n---\n\n`;
    prompt += `# INSTRUCCIONES DE ANÁLISIS\n\n`;
    
    prompt += `## 1️⃣ DIAGNÓSTICO RÁPIDO\n`;
    prompt += `- Identifica el **arquetipo/estilo de juego** basado en tags dominantes\n`;
    prompt += `- Evalúa coherencia general (1-10)\n`;
    prompt += `- ¿Está enfocado o disperso?\n\n`;
    
    prompt += `## 2️⃣ SINERGIAS (Análisis Transversal por Tags)\n`;
    prompt += `- Lista tags compartidos entre habilidades en batalla, aspectos equipados, glifos, mecánicas de clase y nodos\n`;
    prompt += `- Identifica mecánicas fuertes (ej: si 'crítico' aparece en 4+ elementos)\n`;
    prompt += `- Detecta anti-sinergias (elementos que no comparten tags)\n`;
    prompt += `- Evalúa cómo las mecánicas de clase potencian o se integran con el resto del build\n\n`;
    
    prompt += `## 3️⃣ PROBLEMAS CRÍTICOS\n`;
    prompt += `- Habilidades en batalla sin soporte (sin aspectos/glifos/mecánicas que compartan tags)\n`;
    prompt += `- Aspectos equipados que no conectan con habilidades activas o mecánicas de clase\n`;
    prompt += `- Mecánicas de clase sin sinergia con habilidades/aspectos\n`;
    prompt += `- Mecánicas desaprovechadas (tags en aspectos disponibles que potenciarían el build)\n`;
    prompt += `- Carencias defensivas/ofensivas según estadísticas\n\n`;
    
    prompt += `## 4️⃣ RECOMENDACIONES PRIORIZADAS\n`;
    prompt += `Ordena por impacto (1 = más urgente):\n`;
    prompt += `1. **Aspectos a cambiar**: Especifica cuáles equipados reemplazar y por cuáles disponibles (justifica con tags compartidos)\n`;
    prompt += `2. **Habilidades a ajustar**: \n`;
    prompt += `   - ⚠️ RECUERDA: Si recomiendas una pasiva/modificador, PRIMERO verifica que su activa esté seleccionada\n`;
    prompt += `   - Si alguna activa en batalla tiene 0 sinergias, sugiere alternativas\n`;
    prompt += `   - Evalúa si los modificadores activos (solo 1 por activa) son los óptimos\n`;
    prompt += `   - Sugiere qué pasivas relacionadas deberían activarse\n`;
    prompt += `3. **Mecánicas de clase a optimizar**: Selecciones que maximicen sinergias con build actual\n`;
    prompt += `4. **Glifos a optimizar**: Prioriza niveles o reemplazos según tags\n`;
    prompt += `5. **Estadísticas a mejorar**: Basado en análisis de stats\n`;
    prompt += `6. **Nodos Paragon a priorizar**: Si hay info disponible\n\n`;
    
    prompt += `## 5️⃣ PLAN DE ACCIÓN (3-5 pasos concretos)\n`;
    prompt += `Lista cambios inmediatos, cada uno con:\n`;
    prompt += `- Qué hacer exactamente\n`;
    prompt += `- Por qué (menciona tags/sinergias)\n`;
    prompt += `- Impacto esperado\n\n`;
    
    prompt += `**FORMATO DE RESPUESTA**: Conciso, con viñetas, sin repetir información innecesaria. Enfócate en tags compartidos como criterio principal.\n`;

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

    // Build equipada actual
    prompt += this.formatBuildEquipada(personaje);
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

    // Mecánicas de clase equipadas (v0.8.0)
    if (personaje.mecanicas_clase_refs && personaje.mecanicas_clase_refs.length > 0) {
      try {
        const heroMechanics = await WorkspaceService.loadHeroClassMechanics(personaje.clase);
        if (heroMechanics && heroMechanics.mecanicas) {
          prompt += `\n## Mecánicas de Clase: Configuración Actual\n\n`;
          
          personaje.mecanicas_clase_refs.forEach(ref => {
            const mecanica = heroMechanics.mecanicas.find(m => m.id === ref.id);
            if (mecanica) {
              const seleccionesActivas = mecanica.selecciones.filter(s => 
                ref.selecciones_activas?.includes(s.id) || s.activo
              );
              const seleccionesInactivas = mecanica.selecciones.filter(s => 
                !ref.selecciones_activas?.includes(s.id) && !s.activo
              );
              
              prompt += `### ${mecanica.nombre}\n`;
              prompt += `**Selecciones Activas (${seleccionesActivas.length})**:\n`;
              seleccionesActivas.forEach(sel => {
                prompt += `- **${sel.nombre}** (${sel.categoria}) - Nv ${sel.nivel}/${sel.nivel_maximo}\n`;
                prompt += `  - ${sel.efecto}\n`;
              });
              
              if (seleccionesInactivas.length > 0) {
                prompt += `\n**Opciones Disponibles NO Activas (${seleccionesInactivas.length})**:\n`;
                seleccionesInactivas.forEach(sel => {
                  prompt += `- **${sel.nombre}** (${sel.categoria})\n`;
                  prompt += `  - ${sel.efecto}\n`;
                });
              }
              prompt += `\n`;
            }
          });
        }
      } catch (error) {
        console.error('Error cargando mecánicas de clase:', error);
      }
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
    
    prompt += `### 2. Optimización de Mecánicas de Clase\n`;
    prompt += `- ¿Las selecciones activas son las más adecuadas para el build?\n`;
    prompt += `- ¿Qué opciones no activas ofrecerían mejores sinergias?\n`;
    prompt += `- ¿Cómo potenciar las mecánicas de clase con aspectos/habilidades disponibles?\n\n`;
    
    prompt += `### 3. Optimización de Glifos\n`;
    prompt += `- ¿Qué glifos equipados son subóptimos?\n`;
    prompt += `- ¿Qué glifos disponibles ofrecen mejor valor?\n`;
    prompt += `- Orden de prioridad para nivel de glifos (1-5)\n\n`;
    
    prompt += `### 4. Mejoras de Aspectos\n`;
    prompt += `- ¿Qué aspectos equipados no aportan suficiente valor?\n`;
    prompt += `- ¿Qué aspectos disponibles crean mejores sinergias?\n`;
    prompt += `- Top 3 aspectos a conseguir/equipar\n\n`;
    
    prompt += `### 5. Optimización del Sistema Paragon\n`;
    prompt += `- ¿Los tableros equipados son los más adecuados para este build?\n`;
    prompt += `- ¿Qué nodos Paragon deberían priorizarse?\n`;
    prompt += `- ¿Hay tableros disponibles que ofrezcan mejores sinergias?\n\n`;
    
    prompt += `### 6. Conclusión\n`;
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
          prompt += `\n## ⚠️ CONTEXTO DE HABILIDADES\n`;
          prompt += `**REGLA DEL JUEGO**: Cada habilidad activa contiene modificadores y pasivas relacionadas.\n`;
          prompt += `- Solo puedes usar modificadores/pasivas si su activa está seleccionada\n`;
          prompt += `- Solo 1 modificador puede estar activo por habilidad activa\n`;
          prompt += `- Al recomendar cambios, SIEMPRE menciona primero la activa requerida\n\n`;
          
          // Resolver habilidades activas
          const activeSkills: HabilidadActiva[] = personaje.habilidades_refs.activas
            .map(ref => heroSkills.habilidades_activas.find(s => s.id === ref.skill_id))
            .filter((skill): skill is HabilidadActiva => skill !== undefined);

          if (activeSkills.length > 0) {
            prompt += `## Habilidades Activas\n`;
            activeSkills.forEach(skill => {
              const activaRef = personaje.habilidades_refs?.activas?.find(ref => ref.skill_id === skill.id);
              
              prompt += `\n### ${skill.nombre} (${skill.tipo} - ${skill.rama})\n`;
              prompt += `- **Nivel**: ${skill.nivel}\n`;
              prompt += `- **Descripción**: ${skill.descripcion}\n`;
              
              if (skill.tipo_danio) {
                prompt += `- **Tipo de Daño**: ${skill.tipo_danio}\n`;
              }

              // Mostrar modificadores (indicar cuál está activo)
              if (skill.modificadores && skill.modificadores.length > 0) {
                prompt += `- **Modificadores disponibles** (${skill.modificadores.length}):\n`;
                skill.modificadores.forEach(mod => {
                  const isActive = activaRef?.modificadores_ids?.includes(mod.id || '');
                  const activeTag = isActive ? ' ✅ ACTIVO' : '';
                  prompt += `  - ${mod.nombre}${activeTag}: ${mod.descripcion}\n`;
                });
              }
              
              // Mostrar pasivas relacionadas
              if ((skill as any).habilidades_pasivas && (skill as any).habilidades_pasivas.length > 0) {
                prompt += `- **Pasivas relacionadas disponibles** (${(skill as any).habilidades_pasivas.length}):\n`;
                (skill as any).habilidades_pasivas.forEach((pasiva: any) => {
                  prompt += `  - ${pasiva.nombre} (Nv ${pasiva.nivel}): ${pasiva.efecto}\n`;
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

    // Cargar mecánicas de clase desde el héroe usando referencias
    if (config.incluir_mecanicas && personaje.mecanicas_clase_refs) {
      try {
        const heroMechanics = await WorkspaceService.loadHeroClassMechanics(personaje.clase);
        
        if (heroMechanics && heroMechanics.mecanicas.length > 0) {
          prompt += `\n## Mecánicas de Clase\n`;
          
          // Para cada referencia del personaje
          personaje.mecanicas_clase_refs.forEach(mechanicRef => {
            // Buscar la mecánica completa en el héroe
            const mecanica = heroMechanics.mecanicas.find(m => m.id === mechanicRef.id);
            
            if (mecanica) {
              prompt += `\n### ${mecanica.nombre} (${mecanica.clase})\n`;
              
              // Filtrar solo las selecciones activas
              const seleccionesActivas = mecanica.selecciones.filter(sel => 
                mechanicRef.selecciones_activas?.includes(sel.id)
              );
              
              if (seleccionesActivas.length > 0) {
                prompt += `**Selecciones Activas:**\n`;
                seleccionesActivas.forEach(seleccion => {
                  prompt += `- **${seleccion.nombre}** (${seleccion.categoria})\n`;
                  prompt += `  - Nivel: ${seleccion.nivel}/${seleccion.nivel_maximo}\n`;
                  prompt += `  - Efecto: ${seleccion.efecto}\n`;
                  
                  if (seleccion.detalles && seleccion.detalles.length > 0) {
                    prompt += `  - Detalles:\n`;
                    seleccion.detalles.forEach(detalle => {
                      prompt += `    - ${detalle}\n`;
                    });
                  }
                  
                  if (seleccion.tags && seleccion.tags.length > 0) {
                    prompt += `  - 🏷️ Tags: ${seleccion.tags.join(', ')}\n`;
                  }
                });
              }
              
              if (mechanicRef.notas) {
                prompt += `- **Notas**: ${mechanicRef.notas}\n`;
              }
            }
          });
        }
      } catch (error) {
        console.error('Error cargando mecánicas del héroe:', error);
      }
    }

    // Incluir build equipada para dar contexto de optimización
    prompt += this.formatBuildEquipada(personaje);

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
      incluir_mecanicas: true,
      pregunta_personalizada: `Analiza las sinergias entre las habilidades activas, glifos equipados y mecánicas de clase.

⚠️ REGLAS DE HABILIDADES:
- Cada habilidad activa contiene modificadores y pasivas relacionadas
- Solo puedes usar pasivas/modificadores si su activa está seleccionada
- Solo 1 modificador activo por habilidad activa
- Al recomendar modificadores/pasivas, SIEMPRE menciona primero su activa requerida

Identifica:
1. Qué combinaciones funcionan bien y por qué
2. Cómo las mecánicas de clase potencian habilidades/aspectos
3. Qué glifos podrían optimizarse o cambiarse
4. Para cada activa seleccionada: ¿tiene el mejor modificador activo? ¿qué pasivas relacionadas maximizan sinergias?
5. Posibles debilidades en el build actual`
    });
  }

  // Generar prompt enfocado en optimización
  static async generateOptimizationPrompt(personaje: Personaje): Promise<string> {
    return await this.generatePrompt(personaje, {
      incluir_habilidades: true,
      incluir_glifos: true,
      incluir_estadisticas: true,
      incluir_mecanicas: true,
      pregunta_personalizada: `Analiza este build y proporciona recomendaciones para optimizarlo:

⚠️ REGLAS DE HABILIDADES:
- Cada habilidad activa contiene modificadores (🔷) y pasivas relacionadas (🔸)
- NO puedes usar una pasiva/modificador sin tener su activa seleccionada
- Solo 1 modificador puede estar activo por habilidad activa
- Al recomendar cambios en habilidades, SIEMPRE especifica: "Selecciona [Activa], luego activa [Modificador/Pasiva]"

Proporciona:
1. ¿Hay mejores opciones de habilidades activas para el objetivo del build?
2. Para cada activa seleccionada: ¿el modificador activo es óptimo? ¿qué pasivas relacionadas deberían usarse?
3. ¿Las mecánicas de clase están optimizadas? ¿Selecciones más adecuadas?
4. ¿Los glifos elegidos son óptimos?
5. ¿Qué estadísticas debería priorizar?
6. ¿Hay sinergias no aprovechadas entre mecánicas/habilidades/aspectos?
7. Sugerencias de aspectos legendarios que complementen el build`
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
    prompt += `⚠️ REGLAS DE HABILIDADES: Cada activa contiene modificadores y pasivas relacionadas. Solo puedes usar pasivas/modificadores si su activa está seleccionada (solo 1 modificador activo por activa).\n\n`;
    prompt += `Compara estos dos builds y proporciona:
1. Principales diferencias en el enfoque y estilo de juego
2. Ventajas y desventajas de cada build
3. Cuál es mejor para diferentes tipos de contenido (campaña, mazmorras, jefes, PvP)
4. Sugerencias para mejorar cada uno (recordando las reglas de dependencia de habilidades)`;

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

  // Helper: Formatear build equipada (equipo + engarces + aspectos por pieza)
  private static formatBuildEquipada(personaje: Personaje): string {
    const build = personaje.build;
    if (!build || !build.piezas) return '';

    const piezas = Object.values(build.piezas).filter(Boolean) as Array<any>;
    if (piezas.length === 0) return '';

    let prompt = `\n## Build Equipada\n`;
    prompt += `- Piezas equipadas: ${piezas.length}\n`;

    piezas.forEach((pieza) => {
      prompt += `\n### ${pieza.nombre || pieza.id} (${pieza.espacio || 'slot'})\n`;
      if (pieza.rareza) prompt += `- Rareza: ${pieza.rareza}\n`;
      if (pieza.poder_objeto) prompt += `- Poder de objeto: ${pieza.poder_objeto}\n`;
      if (pieza.aspecto_vinculado_id || pieza.aspecto_id) {
        prompt += `- Aspecto vinculado: ${pieza.aspecto_vinculado_id || pieza.aspecto_id}\n`;
      }
      if (pieza.aspecto_descripcion_diferencia) {
        prompt += `- Texto real del aspecto en pieza: ${pieza.aspecto_descripcion_diferencia}\n`;
      }

      if (Array.isArray(pieza.engarces) && pieza.engarces.length > 0) {
        const engarces = pieza.engarces
          .map((e: any) => {
            if (e.tipo === 'runa' && e.runa_id) return `runa:${e.runa_id}`;
            if (e.tipo === 'gema' && e.gema_id) return `gema:${e.gema_id}`;
            return 'vacio';
          })
          .join(', ');
        prompt += `- Engarces: ${engarces}\n`;
      }

      if (Array.isArray(pieza.atributos) && pieza.atributos.length > 0) {
        prompt += `- Atributos principales:\n`;
        pieza.atributos.slice(0, 8).forEach((attr: any) => {
          prompt += `  - ${attr.texto || attr.tipo || 'atributo'}\n`;
        });
      }
    });

    if (Array.isArray(build.runas_equipadas) && build.runas_equipadas.length > 0) {
      prompt += `\n### Runas equipadas (build.runas_equipadas)\n`;
      build.runas_equipadas.forEach((r: any) => {
        prompt += `- ${r.runa_id} (${r.vinculada_a})\n`;
      });
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
    
    prompt += `⚠️ **NOTA SOBRE HABILIDADES**: Al evaluar sinergias, recuerda que cada habilidad activa contiene modificadores y pasivas relacionadas. Solo se pueden usar si su activa está seleccionada.\n\n`;
    
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

  /**
   * Generar prompt de análisis completo de builds
   * Carga TODAS las habilidades del héroe (100%) para análisis estratégico de posibles builds
   * v0.8.10 - Nuevo prompt para análisis de combinaciones
   */
  static async generateBuildAnalysisPrompt(personaje: Personaje): Promise<string> {
    let prompt = `# ANÁLISIS COMPLETO DE BUILDS - ${personaje.nombre} (${personaje.clase})\n\n`;
    
    prompt += `Eres un experto en teorycrafting de Diablo 4 con conocimiento completo del juego. Tu tarea es analizar TODAS las opciones disponibles para la clase ${personaje.clase} y sugerir las mejores combinaciones de builds.\n\n`;

    prompt += `## ⚠️ ESTRUCTURA CRÍTICA DE HABILIDADES\n\n`;
    prompt += `**SISTEMA ANIDADO**: Cada Habilidad Activa contiene:\n`;
    prompt += `- **Modificadores** (🔷 rombo, mismo dibujo): Mejoras opcionales (solo 1 activo por activa)\n`;
    prompt += `- **Pasivas Relacionadas** (🔸 rombo, dibujo diferente): Solo funcionan con esa activa\n\n`;
    prompt += `**REGLAS DE DEPENDENCIA**:\n`;
    prompt += `- ❌ NO se puede usar pasiva/modificador sin su habilidad activa\n`;
    prompt += `- ⚠️ Solo 1 modificador activo por habilidad activa\n`;
    prompt += `- ✅ Al recomendar pasiva/modificador, PRIMERO incluye su activa\n\n`;

    prompt += `---\n\n`;

    // Información del personaje actual
    prompt += `## 📊 Estado Actual del Personaje\n\n`;
    prompt += `- **Clase**: ${personaje.clase}\n`;
    prompt += `- **Nivel**: ${personaje.nivel}`;
    if (personaje.nivel_paragon) {
      prompt += ` | **Paragon**: ${personaje.nivel_paragon}`;
    }
    prompt += `\n\n`;

    // Habilidades actualmente equipadas
    if (personaje.habilidades_refs) {
      prompt += `### Habilidades Equipadas Actualmente\n`;
      
      if (personaje.habilidades_refs.activas && personaje.habilidades_refs.activas.length > 0) {
        prompt += `**Activas (${personaje.habilidades_refs.activas.length}):**\n`;
        try {
          const heroSkills = await WorkspaceService.loadHeroSkills(personaje.clase);
          if (heroSkills) {
            personaje.habilidades_refs.activas.forEach(ref => {
              const skill = heroSkills.habilidades_activas.find(s => s.id === ref.skill_id);
              if (skill) {
                prompt += `- **${skill.nombre}** (Nivel ${ref.nivel_actual || 1})\n`;
                
                // Modificadores activos
                if (ref.modificadores_ids && ref.modificadores_ids.length > 0) {
                  const modsActivos = skill.modificadores?.filter(m => ref.modificadores_ids.includes(m.id || ''));
                  if (modsActivos && modsActivos.length > 0) {
                    prompt += `  - ✅ Modificador activo: ${modsActivos[0].nombre}\n`;
                  }
                }
              }
            });
          }
        } catch (error) {
          console.error('Error cargando habilidades:', error);
        }
      }
      
      if (personaje.habilidades_refs.pasivas && personaje.habilidades_refs.pasivas.length > 0) {
        prompt += `\n**Pasivas (${personaje.habilidades_refs.pasivas.length}):**\n`;
        try {
          const heroSkills = await WorkspaceService.loadHeroSkills(personaje.clase);
          if (heroSkills) {
            personaje.habilidades_refs.pasivas.forEach(ref => {
              const skillId = typeof ref === 'string' ? ref : ref.skill_id;
              
              // Buscar primero en pasivas relacionadas de activas
              let pasiva: HabilidadPasiva | null = null;
              for (const activa of heroSkills.habilidades_activas) {
                if (activa.habilidades_pasivas) {
                  pasiva = activa.habilidades_pasivas.find(p => p.id === skillId) || null;
                  if (pasiva) {
                    prompt += `- **${pasiva.nombre}** (vinculada a ${activa.nombre})\n`;
                    break;
                  }
                }
              }
              
              // Si no se encontró, buscar en pasivas independientes
              if (!pasiva) {
                pasiva = heroSkills.habilidades_pasivas.find(p => p.id === skillId) || null;
                if (pasiva) {
                  const puntos = typeof ref !== 'string' && ref.puntos_asignados ? ref.puntos_asignados : 1;
                  prompt += `- **${pasiva.nombre}** (${puntos} puntos)\n`;
                }
              }
            });
          }
        } catch (error) {
          console.error('Error cargando pasivas:', error);
        }
      }
      prompt += `\n`;
    }

    // CATÁLOGO COMPLETO de habilidades disponibles (100%)
    prompt += `---\n\n`;
    prompt += `## 🎯 CATÁLOGO COMPLETO DE HABILIDADES DEL ${personaje.clase.toUpperCase()}\n\n`;
    prompt += `A continuación se lista el 100% de las habilidades disponibles para análisis estratégico:\n\n`;

    try {
      const heroSkills = await WorkspaceService.loadHeroSkills(personaje.clase);
      
      if (heroSkills) {
        // Habilidades Activas (con modificadores y pasivas relacionadas)
        if (heroSkills.habilidades_activas && heroSkills.habilidades_activas.length > 0) {
          prompt += `### 🔷 Habilidades Activas (${heroSkills.habilidades_activas.length})\n\n`;
          
          heroSkills.habilidades_activas.forEach(skill => {
            prompt += `#### ${skill.nombre}\n`;
            prompt += `- **Categoría**: ${skill.categoria || 'N/A'}\n`;
            prompt += `- **Tipo**: ${skill.tipo || 'N/A'}\n`;
            if (skill.costo_recurso) {
              prompt += `- **Costo**: ${skill.costo_recurso}\n`;
            }
            if (skill.nivel) {
              prompt += `- **Nivel**: ${skill.nivel}\n`;
            }
            if (skill.descripcion) {
              prompt += `- **Descripción**: ${skill.descripcion}\n`;
            }
            if (skill.tags && skill.tags.length > 0) {
              prompt += `- **Tags**: ${skill.tags.join(', ')}\n`;
            }
            
            // Modificadores disponibles
            if (skill.modificadores && skill.modificadores.length > 0) {
              prompt += `\n  **Modificadores (${skill.modificadores.length}) - Solo 1 activo:**\n`;
              skill.modificadores.forEach(mod => {
                prompt += `  - 🔷 **${mod.nombre}**\n`;
                if (mod.descripcion) {
                  prompt += `    - ${mod.descripcion}\n`;
                }
                if (mod.tags && mod.tags.length > 0) {
                  prompt += `    - Tags: ${mod.tags.join(', ')}\n`;
                }
              });
            }
            
            // Pasivas relacionadas
            if (skill.habilidades_pasivas && skill.habilidades_pasivas.length > 0) {
              prompt += `\n  **Pasivas Relacionadas (${skill.habilidades_pasivas.length}):**\n`;
              skill.habilidades_pasivas.forEach(pas => {
                prompt += `  - 🔸 **${pas.nombre}**\n`;
                if (pas.descripcion) {
                  prompt += `    - ${pas.descripcion}\n`;
                }
                if (pas.tags && pas.tags.length > 0) {
                  prompt += `    - Tags: ${pas.tags.join(', ')}\n`;
                }
              });
            }
            
            prompt += `\n`;
          });
        }
        
        // Habilidades Pasivas Independientes (no vinculadas a activas)
        if (heroSkills.habilidades_pasivas && heroSkills.habilidades_pasivas.length > 0) {
          prompt += `\n### 🔸 Habilidades Pasivas Independientes (${heroSkills.habilidades_pasivas.length})\n\n`;
          prompt += `Estas pasivas funcionan independientemente de las habilidades activas:\n\n`;
          
          heroSkills.habilidades_pasivas.forEach(skill => {
            prompt += `- **${skill.nombre}**`;
            if (skill.categoria) {
              prompt += ` (${skill.categoria})`;
            }
            prompt += `\n`;
            if (skill.descripcion) {
              prompt += `  - ${skill.descripcion}\n`;
            }
            if (skill.nivel) {
              prompt += `  - Nivel máximo: ${skill.nivel}\n`;
            }
            if (skill.tags && skill.tags.length > 0) {
              prompt += `  - Tags: ${skill.tags.join(', ')}\n`;
            }
            prompt += `\n`;
          });
        }
      } else {
        prompt += `No se pudo cargar el catálogo de habilidades del héroe.\n\n`;
      }
    } catch (error) {
      console.error('Error cargando habilidades del héroe:', error);
      prompt += `Error cargando catálogo de habilidades.\n\n`;
    }

    // Análisis solicitado
    prompt += `---\n\n`;
    prompt += `## 🎯 ANÁLISIS SOLICITADO\n\n`;
    
    prompt += `Basándote en el catálogo completo de habilidades, analiza y responde:\n\n`;
    
    prompt += `### 1. Arquetipos de Build Viables\n`;
    prompt += `- Identifica 3-5 arquetipos de build viables para ${personaje.clase}\n`;
    prompt += `- Para cada arquetipo, describe:\n`;
    prompt += `  - **Nombre del Build**: Nombre descriptivo (ej: "Build de Torbellino Sangriento")\n`;
    prompt += `  - **Habilidades Activas Core**: Las 3-6 activas principales\n`;
    prompt += `  - **Modificadores Recomendados**: Qué modificador usar en cada activa\n`;
    prompt += `  - **Pasivas Relacionadas**: Qué pasivas activar de cada activa\n`;
    prompt += `  - **Pasivas Independientes**: Qué pasivas generales complementan\n`;
    prompt += `  - **Estilo de Juego**: Cómo se juega (ofensivo, defensivo, híbrido, etc.)\n`;
    prompt += `  - **Synergias Clave**: Qué tags/mecánicas conectan el build\n\n`;
    
    prompt += `### 2. Optimización del Build Actual\n`;
    prompt += `- Evalúa el build equipado actualmente (0-10)\n`;
    prompt += `- ¿Qué cambios mejorarían el build sin cambiar su arquetipo?\n`;
    prompt += `- ¿Qué habilidades están subutilizadas?\n`;
    prompt += `- ¿Hay habilidades equipadas que no aportan sinergia?\n\n`;
    
    prompt += `### 3. Transición Entre Arquetipos\n`;
    prompt += `- Si quisiera cambiar a un arquetipo diferente, ¿cuál sería más fácil?\n`;
    prompt += `- ¿Qué habilidades mantendría y cuáles cambiaría?\n`;
    prompt += `- Plan de transición paso a paso\n\n`;
    
    prompt += `### 4. Meta Builds (Endgame)\n`;
    prompt += `- ¿Cuáles son los builds más fuertes para endgame?\n`;
    prompt += `- ¿El build actual tiene potencial competitivo?\n`;
    prompt += `- Prioriza mejoras por impacto en poder del build\n\n`;
    
    prompt += `### 5. Combinaciones No Obvias\n`;
    prompt += `- ¿Hay combinaciones de habilidades que la comunidad no usa pero podrían funcionar?\n`;
    prompt += `- ¿Qué sinergias entre tags/mecánicas están infrautilizadas?\n`;
    prompt += `- Sugiere al menos 2 combinaciones experimentales viables\n\n`;
    
    prompt += `---\n\n`;
    prompt += `## 📋 FORMATO DE RESPUESTA\n\n`;
    prompt += `Estructura tu análisis de forma clara y accionable:\n`;
    prompt += `1. Resumen ejecutivo (2-3 párrafos)\n`;
    prompt += `2. Arquetipos de build (desglosados)\n`;
    prompt += `3. Recomendaciones específicas para el personaje actual\n`;
    prompt += `4. Plan de acción inmediato (top 3 cambios a hacer ya)\n`;
    prompt += `5. Plan a largo plazo (evolución del build)\n\n`;
    
    prompt += `**IMPORTANTE**: Recuerda siempre las reglas de dependencia entre activas, modificadores y pasivas relacionadas.\n`;

    return prompt;
  }
}

