/**
 * ============================================================================
 * 🎯 GEMINI IMAGE SERVICE - Procesamiento de Imágenes con IA
 * ============================================================================
 * 
 * A. DIAGNÓSTICO - POR QUÉ FALLABA LA IMPLEMENTACIÓN ANTERIOR
 * -------------------------------------------------------------
 * 
 * ❌ PROBLEMAS IDENTIFICADOS:
 * 
 * 1. MODELOS OBSOLETOS:
 *    - gemini-1.5-flash-latest → NO EXISTE en API actual
 *    - gemini-1.5-pro → DEPRECADO
 *    - gemini-pro-vision → LEGACY, no disponible
 *    Resultado: Error 404 "model not found"
 * 
 * 2. SDK INCORRECTO:
 *    - Usaba @google/generative-ai (antiguo)
 *    - Documentación actual usa @google/genai
 * 
 * 3. ESTRUCTURA DE CONTENTS INCORRECTA:
 *    - Algunos mixeaban texto e imagen en orden incorrecto
 *    - La guía oficial muestra: imagen PRIMERO, texto DESPUÉS
 * 
 * 4. FALTA DE RESPONSEMIMETYPE:
 *    - Sin "application/json", el modelo puede devolver markdown
 *    - Resultado: JSON envuelto en ```json...``` que falla al parsear
 * 
 * ✅ SOLUCIÓN IMPLEMENTADA:
 * 
 * 1. Modelo actual: gemini-3-flash-preview (según docs 2026)
 * 2. SDK correcto: @google/genai
 * 3. Estructura: contents = [imagen, texto] en ese orden
 * 4. Config: responseMimeType: "application/json" para JSON puro
 * 5. Parsing robusto con fallbacks
 * 6. Manejo de errores categorizado
 * 
 * ============================================================================
 */

import { GoogleGenAI } from '@google/genai';

// ============================================================================
// B. INTERFACES Y TIPOS
// ============================================================================

/**
 * Tipos de análisis soportados
 */
export type AnalysisType = 
  | 'stats'           // Estadísticas del personaje
  | 'glyphs'          // Glifos equipados
  | 'skills'          // Árbol de habilidades
  | 'aspects'         // Aspectos legendarios
  | 'currency'        // Monedas y recursos
  | 'compare_images'; // Comparación de 2+ imágenes (futuro)

/**
 * Configuración del servicio
 */
export interface GeminiImageConfig {
  apiKey: string;
  model?: string;              // Default: gemini-3-flash-preview
  temperature?: number;        // Default: 0.1 (preciso para extracción)
  maxOutputTokens?: number;    // Default: 8192
}

/**
 * Request para análisis de imagen
 */
export interface ImageAnalysisRequest {
  image: File | Blob;          // Imagen a analizar
  analysisType: AnalysisType;  // Tipo de análisis
  customPrompt?: string;       // Prompt personalizado (opcional)
}

/**
 * Request para comparación de múltiples imágenes (futuro)
 */
export interface MultiImageAnalysisRequest {
  images: (File | Blob)[];     // Múltiples imágenes
  analysisType: AnalysisType;
  customPrompt?: string;
}

/**
 * Respuesta del análisis
 */
export interface ImageAnalysisResponse<T = any> {
  success: boolean;
  data?: T;                    // Datos parseados (tipo genérico)
  rawText?: string;            // Texto crudo antes de parsear
  modelUsed: string;           // Modelo que procesó la imagen
  error?: string;
  errorType?: ErrorType;
}

/**
 * Tipos de error posibles
 */
export type ErrorType =
  | 'MODEL_UNAVAILABLE'        // 404 - Modelo no existe
  | 'INVALID_API_KEY'          // 401/403 - API key inválida
  | 'QUOTA_EXCEEDED'           // 429 - Cuota agotada
  | 'EMPTY_RESPONSE'           // Respuesta vacía del modelo
  | 'INVALID_JSON'             // JSON mal formado
  | 'NETWORK_ERROR'            // Error de red
  | 'UNKNOWN';                 // Error desconocido

/**
 * Parte de contenido multimodal (imagen)
 */
interface ImagePart {
  inlineData: {
    mimeType: string;          // ej: "image/png", "image/jpeg"
    data: string;              // Base64 SIN prefijo "data:image/..."
  };
}

// ============================================================================
// C. FUNCIÓN AUXILIAR: fileToBase64
// ============================================================================

