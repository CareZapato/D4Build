import React, { useState, useEffect } from 'react';
import { Copy, Check, Sparkles, Shield, Target, TrendingUp, Calculator, BarChart3, GitCompare, AlertCircle, Lock } from 'lucide-react';
import { Personaje, HabilidadActiva, HabilidadPasiva, Glifo, Aspecto, HabilidadesPersonaje, GlifosHeroe, AspectosHeroe } from '../../types';
import { WorkspaceService } from '../../services/WorkspaceService';

interface CharacterPromptsProps {
  personaje: Personaje;
}

const CharacterPrompts: React.FC<CharacterPromptsProps> = ({ personaje }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeSkills, setActiveSkills] = useState<HabilidadActiva[]>([]);
  const [passiveSkills, setPassiveSkills] = useState<HabilidadPasiva[]>([]);
  const [glyphs, setGlyphs] = useState<Glifo[]>([]);
  const [aspects, setAspects] = useState<Aspecto[]>([]);
  
  // Datos completos del héroe para comparación
  const [allHeroSkills, setAllHeroSkills] = useState<HabilidadesPersonaje | null>(null);
  const [allHeroGlyphs, setAllHeroGlyphs] = useState<GlifosHeroe | null>(null);
  const [allHeroAspects, setAllHeroAspects] = useState<AspectosHeroe | null>(null);

  useEffect(() => {
    loadCharacterData();
  }, [personaje.clase, personaje.habilidades_refs, personaje.glifos_refs, personaje.aspectos_refs]);

  const loadCharacterData = async () => {
    try {
      // Cargar datos del héroe
      const [heroSkills, heroGlyphs, heroAspects] = await Promise.all([
        WorkspaceService.loadHeroSkills(personaje.clase),
        WorkspaceService.loadHeroGlyphs(personaje.clase),
        WorkspaceService.loadHeroAspects(personaje.clase)
      ]);

      // Guardar todas las opciones disponibles
      setAllHeroSkills(heroSkills);
      setAllHeroGlyphs(heroGlyphs);
      setAllHeroAspects(heroAspects);

      // Resolver habilidades activas del personaje
      if (personaje.habilidades_refs?.activas && heroSkills) {
        const activasData = personaje.habilidades_refs.activas.map(ref => {
          const skill = heroSkills.habilidades_activas.find(s => s.id === ref.skill_id);
          if (skill) {
            const modificadoresEquipados = skill.modificadores?.filter(mod => 
              ref.modificadores_ids.includes(mod.id || '')
            ) || [];
            return { ...skill, modificadores: modificadoresEquipados, nivel: ref.nivel_actual ?? skill.nivel };
          }
          return null;
        }).filter(Boolean) as HabilidadActiva[];
        setActiveSkills(activasData);
      }

      // Resolver habilidades pasivas del personaje
      if (personaje.habilidades_refs?.pasivas && heroSkills) {
        const pasivasData = personaje.habilidades_refs.pasivas.map(pasiva => {
          const skillId = typeof pasiva === 'string' ? pasiva : pasiva.skill_id;
          const skill = heroSkills.habilidades_pasivas.find(s => s.id === skillId);
          if (skill && typeof pasiva !== 'string' && pasiva.puntos_asignados !== undefined) {
            return { ...skill, nivel: pasiva.puntos_asignados };
          }
          return skill;
        }).filter(Boolean) as HabilidadPasiva[];
        setPassiveSkills(pasivasData);
      }

      // Resolver glifos del personaje
      if (personaje.glifos_refs && heroGlyphs) {
        const glyphsData = personaje.glifos_refs.map(ref => {
          const glyph = heroGlyphs.glifos.find(g => g.id === ref.id);
          if (glyph) {
            return { ...glyph, nivel_actual: ref.nivel_actual };
          }
          return null;
        }).filter(Boolean) as Glifo[];
        setGlyphs(glyphsData);
      }

      // Resolver aspectos del personaje
      if (personaje.aspectos_refs && heroAspects) {
        const aspectsData = personaje.aspectos_refs.map(id => {
          return heroAspects.aspectos.find(a => a.id === id);
        }).filter(Boolean) as Aspecto[];
        setAspects(aspectsData);
      }
    } catch (error) {
      console.error('Error cargando datos del personaje:', error);
    }
  };

  const copyToClipboard = async (textOrPromise: string | Promise<string>, id: string) => {
    try {
      const text = typeof textOrPromise === 'string' ? textOrPromise : await textOrPromise;
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
    }
  };

  // ============================================
  // FUNCIONES HELPER PARA GENERAR CONTEXTOS
  // ============================================

  const getSkillsContext = () => {
    if (!activeSkills.length && !passiveSkills.length) return 'Ninguna habilidad equipada';
    
    let context = '';
    
    if (activeSkills.length > 0) {
      context += `\n**Habilidades Activas (${activeSkills.length}):**\n`;
      activeSkills.forEach(skill => {
        const nivelInfo = skill.nivel_maximo 
          ? `Nivel ${skill.nivel || 1}/${skill.nivel_maximo}` 
          : `Nivel ${skill.nivel || 1}`;
        const tipoInfo = skill.tipo ? ` | Tipo: ${skill.tipo}` : '';
        const ramaInfo = skill.rama ? ` | Rama: ${skill.rama}` : '';
        context += `\n- **${skill.nombre}** (${nivelInfo}${tipoInfo}${ramaInfo})\n`;
        
        if (skill.descripcion) context += `  ${skill.descripcion}\n`;
        
        if (skill.costo_recurso) {
          context += `  • Costo: ${skill.costo_recurso.cantidad} ${skill.costo_recurso.tipo}\n`;
        }
        if (skill.genera_recurso) {
          context += `  •Genera: ${skill.genera_recurso.cantidad} ${skill.genera_recurso.tipo}\n`;
        }
        if (skill.recuperacion_segundos) {
          context += `  • Recuperación: ${skill.recuperacion_segundos}s\n`;
        }
        if (skill.tipo_danio) {
          context += `  • Tipo de Daño: ${skill.tipo_danio}\n`;
        }
        
        if (skill.modificadores && skill.modificadores.length > 0) {
          context += `  • Modificadores equipados (${skill.modificadores.length}):\n`;
          skill.modificadores.forEach(mod => {
            context += `    - ${mod.nombre}: ${mod.descripcion}\n`;
            if (mod.efectos && mod.efectos.length > 0) {
              context += `      Efectos: ${mod.efectos.join(', ')}\n`;
            }
          });
        }
        
        if (skill.efectos_generados && skill.efectos_generados.length > 0) {
          context += `  • Efectos generados:\n`;
          skill.efectos_generados.forEach(efecto => {
            const duracion = efecto.duracion_segundos ? ` (${efecto.duracion_segundos}s)` : '';
            context += `    - ${efecto.nombre}${duracion}: ${efecto.descripcion || ''}\n`;
          });
        }
        
        if (skill.activa?.efecto) {
          context += `  • Efecto Activo: ${skill.activa.efecto}\n`;
        }
        if (skill.pasiva?.efectos && skill.pasiva.efectos.length > 0) {
          context += `  • Efectos Pasivos: ${skill.pasiva.efectos.join(', ')}\n`;
        }
        
        if (skill.tags && skill.tags.length > 0) {
          context += `  • Tags: ${skill.tags.join(', ')}\n`;
        }
      });
    }
    
    if (passiveSkills.length > 0) {
      context += `\n**Habilidades Pasivas (${passiveSkills.length}):**\n`;
      passiveSkills.forEach(skill => {
        const nivelInfo = skill.nivel_maximo 
          ? `${skill.nivel || 1}/${skill.nivel_maximo} puntos` 
          : `${skill.nivel || 1} punto${(skill.nivel || 1) > 1 ? 's' : ''}`;
        const tipoInfo = skill.tipo ? ` | ${skill.tipo}` : '';
        context += `\n- **${skill.nombre}** (${nivelInfo}${tipoInfo})\n`;
        
        if (skill.efecto) context += `  ${skill.efecto}\n`;
        if (skill.descripcion && skill.descripcion !== skill.efecto) {
          context += `  ${skill.descripcion}\n`;
        }
        
        if (skill.bonificaciones && skill.bonificaciones.length > 0) {
          context += `  • Bonificaciones: ${skill.bonificaciones.join(', ')}\n`;
        }
        if (skill.bonificacion_danio_actual) {
          context += `  • Bonificación de Daño Actual: ${skill.bonificacion_danio_actual}\n`;
        }
        
        if (skill.siguiente_rango) {
          const rangos = Object.entries(skill.siguiente_rango)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          if (rangos) context += `  • Siguiente Rango: ${rangos}\n`;
        }
        
        if (skill.tags && skill.tags.length > 0) {
          context += `  • Tags: ${skill.tags.join(', ')}\n`;
        }
      });
    }
    
    return context;
  };

  const getGlyphsContext = () => {
    if (!glyphs.length) return 'Ningún glifo equipado';
    
    let context = `**Glifos equipados (${glyphs.length}):**\n`;
    glyphs.forEach(glyph => {
      const nivelInfo = glyph.nivel_maximo 
        ? `Nivel ${glyph.nivel_actual || 0}/${glyph.nivel_maximo}` 
        : `Nivel ${glyph.nivel_actual || 0}`;
      const rarezaInfo = glyph.rareza ? ` | ${glyph.rareza}` : '';
      const estadoInfo = glyph.estado ? ` | Estado: ${glyph.estado}` : '';
      context += `\n- **${glyph.nombre}** (${nivelInfo}${rarezaInfo}${estadoInfo})\n`;
      
      if (glyph.tamano_radio) {
        context += `  • Radio: ${glyph.tamano_radio}\n`;
      }
      
      if (glyph.efecto_base) {
        const efecto = typeof glyph.efecto_base === 'string' 
          ? glyph.efecto_base 
          : glyph.efecto_base.descripcion;
        if (efecto) context += `  • Efecto Base: ${efecto}\n`;
      }
      
      if (glyph.atributo_escalado) {
        const escala = glyph.atributo_escalado;
        const condicion = escala.condicion ? ` (${escala.condicion})` : '';
        context += `  • Escalado: ${escala.bonificacion} por cada ${escala.cada} ${escala.atributo}${condicion}\n`;
      }
      
      if (glyph.bonificacion_adicional) {
        context += `  • Bonificación Adicional: ${glyph.bonificacion_adicional.descripcion}\n`;
        if (glyph.bonificacion_adicional.requisito) {
          const req = glyph.bonificacion_adicional.requisito;
          if (typeof req === 'string') {
            context += `    Requisito: ${req}\n`;
          } else if (typeof req === 'object' && 'atributo' in req) {
            context += `    Requisito: ${req.valor_requerido} ${req.atributo}\n`;
          }
        }
      }
      
      if (glyph.bonificacion_legendaria) {
        context += `  • Bonificación Legendaria: ${glyph.bonificacion_legendaria.descripcion}\n`;
        if (glyph.bonificacion_legendaria.requiere_mejora) {
          const req = glyph.bonificacion_legendaria.requiere_mejora;
          if (typeof req === 'string') {
            context += `    Requiere: ${req}\n`;
          } else if (typeof req === 'object' && 'rareza' in req) {
            context += `    Requiere: ${req.rareza} (Nivel ${req.desbloqueo_nivel})\n`;
          }
        }
      }
      
      if (glyph.requisitos_especiales) {
        context += `  • Requisitos Especiales: ${glyph.requisitos_especiales}\n`;
      }
      
      if (glyph.tags && glyph.tags.length > 0) {
        context += `  • Tags: ${glyph.tags.join(', ')}\n`;
      }
    });
    
    return context;
  };

  const getAspectsContext = () => {
    if (!aspects.length) return 'Ningún aspecto equipado';
    
    let context = `**Aspectos equipados (${aspects.length}):**\n`;
    aspects.forEach(aspect => {
      const categoria = aspect.category ? ` [${aspect.category}]` : '';
      const shortName = aspect.shortName && aspect.shortName !== aspect.name 
        ? ` (${aspect.shortName})` : '';
      const nivelInfo = aspect.level ? ` | Nivel: ${aspect.level}` : '';
      
      context += `\n- **${aspect.name}**${shortName}${categoria}${nivelInfo}\n`;
      
      if (aspect.effect) {
        context += `  ${aspect.effect}\n`;
      }
      
      if (aspect.tags && aspect.tags.length > 0) {
        context += `  • Tags: ${aspect.tags.join(', ')}\n`;
      }
    });
    
    return context;
  };

  const getStatsContext = () => {
    if (!personaje.estadisticas) return '';
    
    const stats = personaje.estadisticas;
    let context = `\n**Estadísticas:**`;
    
    context += `\n- Nivel: ${personaje.nivel}${personaje.nivel_paragon ? ` | Paragon: ${personaje.nivel_paragon}` : ''}`;
    
    if (stats.personaje) {
      const per = stats.personaje;
      if (per.danioArma) context += `\n- Daño de Arma: ${per.danioArma}`;
      if (per.aguante) context += `\n- Aguante Base: ${per.aguante}`;
    }
    
    if (stats.atributosPrincipales) {
      const attr = stats.atributosPrincipales;
      context += `\n\n**Atributos Principales:**`;
      if (attr.fuerza) context += `\n- Fuerza: ${attr.fuerza}`;
      if (attr.destreza) context += `\n- Destreza: ${attr.destreza}`;
      if (attr.inteligencia) context += `\n- Inteligencia: ${attr.inteligencia}`;
      if (attr.voluntad) context += `\n- Voluntad: ${attr.voluntad}`;
    }
    
    if (stats.defensivo) {
      const def = stats.defensivo;
      context += `\n\n**Estadísticas Defensivas:**`;
      if (def.vidaMaxima) context += `\n- Vida Máxima: ${def.vidaMaxima}`;
      if (def.vidaCada5Segundos) context += `\n- Vida cada 5 segundos: ${def.vidaCada5Segundos}`;
      if (def.vidaPorEliminacion) context += `\n- Vida por Eliminación: ${def.vidaPorEliminacion}`;
      if (def.sanacionRecibida) context += `\n- Sanación Recibida: +${def.sanacionRecibida}%`;
      if (def.cantidadPociones) context += `\n- Cantidad de Pociones: ${def.cantidadPociones}`;
      if (def.probabilidadBloqueo) context += `\n- Probabilidad de Bloqueo: ${def.probabilidadBloqueo}%`;
      if (def.reduccionBloqueo) context += `\n- Reducción de Bloqueo: ${def.reduccionBloqueo}%`;
      if (def.probabilidadEsquivar) context += `\n- Probabilidad de Esquivar: ${def.probabilidadEsquivar}%`;
      if (def.bonificacionFortificacion) context += `\n- Bonificación a Fortificación: +${def.bonificacionFortificacion}%`;
      if (def.bonificacionBarrera) context += `\n- Bonificación a Barrera: +${def.bonificacionBarrera}%`;
    }
    
    if (stats.armaduraYResistencias) {
      const arm = stats.armaduraYResistencias;
      context += `\n\n**Armadura y Resistencias:**`;
      if (arm.armadura) context += `\n- Armadura: ${arm.armadura}`;
      if (arm.aguante) context += `\n- Aguante: ${arm.aguante}`;
      if (arm.resistenciaDanioFisico) context += `\n- Resistencia Daño Físico: ${arm.resistenciaDanioFisico}%`;
      if (arm.resistenciaFuego) context += `\n- Resistencia Fuego: ${arm.resistenciaFuego}%`;
      if (arm.resistenciaFrio) context += `\n- Resistencia Frío: ${arm.resistenciaFrio}%`;
      if (arm.resistenciaRayo) context += `\n- Resistencia Rayo: ${arm.resistenciaRayo}%`;
      if (arm.resistenciaVeneno) context += `\n- Resistencia Veneno: ${arm.resistenciaVeneno}%`;
      if (arm.resistenciaSombra) context += `\n- Resistencia Sombra: ${arm.resistenciaSombra}%`;
    }
    
    if (stats.ofensivo) {
      const ofen = stats.ofensivo;
      context += `\n\n**Estadísticas Ofensivas:**`;
      if (ofen.danioBaseArma) context += `\n- Daño Base de Arma: ${ofen.danioBaseArma}`;
      if (ofen.velocidadArma) context += `\n- Velocidad de Arma: ${ofen.velocidadArma}`;
      if (ofen.bonificacionVelocidadAtaque) context += `\n- Bonif. Velocidad de Ataque: +${ofen.bonificacionVelocidadAtaque}%`;
      if (ofen.probabilidadGolpeCritico) context += `\n- Probabilidad Golpe Crítico: ${ofen.probabilidadGolpeCritico}%`;
      if (ofen.danioGolpeCritico) context += `\n- Daño Golpe Crítico: +${ofen.danioGolpeCritico}%`;
      if (ofen.probabilidadAbrumar) context += `\n- Probabilidad de Abrumar: ${ofen.probabilidadAbrumar}%`;
      if (ofen.danioAbrumador) context += `\n- Daño Abrumador: +${ofen.danioAbrumador}%`;
      if (ofen.todoElDanio) context += `\n- Todo el Daño: +${ofen.todoElDanio}%`;
      if (ofen.danioContraEnemigosVulnerables) context += `\n- Daño vs Vulnerables: +${ofen.danioContraEnemigosVulnerables}%`;
      if (ofen.danioVsEnemigosElite) context += `\n- Daño vs Élites: +${ofen.danioVsEnemigosElite}%`;
      if (ofen.danioVsEnemigosSaludables) context += `\n- Daño vs Saludables: +${ofen.danioVsEnemigosSaludables}%`;
      if (ofen.danioConSangrado) context += `\n- Daño con Sangrado: +${ofen.danioConSangrado}%`;
      if (ofen.danioConQuemadura) context += `\n- Daño con Quemadura: +${ofen.danioConQuemadura}%`;
      if (ofen.danioConVeneno) context += `\n- Daño con Veneno: +${ofen.danioConVeneno}%`;
      if (ofen.danioConCorrupcion) context += `\n- Daño con Corrupción: +${ofen.danioConCorrupcion}%`;
      if (ofen.espinas) context += `\n- Espinas: ${ofen.espinas}`;
    }
    
    if (stats.utilidad) {
      const util = stats.utilidad;
      context += `\n\n**Utilidad:**`;
      if (util.velocidadMovimiento) context += `\n- Velocidad de Movimiento: +${util.velocidadMovimiento}%`;
      if (util.reduccionRecuperacion) context += `\n- Reducción de Recuperación: ${util.reduccionRecuperacion}%`;
      if (util.bonificacionProbabilidadGolpeAfortunado) context += `\n- Bonif. Golpe Afortunado: +${util.bonificacionProbabilidadGolpeAfortunado}%`;
      if (util.maximoFe) context += `\n- Fe Máxima: ${util.maximoFe}`;
      if (util.regeneracionFe) context += `\n- Regeneración de Fe: ${util.regeneracionFe}`;
      if (util.reduccionCostoFe) context += `\n- Reducción Costo Fe: ${util.reduccionCostoFe}%`;
      if (util.feConCadaEliminacion) context += `\n- Fe por Eliminación: ${util.feConCadaEliminacion}`;
      if (util.bonificacionExperiencia) context += `\n- Bonif. Experiencia: +${util.bonificacionExperiencia}%`;
    }
    
    return context;
  };

  // Contexto de ALL available options para comparación
  const getAllSkillsContext = () => {
    if (!allHeroSkills) return '';
    
    let context = `\n**TODAS LAS HABILIDADES DISPONIBLES PARA ${personaje.clase.toUpperCase()}:**\n`;
    
    context += `\n--- Habilidades Activas (${allHeroSkills.habilidades_activas.length}) ---\n`;
    allHeroSkills.habilidades_activas.forEach(skill => {
      context += `- ${skill.nombre} (${skill.tipo} | ${skill.rama}): ${skill.descripcion?.slice(0, 100) || ''}...\n`;
      if (skill.tags && skill.tags.length > 0) {
        context += `  Tags: ${skill.tags.join(', ')}\n`;
      }
    });
    
    context += `\n--- Habilidades Pasivas (${allHeroSkills.habilidades_pasivas.length}) ---\n`;
    allHeroSkills.habilidades_pasivas.forEach(skill => {
      context += `- ${skill.nombre}: ${skill.efecto?.slice(0, 80) || ''}...\n`;
      if (skill.tags && skill.tags.length > 0) {
        context += `  Tags: ${skill.tags.join(', ')}\n`;
      }
    });
    
    return context;
  };

  const getParagonContext = () => {
    // Usar nuevo modelo de referencias (v0.5.1) con retrocompatibilidad
    const paragonRefs = personaje.paragon_refs;
    const atributosParagon = personaje.atributos_paragon;
    const paragonLegacy = personaje.paragon; // Retrocompatibilidad
    
    if (!paragonRefs && !paragonLegacy && !atributosParagon) {
      return 'Ningún dato de Paragon disponible';
    }
    
    let context = `\n**Sistema Paragon:**`;
    
    // Información general (desde atributos_paragon o paragon legacy)
    const nivelParagon = atributosParagon?.nivel_paragon ?? paragonLegacy?.nivel_paragon;
    const puntosGastados = atributosParagon?.puntos_gastados ?? paragonLegacy?.puntos_gastados;
    const puntosDisponibles = atributosParagon?.puntos_disponibles ?? paragonLegacy?.puntos_disponibles;
    
    if (nivelParagon) {
      context += `\n- Nivel Paragon: ${nivelParagon}`;
    }
    if (puntosGastados !== undefined && puntosGastados !== null) {
      context += `\n- Puntos Gastados: ${puntosGastados}`;
    }
    if (puntosDisponibles !== undefined && puntosDisponibles !== null) {
      context += `\n- Puntos Disponibles: ${puntosDisponibles}`;
    }
    
    // Tableros equipados (desde paragon_refs o paragon legacy)
    const tablerosEquipados = paragonRefs?.tableros_equipados || paragonLegacy?.tableros_equipados || [];
    
    if (tablerosEquipados && tablerosEquipados.length > 0) {
      context += `\n\n**Tableros Equipados (${tablerosEquipados.length}):**`;
      tablerosEquipados.forEach((tablero: any, index: number) => {
        const tableroId = tablero.tablero_id || tablero.id || `tablero_${index}`;
        context += `\n- Posición ${tablero.posicion ?? index}: ${tableroId}`;
        if (tablero.rotacion !== undefined) {
          context += ` (Rotación: ${tablero.rotacion}°)`;
        }
        const nodosActivados = tablero.nodos_activados || tablero.nodos_activados_ids || [];
        if (nodosActivados && nodosActivados.length > 0) {
          context += `\n  • Nodos activados: ${nodosActivados.length}`;
        }
        if (tablero.zocalo_glifo) {
          context += `\n  • Glifo equipado: ${tablero.zocalo_glifo.glifo_id} (Nivel ${tablero.zocalo_glifo.nivel_glifo})`;
        }
      });
    }
    
    // @deprecated (v0.5.3) - Los atributos acumulados ahora se manejan en estadisticas.atributosPrincipales
    // Los atributos Paragon se suman directamente a los atributos principales del personaje
    // const atributosAcumulados = atributosParagon?.atributos_acumulados || paragonLegacy?.atributos_acumulados || [];
    // Ya no duplicamos esta información aquí
    
    // Total de nodos activados (desde paragon_refs o paragon legacy)
    const nodosActivadosTotal = paragonRefs?.nodos_activados_ids || paragonLegacy?.nodos_activados_total || [];
    
    if (nodosActivadosTotal && nodosActivadosTotal.length > 0) {
      context += `\n\n**Total de Nodos Activados: ${nodosActivadosTotal.length}**`;
    }
    
    // Nodos huérfanos (solo en paragon_refs v0.5.1)
    if (paragonRefs?.nodos_huerfanos && paragonRefs.nodos_huerfanos.length > 0) {
      context += `\n\n**⚠️ Nodos Huérfanos (sin tablero asignado): ${paragonRefs.nodos_huerfanos.length}**`;
      context += `\n- Estos nodos se enlazarán automáticamente al agregar los tableros correspondientes`;
    }
    
    return context;
  };

  const getAllGlyphsContext = () => {
    if (!allHeroGlyphs) return '';
    
    let context = `\n**TODOS LOS GLIFOS DISPONIBLES PARA ${personaje.clase.toUpperCase()} (${allHeroGlyphs.glifos.length}):**\n`;
    
    allHeroGlyphs.glifos.forEach(glyph => {
      const efecto = typeof glyph.efecto_base === 'string' 
        ? glyph.efecto_base 
        : glyph.efecto_base?.descripcion || '';
      context += `- ${glyph.nombre} (${glyph.rareza}): ${efecto.slice(0, 80)}...\n`;
      if (glyph.tags && glyph.tags.length > 0) {
        context += `  Tags: ${glyph.tags.join(', ')}\n`;
      }
    });
    
    return context;
  };

  const getAllAspectsContext = () => {
    if (!allHeroAspects) return '';
    
    let context = `\n**TODOS LOS ASPECTOS DISPONIBLES PARA ${personaje.clase.toUpperCase()} (${allHeroAspects.aspectos.length}):**\n`;
    
    // Agrupar por categoría
    const porCategoria: Record<string, Aspecto[]> = {};
    allHeroAspects.aspectos.forEach(aspect => {
      const cat = aspect.category || 'sin_categoria';
      if (!porCategoria[cat]) porCategoria[cat] = [];
      porCategoria[cat].push(aspect);
    });
    
    Object.entries(porCategoria).forEach(([categoria, aspectos]) => {
      context += `\n--- ${categoria.toUpperCase()} (${aspectos.length}) ---\n`;
      aspectos.forEach(aspect => {
        context += `- ${aspect.name}: ${aspect.effect.slice(0, 80)}...\n`;
        if (aspect.tags && aspect.tags.length > 0) {
          context += `  Tags: ${aspect.tags.join(', ')}\n`;
        }
      });
    });
    
    return context;
  };

  // ============================================
  // DEFINICIÓN DE PROMPTS
  // ============================================

  interface PromptConfig {
    id: string;
    title: string;
    icon: any;
    color: string;
    bg: string;
    border: string;
    description: string;
    requiresHeroData?: boolean;
    requiredData: {
      skills?: boolean;
      glyphs?: boolean;
      aspects?: boolean;
      stats?: boolean;
    };
    generate: () => string | Promise<string>;
  }

  const prompts: PromptConfig[] = [
    // ========== DIAGNÓSTICO BUILD ACTUAL ==========
    {
      id: 'build-diagnosis',
      title: '🩺 Diagnóstico Completo de Build',
      icon: Target,
      color: 'text-purple-400',
      bg: 'bg-purple-900/20',
      border: 'border-purple-600',
      description: 'Análisis profundo de puntos fuertes, débiles y qué cambiar/mejorar/mantener',
      requiredData: { skills: true, glyphs: false, aspects: false, stats: false },
      generate: () => `Actúa como un experto en builds de Diablo 4 especializado en la clase ${personaje.clase}. Analiza mi build ACTUAL y proporciona un **diagnóstico profesional detallado**.

**📋 INFORMACIÓN BÁSICA:**
- Clase: ${personaje.clase}
- Nivel: ${personaje.nivel}${personaje.nivel_paragon ? ` | Paragon: ${personaje.nivel_paragon}` : ''}

${getSkillsContext()}

${getGlyphsContext()}

${getAspectsContext()}

${getParagonContext()}

${getStatsContext()}

**🎯 ANÁLISIS SOLICITADO:**

1. **✅ PUNTOS FUERTES**
   - ¿Cuáles son las fortalezas clave de esta configuración?
   - ¿Qué sinergias están funcionando excepcionalmente bien?
   - ¿Qué elementos debo MANTENER sin cambios?

2. **⚠️ PUNTOS DÉBILES**
   - ¿Cuáles son las debilidades críticas?
   - ¿Qué aspectos comprometen la efectividad?
   - ¿Dónde estoy siendo menos eficiente?

3. **🔄 QUÉ CAMBIAR**
   - ¿Qué elementos debo reemplazar prioritariamente?
   - ¿Qué cambios tendrían el mayor impacto positivo?
   - Prioriza los cambios por importancia (crítico > alto > medio)

4. **📈 QUÉ MEJORAR**
   - ¿Qué aspectos puedo potenciar sin cambiar elementos?
   - ¿Qué modificaciones incrementales recomendarías?
   - ¿Cómo optimizar lo que ya tengo?

5. **🏷️ ANÁLISIS DE TAGS Y SINERGIAS**
   - Examina los tags presentes en habilidades/glifos/aspectos
   - Identifica tags que se repiten (sinergias potenciales)
   - Detecta tags ausentes que serían valiosos

6. **🎮 ESTILO DE JUEGO**
   - ¿Esta build es ofensiva, defensiva o balanceada?
   - ¿Para qué tipo de contenido es óptima?
   - ¿Qué estilo de combate favorece?

**💾 INSTRUCCIÓN PARA LA IA:**
Por favor, GUARDA en tu memoria de conversación:
- Los tags clave identificados
- Las sinergias principales detectadas
- Los cambios prioritarios sugeridos
Esto será útil para análisis futuros más profundos.`
    },

    // ========== ANÁLISIS MATEMÁTICO DAÑO ==========
    {
      id: 'math-damage-analysis',
      title: '🧮 Análisis Matemático: Daño',
      icon: Calculator,
      color: 'text-red-400',
      bg: 'bg-red-900/20',
      border: 'border-red-600',
      description: 'Desglose matemático de cómo se calcula tu daño y qué multiplicadores influyen',
      requiredData: { skills: true, stats: true },
      generate: () => `Actúa como un experto en **teorycrafting matemático** de Diablo 4. Realiza un análisis cuantitativo de mi DPS y multiplicadores de daño.

**📊 MIS DATOS ACTUALES:**
- Clase: ${personaje.clase}
- Nivel: ${personaje.nivel}${personaje.nivel_paragon ? ` | Paragon: ${personaje.nivel_paragon}` : ''}

${getSkillsContext()}
${getGlyphsContext()}
${getAspectsContext()}
${getStatsContext()}

**🧮 ANÁLISIS MATEMÁTICO SOLICITADO:**

1. **FÓRMULA BASE DE DAÑO**
   - Explica la fórmula general de cálculo de daño en D4
   - Identifica cada multiplicador que aplica a mi build
   - Muestra cómo se combinan (aditivos vs multiplicativos)

2. **DESGLOSE DE MULTIPLICADORES ACTUALES**
   - Daño base de arma: ${personaje.estadisticas?.ofensivo?.danioBaseArma || 'N/A'}
   - Velocidad de ataque: ${personaje.estadisticas?.ofensivo?.velocidadArma || 'N/A'}
   - Crítico: ${personaje.estadisticas?.ofensivo?.probabilidadGolpeCritico || 'N/A'}% prob, +${personaje.estadisticas?.ofensivo?.danioGolpeCritico || 'N/A'}% daño
   - Bonificaciones generales: Todo el daño +${personaje.estadisticas?.ofensivo?.todoElDanio || 'N/A'}%
   - Bonificaciones condicionales: Vulnerables, Élites, Saludables, etc.

3. **IMPACTO DE HABILIDADES Y ASPECTOS**
   - ¿Qué multiplicadores aportan mis habilidades activas?
   - ¿Qué bonificaciones dan mis aspectos?
   - ¿Qué bonificaciones aportan los nodos Paragon?
   - ¿Cómo escalan con mis stats?

4. **CÁLCULO ESTIMADO DE DPS**
   - Proporciona una estimación matemática de DPS base
   - DPS con buffs activos
   - DPS en condiciones óptimas (críticos, vulnerables, etc.)

5. **OPTIMIZACIÓN MATEMÁTICA**
   - ¿Qué stat tiene mayor impacto por punto invertido?
   - ¿Hay breakpoints importantes que debería alcanzar?
   - ¿Los nodos Paragon están optimizados para daño?
   - ¿Dónde invertir para maximizar DPS? (Prioridad matemática)

6. **QUÉ FALTA PARA ENTENDER MEJOR**
   - ¿Qué información adicional necesitas para cálculos más precisos?
   - ¿Qué stats me falta cargar en la app?
   - Sugerencias para completar datos

**💾 INSTRUCCIÓN PARA LA IA:**
Guarda en memoria:
- Los multiplicadores clave identificados
- Los breakpoints calculados
- Las prioridades de optimización matemática`
    },

    // ========== ANÁLISIS MATEMÁTICO SUPERVIVENCIA ==========
    {
      id: 'math-defense-analysis',
      title: '🛡️ Análisis Matemático: Supervivencia',
      icon: Shield,
      color: 'text-blue-400',
      bg: 'bg-blue-900/20',
      border: 'border-blue-600',
      description: 'Cálculo de reducción de daño efectiva (EHP) y análisis defensivo',
      requiredData: { stats: true },
      generate: () => `Actúa como un experto en **matemáticas defensivas** de Diablo 4. Analiza mi efectividad de supervivencia (EHP - Effective Health Pool).

**📊 MIS DATOS DEFENSIVOS:**
- Clase: ${personaje.clase}
- Nivel: ${personaje.nivel}${personaje.nivel_paragon ? ` | Paragon: ${personaje.nivel_paragon}` : ''}

${getStatsContext()}

**🛡️ ANÁLISIS MATEMÁTICO SOLICITADO:**

1. **CÁLCULO DE EHP (VIDA EFECTIVA)**
   - Vida base: ${personaje.estadisticas?.defensivo?.vidaMaxima || 'N/A'}
   - Armadura: ${personaje.estadisticas?.armaduraYResistencias?.armadura || 'N/A'}
   - Aguante: ${personaje.estadisticas?.armaduraYResistencias?.aguante || 'N/A'}
   - Resistencias elementales
   - Calcula EHP efectivo contra diferentes tipos de daño

2. **FÓRMULA DE REDUCCIÓN DE DAÑO**
   - Explica cómo funciona la armadura en D4
   - Explica cómo funciona el aguante
   - Explica cómo se calculan las resistencias
   - Muestra la fórmula combinada

3. **REDUCCIÓN DE DAÑO TOTAL ESTIMADA**
   - % de reducción por armadura
   - % de reducción por aguante
   - % de reducción por resistencias
   - Reducción combinada total (si aplica multiplicativamente)

4. **ANÁLISIS DE SUSTAIN (REGENERACIÓN)**
   - Vida cada 5 segundos: ${personaje.estadisticas?.defensivo?.vidaCada5Segundos || 'N/A'}
   - Vida por eliminación: ${personaje.estadisticas?.defensivo?.vidaPorEliminacion || 'N/A'}
   - Sanación recibida: +${personaje.estadisticas?.defensivo?.sanacionRecibida || 'N/A'}%
   - Cantidad de pociones: ${personaje.estadisticas?.defensivo?.cantidadPociones || 'N/A'}
   - ¿Es suficiente para contenido de alto nivel?

5. **BALANCE VIDA VS MITIGACIÓN**
   - ¿Tengo demasiada vida y poca mitigación? (o viceversa)
   - ¿Cuál es el ratio óptimo vida/armadura/aguante?
   - Recomendaciones para balancear

6. **OPTIMIZACIÓN DEFENSIVA**
   - ¿Qué stat defensivo tiene mayor impacto por punto?
   - ¿Hay breakpoints de aguante/armadura importantes?
   - Prioridades de inversión matemática

**💾 INSTRUCCIÓN PARA LA IA:**
Guarda en memoria:
- El EHP calculado
- Los ratios óptimos identificados
- Las prioridades defensivas matemáticas`
    },

    // ========== COMPARATIVO HABILIDADES (MULTI-STAGE) ==========
    {
      id: 'skills-comparison-stage1',
      title: '🔄 Comparativo Habilidades (Stage 1)',
      icon: GitCompare,
      color: 'text-green-400',
      bg: 'bg-green-900/20',
      border: 'border-green-600',
      description: 'Generación de resumen de todas las opciones disponibles vs equipadas',
      requiresHeroData: true,
      requiredData: { skills: true },
      generate: () => `Genera un **RESUMEN COMPARATIVO** de habilidades para mi ${personaje.clase}.

**📋 HABILIDADES ACTUALES DEL PERSONAJE:**
${getSkillsContext()}

**📚 TODAS LAS OPCIONES DISPONIBLES:**
${getAllSkillsContext()}

**🎯 TAREA:**

1. **RESUMEN DE LO EQUIPADO**
   - Resume en 2-3 líneas la estrategia actual de habilidades
   - Identifica el "tema" o enfoque principal

2. **ALTERNATIVAS POR CATEGORÍA**
   - Para cada categoría de habilidad (Básica, Principal, Definitiva, etc.)
   - Lista 2-3 alternativas más interesantes que NO están equipadas
   - Explica brevemente qué las hace valiosas

3. **ANÁLISIS DE TAGS**
   - Tags presentes en build actual
   - Tags ausentes que podrían generar sinergias
   - Habilidades alternativas que aportarían esos tags

4. **RESUMEN EJECUTIVO**
   - Genera un párrafo condensado con las conclusiones clave
   - Este resumen será la entrada para el Stage 2

**💾 IMPORTANTE:**
GUARDA este resumen completo en la memoria de la conversación.
Lo usaremos en el siguiente análisis (Stage 2) para recomendaciones profundas.`
    },

    {
      id: 'skills-comparison-stage2',
      title: '🔍 Comparativo Habilidades (Stage 2)',
      icon: BarChart3,
      color: 'text-green-400',
      bg: 'bg-green-900/20',
      border: 'border-green-600',
      description: 'Análisis profundo con el resumen previo + recomendaciones específicas',
      requiresHeroData: true,
      requiredData: { skills: true },
      generate: () => `Basándote en el **resumen que guardaste** en Stage 1, realiza un análisis profundo y proporciona recomendaciones concretas.

**📋 RECORDATORIO DE MIS DATOS:**
- Clase: ${personaje.clase}
- Habilidades actuales: ${activeSkills.map(s => s.nombre).join(', ')}

**🔍 ANÁLISIS PROFUNDO SOLICITADO:**

1. **COMPARATIVA DETALLADA**
   - Para cada habilidad que tengo equipada, compárala con las 2 mejores alternativas
   - Usa una tabla comparativa (nombre | ventajas | desventajas | sinergias)

2. **RECOMENDACIONES PRIORIZADAS**
   - TOP 3 cambios de habilidades que deberías hacer YA
   - TOP 3 cambios opcionales para estilos alternativos
   - Justifica cada recomendación con datos numéricos

3. **BUILDS ALTERNATIVAS COMPLETAS**
   - Propón 2 configuraciones diferentes usando habilidades disponibles
   - Build A: Máximo daño ofensivo
   - Build B: Balance daño/supervivencia
   - Lista completa de habilidades para cada una

4. **ANÁLISIS MATEMÁTICO**
   - ¿Qué build teoricamente haría más DPS?
   - ¿Qué build sería más resiliente?
   - Compara multiplicadores y sinergias numéricas

5. **ROADMAP DE OPTIMIZACIÓN**
   - Paso 1: Cambio inmediato (mayor impacto)
   - Paso 2: Ajuste secundario
   - Paso 3: Optimización fina
   - Considera dificultad de obtención de items

**💾 INSTRUCCIÓN FINAL:**
Actualiza la memoria de conversación con:
- Las builds alternativas sugeridas
- Los cambios prioritarios validados
- El roadmap de optimización establecido`
    },

    // ========== COMPARATIVO GLIFOS (MULTI-STAGE) ==========
    {
      id: 'glyphs-comparison-stage1',
      title: '🔄 Comparativo Glifos (Stage 1)',
      icon: GitCompare,
      color: 'text-cyan-400',
      bg: 'bg-cyan-900/20',
      border: 'border-cyan-600',
      description: 'Resumen de glifos equipados vs todas las opciones disponibles',
      requiresHeroData: true,
      requiredData: { glyphs: true },
      generate: () => `Genera un **RESUMEN COMPARATIVO** de glifos para mi ${personaje.clase}.

**📋 GLIFOS ACTUALES DEL PERSONAJE:**
${getGlyphsContext()}

**📚 TODOS LOS GLIFOS DISPONIBLES:**
${getAllGlyphsContext()}

**🎯 TAREA:**

1. **RESUMEN DE GLIFOS EQUIPADOS**
   - Resume la estrategia actual de glifos en 2-3 líneas
   - ¿Están orientados a daño, defensa o híbrido?

2. **ALTERNATIVAS DESTACADAS**
   - Lista los 5 glifos NO equipados más relevantes
   - Para cada uno: nombre, rareza, efecto principal
   - Señala qué los hace valiosos

3. **ANÁLISIS DE ESCALADOS**
   - ¿Qué atributos escalan mis glifos actuales? (Fuerza, Destreza, etc.)
   - ¿Hay glifos alternativos que escalen con los mismos atributos?
   - ¿Tengo atributos altos sin aprovechar en glifos?

4. **NIVEL Y RAREZA**
   - ¿Mis glifos están al nivel máximo?
   - ¿Hay glifos de mayor rareza sin equipar?
   - Prioridad de subida de nivel

5. **RESUMEN EJECUTIVO**
   - Párrafo condensado con conclusiones clave
   - A guardar para Stage 2

**💾 IMPORTANTE:**
GUARDA este resumen en la memoria.
Lo usaremos en Stage 2 para recomendaciones de reemplazo.`
    },

    {
      id: 'glyphs-comparison-stage2',
      title: '🔍 Comparativo Glifos (Stage 2)',
      icon: BarChart3,
      color: 'text-cyan-400',
      bg: 'bg-cyan-900/20',
      border: 'border-cyan-600',
      description: 'Análisis profundo de glifos con recomendaciones específicas',
      requiresHeroData: true,
      requiredData: { glyphs: true },
      generate: () => `Basándote en el **resumen de Stage 1**, realiza un análisis profundo de glifos.

**📋 RECORDATORIO:**
- Clase: ${personaje.clase}
- Glifos actuales: ${glyphs.map(g => g.nombre).join(', ')}

**🔍 ANÁLISIS PROFUNDO:**

1. **COMPARATIVA 1 A 1**
   - Para cada glifo equipado, compáralo con 2 alternativas
   - Tabla: Glifo Actual | Alternativa 1 | Alternativa 2
   - Columnas: Efecto base, Escalado, Bonif. adicional, Tags

2. **OPTIMIZACIÓN DE ATRIBUTOS**
   - Mis atributos: ${personaje.estadisticas?.atributosPrincipales ? `Fuerza: ${personaje.estadisticas.atributosPrincipales.fuerza || 'N/A'}, Destreza: ${personaje.estadisticas.atributosPrincipales.destreza || 'N/A'}, Int: ${personaje.estadisticas.atributosPrincipales.inteligencia || 'N/A'}, Vol: ${personaje.estadisticas.atributosPrincipales.voluntad || 'N/A'}` : 'N/A'}
   - ¿Qué glifos aprovechan mejor mis stats altos?
   - ¿Hay glifos que requieren atributos que NO tengo?

3. **SINERGIA CON HABILIDADES**
   - Para cada glifo, analiza sinergia con mis skills:
${getSkillsContext()}
   - ¿Qué glifos potenciarían más mis habilidades actuales?
   - ¿Hay glifos desperdiciados?

4. **RECOMENDACIONES PRIORIZADAS**
   - TOP 3 cambios de glifos inmediatos
   - TOP 3 glifos para subir de nivel primero
   - Justificación matemática de cada recomendación

5. **CONFIGURACIÓN ÓPTIMA**
   - Propón setup de glifos "Build A: Máximo DPS"
   - Propón setup "Build B: Máximo sustain"
   - Lista completa de glifos para cada build

**💾 ACTUALIZA MEMORIA:**
- Glifos prioritarios identificados
- Setup óptimo por builds
- Prioridades de leveleo`
    },

    // ========== COMPARATIVO ASPECTOS (MULTI-STAGE) ==========
    {
      id: 'aspects-comparison-stage1',
      title: '🔄 Comparativo Aspectos (Stage 1)',
      icon: GitCompare,
      color: 'text-amber-400',
      bg: 'bg-amber-900/20',
      border: 'border-amber-600',
      description: 'Resumen de aspectos equipados vs todas las opciones disponibles',
      requiresHeroData: true,
      requiredData: { aspects: true },
      generate: () => `Genera un **RESUMEN COMPARATIVO** de aspectos para mi ${personaje.clase}.

**📋 ASPECTOS ACTUALES:**
${getAspectsContext()}

**📚 TODOS LOS ASPECTOS DISPONIBLES:**
${getAllAspectsContext()}

**🎯 TAREA:**

1. **RESUMEN POR CATEGORÍA**
   - Ofensivos: cuántos tengo, cuántos hay disponibles
   - Defensivos: cuántos tengo, cuántos hay disponibles
   - Utilidad/Movilidad/Recurso: distribución

2. **ASPECTOS TOP TIER FALTANTES**
   - Lista los aspectos "meta" o tier S que NO tengo equipados
   - Para cada uno: categoría, efecto resumido
   - ¿Por qué son considerados meta?

3. **ANÁLISIS DE TAGS**
   - Tags presentes en aspectos actuales
   - Tags ausentes que generarían sinergias
   - Aspectos alternativos que tienen esos tags

4. **ASPECTOS SITUACIONALES**
   - ¿Hay aspectos útiles para contenido específico? (Pit, Bosses, AoE, etc.)
   - Sugiere aspectos "swap" según situación

5. **RESUMEN EJECUTIVO**
   - Párrafo con conclusiones clave
   - A guardar para Stage 2

**💾 GUARDA RESUMEN EN MEMORIA**`
    },

    {
      id: 'aspects-comparison-stage2',
      title: '🔍 Comparativo Aspectos (Stage 2)',
      icon: BarChart3,
      color: 'text-amber-400',
      bg: 'bg-amber-900/20',
      border: 'border-amber-600',
      description: 'Análisis profundo de aspectos con prioridades de farmeo',
      requiresHeroData: true,
      requiredData: { aspects: true },
      generate: () => `Basándote en el **resumen de Stage 1**, realiza análisis profundo de aspectos.

**📋 RECORDATORIO:**
- Clase: ${personaje.clase}
- Aspectos actuales: ${aspects.map(a => a.name).join(', ')}

**🔍 ANÁLISIS PROFUNDO:**

1. **TABLA COMPARATIVA POR SLOT**
   - Para cada slot típico (arma, armadura, accesorios)
   - Aspecto Actual | Mejor Alternativa | 2da Mejor
   - Columnas: Efecto, Categoría, Nivel óptimo, Tags

2. **SINERGIA COMPLETA**
   - Analiza cómo los aspectos actuales trabajan juntos
   - ¿Hay aspectos que se potencian entre sí?
   - ¿Hay aspectos contradictorios o desperdiciados?

3. **PRIORIDAD DE FARMEO**
   - TOP 5 aspectos que debo farmear/extraer YA
   - Para cada uno:
     - Dónde se obtiene (dungeon/boss/codex)
     - Por qué es prioritario
     - Qué aspecto actual reemplaza
     - Impacto estimado (alto/medio/bajo)

4. **BUILDS ALTERNATIVAS**
   - "Build A: Máximo DPS": Setup completo de aspectos
   - "Build B: Speedfarm": Setup para clear rápido
   - "Build C: Bosses": Setup para single-target

5. **ANÁLISIS MATEMÁTICO**
   - Para aspectos de daño: calcula multiplicador teórico
   - Para aspectos defensivos: calcula reducción/EHP ganado
   - Justifica recomendaciones con números

6. **ROADMAP DE MEJORA**
   - Semana 1: Farmear estos 2 aspectos (mayor impacto)
   - Semana 2-3: Estos 3 aspectos (optimización)
   - Long-term: Aspectos situacionales

**💾 ACTUALIZA MEMORIA:**
- Aspectos meta identificados
- Roadmap de farmeo establecido
- Builds alternativas con aspectos completos`
    },

    // ========== PROMPTS CLÁSICOS MEJORADOS ==========
    {
      id: 'rotation-advanced',
      title: '🎯 Rotación de Combate Avanzada',
      icon: TrendingUp,
      color: 'text-orange-400',
      bg: 'bg-orange-900/20',
      border: 'border-orange-600',
      description: 'Rotación óptima considerando recursos, CDs y sinergias',
      requiredData: { skills: true },
      generate: () => `Como experto en optimización de combate en Diablo 4, crea una **rotación de habilidades óptima** para mi ${personaje.clase}.

**🎮 MIS HABILIDADES:**
${getSkillsContext()}

**🛡️ CONTEXTO ADICIONAL:**
${getGlyphsContext()}
${getAspectsContext()}

**🎯 ROTACIÓN SOLICITADA:**

1. **APERTURA DE COMBATE (Primeros 5 segundos)**
   - Secuencia exacta de habilidades
   - Justificación de cada paso (buffs, debuffs, posicionamiento)

2. **ROTACIÓN PARA TRASH MOBS (AoE)**
   - Ciclo repetitivo óptimo
   - Prioridades si hay múltiples enemigos
   - Gestión de recursos (generar/gastar)

3. **ROTACIÓN SINGLE-TARGET (Bosses/Élites)**
   - Maximizar daño contra un objetivo
   - Timing de cooldowns
   - Ventanas de burst damage

4. **GESTIÓN DE RECURSOS**
   - ¿Cómo genero recursos de manera eficiente?
   - ¿Cuándo gastar y cuándo conservar?
   - Nivel óptimo de recursos para mantener

5. **SINERGIA DE HABILIDADES**
   - ¿Qué habilidades debo usar juntas?
   - ¿Hay combos específicos?
   - ¿Qué buffs/debuffs debo stackear?

6. **ERRORES COMUNES A EVITAR**
   - Malos hábitos en la rotación
   - Desperdicios de recursos o cooldowns
   - Timing incorrecto

**🎬 FORMATO TABLA:**
Proporciona la rotación en formato tabla:
| Paso | Habilidad | Razón | Recursos | Notas |`
    },

    {
      id: 'endgame-report',
      title: '🏆 Reporte Endgame Completo',
      icon: Target,
      color: 'text-red-400',
      bg: 'bg-red-900/20',
      border: 'border-red-600',
      description: 'Evaluación completa para viabilidad en Pit, NM dungeons, bosses',
      requiredData: { skills: true, stats: true },
      generate: () => `Como experto en contenido endgame de Diablo 4, evalúa la **viabilidad completa** de mi build.

**📊 BUILD COMPLETA:**
- Clase: ${personaje.clase}
- Nivel: ${personaje.nivel} | Paragon: ${personaje.nivel_paragon || 'N/A'}

${getSkillsContext()}
${getGlyphsContext()}
${getAspectsContext()}
${getStatsContext()}

**🏆 EVALUACIÓN POR CONTENIDO:**

1. **PIT CORRUPTO (Empujes)**
   - Tier estimado viabilidad: ¿Hasta qué tier puedo llegar?
   - Puntos fuertes para Pit
   - Puntos débiles críticos
   - Cambios necesarios para empujar +5 tiers

2. **MAZMORRAS NIGHTMARE (T4)**
   - ¿Puedo farmear T4 eficientemente?
   - Velocidad de clear estimada (lenta/media/rápida)
   - Survivability en mob density alta
   - Optimizaciones para speedfarm

3. **BOSSES DE ENDGAME**
   - Lilith: Evaluación de viabilidad
   - Duriel/Andariel: ¿Puedo matarlos?
   - Otros bosses pinnacle
   - DPS estimado vs 100M HP

4. **CONTENIDO EN GRUPO**
   - ¿Cómo performo en grupo vs solo?
   - ¿Qué rol cumplo? (DPS/Tank/Support/Hybrid)
   - Sinergias con otras clases

5. **RATING GENERAL DE BUILD**
   - Tier List: S / A / B / C / D / F
   - Justificación del tier
   - Distancia al tier superior (qué falta)

6. **ROADMAP A TIER S**
   - Cambio 1 (Crítico): ...
   - Cambio 2 (Importante): ...
   - Cambio 3 (Optimización): ...
   - Inversión estimada de tiempo

**📈 BENCHMARK NUMÉRICO:**
- DPS estimado: ... millones
- EHP estimado: ... millones
- Velocidad de clear: ... mobs/min
- Healing sostenido: ... HP/s`
    },

    // ========== ANÁLISIS COMPLETO DE PARAGON ==========
    {
      id: 'paragon-analysis',
      title: '⭐ Análisis Completo de Paragon',
      icon: Sparkles,
      color: 'text-purple-400',
      bg: 'bg-purple-900/20',
      border: 'border-purple-600',
      description: 'Análisis profundo del sistema Paragon: tableros, nodos, glifos y sinergias',
      requiredData: { stats: true },
      generate: async () => {
        const { PromptService } = await import('../../services/PromptService');
        return await PromptService.generateParagonAnalysisPrompt(personaje);
      }
    },

    // ========== OPTIMIZACIÓN DE NODOS PARAGON ==========
    {
      id: 'paragon-optimization',
      title: '🎯 Optimización de Nodos Paragon',
      icon: Target,
      color: 'text-orange-400',
      bg: 'bg-orange-900/20',
      border: 'border-orange-600',
      description: 'Compara nodos equipados vs disponibles para maximizar eficiencia del build',
      requiresHeroData: true,
      requiredData: { stats: true },
      generate: async () => {
        const { PromptService } = await import('../../services/PromptService');
        return await PromptService.generateParagonOptimizationPrompt(personaje);
      }
    },

    // ========== COMPARACIÓN DE NODOS ==========
    {
      id: 'paragon-node-comparison',
      title: '🔍 Comparación Estratégica de Nodos',
      icon: GitCompare,
      color: 'text-cyan-400',
      bg: 'bg-cyan-900/20',
      border: 'border-cyan-600',
      description: 'Analiza y compara nodos específicos para decisiones estratégicas',
      requiresHeroData: true,
      requiredData: { stats: true },
      generate: async () => {
        const { PromptService } = await import('../../services/PromptService');
        return await PromptService.generateParagonNodeComparisonPrompt(personaje);
      }
    }
  ];

  // ============================================
  // LÓGICA DE ACTIVACIÓN CONDICIONAL
  // ============================================

  const isPromptAvailable = (prompt: PromptConfig): { available: boolean; reason?: string } => {
    // Verificar datos requeridos del personaje
    if (prompt.requiredData.skills && !activeSkills.length && !passiveSkills.length) {
      return { available: false, reason: '⚠️ No hay habilidades cargadas' };
    }
    if (prompt.requiredData.glyphs && !glyphs.length) {
      return { available: false, reason: '⚠️ No hay glifos cargados' };
    }
    if (prompt.requiredData.aspects && !aspects.length) {
      return { available: false, reason: '⚠️ No hay aspectos cargados' };
    }
    if (prompt.requiredData.stats && !personaje.estadisticas) {
      return { available: false, reason: '⚠️ No hay estadísticas cargadas' };
    }

    // Verificar datos del  héroe si se requieren para comparación
    if (prompt.requiresHeroData) {
      if (prompt.requiredData.skills && !allHeroSkills) {
        return { available: false, reason: '🔒 Requiere datos de habilidades del héroe' };
      }
      if (prompt.requiredData.glyphs && !allHeroGlyphs) {
        return { available: false, reason: '🔒 Requiere datos de glifos del héroe' };
      }
      if (prompt.requiredData.aspects && !allHeroAspects) {
        return { available: false, reason: '🔒 Requiere datos de aspectos del héroe' };
      }
    }

    return { available: true };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-d4-accent mb-2">Generador de Prompts Avanzado</h2>
        <p className="text-d4-text-dim">
          Prompts inteligentes con análisis profundos, comparativos y matemáticos para IA
        </p>
      </div>

      {/* Character Info Card */}
      <div className="card bg-d4-accent/5 border-d4-accent/30">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-5 h-5 text-d4-accent" />
          <h3 className="font-bold text-d4-text">Información del Personaje</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-d4-text-dim">Nombre:</span>
            <span className="ml-2 text-d4-text font-semibold">{personaje.nombre}</span>
          </div>
          <div>
            <span className="text-d4-text-dim">Clase:</span>
            <span className="ml-2 text-d4-accent font-semibold">{personaje.clase}</span>
          </div>
          <div>
            <span className="text-d4-text-dim">Nivel:</span>
            <span className="ml-2 text-d4-text font-semibold">
              {personaje.nivel}{personaje.nivel_paragon && ` (Paragon: ${personaje.nivel_paragon})`}
            </span>
          </div>
          <div>
            <span className="text-d4-text-dim">Skills:</span>
            <span className="ml-2 text-d4-text font-semibold">
              {activeSkills.length + passiveSkills.length}
            </span>
          </div>
          <div>
            <span className="text-d4-text-dim">Glifos:</span>
            <span className="ml-2 text-d4-text font-semibold">
              {glyphs.length}
            </span>
          </div>
          <div>
            <span className="text-d4-text-dim">Aspectos:</span>
            <span className="ml-2 text-d4-text font-semibold">
              {aspects.length}
            </span>
          </div>
        </div>

        {/* Indicadores de datos disponibles */}
        <div className="mt-4 pt-4 border-t border-d4-border">
          <p className="text-xs text-d4-text-dim mb-2">Datos disponibles del héroe:</p>
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs px-2 py-1 rounded ${allHeroSkills ? 'bg-green-900/20 text-green-400' : 'bg-gray-800/20 text-gray-500'}`}>
              {allHeroSkills ? '✓' : '✗'} Habilidades ({allHeroSkills?.habilidades_activas.length || 0} activas, {allHeroSkills?.habilidades_pasivas.length || 0} pasivas)
            </span>
            <span className={`text-xs px-2 py-1 rounded ${allHeroGlyphs ? 'bg-green-900/20 text-green-400' : 'bg-gray-800/20 text-gray-500'}`}>
              {allHeroGlyphs ? '✓' : '✗'} Glifos ({allHeroGlyphs?.glifos.length || 0})
            </span>
            <span className={`text-xs px-2 py-1 rounded ${allHeroAspects ? 'bg-green-900/20 text-green-400' : 'bg-gray-800/20 text-gray-500'}`}>
              {allHeroAspects ? '✓' : '✗'} Aspectos ({allHeroAspects?.aspectos.length || 0})
            </span>
          </div>
        </div>
      </div>

      {/* Prompt Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {prompts.map(prompt => {
          const Icon = prompt.icon;
          const availability = isPromptAvailable(prompt);
          const isDisabled = !availability.available;

          return (
            <div 
              key={prompt.id} 
              className={`card ${prompt.bg} border ${prompt.border} ${isDisabled ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <Icon className={`w-5 h-5 ${prompt.color} flex-shrink-0`} />
                  <h4 className={`font-bold ${prompt.color} text-sm`}>{prompt.title}</h4>
                  {isDisabled && (
                    <Lock className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <button
                  onClick={() => !isDisabled && copyToClipboard(prompt.generate(), prompt.id)}
                  disabled={isDisabled}
                  className={`p-2 rounded transition-colors flex-shrink-0 ${
                    isDisabled
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : copied === prompt.id
                      ? 'bg-green-600 text-white'
                      : 'bg-d4-surface hover:bg-d4-border text-d4-text'
                  }`}
                  title={isDisabled ? availability.reason : 'Copiar prompt'}
                >
                  {copied === prompt.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-sm text-d4-text-dim mb-2">{prompt.description}</p>
              {isDisabled && availability.reason && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-amber-900/20 border border-amber-600/30 rounded">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-300">{availability.reason}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="card bg-d4-bg/50">
        <h4 className="font-bold text-d4-text mb-2">💡 Cómo usar el sistema de prompts:</h4>
        <ol className="list-decimal list-inside text-sm text-d4-text-dim space-y-1">
          <li>Los prompts se activan automáticamente según los datos que tengas cargados</li>
          <li>Para prompts comparativos (Stage 1 y 2), necesitas datos del héroe cargados</li>
          <li>Los prompts multi-stage funcionan en secuencia: usa Stage 1 primero, luego Stage 2</li>
          <li>Pega los prompts en tu IA favorita (ChatGPT, Claude, Gemini)</li>
          <li>Los prompts sugieren guardar información clave en memoria del chat para análisis continuos</li>
          <li>Para análisis matemáticos, asegúrate de tener estadísticas completas cargadas</li>
        </ol>
      </div>

      {/* Data Loading Suggestions */}
      {(!allHeroSkills || !allHeroGlyphs || !allHeroAspects) && (
        <div className="card bg-amber-900/20 border-l-4 border-amber-500">
          <h4 className="font-bold text-amber-300 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Sugerencia: Cargar más datos
          </h4>
          <p className="text-sm text-d4-text mb-2">
            Para habilitar los prompts comparativos avanzados, necesitas cargar datos del héroe:
          </p>
          <ul className="text-sm text-d4-text-dim space-y-1 ml-4 list-disc">
            {!allHeroSkills && <li>Ve a la sección <strong>Heroes</strong> e importa/gestiona habilidades del {personaje.clase}</li>}
            {!allHeroGlyphs && <li>Ve a la sección <strong>Heroes</strong> e importa/gestiona glifos del {personaje.clase}</li>}
            {!allHeroAspects && <li>Ve a la sección <strong>Heroes</strong> e importa/gestiona aspectos del {personaje.clase}</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CharacterPrompts;
