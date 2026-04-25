import { WorkspaceConfig, Personaje, HabilidadesPersonaje, GlifosHeroe, AspectosHeroe, EstadisticasHeroe, RunasHeroe, GemasHeroe, GemasRunasCatalogo, CharmsHeroe, HoradricSealHeroe } from '../types';
import { TagService } from './TagService';
import { ImageService } from './ImageService';

export class WorkspaceService {
  private static workspaceConfig: WorkspaceConfig | null = null;
  private static fileSystemHandle: FileSystemDirectoryHandle | null = null;
  private static readonly DB_NAME = 'd4builds_workspace_db';
  private static readonly STORE_NAME = 'workspace_handles';
  private static readonly SESSION_KEY_STORAGE = 'workspaceSessionKey';

  private static getSessionKey(): string {
    let key = sessionStorage.getItem(this.SESSION_KEY_STORAGE);
    if (!key) {
      key = `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(this.SESSION_KEY_STORAGE, key);
    }
    return key;
  }

  private static async openWorkspaceDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('No se pudo abrir IndexedDB'));
    });
  }

  private static async saveHandleForSession(handle: FileSystemDirectoryHandle): Promise<void> {
    const db = await this.openWorkspaceDB();
    const key = this.getSessionKey();

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.put(handle, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error('No se pudo guardar handle de sesión'));
    });

    db.close();
  }

  private static async loadHandleForSession(): Promise<FileSystemDirectoryHandle | null> {
    const key = sessionStorage.getItem(this.SESSION_KEY_STORAGE);
    if (!key) return null;

    const db = await this.openWorkspaceDB();
    const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve((request.result as FileSystemDirectoryHandle) || null);
      request.onerror = () => reject(request.error || new Error('No se pudo leer handle de sesión'));
    });

    db.close();
    return handle;
  }

  private static async initializeWorkspaceFromHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    this.fileSystemHandle = handle;

    const ruta = this.fileSystemHandle.name;

    TagService.setFileSystemHandle(this.fileSystemHandle);
    ImageService.setFileSystemHandle(this.fileSystemHandle);

    await this.createWorkspaceStructure();

    this.workspaceConfig = {
      ruta,
      fecha_creacion: new Date().toISOString(),
      ultima_actualizacion: new Date().toISOString(),
    };

    await this.saveWorkspaceConfig();
    await TagService.loadTags();

    localStorage.setItem('workspaceName', ruta);
  }

  // Solicitar acceso al directorio del workspace
  static async selectWorkspaceDirectory(): Promise<void> {
    try {
      // @ts-ignore - File System Access API
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite',
      });

      if (!handle) {
        throw new Error('No se pudo obtener acceso al directorio');
      }

      await this.initializeWorkspaceFromHandle(handle);
      await this.saveHandleForSession(handle);
    } catch (error) {
      console.error('Error seleccionando workspace:', error);
      throw new Error('No se pudo acceder al directorio del workspace');
    }
  }

  // Restaurar workspace automáticamente dentro de la misma sesión del navegador
  static async restoreWorkspaceFromSession(): Promise<boolean> {
    try {
      const handle = await this.loadHandleForSession();
      if (!handle) return false;

      const permissionApiHandle = handle as unknown as {
        queryPermission?: (descriptor: { mode: 'readwrite' }) => Promise<PermissionState>;
      };
      const permission = await permissionApiHandle.queryPermission?.({ mode: 'readwrite' });
      if (permission !== 'granted') {
        return false;
      }

      await this.initializeWorkspaceFromHandle(handle);
      return true;
    } catch (error) {
      console.error('No se pudo restaurar workspace de sesión:', error);
      return false;
    }
  }

  // Crear estructura de carpetas del workspace
  private static async createWorkspaceStructure(): Promise<void> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      await this.fileSystemHandle.getDirectoryHandle('heroes', { create: true });
      await this.fileSystemHandle.getDirectoryHandle('personajes', { create: true });
      const imagesDir = await this.fileSystemHandle.getDirectoryHandle('imagenes', { create: true });
      await imagesDir.getDirectoryHandle('skills', { create: true });
      await imagesDir.getDirectoryHandle('glifos', { create: true });
      await imagesDir.getDirectoryHandle('aspectos', { create: true });
      await imagesDir.getDirectoryHandle('estadisticas', { create: true });
      await imagesDir.getDirectoryHandle('paragon', { create: true });
      await imagesDir.getDirectoryHandle('gemas_runas', { create: true });
      await imagesDir.getDirectoryHandle('build', { create: true });
      await imagesDir.getDirectoryHandle('otros', { create: true });
    } catch (error) {
      console.error('Error creando estructura:', error);
    }
  }

  // Guardar configuración del workspace
  private static async saveWorkspaceConfig(): Promise<void> {
    if (!this.fileSystemHandle || !this.workspaceConfig) return;

    try {
      const fileHandle = await this.fileSystemHandle.getFileHandle('workspace.json', { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(this.workspaceConfig, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Error guardando configuración:', error);
    }
  }

  // Cargar configuración del workspace
  static async loadWorkspaceConfig(): Promise<WorkspaceConfig | null> {
    if (!this.fileSystemHandle) return null;

    try {
      const fileHandle = await this.fileSystemHandle.getFileHandle('workspace.json');
      const file = await fileHandle.getFile();
      const content = await file.text();
      this.workspaceConfig = JSON.parse(content);
      return this.workspaceConfig;
    } catch (error) {
      return null;
    }
  }

  // Verificar si hay un workspace cargado
  static isWorkspaceLoaded(): boolean {
    return this.fileSystemHandle !== null;
  }

  // Obtener la configuración actual
  static getWorkspaceConfig(): WorkspaceConfig | null {
    return this.workspaceConfig;
  }

  // Leer archivo del workspace (helper genérico)
  static async readFile(fileName: string): Promise<string> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const fileHandle = await this.fileSystemHandle.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (error) {
      throw error; // Propagar error para que el caller pueda manejarlo
    }
  }

  // Guardar archivo en el workspace (helper genérico)
  static async saveFile(fileName: string, content: string): Promise<void> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const fileHandle = await this.fileSystemHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    } catch (error) {
      console.error(`Error guardando archivo ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Cargar datos de mundo (mazmorras, eventos, etc.)
   * @param type - Tipo de archivo: 'mazmorras', 'world', etc.
   */
  static async loadWorldData(type: string): Promise<any> {
    try {
      const fileName = type === 'world' ? 'world_data.json' : `${type}_data.json`;
      const content = await this.readFile(fileName);
      if (!content) return null;
      return JSON.parse(content);
    } catch (error) {
      if ((error as any).name === 'NotFoundError') {
        console.log(`📁 Archivo ${type}_data.json no existe aún`);
        return null;
      }
      console.error(`Error cargando ${type}:`, error);
      return null;
    }
  }

  /**
   * Guardar datos de mundo
   * @param type - Tipo de archivo: 'mazmorras', 'world', etc.
   * @param data - Datos a guardar
   */
  static async saveWorldData(type: string, data: any): Promise<void> {
    try {
      const fileName = type === 'world' ? 'world_data.json' : `${type}_data.json`;
      await this.saveFile(fileName, JSON.stringify(data, null, 2));
      console.log(`✅ ${type}_data.json guardado correctamente`);
    } catch (error) {
      console.error(`Error guardando ${type}:`, error);
      throw error;
    }
  }

  // Guardar personaje con merge seguro (lee el archivo actual primero)
  // Helpers de merge para estadísticas con detalles
  private static deepMergeStats(target: any, source: any): any {
    // Caso base: Si source es null o undefined, mantener target
    if (source === null || source === undefined) {
      return target;
    }

    // Caso base: Si target es null o undefined, usar source
    if (target === null || target === undefined) {
      return source;
    }

    // Caso especial: Detectar estructura enriquecida de estadística
    const isTargetEnriched = typeof target === 'object' && !Array.isArray(target) && 
                             ('valor' in target || 'detalles' in target || 'atributo_ref' in target);
    const isSourceEnriched = typeof source === 'object' && !Array.isArray(source) && 
                             ('valor' in source || 'detalles' in source || 'atributo_ref' in source);
    const isSourcePrimitive = typeof source === 'number' || typeof source === 'string' || typeof source === 'boolean';
    const isTargetPrimitive = typeof target === 'number' || typeof target === 'string' || typeof target === 'boolean';

    // CASO 1: Target enriquecido + Source primitivo
    // Preservar estructura enriquecida, solo actualizar el valor
    if (isTargetEnriched && isSourcePrimitive) {
      return {
        ...target,
        valor: source
      };
    }

    // CASO 2: Target primitivo + Source enriquecido
    // Usar la estructura enriquecida completa
    if (isTargetPrimitive && isSourceEnriched) {
      return source;
    }

    // CASO 3: Ambos son primitivos
    if (isTargetPrimitive && isSourcePrimitive) {
      return source;
    }

    // Arrays: reemplazar directamente (no mergear arrays)
    if (Array.isArray(source)) {
      return source;
    }

    // Si alguno no es objeto, retornar source
    if (typeof target !== 'object' || typeof source !== 'object') {
      return source;
    }

    // Crear copia del target
    const result = { ...target };

    // Mergear cada propiedad del source
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        // ✅ CASO ESPECIAL: Arrays de "detalles" → ACUMULAR en lugar de reemplazar
        if (key === 'detalles' && Array.isArray(source[key]) && Array.isArray(target[key])) {
          // Combinar arrays evitando duplicados (por atributo_ref + texto)
          const targetDetalles = target[key];
          const sourceDetalles = source[key];
          const combined = [...targetDetalles];
          
          sourceDetalles.forEach((newDetalle: any) => {
            // Buscar si ya existe este detalle (mismo atributo_ref + texto)
            const exists = combined.some((existing: any) => 
              existing.atributo_ref === newDetalle.atributo_ref && 
              existing.texto === newDetalle.texto
            );
            
            if (!exists) {
              combined.push(newDetalle);
            }
          });
          
          result[key] = combined;
        } else if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          // Si es objeto, hacer merge recursivo
          result[key] = this.deepMergeStats(target[key], source[key]);
        } else {
          // Si es valor primitivo o array (que no sea detalles), reemplazar
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  /**
   * Normaliza nombres de campos en secciones de estadísticas
   * Elimina campos con nombres antiguos/incorrectos
   */
  private static normalizeStatsFieldNames(stats: any): any {
    const normalized = { ...stats };

    // Mapeo de nombres antiguos/incorrectos a nombres correctos
    const fieldMappings: Record<string, { correct: string; incorrect: string[] }> = {
      defensivo: {
        correct: 'vidaCada5Segundos',
        incorrect: ['regeneracionVida5s', 'regeneracion_vida_5s', 'vida5s']
      },
      utilidad: {
        correct: 'bonificacionProbabilidadGolpeAfortunado',
        incorrect: ['probabilidadGolpeAfortunado', 'golpeAfortunado']
      }
    };

    // Procesar cada sección
    Object.keys(fieldMappings).forEach(sectionKey => {
      if (normalized[sectionKey] && typeof normalized[sectionKey] === 'object') {
        const section = normalized[sectionKey];
        const { correct, incorrect } = fieldMappings[sectionKey];

        // Buscar y consolidar campos incorrectos
        let correctValue = section[correct];
        let hasIncorrectValue = false;

        incorrect.forEach(wrongName => {
          if (wrongName in section) {
            if (correctValue === undefined || correctValue === null) {
              correctValue = section[wrongName];
            }
            delete section[wrongName];
            hasIncorrectValue = true;
          }
        });

        if (hasIncorrectValue && correctValue !== undefined) {
          section[correct] = correctValue;
        }
      }
    });

    // Mover reduccionDanioJcJ de utilidad a jcj
    if (normalized.utilidad && 'reduccionDanioJcJ' in normalized.utilidad) {
      if (!normalized.jcj) normalized.jcj = {};
      normalized.jcj.reduccionDanio = normalized.utilidad.reduccionDanioJcJ;
      delete normalized.utilidad.reduccionDanioJcJ;
    }

    return normalized;
  }

  /**
   * 🔥 FUNCIÓN CENTRALIZADA DE IMPORTACIÓN DE ESTADÍSTICAS
   * 
   * Esta es la ÚNICA función que debe usarse para importar estadísticas.
   * Se utiliza en:
   * - ImageCaptureModal (importación manual y por categoría)
   * - IntegrityTestService (testing)
   * - Cualquier otro servicio que necesite importar estadísticas
   * 
   * @param data - JSON con estadísticas (formato V1 flat o V2 nested)
   * @param personajeId - ID del personaje al que importar
   * @param workspaceHandle - Handle del workspace (opcional, usa el actual si no se proporciona)
   * @returns Objeto con resultado de la importación
   */
  static async importStatsToPersonaje(
    data: any,
    personajeId: string,
    workspaceHandle?: FileSystemDirectoryHandle
  ): Promise<{
    success: boolean;
    fieldsAdded: string[];
    fieldsUpdated: number;
    nivel?: number;
    nivelParagon?: number;
    error?: string;
  }> {
    const handle = workspaceHandle || this.fileSystemHandle;
    if (!handle) throw new Error('No hay workspace seleccionado');

    try {
      const fieldsAdded: string[] = [];
      let parsedNivel: number | undefined;
      let parsedNivelParagon: number | undefined;

      // 1️⃣ DETECTAR FORMATO (V1 flat vs V2 nested)
      let statsToSave: any;
      
      if (data.estadisticas && typeof data.estadisticas === 'object' && !Array.isArray(data.estadisticas)) {
        // Formato V2: { estadisticas: { ofensivo: {...}, defensivo: {...} } }
        const v2 = data.estadisticas;
        statsToSave = {};
        
        const sections = [
          'personaje', 'atributosPrincipales', 'defensivo', 'ofensivo', 
          'utilidad', 'armaduraYResistencias', 'jcj', 'moneda'
        ];
        
        sections.forEach(section => {
          if (v2[section] && !Array.isArray(v2[section])) {
            statsToSave[section] = v2[section];
            fieldsAdded.push(section);
          }
        });
        
        parsedNivelParagon = data.nivel_paragon;
        parsedNivel = statsToSave.atributosPrincipales?.nivel;
      } else {
        // Formato V1 flat: { ofensivo: {...}, defensivo: {...}, nivel_paragon: 123 }
        const { nivel_paragon, ...rest } = data;
        statsToSave = rest;
        parsedNivelParagon = nivel_paragon;
        parsedNivel = rest.atributosPrincipales?.nivel;
        
        Object.keys(rest).forEach(key => {
          if (!['nivel_paragon'].includes(key)) fieldsAdded.push(key);
        });
      }

      if (parsedNivel !== undefined) fieldsAdded.push('nivel');
      if (parsedNivelParagon !== undefined) fieldsAdded.push('nivel_paragon');

      // 2️⃣ CARGAR PERSONAJE DEL DISCO
      const personajesDir = await handle.getDirectoryHandle('personajes');
      let personajeFromDisk: any | null = null;
      
      try {
        const fileHandle = await personajesDir.getFileHandle(`${personajeId}.json`);
        const file = await fileHandle.getFile();
        const content = await file.text();
        personajeFromDisk = JSON.parse(content);
      } catch (error) {
        console.log('⚠️ Personaje no encontrado en disco, se usará versión en memoria');
      }

      if (!personajeFromDisk) {
        throw new Error(`Personaje ${personajeId} no encontrado`);
      }

      // 3️⃣ NORMALIZAR AMBOS OBJETOS (base y nuevos)
      const normalizedBase = this.normalizeStatsFieldNames(personajeFromDisk.estadisticas || {});
      const normalizedNew = this.normalizeStatsFieldNames(statsToSave);

      // 4️⃣ DEEP MERGE (preserva detalles acumulados)
      const mergedEstadisticas = this.deepMergeStats(normalizedBase, normalizedNew);

      // 5️⃣ ACTUALIZAR PERSONAJE
      const updatedPersonaje = {
        ...personajeFromDisk,
        estadisticas: mergedEstadisticas,
        ...(parsedNivel !== undefined && { nivel: parsedNivel }),
        ...(parsedNivelParagon !== undefined && { nivel_paragon: parsedNivelParagon }),
        fecha_actualizacion: new Date().toISOString()
      };

      // 6️⃣ GUARDAR CON MERGE
      const originalHandle = this.fileSystemHandle;
      this.fileSystemHandle = handle; // Temporal para savePersonajeMerge
      
      try {
        await this.savePersonajeMerge(updatedPersonaje);
      } finally {
        this.fileSystemHandle = originalHandle; // Restaurar
      }

      // 7️⃣ CALCULAR CAMPOS ACTUALIZADOS
      let fieldsUpdated = 0;
      Object.keys(normalizedNew).forEach(section => {
        if (typeof normalizedNew[section] === 'object' && !Array.isArray(normalizedNew[section])) {
          fieldsUpdated += Object.keys(normalizedNew[section]).filter(
            key => key !== 'detalles' && key !== 'palabras_clave'
          ).length;
        }
      });

      console.log(`✅ Estadísticas importadas: ${fieldsUpdated} campos, ${fieldsAdded.length} secciones`);

      return {
        success: true,
        fieldsAdded,
        fieldsUpdated,
        nivel: parsedNivel,
        nivelParagon: parsedNivelParagon
      };

    } catch (error) {
      console.error('❌ Error en importStatsToPersonaje:', error);
      return {
        success: false,
        fieldsAdded: [],
        fieldsUpdated: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  static async savePersonajeMerge(personaje: Personaje): Promise<void> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const personajesDir = await this.fileSystemHandle.getDirectoryHandle('personajes');
      
      // Intentar leer el personaje existente del disco
      let existingPersonaje: Personaje | null = null;
      try {
        const fileHandle = await personajesDir.getFileHandle(`${personaje.id}.json`);
        const file = await fileHandle.getFile();
        const content = await file.text();
        existingPersonaje = JSON.parse(content);
      } catch (error) {
        // El archivo no existe, es un personaje nuevo
        console.log('Creando nuevo personaje');
      }

      // Si existe, hacer merge preservando datos no incluidos en el update
      let mergedPersonaje = personaje;
      if (existingPersonaje) {
        mergedPersonaje = {
          ...existingPersonaje,        // Base: datos del disco (más recientes)
          ...personaje,                // Sobrescribir con cambios nuevos
          fecha_actualizacion: new Date().toISOString(),
          
          // Merge arrays de referencias: preservar existentes + agregar nuevos
          habilidades_refs: personaje.habilidades_refs || existingPersonaje.habilidades_refs,
          glifos_refs: personaje.glifos_refs || existingPersonaje.glifos_refs,
          aspectos_refs: personaje.aspectos_refs || existingPersonaje.aspectos_refs,
          estadisticas_refs: personaje.estadisticas_refs || existingPersonaje.estadisticas_refs,
          
          // ✅ DEEP MERGE de estadisticas: fusionar propiedades internas preservando detalles
          estadisticas: personaje.estadisticas ? 
            this.deepMergeStats(existingPersonaje.estadisticas || {}, personaje.estadisticas) 
            : existingPersonaje.estadisticas,
        };
      }

      // Guardar
      const fileHandle = await personajesDir.getFileHandle(`${mergedPersonaje.id}.json`, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(mergedPersonaje, null, 2));
      await writable.close();

      // Actualizar fecha de modificación del workspace
      if (this.workspaceConfig) {
        this.workspaceConfig.ultima_actualizacion = new Date().toISOString();
        await this.saveWorkspaceConfig();
      }
    } catch (error) {
      console.error('Error guardando personaje con merge:', error);
      throw error;
    }
  }

  // Guardar personaje (método original - simple sobrescritura)
  static async savePersonaje(personaje: Personaje): Promise<void> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      // Validar y asegurar IDs únicos en glifos, skills, etc.
      const validatedPersonaje = personaje;

      const personajesDir = await this.fileSystemHandle.getDirectoryHandle('personajes');
      const fileHandle = await personajesDir.getFileHandle(`${validatedPersonaje.id}.json`, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(validatedPersonaje, null, 2));
      await writable.close();

      // Actualizar fecha de modificación del workspace
      if (this.workspaceConfig) {
        this.workspaceConfig.ultima_actualizacion = new Date().toISOString();
        await this.saveWorkspaceConfig();
      }
    } catch (error) {
      console.error('Error guardando personaje:', error);
      throw error;
    }
  }

  // Cargar personaje
  static async loadPersonaje(id: string): Promise<Personaje | null> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const personajesDir = await this.fileSystemHandle.getDirectoryHandle('personajes');
      const fileHandle = await personajesDir.getFileHandle(`${id}.json`);
      const file = await fileHandle.getFile();
      const content = await file.text();
      return JSON.parse(content);
    } catch (error) {
      console.error('Error cargando personaje:', error);
      return null;
    }
  }

