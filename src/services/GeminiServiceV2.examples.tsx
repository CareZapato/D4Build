/**
 * ============================================================================
 * 📖 EJEMPLOS DE USO - GEMINI SERVICE V2
 * ============================================================================
 * 
 * Este archivo muestra cómo usar el nuevo GeminiServiceV2 con selección
 * dinámica de modelos en tu aplicación React.
 */

import React, { useState } from 'react';
import { GeminiService } from './GeminiServiceV2';

// ============================================================================
// EJEMPLO 1: COMPONENTE REACT COMPLETO
// ============================================================================

/**
 * Componente que permite analizar imágenes de Diablo 4 con Gemini
 */
export function DiabloImageAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [modelUsed, setModelUsed] = useState<string>('');

  // ⚠️ IMPORTANTE: En producción, NO hardcodees la API key aquí
  // Usa variables de entorno o un backend proxy
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

  /**
   * Manejar selección de archivo
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError('');
      setModelUsed('');
    }
  };

  /**
   * E. PROMPT OPTIMIZADO PARA DIABLO 4 - ESTADÍSTICAS
   */
  const PROMPT_ESTADISTICAS = `Eres un experto analizando capturas de pantalla de Diablo 4.

Analiza esta imagen de estadísticas del personaje y extrae TODOS los valores numéricos visibles.

Devuelve ÚNICAMENTE un objeto JSON con esta estructura exacta:

{
  "nivel": 0,
  "nivel_paragon": 0,
  "clase": "Bárbaro" | "Hechicero" | "Pícaro" | "Nigromante" | "Druida" | "Espíritu",
  "atributosPrincipales": {
    "fuerza": 0,
    "destreza": 0,
    "inteligencia": 0,
    "voluntad": 0
  },
  "defensivo": {
    "vida": 0,
    "armadura": 0,
    "resistencia_all": 0,
    "resistencia_fuego": 0,
    "resistencia_frio": 0,
    "resistencia_veneno": 0,
    "resistencia_sombra": 0,
    "resistencia_rayo": 0,
    "probabilidad_esquivar": 0,
    "probabilidad_bloquear": 0,
    "reduccion_dano": 0
  },
  "ofensivo": {
    "velocidad_ataque": 0,
    "dano_critico": 0,
    "probabilidad_critico": 0,
    "dano_vulnerable": 0,
    "dano_core": 0
  },
  "utilidad": {
    "velocidad_movimiento": 0,
    "rango_recogida": 0
  }
}

REGLAS CRÍTICAS:
- Si un valor no es visible, usa 0
- NO agregues explicaciones, SOLO JSON
- Todos los números deben ser numéricos, NO strings
- Respeta exactamente la estructura mostrada
- Si ves valores como "50%", extrae solo el 50
- Si ves valores como "1,234", extrae como 1234`;

  /**
   * PROMPT PARA HABILIDADES
   */
  const PROMPT_HABILIDADES = `Analiza esta captura del árbol de habilidades de Diablo 4.

Extrae TODAS las habilidades visibles con sus puntos gastados.

Devuelve JSON:
{
  "clase": "Bárbaro",
  "habilidades": {
    "activas": [
      {
        "nombre": "Nombre completo",
        "puntos": 0,
        "rango": 0,
        "descripcion": "Si es visible"
      }
    ],
    "pasivas": [
      {
        "nombre": "Nombre completo", 
        "puntos": 0,
        "rango": 0,
        "descripcion": "Si es visible"
      }
    ]
  }
}

IMPORTANTE:
- Distingue activas de pasivas
- Extrae puntos gastados exactos
- Si no ves algo, usa 0 o ""
- SOLO JSON, sin explicaciones`;

  /**
   * Analizar imagen con Gemini
   */
  const analyzeImage = async (promptType: 'estadisticas' | 'habilidades' = 'estadisticas') => {
    if (!selectedFile) {
      setError('Selecciona una imagen primero');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setModelUsed('');

    try {
      const prompt = promptType === 'estadisticas' ? PROMPT_ESTADISTICAS : PROMPT_HABILIDADES;

      console.log('🚀 Iniciando análisis con Gemini...');

      // ✨ LLAMADA AL SERVICIO V2 - SELECCIÓN AUTOMÁTICA DE MODELO
      const response = await GeminiService.processAndExtractJSON(
        {
          image: selectedFile,
          prompt: prompt,
          temperature: 0.05,  // Máxima precisión para datos estructurados
          maxOutputTokens: 8192
        },
        {
          apiKey: GEMINI_API_KEY,
          useJsonMode: true,  // ⭐ JSON puro sin markdown
          // NO especificamos 'model' - se selecciona automáticamente
        }
      );

      if (response.success) {
        const data = JSON.parse(response.json);
        setResult(data);
        setModelUsed(response.modelUsed || 'unknown');
        console.log('✅ Análisis exitoso');
        console.log('📊 Modelo usado:', response.modelUsed);
        console.log('📦 Datos:', data);
      } else {
        setError(`Error: ${response.error} (Tipo: ${response.errorType})`);
        console.error('❌ Error:', response.error);
        console.error('Tipo de error:', response.errorType);
      }

    } catch (err: any) {
      setError(`Excepción: ${err.message}`);
      console.error('💥 Excepción no manejada:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ver modelos disponibles (debugging)
   */
  const showAvailableModels = async () => {
    try {
      console.log('🔍 Consultando modelos disponibles...');
      const models = await GeminiService.listCompatibleModels(GEMINI_API_KEY);
      console.log('📋 Modelos compatibles:', models);
      alert(`Modelos disponibles:\n\n${models.join('\n')}`);
    } catch (err: any) {
      console.error('❌ Error:', err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>🔮 Analizador de Imágenes Diablo 4</h1>
      <p>Extrae datos estructurados de screenshots usando Gemini AI con selección automática de modelo</p>

      {/* Input de archivo */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'block', marginBottom: '10px' }}
        />
        {preview && (
          <img
            src={preview}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '400px',
              border: '2px solid #ccc',
              borderRadius: '8px'
            }}
          />
        )}
      </div>

      {/* Botones de acción */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => analyzeImage('estadisticas')}
          disabled={!selectedFile || loading}
          style={{
            padding: '12px 20px',
            fontSize: '16px',
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '🔄 Analizando...' : '📊 Analizar Estadísticas'}
        </button>

        <button
          onClick={() => analyzeImage('habilidades')}
          disabled={!selectedFile || loading}
          style={{
            padding: '12px 20px',
            fontSize: '16px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '🔄 Analizando...' : '⚔️ Analizar Habilidades'}
        </button>

        <button
          onClick={showAvailableModels}
          style={{
            padding: '12px 20px',
            fontSize: '16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🔍 Ver Modelos Disponibles
        </button>
      </div>

      {/* Modelo usado */}
      {modelUsed && (
        <div style={{
          padding: '15px',
          backgroundColor: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <strong>🤖 Modelo usado:</strong> <code>{modelUsed}</code>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div style={{
          padding: '15px',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '6px'
        }}>
          <h3>✅ Resultado del Análisis:</h3>
          <pre style={{
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '6px',
            overflow: 'auto',
            maxHeight: '500px'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {/* Advertencia de seguridad */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '6px'
      }}>
        <h4>⚠️ ADVERTENCIA DE SEGURIDAD</h4>
        <p>
          Estás usando la API key directamente desde el frontend. Esto es aceptable solo para desarrollo/demo.
        </p>
        <p>
          <strong>Para PRODUCCIÓN:</strong>
        </p>
        <ul>
          <li>Crea un backend que maneje las llamadas a Gemini</li>
          <li>Guarda la API key en variables de entorno del servidor</li>
          <li>El frontend solo llama a tu backend, no a Gemini directamente</li>
        </ul>
        <p>
          <strong>Riesgo:</strong> Cualquiera puede inspeccionar tu código y robar la API key.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// EJEMPLO 2: USO SIMPLE SIN COMPONENTE
// ============================================================================

/**
 * Función standalone para analizar una imagen
 */
export async function analizarImagenDiablo4(
  imageFile: File,
  apiKey: string
): Promise<any> {
  try {
    const result = await GeminiService.processAndExtractJSON(
      {
        image: imageFile,
        prompt: `Analiza esta captura de Diablo 4 y extrae datos en JSON.
        
        Formato:
        {
          "tipo": "estadisticas" | "habilidades" | "glifos",
          "datos": { /* datos específicos según el tipo */ }
        }`,
        temperature: 0.1
      },
      {
        apiKey,
        useJsonMode: true  // JSON puro
      }
    );

    if (result.success) {
      console.log('✅ Modelo usado:', result.modelUsed);
      return JSON.parse(result.json);
    } else {
      throw new Error(result.error);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// ============================================================================
// EJEMPLO 3: CONSULTAR MODELOS DISPONIBLES
// ============================================================================

/**
 * Ver qué modelos están disponibles para tu API key
 */
export async function consultarModelosDisponibles(apiKey: string) {
  try {
    console.log('🔍 Consultando modelos...');
    
    const compatibles = await GeminiService.listCompatibleModels(apiKey);
    
    console.log('📋 Modelos compatibles encontrados:');
    compatibles.forEach((model, index) => {
      console.log(`  ${index + 1}. ${model}`);
    });
    
    // Obtener el recomendado
    const recommended = await GeminiService.getRecommendedModel(apiKey);
    console.log(`\n🏆 Modelo recomendado: ${recommended}`);
    
    return { compatibles, recommended };
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// ============================================================================
// EJEMPLO 4: MANEJO DE ERRORES COMPLETO
// ============================================================================

/**
 * Ejemplo de cómo manejar todos los tipos de errores
 */
export async function analizarConManejoDeErrores(
  imageFile: File,
  apiKey: string
) {
  try {
    const result = await GeminiService.processAndExtractJSON(
      {
        image: imageFile,
        prompt: "Analiza esta imagen y devuelve JSON..."
      },
      {
        apiKey,
        useJsonMode: true
      }
    );

    if (!result.success) {
      // Manejar según tipo de error
      switch (result.errorType) {
        case 'API_KEY':
          console.error('🔑 API Key inválida');
          alert('Tu API key no es válida. Consigue una en: https://aistudio.google.com/app/apikey');
          break;

        case 'QUOTA':
          console.error('📊 Cuota agotada');
          alert('Has alcanzado el límite de tu cuota. Espera o actualiza tu plan.');
          break;

        case 'MODEL':
          console.error('🤖 Problema con el modelo');
          alert('No se encontró un modelo compatible. Verifica tu región o API key.');
          // Intentar refrescar la lista de modelos
          console.log('🔄 Intentando refrescar modelos...');
          const retry = await GeminiService.processAndExtractJSON(
            { image: imageFile, prompt: "Analiza..." },
            { apiKey, useJsonMode: true, forceRefreshModels: true }
          );
          if (retry.success) {
            console.log('✅ Éxito después de refrescar');
            return retry;
          }
          break;

        case 'JSON':
          console.error('📄 JSON inválido');
          alert('El modelo no devolvió JSON válido. Mejora el prompt.');
          console.log('Texto recibido:', result.rawText);
          break;

        case 'EMPTY':
          console.error('📭 Respuesta vacía');
          alert('El modelo no pudo analizar la imagen. Prueba con una imagen más clara.');
          break;

        case 'NETWORK':
          console.error('🌐 Error de red');
          alert('Problema de conexión. Verifica tu internet.');
          break;

        default:
          console.error('❓ Error desconocido');
          alert(`Error: ${result.error}`);
      }
      
      return null;
    }

    // ✅ Éxito
    const data = JSON.parse(result.json);
    console.log('✅ Análisis exitoso');
    console.log('🤖 Modelo:', result.modelUsed);
    console.log('📦 Datos:', data);
    return data;

  } catch (error: any) {
    console.error('💥 Excepción no manejada:', error);
    alert(`Error inesperado: ${error.message}`);
    return null;
  }
}

// ============================================================================
// EJEMPLO 5: FORZAR ACTUALIZACIÓN DE MODELOS
// ============================================================================

/**
 * Si los modelos cambian o hay nuevos disponibles, puede forzar la reconsulta
 */
export async function analizarConModelosActualizados(
  imageFile: File,
  apiKey: string
) {
  console.log('🔄 Forzando actualización de lista de modelos...');
  
  const result = await GeminiService.processAndExtractJSON(
    {
      image: imageFile,
      prompt: "Analiza esta imagen..."
    },
    {
      apiKey,
      useJsonMode: true,
      forceRefreshModels: true  // ⭐ Fuerza reconsulta de modelos
    }
  );

  if (result.success) {
    console.log('✅ Modelo actualizado usado:', result.modelUsed);
    return JSON.parse(result.json);
  } else {
    throw new Error(result.error);
  }
}

// ============================================================================
// EJEMPLO 6: ESPECIFICAR MODELO MANUALMENTE
// ============================================================================

/**
 * Si sabes exactamente qué modelo quieres usar
 */
export async function analizarConModeloEspecifico(
  imageFile: File,
  apiKey: string,
  modelName: string
) {
  console.log(`🎯 Usando modelo específico: ${modelName}`);
  
  const result = await GeminiService.processAndExtractJSON(
    {
      image: imageFile,
      prompt: "Analiza..."
    },
    {
      apiKey,
      model: modelName,  // ⭐ Especificar modelo manualmente
      useJsonMode: true
    }
  );

  return result;
}
