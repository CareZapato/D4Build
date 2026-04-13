/**
 * ============================================================================
 * 📖 EJEMPLOS DE USO - GeminiServiceV3
 * ============================================================================
 */

import { useState } from 'react';
import { GeminiService } from './GeminiServiceV3';

// ============================================================================
// E. EJEMPLO DE PROMPT PARA DIABLO 4
// ============================================================================

/**
 * Prompt optimizado para análisis de estadísticas de Diablo 4
 * 
 * DECISIONES:
 * - Instrucciones claras y estructuradas
 * - Formato JSON explícito
 * - Manejo de valores faltantes (0 como default)
 * - Conversión de formatos (1,234 → 1234, 50% → 50)
 */
export const PROMPT_DIABLO4_STATS = `Analiza esta captura de pantalla de estadísticas de un personaje de Diablo 4.

Extrae TODOS los valores numéricos visibles y devuelve un JSON con esta estructura EXACTA:

{
  "nivel": 0,
  "nivel_paragon": 0,
  "clase": "",
  "atributosPrincipales": {
    "nivel": 0,
    "fuerza": 0,
    "inteligencia": 0,
    "voluntad": 0,
    "destreza": 0
  },
  "personaje": {
    "danioArma": 0,
    "aguante": 0
  },
  "defensivo": {
    "vida": 0,
    "armadura": 0,
    "armadura_total": 0,
    "reduccion_dano": 0,
    "reduccion_dano_distancia": 0,
    "reduccion_dano_cercano": 0,
    "reduccion_dano_dot": 0,
    "reduccion_dano_while_fortified": 0,
    "probabilidad_bloqueo": 0,
    "reduccion_dano_bloqueado": 0,
    "probabilidad_evadir": 0,
    "resistencia_todas": 0,
    "resistencia_sombra": 0,
    "resistencia_fuego": 0,
    "resistencia_frio": 0,
    "resistencia_veneno": 0,
    "resistencia_rayo": 0
  },
  "ofensivo": {
    "velocidad_ataque": 0,
    "probabilidad_golpe_critico": 0,
    "dano_golpe_critico": 0,
    "probabilidad_golpe_aplastante": 0,
    "dano_golpe_aplastante": 0,
    "dano_vulnerable": 0,
    "dano_general": 0,
    "dano_cercano": 0,
    "dano_distancia": 0,
    "dano_basico": 0,
    "dano_principal": 0,
    "dano_definitiva": 0,
    "dano_while_berserking": 0,
    "dano_while_healthy": 0,
    "dano_sombra": 0,
    "dano_fuego": 0,
    "dano_frio": 0,
    "dano_veneno": 0,
    "dano_rayo": 0,
    "dano_fisico": 0
  },
  "utilidad": {
    "velocidad_movimiento": 0,
    "duracion_control_masas": 0,
    "probabilidad_lucky_hit": 0,
    "curacion_pocion": 0,
    "regeneracion_energia": 0,
    "cooldown_reduction": 0
  }
}

REGLAS IMPORTANTES:
1. Si un valor NO es visible en la imagen, usa 0
2. Convierte porcentajes sin el símbolo: "50%" → 50
3. Convierte números con comas: "1,234" → 1234
4. La clase puede ser: "Bárbaro", "Hechicero", "Pícaro", "Druida", "Nigromante", "Buscaespíritus"
5. SOLO devuelve el JSON, sin texto adicional ni markdown
6. Asegúrate de que sea JSON válido (comillas dobles, sin comas finales)`;

/**
 * Prompt para análisis de habilidades
 */
export const PROMPT_DIABLO4_SKILLS = `Analiza el árbol de habilidades de este personaje de Diablo 4.

Devuelve JSON con esta estructura:

{
  "clase": "",
  "habilidades": {
    "activas": [
      {
        "nombre": "",
        "rama": "",
        "puntos": 0,
        "nivel_maximo": 5
      }
    ],
    "pasivas": [
      {
        "nombre": "",
        "rama": "",
        "puntos": 0,
        "nivel_maximo": 3
      }
    ]
  }
}

REGLAS:
1. Distingue entre habilidades activas (skills) y pasivas (passives)
2. Extrae el nombre exacto de cada habilidad
3. Extrae los puntos asignados (0-5 para activas, 0-3 para pasivas)
4. Si puedes identificar la rama (Basic, Core, Defensive, etc.), inclúyela
5. SOLO JSON, sin explicaciones`;

/**
 * Prompt para análisis de aspectos
 */
export const PROMPT_DIABLO4_ASPECTS = `Analiza los aspectos legendarios equipados en este personaje de Diablo 4.

Devuelve JSON:

{
  "aspectos": [
    {
      "nombre": "",
      "nombre_corto": "",
      "efecto": "",
      "ranura": "",
      "categoria": ""
    }
  ]
}

REGLAS:
1. nombre: Nombre completo del aspecto
2. nombre_corto: Versión abreviada sin "Aspecto de"
3. efecto: Descripción del efecto con valores
4. ranura: "Arma", "Armadura", "Amuleto", "Anillo"
5. categoria: "Ofensivo", "Defensivo", "Movilidad", "Recurso", "Utilidad"
6. SOLO JSON`;

// ============================================================================
// D. EJEMPLO DE USO EN REACT
// ============================================================================

/**
 * Componente React completo para análisis de imágenes de Diablo 4
 */
