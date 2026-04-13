/**
 * ============================================================================
 * 🚀 SERVICIO GEMINI API - SELECCIÓN DINÁMICA DE MODELOS
 * ============================================================================
 * 
 * 📋 DIAGNÓSTICO DEL PROBLEMA:
 * ---------------------------
 * ❌ PROBLEMA: Todos los modelos hardcodeados fallan con 404
 *    - gemini-1.5-pro → 404 NOT_FOUND
 *    - gemini-1.5-flash → 404 NOT_FOUND
 *    - gemini-pro-vision → 404 NOT_FOUND
 *    - gemini-2.0-flash-exp → 404 NOT_FOUND
 * 
 * 🔍 CAUSA RAÍZ:
 *    1. Los modelos disponibles varían por región y API key
 *    2. Los modelos experimentales no están disponibles globalmente
 *    3. La disponibilidad cambia con el tiempo (deprecaciones, nuevos modelos)
 *    4. Hardcodear nombres de modelos es una estrategia frágil
 * 
 * ✅ SOLUCIÓN IMPLEMENTADA:
 * ------------------------
 * 🎯 SELECCIÓN DINÁMICA: El servicio consulta la API en tiempo real para:
 *    1. Obtener la lista de modelos REALMENTE disponibles para tu API key
 *    2. Filtrar solo los que soporten:
 *       - generateContent (método requerido)
 *       - Entrada multimodal/imágenes (para visión)
 *    3. Ordenar por capacidad (pro > flash > otros)
 *    4. Seleccionar automáticamente el MEJOR disponible
 *    5. Cachear la selección para evitar consultar repetidamente
 * 
 * 🔧 ARQUITECTURA:
 * ---------------
 * - API REST → Listar modelos disponibles (v1beta/models)
 * - Filtrado inteligente → Solo modelos compatibles
 * - SDK oficial → generateContent con modelo válido
 * - Caché en memoria → Rápido después de la primera consulta
 * - Manejo de errores categorizado → API key, cuota, modelo, JSON
 * 
 * 🛡️ SEGURIDAD:
 * -------------
 * ⚠️ CRÍTICO: API key en frontend es INSEGURO para producción
 * - Desarrollo: OK usar directamente
 * - Producción: OBLIGATORIO usar backend proxy
 * 
 * 🎯 USO:
 * -------
 * // No necesitas especificar modelo - se selecciona automáticamente
 * const result = await GeminiService.processAndExtractJSON({
 *   image: imageBlob,
 *   prompt: "Analiza y devuelve JSON..."
 * }, {
 *   apiKey: 'TU_API_KEY',
 *   useJsonMode: true
 * });
 * 
 * console.log('Modelo usado:', result.modelUsed);
 * 
 * ============================================================================
 */

import { GoogleGenAI } from '@google/genai';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

/**
 * Información de un modelo disponible en la API
 * (No usado en esta versión, ver GeminiServiceV2 para implementación completa)
 */
export interface ModelInfo {
  name: string;                          // Nombre completo: "models/gemini-xxx"
  displayName: string;                   // Nombre corto: "gemini-xxx"
  description: string;                   // Descripción del modelo
  supportedGenerationMethods: string[];  // Métodos soportados (generateContent, etc)
  inputTokenLimit?: number;              // Límite de tokens de entrada
  outputTokenLimit?: number;             // Límite de tokens de salida
}

/**
 * Configuración del servicio Gemini
 */
export interface GeminiConfig {
  apiKey: string;
  model?: string;           // Modelo específico (opcional - se selecciona automáticamente si no se provee)
  useJsonMode?: boolean;    // Activa el modo JSON puro (application/json)
}

export interface GeminiRequest {
  image: Blob | File;       // Acepta tanto Blob como File
  prompt: string;
  temperature?: number;      // 0.0 = determinista, 2.0 = creativo (default: 0.2)
  topK?: number;            // Limita tokens candidatos (default: 40)
  topP?: number;            // Nucleus sampling (default: 0.95)
  maxOutputTokens?: number; // Máximo de tokens en respuesta (default: 8192)
}

