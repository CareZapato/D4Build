/**
 * ============================================================================
 * 📖 EJEMPLOS DE USO - GEMINI SERVICE
 * ============================================================================
 * 
 * Este archivo contiene ejemplos prácticos de cómo usar GeminiService
 * en tu aplicación React para analizar imágenes de Diablo 4.
 */

import { GeminiService } from './GeminiService';

// ============================================================================
// EJEMPLO 1: USO BÁSICO CON FALLBACK AUTOMÁTICO
// ============================================================================

/**
 * Analizar una imagen con el modelo por defecto
 * El servicio automáticamente intentará con múltiples modelos si uno falla
 */
export async function ejemplo1_UsosBasico(imageBlob: Blob) {
  const result = await GeminiService.processAndExtractJSON(
    {
      image: imageBlob,
      prompt: "Analiza esta imagen de Diablo 4 y extrae las estadísticas en formato JSON",
      temperature: 0.2  // Respuestas más deterministas
    },
    {
      apiKey: 'TU_API_KEY_AQUI'
    }
  );

  if (result.success) {
    const data = JSON.parse(result.json);
    console.log('Datos extraídos:', data);
    console.log('Modelo usado:', result.modelUsed);
  } else {
    console.error('Error:', result.error);
  }
}

// ============================================================================
// EJEMPLO 2: MODO JSON PURO (RECOMENDADO)
// ============================================================================

/**
 * Usa responseMimeType: "application/json" para obtener JSON limpio
 * SIN markdown, SIN bloques de código, SOLO JSON válido
 */
export async function ejemplo2_ModoJsonPuro(imageBlob: Blob) {
  const result = await GeminiService.processAndExtractJSON(
    {
      image: imageBlob,
      prompt: `Analiza esta imagen de estadísticas de Diablo 4.
      Extrae TODOS los valores numéricos y devuelve un JSON con esta estructura:
      {
        "atributosPrincipales": { "fuerza": 0, "destreza": 0, "inteligencia": 0, "voluntad": 0 },
        "defensivo": { "vida": 0, "armadura": 0, "resistencias": {} },
        "ofensivo": { "danio": 0, "velocidadAtaque": 0, "critico": 0 }
      }`,
      temperature: 0.1  // Muy baja para máxima precisión
    },
    {
      apiKey: 'TU_API_KEY_AQUI',
      useJsonMode: true  // ⭐ ACTIVA MODO JSON PURO
    }
  );

  if (result.success) {
    try {
      const stats = JSON.parse(result.json);
      console.log('Stats parseadas:', stats);
      // Ya puedes usar directamente: stats.atributosPrincipales.fuerza
    } catch (error) {
      console.error('Error al parsear JSON:', error);
      console.log('JSON recibido:', result.json);
    }
  }
}

// ============================================================================
// EJEMPLO 3: ESPECIFICAR UN MODELO EN PARTICULAR
// ============================================================================

/**
 * Si sabes que un modelo específico funciona bien para tu caso,
 * puedes especificarlo explícitamente. Si falla, igual habrá fallback.
 */
export async function ejemplo3_ModeloEspecifico(imageBlob: Blob) {
  const result = await GeminiService.processAndExtractJSON(
    {
      image: imageBlob,
      prompt: "Analiza esta imagen y devuelve JSON con las habilidades equipadas"
    },
    {
      apiKey: 'TU_API_KEY_AQUI',
      model: 'gemini-1.5-pro-latest',  // Usar el más potente
      useJsonMode: true
    }
  );

  return result;
}

// ============================================================================
// EJEMPLO 4: LISTAR MODELOS DISPONIBLES (DEBUGGING)
// ============================================================================

/**
 * Útil para depurar errores de "modelo no encontrado"
 * Te muestra exactamente qué modelos tienes acceso
 */
export async function ejemplo4_ListarModelos() {
  try {
    const models = await GeminiService.listAvailableModels('TU_API_KEY_AQUI');
    
    console.log('=== MODELOS DISPONIBLES ===');
    models.forEach((model, index) => {
      console.log(`${index + 1}. ${model}`);
    });
    
    return models;
  } catch (error) {
    console.error('Error al listar modelos:', error);
    return [];
  }
}