/**
 * Convierte File o Blob a formato inlineData para Gemini
 * 
 * IMPORTANTE:
 * - La API requiere base64 PURO (sin prefijo "data:image/png;base64,")
 * - El mimeType va en campo separado
 * - Para imágenes pequeñas (<10MB) usa inlineData
 * - Para imágenes grandes o reutilizadas, considera Files API (comentado abajo)
 * 
 * @param file - File o Blob a convertir
 * @returns Promise con objeto ImagePart
 */
export async function fileToBase64(file: File | Blob): Promise<ImagePart> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        const result = reader.result as string;
        
        if (!result) {
          reject(new Error('FileReader devolvió resultado vacío'));
          return;
        }
        
        // Extraer mimeType y base64 del Data URL
        // Formato: "data:image/png;base64,iVBORw0KG..."
        const matches = result.match(/^data:([^;]+);base64,(.+)$/);
        
        if (!matches) {
          reject(new Error('Formato de Data URL inválido'));
          return;
        }
        
        const mimeType = matches[1];
        const base64Data = matches[2];
        
        if (!base64Data || base64Data.length === 0) {
          reject(new Error('Base64 vacío después de extraer'));
          return;
        }
        
        resolve({
          inlineData: {
            mimeType,
            data: base64Data
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

// NOTA: Para imágenes grandes (>10MB) o reutilizadas múltiples veces,
// considera usar Files API en lugar de inlineData:
//
// import { GoogleAIFileManager } from '@google/genai';
//
// const fileManager = new GoogleAIFileManager({ apiKey });
// const uploadResult = await fileManager.uploadFile(filePath, {
//   mimeType: 'image/png',
//   displayName: 'screenshot.png'
// });
//
// Luego en contents:
// { fileData: { fileUri: uploadResult.file.uri, mimeType: 'image/png' } }
//
// Ventajas:
// - Mejor para imágenes grandes (hasta 2GB)
// - Reutilizable en múltiples requests
// - No reenvía datos en cada llamada

// ============================================================================
// E. PROMPTS DINÁMICOS POR TIPO DE ANÁLISIS
// ============================================================================

/**
 * Genera el prompt apropiado según el tipo de análisis
 * 
 * DECISIÓN: Por qué prompts específicos
 * - Cada tipo de análisis requiere instrucciones diferentes
 * - La estructura JSON varía según qué estamos extrayendo
 * - Prompts específicos = mejor precisión
 * - Siempre pedimos JSON puro (sin markdown)
 * 
 * @param type - Tipo de análisis
 * @returns Prompt optimizado
 */
function getPromptForAnalysisType(type: AnalysisType): string {
  const prompts: Record<AnalysisType, string> = {
    
    // 1. ESTADÍSTICAS DEL PERSONAJE
    stats: `Analiza esta captura de pantalla de estadísticas de Diablo 4.

Extrae TODOS los valores numéricos visibles y devuelve JSON con esta estructura EXACTA:

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

REGLAS:
- Si un valor NO es visible, usa 0
- Convierte porcentajes sin símbolo: "50%" → 50
- Convierte números con comas: "1,234" → 1234
- SOLO JSON, sin texto adicional
- JSON válido (comillas dobles, sin comas finales)`,

    // 2. GLIFOS
    glyphs: `Analiza los glifos del tablero Paragon en esta imagen de Diablo 4.

Devuelve JSON:

{
  "glifos": [
    {
      "nombre": "",
      "nivel_actual": 0,
      "nivel_maximo": 21,
      "radio": 0,
      "bono": "",
      "tipo": ""
    }
  ]
}

REGLAS:
- Extrae nombre exacto de cada glifo
- nivel_actual: 0-21
- radio: rango de influencia
- bono: descripción breve del efecto
- tipo: "Raro", "Mágico", etc.
- SOLO JSON`,

    // 3. HABILIDADES
    skills: `Analiza el árbol de habilidades en esta imagen de Diablo 4.

Devuelve JSON:

{
  "clase": "",
  "habilidades": {
    "activas": [
      {
        "nombre": "",
        "rama": "",
        "puntos": 0,
        "nivel_maximo": 5,
        "tipo": ""
      }
    ],
    "pasivas": [
      {
        "nombre": "",
        "rama": "",
        "puntos": 0,
        "nivel_maximo": 3
      }
    ],
    "definitiva": {
      "nombre": "",
      "puntos": 0
    }
  }
}

REGLAS:
- Distingue activas de pasivas
- rama: "Basic", "Core", "Defensive", "Brawling", "Weapon Mastery", etc.
- tipo: "Básica", "Principal", "Definitiva" para activas
- Extrae puntos exactos (0-5 activas, 0-3 pasivas)
- SOLO JSON`,

    // 4. ASPECTOS LEGENDARIOS
    aspects: `Analiza los aspectos legendarios equipados en esta imagen de Diablo 4.

Devuelve JSON:

{
  "aspectos": [
    {
      "nombre": "",
      "nombre_corto": "",
      "efecto": "",
      "nivel": "",
      "ranura": "",
      "categoria": ""
    }
  ]
}

REGLAS:
- nombre: Nombre completo
- nombre_corto: Sin "Aspecto de"
- efecto: Descripción con valores
- nivel: formato "X/Y" ej: "3/21"
- ranura: "Arma", "Armadura", "Amuleto", "Anillo 1", "Anillo 2", "Casco", "Pecho", etc.
- categoria: "Ofensivo", "Defensivo", "Movilidad", "Recurso", "Utilidad"
- SOLO JSON`,

    // 5. MONEDAS Y RECURSOS
    currency: `Analiza los recursos y monedas visibles en esta imagen de Diablo 4.

Devuelve JSON:

{
  "monedas": {
    "oro": 0,
    "fragmentos_obols": 0,
    "polvo_murmurante": 0,
    "esencia_abisal": 0
  },
  "materiales": {
    "hierro": 0,
    "piel": 0,
    "madera": 0,
    "piedra_superior": 0
  }
}

REGLAS:
- Extrae todos los valores numéricos visibles
- Convierte notación abreviada: "1.5k" → 1500, "2.3M" → 2300000
- Si no es visible, usa 0
- SOLO JSON`,

    // 6. COMPARACIÓN DE IMÁGENES (futuro - múltiples imágenes)
    compare_images: `Compara las estadísticas entre estas dos capturas de pantalla de Diablo 4.

Devuelve JSON:

{
  "comparacion": {
    "imagen1": {
      "nivel": 0,
      "clase": "",
      "vida": 0,
      "dano": 0
    },
    "imagen2": {
      "nivel": 0,
      "clase": "",
      "vida": 0,
      "dano": 0
    },
    "diferencias": {
      "nivel_ganado": 0,
      "vida_ganada": 0,
      "dano_ganado": 0,
      "mejoras_principales": []
    }
  }
}

REGLAS:
- Identifica qué imagen es "antes" y cuál "después"
- Calcula diferencias numéricas
- mejoras_principales: array de strings describiendo cambios clave
- SOLO JSON`
  };

  return prompts[type];
}

// ============================================================================
// F. HELPER PARA EXTRAER JSON SEGURO
// ============================================================================

/**
 * Extrae y parsea JSON de forma robusta desde la respuesta del modelo
 * 
 * CASOS MANEJADOS:
 * 1. JSON puro (ideal con responseMimeType: "application/json")
 * 2. JSON envuelto en ```json...```
 * 3. JSON envuelto en ```...```
 * 4. JSON con texto adicional before/after
 * 
 * @param text - Texto crudo de la respuesta
 * @returns Objeto parseado o lanza error
 */
export function extractJSON(text: string): any {
  let cleanJson = text.trim();
  
  // Caso 1: Remover bloques ```json...```
  if (cleanJson.includes('```json')) {
    const match = cleanJson.match(/```json\s*([\s\S]*?)\s*```/);
    if (match) {
      cleanJson = match[1].trim();
    }
  }
  // Caso 2: Remover bloques genéricos ```...```
  else if (cleanJson.includes('```')) {
    const match = cleanJson.match(/```\s*([\s\S]*?)\s*```/);
    if (match) {
      cleanJson = match[1].trim();
    }
  }
  
  // Caso 3: Buscar JSON por llaves { o [
  const startBrace = cleanJson.indexOf('{');
  const startBracket = cleanJson.indexOf('[');
  
  if (startBrace === -1 && startBracket === -1) {
    throw new Error('No se encontró JSON en la respuesta');
  }
  
  const start = startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)
    ? startBrace
    : startBracket;
  
  const isObject = cleanJson[start] === '{';
  const endChar = isObject ? '}' : ']';
  const end = cleanJson.lastIndexOf(endChar);
  
  if (end === -1 || end < start) {
    throw new Error('JSON incompleto o mal formado');
  }
  
  cleanJson = cleanJson.substring(start, end + 1);
  
  // Parsear
  try {
    const parsed = JSON.parse(cleanJson);
    return parsed;
  } catch (parseError) {
    console.error('   ❌ Error al parsear JSON:', parseError);
    console.error('   Texto limpio:', cleanJson.substring(0, 200));
    throw new Error(`JSON inválido: ${parseError}`);
  }
}

// ============================================================================
// G. SERVICIO PRINCIPAL CON MANEJO DE ERRORES
// ============================================================================

/**
 * Modelos disponibles en orden de prioridad
 */
const AVAILABLE_MODELS = [
  'gemini-3-flash-preview',    // Principal según docs 2026
  'gemini-2.5-flash',          // Fallback 1
  'gemini-2.5-pro'             // Fallback 2
] as const;

const DEFAULT_MODEL = AVAILABLE_MODELS[0];

/**
 * Servicio para análisis de imágenes con Gemini
 */
export class GeminiImageService {
  
  /**
   * Analiza una imagen con el modelo de Gemini
   * 
   * FLUJO SEGÚN DOCUMENTACIÓN OFICIAL:
   * 1. Convertir imagen a base64
   * 2. Construir contents con imagen PRIMERO, texto DESPUÉS
   * 3. Configurar responseMimeType: "application/json"
   * 4. Llamar a generateContent
   * 5. Extraer y parsear JSON
   * 6. Manejar errores categorizados
   * 
   * @param request - Imagen y tipo de análisis
   * @param config - API key y configuración
   * @returns Promise con resultado del análisis
   */
  static async analyzeImage<T = any>(
    request: ImageAnalysisRequest,
    config: GeminiImageConfig
  ): Promise<ImageAnalysisResponse<T>> {
    
    const {
      apiKey,
      model = DEFAULT_MODEL,
      temperature = 0.1,        // Baja temperatura = más preciso
      maxOutputTokens = 8192
    } = config;
    
    const { image, analysisType, customPrompt } = request;
    
    try {
      // ----------------------------------------------------------------
      // PASO 1: Convertir imagen a base64
      // ----------------------------------------------------------------
      const imagePart = await fileToBase64(image);
      
      // ----------------------------------------------------------------
      // PASO 2: Obtener prompt según tipo de análisis
      // ----------------------------------------------------------------
      const prompt = customPrompt || getPromptForAnalysisType(analysisType);
      
      // ----------------------------------------------------------------
      // PASO 3: Inicializar cliente y enviar request
      // ----------------------------------------------------------------
      const ai = new GoogleGenAI({ apiKey });
      
      // ESTRUCTURA CORRECTA según documentación:
      // contents = [imagen, texto] en ese orden
      const result = await ai.models.generateContent({
        model: model,
        contents: [
          imagePart,           // ⭐ IMAGEN PRIMERO
          {
            text: prompt       // ⭐ TEXTO DESPUÉS
          }
        ],
        config: {
          temperature,
          maxOutputTokens,
          responseMimeType: 'application/json'  // ⭐ JSON PURO
        }
      });
      
      const rawText = result.text;
      
      // ----------------------------------------------------------------
      // PASO 4: Validar y parsear respuesta
      // ----------------------------------------------------------------
      
      if (!rawText || rawText.trim().length === 0) {
        console.error('❌ Respuesta vacía del modelo');
        return {
          success: false,
          modelUsed: model,
          error: 'El modelo devolvió una respuesta vacía',
          errorType: 'EMPTY_RESPONSE'
        };
      }
      
      // Extraer y parsear JSON
      try {
        const data = extractJSON(rawText);
        
        return {
          success: true,
          data: data as T,
          rawText,
          modelUsed: model
        };
        
      } catch (parseError: any) {
        console.error('❌ Error al parsear JSON:', parseError);
        return {
          success: false,
          rawText,
          modelUsed: model,
          error: `JSON inválido: ${parseError.message}`,
          errorType: 'INVALID_JSON'
        };
      }
      
    } catch (error: any) {
      // ----------------------------------------------------------------
      // MANEJO DE ERRORES CATEGORIZADO
      // ----------------------------------------------------------------
      
      console.error('\n❌ Error durante análisis:', error);
      
      const errorMessage = error?.message || String(error);
      const errorStatus = error?.status || error?.response?.status;
      
      // Error 404: Modelo no disponible
      if (errorStatus === 404 || errorMessage.includes('404') || errorMessage.includes('not found')) {
        return {
          success: false,
          modelUsed: model,
          error: `Modelo "${model}" no disponible. Verifica la lista de modelos actuales.`,
          errorType: 'MODEL_UNAVAILABLE'
        };
      }
      
      // Error 401/403: API Key inválida
      if (errorStatus === 401 || errorStatus === 403 || 
          errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')) {
        return {
          success: false,
          modelUsed: model,
          error: 'API Key inválida o sin permisos. Verifica en Google AI Studio.',
          errorType: 'INVALID_API_KEY'
        };
      }
      
      // Error 429: Cuota excedida
      if (errorStatus === 429 || errorMessage.includes('429') || 
          errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        return {
          success: false,
          modelUsed: model,
          error: 'Cuota de API excedida. Espera unos minutos.',
          errorType: 'QUOTA_EXCEEDED'
        };
      }
      
      // Error de red
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('NetworkError')) {
        return {
          success: false,
          modelUsed: model,
          error: 'Error de red. Verifica tu conexión.',
          errorType: 'NETWORK_ERROR'
        };
      }
      
      // Error desconocido
      return {
        success: false,
        modelUsed: model,
        error: `Error inesperado: ${errorMessage}`,
        errorType: 'UNKNOWN'
      };
    }
  }
  
  /**
   * Analiza imagen con fallback automático a modelos alternativos
   * 
   * @param request - Imagen y tipo de análisis
   * @param config - API key y configuración
   * @returns Promise con resultado del primer modelo que funcione
   */
  static async analyzeImageWithFallback<T = any>(
    request: ImageAnalysisRequest,
    config: GeminiImageConfig
  ): Promise<ImageAnalysisResponse<T>> {
    
    const modelsToTry = config.model 
      ? [config.model, ...AVAILABLE_MODELS.filter(m => m !== config.model)]
      : [...AVAILABLE_MODELS];
    
    for (const model of modelsToTry) {
      const response = await this.analyzeImage<T>(request, { ...config, model });
      
      if (response.success) {
        return response;
      }
      
      if (response.errorType !== 'MODEL_UNAVAILABLE') {
        return response;
      }
    }
    
    return {
      success: false,
      modelUsed: modelsToTry[0],
      error: 'Ningún modelo disponible funcionó.',
      errorType: 'MODEL_UNAVAILABLE'
    };
  }
  
  /**
   * Analiza múltiples imágenes (preparado para futuro)
   * 
   * NOTA: Para comparación de imágenes o análisis multi-imagen
   * La estructura de contents soporta múltiples imágenes:
   * contents = [imagen1, imagen2, texto]
   * 
   * @param request - Múltiples imágenes y tipo de análisis
   * @param config - API key y configuración
   * @returns Promise con resultado
   */
  static async analyzeMultipleImages<T = any>(
    request: MultiImageAnalysisRequest,
    config: GeminiImageConfig
  ): Promise<ImageAnalysisResponse<T>> {
    
    const { images, analysisType, customPrompt } = request;
    const { apiKey, model = DEFAULT_MODEL, temperature = 0.1, maxOutputTokens = 8192 } = config;
    
    try {
      // Convertir todas las imágenes a base64
      const imageParts = await Promise.all(images.map(img => fileToBase64(img)));
      
      const prompt = customPrompt || getPromptForAnalysisType(analysisType);
      
      const ai = new GoogleGenAI({ apiKey });
      
      // ESTRUCTURA: [imagen1, imagen2, ..., texto]
      const result = await ai.models.generateContent({
        model,
        contents: [
          ...imageParts,       // ⭐ TODAS LAS IMÁGENES PRIMERO
          { text: prompt }     // ⭐ TEXTO AL FINAL
        ],
        config: {
          temperature,
          maxOutputTokens,
          responseMimeType: 'application/json'
        }
      });
      
      const rawText = result.text;
      
      if (!rawText || rawText.trim().length === 0) {
        return {
          success: false,
          modelUsed: model,
          error: 'Respuesta vacía',
          errorType: 'EMPTY_RESPONSE'
        };
      }
      
      const data = extractJSON(rawText);
      
      return {
        success: true,
        data: data as T,
        rawText,
        modelUsed: model
      };
      
    } catch (error: any) {
      return {
        success: false,
        modelUsed: model,
        error: error.message,
        errorType: 'UNKNOWN'
      };
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default GeminiImageService;
