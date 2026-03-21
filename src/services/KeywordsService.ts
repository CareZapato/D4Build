import { PalabraClave, PalabrasClaveGlobales } from '../types';

/**
 * Servicio para gestionar las palabras clave globales del workspace
 * Las palabras clave son transversales a skills, glifos, aspectos, etc.
 */
export class KeywordsService {
  private static readonly STORAGE_KEY = 'palabras_clave_globales';

  /**
   * Cargar todas las palabras clave del workspace
   */
  static async loadKeywords(): Promise<PalabrasClaveGlobales> {
    const workspaceName = localStorage.getItem('workspaceName');
    if (!workspaceName) {
      return { palabras: [] };
    }

    const key = `${workspaceName}_${this.STORAGE_KEY}`;
    const data = localStorage.getItem(key);
    
    if (!data) {
      return { palabras: [] };
    }

    try {
      return JSON.parse(data) as PalabrasClaveGlobales;
    } catch (error) {
      console.error('Error al cargar palabras clave:', error);
      return { palabras: [] };
    }
  }

  /**
   * Guardar palabras clave en el workspace
   */
  static async saveKeywords(keywords: PalabrasClaveGlobales): Promise<void> {
    const workspaceName = localStorage.getItem('workspaceName');
    if (!workspaceName) {
      throw new Error('No hay workspace activo');
    }

    const key = `${workspaceName}_${this.STORAGE_KEY}`;
    localStorage.setItem(key, JSON.stringify(keywords));
  }

  /**
   * Agregar o actualizar una palabra clave
   * Si existe (por ID), la actualiza. Si no existe, la agrega.
   */
  static async upsertKeyword(keyword: PalabraClave): Promise<void> {
    const keywords = await this.loadKeywords();
    const existingIndex = keywords.palabras.findIndex(k => k.id === keyword.id);

    if (existingIndex >= 0) {
      // Actualizar existente
      keywords.palabras[existingIndex] = keyword;
    } else {
      // Agregar nueva
      keywords.palabras.push(keyword);
    }

    await this.saveKeywords(keywords);
  }

  /**
   * Agregar múltiples palabras clave de una sola vez
   * Evita duplicados por ID
   */
  static async upsertKeywords(newKeywords: PalabraClave[]): Promise<void> {
    const keywords = await this.loadKeywords();
    
    newKeywords.forEach(newKeyword => {
      const existingIndex = keywords.palabras.findIndex(k => k.id === newKeyword.id);
      if (existingIndex >= 0) {
        // Actualizar existente
        keywords.palabras[existingIndex] = newKeyword;
      } else {
        // Agregar nueva
        keywords.palabras.push(newKeyword);
      }
    });

    await this.saveKeywords(keywords);
  }

  /**
   * Eliminar una palabra clave por ID
   */
  static async deleteKeyword(id: string): Promise<void> {
    const keywords = await this.loadKeywords();
    keywords.palabras = keywords.palabras.filter(k => k.id !== id);
    await this.saveKeywords(keywords);
  }

  /**
   * Buscar una palabra clave por ID
   */
  static async getKeywordById(id: string): Promise<PalabraClave | null> {
    const keywords = await this.loadKeywords();
    return keywords.palabras.find(k => k.id === id) || null;
  }

  /**
   * Buscar palabras clave por texto parcial
   */
  static async searchKeywords(query: string): Promise<PalabraClave[]> {
    const keywords = await this.loadKeywords();
    const lowerQuery = query.toLowerCase();
    
    return keywords.palabras.filter(k => 
      k.palabra.toLowerCase().includes(lowerQuery) ||
      k.descripcion.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Obtener palabras clave por categoría
   */
  static async getKeywordsByCategory(categoria: string): Promise<PalabraClave[]> {
    const keywords = await this.loadKeywords();
    return keywords.palabras.filter(k => k.categoria === categoria);
  }

  /**
   * Obtener múltiples palabras clave por sus IDs
   */
  static async getKeywordsByIds(ids: string[]): Promise<PalabraClave[]> {
    const keywords = await this.loadKeywords();
    return keywords.palabras.filter(k => ids.includes(k.id));
  }

  /**
   * Generar ID único para palabra clave basado en la palabra normalizada
   */
  static generateKeywordId(palabra: string): string {
    // Normalizar: minúsculas, sin acentos, sin espacios
    const normalized = palabra
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    
    return `kw_${normalized}`;
  }

  /**
   * Importar palabras clave desde un JSON
   * No sobreescribe las existentes, solo agrega nuevas o actualiza
   */
  static async importKeywordsFromJSON(data: { palabras_clave?: Array<{palabra: string, descripcion: string, categoria?: string}>}): Promise<number> {
    if (!data.palabras_clave || !Array.isArray(data.palabras_clave)) {
      return 0;
    }

    const keywordsToImport: PalabraClave[] = data.palabras_clave.map(kw => ({
      id: this.generateKeywordId(kw.palabra),
      palabra: kw.palabra,
      descripcion: kw.descripcion || '',
      categoria: (kw.categoria as any) || 'otro',
      fecha_creacion: new Date().toISOString()
    }));

    await this.upsertKeywords(keywordsToImport);
    return keywordsToImport.length;
  }
}
