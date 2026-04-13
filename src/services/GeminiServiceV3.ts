/**
 * ============================================================================
 * 🚀 GEMINI SERVICE V3 - IMPLEMENTACIÓN FUNCIONAL CON @google/genai
 * ============================================================================
 * 
 * A. DIAGNÓSTICO DEL PROBLEMA
 * ----------------------------
 * ❌ PROBLEMA: Modelos obsoletos causando errores 404
 *    - gemini-1.5-pro → NO EXISTE
 *    - gemini-1.5-flash → NO EXISTE
 *    - gemini-pro-vision → DEPRECADO
 *    - gemini-2.0-flash-exp → EXPERIMENTAL, NO DISPONIBLE
 * 
 * ✅ SOLUCIÓN: Usar modelos actuales (2026)
 *    - gemini-3-flash-preview (PRINCIPAL)
 *    - gemini-2.5-flash (FALLBACK 1)
 *    - gemini-2.5-pro (FALLBACK 2)
 * 
 * 🔧 SDK CORRECTO: @google/genai (NO @google/generative-ai)
 * 
 * ============================================================================
 */

import { GoogleGenAI } from '@google/genai';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

/**
 * Configuración del servicio Gemini
 */
export interface GeminiConfig {
  apiKey: string;
  model?: string; // Opcional - usa gemini-3-flash-preview por defecto
  temperature?: number; // 0.0 - 2.0, default: 0.1
  maxOutputTokens?: number; // default: 8192
}

/**
 * Request para procesar imagen con prompt
 */
export interface GeminiImageRequest {
  image: File | Blob;
  prompt: string;
}

/**
 * Respuesta estructurada del servicio
 */
export interface GeminiResponse {
  success: boolean;
  data?: any; // JSON parseado
  rawText?: string; // Texto crudo antes de parsear
  modelUsed: string;
  error?: string;
  errorType?: 'MODEL_UNAVAILABLE' | 'INVALID_API_KEY' | 'QUOTA_EXCEEDED' | 'EMPTY_MODEL_RESPONSE' | 'INVALID_JSON' | 'NETWORK_ERROR' | 'UNKNOWN';
}

/**
 * Parte de contenido multimodal para Gemini
 */
interface GenerativePart {
  inlineData: {
    data: string; // Base64 SIN prefijo "data:image/png;base64,"
    mimeType: string;
  };
}

// ============================================================================
// CONFIGURACIÓN DE MODELOS
// ============================================================================

/**
 * Modelos actuales (2026) en orden de prioridad
 * 
 * DECISIÓN: Por qué este orden:
 * 1. gemini-3-flash-preview: Modelo más reciente según docs oficiales
 * 2. gemini-2.5-flash: Balance velocidad/calidad
 * 3. gemini-2.5-pro: Mejor calidad, más lento
 */
const CURRENT_MODELS = [
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-pro'
] as const;

const DEFAULT_MODEL = CURRENT_MODELS[0]; // gemini-3-flash-preview

// ============================================================================
// FUNCIÓN AUXILIAR: fileToBase64
// ============================================================================

/**
 * Convierte File/Blob a base64 PURO (sin prefijo data:...)
 * 
 * DECISIÓN: Por qué sin prefijo
 * - La API de Gemini requiere base64 puro en inlineData.data
 * - El prefijo "data:image/png;base64," causa errores
 * - El mimeType va en inlineData.mimeType por separado
 * 
 * @param file - File o Blob a convertir
 * @returns Promise con objeto GenerativePart listo para Gemini
 */
async function fileToBase64(file: File | Blob): Promise<GenerativePart> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        const result = reader.result as string;
        
        if (!result) {
          reject(new Error('FileReader devolvió resultado vacío'));
          return;
        }
        
        // CRÍTICO: Remover el prefijo "data:image/xxx;base64,"
        // La API de Gemini solo acepta el base64 puro
        const base64Match = result.match(/^data:([^;]+);base64,(.+)$/);
        
        if (!base64Match) {
          reject(new Error('Formato de Data URL inválido'));
          return;
        }
        
        const mimeType = base64Match[1]; // ej: "image/png"
        const base64Data = base64Match[2]; // Base64 puro
        
        // Validar que el base64 no esté vacío
        if (!base64Data || base64Data.length === 0) {
          reject(new Error('Base64 vacío después de extraer'));
          return;
        }
        
        console.log('✅ [fileToBase64] Conversión exitosa');
        console.log(`   MIME: ${mimeType}`);
        console.log(`   Size: ${(base64Data.length / 1024).toFixed(2)} KB`);
        
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
        
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