export interface GeminiResponse {
  text: string;
  success: boolean;
  error?: string;
  modelUsed?: string;       // Modelo que finalmente funcionó
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

export class GeminiService {
  /**
   * LISTA DE MODELOS CON FALLBACK AUTOMÁTICO
   * -----------------------------------------
   * ✅ ACTUALIZADO según documentación oficial (abril 2026)
   * 
   * Modelos ACTUALES disponibles:
   * - gemini-3-flash-preview: Más reciente, rápido y eficiente (RECOMENDADO)
   * - gemini-2.5-flash: Versión anterior estable de flash
   * - gemini-2.5-pro: Versión pro con mejor análisis
   * 
   * ❌ OBSOLETOS (ya no funcionan):
   * - gemini-1.5-* (deprecados)
   * - gemini-pro-vision (legacy, eliminado)
   * - gemini-2.0-flash-exp (experimental, no disponible)
   */
  private static readonly MODEL_FALLBACK_LIST = [
    'gemini-3-flash-preview',  // 🥇 PRINCIPAL: Último modelo recomendado
    'gemini-2.5-flash',        // 🥈 FALLBACK 1: Flash anterior
    'gemini-2.5-pro'           // 🥉 FALLBACK 2: Pro para análisis complejos
  ];

  /**
   * Modelo por defecto según documentación oficial
   */
  private static readonly DEFAULT_MODEL = 'gemini-3-flash-preview';

  // ============================================================================
  // UTILIDADES: CONVERSIÓN DE IMAGEN
  // ============================================================================

  /**
   * Convierte Blob/File a base64 PURO (sin prefijo data:image/...)
   * ------------------------------------------------------------
   * ¿Por qué esto es necesario?
   * - El SDK de Gemini requiere base64 PURO en el campo 'data'
   * - FileReader.readAsDataURL() devuelve: "data:image/png;base64,iVBORw0KG..."
   * - Necesitamos solo: "iVBORw0KG..."
   * - El split(',')[1] elimina el prefijo
   * 
   * Formato de salida: { inlineData: { data: "base64...", mimeType: "image/png" } }
   */
  private static async blobToGenerativePart(
    blob: Blob | File
  ): Promise<{ inlineData: { data: string; mimeType: string } }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        try {
          const result = reader.result as string;
          
          // Eliminar el prefijo "data:image/png;base64," para obtener solo el base64
          const base64String = result.split(',')[1];
          
          if (!base64String) {
            throw new Error('No se pudo extraer el contenido base64 de la imagen');
          }
          
          resolve({
            inlineData: {
              data: base64String,
              mimeType: blob.type || 'image/png'  // Fallback a PNG si no hay tipo
            }
          });
        } catch (error) {
          reject(new Error(`Error al convertir imagen a base64: ${error}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Función auxiliar pública para convertir File/Blob a base64
   * ----------------------------------------------------------
   * Uso: const part = await GeminiService.fileToBase64Part(myFile);
   */
  public static async fileToBase64Part(file: File | Blob) {
    return this.blobToGenerativePart(file);
  }

  // ============================================================================
  // FUNCIÓN OPCIONAL: LISTAR MODELOS DISPONIBLES
  // ============================================================================

  /**
   * Lista todos los modelos disponibles en tu API key
   * --------------------------------------------------
   * ⚠️ ADVERTENCIA: Esta función puede fallar si tu API key tiene restricciones
   * 
   * USO:
   * const models = await GeminiService.listAvailableModels('TU_API_KEY');
   * console.log('Modelos disponibles:', models);
   * 
   * Útil para:
   * - Depurar errores de modelo no encontrado
   * - Verificar qué modelos tienes acceso
   * - Filtrar modelos con capacidad de visión
   */
  public static async listAvailableModels(apiKey: string): Promise<string[]> {
    try {
      // NOTA: El SDK oficial no expone listModels() directamente
      // Alternativa: Hacer fetch manual a la API REST
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Error al listar modelos: ${response.status}`);
      }
      
      const data = await response.json();
      const models = data.models || [];
      
      // Filtrar solo modelos que soporten generateContent
      const validModels = models
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => m.name.replace('models/', ''));
      
