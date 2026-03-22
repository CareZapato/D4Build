// Tipos para Palabras Clave (sistema transversal)
export interface PalabraClave {
  id: string;
  palabra: string;
  descripcion: string;
  categoria?: 'atributo' | 'efecto' | 'condicion' | 'recurso' | 'otro';
  fecha_creacion?: string;
}

export interface PalabrasClaveGlobales {
  palabras: PalabraClave[];
}

// Tipos para Tags (v0.3.5+) - Sistema de etiquetas globales
export interface TagGlobal {
  id: string;                           // ID único generado (ej: "tag_golpe_critico_12345")
  tag: string;                          // Versión normalizada: "golpe_critico"
  texto_original: string;               // Como aparece: "golpe crítico"
  significado: string | null;           // Definición del tooltip
  categoria: 'atributo' | 'efecto' | 'condicion' | 'recurso' | 'mecanica' | 'tipo_de_danio' | 'defensivo' | 'otro';
  descripcion_jugabilidad?: string | null;  // Notas adicionales sobre el uso
  sinonimos: string[];                  // Palabras alternativas
  origen: 'tooltip' | 'estadistica' | 'manual' | 'habilidad' | 'aspecto' | 'glifo';
  pendiente_revision: boolean;          // true si falta información
  fecha_creacion: string;               // ISO timestamp
  fecha_actualizacion?: string;         // ISO timestamp de última modificación
}

export interface TagsData {
  tags: TagGlobal[];
  ultima_actualizacion: string;
}


// Tipos para Habilidades
export type TipoHabilidad = 'skill' | 'modificador' | 'pasiva';

export interface GeneraRecurso {
  tipo: string;
  cantidad: number;
}

export interface CostaRecurso {
  tipo: string;
  cantidad: number | string;
}

export interface SiguienteRango {
  [key: string]: number | string;
}

export interface Modificador {
  nombre: string;
  descripcion: string;
  efectos?: string[];
  tags?: string[]; // IDs de tags del repositorio global
}

export interface EfectoGenerado {
  nombre: string;
  duracion_segundos?: number;
  descripcion?: string;
  efectos?: string[];
  tags?: string[]; // IDs de tags del repositorio global
}

export interface EfectoPasivo {
  efectos: string[];
  tags?: string[]; // IDs de tags del repositorio global
}

export interface EfectoActivo {
  efecto: string;
  tags?: string[]; // IDs de tags del repositorio global
}

export interface HabilidadActiva {
  id?: string;
  nombre: string;
  tipo_habilidad: TipoHabilidad; // 'skill' | 'modificador' | 'pasiva'
  tipo: string; // Tipo de skill (ej: 'Básica', 'Principal', etc.)
  subtipo?: string;
  rama: string;
  nivel: number;
  nivel_maximo?: number; // Nivel máximo de la habilidad
  categoria?: 'activa' | 'pasiva';
  genera_recurso?: GeneraRecurso;
  costo_recurso?: CostaRecurso;
  recuperacion_segundos?: number;
  descripcion: string;
  tipo_danio?: string;
  requiere?: string;
  siguiente_rango?: SiguienteRango;
  modificadores: Modificador[];
  efectos_generados?: EfectoGenerado[];
  pasiva?: EfectoPasivo;
  activa?: EfectoActivo;
  tags?: string[]; // IDs de tags del repositorio global
  skill_padre?: string; // ID de la skill base (solo para modificadores)
}

export interface HabilidadPasiva {
  id?: string;
  nombre: string;
  tipo_habilidad: TipoHabilidad; // 'skill' | 'modificador' | 'pasiva'
  nivel: number | null;
  nivel_maximo?: number;
  efecto: string;
  tipo?: string;
  categoria?: 'activa' | 'pasiva';
  descripcion?: string;
  bonificaciones?: string[];
  bonificacion_danio_actual?: string;
  siguiente_rango?: SiguienteRango;
  tags?: string[]; // IDs de tags del repositorio global
  skill_padre?: string; // ID de la skill base (solo para modificadores)
}

export interface HabilidadesPersonaje {
  habilidades_activas: HabilidadActiva[];
  habilidades_pasivas: HabilidadPasiva[];
}

