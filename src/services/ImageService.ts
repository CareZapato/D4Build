export type ImageCategory = 'skills' | 'glifos' | 'aspectos' | 'estadisticas' | 'paragon' | 'otros';

export interface SavedImage {
  nombre: string;
  categoria: ImageCategory;
  fecha: string;
  blob: Blob;
  hasJSON?: boolean; // Indica si existe un JSON asociado
}

/** Entrada de galería: imagen con/sin JSON, o JSON solo (sin imagen) */
export interface GalleryEntry {
  nombre: string;
  categoria: ImageCategory;
  fecha: string;
  blob: Blob | null;
  hasJSON: boolean;
  isJSONOnly: boolean;
}

/**
 * ImageService - Servicio para guardar y cargar imágenes en el workspace
 */
export class ImageService {
  private static fileSystemHandle: FileSystemDirectoryHandle | null = null;

  // Establecer el handle del directorio del workspace
  static setFileSystemHandle(handle: FileSystemDirectoryHandle | null): void {
    this.fileSystemHandle = handle;
  }

  private static extractTimestampFromFileName(fileName: string): number {
    const match = fileName.match(/_(\d{13})\.(png|json)$/);
    if (match) {
      return Number(match[1]);
    }
    return 0;
  }

  // Crear estructura /imagenes/{categoria}
  private static async ensureCategoryImagesFolder(categoria: ImageCategory): Promise<FileSystemDirectoryHandle> {
    if (!this.fileSystemHandle) {
      throw new Error('No hay workspace seleccionado');
    }

    const imagesFolder = await this.fileSystemHandle.getDirectoryHandle('imagenes', { create: true });
    const categoryFolder = await imagesFolder.getDirectoryHandle(categoria, { create: true });
    return categoryFolder;
  }