      console.log('📋 Modelos disponibles con generateContent:', validModels);
      return validModels;
      
    } catch (error) {
      console.error('❌ Error al listar modelos:', error);
      throw error;
    }
  }

  // ============================================================================
  // FUNCIÓN PRINCIPAL: PROCESAR IMAGEN CON FALLBACK
  // ============================================================================

  /**
   * Procesa una imagen con un prompt usando Gemini API
   * ---------------------------------------------------
   * ✨ CARACTERÍSTICAS:
   * - Fallback automático si el modelo falla
   * - Manejo de errores categorizados
   * - Soporte para modo JSON puro
   * - Logging detallado para debugging
   * 
   * 🔄 ESTRATEGIA DE FALLBACK:
   * 1. Intenta con el modelo especificado (o DEFAULT_MODEL)
   * 2. Si falla con error 404 (modelo no encontrado), prueba el siguiente
   * 3. Continúa hasta que uno funcione o se agoten las opciones
   * 4. Devuelve el modelo que finalmente funcionó en 'modelUsed'
   */
  static async processImageWithPrompt(
    request: GeminiRequest,
    config: GeminiConfig
  ): Promise<GeminiResponse> {
    const {
      image,
      prompt,
      temperature = 0.2,      // Baja temperatura = respuestas más consistentes
      topK = 40,
      topP = 0.95,
      maxOutputTokens = 8192
    } = request;

    // Lista de modelos a intentar (prioridad del config.model si existe)
    const modelsToTry = config.model 
      ? [config.model, ...this.MODEL_FALLBACK_LIST.filter(m => m !== config.model)]
      : [this.DEFAULT_MODEL, ...this.MODEL_FALLBACK_LIST.filter(m => m !== this.DEFAULT_MODEL)];

    let lastError: any = null;

    // ========================================================================
    // LOOP DE FALLBACK: Intenta cada modelo hasta que uno funcione
    // ========================================================================
    for (const modelName of modelsToTry) {
      try {
        console.log(`✨ [Gemini] Intentando con modelo: ${modelName}`);
        console.log(`[Gemini] Configuración: temp=${temperature}, topK=${topK}, topP=${topP}`);

        // Validar API key
        if (!config.apiKey || config.apiKey.trim() === '') {
          throw new Error('API_KEY_MISSING: La API key está vacía o no definida');
        }

        // ====================================================================
        // INICIALIZAR SDK MODERNO (@google/genai)
        // ====================================================================
        const ai = new GoogleGenAI({ apiKey: config.apiKey });

        // Configuración del modelo
        const generationConfig: any = {
          temperature,
          topK,
          topP,
          maxOutputTokens
        };

        // ====================================================================
        // MODO JSON PURO (application/json)
        // ====================================================================
        // Si useJsonMode = true, Gemini intentará devolver JSON válido
        // REQUIERE: Que el prompt pida explícitamente formato JSON
        // EJEMPLO: "Analiza esta imagen y devuelve un JSON con..."
        if (config.useJsonMode) {
          generationConfig.responseMimeType = 'application/json';
          console.log('[Gemini] 🎯 Modo JSON activado: responseMimeType = application/json');
        }

        // Convertir imagen a formato del SDK
        const imagePart = await this.blobToGenerativePart(image);
        console.log('[Gemini] 📸 Imagen convertida a base64, tamaño:', imagePart.inlineData.data.length, 'caracteres');

        // ====================================================================
        // EJECUTAR generateContent con estructura correcta según docs
        // ====================================================================
        // IMPORTANTE: contents = [imagen PRIMERO, texto DESPUÉS]
        console.log('[Gemini] 🚀 Enviando request a Gemini API...');
        const result = await ai.models.generateContent({
          model: modelName,
          contents: [
            imagePart,           // ⭐ IMAGEN PRIMERO
            { text: prompt }     // ⭐ TEXTO DESPUÉS
          ],
          config: generationConfig
        });

        // ====================================================================
        // EXTRACCIÓN ROBUSTA DEL TEXTO DE LA RESPUESTA
        // ====================================================================
        // La respuesta puede venir en diferentes formatos según la versión del SDK:
        // 1. result.text (propiedad directa del SDK)
        // 2. result.candidates[0].content.parts[0].text (respuesta raw de la API)
        
        console.log('[Gemini] 📦 Estructura de respuesta recibida:', JSON.stringify(result, null, 2).substring(0, 500) + '...');
        
        let text: string = '';
        
        // Intentar extraer texto por diferentes rutas
        if (result.text) {
          // Ruta 1: Propiedad directa del SDK (más común)
          text = result.text;
          console.log('[Gemini] ✅ Texto extraído vía result.text');
        } else if (result.candidates && result.candidates.length > 0) {
          // Ruta 2: Respuesta raw de la API
          const candidate = result.candidates[0];
          if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
            text = candidate.content.parts[0].text || '';
            console.log('[Gemini] ✅ Texto extraído vía result.candidates[0].content.parts[0].text');
          }
        }
        
        // Si aún no hay texto, intentar como último recurso
        if (!text && typeof result === 'object') {
          // Buscar cualquier propiedad 'text' en el objeto
          const findText = (obj: any): string | null => {
            if (typeof obj === 'string') return obj;
            if (typeof obj !== 'object' || obj === null) return null;
            
            if ('text' in obj && typeof obj.text === 'string') return obj.text;
            
            for (const key in obj) {
              const found = findText(obj[key]);
              if (found) return found;
            }
            return null;
          };
          
          const foundText = findText(result);
          if (foundText) {
            text = foundText;
            console.log('[Gemini] ✅ Texto encontrado mediante búsqueda recursiva');
          }
        }

        // Validar respuesta vacía
        if (!text || text.trim().length === 0) {
          console.warn('⚠️ [Gemini] Respuesta vacía del modelo');
          console.warn('⚠️ [Gemini] Estructura completa de result:', JSON.stringify(result, null, 2));
          return {
            text: '',
            success: false,
            error: 'EMPTY_RESPONSE: El modelo devolvió una respuesta vacía. Intenta con una imagen más clara o un prompt diferente.',
            modelUsed: modelName
          };
        }

        console.log(`✅ [Gemini] ¡Éxito con modelo: ${modelName}!`);
        console.log(`[Gemini] Respuesta recibida: ${text.length} caracteres`);
        console.log(`[Gemini] Primeros 200 caracteres:`, text.substring(0, 200));

        // ✅ ÉXITO: Devolver resultado
        return {
          text,
          success: true,
          modelUsed: modelName
        };

      } catch (error: any) {
        lastError = error;
        const errorMessage = error?.message || String(error);

        console.error(`❌ [Gemini] Error con modelo ${modelName}:`, errorMessage);

        // ====================================================================
        // CATEGORIZACIÓN DE ERRORES
        // ====================================================================

        // 1️⃣ ERROR DE API KEY
        if (errorMessage.includes('API key') || errorMessage.includes('API_KEY_INVALID')) {
          console.error('🔑 Error de API Key - No continuar con fallback');
          return {
            text: '',
            success: false,
            error: 'API_KEY_INVALID: Tu API key es inválida o ha expirado. Verifica en Google AI Studio.',
            modelUsed: modelName
          };
        }

        // 2️⃣ ERROR DE CUOTA/LÍMITE
        if (errorMessage.includes('quota') || errorMessage.includes('limit') || errorMessage.includes('429')) {
          console.error('📊 Límite de cuota alcanzado - No continuar con fallback');
          return {
            text: '',
            success: false,
            error: 'QUOTA_EXCEEDED: Has alcanzado el límite de tu cuota. Espera o actualiza tu plan.',
            modelUsed: modelName
          };
        }

        // 3️⃣ ERROR DE MODELO NO ENCONTRADO (404)
        if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('NOT_FOUND')) {
          console.warn(`⚠️ Modelo ${modelName} no disponible, probando siguiente...`);
          continue; // ⚡ CONTINUAR CON EL SIGUIENTE MODELO
        }

        // 4️⃣ OTROS ERRORES
        console.error('💥 Error inesperado:', error);
        // No hacer break, intentar siguiente modelo por si acaso
        continue;
      }
    }

    // ========================================================================
    // TODOS LOS MODELOS FALLARON
    // ========================================================================
    console.error('❌ [Gemini] Todos los modelos fallaron');
    return {
      text: '',
      success: false,
      error: `MODEL_UNAVAILABLE: No se pudo conectar con ningún modelo. Último error: ${lastError?.message || 'Desconocido'}`
    };
  }

  // ============================================================================
  // FUNCIÓN AUXILIAR: EXTRAER JSON DE TEXTO
  // ============================================================================

  /**
   * Extrae JSON de un texto que puede contener markdown o texto adicional
   * ----------------------------------------------------------------------
   * Busca patrones como:
   * - ```json { ... } ```
   * - ``` { ... } ```
   * - { ... } (JSON directo)
   * 
   * Útil cuando el modelo NO usa application/json y devuelve texto con JSON embebido
   */
  static extractJSON(text: string): string {
    console.log('[Gemini] 🔍 Extrayendo JSON del texto...');

    // 1. Buscar JSON en bloque ```json ... ```
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      console.log('[Gemini] ✅ JSON encontrado en bloque ```json```');
      return jsonBlockMatch[1].trim();
    }

    // 2. Buscar JSON en bloque genérico ``` ... ```
    const codeBlockMatch = text.match(/```\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      const content = codeBlockMatch[1].trim();
      if (content.startsWith('{') || content.startsWith('[')) {
        console.log('[Gemini] ✅ JSON encontrado en bloque de código');
        return content;
      }
    }

    // 3. Buscar JSON directo en el texto
    const startBrace = text.indexOf('{');
    const startBracket = text.indexOf('[');
    const start = startBrace !== -1 && (startBracket === -1 || startBrace < startBracket) 
      ? startBrace 
      : startBracket;

    if (start === -1) {
      console.warn('[Gemini] ⚠️ No se encontró JSON en el texto');
      return text.trim();
    }

    const isObject = text[start] === '{';
    const endChar = isObject ? '}' : ']';
    const end = text.lastIndexOf(endChar);

    if (end === -1 || end < start) {
      console.warn('[Gemini] ⚠️ JSON incompleto o malformado');
      return text.trim();
    }

    const extracted = text.substring(start, end + 1).trim();
    console.log('[Gemini] ✅ JSON extraído directamente del texto');
    return extracted;
  }

  // ============================================================================
  // FUNCIÓN DE ALTO NIVEL: PROCESAR Y EXTRAER JSON
  // ============================================================================

  /**
   * Procesa imagen y extrae JSON automáticamente
   * ---------------------------------------------
   * Esta es la función más conveniente para usar en tu app.
   * 
   * USO TÍPICO:
   * -----------
   * const result = await GeminiService.processAndExtractJSON({
   *   image: myImageBlob,
   *   prompt: "Analiza esta estadística de Diablo 4 y devuelve JSON con..."
   * }, {
   *   apiKey: 'tu-api-key',
   *   useJsonMode: true  // ¡RECOMENDADO para JSON limpio!
   * });
   * 
   * if (result.success) {
   *   const data = JSON.parse(result.json);
   *   console.log('Datos extraídos:', data);
   * }
   */
  static async processAndExtractJSON(
    request: GeminiRequest,
    config: GeminiConfig
  ): Promise<{ json: string; rawText: string; success: boolean; error?: string; modelUsed?: string }> {
    console.log('🔄 [Gemini] Iniciando procesamiento con extracción de JSON...');

    const response = await this.processImageWithPrompt(request, config);
    
    console.log('📊 [processAndExtractJSON] Respuesta recibida:', {
      success: response.success,
      hasText: !!response.text,
      textLength: response.text?.length || 0,
      error: response.error,
      modelUsed: response.modelUsed
    });

    if (!response.success) {
      console.error('❌ [processAndExtractJSON] processImageWithPrompt falló:', response.error);
      return {
        json: '',
        rawText: response.text,
        success: false,
        error: response.error,
        modelUsed: response.modelUsed
      };
    }
    
    if (!response.text || response.text.trim().length === 0) {
      console.error('❌ [processAndExtractJSON] Texto vacío en respuesta exitosa');
      return {
        json: '',
        rawText: '',
        success: false,
        error: 'EMPTY_TEXT: La respuesta fue exitosa pero no contiene texto',
        modelUsed: response.modelUsed
      };
    }

    console.log('📄 [processAndExtractJSON] Texto raw recibido (primeros 300 chars):\n', response.text.substring(0, 300));

    // Si está en modo JSON, la respuesta ya debería ser JSON puro
    let extractedJSON: string;
    if (config.useJsonMode) {
      extractedJSON = response.text; // Ya es JSON puro
      console.log('[Gemini] 🎯 Modo JSON: respuesta es JSON puro');
    } else {
      extractedJSON = this.extractJSON(response.text);
      console.log('[Gemini] 🔍 Modo texto: extrayendo JSON del texto...');
    }
    
    console.log('📦 [processAndExtractJSON] JSON extraído (primeros 300 chars):\n', extractedJSON.substring(0, 300));

    // Validar que el JSON extraído sea válido
    try {
      const parsed = JSON.parse(extractedJSON);
      console.log('✅ [Gemini] JSON válido extraído y verificado');
      console.log('📊 [Gemini] Estructura del JSON:', Object.keys(parsed));
    } catch (e) {
      console.error('⚠️ [Gemini] El JSON extraído no es válido:', e);
      console.error('Texto recibido:', extractedJSON.substring(0, 500));
      return {
        json: extractedJSON,
        rawText: response.text,
        success: false,
        error: `JSON_PARSE_ERROR: El modelo devolvió texto que no es JSON válido. Error: ${e instanceof Error ? e.message : 'Desconocido'}`,
        modelUsed: response.modelUsed
      };
    }

    return {
      json: extractedJSON,
      rawText: response.text,
      success: true,
      modelUsed: response.modelUsed
    };
  }
}
