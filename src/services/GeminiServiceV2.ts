/**
 * ============================================================================
 * 🚀 GEMINI SERVICE V3 - SDK OFICIAL @google/genai
 * ============================================================================
 * 
 * 📋 A. CAMBIO CRÍTICO
 * ---------------------
 * ✅ SDK CORRECTO: @google/genai (NO @google/generative-ai)
 * ✅ API CORRECTA: GoogleGenAI con models.list() y models.generateContent()
 * ✅ MODELO DE EJEMPLO: gemini-3-flash-preview (según docs actuales)
 * 
 * 📋 B. DIAGNÓSTICO DEL PROBLEMA
 * ------------------------------
 * ❌ SÍNTOMA: Todos los modelos hardcodeados fallan con 404
 *    - gemini-1.5-pro → NOT_FOUND
 *    - gemini-1.5-flash → NOT_FOUND  
 *    - gemini-pro-vision → NOT_FOUND
 *    - gemini-2.0-flash-exp → NOT_FOUND
 * 
 * 🔍 CAUSA RAÍZ:
 *    1. Usaba SDK incorrecto (@google/generative-ai)
 *    2. Modelos hardcodeados no existen o están deprecados
 *    3. Disponibilidad varía por región/API key
 *    4. Documentación actual usa @google/genai con otros modelos
 * 
 * ✅ SOLUCIÓN:
 *    1. Migrar a @google/genai (SDK oficial actual)
 *    2. Usar ai.models.list() para descubrimiento dinámico
 *    3. Probar con gemini-3-flash-preview primero
 *    4. Selección automática del mejor modelo disponible
 * 
 * ============================================================================
 */

import { GoogleGenAI } from '@google/genai';

// ============================================================================
// B. INTERFACES Y TIPOS
// ============================================================================

/**
 * Información de un modelo retornado por la API de Google
 */
interface ModelInfo {
  name: string;                          // "models/gemini-xxx"
  version: string;                       // Versión del modelo
  displayName: string;                   // Nombre legible
  description: string;                   // Descripción
  inputTokenLimit: number;               // Límite entrada
  outputTokenLimit: number;              // Límite salida
  supportedGenerationMethods: string[];  // ['generateContent', ...]
  temperature?: number;
  topP?: number;
  topK?: number;
}

/**
 * Configuración del servicio
 */
export interface GeminiConfig {
  apiKey: string;
  model?: string;           // Opcional - se selecciona automáticamente
  useJsonMode?: boolean;    // JSON puro en respuesta
  forceRefreshModels?: boolean; // Forzar reconsulta de modelos
}

/**
 * Request para procesar imagen
 */
export interface GeminiRequest {
  image: Blob | File;
  prompt: string;
  temperature?: number;      // 0.0-2.0 (default: 0.1 para precisión)
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
}

/**
 * Respuesta del servicio
 */
export interface GeminiResponse {
  text: string;
  success: boolean;
  error?: string;
  errorType?: 'API_KEY' | 'QUOTA' | 'MODEL' | 'JSON' | 'EMPTY' | 'NETWORK' | 'UNKNOWN';
  modelUsed?: string;
}

// ============================================================================
// C. SERVICIO PRINCIPAL
// ============================================================================

export class GeminiService {
  // Caché de modelos disponibles (evita consultar en cada request)
  private static cachedModels: ModelInfo[] | null = null;
  private static cacheTimestamp: number = 0;
  private static readonly CACHE_TTL = 3600000; // 1 hora en ms

  /**
   * Prioridad de modelos (actualizada según docs de Google 2026)
   * Modelos de referencia actuales según image understanding guide
   */
  private static readonly MODEL_PRIORITY = [
    /^gemini-3-flash-preview$/i,    // ⭐ Modelo de ejemplo oficial actual
    /^gemini-.*-flash-preview$/i,   // Flash preview (más reciente)
    /^gemini-.*-pro$/i,              // Pro estable
    /^gemini-.*-flash$/i,            // Flash estable
    /^gemini/i                       // Cualquier otro gemini
  ];

  // ============================================================================
  // D. GESTIÓN DINÁMICA DE MODELOS
  // ============================================================================