// Tipos para Glifos
export interface AtributoEscalado {
  atributo: string;
  cada: number;
  bonificacion: string;
  condicion?: string;
}

export interface Requisito {
  atributo: string;
  valor_actual?: number;
  valor_requerido: number;
  condicion?: string;
}

export interface BonificacionAdicional {
  descripcion: string;
  requisito?: Requisito;
}

export interface RequiereMejora {
  rareza: string;
  desbloqueo_nivel: number;
}

export interface BonificacionLegendaria {
  descripcion: string;
  requiere_mejora?: RequiereMejora | string;
}

export interface EfectoBase {
  descripcion: string;
}

export interface TextoReferencia {
  [key: string]: string;
}

export interface Glifo {
  id?: string;
  nombre: string;
  rareza: string;
  estado: string;
  bloqueado?: boolean;
  tamano_radio: number;
  nivel_actual?: number;
  atributo_escalado?: AtributoEscalado;
  efecto_base?: EfectoBase;
  bonificacion_adicional?: BonificacionAdicional;
  bonificacion_legendaria?: BonificacionLegendaria;
  texto_referencia?: TextoReferencia;
  palabras_clave?: string[]; // IDs de palabras clave
}

export interface GlifosHeroe {
  glifos: Glifo[];
}

// Tipos para Aspectos
export interface Aspecto {
  id: string;
  name: string;
  shortName: string;
  effect: string;
  level: string; // e.g., "3/21"
  category: 'ofensivo' | 'defensivo' | 'movilidad' | 'recurso' | 'utilidad';
  keywords: string[]; // Palabras simples para búsqueda rápida
  tags: string[];
  palabras_clave?: string[]; // IDs de palabras clave detalladas
}

export interface AspectosHeroe {
  aspectos: Aspecto[];
}

// Interface para detalles de estadísticas (v0.3.1)
export interface DetalleEstadistica {
  texto: string;               // Texto descriptivo del detalle
  valor?: string | number;     // Valor específico si aplica
  contribucion?: string;       // De dónde viene (ej: "Contribución de objetos: 0")
  palabras_clave?: string[];   // Keywords específicas de este detalle
}

