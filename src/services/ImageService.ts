export type ImageCategory = 'skills' | 'glifos' | 'aspectos' | 'estadisticas' | 'otros';

export interface SavedImage {
  nombre: string;
  categoria: ImageCategory;
  fecha: string;
  blob: Blob;
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
    const match = fileName.match(/_(\d{13})\.png$/);
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
            
            images.push({
              nombre: entry.name,
              categoria,
              fecha: new Date(timestamp).toISOString(),
              blob
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

  // Eliminar una imagen
  static async deleteImage(categoria: ImageCategory, nombreArchivo: string): Promise<void> {
    const categoryFolder = await this.ensureCategoryImagesFolder(categoria);
    await categoryFolder.removeEntry(nombreArchivo);
    console.log(`🗑️ Imagen eliminada: imagenes/${categoria}/${nombreArchivo}`);
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
}
