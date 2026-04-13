/**
 * ============================================================================
 * C. FUNCIÓN AUXILIAR: File/Blob → Base64
 * ============================================================================
 * 
 * Esta función convierte archivos de imagen (File o Blob) a formato base64
 * PURO, sin el prefijo "data:image/...;base64,".
 * 
 * Gemini API requiere base64 puro en el campo 'data' del objeto inlineData.
 * 
 * USO:
 * ----
 * import { fileToBase64 } from './utils/fileToBase64';
 * 
 * const imageFile = document.querySelector('input[type="file"]').files[0];
 * const imagePart = await fileToBase64(imageFile);
 * 
 * console.log(imagePart);
 * // {
 * //   inlineData: {
 * //     data: "iVBORw0KGgoAAAA...",  ← Base64 PURO (sin prefijo)
 * //     mimeType: "image/png"
 * //   }
 * // }
 * 
 * ============================================================================
 */

/**
 * Tipo de retorno para compatibilidad con Gemini API
 */
export interface GenerativePart {
  inlineData: {
    data: string;      // Base64 puro (sin "data:image/...;base64,")
    mimeType: string;  // Tipo MIME de la imagen
  };
}

/**
 * Convierte File o Blob a base64 puro para Gemini API
 * 
 * @param file - Archivo o Blob de imagen a convertir
 * @returns Promise con objeto { inlineData: { data, mimeType } }
 * 
 * Por qué es necesario:
 * ---------------------
 * 1. FileReader.readAsDataURL() devuelve: "data:image/png;base64,iVBORw0KG..."
 * 2. Gemini API necesita solo: "iVBORw0KG..."
 * 3. Esta función extrae la parte base64 pura (después de la coma)
 * 
 * Manejo de errores:
 * ------------------
 * - Valida que el archivo sea una imagen (mime type)
 * - Valida que la conversión a base64 sea exitosa
 * - Proporciona mensajes de error claros
 * 
 * Ejemplo de uso:
 * ---------------
 * ```typescript
 * try {
 *   const imageFile = input.files[0];
 *   const imagePart = await fileToBase64(imageFile);
 *   
 *   // Ahora puedes usar imagePart con Gemini API
 *   const result = await model.generateContent([prompt, imagePart]);
 * } catch (error) {
 *   console.error('Error al convertir imagen:', error.message);
 * }
 * ```
 */
export async function fileToBase64(file: File | Blob): Promise<GenerativePart> {
  return new Promise((resolve, reject) => {
    // Validación del tipo MIME (opcional pero recomendado)
    if (file.type && !file.type.startsWith('image/')) {
      reject(new Error(`Tipo de archivo no soportado: ${file.type}. Se esperaba image/*`));
      return;
    }

    const reader = new FileReader();

    /**
     * Evento onloadend se dispara cuando la lectura completa (exitosa o no)
     */
    reader.onloadend = () => {
      try {
        const result = reader.result as string;

        if (!result) {
          throw new Error('FileReader devolvió resultado vacío');
        }

        // Verificar formato esperado: "data:image/png;base64,..."
        if (!result.includes(',')) {
          throw new Error('Formato de Data URL inválido (no contiene coma)');
        }

        // Extraer solo la parte base64 (después de la coma)
        // Ejemplo: "data:image/png;base64,iVBORw0KG..." → "iVBORw0KG..."
        const parts = result.split(',');
        const base64String = parts[1];

        if (!base64String || base64String.length === 0) {
          throw new Error('No se pudo extraer contenido base64 de la imagen');
        }

        // Determinar MIME type
        // 1. Desde el tipo del archivo (preferido)
        // 2. Desde el Data URL (fallback)
        // 3. Asumír PNG si no hay información
        let mimeType = file.type;
        
        if (!mimeType && result.startsWith('data:')) {
          // Extraer MIME type del Data URL: "data:image/png;base64,..."
          const mimeMatch = result.match(/^data:([^;]+);/);
          if (mimeMatch) {
            mimeType = mimeMatch[1];
          }
        }

        // Fallback a PNG si aún no hay MIME type
        if (!mimeType) {
          console.warn('No se pudo determinar MIME type, usando image/png por defecto');
          mimeType = 'image/png';
        }

        // Construir objeto en el formato esperado por Gemini API
        resolve({
          inlineData: {
            data: base64String,
            mimeType: mimeType
          }
        });

      } catch (error) {
        reject(new Error(`Error al procesar imagen: ${error instanceof Error ? error.message : String(error)}`));
      }
    };

    /**
     * Evento onerror se dispara si hay error en la lectura del archivo
     */
    reader.onerror = () => {
      const errorMsg = reader.error?.message || 'Error desconocido al leer archivo';
      reject(new Error(`Error al leer archivo de imagen: ${errorMsg}`));
    };

    /**
     * Iniciar lectura del archivo como Data URL
     * Genera una cadena como: "data:image/png;base64,iVBORw0KG..."
     */
    reader.readAsDataURL(file);
  });
}

/**
 * Versión síncrona (si ya tienes el Data URL)
 * 
 * @param dataUrl - Data URL completo (data:image/png;base64,...)
 * @returns Objeto { inlineData: { data, mimeType } }
 */
export function dataUrlToBase64(dataUrl: string): GenerativePart {
  if (!dataUrl.includes(',')) {
    throw new Error('Data URL inválido: no contiene coma');
  }

  const parts = dataUrl.split(',');
  const base64 = parts[1];

  if (!base64) {
    throw new Error('No se pudo extraer base64 del Data URL');
  }

  // Extraer MIME type del Data URL
  let mimeType = 'image/png'; // Default
  const mimeMatch = dataUrl.match(/^data:([^;]+);/);
  if (mimeMatch) {
    mimeType = mimeMatch[1];
  }

  return {
    inlineData: {
      data: base64,
      mimeType: mimeType
    }
  };
}

/**
 * Obtener solo el base64 puro (sin el objeto wrapper)
 * 
 * @param file - Archivo o Blob
 * @returns Promise<string> con base64 puro
 */
export async function getBase64Only(file: File | Blob): Promise<string> {
  const result = await fileToBase64(file);
  return result.inlineData.data;
}

/**
 * Validar que un string es base64 válido
 * 
 * @param str - String a validar
 * @returns true si es base64 válido
 */
export function isValidBase64(str: string): boolean {
  if (!str || str.length === 0) {
    return false;
  }

  try {
    // Intentar decodificar
    const decoded = atob(str);
    // Intentar codificar de nuevo
    const encoded = btoa(decoded);
    // Debe ser igual al original
    return encoded === str;
  } catch {
    return false;
  }
}

/**
 * Obtener tamaño aproximado en KB del base64
 * 
 * @param base64 - String base64
 * @returns Tamaño aproximado en KB
 */
export function getBase64SizeKB(base64: string): number {
  // Base64 aumenta el tamaño en ~33%
  // Cada carácter base64 = 1 byte
  // Tamaño real = (base64.length / 4) * 3
  const sizeBytes = (base64.length / 4) * 3;
  return Math.round(sizeBytes / 1024);
}

// Exportación por defecto
export default fileToBase64;
