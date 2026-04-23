export type ImageCategory = 'skills' | 'glifos' | 'aspectos' | 'mecanicas' | 'estadisticas' | 'paragon' | 'otros' | 'runas' | 'gemas' | 'build' | 'mundo' | 'talismanes';

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

  // Carpeta real de almacenamiento (runas/gemas comparten gemas_runas)
  private static resolveStorageCategory(categoria: ImageCategory): string {
    if (categoria === 'runas' || categoria === 'gemas') {
      return 'gemas_runas';
    }
    return categoria;
  }

  // Carpetas de lectura, con compatibilidad legacy
  private static resolveReadCategories(categoria: ImageCategory): string[] {
    if (categoria === 'runas' || categoria === 'gemas') {
      return ['gemas_runas', 'runas', 'gemas'];
    }
    return [categoria];
  }

  private static async ensureImagesFolder(): Promise<FileSystemDirectoryHandle> {
    if (!this.fileSystemHandle) {
      throw new Error('No hay workspace seleccionado');
    }

    return await this.fileSystemHandle.getDirectoryHandle('imagenes', { create: true });
  }

  private static async getCategoryFolderByName(categoryName: string, create: boolean): Promise<FileSystemDirectoryHandle | null> {
    try {
      const imagesFolder = await this.ensureImagesFolder();
      const folder = await imagesFolder.getDirectoryHandle(categoryName, { create });
      return folder;
    } catch {
      return null;
    }
  }

  private static async getReadCategoryFolders(categoria: ImageCategory): Promise<Array<{ name: string; handle: FileSystemDirectoryHandle }>> {
    const folderNames = this.resolveReadCategories(categoria);
    const folders: Array<{ name: string; handle: FileSystemDirectoryHandle }> = [];

    for (const name of folderNames) {
      const handle = await this.getCategoryFolderByName(name, false);
      if (handle) {
        folders.push({ name, handle });
      }
    }

    return folders;
  }

  // Crear estructura /imagenes/{categoria}
  private static async ensureCategoryImagesFolder(categoria: ImageCategory): Promise<FileSystemDirectoryHandle> {
    const imagesFolder = await this.ensureImagesFolder();
    const storageCategory = this.resolveStorageCategory(categoria);
    const categoryFolder = await imagesFolder.getDirectoryHandle(storageCategory, { create: true });
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
    const jsonFileName = imageName.replace(/\.png$/, '.json');
    const folders = await this.getReadCategoryFolders(categoria);

    for (const folder of folders) {
      try {
        await folder.handle.getFileHandle(jsonFileName);
        return true;
      } catch {
        // probar siguiente carpeta
      }
    }

    return false;
  }

  // Cargar JSON asociado a una imagen
  static async loadImageJSON(categoria: ImageCategory, imageName: string): Promise<any | null> {
    const jsonFileName = imageName.replace(/\.png$/, '.json');
    const folders = await this.getReadCategoryFolders(categoria);

    for (const folder of folders) {
      try {
        const fileHandle = await folder.handle.getFileHandle(jsonFileName);
        const file = await fileHandle.getFile();
        const content = await file.text();
        return JSON.parse(content);
      } catch {
        // probar siguiente carpeta
      }
    }

    return null;
  }

  // Eliminar JSON asociado a una imagen
  static async deleteImageJSON(categoria: ImageCategory, imageName: string): Promise<void> {
    const jsonFileName = imageName.replace(/\.png$/, '.json');
    const folders = await this.getReadCategoryFolders(categoria);

    for (const folder of folders) {
      try {
        await folder.handle.removeEntry(jsonFileName);
        console.log(`🗑️ JSON eliminado: imagenes/${folder.name}/${jsonFileName}`);
      } catch {
        // si no existe en esa carpeta, continuar
      }
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
      const categoryFolders = await this.getReadCategoryFolders(categoria);
      if (categoryFolders.length === 0) {
        return [];
      }

      const images: SavedImage[] = [];
      const seenNames = new Set<string>();

      for (const folder of categoryFolders) {
        // @ts-ignore - AsyncIterator no está completamente tipado
        for await (const entry of folder.handle.values()) {
          if (entry.kind === 'file' && entry.name.endsWith('.png')) {
            if (seenNames.has(entry.name)) continue;
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
              seenNames.add(entry.name);
            } catch (err) {
              console.warn(`No se pudo cargar imagen: ${entry.name}`, err);
            }
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
    const folders = await this.getReadCategoryFolders(categoria);
    let deleted = false;

    for (const folder of folders) {
      try {
        await folder.handle.removeEntry(nombreArchivo);
        console.log(`🗑️ Imagen eliminada: imagenes/${folder.name}/${nombreArchivo}`);
        deleted = true;
      } catch {
        // continuar
      }
    }

    if (!deleted) {
      console.warn(`No se encontró imagen para eliminar: ${nombreArchivo}`);
    }
    
    // Intentar eliminar JSON asociado
    await this.deleteImageJSON(categoria, nombreArchivo);
  }

  // Cargar una imagen específica
  static async loadImage(categoria: ImageCategory, nombreArchivo: string): Promise<Blob | null> {
    const folders = await this.getReadCategoryFolders(categoria);

    for (const folder of folders) {
      try {
        const fileHandle = await folder.handle.getFileHandle(nombreArchivo);
        const file = await fileHandle.getFile();
        return new Blob([await file.arrayBuffer()], { type: 'image/png' });
      } catch {
        // probar siguiente carpeta
      }
    }

    return null;
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
    const jsonFileName = nombreArchivo.endsWith('.json')
      ? nombreArchivo
      : nombreArchivo.replace(/\.png$/, '.json');
    const folders = await this.getReadCategoryFolders(categoria);

    for (const folder of folders) {
      try {
        const fileHandle = await folder.handle.getFileHandle(jsonFileName);
        const file = await fileHandle.getFile();
        return await file.text();
      } catch {
        // probar siguiente carpeta
      }
    }

    return null;
  }

  // Listar entradas de galería: imágenes (con/sin JSON) + JSONs huérfanos
  static async listGalleryEntries(categoria: ImageCategory): Promise<GalleryEntry[]> {
    try {
      const categoryFolders = await this.getReadCategoryFolders(categoria);
      if (categoryFolders.length === 0) {
        return [];
      }

      const pngMap = new Map<string, File>();
      const jsonSet = new Set<string>();

      for (const folder of categoryFolders) {
        // @ts-ignore
        for await (const entry of folder.handle.values()) {
          if (entry.kind === 'file') {
            if (entry.name.endsWith('.png')) {
              if (!pngMap.has(entry.name)) {
                try { pngMap.set(entry.name, await entry.getFile()); } catch { /* skip */ }
              }
            } else if (entry.name.endsWith('.json')) {
              jsonSet.add(entry.name);
            }
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
