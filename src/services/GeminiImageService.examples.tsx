/**
 * ============================================================================
 * D. EJEMPLOS DE USO EN COMPONENTES REACT
 * ============================================================================
 */

import React, { useState } from 'react';
import GeminiImageService, { 
  type AnalysisType
} from './GeminiImageService';

// ============================================================================
// INTERFACES PARA DATOS DE DIABLO 4
// ============================================================================

/**
 * Estructura de estadísticas completas
 * (Coincide con el prompt de 'stats')
 */
export interface D4Stats {
  nivel: number;
  nivel_paragon: number;
  clase: string;
  atributosPrincipales: {
    nivel: number;
    fuerza: number;
    inteligencia: number;
    voluntad: number;
    destreza: number;
  };
  personaje: {
    danioArma: number;
    aguante: number;
  };
  defensivo: {
    vida: number;
    armadura: number;
    armadura_total: number;
    reduccion_dano: number;
    reduccion_dano_distancia: number;
    reduccion_dano_cercano: number;
    reduccion_dano_dot: number;
    probabilidad_bloqueo: number;
    reduccion_dano_bloqueado: number;
    probabilidad_evadir: number;
    resistencia_todas: number;
    resistencia_sombra: number;
    resistencia_fuego: number;
    resistencia_frio: number;
    resistencia_veneno: number;
    resistencia_rayo: number;
  };
  ofensivo: {
    velocidad_ataque: number;
    probabilidad_golpe_critico: number;
    dano_golpe_critico: number;
    probabilidad_golpe_aplastante: number;
    dano_golpe_aplastante: number;
    dano_vulnerable: number;
    dano_general: number;
    dano_cercano: number;
    dano_distancia: number;
    dano_basico: number;
    dano_principal: number;
    dano_definitiva: number;
    dano_sombra: number;
    dano_fuego: number;
    dano_frio: number;
    dano_veneno: number;
    dano_rayo: number;
    dano_fisico: number;
  };
  utilidad: {
    velocidad_movimiento: number;
    duracion_control_masas: number;
    probabilidad_lucky_hit: number;
    curacion_pocion: number;
    regeneracion_energia: number;
    cooldown_reduction: number;
  };
}

/**
 * Estructura de glifos
 */
export interface D4Glyphs {
  glifos: Array<{
    nombre: string;
    nivel_actual: number;
    nivel_maximo: number;
    radio: number;
    bono: string;
    tipo: string;
  }>;
}

/**
 * Estructura de habilidades
 */
export interface D4Skills {
  clase: string;
  habilidades: {
    activas: Array<{
      nombre: string;
      rama: string;
      puntos: number;
      nivel_maximo: number;
      tipo: string;
    }>;
    pasivas: Array<{
      nombre: string;
      rama: string;
      puntos: number;
      nivel_maximo: number;
    }>;
    definitiva: {
      nombre: string;
      puntos: number;
    };
  };
}

/**
 * Estructura de aspectos
 */
export interface D4Aspects {
  aspectos: Array<{
    nombre: string;
    nombre_corto: string;
    efecto: string;
    nivel: string;
    ranura: string;
    categoria: string;
  }>;
}

// ============================================================================
// EJEMPLO 1: Componente Simple con Botón de Análisis
// ============================================================================

/**
 * Componente básico para analizar una imagen
 */