  /**
   * 🔍 PASO 1: Consultar modelos disponibles usando SDK oficial
   * -----------------------------------------------------------
   * NUEVA API: @google/genai provee ai.models.list() nativo
   * 
   * Por qué este approach:
   * - La documentación actual usa ai.models.list()
   * - No necesitamos REST API manual
   * - Más simple y mantenible
   * 
   * NOTA: models.list() devuelve un Pager<Model>, no un array
   */
  private static async fetchAvailableModels(apiKey: string): Promise<ModelInfo[]> {
    console.log('🔄 [Gemini] Consultando modelos disponibles con SDK oficial...');

    try {
      // Inicializar cliente con API key
      const ai = new GoogleGenAI({ apiKey });
      
      console.log('📡 [Gemini] Llamando a ai.models.list()...');
      
      // Usar el método nativo del SDK (devuelve un Pager)
      const modelsPager = await ai.models.list();
      
      // Convertir Pager a array iterando
      const modelsArray: any[] = [];
      for await (const model of modelsPager) {
        modelsArray.push(model);
      }
      
      if (modelsArray.length === 0) {
        console.warn('⚠️ No se encontraron modelos');
        return [];
      }

      console.log(`✅ [Gemini] ${modelsArray.length} modelos encontrados en total`);
      
      // Convertir al formato interno
      return modelsArray.map((m: any) => ({
        name: m.name || '',
        version: m.version || '',
        displayName: m.displayName || m.name?.replace('models/', '') || '',
        description: m.description || '',
        inputTokenLimit: m.inputTokenLimit || 0,
        outputTokenLimit: m.outputTokenLimit || 0,
        supportedGenerationMethods: m.supportedGenerationMethods || [],
        temperature: m.temperature,
        topP: m.topP,
        topK: m.topK
      }));

    } catch (error: any) {
      console.error('❌ [Gemini] Error al consultar modelos:', error);
      
      // Errores comunes
      if (error?.message?.includes('API key') || error?.status === 401 || error?.status === 403) {
        throw new Error('API_KEY_INVALID: Tu API key es inválida o no tiene permisos');
      }
      
      throw error;
    }
  }

  /**
   * 🎯 PASO 2: Filtrar modelos compatibles con nuestro caso de uso
   * --------------------------------------------------------------
   * Criterios de filtrado:
   * 1. DEBE soportar generateContent (método requerido)
   * 2. DEBE aceptar imágenes (multimodal)
   * 3. Nombre debe contener "gemini" (excluir otros modelos)
   * 
   * Por qué es importante filtrar:
   * - No todos los modelos soportan imágenes (algunos solo texto)
   * - Algunos modelos solo soportan chat, no generateContent
   * - Queremos evitar modelos deprecated o no relacionados
   */
  private static filterCompatibleModels(models: ModelInfo[]): ModelInfo[] {
    console.log('🔍 [Gemini] Filtrando modelos compatibles...');

    const compatible = models.filter(model => {
      const displayName = model.displayName.toLowerCase();
      
      // 1. Debe soportar generateContent
      const supportsGenerate = model.supportedGenerationMethods.includes('generateContent');
      
      // 2. Debe ser un modelo Gemini (excluir PaLM, etc)
      const isGemini = displayName.includes('gemini');
      
      // 3. Excluir modelos de solo texto (queremos multimodal)
      // Los modelos con "vision" o sin "-text" suelen soportar imágenes
      const isNotTextOnly = !displayName.includes('text-only');

      const isCompatible = supportsGenerate && isGemini && isNotTextOnly;

      if (isCompatible) {
        console.log(`  ✅ ${model.displayName} - Compatible`);
      } else {
        console.log(`  ❌ ${model.displayName} - Incompatible (generate:${supportsGenerate}, gemini:${isGemini}, notTextOnly:${isNotTextOnly})`);
      }

      return isCompatible;
    });

    console.log(`📊 [Gemini] ${compatible.length} modelos compatibles de ${models.length} totales`);
    return compatible;
  }

  /**
   * 🏆 PASO 3: Seleccionar el MEJOR modelo disponible
   * -------------------------------------------------
   * Estrategia de priorización:
   * 1. Buscar por patrones en orden de prioridad (pro > flash > otros)
   * 2. Preferir versiones "latest" sobre estables
   * 3. Si ninguno coincide, usar el primero disponible
   * 
   * Por qué este orden:
   * - "pro": Mejor calidad para análisis complejos
   * - "flash": Más rápido, bueno para producción
   * - "latest": Últimas mejoras y capacidades
   */
  private static selectBestModel(models: ModelInfo[]): ModelInfo | null {
    if (models.length === 0) {
      console.error('❌ [Gemini] No hay modelos compatibles disponibles');
      return null;
    }

    console.log('🏆 [Gemini] Seleccionando mejor modelo...');

    // Intentar con cada patrón de prioridad
    for (const pattern of this.MODEL_PRIORITY) {
      const match = models.find(m => pattern.test(m.displayName));
      if (match) {
        console.log(`✅ [Gemini] Modelo seleccionado: ${match.displayName} (patrón: ${pattern})`);
        return match;
      }
    }

    // Fallback: usar el primero disponible
    const fallback = models[0];
    console.log(`⚠️ [Gemini] Usando fallback: ${fallback.displayName}`);
    return fallback;
  }