// Tipos para Personajes
export interface Personaje {
  id: string;
  nombre: string;
  clase: string;
  nivel: number;
  nivel_paragon?: number;
  // Solo referencias a habilidades del héroe
  habilidades_refs?: {
    activas: string[];  // IDs de habilidades activas del héroe
    pasivas: string[];  // IDs de habilidades pasivas del héroe
  };
  // Solo referencias a glifos del héroe con su nivel
  glifos_refs?: Array<{
    id: string;  // ID del glifo en el héroe
    nivel_actual: number;  // Nivel específico del personaje
    nivel_maximo?: number;  // Nivel máximo del glifo (por defecto 100)
  }>;
  // Referencias a aspectos del héroe
  aspectos_refs?: string[]; // IDs de aspectos equipados
  estadisticas?: Estadisticas;
  notas?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface EstadisticasPersonaje {
  danioArma?: number;
  aguante?: number;
  aguante_definicion?: string;  // Definición explicativa del aguante (v0.3.1)
  detalles?: DetalleEstadistica[];  // Detalles generales del personaje (v0.3.1)
  palabras_clave?: string[];        // Keywords de estadísticas del personaje (v0.3.1)
}

export interface AtributosBase {
  fuerza?: number;
  inteligencia?: number;
  voluntad?: number;
  destreza?: number;
  detalles?: DetalleEstadistica[];  // Detalles de atributos (v0.3.1)
  palabras_clave?: string[];        // Keywords (v0.3.1)
}

export interface Defensivo {
  vidaMaxima?: number;
  cantidadPociones?: number;
  sanacionRecibida?: number;
  vidaPorEliminacion?: number;
  vidaCada5Segundos?: number;
  probabilidadBloqueo?: number;
  reduccionBloqueo?: number;
  bonificacionFortificacion?: number;
  bonificacionBarrera?: number;
  probabilidadEsquivar?: number;
  detalles?: DetalleEstadistica[];  // Detalles defensivos (v0.3.1)
  palabras_clave?: string[];        // Keywords defensivas (v0.3.1)
}

export interface Utilidad {
  maximoFe?: number;
  reduccionCostoFe?: number;
  regeneracionFe?: number;
  feConCadaEliminacion?: number;
  velocidadMovimiento?: number;
  reduccionRecuperacion?: number;
  bonificacionProbabilidadGolpeAfortunado?: number;
  bonificacionExperiencia?: number;
  detalles?: DetalleEstadistica[];  // Detalles de utilidad (v0.3.1)
  palabras_clave?: string[];        // Keywords (v0.3.1)
}

export interface JcJ {
  reduccionDanio?: number;
}

export interface Obolos {
  actual?: number;
  maximo?: number;
}

export interface Moneda {
  oro?: string;
  obolos?: Obolos;
  polvoRojo?: number;
  marcasPalidas?: number;
  monedasDelAlcazar?: number;
  favor?: number;
  carneFresca?: string;
}

export interface AtributosPrincipales {
  nivel?: number;
  fuerza?: number;
  inteligencia?: number;
  voluntad?: number;
  destreza?: number;
  detalles?: DetalleEstadistica[];  // Detalles de atributos (v0.3.1)
  palabras_clave?: string[];        // Keywords (v0.3.1)
}

export interface ArmaduraYResistencias {
  aguante?: number;
  armadura?: number;
  resistenciaDanioFisico?: number;
  resistenciaFuego?: number;
  resistenciaRayo?: number;
  resistenciaFrio?: number;
  resistenciaVeneno?: number;
  resistenciaSombra?: number;
  detalles?: DetalleEstadistica[];  // Detalles de resistencias (v0.3.1)
  palabras_clave?: string[];        // Keywords (v0.3.1)
}

export interface Ofensivo {
  danioBaseArma?: number;
  velocidadArma?: number;
  bonificacionVelocidadAtaque?: number;
  probabilidadGolpeCritico?: number;
  danioGolpeCritico?: number;
  probabilidadAbrumar?: number;
  danioAbrumador?: number;
  danioContraEnemigosVulnerables?: number;
  todoElDanio?: number;
  danioConSangrado?: number;
  danioConQuemadura?: number;
  danioConVeneno?: number;
  danioConCorrupcion?: number;
  danioVsEnemigosElite?: number;
  danioVsEnemigosSaludables?: number;
  espinas?: number;
  detalles?: DetalleEstadistica[];  // Detalles ofensivos (v0.3.1)
  palabras_clave?: string[];        // Keywords (v0.3.1)
}

export interface Estadisticas {
  personaje?: EstadisticasPersonaje;
  atributosBase?: AtributosBase;
  defensivo?: Defensivo;
  utilidad?: Utilidad;
  jcj?: JcJ;
  moneda?: Moneda;
  atributosPrincipales?: AtributosPrincipales;
  armaduraYResistencias?: ArmaduraYResistencias;
  ofensivo?: Ofensivo;
}

// Tipos para el Workspace
export interface WorkspaceConfig {
  ruta: string;
  fecha_creacion: string;
  ultima_actualizacion: string;
}

// Tipos para filtros y búsquedas
export interface FiltroHabilidad {
  tipo?: string;
  rama?: string;
  nombre?: string;
}

export interface FiltroGlifo {
  rareza?: string;
  estado?: string;
  atributo?: string;
  nombre?: string;
}

// Tipos para generación de prompts
export interface PromptConfig {
  incluir_habilidades: boolean;
  incluir_glifos: boolean;
  incluir_estadisticas: boolean;
  pregunta_personalizada?: string;
}

export interface PromptGenerado {
  prompt: string;
  fecha_generacion: string;
  personaje: string;
}

// ============================================================================
// MODELO REFACTORIZADO DE ESTADÍSTICAS v2 (v0.3.4)
// ============================================================================
// Nuevo modelo con tags estructurados y gestión global de palabras clave
// Soporta extracción parcial de información y enriquecimiento progresivo

/**
 * Tag - Palabra clave inline con información estructurada
 * Usado en estadísticas y detalles para marcar conceptos del juego
 */
export interface Tag {
  tag: string;                    // Versión normalizada en español: "golpe_critico"
  texto_original: string;         // Como aparece en imagen: "golpe crítico"
  significado: string | null;     // Definición del tooltip o null si no está disponible
  categoria?: string;             // "atributo", "efecto", "condicion", "recurso", "mecanica", etc.
  fuente?: string;                // "tooltip", "estadistica", "manual"
}

/**
 * DetalleEstadisticaV2 - Versión actualizada con soporte para tags estructurados
 * Representa sub-items y contribuciones de una estadística
 */
export interface DetalleEstadisticaV2 {
  texto: string;                  // Descripción completa del detalle
  tipo?: string;                  // "bonificacion", "contribucion", "efecto", "aclaracion", "composicion"
  valor?: number | null;          // Valor numérico si aplica
  unidad?: string | null;         // "%", "puntos", "por_segundo", etc.
  contribucion?: string | null;   // "objetos", "paragon", "objetos_y_paragon", "base_y_otras_fuentes", "inherente"
  tags?: Tag[];                   // Tags específicos menc ionados en este detalle
}

/**
 * EstadisticaV2 - Estadística individual del personaje
 * Modelo estructurado para capturar toda la información visible en el juego
 */
export interface EstadisticaV2 {
  id: string;                     // Identificador único: "probabilidad_de_golpe_critico"
  nombre: string;                 // Nombre visible: "Probabilidad de golpe crítico"
  categoria: string;              // "atributo_principal", "ofensivo", "defensivo", "recurso", etc.
  valor: number | string;         // Valor principal de la estadística
  unidad: string;                 // Unidad: "%", "puntos", "por_segundo"
  descripcion?: string | null;    // Descripción general (del tooltip principal)
  detalles?: DetalleEstadisticaV2[]; // Sub-items, contribuciones y efectos
  tags?: Tag[];                   // Tags relevantes agregados de la estadística y sus detalles
}

/**
 * PalabraClaveGlobal - Entrada en el diccionario global de palabras clave
 * Permite gestión centralizada y enriquecimiento progresivo
 */
export interface PalabraClaveGlobal {
  tag: string;                         // Identificador normalizado: "golpe_critico"
  texto_original: string;              // Texto original del juego: "golpe crítico"
  significado: string | null;          // Definición completa o null si no está disponible
  categoria?: string;                  // Categoría de la palabra clave
  descripcion_jugabilidad?: string | null; // Cómo afecta al gameplay (enriquecimiento manual)
  sinonimos?: string[];                // Variantes: ["critico", "crit", "golpe critico"]
  origen?: string;                     // De dónde se extrajo: "tooltip", "estadistica", "manual"
  pendiente_revision: boolean;         // true si falta información (significado null)
}

/**
 * EstadisticasV2 - Contenedor principal de estadísticas agrupadas por categoría
 */
export interface EstadisticasV2 {
  atributos_principales?: EstadisticaV2[];
  ofensivo?: EstadisticaV2[];
  defensivo?: EstadisticaV2[];
  recursos?: EstadisticaV2[];
  armadura_y_resistencias?: EstadisticaV2[];
  utilidad?: EstadisticaV2[];
  jcj?: EstadisticaV2[];
  moneda?: Moneda; // Mantener estructura actual
}

/**
 * NivelV2 - Información completa del nivel del personaje
 * Incluye detalles sobre mecánicas y bonificaciones por nivel
 */
export interface NivelV2 {
  nivel: number;                      // Nivel actual del personaje (1-60)
  descripcion?: string | null;        // Descripción general del sistema de niveles
  detalles?: DetalleEstadisticaV2[];  // Detalles específicos (reducción de daño, etc.)
  tags?: Tag[];                       // Tags relacionados con niveles
}

/**
 * EstadisticasConPalabrasClave - Raíz del JSON refactorizado
 * Incluye tanto las estadísticas como el diccionario global
 */
export interface EstadisticasConPalabrasClave {
  nivel?: NivelV2;                    // Información del nivel del personaje
  nivel_paragon?: number;             // Nivel Paragon (separado, 1-300)
  estadisticas: EstadisticasV2;
  palabras_clave: PalabraClaveGlobal[];
}
