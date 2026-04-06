import { Tag } from '../types';
import { TagService } from './TagService';

/**
 * TagLinkingService - Servicio para vincular tags normalizados con sus IDs en TagService
 * 
 * PROPÓSITO:
 * Cuando se importan datos desde JSON con IA, vienen con:
 * 1. palabras_clave: Tag[] - Objetos Tag completos (tag, texto_original, significado, etc.)
 * 2. En cada objeto (skill, glifo, aspecto): tags: string[] - Referencias normalizadas
 * 
 * Este servicio:
 * - Procesa y guarda las palabras_clave en TagService
 * - Crea un mapa tag_normalizado → tag_id
 * - Vincula los arrays tags: string[] con los IDs correspondientes
 */

export class TagLinkingService {
  /**
   * Procesa palabras_clave del JSON y retorna un mapa para vincular tags por nombre normalizado
   * @param palabrasClave - Array de objetos Tag del JSON de IA
   * @param origen - Origen de los tags (habilidad, glifo, aspecto, estadistica)
   * @returns Mapa de tag_normalizado → tag_id
   */
  static async processAndMapTags(
    palabrasClave: Tag[],
    origen: 'tooltip' | 'estadistica' | 'manual' | 'habilidad' | 'aspecto' | 'glifo'
  ): Promise<Map<string, string>> {
    const tagMap = new Map<string, string>();

    if (!palabrasClave || palabrasClave.length === 0) {
      return tagMap;
    }

    try {
      // Procesar y guardar tags, obteniendo sus IDs
      const tagIds = await TagService.processAndSaveTagsV2(palabrasClave, origen);

      // Crear mapa relacionando tag normalizado con su ID
      palabrasClave.forEach((tag, index) => {
        if (tag.tag && tagIds[index]) {
          tagMap.set(tag.tag, tagIds[index]);
        }
      });

      console.log(`TagLinkingService: ${tagIds.length} tags procesados y mapeados`);
      return tagMap;
    } catch (error) {
      console.error('Error procesando tags:', error);
      return tagMap;
    }
  }

  /**
   * Vincula un array de tags normalizados (string[]) con sus IDs correspondientes
   * @param normalizedTags - Array de strings con tags normalizados (ej: ["golpe_critico", "danio"])
   * @param tagMap - Mapa creado por processAndMapTags
   * @returns Array de IDs de tags (string[])
   */
  static linkTagsToIds(normalizedTags: string[] | undefined, tagMap: Map<string, string>): string[] {
    if (!normalizedTags || normalizedTags.length === 0) {
      return [];
    }

    const tagIds: string[] = [];

    for (const normalizedTag of normalizedTags) {
      const tagId = tagMap.get(normalizedTag);
      if (tagId) {
        tagIds.push(tagId);
      } else {
        // Si no se encuentra en el mapa, intentar buscar directamente en TagService
        const existingTag = TagService.findTagByNormalizedName(normalizedTag);
        if (existingTag?.id) {
          tagIds.push(existingTag.id);
          // Agregar al mapa para futuras búsquedas
          tagMap.set(normalizedTag, existingTag.id);
        } else {
          console.warn(`Tag no encontrado: ${normalizedTag}`);
        }
      }
    }

    return tagIds;
  }