export const SimpleImageAnalyzer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisType>('stats');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setError('');
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Selecciona una imagen primero');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // IMPORTANTE: Configurar API key desde .env.local
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('VITE_GEMINI_API_KEY no configurada en .env.local');
      }

      const response = await GeminiImageService.analyzeImageWithFallback(
        {
          image: file,
          analysisType: analysisType
        },
        {
          apiKey: apiKey
        }
      );

      if (response.success) {
        setResult(response.data);
        console.log('✅ Datos recibidos:', response.data);
      } else {
        setError(response.error || 'Error desconocido');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3>Análisis de Imagen con Gemini</h3>
      
      <div className="flex flex-col gap-4">
        {/* Selector de archivo */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="border p-2 rounded"
        />

        {/* Selector de tipo de análisis */}
        <select
          value={analysisType}
          onChange={(e) => setAnalysisType(e.target.value as AnalysisType)}
          className="border p-2 rounded"
        >
          <option value="stats">Estadísticas</option>
          <option value="glyphs">Glifos</option>
          <option value="skills">Habilidades</option>
          <option value="aspects">Aspectos</option>
          <option value="currency">Monedas</option>
        </select>

        {/* Botón de análisis */}
        <button
          onClick={handleAnalyze}
          disabled={!file || loading}
          className="btn-primary"
        >
          {loading ? 'Analizando...' : 'Analizar Imagen'}
        </button>

        {/* Errores */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Resultados */}
        {result && (
          <div className="bg-green-100 border border-green-400 p-4 rounded">
            <h4 className="font-bold mb-2">Resultado:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// EJEMPLO 2: Integración con CharacterStats.tsx
// ============================================================================

/**
 * Helper para importar estadísticas desde imagen en CharacterStats
 * 
 * USO:
 * import { importStatsFromImage } from './services/GeminiImageService.examples';
 * 
 * const stats = await importStatsFromImage(file, apiKey);
 * onChange(stats, stats.nivel, stats.nivel_paragon);
 */
export async function importStatsFromImage(
  file: File,
  apiKey: string
): Promise<D4Stats | null> {
  console.log('📸 Importando estadísticas desde imagen...');

  const response = await GeminiImageService.analyzeImageWithFallback<D4Stats>(
    {
      image: file,
      analysisType: 'stats'
    },
    {
      apiKey,
      temperature: 0.1  // Baja temperatura para máxima precisión
    }
  );

  if (response.success && response.data) {
    console.log('✅ Estadísticas importadas:', response.data);
    return response.data;
  } else {
    console.error('❌ Error al importar:', response.error);
    throw new Error(response.error || 'Error al analizar imagen');
  }
}

/**
 * Botón que se puede agregar a CharacterStats.tsx
 */
export const ImportStatsFromImageButton: React.FC<{
  onStatsImported: (stats: D4Stats) => void;
}> = ({ onStatsImported }) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Configura VITE_GEMINI_API_KEY en .env.local');
      }

      const stats = await importStatsFromImage(file, apiKey);
      if (stats) {
        onStatsImported(stats);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="btn-secondary"
      >
        {loading ? '⏳ Analizando...' : '📸 Importar desde Imagen'}
      </button>
    </>
  );
};

// ============================================================================
// EJEMPLO 3: Integración con CharacterGlyphs.tsx
// ============================================================================

/**
 * Helper para importar glifos desde imagen
 */
export async function importGlyphsFromImage(
  file: File,
  apiKey: string
): Promise<D4Glyphs | null> {
  console.log('📸 Importando glifos desde imagen...');

  const response = await GeminiImageService.analyzeImageWithFallback<D4Glyphs>(
    {
      image: file,
      analysisType: 'glyphs'
    },
    {
      apiKey,
      temperature: 0.1
    }
  );

  if (response.success && response.data) {
    console.log('✅ Glifos importados:', response.data);
    return response.data;
  } else {
    throw new Error(response.error || 'Error al analizar imagen');
  }
}

// ============================================================================
// EJEMPLO 4: Integración con CharacterSkills.tsx
// ============================================================================

/**
 * Helper para importar habilidades desde imagen
 */
export async function importSkillsFromImage(
  file: File,
  apiKey: string
): Promise<D4Skills | null> {
  console.log('📸 Importando habilidades desde imagen...');

  const response = await GeminiImageService.analyzeImageWithFallback<D4Skills>(
    {
      image: file,
      analysisType: 'skills'
    },
    {
      apiKey,
      temperature: 0.1
    }
  );

  if (response.success && response.data) {
    console.log('✅ Habilidades importadas:', response.data);
    return response.data;
  } else {
    throw new Error(response.error || 'Error al analizar imagen');
  }
}

// ============================================================================
// EJEMPLO 5: Integración con HeroAspects.tsx
// ============================================================================

/**
 * Helper para importar aspectos desde imagen
 */
export async function importAspectsFromImage(
  file: File,
  apiKey: string
): Promise<D4Aspects | null> {
  console.log('📸 Importando aspectos desde imagen...');

  const response = await GeminiImageService.analyzeImageWithFallback<D4Aspects>(
    {
      image: file,
      analysisType: 'aspects'
    },
    {
      apiKey,
      temperature: 0.1
    }
  );

  if (response.success && response.data) {
    console.log('✅ Aspectos importados:', response.data);
    return response.data;
  } else {
    throw new Error(response.error || 'Error al analizar imagen');
  }
}

// ============================================================================
// EJEMPLO 6: Wrapper para Manejar Errores de Forma Visual
// ============================================================================

/**
 * Hook personalizado para manejar análisis de imágenes con estado UI
 */
export function useGeminiImageAnalysis<T = any>(analysisType: AnalysisType) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string>('');

  const analyze = async (file: File, apiKey?: string) => {
    setLoading(true);
    setError('');
    setData(null);

    try {
      const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!key) {
        throw new Error('API Key no configurada');
      }

      const response = await GeminiImageService.analyzeImageWithFallback<T>(
        { image: file, analysisType },
        { apiKey: key }
      );

      if (response.success) {
        setData(response.data || null);
        return response.data;
      } else {
        const errorMsg = getErrorMessage(response.errorType, response.error);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Error desconocido';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, data, error, analyze };
}

/**
 * Mensajes de error amigables según categoría
 */
function getErrorMessage(errorType?: string, originalError?: string): string {
  switch (errorType) {
    case 'MODEL_UNAVAILABLE':
      return '❌ El modelo de IA no está disponible. Intenta más tarde.';
    
    case 'INVALID_API_KEY':
      return '🔑 API Key inválida. Verifica tu configuración en .env.local';
    
    case 'QUOTA_EXCEEDED':
      return '⏱️ Límite de uso alcanzado. Espera unos minutos.';
    
    case 'EMPTY_RESPONSE':
      return '📭 La IA no devolvió datos. Intenta con otra imagen.';
    
    case 'INVALID_JSON':
      return '⚠️ Respuesta inválida de la IA. Intenta de nuevo.';
    
    case 'NETWORK_ERROR':
      return '🌐 Error de conexión. Verifica tu internet.';
    
    default:
      return originalError || '❌ Error desconocido';
  }
}

// ============================================================================
// EJEMPLO 7: Componente Completo para CharacterDetail
// ============================================================================

/**
 * Componente UI completo con todos los tipos de análisis
 */
export const DiabloImageImporter: React.FC<{
  onStatsImported?: (stats: D4Stats) => void;
  onGlyphsImported?: (glyphs: D4Glyphs) => void;
  onSkillsImported?: (skills: D4Skills) => void;
  onAspectsImported?: (aspects: D4Aspects) => void;
}> = ({ onStatsImported, onGlyphsImported, onSkillsImported, onAspectsImported }) => {
  
  const [activeTab, setActiveTab] = useState<AnalysisType>('stats');
  const { loading, data, error, analyze } = useGeminiImageAnalysis(activeTab);
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const result = await analyze(file);
      
      // Ejecutar callback correspondiente
      switch (activeTab) {
        case 'stats':
          onStatsImported?.(result as D4Stats);
          break;
        case 'glyphs':
          onGlyphsImported?.(result as D4Glyphs);
          break;
        case 'skills':
          onSkillsImported?.(result as D4Skills);
          break;
        case 'aspects':
          onAspectsImported?.(result as D4Aspects);
          break;
      }
    } catch (err) {
      // Error ya manejado en el hook
    }
  };

  return (
    <div className="card">
      <h3>📸 Importar desde Imagen</h3>
      
      {/* Tabs para seleccionar tipo de análisis */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded ${activeTab === 'stats' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Estadísticas
        </button>
        <button
          onClick={() => setActiveTab('glyphs')}
          className={`px-4 py-2 rounded ${activeTab === 'glyphs' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Glifos
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`px-4 py-2 rounded ${activeTab === 'skills' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Habilidades
        </button>
        <button
          onClick={() => setActiveTab('aspects')}
          className={`px-4 py-2 rounded ${activeTab === 'aspects' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Aspectos
        </button>
      </div>
      
      {/* Input de archivo */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={loading}
        className="mb-4"
      />
      
      {/* Estado de carga */}
      {loading && (
        <div className="text-blue-600">
          ⏳ Analizando imagen con IA...
        </div>
      )}
      
      {/* Errores */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Datos importados */}
      {data && (
        <div className="bg-green-100 border border-green-400 p-4 rounded">
          <h4 className="font-bold mb-2">✅ Datos importados correctamente</h4>
          <details>
            <summary className="cursor-pointer text-sm text-gray-600">
              Ver JSON completo
            </summary>
            <pre className="text-xs overflow-auto mt-2 bg-white p-2 rounded">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  SimpleImageAnalyzer,
  ImportStatsFromImageButton,
  DiabloImageImporter,
  importStatsFromImage,
  importGlyphsFromImage,
  importSkillsFromImage,
  importAspectsFromImage,
  useGeminiImageAnalysis
};