  // Listar todos los personajes
  static async listPersonajes(): Promise<Personaje[]> {
    if (!this.fileSystemHandle) return [];

    try {
      const personajesDir = await this.fileSystemHandle.getDirectoryHandle('personajes');
      const personajes: Personaje[] = [];

      // @ts-ignore
      for await (const entry of personajesDir.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.json')) {
          const fileHandle = await personajesDir.getFileHandle(entry.name);
          const file = await fileHandle.getFile();
          const content = await file.text();
          personajes.push(JSON.parse(content));
        }
      }

      return personajes;
    } catch (error) {
      console.error('Error listando personajes:', error);
      return [];
    }
  }

  // Eliminar personaje
  static async deletePersonaje(id: string): Promise<void> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const personajesDir = await this.fileSystemHandle.getDirectoryHandle('personajes');
      await personajesDir.removeEntry(`${id}.json`);
    } catch (error) {
      console.error('Error eliminando personaje:', error);
      throw error;
    }
  }

  // Guardar habilidades de héroe
  static async saveHeroSkills(clase: string, habilidades: HabilidadesPersonaje): Promise<void> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const heroesDir = await this.fileSystemHandle.getDirectoryHandle('heroes');
      const fileHandle = await heroesDir.getFileHandle(`${clase}_habilidades.json`, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(habilidades, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Error guardando habilidades:', error);
      throw error;
    }
  }

  // Cargar habilidades de héroe
  static async loadHeroSkills(clase: string): Promise<HabilidadesPersonaje | null> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const heroesDir = await this.fileSystemHandle.getDirectoryHandle('heroes');
      const fileHandle = await heroesDir.getFileHandle(`${clase}_habilidades.json`);
      const file = await fileHandle.getFile();
      const content = await file.text();
      return JSON.parse(content);
    } catch (error) {
      console.error('Error cargando habilidades:', error);
      return null;
    }
  }

  // Guardar glifos de héroe
  static async saveHeroGlyphs(clase: string, glifos: GlifosHeroe): Promise<void> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const heroesDir = await this.fileSystemHandle.getDirectoryHandle('heroes');
      const fileHandle = await heroesDir.getFileHandle(`${clase}_glifos.json`, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(glifos, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Error guardando glifos:', error);
      throw error;
    }
  }

  // Cargar glifos de héroe
  static async loadHeroGlyphs(clase: string): Promise<GlifosHeroe | null> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const heroesDir = await this.fileSystemHandle.getDirectoryHandle('heroes');
      const fileHandle = await heroesDir.getFileHandle(`${clase}_glifos.json`);
      const file = await fileHandle.getFile();
      const content = await file.text();
      return JSON.parse(content);
    } catch (error) {
      console.error('Error cargando glifos:', error);
      return null;
    }
  }

  // Guardar aspectos de héroe
  static async saveHeroAspects(clase: string, aspectos: AspectosHeroe): Promise<void> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const heroesDir = await this.fileSystemHandle.getDirectoryHandle('heroes');
      const fileHandle = await heroesDir.getFileHandle(`${clase}_aspectos.json`, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(aspectos, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Error guardando aspectos:', error);
      throw error;
    }
  }

  // Cargar aspectos de héroe
  static async loadHeroAspects(clase: string): Promise<AspectosHeroe | null> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const heroesDir = await this.fileSystemHandle.getDirectoryHandle('heroes');
      const fileHandle = await heroesDir.getFileHandle(`${clase}_aspectos.json`);
      const file = await fileHandle.getFile();
      const content = await file.text();
      return JSON.parse(content);
    } catch (error) {
      console.error('Error cargando aspectos:', error);
      return null;
    }
  }

  // Guardar talismanes de héroe (Temporada 13)
  static async saveHeroCharms(clase: string, charms: CharmsHeroe): Promise<void> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const heroesDir = await this.fileSystemHandle.getDirectoryHandle('heroes');
      const fileHandle = await heroesDir.getFileHandle(`${clase}_talismanes.json`, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(charms, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Error guardando talismanes:', error);
      throw error;
    }
  }

  // Cargar talismanes de héroe (Temporada 13)
  static async loadHeroCharms(clase: string): Promise<CharmsHeroe | null> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const heroesDir = await this.fileSystemHandle.getDirectoryHandle('heroes');
      const fileHandle = await heroesDir.getFileHandle(`${clase}_talismanes.json`);
      const file = await fileHandle.getFile();
      const content = await file.text();
      return JSON.parse(content);
    } catch (error) {
      console.error('Error cargando talismanes:', error);
      return { talismanes: [] };
    }
  }

  // Guardar Sello Horádrico de héroe (Temporada 13)
  static async saveHeroHoradricSeal(clase: string, seal: HoradricSealHeroe): Promise<void> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const heroesDir = await this.fileSystemHandle.getDirectoryHandle('heroes');
      const fileHandle = await heroesDir.getFileHandle(`${clase}_sello_horadrico.json`, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(seal, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Error guardando sello horádrico:', error);
      throw error;
    }
  }

  // Cargar Sello Horádrico de héroe (Temporada 13)
  static async loadHeroHoradricSeal(clase: string): Promise<HoradricSealHeroe | null> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const heroesDir = await this.fileSystemHandle.getDirectoryHandle('heroes');
      const fileHandle = await heroesDir.getFileHandle(`${clase}_sello_horadrico.json`);
      const file = await fileHandle.getFile();
      const content = await file.text();
      return JSON.parse(content);
    } catch (error) {
      console.error('Error cargando sello horádrico:', error);
      return { sello: null };
    }
  }

  // Guardar estadísticas de héroe (v0.3.7)
  static async saveHeroStats(clase: string, estadisticas: EstadisticasHeroe): Promise<void> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const heroesDir = await this.fileSystemHandle.getDirectoryHandle('heroes');
      const fileHandle = await heroesDir.getFileHandle(`${clase}_estadisticas.json`, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(estadisticas, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Error guardando estadísticas de héroe:', error);
      throw error;
    }
  }

  // Cargar estadísticas de héroe (v0.3.7)
  static async loadHeroStats(clase: string): Promise<EstadisticasHeroe | null> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const heroesDir = await this.fileSystemHandle.getDirectoryHandle('heroes');
      const fileHandle = await heroesDir.getFileHandle(`${clase}_estadisticas.json`);
      const file = await fileHandle.getFile();
      const content = await file.text();
      return JSON.parse(content);
    } catch (error) {
      // Es normal que todavía no exista el archivo de estadísticas del héroe.
      if ((error as DOMException)?.name !== 'NotFoundError') {
        console.error('Error cargando estadísticas de héroe:', error);
      }
      return null;
    }
  }

  // Guardar mecánicas de clase (v0.8.0)
  static async saveHeroClassMechanics(clase: string, mecanicas: import('../types').MecanicasClaseHeroe): Promise<void> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const heroesDir = await this.fileSystemHandle.getDirectoryHandle('heroes');
      const fileHandle = await heroesDir.getFileHandle(`${clase}_mecanicas.json`, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(mecanicas, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Error guardando mecánicas de clase:', error);
      throw error;
    }
  }

  // Cargar mecánicas de clase (v0.8.0)
  static async loadHeroClassMechanics(clase: string): Promise<import('../types').MecanicasClaseHeroe | null> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const heroesDir = await this.fileSystemHandle.getDirectoryHandle('heroes');
      const fileHandle = await heroesDir.getFileHandle(`${clase}_mecanicas.json`);
      const file = await fileHandle.getFile();
      const content = await file.text();
      return JSON.parse(content);
    } catch (error) {
      if ((error as DOMException)?.name !== 'NotFoundError') {
        console.error('Error cargando mecánicas de clase:', error);
      }
      return null;
    }
  }

  // Guardar runas (global, todas las clases)
  static async saveHeroRunes(_clase: string, runas: RunasHeroe): Promise<void> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const catalogo = await this.loadRunesGemsCatalog();
      const fileHandle = await this.fileSystemHandle.getFileHandle('gemas_runas.json', { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify({
        runas: runas.runas || [],
        gemas: catalogo.gemas || []
      }, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Error guardando runas:', error);
      throw error;
    }
  }

  // Cargar runas (global, todas las clases)
  static async loadHeroRunes(_clase: string): Promise<RunasHeroe> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const fileHandle = await this.fileSystemHandle.getFileHandle('gemas_runas.json');
      const file = await fileHandle.getFile();
      const content = await file.text();
      const parsed = JSON.parse(content) as GemasRunasCatalogo;
      return { runas: parsed.runas || [] };
    } catch (error) {
      if ((error as DOMException)?.name === 'NotFoundError') {
        // Fallback de migración: runas.json antiguo
        try {
          const legacyFileHandle = await this.fileSystemHandle.getFileHandle('runas.json');
          const legacyFile = await legacyFileHandle.getFile();
          const legacyContent = await legacyFile.text();
          const legacyParsed = JSON.parse(legacyContent) as RunasHeroe;
          return { runas: legacyParsed.runas || [] };
        } catch {
          return { runas: [] };
        }
      }
      console.error('Error cargando runas:', error);
      throw error;
    }
  }

  // Guardar gemas (global, todas las clases)
  static async saveHeroGems(_clase: string, gemas: GemasHeroe): Promise<void> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const catalogo = await this.loadRunesGemsCatalog();
      const fileHandle = await this.fileSystemHandle.getFileHandle('gemas_runas.json', { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify({
        runas: catalogo.runas || [],
        gemas: gemas.gemas || []
      }, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Error guardando gemas:', error);
      throw error;
    }
  }

  // Cargar gemas (global, todas las clases)
  static async loadHeroGems(_clase: string): Promise<GemasHeroe> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const fileHandle = await this.fileSystemHandle.getFileHandle('gemas_runas.json');
      const file = await fileHandle.getFile();
      const content = await file.text();
      const parsed = JSON.parse(content) as GemasRunasCatalogo;
      return { gemas: parsed.gemas || [] };
    } catch (error) {
      if ((error as DOMException)?.name === 'NotFoundError') {
        // Fallback de migración: gemas.json antiguo
        try {
          const legacyFileHandle = await this.fileSystemHandle.getFileHandle('gemas.json');
          const legacyFile = await legacyFileHandle.getFile();
          const legacyContent = await legacyFile.text();
          const legacyParsed = JSON.parse(legacyContent) as GemasHeroe;
          return { gemas: legacyParsed.gemas || [] };
        } catch {
          return { gemas: [] };
        }
      }
      console.error('Error cargando gemas:', error);
      throw error;
    }
  }

  // Cargar catálogo global unificado de runas y gemas
  static async loadRunesGemsCatalog(): Promise<GemasRunasCatalogo> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const fileHandle = await this.fileSystemHandle.getFileHandle('gemas_runas.json');
      const file = await fileHandle.getFile();
      const content = await file.text();
      const parsed = JSON.parse(content) as GemasRunasCatalogo;
      return {
        runas: parsed.runas || [],
        gemas: parsed.gemas || []
      };
    } catch (error) {
      if ((error as DOMException)?.name === 'NotFoundError') {
        const runas = await this.loadHeroRunes('global');
        const gemas = await this.loadHeroGems('global');
        return {
          runas: runas.runas || [],
          gemas: gemas.gemas || []
        };
      }
      console.error('Error cargando catálogo gemas/runas:', error);
      throw error;
    }
  }

  // Listar clases disponibles
  static async listAvailableClasses(): Promise<string[]> {
    if (!this.fileSystemHandle) return [];

    try {
      const heroesDir = await this.fileSystemHandle.getDirectoryHandle('heroes');
      const clases = new Set<string>();

      // @ts-ignore
      for await (const entry of heroesDir.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.json')) {
          const className = entry.name.split('_')[0];
          clases.add(className);
        }
      }

      return Array.from(clases);
    } catch (error) {
      console.error('Error listando clases:', error);
      return [];
    }
  }

  // ============================================================================
  // MÉTODOS PARA SISTEMA PARAGON (v0.4.15)
  // ============================================================================

  // Guardar tableros Paragon de héroe
  static async saveParagonBoards(clase: string, tableros: any): Promise<void> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const heroesDir = await this.fileSystemHandle.getDirectoryHandle('heroes');
      const fileHandle = await heroesDir.getFileHandle(`${clase}_paragon_tableros.json`, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(tableros, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Error guardando tableros Paragon:', error);
      throw error;
    }
  }

  // Cargar tableros Paragon de héroe
  static async loadParagonBoards(clase: string): Promise<any | null> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const heroesDir = await this.fileSystemHandle.getDirectoryHandle('heroes');
      const fileHandle = await heroesDir.getFileHandle(`${clase}_paragon_tableros.json`);
      const file = await fileHandle.getFile();
      const content = await file.text();
      return JSON.parse(content);
    } catch (error) {
      if ((error as DOMException)?.name !== 'NotFoundError') {
        console.error('Error cargando tableros Paragon:', error);
      }
      return null;
    }
  }

  // Guardar nodos Paragon de héroe (catálogo completo)
  static async saveParagonNodes(clase: string, nodos: any): Promise<void> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const heroesDir = await this.fileSystemHandle.getDirectoryHandle('heroes');
      const fileHandle = await heroesDir.getFileHandle(`${clase}_paragon_nodos.json`, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(nodos, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Error guardando nodos Paragon:', error);
      throw error;
    }
  }

  // Cargar nodos Paragon de héroe
  static async loadParagonNodes(clase: string): Promise<any | null> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const heroesDir = await this.fileSystemHandle.getDirectoryHandle('heroes');
      const fileHandle = await heroesDir.getFileHandle(`${clase}_paragon_nodos.json`);
      const file = await fileHandle.getFile();
      const content = await file.text();
      return JSON.parse(content);
    } catch (error) {
      if ((error as DOMException)?.name !== 'NotFoundError') {
        console.error('Error cargando nodos Paragon:', error);
      }
      return null;
    }
  }

  // Guardar configuración Paragon del personaje (ya incluido en savePersonaje)
  // El campo paragon se guarda automáticamente dentro del objeto Personaje
  // No se requiere método separado, pero se puede usar el merge:
  static async updatePersonajeParagon(personajeId: string, paragonData: any): Promise<void> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      const personajesDir = await this.fileSystemHandle.getDirectoryHandle('personajes');
      
      // Leer personaje actual
      const fileHandle = await personajesDir.getFileHandle(`${personajeId}.json`);
      const file = await fileHandle.getFile();
      const content = await file.text();
      const personaje = JSON.parse(content);

      // Actualizar solo el bloque paragon
      personaje.paragon = paragonData;
      personaje.fecha_actualizacion = new Date().toISOString();

      // Guardar
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(personaje, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Error actualizando Paragon del personaje:', error);
      throw error;
    }
  }
}

