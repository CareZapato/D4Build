import React, { useState } from 'react';
import { Copy, Check, Sparkles, Target, Zap, AlertCircle } from 'lucide-react';
import { WorkspaceService } from '../../services/WorkspaceService';
import { AIReportService, AIReport } from '../../services/AIReportService';
import AIReportModal from '../common/AIReportModal';
import { HabilidadesPersonaje } from '../../types';

interface HeroPromptsProps {
  clase: string;
}

const HeroPrompts: React.FC<HeroPromptsProps> = ({ clase }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [showAIReportModal, setShowAIReportModal] = useState(false);
  const [aiProcessing, setAiProcessing] = useState<string | null>(null);
  const [latestReport, setLatestReport] = useState<AIReport | null>(null);
  const [heroSkills, setHeroSkills] = useState<HabilidadesPersonaje | null>(null);
  const [loading, setLoading] = useState(false);

  // Cargar habilidades del héroe
  React.useEffect(() => {
    loadHeroSkills();
  }, [clase]);

  const loadHeroSkills = async () => {
    setLoading(true);
    try {
      const skills = await WorkspaceService.loadHeroSkills(clase);
      setHeroSkills(skills);
    } catch (error) {
      console.error('Error cargando habilidades del héroe:', error);
    } finally {
      setLoading(false);
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

  // Ejecutar consulta con IA
  const executeAIQuery = async (textOrPromise: string | Promise<string>, promptId: string, titulo: string, tipo: string) => {
    try {
      setAiProcessing(promptId);
      
      const promptText = typeof textOrPromise === 'string' ? textOrPromise : await textOrPromise;
      
      const result = await AIReportService.executeAIQuery({
        prompt: promptText,
        tipo_prompt: tipo,
        titulo_prompt: titulo,
        personaje_id: undefined,
        personaje_nombre: undefined,
        clase: clase,
        modelo: 'gemini',
        tags: [clase, tipo, 'heroe']
      });
      
      if (result.success && result.report) {
        setLatestReport(result.report);
        setShowAIReportModal(true);
      } else {
        alert(`Error: ${result.error || 'No se pudo completar la consulta'}`);
      }
    } catch (error) {
      console.error('Error ejecutando consulta IA:', error);
      alert('Error al ejecutar consulta con IA');
    } finally {
      setAiProcessing(null);
    }
  };

  // Definición de prompts para héroes
  interface PromptConfig {
    id: string;
    title: string;
    category: string;
    description: string;
    icon: any;
    color: string;
    bg: string;
    border: string;
    requiresSkills: boolean;
    generate: () => string | Promise<string>;
  }

  const prompts: PromptConfig[] = [
    // ========== ANÁLISIS COMPLETO DE BUILDS ==========
    {
      id: 'build-complete-analysis',
      title: '🎯 Análisis Completo de Builds Posibles',
      category: 'Arquetipos y Builds',
      description: 'Analiza TODAS las habilidades del héroe (100%) para sugerir arquetipos de build y combinaciones óptimas',
      icon: Sparkles,
      color: 'text-pink-400',
      bg: 'bg-pink-900/20',
      border: 'border-pink-600',
      requiresSkills: true,
      generate: async () => {
        const { PromptService } = await import('../../services/PromptService');
        // Crear objeto de personaje simulado solo con clase y nivel genérico
        const mockPersonaje = {
          id: 'temp',
          nombre: clase,
          clase: clase,
          nivel: 100,
          nivel_paragon: 200,
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString()
        };
        return await PromptService.generateBuildAnalysisPrompt(mockPersonaje as any);
      }
    },

    // ========== ARQUETIPOS META ==========
    {
      id: 'meta-archetypes',
      title: '🏆 Arquetipos Meta del ${clase}',
      category: 'Arquetipos y Builds',
      description: 'Identifica los arquetipos más fuertes en el meta actual con sinergias clave',
      icon: Target,
      color: 'text-amber-400',
      bg: 'bg-amber-900/20',
      border: 'border-amber-600',
      requiresSkills: true,
      generate: () => `Actúa como un experto en teorycrafting de Diablo 4 especializado en la clase ${clase}.

**🎯 OBJETIVO:**
Identifica y analiza los arquetipos de build MÁS FUERTES en el meta actual (Temporada 13) para la clase ${clase}.

**📊 ANÁLISIS SOLICITADO:**

### 1. TOP 3-5 ARQUETIPOS META
Para cada arquetipo, proporciona:
- **Nombre del Build** (descriptivo, ej: "Torbellino Sangriento Endgame")
- **Tier** (S / A / B / C / D)
- **Estilo de juego** (Ofensivo, Defensivo, Híbrido, Speedfarm, Endgame, etc.)
- **Habilidades activas core** (3-6 activas principales)
- **Habilidades pasivas clave** (las más importantes para el arquetipo)
- **Sinergias principales** (qué tags/mecánicas conectan el build)
- **Puntos fuertes** (por qué funciona tan bien)
- **Debilidades** (limitaciones del arquetipo)
- **Contenido óptimo** (¿Para qué es mejor? Pit, Speedfarm, Bosses, etc.)

### 2. COMPARACIÓN DE ARQUETIPOS
- Tabla comparativa de los arquetipos (DPS, Supervivencia, Movilidad, Dificultad)
- ¿Cuál es el más fácil de armar para principiantes?
- ¿Cuál tiene el mayor techo de poder (ceiling)?
- ¿Cuál es más versátil?

### 3. TRANSICIONES ENTRE ARQUETIPOS
- ¿Qué habilidades son compartidas entre arquetipos?
- ¿Cuál es la ruta de progresión recomendada? (Leveling → Endgame)
- ¿Cómo hacer la transición de un arquetipo a otro?

### 4. TENDENCIAS Y CAMBIOS RECIENTES
- ¿Qué arquetipos han sido buffed/nerfed recientemente?
- ¿Hay arquetipos emergentes o experimentales prometedores?
- ¿Qué esperar en futuras temporadas?

**💡 NOTA:**
Enfócate en builds VIABLES para endgame (Pit 100+) y proporciona información práctica y accionable.`
    },

    // ========== SINERGIAS ENTRE HABILIDADES ==========
    {
      id: 'skill-synergies',
      title: '🔗 Sinergias Entre Habilidades',
      category: 'Habilidades',
      description: 'Descubre combinaciones poderosas de habilidades activas y pasivas',
      icon: Zap,
      color: 'text-purple-400',
      bg: 'bg-purple-900/20',
      border: 'border-purple-600',
      requiresSkills: false,
      generate: () => `Actúa como un experto en mecánicas de ${clase} en Diablo 4.

**🎯 OBJETIVO:**
Identifica y explica las sinergias más poderosas entre habilidades de ${clase}.

**📊 ANÁLISIS SOLICITADO:**

### 1. SINERGIAS POR TAGS
- Agrupa habilidades que comparten tags (ej: Sangrado, Vulnerable, Básica, etc.)
- Explica cómo se potencian mutuamente
- ¿Qué combinaciones tienen multiplicadores exponenciales?

### 2. COMBOS DE HABILIDADES
- Identifica 5-7 combos específicos de habilidades que funcionan excepcionalmente bien juntas
- Para cada combo:
  - Habilidades involucradas (activas + pasivas)
  - Por qué funciona (mecánica de sinergia)
  - Cuándo usarlo (situacional, siempre activo, etc.)
  - Rating de poder (1-10)

### 3. ANTI-SINERGIAS
- ¿Qué habilidades NO deberían usarse juntas?
- ¿Hay conflictos de recursos o cooldowns?
- ¿Hay habilidades que anulan el efecto de otras?

### 4. ROTACIONES ÓPTIMAS
- ¿En qué orden activar las habilidades para maximizar daño?
- ¿Hay ventanas de oportunidad críticas?
- ¿Cómo mantener buffs/debuffs activos?

### 5. RECURSOS Y GENERACIÓN
- ¿Qué habilidades generan recursos eficientemente?
- ¿Qué habilidades consumen muchos recursos?
- ¿Cómo balancear generación y gasto?

**💡 IMPORTANTE:**
Proporciona ejemplos concretos y numéricos cuando sea posible (ej: "Esta combinación incrementa el daño en ~300%").`
    },

    // ========== GUÍA DE LEVELING ==========
    {
      id: 'leveling-guide',
      title: '📈 Guía de Leveling Optimizada',
      category: 'Progresión',
      description: 'Ruta optimizada de habilidades desde nivel 1 hasta Paragon 200',
      icon: Target,
      color: 'text-green-400',
      bg: 'bg-green-900/20',
      border: 'border-green-600',
      requiresSkills: false,
      generate: () => `Actúa como un experto en leveling eficiente de ${clase} en Diablo 4.

**🎯 OBJETIVO:**
Crear una guía paso a paso para levelear ${clase} desde nivel 1 hasta Paragon 200 de forma óptima.

**📊 GUÍA SOLICITADA:**

### 1. FASE TEMPRANA (Niveles 1-25)
- Habilidad inicial prioritaria
- Orden de desbloqueo de habilidades (nivel por nivel)
- Modificadores recomendados por habilidad
- Pasivas tempranas críticas
- Tips de supervivencia

### 2. FASE MEDIA (Niveles 25-50)
- Transición de habilidades (qué reemplazar)
- Build intermedia recomendada
- Aspectos/Glifos básicos a buscar
- Estadísticas prioritarias en gear

### 3. FASE FINAL (Niveles 50-100)
- Build de endgame temprano
- Optimización de recursos
- Farming de gear específico
- Preparación para World Tier 4

### 4. PARAGON (1-200)
- Orden de tableros Paragon
- Nodos críticos por tablero
- Glifos prioritarios y niveles objetivo
- Hitos importantes (Paragon 50, 100, 150, 200)

### 5. TIPS DE EFICIENCIA
- Mejores zonas de farming por nivel
- Eventos/Actividades prioritarias
- Qué evitar (trampas comunes)
- Speedrun tips (si aplicable)

### 6. PROGRESIÓN DE BUILD
- Build de leveling vs Build de endgame
- Cuándo hacer la transición
- Qué habilidades/aspectos mantener
- Inversión de recursos (cuándo vale la pena)

**💡 OBJETIVO:**
Minimizar tiempo de leveling sin sacrificar eficiencia. Foco en velocidad y fluidez.`
    },

    // ========== COMPARACIÓN DE MODIFICADORES ==========
    {
      id: 'modifier-comparison',
      title: '⚙️ Comparación de Modificadores',
      category: 'Habilidades',
      description: 'Compara todos los modificadores de habilidades activas para decisiones informadas',
      icon: AlertCircle,
      color: 'text-cyan-400',
      bg: 'bg-cyan-900/20',
      border: 'border-cyan-600',
      requiresSkills: true,
      generate: () => `Actúa como un experto en optimización de habilidades de ${clase}.

**🎯 OBJETIVO:**
Compara TODOS los modificadores disponibles para las habilidades activas de ${clase} y recomienda cuáles usar en diferentes contextos.

**📊 ANÁLISIS SOLICITADO:**

Para cada HABILIDAD ACTIVA de ${clase}, analiza sus modificadores:

### [NOMBRE DE LA HABILIDAD]
**Modificadores disponibles:**
1. **Nombre del Modificador**
   - Efecto: [descripción]
   - Mejor para: [situación/arquetipo]
   - Rating: ⭐⭐⭐⭐⭐ (1-5 estrellas)
   - Pros: [ventajas]
   - Contras: [desventajas]
   - Sinergias: [con qué build/aspectos funciona mejor]

2. **Nombre del Modificador**
   - [mismo formato]

**Recomendación general:**
- **Speedfarm:** Usar [Modificador X]
- **Endgame/Pit alto:** Usar [Modificador Y]
- **Single Target/Bosses:** Usar [Modificador Z]

---

Repite para TODAS las habilidades activas del ${clase}.

**💡 NOTA:**
Enfócate en casos de uso prácticos y diferencias significativas. No todos los modificadores son iguales.`
    }
  ];

  const isPromptAvailable = (prompt: PromptConfig): { available: boolean; reason?: string } => {
    if (prompt.requiresSkills && !heroSkills) {
      return { available: false, reason: '⚠️ No hay habilidades cargadas para este héroe' };
    }
    return { available: true };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-d4-text-dim">Cargando prompts...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="card p-4 lg:p-6 bg-gradient-to-br from-d4-surface via-d4-bg to-d4-surface border-2 border-d4-accent/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-d4-accent/20 rounded-lg border-2 border-d4-accent/40">
            <Sparkles className="w-5 lg:w-6 h-5 lg:h-6 text-d4-accent" />
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-d4-accent mb-1">Prompts de Análisis - {clase}</h2>
            <p className="text-d4-text-dim text-xs lg:text-sm">
              Genera prompts especializados para análisis de builds y estrategias de clase
            </p>
          </div>
        </div>
      </div>

      {/* Prompts por categoría */}
      {['Arquetipos y Builds', 'Habilidades', 'Progresión'].map(category => {
        const categoryPrompts = prompts.filter(p => p.category === category);
        if (categoryPrompts.length === 0) return null;

        return (
          <div key={category} className="space-y-3">
            <h3 className="text-base lg:text-lg font-bold text-d4-accent">{category}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
              {categoryPrompts.map(prompt => {
                const Icon = prompt.icon;
                const availability = isPromptAvailable(prompt);
                const isDisabled = !availability.available;

                return (
                  <div 
                    key={prompt.id} 
                    className={`card ${prompt.bg} border ${prompt.border} ${isDisabled ? 'opacity-50' : ''} p-3 lg:p-4`}
                  >
                    <div className="flex items-start justify-between gap-2 lg:gap-3 mb-2 lg:mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Icon className={`w-4 lg:w-5 h-4 lg:h-5 ${prompt.color} flex-shrink-0`} />
                        <h4 className={`font-bold ${prompt.color} text-xs lg:text-sm truncate`}>{prompt.title}</h4>
                      </div>
                      <div className="flex gap-1 lg:gap-2 flex-shrink-0">
                        <button
                          onClick={() => !isDisabled && copyToClipboard(prompt.generate(), prompt.id)}
                          disabled={isDisabled}
                          className={`p-1.5 lg:p-2 rounded transition-colors ${
                            isDisabled
                              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                              : copied === prompt.id
                              ? 'bg-green-600 text-white'
                              : 'bg-d4-surface hover:bg-d4-border text-d4-text'
                          }`}
                          title={isDisabled ? availability.reason : 'Copiar prompt'}
                        >
                          {copied === prompt.id ? (
                            <Check className="w-3 lg:w-4 h-3 lg:h-4" />
                          ) : (
                            <Copy className="w-3 lg:w-4 h-3 lg:h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => !isDisabled && executeAIQuery(prompt.generate(), prompt.id, prompt.title, prompt.category)}
                          disabled={isDisabled || aiProcessing === prompt.id}
                          className={`p-1.5 lg:p-2 rounded transition-colors ${
                            isDisabled
                              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                              : aiProcessing === prompt.id
                              ? 'bg-amber-600 text-white animate-pulse'
                              : 'bg-purple-600 hover:bg-purple-500 text-white'
                          }`}
                          title={isDisabled ? availability.reason : 'Consultar con IA'}
                        >
                          <Zap className="w-3 lg:w-4 h-3 lg:h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs lg:text-sm text-d4-text-dim mb-2">{prompt.description}</p>
                    {isDisabled && availability.reason && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-amber-900/20 border border-amber-600/30 rounded">
                        <AlertCircle className="w-3 lg:w-4 h-3 lg:h-4 text-amber-400 flex-shrink-0" />
                        <p className="text-[10px] lg:text-xs text-amber-300">{availability.reason}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Instructions */}
      <div className="card bg-d4-bg/50 p-3 lg:p-4">
        <h4 className="font-bold text-d4-text mb-2 text-sm lg:text-base">💡 Cómo usar:</h4>
        <ol className="list-decimal list-inside text-xs lg:text-sm text-d4-text-dim space-y-1">
          <li>Los prompts se generan con información del héroe/clase seleccionado</li>
          <li>Usa el botón <strong>Copiar</strong> para pegar en ChatGPT, Claude o Gemini</li>
          <li>Usa el botón <strong>⚡ IA</strong> para consultar directamente y ver resultados en la app</li>
          <li>Los prompts de "Análisis Completo" requieren habilidades del héroe cargadas</li>
        </ol>
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
    </div>
  );
};

export default HeroPrompts;