export function DiabloImageAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Manejador de selección de archivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setResult(null);
    setError(null);

    // Crear preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // Manejador de análisis
  const handleAnalyze = async (promptType: 'stats' | 'skills' | 'aspects') => {
    if (!selectedFile) {
      setError('Selecciona una imagen primero');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      // Seleccionar prompt según tipo
      const prompt = 
        promptType === 'stats' ? PROMPT_DIABLO4_STATS :
        promptType === 'skills' ? PROMPT_DIABLO4_SKILLS :
        PROMPT_DIABLO4_ASPECTS;

      // ⭐ LLAMADA PRINCIPAL AL SERVICIO
      const response = await GeminiService.processImageWithFallback(
        {
          image: selectedFile,
          prompt: prompt
        },
        {
          apiKey: import.meta.env.VITE_GEMINI_API_KEY, // ⚠️ Define esto en .env.local
          temperature: 0.1 // Baja temperatura para extracción precisa
        }
      );

      if (response.success) {
        console.log('✅ Análisis exitoso');
        console.log('Modelo usado:', response.modelUsed);
        console.log('Datos:', response.data);
        setResult(response.data);
      } else {
        console.error('❌ Error:', response.error);
        setError(response.error || 'Error desconocido');
      }

    } catch (err) {
      console.error('💥 Error inesperado:', err);
      setError('Error inesperado al procesar la imagen');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Analizador de Diablo 4</h2>
        
        {/* Input de archivo */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Selecciona una captura de pantalla
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm border rounded p-2"
          />
        </div>

        {/* Preview de imagen */}
        {previewUrl && (
          <div className="mb-4">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="max-w-full h-auto border rounded"
              style={{ maxHeight: '400px' }}
            />
          </div>
        )}

        {/* Botones de análisis */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => handleAnalyze('stats')}
            disabled={!selectedFile || analyzing}
            className="btn-primary"
          >
            {analyzing ? 'Analizando...' : '📊 Analizar Estadísticas'}
          </button>
          
          <button
            onClick={() => handleAnalyze('skills')}
            disabled={!selectedFile || analyzing}
            className="btn-primary"
          >
            {analyzing ? 'Analizando...' : '⚔️ Analizar Habilidades'}
          </button>
          
          <button
            onClick={() => handleAnalyze('aspects')}
            disabled={!selectedFile || analyzing}
            className="btn-primary"
          >
            {analyzing ? 'Analizando...' : '💎 Analizar Aspectos'}
          </button>
        </div>

        {/* Mostrar error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Mostrar resultado */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h3 className="font-bold mb-2">✅ Resultado:</h3>
            <pre className="bg-white p-3 rounded overflow-x-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Advertencia de seguridad */}
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm">
        <strong>⚠️ IMPORTANTE:</strong> No subas tu API key a GitHub.
        <br />
        Crea un archivo <code>.env.local</code> con:
        <pre className="bg-white p-2 rounded mt-2">
          VITE_GEMINI_API_KEY=tu_clave_aqui
        </pre>
      </div>
    </div>
  );
}

// ============================================================================
// EJEMPLO SIMPLE (sin componente completo)
// ============================================================================

/**
 * Función standalone para análisis rápido
 */
export async function analizarImagenDiablo4Simple(
  imageFile: File,
  apiKey: string
): Promise<any> {
  
  const response = await GeminiService.processImageWithFallback(
    {
      image: imageFile,
      prompt: PROMPT_DIABLO4_STATS
    },
    {
      apiKey,
      temperature: 0.1
    }
  );

  if (!response.success) {
    throw new Error(response.error || 'Error al procesar imagen');
  }

  return response.data;
}

// ============================================================================
// EJEMPLO CON MANEJO DE ERRORES ESPECÍFICO
// ============================================================================

export async function analizarConManejoDeErrores(
  imageFile: File,
  apiKey: string
) {
  const response = await GeminiService.processImage(
    {
      image: imageFile,
      prompt: PROMPT_DIABLO4_STATS
    },
    {
      apiKey,
      model: 'gemini-3-flash-preview' // Modelo específico
    }
  );

  // Manejar según tipo de error
  switch (response.errorType) {
    case 'MODEL_UNAVAILABLE':
      console.error('Modelo no disponible, probando con fallback...');
      // Reintentar con fallback
      return GeminiService.processImageWithFallback(
        { image: imageFile, prompt: PROMPT_DIABLO4_STATS },
        { apiKey }
      );
      
    case 'INVALID_API_KEY':
      alert('API Key inválida. Verifica tu configuración.');
      break;
      
    case 'QUOTA_EXCEEDED':
      alert('Cuota excedida. Espera unos minutos.');
      break;
      
    case 'EMPTY_MODEL_RESPONSE':
      alert('El modelo no pudo procesar la imagen. Intenta con otra.');
      break;
      
    case 'INVALID_JSON':
      console.error('JSON inválido recibido:', response.rawText);
      alert('La respuesta no es JSON válido. Revisa los logs.');
      break;
      
    default:
      if (response.success) {
        console.log('✅ Éxito:', response.data);
        return response;
      }
  }

  return response;
}

// ============================================================================
// EJEMPLO DE INTEGRACIÓN CON ESTADO GLOBAL (Context API)
// ============================================================================

export async function importarEstadisticasDesdeImagen(
  imageFile: File,
  apiKey: string,
  onProgress: (message: string) => void
) {
  try {
    onProgress('Convirtiendo imagen...');
    
    onProgress('Enviando a Gemini...');
    const response = await GeminiService.processImageWithFallback(
      {
        image: imageFile,
        prompt: PROMPT_DIABLO4_STATS
      },
      { apiKey }
    );

    if (!response.success) {
      throw new Error(response.error);
    }

    onProgress('Procesando datos...');
    
    // Aquí integrarías con tu estado global
    // ej: dispatch({ type: 'UPDATE_STATS', payload: response.data });
    
    onProgress('✅ Completado');
    
    return response.data;
    
  } catch (error: any) {
    onProgress(`❌ Error: ${error.message}`);
    throw error;
  }
}
