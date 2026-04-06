import { WorkspaceConfig, Personaje, HabilidadesPersonaje, GlifosHeroe, AspectosHeroe, EstadisticasHeroe } from '../types';
import { TagService } from './TagService';
import { ImageService } from './ImageService';

export class WorkspaceService {
  private static workspaceConfig: WorkspaceConfig | null = null;
  private static fileSystemHandle: FileSystemDirectoryHandle | null = null;

  // Solicitar acceso al directorio del workspace
  static async selectWorkspaceDirectory(): Promise<void> {
    try {
      // @ts-ignore - File System Access API
      this.fileSystemHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
      });

      if (!this.fileSystemHandle) {
        throw new Error('No se pudo obtener acceso al directorio');
      }

      const ruta = this.fileSystemHandle.name;
      
      // Configurar TagService con el handle del directorio
      TagService.setFileSystemHandle(this.fileSystemHandle);
      
      // Configurar ImageService con el handle del directorio
      ImageService.setFileSystemHandle(this.fileSystemHandle);
      
      // Crear estructura de carpetas
      await this.createWorkspaceStructure();

      // Guardar configuración
      this.workspaceConfig = {
        ruta,
        fecha_creacion: new Date().toISOString(),
        ultima_actualizacion: new Date().toISOString(),
      };

      await this.saveWorkspaceConfig();
      
      // Cargar tags del workspace
      await TagService.loadTags();
      
      // Guardar handle en localStorage para persistencia
      localStorage.setItem('workspaceName', ruta);
    } catch (error) {
      console.error('Error seleccionando workspace:', error);
      throw new Error('No se pudo acceder al directorio del workspace');
    }
  }

  // Crear estructura de carpetas del workspace
  private static async createWorkspaceStructure(): Promise<void> {
    if (!this.fileSystemHandle) throw new Error('No hay workspace seleccionado');

    try {
      await this.fileSystemHandle.getDirectoryHandle('heroes', { create: true });
      await this.fileSystemHandle.getDirectoryHandle('personajes', { create: true });
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
      console.error('Error cargando estadísticas de héroe:', error);
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