// ============================================================================
// EJEMPLO 5: COMPONENTE REACT COMPLETO
// ============================================================================

import React, { useState } from 'react';

/**
 * Componente React que permite subir una imagen y analizarla con Gemini
 */
export function GeminiImageAnalyzer() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // ⚠️ ADVERTENCIA: La API key NO debe estar hardcodeada en producción
  // Usa variables de entorno o un backend proxy
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'TU_API_KEY';

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError('');
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      setError('Por favor selecciona una imagen primero');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Prompt específico para Diablo 4
      const prompt = `Analiza esta captura de pantalla de Diablo 4.
      
      Extrae TODA la información visible y devuelve un JSON con esta estructura exacta:
      
      {
        "tipo": "estadisticas" | "habilidades" | "glifos" | "aspectos",
        "datos": {
          // El contenido depende del tipo de imagen
        }
      }
      
      Si es una pantalla de estadísticas, extrae todos los números.
      Si son habilidades, extrae nombres y niveles.
      Si son glifos, extrae nombres y puntos gastados.
      
      IMPORTANTE: Solo devuelve JSON válido, sin explicaciones adicionales.`;

      const response = await GeminiService.processAndExtractJSON(
        {
          image: selectedImage,
          prompt: prompt,
          temperature: 0.1,  // Máxima precisión
          maxOutputTokens: 8192
        },
        {
          apiKey: GEMINI_API_KEY,
          useJsonMode: true  // ⭐ Modo JSON puro
        }
      );

      if (response.success) {
        const parsedData = JSON.parse(response.json);
        setResult(parsedData);
        console.log('✅ Análisis exitoso con modelo:', response.modelUsed);
      } else {
        setError(response.error || 'Error desconocido');
      }
    } catch (err: any) {
      setError(err.message || 'Error al analizar la imagen');
      console.error('❌ Error en análisis:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🔮 Analizador de Imágenes Diablo 4 con Gemini</h2>

      {/* Input de archivo */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: 'block', marginBottom: '10px' }}
        />
        {preview && (
          <img
            src={preview}
            alt="Preview"
            style={{ maxWidth: '100%', maxHeight: '400px', border: '2px solid #ccc' }}
          />
        )}
      </div>

      {/* Botón de análisis */}
      <button
        onClick={analyzeImage}
        disabled={!selectedImage || loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '🔄 Analizando con Gemini...' : '🚀 Analizar Imagen'}
      </button>

      {/* Resultados */}
      {error && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#ffebee', borderRadius: '5px' }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '5px' }}>
          <h3>✅ Resultado del Análisis:</h3>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {/* Advertencia de seguridad */}
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3e0', borderRadius: '5px' }}>
        <strong>⚠️ ADVERTENCIA DE SEGURIDAD:</strong>
        <p>
          Estás usando la API key directamente desde el frontend. Esto es aceptable para desarrollo,
          pero en PRODUCCIÓN debes crear un backend que maneje las llamadas a Gemini.
        </p>
        <p>
          <strong>Riesgo:</strong> Cualquiera puede inspeccionar tu código y robar la API key.
        </p>
        <p>
          <strong>Solución:</strong> Crea un endpoint en tu backend (Node.js, Python, etc.) que
          reciba la imagen y haga la llamada a Gemini. Tu frontend solo llama a tu backend.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// EJEMPLO 6: PROMPT OPTIMIZADO PARA DIABLO 4 - ESTADÍSTICAS
// ============================================================================

export const PROMPT_ESTADISTICAS_D4 = `Analiza esta captura de pantalla de estadísticas de Diablo 4.

IMPORTANTE: Extrae TODOS los valores numéricos visibles.

Devuelve ÚNICAMENTE un JSON con esta estructura exacta:

{
  "nivel": 0,
  "nivel_paragon": 0,
  "atributosPrincipales": {
    "fuerza": 0,
    "destreza": 0,
    "inteligencia": 0,
    "voluntad": 0
  },
  "personaje": {
    "danioArma": 0,
    "aguante": 0
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
    "reduccion_dano": 0,
    "reduccion_dano_distancia": 0,
    "reduccion_dano_cuerpo": 0
  },
  "ofensivo": {
    "velocidad_ataque": 0,
    "dano_critico": 0,
    "probabilidad_critico": 0,
    "dano_vulnerable": 0,
    "dano_core": 0,
    "dano_todas_stats": 0
  },
  "utilidad": {
    "velocidad_movimiento": 0,
    "rango_recogida": 0,
    "esquirlas_alma": 0
  }
}

IMPORTANTE: 
- Usa 0 si el valor no es visible
- No agregues texto explicativo, SOLO el JSON
- Respeta exactamente la estructura mostrada
- Los números deben ser números, no strings`;

// ============================================================================
// EJEMPLO 7: PROMPT OPTIMIZADO PARA DIABLO 4 - HABILIDADES
// ============================================================================

export const PROMPT_HABILIDADES_D4 = `Analiza esta captura de pantalla del árbol de habilidades de Diablo 4.

Extrae TODAS las habilidades visibles con sus puntos gastados.

Devuelve ÚNICAMENTE un JSON con esta estructura:

{
  "clase": "Barbaro" | "Hechicero" | "Picaro" | "Necromante" | "Druida" | "Espiritu",
  "habilidades": {
    "activas": [
      {
        "nombre": "Nombre de la habilidad",
        "puntos": 0,
        "rango": 0,
        "rangoMaximo": 5,
        "descripcion": "Descripción si es visible"
      }
    ],
    "pasivas": [
      {
        "nombre": "Nombre de la pasiva",
        "puntos": 0,
        "rango": 0,
        "rangoMaximo": 3,
        "descripcion": "Descripción si es visible"
      }
    ]
  }
}

IMPORTANTE:
- Distingue entre habilidades activas y pasivas
- Extrae el número de puntos gastados en cada una
- Si no ves un valor, usa 0
- SOLO devuelve el JSON, sin explicaciones`;

// ============================================================================
// EJEMPLO 8: MANEJO DE ERRORES COMPLETO
// ============================================================================

export async function ejemplo8_ManejoErroresCompleto(imageBlob: Blob) {
  try {
    const result = await GeminiService.processAndExtractJSON(
      {
        image: imageBlob,
        prompt: PROMPT_ESTADISTICAS_D4,
        temperature: 0.1
      },
      {
        apiKey: 'TU_API_KEY',
        useJsonMode: true
      }
    );

    if (!result.success) {
      // Manejo específico según el tipo de error
      if (result.error?.includes('API_KEY_INVALID')) {
        console.error('❌ Tu API key no es válida. Consigue una en: https://aistudio.google.com/app/apikey');
        return { error: 'API_KEY_INVALID' };
      }

      if (result.error?.includes('QUOTA_EXCEEDED')) {
        console.error('❌ Has alcanzado el límite de tu cuota gratuita');
        return { error: 'QUOTA_EXCEEDED' };
      }

      if (result.error?.includes('MODEL_UNAVAILABLE')) {
        console.error('❌ Ningún modelo disponible. Verifica tu conexión o región');
        return { error: 'MODEL_UNAVAILABLE' };
      }

      if (result.error?.includes('JSON_PARSE_ERROR')) {
        console.error('❌ El modelo devolvió texto que no es JSON válido');
        console.log('Texto recibido:', result.rawText);
        // Podrías intentar manualmente extraer el JSON aquí
        return { error: 'JSON_PARSE_ERROR', rawText: result.rawText };
      }

      if (result.error?.includes('EMPTY_RESPONSE')) {
        console.error('❌ El modelo no pudo analizar la imagen. Prueba con una imagen más clara');
        return { error: 'EMPTY_RESPONSE' };
      }

      // Error genérico
      console.error('❌ Error desconocido:', result.error);
      return { error: result.error };
    }

    // ✅ Éxito
    const data = JSON.parse(result.json);
    console.log('✅ Análisis exitoso con modelo:', result.modelUsed);
    return { success: true, data, model: result.modelUsed };

  } catch (error: any) {
    console.error('💥 Excepción no manejada:', error);
    return { error: error.message };
  }
}

// ============================================================================
// EJEMPLO 9: BUENAS PRÁCTICAS - BACKEND PROXY (RECOMENDADO)
// ============================================================================

/**
 * 🛡️ ARQUITECTURA RECOMENDADA PARA PRODUCCIÓN
 * --------------------------------------------
 * 
 * FRONTEND (React):
 * -----------------
 * export async function analizarImagenSeguro(imageFile: File) {
 *   const formData = new FormData();
 *   formData.append('image', imageFile);
 *   formData.append('promptType', 'estadisticas'); // o 'habilidades', 'glifos', etc.
 * 
 *   const response = await fetch('https://tu-backend.com/api/gemini/analyze', {
 *     method: 'POST',
 *     body: formData,
 *     headers: {
 *       'Authorization': `Bearer ${userToken}` // Token de tu usuario autenticado
 *     }
 *   });
 * 
 *   return await response.json();
 * }
 * 
 * 
 * BACKEND (Node.js/Express example):
 * ----------------------------------
 * import express from 'express';
 * import { GeminiService } from './GeminiService';
 * 
 * const app = express();
 * 
 * app.post('/api/gemini/analyze', authenticate, async (req, res) => {
 *   // La API key está en variables de entorno del servidor
 *   const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
 *   
 *   const imageBuffer = req.files.image.data;
 *   const imageBlob = new Blob([imageBuffer]);
 *   
 *   const result = await GeminiService.processAndExtractJSON({
 *     image: imageBlob,
 *     prompt: getPromptForType(req.body.promptType)
 *   }, {
 *     apiKey: GEMINI_API_KEY,
 *     useJsonMode: true
 *   });
 *   
 *   res.json(result);
 * });
 * 
 * 
 * BENEFICIOS:
 * -----------
 * ✅ API key segura en el servidor
 * ✅ Control de uso y límites por usuario
 * ✅ Logging centralizado de requests
 * ✅ Caché de resultados si es necesario
 * ✅ Validación de permisos antes de llamar a Gemini
 */

// ============================================================================
// EJEMPLO 10: TESTING Y DEBUGGING
// ============================================================================

/**
 * Función de test para verificar que todo funciona
 */
export async function testGeminiIntegration() {
  console.log('🧪 Iniciando tests de integración con Gemini...\n');

  // Test 1: Listar modelos disponibles
  console.log('📋 Test 1: Listar modelos disponibles');
  try {
    const models = await GeminiService.listAvailableModels('TU_API_KEY');
    console.log('✅ Modelos encontrados:', models.length);
    console.log('   Modelos:', models.join(', '));
  } catch (error: any) {
    console.error('❌ Error al listar modelos:', error.message);
  }

  console.log('\n---\n');

  // Test 2: Convertir imagen ficticia
  console.log('🖼️ Test 2: Conversión de imagen a base64');
  try {
    // Crear un blob de prueba (1x1 pixel PNG transparente)
    const testBlob = new Blob(
      [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])],
      { type: 'image/png' }
    );
    
    const part = await GeminiService.fileToBase64Part(testBlob);
    console.log('✅ Conversión exitosa');
    console.log('   Base64 length:', part.inlineData.data.length);
    console.log('   MIME type:', part.inlineData.mimeType);
  } catch (error: any) {
    console.error('❌ Error en conversión:', error.message);
  }

  console.log('\n---\n');
  console.log('🏁 Tests completados');
}

// ============================================================================
// CONFIGURACIÓN RECOMENDADA SEGÚN CASO DE USO
// ============================================================================

export const CONFIGURACIONES_RECOMENDADAS = {
  // Para extracción precisa de datos numéricos (estadísticas)
  precision_maxima: {
    temperature: 0.05,  // Casi determinista
    topK: 10,
    topP: 0.9,
    useJsonMode: true
  },

  // Para análisis general de imágenes
  balanced: {
    temperature: 0.2,
    topK: 40,
    topP: 0.95,
    useJsonMode: true
  },

  // Para descripciones creativas (no recomendado para datos estructurados)
  creativo: {
    temperature: 1.0,
    topK: 64,
    topP: 0.95,
    useJsonMode: false
  }
};
