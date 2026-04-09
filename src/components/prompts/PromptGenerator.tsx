import React, { useState } from 'react';
import { Sparkles, Copy, Check, FileText } from 'lucide-react';
import { Personaje } from '../../types';
import { PromptService } from '../../services/PromptService';
import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';

interface Props {
  personajes: Personaje[];
}

const PromptGenerator: React.FC<Props> = ({ personajes }) => {
  const modal = useModal();
  const [selectedPersonaje, setSelectedPersonaje] = useState<string>('');
  const [promptType, setPromptType] = useState<'custom' | 'synergy' | 'optimization' | 'deepAnalysis' | 'poolComparison'>('custom');
  const [customQuestion, setCustomQuestion] = useState('');
  const [includeSkills, setIncludeSkills] = useState(true);
  const [includeGlyphs, setIncludeGlyphs] = useState(true);
  const [includeStats, setIncludeStats] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    const personaje = personajes.find(p => p.id === selectedPersonaje);
    if (!personaje) {
      modal.showWarning('Selecciona un personaje');
      return;
    }

    let prompt = '';
    
    if (promptType === 'synergy') {
      prompt = await PromptService.generateSynergyPrompt(personaje);
    } else if (promptType === 'optimization') {
      prompt = await PromptService.generateOptimizationPrompt(personaje);
    } else if (promptType === 'deepAnalysis') {
      prompt = await PromptService.generateDeepAnalysisPrompt(personaje);
    } else if (promptType === 'poolComparison') {
      prompt = await PromptService.generatePoolComparisonPrompt(personaje);
    } else {
      prompt = await PromptService.generatePrompt(personaje, {
        incluir_habilidades: includeSkills,
        incluir_glifos: includeGlyphs,
        incluir_estadisticas: includeStats,
        pregunta_personalizada: customQuestion || undefined
      });
    }

    setGeneratedPrompt(prompt);
    setCopied(false);
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

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-d4-text mb-2">Generador de Prompts</h2>
        <p className="text-d4-text-dim">
          Genera prompts enriquecidos con la información de tus personajes para consultar en ChatGPT, Claude u otras IAs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de Configuración */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-d4-accent" />
            <h3 className="text-lg font-bold text-d4-text">Configuración</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-d4-text mb-2">
                Seleccionar Personaje
              </label>
              <select
                value={selectedPersonaje}
                onChange={(e) => setSelectedPersonaje(e.target.value)}
                className="input w-full"
              >
                <option value="">-- Selecciona un personaje --</option>
                {personajes.map(personaje => (
                  <option key={personaje.id} value={personaje.id}>
                    {personaje.nombre} ({personaje.clase} - Nivel {personaje.nivel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-d4-text mb-2">
                Tipo de Consulta
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-d4-border transition-colors">
                  <input
                    type="radio"
                    name="promptType"
                    value="custom"
                    checked={promptType === 'custom'}
                    onChange={() => setPromptType('custom')}
                  />
                  <div>
                    <div className="text-d4-text font-medium">Personalizado</div>
                    <div className="text-xs text-d4-text-dim">Configura qué incluir y agrega tu pregunta</div>
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
                    <div className="text-d4-text font-medium">Análisis de Sinergias</div>
                    <div className="text-xs text-d4-text-dim">Analiza combinaciones entre habilidades y glifos</div>
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
                    <div className="text-d4-text font-medium">Optimización de Build</div>
                    <div className="text-xs text-d4-text-dim">Obtén recomendaciones para mejorar el build</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-d4-border transition-colors">
                  <input
                    type="radio"
                    name="promptType"
                    value="deepAnalysis"
                    checked={promptType === 'deepAnalysis'}
                    onChange={() => setPromptType('deepAnalysis')}
                  />
                  <div>
                    <div className="text-d4-text font-medium">🎯 Análisis Profundo</div>
                    <div className="text-xs text-d4-text-dim">Evaluación completa con scoring y prioridades</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-d4-border transition-colors">
                  <input
                    type="radio"
                    name="promptType"
                    value="poolComparison"
                    checked={promptType === 'poolComparison'}
                    onChange={() => setPromptType('poolComparison')}
                  />
                  <div>
                    <div className="text-d4-text font-medium">🔄 Comparación con Pool</div>
                    <div className="text-xs text-d4-text-dim">Compara equipado vs todo lo disponible</div>
                  </div>
                </label>
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
                      <span className="text-d4-text">Habilidades</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeGlyphs}
                        onChange={(e) => setIncludeGlyphs(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-d4-text">Glifos</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeStats}
                        onChange={(e) => setIncludeStats(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-d4-text">Estadísticas</span>
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
                    className="input w-full"
                    rows={3}
                    placeholder="Ejemplo: ¿Qué modificadores debería cambiar para maximizar el daño de Espinas?"
                  />
                </div>
              </>
            )}

            <button
              onClick={handleGenerate}
              disabled={!selectedPersonaje}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generar Prompt
            </button>
          </div>
        </div>

        {/* Panel de Resultado */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-d4-accent" />
              <h3 className="text-lg font-bold text-d4-text">Prompt Generado</h3>
            </div>
            {generatedPrompt && (
              <button
                onClick={handleCopy}
                className="btn-secondary flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar
                  </>
                )}
              </button>
            )}
          </div>

          {generatedPrompt ? (
            <div className="bg-d4-bg rounded p-4 max-h-[600px] overflow-y-auto">
              <pre className="text-sm text-d4-text whitespace-pre-wrap font-mono">
                {generatedPrompt}
              </pre>
            </div>
          ) : (
            <div className="bg-d4-bg rounded p-8 text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-d4-text-dim" />
              <p className="text-d4-text-dim">
                Configura las opciones y genera tu prompt
              </p>
            </div>
          )}

          {generatedPrompt && (
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600 rounded text-sm text-blue-200">
              <strong>Tip:</strong> Copia este prompt y pégalo en ChatGPT, Claude o tu IA favorita
              para obtener análisis detallados sobre tu build.
            </div>
          )}
        </div>
      </div>
      <Modal {...modal} />
    </div>
  );
};

export default PromptGenerator;