  /**
   * 📦 FUNCIÓN PÚBLICA: Obtener modelo recomendado
   * ----------------------------------------------
   * Esta función combina los 3 pasos anteriores:
   * 1. Consultar → 2. Filtrar → 3. Seleccionar
   * 
   * Incluye caché para evitar consultar en cada request (TTL: 1 hora)
   */
  public static async getRecommendedModel(apiKey: string, forceRefresh = false): Promise<string | null> {
    try {
      // Verificar caché
      const now = Date.now();
      const cacheValid = this.cachedModels && (now - this.cacheTimestamp < this.CACHE_TTL);

      if (cacheValid && !forceRefresh) {
        console.log('💾 [Gemini] Usando modelos en caché');
      } else {
        console.log('🔄 [Gemini] Consultando modelos (caché expirado o forzado)');
        this.cachedModels = await this.fetchAvailableModels(apiKey);
        this.cacheTimestamp = now;
      }

      if (!this.cachedModels || this.cachedModels.length === 0) {
        throw new Error('No se pudieron obtener modelos de la API');
      }

      // Filtrar compatibles
      const compatible = this.filterCompatibleModels(this.cachedModels);

      if (compatible.length === 0) {
        throw new Error('No hay modelos compatibles disponibles para tu API key o región');
      }

      // Seleccionar el mejor
      const best = this.selectBestModel(compatible);

      if (!best) {
        throw new Error('No se pudo seleccionar un modelo recomendado');
      }

      return best.displayName;

    } catch (error: any) {
      console.error('❌ [Gemini] Error al obtener modelo recomendado:', error);
      return null;
    }
  }

  /**
   * 📋 FUNCIÓN PÚBLICA: Listar todos los modelos compatibles
   * --------------------------------------------------------
   * Útil para debugging o para que el usuario elija manualmente
   */
  public static async listCompatibleModels(apiKey: string): Promise<string[]> {
    try {
      const all = await this.fetchAvailableModels(apiKey);
      const compatible = this.filterCompatibleModels(all);
      return compatible.map(m => m.displayName);
    } catch (error) {
      console.error('❌ Error al listar modelos compatibles:', error);
      return [];
    }
  }

  // ============================================================================
  // E. UTILIDADES: CONVERSIÓN DE IMAGEN
  // ============================================================================

