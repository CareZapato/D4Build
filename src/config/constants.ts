/**
 * Constantes de configuración de D4Builds
 * 
 * Valores configurables para la aplicación.
 * Los administradores pueden modificar estos valores según la temporada actual.
 */

/**
 * Nivel máximo de glifos en la temporada actual
 * 
 * - Temporada 7: 150
 * - Temporadas anteriores: 100
 * 
 * Este valor se usa para:
 * - Límite superior en inputs de nivel de glifo
 * - Valor por defecto en nivel_maximo al importar glifos
 * - Validaciones en la UI
 */
export const MAX_GLYPH_LEVEL = 150;

/**
 * Nivel máximo de aspectos legendarios
 * 
 * Los aspectos pueden mejorarse hasta nivel 21
 */
export const MAX_ASPECT_LEVEL = 21;

/**
 * Nivel máximo de personaje base (sin Paragon)
 */
export const MAX_CHARACTER_LEVEL = 60;

/**
 * Nivel máximo de Paragon
 */
export const MAX_PARAGON_LEVEL = 300;

/**
 * Cantidad máxima de habilidades activas equipables
 */
export const MAX_ACTIVE_SKILLS = 6;

/**
 * Cantidad máxima de glifos equipables
 */
export const MAX_EQUIPPED_GLYPHS = 4;

/**
 * Cantidad máxima de runas equipables
 */
export const MAX_EQUIPPED_RUNES = 4;
