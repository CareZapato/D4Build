import React, { useState } from 'react';
import { Sparkles, Copy, Check, FileText, Lock, Zap, Shield, Users } from 'lucide-react';
import { Personaje } from '../../types';
import { PromptService } from '../../services/PromptService';
import { AIReportService, AIReport } from '../../services/AIReportService';
import { WorkspaceService } from '../../services/WorkspaceService';
import AIReportModal from '../common/AIReportModal';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';
import { useAppContext } from '../../context/AppContext';

interface Props {
  personajes: Personaje[];
}

type EntityType = 'personaje' | 'heroe';

const PromptGenerator: React.FC<Props> = ({ personajes }) => {
  const modal = useModal();
  const { isPremium } = useAuth();
  const { availableClasses } = useAppContext();
  const [entityType, setEntityType] = useState<EntityType>('personaje');
  const [selectedPersonaje, setSelectedPersonaje] = useState<string>('');
  const [selectedClase, setSelectedClase] = useState<string>('Paladín');
  const [promptType, setPromptType] = useState<'custom' | 'synergy' | 'optimization' | 'deepAnalysis' | 'poolComparison' | 'extractCharacter' | 'heroSkills' | 'heroMeta' | 'heroSynergies' | 'extractHeroData'>('custom');
  const [customQuestion, setCustomQuestion] = useState('');
  const [includeSkills, setIncludeSkills] = useState(true);
  const [includeGlyphs, setIncludeGlyphs] = useState(true);
  const [includeStats, setIncludeStats] = useState(false);
  const [includeMechanics, setIncludeMechanics] = useState(true);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Estados para IA
  const [showAIReportModal, setShowAIReportModal] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [latestReport, setLatestReport] = useState<AIReport | null>(null);

  const handleGenerate = async () => {
    // Validar selección según tipo de entidad
    if (entityType === 'personaje' && !selectedPersonaje) {
      modal.showWarning('Selecciona un personaje');
      return;
    }

    if (entityType === 'heroe' && !selectedClase) {
      modal.showWarning('Selecciona una clase');
      return;
    }

    // Verificar restricción Premium para prompts avanzados
    const premiumPrompts = ['deepAnalysis', 'poolComparison'];
    if (premiumPrompts.includes(promptType) && !isPremium()) {
      modal.showWarning('⚡ Este prompt es Premium. Actualiza tu cuenta para desbloquearlo.');
      return;
    }

    let prompt = '';
    
    if (entityType === 'personaje') {
      const personaje = personajes.find(p => p.id === selectedPersonaje);
      if (!personaje) return;

      if (promptType === 'synergy') {
        prompt = await PromptService.generateSynergyPrompt(personaje);
      } else if (promptType === 'optimization') {
        prompt = await PromptService.generateOptimizationPrompt(personaje);
      } else if (promptType === 'deepAnalysis') {
        prompt = await PromptService.generateDeepAnalysisPrompt(personaje);
      } else if (promptType === 'poolComparison') {
        prompt = await PromptService.generatePoolComparisonPrompt(personaje);
      } else if (promptType === 'extractCharacter') {
        prompt = await generateExtractCharacterPrompt(personaje);
      } else {
        prompt = await PromptService.generatePrompt(personaje, {
          incluir_habilidades: includeSkills,
          incluir_glifos: includeGlyphs,
          incluir_estadisticas: includeStats,
          incluir_mecanicas: includeMechanics,
          pregunta_personalizada: customQuestion || undefined
        });
      }
    } else {
      // Generar prompts para héroe
      if (promptType === 'heroSkills') {
        prompt = await generateHeroSkillsPrompt();
      } else if (promptType === 'heroMeta') {
        prompt = generateHeroMetaPrompt();
      } else if (promptType === 'heroSynergies') {
        prompt = generateHeroSynergiesPrompt();
      } else if (promptType === 'extractHeroData') {
        prompt = await generateExtractHeroDataPrompt();
      } else if (promptType === 'custom') {
        prompt = await generateHeroCustomPrompt();
      }
    }

    setGeneratedPrompt(prompt);
    setCopied(false);
  };

  // ========== PROMPTS PARA EXTRACCIÓN DE INFORMACIÓN ==========

  const generateExtractCharacterPrompt = async (personaje: Personaje): Promise<string> => {
    let prompt = `# EXTRACCIÓN DE INFORMACIÓN COMPLETA DEL PERSONAJE\n\n`;
    
    prompt += `**OBJETIVO**: Extrae y estructura toda la información del personaje en formato JSON para poder copiarla y usarla en otro lugar.\n\n`;
    
    prompt += `---\n\n`;
    prompt += `## 📋 INFORMACIÓN BÁSICA\n\n`;
    prompt += `- **Nombre**: ${personaje.nombre}\n`;
    prompt += `- **Clase**: ${personaje.clase}\n`;
    prompt += `- **Nivel**: ${personaje.nivel}\n`;
    if (personaje.nivel_paragon) prompt += `- **Nivel Paragon**: ${personaje.nivel_paragon}\n`;
    if (personaje.puertas_anexo) prompt += `- **Puertas de Anexo**: ${personaje.puertas_anexo}\n`;
    
    // Habilidades
    if (personaje.habilidades_refs) {
      prompt += `\n## ⚔️ HABILIDADES\n\n`;
      
      if (personaje.habilidades_refs.activas && personaje.habilidades_refs.activas.length > 0) {
        prompt += `### Habilidades Activas (${personaje.habilidades_refs.activas.length})\n`;
        try {
          const heroSkills = await WorkspaceService.loadHeroSkills(personaje.clase);
          if (heroSkills) {
            for (const ref of personaje.habilidades_refs.activas) {
              const skillId = typeof ref === 'string' ? ref : ref.skill_id;
              const skill = heroSkills.habilidades_activas.find(s => s.id === skillId);
              if (skill) {
                prompt += `\n**${skill.nombre}** (${skill.tipo} | ${skill.rama})\n`;
                prompt += `  - ID: ${skill.id}\n`;
                if (skill.descripcion) prompt += `  - Descripción: ${skill.descripcion}\n`;
                if (skill.nivel_maximo) prompt += `  - Nivel máximo: ${skill.nivel_maximo}\n`;
                if (skill.costo_recurso) {
                  prompt += `  - Costo: ${skill.costo_recurso.cantidad} ${skill.costo_recurso.tipo}\n`;
                }
                if (skill.genera_recurso) {
                  prompt += `  - Genera: ${skill.genera_recurso.cantidad} ${skill.genera_recurso.tipo}\n`;
                }
                if (skill.recuperacion_segundos) {
                  prompt += `  - Recuperación: ${skill.recuperacion_segundos}s\n`;
                }
                if (skill.tipo_danio) prompt += `  - Tipo de Daño: ${skill.tipo_danio}\n`;
                if (skill.tags && skill.tags.length > 0) {
                  prompt += `  - Tags: ${skill.tags.join(', ')}\n`;
                }
                
                // Modificadores seleccionados
                if (typeof ref !== 'string' && ref.modificadores_ids && ref.modificadores_ids.length > 0) {
                  prompt += `  - Modificadores activos: ${ref.modificadores_ids.length}\n`;
                  if (skill.modificadores) {
                    ref.modificadores_ids.forEach(modId => {
                      const mod = skill.modificadores?.find(m => m.id === modId);
                      if (mod) {
                        prompt += `    * ${mod.nombre}: ${mod.descripcion}\n`;
                      }
                    });
                  }
                }
                
                // Pasivas relacionadas (en este modelo no hay pasivas_relacionadas_activas)
                if (skill.habilidades_pasivas && skill.habilidades_pasivas.length > 0) {
                  prompt += `  - Pasivas relacionadas disponibles: ${skill.habilidades_pasivas.length}\n`;
                  skill.habilidades_pasivas.forEach(pas => {
                    prompt += `    * ${pas.nombre}: ${pas.efecto || pas.descripcion}\n`;
                  });
                }
              }
            }
          }
        } catch (error) {
          console.error('Error cargando habilidades activas:', error);
        }
      }
      
      if (personaje.habilidades_refs.pasivas && personaje.habilidades_refs.pasivas.length > 0) {
        prompt += `\n### Habilidades Pasivas Independientes (${personaje.habilidades_refs.pasivas.length})\n`;
        try {
          const heroSkills = await WorkspaceService.loadHeroSkills(personaje.clase);
          if (heroSkills) {
            personaje.habilidades_refs.pasivas.forEach(ref => {
              const skillId = typeof ref === 'string' ? ref : ref.skill_id;
              const skill = heroSkills.habilidades_pasivas.find(s => s.id === skillId);
              if (skill) {
                const puntos = typeof ref !== 'string' && ref.puntos_asignados ? ref.puntos_asignados : 1;
                prompt += `\n**${skill.nombre}** (${puntos} puntos)\n`;
                prompt += `  - ID: ${skill.id}\n`;
                if (skill.efecto) prompt += `  - Efecto: ${skill.efecto}\n`;
                if (skill.nivel_maximo) prompt += `  - Nivel máximo: ${skill.nivel_maximo}\n`;
                if (skill.tags && skill.tags.length > 0) {
                  prompt += `  - Tags: ${skill.tags.join(', ')}\n`;
                }
              }
            });
          }
        } catch (error) {
          console.error('Error cargando pasivas:', error);
        }
      }
    }
    
    // Glifos
    if (personaje.glifos_refs && personaje.glifos_refs.length > 0) {
      prompt += `\n## 💎 GLIFOS (${personaje.glifos_refs.length})\n\n`;
      try {
        const heroGlyphs = await WorkspaceService.loadHeroGlyphs(personaje.clase);
        if (heroGlyphs) {
          for (const ref of personaje.glifos_refs) {
            const glyphId = typeof ref === 'string' ? ref : ref.id;
            const glyph = heroGlyphs.glifos.find(g => g.id === glyphId);
            if (glyph) {
              const nivel = typeof ref !== 'string' && ref.nivel_actual ? ref.nivel_actual : 1;
              prompt += `\n**${glyph.nombre}** (Nivel ${nivel})\n`;
              prompt += `  - ID: ${glyph.id}\n`;
              if (glyph.efecto_base) prompt += `  - Efecto Base: ${glyph.efecto_base}\n`;
              if (glyph.tags && glyph.tags.length > 0) {
                prompt += `  - Tags: ${glyph.tags.join(', ')}\n`;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error cargando glifos:', error);
      }
    }
    
    // Estadísticas
    if (personaje.estadisticas_refs && personaje.estadisticas_refs.length > 0) {
      prompt += `\n## 📊 ESTADÍSTICAS (${personaje.estadisticas_refs.length})\n\n`;
      personaje.estadisticas_refs.forEach(ref => {
        prompt += `- ${ref.stat_id}: ${ref.valor}\n`;
      });
    }
    
    // Mecánicas de clase
    if (personaje.mecanicas_clase_refs && personaje.mecanicas_clase_refs.length > 0) {
      prompt += `\n## ⚙️ MECÁNICAS DE CLASE (${personaje.mecanicas_clase_refs.length})\n\n`;
      try {
        const mechanics = await WorkspaceService.loadHeroClassMechanics(personaje.clase);
        if (mechanics) {
          personaje.mecanicas_clase_refs.forEach(ref => {
            const mec = mechanics.mecanicas.find(m => m.id === ref.id);
            if (mec) {
              prompt += `\n**${mec.nombre}**\n`;
              prompt += `  - ID: ${mec.id}\n`;
              if (ref.selecciones_activas && ref.selecciones_activas.length > 0) {
                prompt += `  - Selecciones activas (${ref.selecciones_activas.length}): ${ref.selecciones_activas.join(', ')}\n`;
              }
            }
          });
        }
      } catch (error) {
        console.error('Error cargando mecánicas:', error);
      }
    }
    
    prompt += `\n---\n\n`;
    prompt += `## 🎯 TAREA\n\n`;
    prompt += `Por favor, estructura toda esta información en formato JSON limpio y bien organizado, manteniendo la jerarquía de categorías y subcategorías.\n`;
    prompt += `El JSON debe incluir:\n`;
    prompt += `- Información básica del personaje\n`;
    prompt += `- Todas las habilidades activas con sus modificadores y pasivas relacionadas\n`;
    prompt += `- Todas las habilidades pasivas independientes\n`;
    prompt += `- Todos los glifos con su nivel\n`;
    prompt += `- Todas las estadísticas agrupadas por categoría\n`;
    prompt += `- Todas las mecánicas de clase con sus selecciones\n\n`;
    prompt += `**FORMATO DE SALIDA**: JSON válido, sin comentarios, listo para copiar y pegar.\n`;
    
    return prompt;
  };

  const generateExtractHeroDataPrompt = async (): Promise<string> => {
    let prompt = `# EXTRACCIÓN DE INFORMACIÓN COMPLETA DE LA CLASE ${selectedClase.toUpperCase()}\n\n`;
    
    prompt += `**OBJETIVO**: Extrae y estructura toda la información disponible de la clase en formato JSON para poder copiarla y usarla en otro lugar.\n\n`;
    
    prompt += `---\n\n`;
    
    // Habilidades
    try {
      const skills = await WorkspaceService.loadHeroSkills(selectedClase);
      if (skills) {
        const activas = skills.habilidades_activas || [];
        const pasivas = skills.habilidades_pasivas || [];
        
        prompt += `## ⚔️ HABILIDADES\n\n`;
        prompt += `### Habilidades Activas (${activas.length})\n\n`;
        
        activas.forEach(skill => {
          prompt += `\n**${skill.nombre}** (${skill.tipo} | ${skill.rama})\n`;
          prompt += `  - ID: ${skill.id}\n`;
          if (skill.descripcion) prompt += `  - Descripción: ${skill.descripcion}\n`;
          if (skill.nivel_maximo) prompt += `  - Nivel máximo: ${skill.nivel_maximo}\n`;
          if (skill.costo_recurso) {
            prompt += `  - Costo: ${skill.costo_recurso.cantidad} ${skill.costo_recurso.tipo}\n`;
          }
          if (skill.genera_recurso) {
            prompt += `  - Genera: ${skill.genera_recurso.cantidad} ${skill.genera_recurso.tipo}\n`;
          }
          if (skill.recuperacion_segundos) {
            prompt += `  - Recuperación: ${skill.recuperacion_segundos}s\n`;
          }
          if (skill.tipo_danio) prompt += `  - Tipo de Daño: ${skill.tipo_danio}\n`;
          if (skill.tags && skill.tags.length > 0) {
            prompt += `  - Tags: ${skill.tags.join(', ')}\n`;
          }
          
          if (skill.modificadores && skill.modificadores.length > 0) {
            prompt += `  - Modificadores (${skill.modificadores.length}):\n`;
            skill.modificadores.forEach(mod => {
              prompt += `    * ${mod.nombre} (${mod.id}): ${mod.descripcion}\n`;
            });
          }
          
          if (skill.habilidades_pasivas && skill.habilidades_pasivas.length > 0) {
            prompt += `  - Pasivas Relacionadas (${skill.habilidades_pasivas.length}):\n`;
            skill.habilidades_pasivas.forEach(pas => {
              prompt += `    * ${pas.nombre} (${pas.id}): ${pas.efecto || pas.descripcion}\n`;
            });
          }
        });
        
        prompt += `\n### Habilidades Pasivas Independientes (${pasivas.length})\n\n`;
        pasivas.forEach(skill => {
          prompt += `\n**${skill.nombre}** (${skill.tipo || 'Pasiva'})\n`;
          prompt += `  - ID: ${skill.id}\n`;
          if (skill.efecto) prompt += `  - Efecto: ${skill.efecto}\n`;
          if (skill.nivel_maximo) prompt += `  - Nivel máximo: ${skill.nivel_maximo}\n`;
          if (skill.tags && skill.tags.length > 0) {
            prompt += `  - Tags: ${skill.tags.join(', ')}\n`;
          }
        });
      }
    } catch (error) {
      console.error('Error cargando habilidades:', error);
    }
    
    // Glifos
    try {
      const glyphs = await WorkspaceService.loadHeroGlyphs(selectedClase);
      if (glyphs && glyphs.glifos) {
        prompt += `\n## 💎 GLIFOS (${glyphs.glifos.length})\n\n`;
        glyphs.glifos.forEach(glyph => {
          prompt += `\n**${glyph.nombre}**\n`;
          prompt += `  - ID: ${glyph.id}\n`;
          if (glyph.efecto_base) prompt += `  - Efecto Base: ${typeof glyph.efecto_base === 'string' ? glyph.efecto_base : JSON.stringify(glyph.efecto_base)}\n`;
          if (glyph.tags && glyph.tags.length > 0) {
            prompt += `  - Tags: ${glyph.tags.join(', ')}\n`;
          }
          if (glyph.nivel_maximo) {
            prompt += `  - Nivel máximo: ${glyph.nivel_maximo}\n`;
          }
        });
      }
    } catch (error) {
      console.error('Error cargando glifos:', error);
    }
    
    // Aspectos
    try {
      const aspects = await WorkspaceService.loadHeroAspects(selectedClase);
      if (aspects && aspects.aspectos) {
        prompt += `\n## 🔮 ASPECTOS (${aspects.aspectos.length})\n\n`;
        aspects.aspectos.forEach(aspect => {
          prompt += `\n**${aspect.name}** (${aspect.category})\n`;
          prompt += `  - ID: ${aspect.id}\n`;
          prompt += `  - Short Name: ${aspect.shortName}\n`;
          if (aspect.effect) prompt += `  - Efecto: ${aspect.effect}\n`;
          if (aspect.level) prompt += `  - Nivel: ${aspect.level}\n`;
          if (aspect.tags && aspect.tags.length > 0) {
            prompt += `  - Tags: ${aspect.tags.join(', ')}\n`;
          }
        });
      }
    } catch (error) {
      console.error('Error cargando aspectos:', error);
    }
    
    // Mecánicas de clase
    try {
      const mechanics = await WorkspaceService.loadHeroClassMechanics(selectedClase);
      if (mechanics && mechanics.mecanicas) {
        prompt += `\n## ⚙️ MECÁNICAS DE CLASE (${mechanics.mecanicas.length})\n\n`;
        mechanics.mecanicas.forEach(mec => {
          prompt += `\n**${mec.nombre}**\n`;
          prompt += `  - ID: ${mec.id}\n`;
          prompt += `  - Tipo: ${mec.tipo}\n`;
          if (mec.selecciones && mec.selecciones.length > 0) {
            prompt += `  - Opciones disponibles (${mec.selecciones.length}):\n`;
            mec.selecciones.forEach(sel => {
              prompt += `    * ${sel.nombre} (${sel.id}): ${sel.efecto}\n`;
              if (sel.tags && sel.tags.length > 0) {
                prompt += `      Tags: ${sel.tags.join(', ')}\n`;
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Error cargando mecánicas:', error);
    }
    
    prompt += `\n---\n\n`;
    prompt += `## 🎯 TAREA\n\n`;
    prompt += `Por favor, estructura toda esta información en formato JSON limpio y bien organizado, manteniendo la jerarquía de categorías y subcategorías.\n`;
    prompt += `El JSON debe incluir:\n`;
    prompt += `- Todas las habilidades activas con sus modificadores y pasivas relacionadas (con IDs, descripciones, tags, costos, etc.)\n`;
    prompt += `- Todas las habilidades pasivas independientes\n`;
    prompt += `- Todos los glifos con sus efectos base y bonos por nivel\n`;
    prompt += `- Todos los aspectos con sus efectos y tipos\n`;
    prompt += `- Todas las mecánicas de clase con sus opciones seleccionables\n\n`;
    prompt += `**FORMATO DE SALIDA**: JSON válido, sin comentarios, listo para copiar y pegar.\n`;
    
    return prompt;
  };

  // ========== PROMPTS PARA HÉROES ==========
  
  const generateHeroSkillsPrompt = async (): Promise<string> => {
    const skills = await WorkspaceService.loadHeroSkills(selectedClase);
    if (!skills) return `No hay habilidades cargadas para ${selectedClase}`;

    const activas = skills.habilidades_activas || [];
    const pasivas = skills.habilidades_pasivas || [];

    let prompt = `Actúa como un experto en builds y teorycrafting de Diablo 4, especializado en la clase **${selectedClase}**.

**🎯 OBJETIVO**: Analiza TODAS las habilidades disponibles para sugerir arquetipos de build óptimos con sinergias reales.

---

## 📊 HABILIDADES DISPONIBLES

### ⚔️ Habilidades Activas (${activas.length})
`;

    activas.forEach(skill => {
      const tipo = skill.tipo || 'Sin tipo';
      const rama = skill.rama || 'Sin rama';
      const nivel = skill.nivel_maximo ? `1-${skill.nivel_maximo}` : '1';
      
      prompt += `\n**${skill.nombre}** (${tipo} | ${rama} | Nivel ${nivel})\n`;
      if (skill.descripcion) prompt += `  ${skill.descripcion}\n`;
      
      if (skill.costo_recurso) {
        prompt += `  • Costo: ${skill.costo_recurso.cantidad} ${skill.costo_recurso.tipo}\n`;
      }
      if (skill.genera_recurso) {
        prompt += `  • Genera: ${skill.genera_recurso.cantidad} ${skill.genera_recurso.tipo}\n`;
      }
      if (skill.recuperacion_segundos) {
        prompt += `  • Recuperación: ${skill.recuperacion_segundos}s\n`;
      }
      if (skill.tipo_danio) {
        prompt += `  • Tipo de Daño: ${skill.tipo_danio}\n`;
      }
      if (skill.tags && skill.tags.length > 0) {
        prompt += `  • Tags: ${skill.tags.join(', ')}\n`;
      }
      
      if (skill.modificadores && skill.modificadores.length > 0) {
        prompt += `  • Modificadores disponibles (${skill.modificadores.length}):\n`;
        skill.modificadores.slice(0, 3).forEach(mod => {
          prompt += `    - ${mod.nombre}: ${mod.descripcion}\n`;
        });
        if (skill.modificadores.length > 3) {
          prompt += `    - ... y ${skill.modificadores.length - 3} más\n`;
        }
      }
    });

    prompt += `\n### 🛡️ Habilidades Pasivas (${pasivas.length})\n`;
    
    pasivas.slice(0, 15).forEach(skill => {
      const nivel = skill.nivel_maximo ? `1-${skill.nivel_maximo}` : '1';
      prompt += `\n**${skill.nombre}** (${skill.tipo || 'Pasiva'} | Nivel ${nivel})\n`;
      if (skill.efecto) prompt += `  ${skill.efecto}\n`;
      if (skill.tags && skill.tags.length > 0) {
        prompt += `  • Tags: ${skill.tags.join(', ')}\n`;
      }
    });

    if (pasivas.length > 15) {
      prompt += `\n... y ${pasivas.length - 15} pasivas más\n`;
    }

    prompt += `\n---

## 🎯 ANÁLISIS SOLICITADO

### 1. ARQUETIPOS DE BUILD RECOMENDADOS (Top 3-5)
Para cada arquetipo, proporciona:
- **Nombre del Build** (descriptivo, ej: "Torbellino Sangriento Crit")
- **Habilidades activas core** (6 slots: Principal, 4 habilidades, Ultimate)
- **Pasivas clave** (las más importantes para el arquetipo)
- **Tags principales** (qué mecánicas conectan el build)
- **Sinergias clave** (por qué estas habilidades funcionan juntas)
- **Prioridad de stats** (qué atributos priorizar: Fuerza, Destreza, Inteligencia, Voluntad)
- **Contenido óptimo** (¿Para qué es mejor? Pit, Speedfarm, Bosses, etc.)

### 2. ANÁLISIS DE STATS Y ATRIBUTOS POR ARQUETIPO
Para cada build sugerido, especifica:
- **Atributo principal** (Fuerza / Destreza / Inteligencia / Voluntad)
  - ¿Por qué este atributo es prioritario para este build?
  - ¿Qué beneficios aporta a las habilidades del arquetipo?
- **Atributo secundario** (si aplica)
- **Stats ofensivos** a buscar en gear:
  - Crítico (probabilidad y daño)
  - Daño vulnerable
  - Daño con habilidades core/específicas
  - Multiplicadores específicos del arquetipo
- **Stats defensivos** a buscar:
  - Vida máxima
  - Armadura / Resistencias
  - Reducción de daño
  - Fortificación / Barrera (según clase)
- **Breakpoints importantes** (umbrales de crit chance, CDR, etc.)

### 3. SINERGIAS ENTRE HABILIDADES
- Identifica combos de habilidades que se potencian mutuamente
- Explica las cadenas de sinergia (tags compartidos, mecánicas que se amplifican)
- ¿Qué habilidades DEBES combinar para maximizar efectividad?

### 4. PROGRESIÓN RECOMENDADA
- **Early game** (nivel 1-50): ¿Qué build usar para levelear?
- **Mid game** (nivel 50-100): ¿Cuándo hacer la transición?
- **Endgame** (Paragon 1-200): ¿Qué arquetipo escala mejor?

### 5. RECURSOS Y ROTACIÓN
- ¿Cómo generar y gastar recursos eficientemente?
- ¿Cuál es la rotación óptima por arquetipo?
- ¿Hay habilidades que deben estar siempre activas (buffs)?

---

**💡 FORMATO DE RESPUESTA**:
- Sé conciso pero completo
- Prioriza sinergias reales y matematicamente beneficiosas
- Incluye justificación práctica (no solo teoría)
- Enfócate en builds VIABLES para endgame`;

    return prompt;
  };

  const generateHeroMetaPrompt = (): string => {
    return `Actúa como un experto en el meta actual de Diablo 4 (Temporada 13) especializado en la clase **${selectedClase}**.

**🎯 OBJETIVO**: Identifica los arquetipos más fuertes en el meta actual con análisis de stats y sinergias.

**📊 ANÁLISIS SOLICITADO**:

### 1. TOP 3-5 ARQUETIPOS META ACTUALES
Para cada arquetipo:
- **Nombre del Build**
- **Tier** (S / A / B / C)
- **Estilo de juego** (Ofensivo, Defensivo, Speedfarm, Endgame)
- **Habilidades core** (activas + pasivas principales)
- **Atributos prioritarios**:
  - Atributo principal (Fuerza/Destreza/Inteligencia/Voluntad)
  - ¿Por qué este atributo es óptimo?
  - Stats ofensivos a maximizar
  - Stats defensivos necesarios
- **Sinergias principales**
- **Puntos fuertes** y **Debilidades**
- **Contenido óptimo**

### 2. ANÁLISIS DE STATS POR ARQUETIPO
- ¿Qué stats escalan mejor con cada build?
- ¿Hay breakpoints importantes? (crit, CDR, etc.)
- ¿Cómo balancear ofensa y defensa?

### 3. COMPARACIÓN DE ARQUETIPOS
- Tabla comparativa (DPS, Supervivencia, Movilidad)
- ¿Cuál es más fácil para principiantes?
- ¿Cuál tiene mayor techo de poder?

### 4. TENDENCIAS Y CAMBIOS RECIENTES
- ¿Qué builds han sido buffed/nerfed?
- ¿Arquetipos emergentes prometedores?

**💡 NOTA**: Enfócate en builds viables para Pit 100+`;
  };

  const generateHeroSynergiesPrompt = (): string => {
    return `Actúa como un experto en mecánicas de **${selectedClase}** en Diablo 4.

**🎯 OBJETIVO**: Identifica sinergias poderosas entre habilidades y cómo se relacionan con los stats principales.

**📊 ANÁLISIS SOLICITADO**:

### 1. SINERGIAS POR TAGS
- Agrupa habilidades que comparten tags
- Explica cómo se potencian mutuamente
- ¿Qué combos tienen multiplicadores exponenciales?

### 2. COMBOS DE HABILIDADES (5-7 combos específicos)
Para cada combo:
- Habilidades involucradas (activas + pasivas)
- Por qué funciona (mecánica de sinergia)
- **Prioridad de stats** para este combo:
  - ¿Qué atributo principal maximiza el combo?
  - Stats ofensivos críticos
  - Stats defensivos recomendados
- Rating de poder (1-10)

### 3. STATS Y ATRIBUTOS
Para ${selectedClase}, analiza:
- **Fuerza**: ¿Qué habilidades/builds se benefician más?
- **Destreza**: ¿Qué habilidades/builds se benefician más?
- **Inteligencia**: ¿Qué habilidades/builds se benefician más?
- **Voluntad**: ¿Qué habilidades/builds se benefician más?
- ¿Hay builds híbridos que requieran 2 atributos?

### 4. ANTI-SINERGIAS
- ¿Qué habilidades NO deberían usarse juntas?
- ¿Hay conflictos de recursos o cooldowns?

### 5. ROTACIONES ÓPTIMAS
- ¿En qué orden activar habilidades para maximizar daño?
- ¿Cómo mantener buffs/debuffs activos?

### 6. RECURSOS Y GENERACIÓN
- ¿Qué habilidades generan recursos eficientemente?
- ¿Cómo balancear generación y gasto?

**💡 IMPORTANTE**: Proporciona ejemplos concretos y numéricos`;
  };

  const generateHeroCustomPrompt = async (): Promise<string> => {
    let prompt = `Actúa como un experto en Diablo 4 especializado en la clase **${selectedClase}**.

**🎯 TU PREGUNTA**: ${customQuestion || 'Analiza las habilidades y sugiere builds óptimos'}

---

## 📊 CONTEXTO

`;

    if (includeSkills) {
      const skills = await WorkspaceService.loadHeroSkills(selectedClase);
      if (skills) {
        prompt += `### Habilidades Activas (${skills.habilidades_activas?.length || 0})\n`;
        (skills.habilidades_activas || []).slice(0, 10).forEach(skill => {
          prompt += `- **${skill.nombre}** (${skill.tipo} | ${skill.rama}): ${skill.descripcion}\n`;
        });
        prompt += `\n### Habilidades Pasivas (${skills.habilidades_pasivas?.length || 0})\n`;
        (skills.habilidades_pasivas || []).slice(0, 10).forEach(skill => {
          prompt += `- **${skill.nombre}**: ${skill.efecto || skill.descripcion}\n`;
        });
      }
    }

    if (includeGlyphs) {
      const glyphs = await WorkspaceService.loadHeroGlyphs(selectedClase);
      if (glyphs) {
        prompt += `\n### Glifos Disponibles (${glyphs.glifos?.length || 0})\n`;
        (glyphs.glifos || []).slice(0, 8).forEach(glyph => {
          prompt += `- **${glyph.nombre}**: ${glyph.efecto_base}\n`;
        });
      }
    }

    if (includeMechanics) {
      const mechanics = await WorkspaceService.loadHeroClassMechanics(selectedClase);
      if (mechanics) {
        prompt += `\n### Mecánicas de Clase\n`;
        (mechanics.mecanicas || []).forEach(mec => {
          prompt += `- **${mec.nombre}**: ${mec.selecciones.length} opciones disponibles\n`;
        });
      }
    }

    prompt += `\n---

**💡 NOTA**: En tu análisis, considera:
- Sinergias entre habilidades (tags compartidos)
- **Prioridad de atributos** (Fuerza, Destreza, Inteligencia, Voluntad)
- **Stats ofensivos** a maximizar
- **Stats defensivos** recomendados
- Viabilidad para endgame (Pit 100+)`;

    return prompt;
  };

  const handleCopy = async () => {
    const success = await PromptService.copyToClipboard(generatedPrompt);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      modal.showError('Error al copiar al portapapeles');
    }
  };

  // Ejecutar consulta con IA
  const handleAIQuery = async () => {
    if (!generatedPrompt) {
      modal.showWarning('Primero genera un prompt');
      return;
    }
    
    try {
      setAiProcessing(true);
      
      const promptTypeLabels = {
        custom: 'Prompt Personalizado',
        synergy: 'Análisis de Sinergias',
        optimization: 'Optimización de Build',
        deepAnalysis: 'Análisis Profundo',
        poolComparison: 'Comparación con Pool',
        extractCharacter: 'Extraer Información (Personaje)',
        heroSkills: 'Análisis de Habilidades (Héroe)',
        heroMeta: 'Arquetipos Meta (Héroe)',
        heroSynergies: 'Sinergias (Héroe)',
        extractHeroData: 'Extraer Información (Héroe)'
      };
      
      let personaje_id, personaje_nombre, clase, tags;
      
      if (entityType === 'personaje') {
        const personaje = personajes.find(p => p.id === selectedPersonaje);
        if (!personaje) return;
        personaje_id = personaje.id;
        personaje_nombre = personaje.nombre;
        clase = personaje.clase;
        tags = [personaje.clase, promptType];
      } else {
        personaje_id = undefined;
        personaje_nombre = undefined;
        clase = selectedClase;
        tags = [selectedClase, promptType, 'heroe'];
      }
      
      const result = await AIReportService.executeAIQuery({
        prompt: generatedPrompt,
        tipo_prompt: promptTypeLabels[promptType],
        titulo_prompt: entityType === 'personaje' 
          ? `${promptTypeLabels[promptType]} - ${personaje_nombre}`
          : `${promptTypeLabels[promptType]} - ${selectedClase}`,
        personaje_id,
        personaje_nombre,
        clase,
        modelo: 'gemini',
        tags
      });
      
      if (result.success && result.report) {
        setLatestReport(result.report);
        setShowAIReportModal(true);
      } else {
        modal.showError(`Error: ${result.error || 'No se pudo completar la consulta'}`);
      }
    } catch (error) {
      console.error('Error ejecutando consulta IA:', error);
      modal.showError('Error al ejecutar consulta con IA');
    } finally {
      setAiProcessing(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="card p-4 lg:p-6 mb-4 lg:mb-6 bg-gradient-to-br from-d4-surface via-d4-bg to-d4-surface border-2 border-d4-accent/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-d4-accent/20 rounded-lg border-2 border-d4-accent/40">
            <Sparkles className="w-5 lg:w-6 h-5 lg:h-6 text-d4-accent" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-d4-accent mb-1">Generador de Prompts</h1>
            <p className="text-d4-text-dim text-xs lg:text-sm">
              Genera prompts enriquecidos para consultar en ChatGPT, Claude u otras IAs
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Panel de Configuración */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 lg:w-6 h-5 lg:h-6 text-d4-accent" />
            <h3 className="text-base lg:text-lg font-bold text-d4-text">Configuración</h3>
          </div>

          <div className="space-y-4">
            {/* Toggle: Personaje vs Héroe */}
            <div>
              <label className="block text-sm font-medium text-d4-text mb-2">
                Tipo de Análisis
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setEntityType('personaje')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 lg:px-4 py-2 rounded transition-colors text-xs lg:text-sm ${
                    entityType === 'personaje'
                      ? 'bg-d4-accent text-black font-semibold'
                      : 'bg-d4-surface text-d4-text hover:bg-d4-border'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Personaje
                </button>
                <button
                  onClick={() => setEntityType('heroe')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 lg:px-4 py-2 rounded transition-colors text-xs lg:text-sm ${
                    entityType === 'heroe'
                      ? 'bg-d4-accent text-black font-semibold'
                      : 'bg-d4-surface text-d4-text hover:bg-d4-border'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Héroe
                </button>
              </div>
            </div>

            {/* Selector de Personaje o Clase */}
            {entityType === 'personaje' ? (
              <div>
                <label className="block text-sm font-medium text-d4-text mb-2">
                  Seleccionar Personaje
                </label>
                <select
                  value={selectedPersonaje}
                  onChange={(e) => setSelectedPersonaje(e.target.value)}
                  className="input w-full text-sm"
                >
                  <option value="">-- Selecciona un personaje --</option>
                  {personajes.map(personaje => (
                    <option key={personaje.id} value={personaje.id}>
                      {personaje.nombre} ({personaje.clase} - Nivel {personaje.nivel})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-d4-text mb-2">
                  Seleccionar Clase
                </label>
                <select
                  value={selectedClase}
                  onChange={(e) => setSelectedClase(e.target.value)}
                  className="input w-full text-sm"
                >
                  {availableClasses.map(clase => (
                    <option key={clase} value={clase}>
                      {clase}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-d4-text mb-2">
                Tipo de Consulta
              </label>
              <div className="space-y-2">
                {entityType === 'personaje' ? (
                  <>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-d4-border transition-colors">
                      <input
                        type="radio"
                        name="promptType"
                        value="custom"
                        checked={promptType === 'custom'}
                        onChange={() => setPromptType('custom')}
                      />
                      <div>
                        <div className="text-d4-text font-medium text-xs lg:text-sm">Personalizado</div>
                        <div className="text-[10px] lg:text-xs text-d4-text-dim">Configura qué incluir y agrega tu pregunta</div>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-d4-border transition-colors">
                      <input
                        type="radio"
                        name="promptType"
                        value="synergy"
                        checked={promptType === 'synergy'}
                        onChange={() => setPromptType('synergy')}
                      />
                      <div>
                        <div className="text-d4-text font-medium text-xs lg:text-sm">Análisis de Sinergias</div>
                        <div className="text-[10px] lg:text-xs text-d4-text-dim">Analiza combinaciones entre habilidades y glifos</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-d4-border transition-colors">
                      <input
                        type="radio"
                        name="promptType"
                        value="optimization"
                        checked={promptType === 'optimization'}
                        onChange={() => setPromptType('optimization')}
                      />
                      <div>
                        <div className="text-d4-text font-medium text-xs lg:text-sm">Optimización de Build</div>
                        <div className="text-[10px] lg:text-xs text-d4-text-dim">Obtén recomendaciones para mejorar el build</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-d4-border transition-colors relative">
                      <input
                        type="radio"
                        name="promptType"
                        value="deepAnalysis"
                        checked={promptType === 'deepAnalysis'}
                        onChange={() => setPromptType('deepAnalysis')}
                        disabled={!isPremium()}
                      />
                      <div className="flex-1">
                        <div className="text-d4-text font-medium flex items-center gap-2 text-xs lg:text-sm">
                          🎯 Análisis Profundo
                          {!isPremium() && <Lock className="w-3 h-3 text-yellow-400" />}
                        </div>
                        <div className="text-[10px] lg:text-xs text-d4-text-dim">Evaluación completa con scoring y prioridades</div>
                        {!isPremium() && (
                          <div className="text-xs text-yellow-400 font-semibold mt-1">Premium</div>
                        )}
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-d4-border transition-colors relative">
                      <input
                        type="radio"
                        name="promptType"
                        value="poolComparison"
                        checked={promptType === 'poolComparison'}
                        onChange={() => setPromptType('poolComparison')}
                        disabled={!isPremium()}
                      />
                      <div className="flex-1">
                        <div className="text-d4-text font-medium flex items-center gap-2 text-xs lg:text-sm">
                          🔄 Comparación con Pool
                          {!isPremium() && <Lock className="w-3 h-3 text-yellow-400" />}
                        </div>
                        <div className="text-[10px] lg:text-xs text-d4-text-dim">Compara equipado vs todo lo disponible</div>
                        {!isPremium() && (
                          <div className="text-xs text-yellow-400 font-semibold mt-1">Premium</div>
                        )}
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-d4-border transition-colors bg-green-900/20 border border-green-600/30">
                      <input
                        type="radio"
                        name="promptType"
                        value="extractCharacter"
                        checked={promptType === 'extractCharacter'}
                        onChange={() => setPromptType('extractCharacter')}
                      />
                      <div>
                        <div className="text-d4-text font-medium text-xs lg:text-sm">📤 Extraer Información</div>
                        <div className="text-[10px] lg:text-xs text-d4-text-dim">Extrae toda la información del personaje en formato JSON</div>
                      </div>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-d4-border transition-colors">
                      <input
                        type="radio"
                        name="promptType"
                        value="heroSkills"
                        checked={promptType === 'heroSkills'}
                        onChange={() => setPromptType('heroSkills')}
                      />
                      <div>
                        <div className="text-d4-text font-medium text-xs lg:text-sm">🎯 Análisis de Habilidades</div>
                        <div className="text-[10px] lg:text-xs text-d4-text-dim">Analiza TODAS las habilidades para builds óptimos + stats</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-d4-border transition-colors">
                      <input
                        type="radio"
                        name="promptType"
                        value="heroMeta"
                        checked={promptType === 'heroMeta'}
                        onChange={() => setPromptType('heroMeta')}
                      />
                      <div>
                        <div className="text-d4-text font-medium text-xs lg:text-sm">🏆 Arquetipos Meta</div>
                        <div className="text-[10px] lg:text-xs text-d4-text-dim">Top builds del meta actual con prioridad de stats</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-d4-border transition-colors">
                      <input
                        type="radio"
                        name="promptType"
                        value="heroSynergies"
                        checked={promptType === 'heroSynergies'}
                        onChange={() => setPromptType('heroSynergies')}
                      />
                      <div>
                        <div className="text-d4-text font-medium text-xs lg:text-sm">🔗 Sinergias</div>
                        <div className="text-[10px] lg:text-xs text-d4-text-dim">Combos poderosos de habilidades + stats óptimos</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-d4-border transition-colors bg-green-900/20 border border-green-600/30">
                      <input
                        type="radio"
                        name="promptType"
                        value="extractHeroData"
                        checked={promptType === 'extractHeroData'}
                        onChange={() => setPromptType('extractHeroData')}
                      />
                      <div>
                        <div className="text-d4-text font-medium text-xs lg:text-sm">📤 Extraer Información</div>
                        <div className="text-[10px] lg:text-xs text-d4-text-dim">Extrae todas las habilidades, glifos, aspectos y mecánicas en JSON</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-d4-border transition-colors">
                      <input
                        type="radio"
                        name="promptType"
                        value="custom"
                        checked={promptType === 'custom'}
                        onChange={() => setPromptType('custom')}
                      />
                      <div>
                        <div className="text-d4-text font-medium text-xs lg:text-sm">Personalizado</div>
                        <div className="text-[10px] lg:text-xs text-d4-text-dim">Configura qué incluir y agrega tu pregunta</div>
                      </div>
                    </label>
                  </>
                )}
              </div>
            </div>

            {promptType === 'custom' && (
              <>
                <div className="pt-4 border-t border-d4-border">
                  <label className="block text-sm font-medium text-d4-text mb-3">
                    ¿Qué incluir en el prompt?
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeSkills}
                        onChange={(e) => setIncludeSkills(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-d4-text text-xs lg:text-sm">Habilidades</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeGlyphs}
                        onChange={(e) => setIncludeGlyphs(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-d4-text text-xs lg:text-sm">Glifos</span>
                    </label>
                    {entityType === 'personaje' && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeStats}
                          onChange={(e) => setIncludeStats(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-d4-text text-xs lg:text-sm">Estadísticas</span>
                      </label>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeMechanics}
                        onChange={(e) => setIncludeMechanics(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-d4-text text-xs lg:text-sm">Mecánicas de Clase</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-d4-text mb-2">
                    Tu Pregunta (Opcional)
                  </label>
                  <textarea
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    className="input w-full text-sm"
                    rows={3}
                    placeholder="Ejemplo: ¿Qué modificadores debería cambiar para maximizar el daño?"
                  />
                </div>
              </>
            )}

            <button
              onClick={handleGenerate}
              disabled={entityType === 'personaje' ? !selectedPersonaje : !selectedClase}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Generar Prompt
            </button>
          </div>
        </div>

        {/* Panel de Resultado */}
        <div className="card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <FileText className="w-5 lg:w-6 h-5 lg:h-6 text-d4-accent" />
              <h3 className="text-base lg:text-lg font-bold text-d4-text">Prompt Generado</h3>
            </div>
            {generatedPrompt && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="btn-secondary flex items-center gap-2 text-xs lg:text-sm px-2 lg:px-3 py-1.5 lg:py-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 lg:w-4 h-3 lg:h-4" />
                      <span className="hidden sm:inline">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 lg:w-4 h-3 lg:h-4" />
                      <span className="hidden sm:inline">Copiar</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleAIQuery}
                  disabled={aiProcessing}
                  className={`flex items-center gap-2 px-2 lg:px-4 py-1.5 lg:py-2 rounded transition-colors text-xs lg:text-sm ${
                    aiProcessing
                      ? 'bg-amber-600 text-white animate-pulse cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-500 text-white'
                  }`}
                >
                  <Zap className="w-3 lg:w-4 h-3 lg:h-4" />
                  <span className="hidden sm:inline">{aiProcessing ? 'Consultando...' : 'Consultar IA'}</span>
                </button>
              </div>
            )}
          </div>

          {generatedPrompt ? (
            <div className="bg-d4-bg rounded p-3 lg:p-4 max-h-[500px] lg:max-h-[600px] overflow-y-auto">
              <pre className="text-xs lg:text-sm text-d4-text whitespace-pre-wrap font-mono">
                {generatedPrompt}
              </pre>
            </div>
          ) : (
            <div className="bg-d4-bg rounded p-8 text-center">
              <Sparkles className="w-10 lg:w-12 h-10 lg:h-12 mx-auto mb-4 text-d4-text-dim" />
              <p className="text-d4-text-dim text-xs lg:text-sm">
                Configura las opciones y genera tu prompt
              </p>
            </div>
          )}

          {generatedPrompt && (
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600 rounded text-xs lg:text-sm text-blue-200">
              <strong>Tip:</strong> Copia este prompt y pégalo en ChatGPT, Claude o tu IA favorita
              para obtener análisis detallados.
            </div>
          )}
        </div>
      </div>
      
      {/* AI Report Modal */}
      {showAIReportModal && (
        <AIReportModal
          isOpen={showAIReportModal}
          onClose={() => {
            setShowAIReportModal(false);
            setLatestReport(null);
          }}
          initialReport={latestReport}
        />
      )}
      
      <Modal {...modal} />
    </div>
  );
};

export default PromptGenerator;