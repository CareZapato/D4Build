import { WorkspaceConfig, Personaje, HabilidadesPersonaje, GlifosHeroe, AspectosHeroe, EstadisticasHeroe, RunasHeroe, GemasHeroe, GemasRunasCatalogo } from '../types';
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
      await imagesDir.getDirectoryHandle('runas', { create: true });
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

  // Guardar personaje con merge seguro (lee el archivo actual primero)
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
          
          // DEEP MERGE de estadisticas: fusionar propiedades internas (moneda, defensivo, etc.)
          estadisticas: personaje.estadisticas ? {
            ...existingPersonaje.estadisticas,  // Preservar estadísticas existentes del disco
            ...personaje.estadisticas,           // Agregar/actualizar con nuevas estadísticas
          } : existingPersonaje.estadisticas,
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