  /**
   * Vincula tags en un objeto de habilidad activa (incluyendo modificadores)
   * @param skill - Objeto de habilidad
   * @param tagMap - Mapa de tags
   * @returns Habilidad con tags vinculados
   */
  static linkSkillTags(skill: any, tagMap: Map<string, string>): any {
    const linkedSkill = { ...skill };

    // Vincular tags de la skill principal
    if (skill.tags && Array.isArray(skill.tags) && typeof skill.tags[0] === 'string') {
      linkedSkill.tags = this.linkTagsToIds(skill.tags, tagMap);
    }

    // Vincular tags de modificadores
    if (skill.modificadores && Array.isArray(skill.modificadores)) {
      linkedSkill.modificadores = skill.modificadores.map((mod: any) => {
        if (mod.tags && Array.isArray(mod.tags) && typeof mod.tags[0] === 'string') {
          return {
            ...mod,
            tags: this.linkTagsToIds(mod.tags, tagMap)
          };
        }
        return mod;
      });
    }

    // Vincular tags de efectos generados
    if (skill.efectos_generados && Array.isArray(skill.efectos_generados)) {
      linkedSkill.efectos_generados = skill.efectos_generados.map((efecto: any) => {
        if (efecto.tags && Array.isArray(efecto.tags) && typeof efecto.tags[0] === 'string') {
          return {
            ...efecto,
            tags: this.linkTagsToIds(efecto.tags, tagMap)
          };
        }
        return efecto;
      });
    }

    // Vincular tags de pasiva
    if (skill.pasiva?.tags && Array.isArray(skill.pasiva.tags) && typeof skill.pasiva.tags[0] === 'string') {
      linkedSkill.pasiva = {
        ...skill.pasiva,
        tags: this.linkTagsToIds(skill.pasiva.tags, tagMap)
      };
    }

    // Vincular tags de activa
    if (skill.activa?.tags && Array.isArray(skill.activa.tags) && typeof skill.activa.tags[0] === 'string') {
      linkedSkill.activa = {
        ...skill.activa,
        tags: this.linkTagsToIds(skill.activa.tags, tagMap)
      };
    }

    return linkedSkill;
  }

  /**
   * Vincula tags en un objeto de glifo
   * @param glifo - Objeto de glifo
   * @param tagMap - Mapa de tags
   * @returns Glifo con tags vinculados
   */
  static linkGlyphTags(glifo: any, tagMap: Map<string, string>): any {
    const linkedGlifo = { ...glifo };

    // Vincular tags del glifo
    if (glifo.tags && Array.isArray(glifo.tags) && typeof glifo.tags[0] === 'string') {
      linkedGlifo.tags = this.linkTagsToIds(glifo.tags, tagMap);
    }

    return linkedGlifo;
  }

  /**
   * Vincula tags en un objeto de aspecto
   * @param aspecto - Objeto de aspecto
   * @param tagMap - Mapa de tags
   * @returns Aspecto con tags vinculados
   */
  static linkAspectTags(aspecto: any, tagMap: Map<string, string>): any {
    const linkedAspecto = { ...aspecto };

    // Vincular tags del aspecto
    if (aspecto.tags && Array.isArray(aspecto.tags) && typeof aspecto.tags[0] === 'string') {
      linkedAspecto.tags = this.linkTagsToIds(aspecto.tags, tagMap);
    }

    return linkedAspecto;
  }

  /**
   * Vincula tags en un objeto de estadística
   * @param estadistica - Objeto de estadística
   * @param tagMap - Mapa de tags
   * @returns Estadística con tags vinculados
   */
  static linkStatTags(estadistica: any, tagMap: Map<string, string>): any {
    const linkedStat = { ...estadistica };

    // Vincular tags de la estadística
    if (estadistica.tags && Array.isArray(estadistica.tags) && typeof estadistica.tags[0] === 'string') {
      linkedStat.tags = this.linkTagsToIds(estadistica.tags, tagMap);
    }

    return linkedStat;
  }

  /**
   * Procesa un JSON de importación completo y vincula todos los tags
   * @param data - Objeto JSON con palabras_clave y objetos con tags
   * @param origen - Origen de los tags
   * @returns Objeto con tags vinculados y mapa de tags
   */
  static async processAndLinkAllTags(
    data: any,
    origen: 'tooltip' | 'estadistica' | 'manual' | 'habilidad' | 'aspecto' | 'glifo'
  ): Promise<{ linkedData: any; tagMap: Map<string, string>; tagsProcessed: number }> {
    // Extraer palabras_clave globales
    const palabrasClave = data.palabras_clave || [];

    // Procesar y mapear tags
    const tagMap = await this.processAndMapTags(palabrasClave, origen);

    // Clonar data para no modificar el original
    const linkedData = JSON.parse(JSON.stringify(data));

    // Eliminar palabras_clave del resultado (ya están en TagService)
    delete linkedData.palabras_clave;

    return {
      linkedData,
      tagMap,
      tagsProcessed: palabrasClave.length
    };
  }
}