  // Guardar imagen en la categoría correspondiente
  static async saveImage(
    imageBlob: Blob,
    categoria: ImageCategory,
    nombreBase: string = 'captura'
  ): Promise<string> {
    const categoryFolder = await this.ensureCategoryImagesFolder(categoria);
    
    // Generar nombre único con timestamp
    const timestamp = Date.now();
    const nombreArchivo = `${nombreBase}_${timestamp}.png`;
    
    // Guardar archivo
    const fileHandle = await categoryFolder.getFileHandle(nombreArchivo, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(imageBlob);
    await writable.close();
    
    console.log(`✅ Imagen guardada: imagenes/${categoria}/${nombreArchivo}`);
    return nombreArchivo;
  }

  // Guardar JSON asociado a una imagen
  static async saveImageJSON(
    jsonContent: string,
    categoria: ImageCategory,
    imageName: string
  ): Promise<string> {
    const categoryFolder = await this.ensureCategoryImagesFolder(categoria);
    
    // Generar nombre JSON basado en el nombre de la imagen
    const jsonFileName = imageName.replace(/\.png$/, '.json');
    
    // Guardar archivo JSON
    const fileHandle = await categoryFolder.getFileHandle(jsonFileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(jsonContent);
    await writable.close();
    
    console.log(`✅ JSON guardado: imagenes/${categoria}/${jsonFileName}`);
    return jsonFileName;
  }

  // Verificar si existe JSON para una imagen
  static async hasJSON(categoria: ImageCategory, imageName: string): Promise<boolean> {
    try {
      const categoryFolder = await this.ensureCategoryImagesFolder(categoria);
      const jsonFileName = imageName.replace(/\.png$/, '.json');
      await categoryFolder.getFileHandle(jsonFileName);
      return true;
    } catch {
      return false;
    }
  }

  // Cargar JSON asociado a una imagen
  static async loadImageJSON(categoria: ImageCategory, imageName: string): Promise<any | null> {
    try {
      const categoryFolder = await this.ensureCategoryImagesFolder(categoria);
      const jsonFileName = imageName.replace(/\.png$/, '.json');
      const fileHandle = await categoryFolder.getFileHandle(jsonFileName);
      const file = await fileHandle.getFile();
      const content = await file.text();
      return JSON.parse(content);
    } catch (error) {
      console.error(`Error cargando JSON ${imageName}:`, error);
      return null;
    }
  }

  // Eliminar JSON asociado a una imagen
  static async deleteImageJSON(categoria: ImageCategory, imageName: string): Promise<void> {
    try {
      const categoryFolder = await this.ensureCategoryImagesFolder(categoria);
      const jsonFileName = imageName.replace(/\.png$/, '.json');
      await categoryFolder.removeEntry(jsonFileName);
      console.log(`🗑️ JSON eliminado: imagenes/${categoria}/${jsonFileName}`);
    } catch (error) {
      console.warn(`No se pudo eliminar JSON para ${imageName}:`, error);
    }
  }

  // Listar todas las imágenes con JSONs de una categoría
  static async listImagesWithJSON(categoria: ImageCategory): Promise<SavedImage[]> {
    const images = await this.listImages(categoria);
    const imagesWithJSONCheck = await Promise.all(
      images.map(async (img) => ({
        ...img,
        hasJSON: await this.hasJSON(categoria, img.nombre)
      }))
    );
    return imagesWithJSONCheck.filter(img => img.hasJSON);
  }

  // Listar todas las imágenes de una categoría
  static async listImages(categoria: ImageCategory): Promise<SavedImage[]> {
    try {
      const categoryFolder = await this.ensureCategoryImagesFolder(categoria);
      const images: SavedImage[] = [];

      // @ts-ignore - AsyncIterator no está completamente tipado
      for await (const entry of categoryFolder.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.png')) {
          try {
            const file = await entry.getFile();
            const blob = new Blob([await file.arrayBuffer()], { type: 'image/png' });
            const timestamp = this.extractTimestampFromFileName(entry.name) || file.lastModified;
            const hasJSON = await this.hasJSON(categoria, entry.name);
            
            images.push({
              nombre: entry.name,
              categoria,
              fecha: new Date(timestamp).toISOString(),
              blob,
              hasJSON
            });
          } catch (err) {
            console.warn(`No se pudo cargar imagen: ${entry.name}`, err);
          }
        }
      }

      // Ordenar por fecha (más recientes primero)
      images.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      return images;
    } catch (error) {
      console.error(`Error listando imágenes de ${categoria}:`, error);
      return [];
    }
  }

  // Eliminar una imagen (y su JSON si existe)
  static async deleteImage(categoria: ImageCategory, nombreArchivo: string): Promise<void> {
    const categoryFolder = await this.ensureCategoryImagesFolder(categoria);
    await categoryFolder.removeEntry(nombreArchivo);
    console.log(`🗑️ Imagen eliminada: imagenes/${categoria}/${nombreArchivo}`);
    
    // Intentar eliminar JSON asociado
    await this.deleteImageJSON(categoria, nombreArchivo);
  }

  // Cargar una imagen específica
  static async loadImage(categoria: ImageCategory, nombreArchivo: string): Promise<Blob | null> {
    try {
      const categoryFolder = await this.ensureCategoryImagesFolder(categoria);
      const fileHandle = await categoryFolder.getFileHandle(nombreArchivo);
      const file = await fileHandle.getFile();
      return new Blob([await file.arrayBuffer()], { type: 'image/png' });
    } catch (error) {
      console.error(`Error cargando imagen ${nombreArchivo}:`, error);
      return null;
    }
  }

  // Guardar JSON sin imagen asociada (entrada de galería solo-JSON)
  static async saveJSONOnly(
    jsonContent: string,
    categoria: ImageCategory,
    baseName: string = 'dato'
  ): Promise<string> {
    const categoryFolder = await this.ensureCategoryImagesFolder(categoria);
    const timestamp = Date.now();
    const jsonFileName = `${baseName}_${timestamp}.json`;
    const fileHandle = await categoryFolder.getFileHandle(jsonFileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(jsonContent);
    await writable.close();
    console.log(`✅ JSON independiente guardado: imagenes/${categoria}/${jsonFileName}`);
    return jsonFileName;
  }

  // Cargar texto raw del JSON asociado a un archivo (PNG o JSON directo)
  static async loadJSONText(categoria: ImageCategory, nombreArchivo: string): Promise<string | null> {
    try {
      const categoryFolder = await this.ensureCategoryImagesFolder(categoria);
      const jsonFileName = nombreArchivo.endsWith('.json')
        ? nombreArchivo
        : nombreArchivo.replace(/\.png$/, '.json');
      const fileHandle = await categoryFolder.getFileHandle(jsonFileName);
      const file = await fileHandle.getFile();
      return await file.text();
    } catch {
      return null;
    }
  }

  // Listar entradas de galería: imágenes (con/sin JSON) + JSONs huérfanos
  static async listGalleryEntries(categoria: ImageCategory): Promise<GalleryEntry[]> {
    try {
      const categoryFolder = await this.ensureCategoryImagesFolder(categoria);
      const pngMap = new Map<string, File>();
      const jsonSet = new Set<string>();

      // @ts-ignore
      for await (const entry of categoryFolder.values()) {
        if (entry.kind === 'file') {
          if (entry.name.endsWith('.png')) {
            try { pngMap.set(entry.name, await entry.getFile()); } catch { /* skip */ }
          } else if (entry.name.endsWith('.json')) {
            jsonSet.add(entry.name);
          }
        }
      }

      const entries: GalleryEntry[] = [];

      // Entradas con imagen
      for (const [pngName, file] of pngMap) {
        const blob = new Blob([await file.arrayBuffer()], { type: 'image/png' });
        const timestamp = this.extractTimestampFromFileName(pngName) || file.lastModified;
        const hasJSON = jsonSet.has(pngName.replace(/\.png$/, '.json'));
        entries.push({ nombre: pngName, categoria, fecha: new Date(timestamp).toISOString(), blob, hasJSON, isJSONOnly: false });
      }

      // JSONs huérfanos (sin PNG correspondiente)
      for (const jsonName of jsonSet) {
        const correspondingPng = jsonName.replace(/\.json$/, '.png');
        if (!pngMap.has(correspondingPng)) {
          const timestamp = this.extractTimestampFromFileName(jsonName) || Date.now();
          entries.push({ nombre: jsonName, categoria, fecha: new Date(timestamp).toISOString(), blob: null, hasJSON: true, isJSONOnly: true });
        }
      }

      entries.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      return entries;
    } catch (error) {
      console.error(`Error listando galería de ${categoria}:`, error);
      return [];
    }
  }
}
