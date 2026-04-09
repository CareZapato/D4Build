import { WorkspaceConfig, Personaje, HabilidadesPersonaje, GlifosHeroe, AspectosHeroe, EstadisticasHeroe } from '../types';
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

  // Guardar personaje
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
}