export class GeminiService {
  
  /**
   * Procesa una imagen con un prompt y devuelve JSON estructurado
   * 
   * FLUJO:
   * 1. Convertir imagen a base64
   * 2. Construir request multimodal
   * 3. Llamar a generateContent con config JSON
   * 4. Parsear y limpiar respuesta
   * 5. Manejar errores categorizados
   * 
   * @param request - Imagen y prompt
   * @param config - API key y configuración opcional
   * @returns Promise con respuesta estructurada
   */
  static async processImage(
    request: GeminiImageRequest,
    config: GeminiConfig
  ): Promise<GeminiResponse> {
    
    const {
      apiKey,
      model = DEFAULT_MODEL,
      temperature = 0.1, // Baja temperatura para extracción de datos precisa
      maxOutputTokens = 8192
    } = config;
    
    const { image, prompt } = request;
    
    console.log('\n🚀 [GeminiService] Iniciando procesamiento...');
    console.log(`📋 Modelo: ${model}`);
    console.log(`🌡️  Temperatura: ${temperature}`);
    console.log(`📄 Prompt: ${prompt.substring(0, 100)}...`);
    
    try {
      // ----------------------------------------------------------------
      // PASO 1: Convertir imagen a base64
      // ----------------------------------------------------------------
      console.log('\n🖼️  [PASO 1/4] Convirtiendo imagen a base64...');
      const imagePart = await fileToBase64(image);
      
      // ----------------------------------------------------------------
      // PASO 2: Inicializar cliente de Gemini
      // ----------------------------------------------------------------
      console.log('\n🔧 [PASO 2/4] Inicializando GoogleGenAI...');
      const ai = new GoogleGenAI({ apiKey });
      
      // ----------------------------------------------------------------
      // PASO 3: Enviar request
      // ----------------------------------------------------------------
      console.log('\n📤 [PASO 3/4] Enviando request a Gemini...');
      
      // DECISIÓN: Por qué esta estructura
      // - contents: array de partes (imagen + texto)
      // - config.responseMimeType: fuerza JSON limpio sin markdown
      // - Según docs oficiales de @google/genai 2026
      const result = await ai.models.generateContent({
        model: model,
        contents: [
          imagePart, // Imagen en inlineData
          {
            text: prompt // Prompt como texto separado
          }
        ],
        config: {
          temperature,
          maxOutputTokens,
          responseMimeType: 'application/json' // 🔥 CRÍTICO: JSON puro sin markdown
        }
      });
      
      const rawText = result.text;
      
      console.log('\n📥 [PASO 4/4] Respuesta recibida');
      console.log(`   Tamaño: ${rawText?.length || 0} caracteres`);
      
      // ----------------------------------------------------------------
      // PASO 4: Validar y parsear respuesta
      // ----------------------------------------------------------------
      
      if (!rawText || rawText.trim().length === 0) {
        console.error('❌ Respuesta vacía del modelo');
        return {
          success: false,
          modelUsed: model,
          error: 'El modelo devolvió una respuesta vacía',
          errorType: 'EMPTY_MODEL_RESPONSE'
        };
      }
      
      // DECISIÓN: Limpieza robusta de JSON
      // - Algunos modelos pueden envolver en ```json...``` aunque se pida application/json
      // - Necesitamos ser tolerantes y extraer el JSON de cualquier formato
      let cleanJson = rawText.trim();
      
      // Remover bloques de código markdown si existen
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
        console.log('🧹 JSON limpiado desde bloque markdown');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
        console.log('🧹 JSON limpiado desde bloque de código');
      }
      
      // Intentar parsear
      try {
        const parsedData = JSON.parse(cleanJson);
        
        console.log('✅ JSON parseado correctamente');
        console.log('\n📦 RESULTADO:');
        console.log(JSON.stringify(parsedData, null, 2).substring(0, 500));
        
        return {
          success: true,
          data: parsedData,
          rawText: rawText,
          modelUsed: model
        };
        
      } catch (parseError) {
        console.error('❌ Error al parsear JSON:', parseError);
        console.error('Texto recibido:', rawText);
        
        return {
          success: false,
          rawText: rawText,
          modelUsed: model,
          error: 'La respuesta del modelo no es JSON válido',
          errorType: 'INVALID_JSON'
        };
      }
      
    } catch (error: any) {
      // ----------------------------------------------------------------
      // MANEJO DE ERRORES CATEGORIZADO
      // ----------------------------------------------------------------
      
      console.error('\n❌ Error durante procesamiento:', error);
      
      const errorMessage = error?.message || String(error);
      const errorStatus = error?.status || error?.response?.status;
      
      // Error 404: Modelo no disponible
      if (errorStatus === 404 || errorMessage.includes('404') || errorMessage.includes('not found')) {
        console.error('🚫 Modelo no disponible:', model);
        return {
          success: false,
          modelUsed: model,
          error: `El modelo "${model}" no está disponible. Verifica que esté en la lista de modelos actuales.`,
          errorType: 'MODEL_UNAVAILABLE'
        };
      }
      
      // Error 401/403: API Key inválida
      if (errorStatus === 401 || errorStatus === 403 || errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')) {
        console.error('🔑 API Key inválida o sin permisos');
        return {
          success: false,
          modelUsed: model,
          error: 'API Key inválida o sin permisos. Verifica tu clave en Google AI Studio.',
          errorType: 'INVALID_API_KEY'
        };
      }
      
      // Error 429: Cuota excedida
      if (errorStatus === 429 || errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        console.error('⏱️  Cuota de API excedida');
        return {
          success: false,
          modelUsed: model,
          error: 'Cuota de API excedida. Espera unos minutos o actualiza tu plan.',
          errorType: 'QUOTA_EXCEEDED'
        };
      }
      
      // Error de red
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('NetworkError')) {
        console.error('🌐 Error de red');
        return {
          success: false,
          modelUsed: model,
          error: 'Error de red. Verifica tu conexión a internet.',
          errorType: 'NETWORK_ERROR'
        };
      }
      
