import { TagGlobal, TagsData, Tag } from '../types';

export class TagService {
  private static tagsData: TagsData = {
    tags: [],
    ultima_actualizacion: new Date().toISOString()
  };
  private static fileSystemHandle: FileSystemDirectoryHandle | null = null;

  // Establecer el handle del directorio del workspace
  static setFileSystemHandle(handle: FileSystemDirectoryHandle | null): void {
    this.fileSystemHandle = handle;
  }

  // Cargar tags desde tags.json
  static async loadTags(): Promise<void> {
    if (!this.fileSystemHandle) {
      console.warn('No hay workspace seleccionado para cargar tags');
      return;
    }

    try {
      const fileHandle = await this.fileSystemHandle.getFileHandle('tags.json', { create: false });
      const file = await fileHandle.getFile();
      const content = await file.text();
      this.tagsData = JSON.parse(content);
      console.log('Tags cargados:', this.tagsData.tags.length);
    } catch (error) {
      if ((error as any).name === 'NotFoundError') {
        console.log('Archivo tags.json no existe, se creará al guardar tags');
        this.tagsData = {
          tags: [],
          ultima_actualizacion: new Date().toISOString()
        };
      } else {
        console.error('Error cargando tags:', error);
        throw error;
      }
    }
  }

  // Guardar tags en tags.json
  static async saveTags(): Promise<void> {
    if (!this.fileSystemHandle) {
      throw new Error('No hay workspace seleccionado');
    }

    try {
      this.tagsData.ultima_actualizacion = new Date().toISOString();
      
      const fileHandle = await this.fileSystemHandle.getFileHandle('tags.json', { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(this.tagsData, null, 2));
      await writable.close();
      
      console.log('Tags guardados:', this.tagsData.tags.length);
    } catch (error) {
      console.error('Error guardando tags:', error);
      throw error;
    }
  }

  // Obtener todos los tags
  static getTags(): TagGlobal[] {
    return this.tagsData.tags;
  }

  // Obtener tag por ID
  static getTagById(id: string): TagGlobal | undefined {
    return this.tagsData.tags.find(t => t.id === id);
  }

  // Buscar tag por tag normalizado (ej: "golpe_critico")
  static findTagByNormalizedName(tag: string): TagGlobal | undefined {
    return this.tagsData.tags.find(t => t.tag === tag);
  }

  // Generar ID único para tag
  private static generateTagId(tag: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `tag_${tag}_${timestamp}_${random}`;
  }

  // Convertir Tag (del prompt V2) a TagGlobal
  static convertTagV2ToGlobal(
    tagV2: Tag,
    origen: 'tooltip' | 'estadistica' | 'manual' | 'habilidad' | 'aspecto' | 'glifo'
  ): TagGlobal {
    const now = new Date().toISOString();
    const categoria = tagV2.categoria || 'otro';
    
    return {
      id: this.generateTagId(tagV2.tag),
      tag: tagV2.tag,
      texto_original: tagV2.texto_original,
      significado: tagV2.significado,
      categoria: categoria as any,
      descripcion_jugabilidad: null,
      sinonimos: [],
      origen: origen,
      pendiente_revision: !tagV2.significado,
      fecha_creacion: now,
      fecha_actualizacion: now
    };
  }

  // Procesar y guardar tags desde una importación V2
  // Retorna los IDs de los tags guardados
  static async processAndSaveTagsV2(
    tagsV2: Tag[],
    origen: 'tooltip' | 'estadistica' | 'manual' | 'habilidad' | 'aspecto' | 'glifo'
  ): Promise<string[]> {
    const tagIds: string[] = [];

    for (const tagV2 of tagsV2) {
      // Buscar si ya existe un tag con ese nombre normalizado
      let existingTag = this.findTagByNormalizedName(tagV2.tag);

      if (existingTag) {
        // Tag ya existe
        // Actualizar información si el nuevo tiene más detalles
        if (tagV2.significado && !existingTag.significado) {
          existingTag.significado = tagV2.significado;
          existingTag.pendiente_revision = false;
          existingTag.fecha_actualizacion = new Date().toISOString();
        }
        
        // Agregar origen si no existe
        if (existingTag.origen !== origen && !existingTag.origen.includes(origen)) {
          // Mantener origen original, podríamos agregar múltiples orígenes en el futuro
        }

        tagIds.push(existingTag.id);
      } else {
        // Crear nuevo tag
        const newTag = this.convertTagV2ToGlobal(tagV2, origen);
        this.tagsData.tags.push(newTag);
        tagIds.push(newTag.id);
      }
    }

    // Guardar cambios
    await this.saveTags();

    return tagIds;
  }

  // Agregar o actualizar un tag manualmente
  static async addOrUpdateTag(tag: TagGlobal): Promise<void> {
    const index = this.tagsData.tags.findIndex(t => t.id === tag.id);
    
    if (index >= 0) {
      // Actualizar existente
      tag.fecha_actualizacion = new Date().toISOString();
      this.tagsData.tags[index] = tag;
    } else {
      // Agregar nuevo
      tag.fecha_creacion = new Date().toISOString();
      tag.fecha_actualizacion = new Date().toISOString();
      this.tagsData.tags.push(tag);
    }

    await this.saveTags();
  }

  // Eliminar tag por ID
  static async deleteTag(id: string): Promise<void> {
    this.tagsData.tags = this.tagsData.tags.filter(t => t.id !== id);
    await this.saveTags();
  }

  // Limpiar/resetear tags (para testing)
  static reset(): void {
    this.tagsData = {
      tags: [],
      ultima_actualizacion: new Date().toISOString()
    };
  }

  // Obtener tags por IDs
  static getTagsByIds(ids: string[]): TagGlobal[] {
    return ids
      .map(id => this.getTagById(id))
      .filter((tag): tag is TagGlobal => tag !== undefined);
  }

  // Buscar tags por texto (para autocompletar)
  static searchTags(query: string): TagGlobal[] {
    const lowerQuery = query.toLowerCase();
    return this.tagsData.tags.filter(tag =>
      tag.tag.includes(lowerQuery) ||
      tag.texto_original.toLowerCase().includes(lowerQuery) ||
      tag.sinonimos.some(s => s.toLowerCase().includes(lowerQuery))
    );
  }
}
