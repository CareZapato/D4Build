import React, { useState } from 'react';
import { Copy, Check, Sparkles, Zap, Shield, Target, TrendingUp } from 'lucide-react';
import { Personaje } from '../../types';

interface CharacterPromptsProps {
  personaje: Personaje;
}

const CharacterPrompts: React.FC<CharacterPromptsProps> = ({ personaje }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Context data extractor
  const getSkillsContext = () => {
   if (!personaje.habilidades_refs) return '';
    
    const activas = personaje.habilidades_refs.activas || [];
    const pasivas = personaje.habilidades_refs.pasivas || [];
    
    return `
Habilidades Activas (${activas.length}): ${activas.join(', ') || 'Ninguna'}
Habilidades Pasivas (${pasivas.length}): ${pasivas.join(', ') || 'Ninguna'}`;
  };

  const getGlyphsContext = () => {
    if (!personaje.glifos_refs) return 'Ninguno equipado';
    return `Glifos equipados (${personaje.glifos_refs.length}): ${personaje.glifos_refs.join(', ')}`;
  };

  const getAspectsContext = () => {
    if (!personaje.aspectos_refs) return 'Ninguno equipado';
    return `Aspectos equipados (${personaje.aspectos_refs.length}): ${personaje.aspectos_refs.join(', ')}`;
  };

  const getStatsContext = () => {
    if (!personaje.estadisticas) return '';
    
    const stats = personaje.estadisticas;
    const defensivo = stats.defensivo;
    const ofensivo = stats.ofensivo;
    const armaduraYRes = stats.armaduraYResistencias;
    
    return `
Nivel: ${personaje.nivel}${personaje.nivel_paragon ? ` | Paragon: ${personaje.nivel_paragon}` : ''}
Vida: ${defensivo?.vidaMaxima || 'N/A'}
Daño Base: ${ofensivo?.danioBaseArma || 'N/A'}
Armadura: ${armaduraYRes?.armadura || 'N/A'}
Aguante: ${armaduraYRes?.aguante || 'N/A'}`;
  };

  const prompts = [
    {
      id: 'build-analysis',
      title: 'Análisis Completo de Build',
      icon: Target,
      color: 'text-purple-400',
      bg: 'bg-purple-900/20',
      border: 'border-purple-600',
      description: 'Analiza tu build completa con todas sus sinergias',
      generate: () => `Actúa como un experto en builds de Diablo 4. Analiza mi build actual y proporciona un análisis detallado:

**CLASE:** ${personaje.clase}
**NIVEL:** ${personaje.nivel}${personaje.nivel_paragon ? ` (Paragon: ${personaje.nivel_paragon})` : ''}

${getSkillsContext()}

${getGlyphsContext()}

${getAspectsContext()}

Por favor, analiza:
1. Las sinergias entre habilidades, glifos y aspectos
2. Puntos fuertes y débiles de esta configuración
3. Si esta build es más orientada a daño, supervivencia o equilibrada
4. Recomendaciones de mejora específicas
5. Aspectos o glifos alternativos que podrían potenciar la build`
    },
    {
      id: 'glyph-synergy',
      title: 'Sinergias de Glifos',
      icon: Zap,
      color: 'text-green-400',
      bg: 'bg-green-900/20',
      border: 'border-green-600',
      description: 'Consulta sobre las sinergias de tus glifos actuales',
      generate: () => `Soy un jugador de Diablo 4 con un ${personaje.clase} nivel ${personaje.nivel}. 

**MIS GLIFOS ACTUALES:**
${getGlyphsContext()}

**MIS HABILIDADES:**
${getSkillsContext()}

Analiza:
1. ¿Estos glifos están optimizados para mis habilidades?
2. ¿Qué glifos alternativos recomendarías y por qué?
3. ¿En qué orden debería priorizar subir de nivel estos glifos?
4. ¿Hay algún glifo que no esté aprovechando al máximo mi build?`
    },
    {
      id: 'aspect-optimization',
      title: 'Optimización de Aspectos',
      icon: Shield,
      color: 'text-blue-400',
      bg: 'bg-blue-900/20',
      border: 'border-blue-600',
      description: 'Mejora la selección de aspectos para tu build',
      generate: () => `Como experto en Diablo 4, ayúdame a optimizar los aspectos legendarios de mi ${personaje.clase}.

**ASPECTOS ACTUALES:**
${getAspectsContext()}

**MI BUILD:**
- Clase: ${personaje.clase}
- Nivel: ${personaje.nivel}${personaje.nivel_paragon ? ` | Paragon: ${personaje.nivel_paragon}` : ''}
${getSkillsContext()}

Necesito saber:
1. ¿Estos aspectos tienen buena sinergia con mis habilidades?
2. ¿Qué aspectos legendarios son indispensables para esta build?
3. ¿Hay aspectos que debería reemplazar prioritariamente?
4. ¿Qué slots de equipo debería priorizar para cada aspecto?
5. Recomendaciones de aspectos alternativos por categoría (ofensivo, defensivo, utilidad)`
    },
    {
      id: 'skill-rotation',
      title: 'Rotación de Habilidades',
      icon: TrendingUp,
      color: 'text-orange-400',
      bg: 'bg-orange-900/20',
      border: 'border-orange-600',
      description: 'Optimiza tu rotación y uso de habilidades',
      generate: () => `Ayúdame a crear una rotación óptima para mi ${personaje.clase} en Diablo 4.

**MIS HABILIDADES:**
${getSkillsContext()}

**CONTEXTO ADICIONAL:**
${getGlyphsContext()}
${getAspectsContext()}

Por favor proporciona:
1. Rotación recomendada para combate contra grupos (trash mobs)
2. Rotación para jefes y élites
3. Prioridad de habilidades al inicio del combate
4. Cómo aprovechar las sinergias entre habilidades
5. errores comunes que debería evitar en la rotación`
    },
    {
      id: 'stats-priority',
      title: 'Prioridad de Estadísticas',
      icon: Sparkles,
      color: 'text-yellow-400',
      bg: 'bg-yellow-900/20',
      border: 'border-yellow-600',
      description: 'Qué stats priorizar para tu build',
      generate: () => `Como experto en Diablo 4, ¿qué estadísticas debería priorizar para mi ${personaje.clase}?

**MI BUILD:**
- Nivel: ${personaje.nivel}${personaje.nivel_paragon ? ` | Paragon: ${personaje.nivel_paragon}` : ''}
${getSkillsContext()}
${getGlyphsContext()}
${getAspectsContext()}

${getStatsContext()}

Por favor indica:
1. Top 5 estadísticas prioritarias para esta build
2. Breakpoints importantes que debería alcanzar
3. Qué stats evitar o tienen baja prioridad
4. Distribución recomendada en el tablero Paragon
5. Gemas y enchants que complementan este enfoque de stats`
    },
    {
      id: 'endgame-viability',
      title: 'Viabilidad en Endgame',
      icon: Target,
      color: 'text-red-400',
      bg: 'bg-red-900/20',
      border: 'border-red-600',
      description: 'Evalúa si tu build es viable para contenido de alto nivel',
      generate: () => `Evalúa la viabilidad de mi build de ${personaje.clase} para contenido endgame en Diablo 4.

**BUILD COMPLETA:**
- Nivel: ${personaje.nivel}${personaje.nivel_paragon ? ` | Paragon: ${personaje.nivel_paragon}` : ''}
${getSkillsContext()}
${getGlyphsContext()}
${getAspectsContext()}

Analiza la build para:
1. Mazmorras de Pesadilla (tiers altos)
2. Pit corrupto (empujes)
3. Jefes de endgame (Lilith, Duriel, etc.)
4. Contenido en grupo vs solo
5. Clasificación general: ¿Es esta una build tier S, A, B, C?
6. Cambios críticos necesarios para mejorar el tier`
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-d4-accent mb-2">Generador de Prompts</h2>
        <p className="text-d4-text-dim">
          Genera consultas inteligentes sobre tu build para usar con IA
        </p>
      </div>

      {/* Character Info Card */}
      <div className="card bg-d4-accent/5 border-d4-accent/30">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-5 h-5 text-d4-accent" />
          <h3 className="font-bold text-d4-text">Información del Personaje</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
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
              {(personaje.habilidades_refs?.activas?.length || 0) + (personaje.habilidades_refs?.pasivas?.length || 0)}
            </span>
          </div>
          <div>
            <span className="text-d4-text-dim">Glifos:</span>
            <span className="ml-2 text-d4-text font-semibold">
              {personaje.glifos_refs?.length || 0}
            </span>
          </div>
          <div>
            <span className="text-d4-text-dim">Aspectos:</span>
            <span className="ml-2 text-d4-text font-semibold">
              {personaje.aspectos_refs?.length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Prompt Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {prompts.map(prompt => {
          const Icon = prompt.icon;
          return (
            <div key={prompt.id} className={`card ${prompt.bg} border ${prompt.border}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${prompt.color}`} />
                  <h4 className={`font-bold ${prompt.color}`}>{prompt.title}</h4>
                </div>
                <button
                  onClick={() => copyToClipboard(prompt.generate(), prompt.id)}
                  className={`p-2 rounded transition-colors ${
                    copied === prompt.id
                      ? 'bg-green-600 text-white'
                      : 'bg-d4-surface hover:bg-d4-border text-d4-text'
                  }`}
                  title="Copiar prompt"
                >
                  {copied === prompt.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-sm text-d4-text-dim">{prompt.description}</p>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="card bg-d4-bg/50">
        <h4 className="font-bold text-d4-text mb-2">💡 Cómo usar:</h4>
        <ol className="list-decimal list-inside text-sm text-d4-text-dim space-y-1">
          <li>Haz clic en el botón de copiar del prompt que te interese</li>
          <li>Pégalo en tu IA favorita (ChatGPT, Claude, Gemini, etc.)</li>
          <li>La IA analizará tu build con el contexto completo</li>
          <li>Recibe recomendaciones personalizadas y detalladas</li>
        </ol>
      </div>
    </div>
  );
};

export default CharacterPrompts;
