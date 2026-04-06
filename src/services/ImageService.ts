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

  // Crear carpeta img dentro de una categoría
  private static async ensureImgFolder(categoria: ImageCategory): Promise<FileSystemDirectoryHandle> {
    if (!this.fileSystemHandle) {
      throw new Error('No hay workspace seleccionado');
    }

    // Crear carpeta de la categoría si no existe
    const categoryFolder = await this.fileSystemHandle.getDirectoryHandle(categoria, { create: true });
    
    // Crear subcarpeta img
    const imgFolder = await categoryFolder.getDirectoryHandle('img', { create: true });
    
    return imgFolder;
  }

  // Guardar imagen en la categoría correspondiente
  static async saveImage(
    imageBlob: Blob,
    categoria: ImageCategory,
    nombreBase: string = 'captura'
  ): Promise<string> {
    const imgFolder = await this.ensureImgFolder(categoria);
    
    // Generar nombre único con timestamp
    const timestamp = Date.now();
    const nombreArchivo = `${nombreBase}_${timestamp}.png`;
    
    // Guardar archivo
    const fileHandle = await imgFolder.getFileHandle(nombreArchivo, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(imageBlob);
    await writable.close();
    
    console.log(`✅ Imagen guardada: ${categoria}/img/${nombreArchivo}`);
    return nombreArchivo;
  }

  // Listar todas las imágenes de una categoría
  static async listImages(categoria: ImageCategory): Promise<SavedImage[]> {
    try {
      const imgFolder = await this.ensureImgFolder(categoria);
      const images: SavedImage[] = [];

      // @ts-ignore - AsyncIterator no está completamente tipado
      for await (const entry of imgFolder.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.png')) {
          try {
            const file = await entry.getFile();
            const blob = new Blob([await file.arrayBuffer()], { type: 'image/png' });
            
            images.push({
              nombre: entry.name,
              categoria,
              fecha: new Date(file.lastModified).toISOString(),
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
    const imgFolder = await this.ensureImgFolder(categoria);
    await imgFolder.removeEntry(nombreArchivo);
    console.log(`🗑️ Imagen eliminada: ${categoria}/img/${nombreArchivo}`);
  }

  // Cargar una imagen específica
  static async loadImage(categoria: ImageCategory, nombreArchivo: string): Promise<Blob | null> {
    try {
      const imgFolder = await this.ensureImgFolder(categoria);
      const fileHandle = await imgFolder.getFileHandle(nombreArchivo);
      const file = await fileHandle.getFile();
      return new Blob([await file.arrayBuffer()], { type: 'image/png' });
    } catch (error) {
      console.error(`Error cargando imagen ${nombreArchivo}:`, error);
      return null;
    }
  }
}