  /**
   * 🖼️ Convertir File/Blob a base64 PURO
   * ------------------------------------
   * Por qué es crítico:
   * - Gemini API requiere base64 SIN el prefijo "data:image/png;base64,"
   * - FileReader.readAsDataURL() incluye ese prefijo
   * - Debemos extraer solo la parte base64 pura
   * 
   * Formato de salida:
   * {
   *   inlineData: {
   *     data: "iVBORw0KGgoAAAA...",  ← Base64 PURO
   *     mimeType: "image/png"
   *   }
   * }
   */
  public static async fileToBase64(file: Blob | File): Promise<{ inlineData: { data: string; mimeType: string } }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        try {
          const result = reader.result as string;

          // Extraer solo la parte base64 (después de la coma)
          const base64 = result.split(',')[1];

          if (!base64) {
            throw new Error('No se pudo extraer base64 de la imagen');
          }

          resolve({
            inlineData: {
              data: base64,
              mimeType: file.type || 'image/png'
            }
          });

        } catch (error) {
          reject(new Error(`Error al convertir imagen: ${error}`));
        }
      };

      reader.onerror = () => reject(new Error('Error al leer archivo'));
      reader.readAsDataURL(file);
    });
  }

  // ============================================================================
  // F. PROCESAMIENTO DE IMAGEN CON IA
  // ============================================================================

  /**
   * 🎯 FUNCIÓN PRINCIPAL: Procesar imagen con prompt
   * ------------------------------------------------
   * Flujo completo:
   * 1. Obtener modelo recomendado (o usar el especificado)
   * 2. Convertir imagen a base64
   * 3. Inicializar SDK con modelo válido
   * 4. Enviar request a Gemini
   * 5. Procesar respuesta
   * 6. Categorizar errores si falla
   */
  static async processImageWithPrompt(
    request: GeminiRequest,
    config: GeminiConfig
  ): Promise<GeminiResponse> {
    const {
      image,
      prompt,
      temperature = 0.1,  // Baja temperatura para precisión en extracción de datos
      topK = 40,
      topP = 0.95,
      maxOutputTokens = 8192
    } = request;

    try {
      console.log('🚀 [Gemini] Iniciando procesamiento de imagen...');

      // PASO 1: Determinar qué modelo usar
      let modelName: string;

      if (config.model) {
        // Usuario especificó un modelo manualmente
        modelName = config.model;
        console.log(`📌 [Gemini] Usando modelo especificado: ${modelName}`);
      } else {
        // Selección automática
        console.log('🤖 [Gemini] Seleccionando modelo automáticamente...');
        const recommended = await this.getRecommendedModel(config.apiKey, config.forceRefreshModels);

        if (!recommended) {
          return {
            text: '',
            success: false,
            error: 'No se pudo determinar un modelo compatible. Verifica tu API key y región.',
            errorType: 'MODEL'
          };
        }

        modelName = recommended;
        console.log(`✅ [Gemini] Modelo seleccionado automáticamente: ${modelName}`);
      }

      // PASO 2: Convertir imagen a base64
      console.log('🖼️ [Gemini] Convirtiendo imagen a base64...');
      const imagePart = await this.fileToBase64(image);
      console.log(`  ✓ Base64 generado: ${imagePart.inlineData.data.length} caracteres`);
      console.log(`  ✓ MIME type: ${imagePart.inlineData.mimeType}`);

      // PASO 3: Inicializar SDK con @google/genai
      console.log('🔧 [Gemini] Inicializando GoogleGenAI...');
      const ai = new GoogleGenAI({ apiKey: config.apiKey });

      // Configuración de generación
      const generationConfig: any = {
        temperature,
        topK,
        topP,
        maxOutputTokens
      };

      // Si está activado JSON mode, forzar JSON en la respuesta
      if (config.useJsonMode) {
        generationConfig.responseMimeType = 'application/json';
        console.log('🎯 [Gemini] Modo JSON activado (responseMimeType: application/json)');
      }

      // PASO 4: Enviar request usando la NUEVA API
      console.log('📤 [Gemini] Enviando request con ai.models.generateContent()...');
      console.log(`  • Modelo: ${modelName}`);
      console.log(`  • Prompt length: ${prompt.length} caracteres`);
      console.log(`  • Temperature: ${temperature}`);
      console.log(`  • Max tokens: ${maxOutputTokens}`);

      // Nueva estructura según docs de @google/genai
      const result = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            inlineData: {
              mimeType: imagePart.inlineData.mimeType,
              data: imagePart.inlineData.data,
            },
          },
          {
            text: prompt,
          },
        ],
        config: generationConfig
      });

      const text = result.text;

      console.log('📥 [Gemini] Respuesta recibida');
      
      // Validar que text existe
      if (!text) {
        console.warn('⚠️ [Gemini] Respuesta sin texto del modelo');
        return {
          text: '',
          success: false,
          error: 'El modelo devolvió una respuesta sin texto.',
          errorType: 'EMPTY',
          modelUsed: modelName
        };
      }
      
      console.log(`  • Length: ${text.length} caracteres`);

      // PASO 5: Validar respuesta
      if (!text || text.trim().length === 0) {
        console.warn('⚠️ [Gemini] Respuesta vacía del modelo');
        return {
          text: '',
          success: false,
          error: 'El modelo devolvió una respuesta vacía. La imagen podría ser ilegible o el prompt poco claro.',
          errorType: 'EMPTY',
          modelUsed: modelName
        };
      }

      // ÉXITO
      console.log(`✅ [Gemini] Procesamiento exitoso con modelo: ${modelName}`);
      return {
        text,
        success: true,
        modelUsed: modelName
      };

    } catch (error: any) {
      // PASO 6: Categorizar error
      console.error('❌ [Gemini] Error durante procesamiento:', error);

      const errorMessage = error?.message || String(error);

      // Error de API key
      if (errorMessage.includes('API key') || errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('401') || errorMessage.includes('403')) {
        return {
          text: '',
          success: false,
          error: 'API Key inválida o sin permisos. Verifica tu configuración en Google AI Studio.',
          errorType: 'API_KEY'
        };
      }

      // Error de cuota
      if (errorMessage.includes('quota') || errorMessage.includes('limit') || errorMessage.includes('429')) {
        return {
          text: '',
          success: false,
          error: 'Cuota de API agotada. Espera o actualiza tu plan en Google AI Studio.',
          errorType: 'QUOTA'
        };
      }

      // Error de modelo
      if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('NOT_FOUND') || errorMessage.includes('model')) {
        return {
          text: '',
          success: false,
          error: `Modelo no disponible: ${errorMessage}. Intenta con forceRefreshModels: true para actualizar la lista.`,
          errorType: 'MODEL'
        };
      }

      // Error de red
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('NetworkError')) {
        return {
          text: '',
          success: false,
          error: 'Error de red. Verifica tu conexión a internet.',
          errorType: 'NETWORK'
        };
      }

      // Error genérico
      return {
        text: '',
        success: false,
        error: `Error inesperado: ${errorMessage}`,
        errorType: 'UNKNOWN'
      };
    }
  }

  // ============================================================================
  // G. PROCESAMIENTO CON EXTRACCIÓN DE JSON
  // ============================================================================

  /**
   * 🔧 Extraer JSON de texto que puede contener markdown
   * ----------------------------------------------------
   * Por qué es necesario:
   * - Si useJsonMode = false, el modelo puede envolver JSON en ```json...```
   * - Necesitamos extraer solo el JSON limpio
   * 
   * Estrategia:
   * 1. Buscar bloques ```json...```
   * 2. Buscar bloques genéricos ```...```
   * 3. Buscar JSON directo por { o [
   */
  static extractJSON(text: string): string {
    console.log('🔍 [Gemini] Extrayendo JSON del texto...');

    // 1. Bloques ```json ... ```
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      console.log('  ✓ JSON encontrado en bloque ```json```');
      return jsonMatch[1].trim();
    }

    // 2. Bloques genéricos ``` ... ```
    const codeMatch = text.match(/```\s*([\s\S]*?)\s*```/);
    if (codeMatch) {
      const content = codeMatch[1].trim();
      if (content.startsWith('{') || content.startsWith('[')) {
        console.log('  ✓ JSON encontrado en bloque de código');
        return content;
      }
    }

    // 3. JSON directo
    const startBrace = text.indexOf('{');
    const startBracket = text.indexOf('[');
    const start = startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)
      ? startBrace
      : startBracket;

    if (start === -1) {
      console.warn('  ⚠️ No se encontró JSON en el texto');
      return text.trim();
    }

    const isObject = text[start] === '{';
    const endChar = isObject ? '}' : ']';
    const end = text.lastIndexOf(endChar);

    if (end === -1 || end < start) {
      console.warn('  ⚠️ JSON incompleto');
      return text.trim();
    }

    const extracted = text.substring(start, end + 1).trim();
    console.log('  ✓ JSON extraído directamente');
    return extracted;
  }

  /**
   * 🎯 FUNCIÓN DE ALTO NIVEL: Procesar imagen y extraer JSON
   * --------------------------------------------------------
   * Esta es la función más conveniente para la mayoría de casos de uso.
   * 
   * Combina:
   * 1. Procesamiento de imagen
   * 2. Extracción de JSON
   * 3. Validación de JSON
   */
  static async processAndExtractJSON(
    request: GeminiRequest,
    config: GeminiConfig
  ): Promise<{ json: string; rawText: string; success: boolean; error?: string; errorType?: string; modelUsed?: string }> {
    console.log('🔄 [Gemini] Procesamiento con extracción de JSON...');

    const response = await this.processImageWithPrompt(request, config);

    if (!response.success) {
      return {
        json: '',
        rawText: response.text,
        success: false,
        error: response.error,
        errorType: response.errorType,
        modelUsed: response.modelUsed
      };
    }

    // Extraer JSON
    let json: string;
    if (config.useJsonMode) {
      // En modo JSON, la respuesta ya es JSON puro
      json = response.text;
      console.log('🎯 [Gemini] Modo JSON: usando respuesta directa');
    } else {
      json = this.extractJSON(response.text);
    }

    // Validar JSON
    try {
      JSON.parse(json);
      console.log('✅ [Gemini] JSON válido');
      return {
        json,
        rawText: response.text,
        success: true,
        modelUsed: response.modelUsed
      };
    } catch (e) {
      console.error('❌ [Gemini] JSON inválido:', e);
      console.error('Texto recibido:', json.substring(0, 200) + '...');
      return {
        json,
        rawText: response.text,
        success: false,
        error: 'El modelo devolvió texto que no es JSON válido. Mejora el prompt o activa useJsonMode.',
        errorType: 'JSON',
        modelUsed: response.modelUsed
      };
    }
  }
}