      // Error desconocido
      console.error('❓ Error desconocido');
      return {
        success: false,
        modelUsed: model,
        error: `Error inesperado: ${errorMessage}`,
        errorType: 'UNKNOWN'
      };
    }
  }
  
  /**
   * Procesa imagen con fallback automático a modelos alternativos
   * 
   * DECISIÓN: Por qué fallback
   * - Disponibilidad de modelos varía por región/API key
   * - Mejor UX: intentar automáticamente con alternativas
   * - Solo intenta con modelos actuales (no obsoletos)
   * 
   * @param request - Imagen y prompt
   * @param config - API key y configuración
   * @returns Promise con respuesta del primer modelo que funcione
   */
  static async processImageWithFallback(
    request: GeminiImageRequest,
    config: GeminiConfig
  ): Promise<GeminiResponse> {
    
    const modelsToTry = config.model 
      ? [config.model, ...CURRENT_MODELS.filter(m => m !== config.model)]
      : [...CURRENT_MODELS];
    
    console.log('\n🔄 [Fallback] Modelos a intentar:', modelsToTry);
    
    for (const model of modelsToTry) {
      console.log(`\n🎯 Intentando con: ${model}`);
      
      const response = await this.processImage(request, { ...config, model });
      
      if (response.success) {
        console.log(`✅ Éxito con modelo: ${model}`);
        return response;
      }
      
      if (response.errorType !== 'MODEL_UNAVAILABLE') {
        // Si el error NO es por modelo no disponible, no intentar otros
        // (por ejemplo, si es API key inválida, no tiene sentido probar otros modelos)
        console.log(`⛔ Error no recuperable: ${response.errorType}`);
        return response;
      }
      
      console.log(`⚠️  Modelo ${model} no disponible, probando siguiente...`);
    }
    
    // Si llegamos aquí, ningún modelo funcionó
    return {
      success: false,
      modelUsed: modelsToTry[0],
      error: 'Ninguno de los modelos disponibles funcionó. Verifica tu API key y región.',
      errorType: 'MODEL_UNAVAILABLE'
    };
  }
}

// ============================================================================
// EXPORT DE FUNCIÓN AUXILIAR (para uso independiente)
// ============================================================================

export { fileToBase64 };
