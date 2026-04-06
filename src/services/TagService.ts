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
      console.log('✅ Tags cargados desde archivo:', this.tagsData.tags.length);
    } catch (error) {
      if ((error as any).name === 'NotFoundError') {
        console.log('⚠️ Archivo tags.json no existe, creando tags por defecto...');
        await this.initializeDefaultTags();
      } else {
        console.error('Error cargando tags:', error);
        throw error;
      }
    }
  }

  // Inicializar tags por defecto si no existen
  private static async initializeDefaultTags(): Promise<void> {
    const defaultTags: Omit<TagGlobal, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>[] = [
      // Atributos principales
      { tag: 'inteligencia', texto_original: 'Inteligencia', significado: 'Atributo principal que aumenta el daño de habilidades', categoria: 'atributo', descripcion_jugabilidad: 'Cada punto de Inteligencia aumenta el daño de todas tus habilidades', sinonimos: ['int'], origen: 'manual', pendiente_revision: false },
      { tag: 'voluntad', texto_original: 'Voluntad', significado: 'Atributo que aumenta la curación y resistencia', categoria: 'atributo', descripcion_jugabilidad: 'Cada punto de Voluntad aumenta la curación recibida y resistencias', sinonimos: ['will'], origen: 'manual', pendiente_revision: false },
      { tag: 'fuerza', texto_original: 'Fuerza', significado: 'Atributo que aumenta el daño físico', categoria: 'atributo', descripcion_jugabilidad: 'Atributo principal para clases de combate cuerpo a cuerpo', sinonimos: ['str'], origen: 'manual', pendiente_revision: false },
      { tag: 'destreza', texto_original: 'Destreza', significado: 'Atributo que aumenta probabilidad de golpe crítico', categoria: 'atributo', descripcion_jugabilidad: 'Cada punto de Destreza aumenta la probabilidad de golpe crítico', sinonimos: ['dex'], origen: 'manual', pendiente_revision: false },
      
      // Efectos de control
      { tag: 'helados', texto_original: 'Helados', significado: 'Enemigos afectados por daño de hielo', categoria: 'efecto', descripcion_jugabilidad: 'Los enemigos helados tienen su velocidad de movimiento reducida', sinonimos: ['frozen', 'congelados', 'hielo'], origen: 'manual', pendiente_revision: false },
      { tag: 'congelados', texto_original: 'Congelados', significado: 'Enemigos completamente congelados e incapacitados', categoria: 'condicion', descripcion_jugabilidad: 'Los enemigos congelados no pueden moverse ni atacar temporalmente', sinonimos: ['frozen', 'helados'], origen: 'manual', pendiente_revision: false },
      { tag: 'aturdidos', texto_original: 'Aturdidos', significado: 'Enemigos incapacitados temporalmente', categoria: 'condicion', descripcion_jugabilidad: 'Los enemigos aturdidos no pueden atacar ni usar habilidades', sinonimos: ['stunned'], origen: 'manual', pendiente_revision: false },
      { tag: 'control_de_multitudes', texto_original: 'Control de Multitudes', significado: 'Efectos que limitan las acciones de los enemigos', categoria: 'mecanica', descripcion_jugabilidad: 'Incluye aturdimiento, congelación, ralentización, etc.', sinonimos: ['cc', 'crowd_control'], origen: 'manual', pendiente_revision: false },
      
      // Estados del enemigo
      { tag: 'saludable', texto_original: 'Saludable', significado: 'Enemigos con más del 80% de vida', categoria: 'condicion', descripcion_jugabilidad: 'Algunos efectos se activan solo contra enemigos saludables', sinonimos: ['healthy'], origen: 'manual', pendiente_revision: false },
      { tag: 'danio', texto_original: 'Daño', significado: 'Reducción de puntos de vida del enemigo', categoria: 'efecto', descripcion_jugabilidad: 'El daño puede ser físico, elemental o de otro tipo', sinonimos: ['damage'], origen: 'manual', pendiente_revision: false },
      { tag: 'sanacion', texto_original: 'Sanación', significado: 'Recuperación de puntos de vida', categoria: 'efecto', descripcion_jugabilidad: 'Restaura vida del personaje', sinonimos: ['healing', 'curacion'], origen: 'manual', pendiente_revision: false },
      
      // Mecánicas de combate
      { tag: 'golpe_critico', texto_original: 'Golpe Crítico', significado: 'Ataque que causa daño aumentado', categoria: 'mecanica', descripcion_jugabilidad: 'Los golpes críticos causan un daño base de 150% (puede aumentarse)', sinonimos: ['crit', 'critico'], origen: 'manual', pendiente_revision: false },
      { tag: 'probabilidad_de_golpe_critico', texto_original: 'Probabilidad de Golpe Crítico', significado: 'Posibilidad de realizar un golpe crítico', categoria: 'atributo', descripcion_jugabilidad: 'Porcentaje de probabilidad de que un ataque sea crítico', sinonimos: ['crit_chance'], origen: 'manual', pendiente_revision: false },
      { tag: 'danio_de_golpe_critico', texto_original: 'Daño de Golpe Crítico', significado: 'Multiplicador de daño en golpes críticos', categoria: 'atributo', descripcion_jugabilidad: 'Aumenta el daño causado por golpes críticos por encima del 150% base', sinonimos: ['crit_damage'], origen: 'manual', pendiente_revision: false },
    ];

    const now = new Date().toISOString();
    this.tagsData.tags = defaultTags.map(tag => ({
      ...tag,
      id: this.generateTagId(tag.tag),
      fecha_creacion: now,
      fecha_actualizacion: now
    }));

    this.tagsData.ultima_actualizacion = now;
    
    console.log('✅ Tags por defecto creados:', this.tagsData.tags.length);
    await this.saveTags();
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

  // Obtener tag por ID o por tag normalizado
  // Primero intenta buscar por ID, luego por tag normalizado (ej: "golpe_critico")
  static getTagById(idOrTag: string): TagGlobal | undefined {
    // Intentar buscar por ID primero
    let tag = this.tagsData.tags.find(t => t.id === idOrTag);
    
    // Si no se encuentra, buscar por tag normalizado
    if (!tag) {
      tag = this.tagsData.tags.find(t => t.tag === idOrTag);
    }
    
    return tag;
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
