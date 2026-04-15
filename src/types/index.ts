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
  id?: string;                    // ID único del modificador
  nombre: string;
  tipo_habilidad?: TipoHabilidad; // Debe ser 'modificador' típicamente
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
  requisito?: Requisito | string; // Puede ser objeto Requisito o string directo
  requisito_texto?: string; // Almacena el texto original si se parsea desde string
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
  tamano_radio: number | string; // Puede ser número o string como "4 nodos"
  nivel_actual?: number;
  nivel_requerido?: number;
  nivel_maximo?: number;
  requisitos_especiales?: string | null;
  atributo_escalado?: AtributoEscalado | null;
  efecto_base?: EfectoBase | string | null; // Puede ser objeto o string directo
  bonificacion_adicional?: BonificacionAdicional | null;
  bonificacion_legendaria?: BonificacionLegendaria | null;
  detalles?: DetalleEstadistica[];  // Detalles con campo 'activo' (v0.5.4)
  texto_referencia?: TextoReferencia;
  tags?: string[]; // IDs de tags globales
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
  tags?: string[]; // IDs de tags globales
}

export interface AspectosHeroe {
  aspectos: Aspecto[];
}

// ============================================================================
// TIPOS PARA SISTEMA PARAGON (v0.4.15)
// ============================================================================

// Tipos de atributos Paragon
export type TipoAtributoParagon = 
  | 'fuerza' | 'destreza' | 'inteligencia' | 'voluntad'
  | 'vida_maxima' | 'resistencia_todos_elementos' | 'armadura'
  | 'daño' | 'probabilidad_golpe_critico' | 'daño_golpe_critico'
  | 'velocidad_ataque' | 'reduccion_cooldown' | 'otro';

// Categorías de nodos Paragon
export type CategoriaTablerParagon = 'inicial' | 'legendario' | 'especial' | 'general';
export type RarezaNodo = 'normal' | 'magico' | 'raro' | 'legendario';

// Tablero Paragon (catálogo nivel héroe)
export interface TableroParagon {
  id: string;                        // "tablero_empezar" | "tablero_clamor_ancestros"
  nombre: string;                    // "Empezar" | "Clamor de los Ancestros"
  categoria: CategoriaTablerParagon; // inicial | legendario | especial | general
  descripcion?: string;              // Descripción del tablero
  orden?: number;                    // Orden de colocación (0 = central, 1+ = consecuentes)
  conexiones_disponibles?: string[]; // IDs de tableros que pueden conectarse
  nodos_totales?: number;            // Total de nodos en el tablero
  tags?: string[];                   // Tags globales
}

export interface TablerosParagonHeroe {
  tableros: TableroParagon[];
}

// Nodo Normal Paragon
export interface NodoNormalParagon {
  id: string;                        // "nodo_fuerza_01"
  nombre: string;                    // "+5 Fuerza"
  rareza: 'normal';
  tipo_atributo: TipoAtributoParagon;
  valor: string | number;            // "+5" | "5"
  detalles?: DetalleEstadistica[];   // Detalles con efectos (v0.5.3)
  replicas?: number;                 // Cantidad de nodos idénticos (v0.5.3 - omitir si es 1)
  tablero_id?: string;               // ID del tablero al que pertenece
  posicion?: { x: number; y: number }; // Posición en el tablero (opcional)
  tags?: string[];
}

// Nodo Mágico Paragon
export interface NodoMagicoParagon {
  id: string;                        // "nodo_magico_danio_01"
  nombre: string;                    // "+3% Daño"
  rareza: 'magico';
  atributos: Array<{
    tipo: TipoAtributoParagon;
    valor: string | number;
  }>;
  detalles?: DetalleEstadistica[];   // Detalles con efectos (v0.5.3)
  requisitos?: {                     // Requisitos para bonificación (v0.5.3)
    atributo: 'fuerza' | 'inteligencia' | 'voluntad' | 'destreza';
    valor_actual: number;
    valor_requerido: number;
  };
  replicas?: number;                 // Cantidad de nodos idénticos (v0.5.3 - omitir si es 1)
  tablero_id?: string;
  posicion?: { x: number; y: number };
  tags?: string[];
}

// Nodo Raro Paragon
export interface NodoRaroParagon {
  id: string;                        // "nodo_raro_fuerza_vida"
  nombre: string;                    // "Fuerza y Vida"
  rareza: 'raro';
  atributos: Array<{
    tipo: TipoAtributoParagon;
    valor: string | number;
    condicion?: string;              // Condición para activar el bono
  }>;
  detalles?: DetalleEstadistica[];   // Detalles con efectos (cada uno con campo 'activo') (v0.5.3)
  bonificacion?: {                   // Bonificación extra si cumple requisitos (v0.5.3)
    descripcion: string;
    requisitos?: string;             // Descripción de requisitos
  };
  requisitos?: {                     // Requisitos numéricos para bonificación (v0.5.3)
    atributo: 'fuerza' | 'inteligencia' | 'voluntad' | 'destreza';
    valor_actual: number;
    valor_requerido: number;
  };
  replicas?: number;                 // Cantidad de nodos idénticos (v0.5.3 - omitir si es 1)
  efecto_adicional?: string;         // Efecto especial del nodo
  tablero_id?: string;
  posicion?: { x: number; y: number };
  tags?: string[];
}

// Nodo Legendario Paragon
export interface NodoLegendarioParagon {
  id: string;                        // "nodo_leg_consagrada_fuerza"
  nombre: string;                    // "Consagrada Fuerza" | "Velocidad del Leviatán"
  rareza: 'legendario';
  descripcion: string;               // Descripción completa del efecto
  tipo: 'pasivo' | 'activo';         // Si otorga efecto pasivo o activa habilidad
  bonificacion_principal: string;    // Bonificación principal
  bonificaciones_secundarias?: string[]; // Bonificaciones adicionales
  detalles?: DetalleEstadistica[];   // Detalles con efectos (v0.5.3)
  requisitos?: string;               // Requisitos para activar (texto descriptivo)
  requisitos_numericos?: {           // Requisitos numéricos (v0.5.3)
    atributo: 'fuerza' | 'inteligencia' | 'voluntad' | 'destreza';
    valor_actual: number;
    valor_requerido: number;
  };
  replicas?: number;                 // Cantidad de nodos idénticos (v0.5.3 - omitir si es 1)
  tablero_id?: string;               // Tablero donde se encuentra
  posicion?: { x: number; y: number };
  tags?: string[];
}

// Zócalo de Glifo (ranura especial en tableros Paragon)
export interface ZocaloGlifoParagon {
  id: string;                        // "zocalo_tablero_empezar_01"
  nombre: string;                    // "Zócalo de Glifo"
  tablero_id: string;                // ID del tablero donde está el zócalo
  glifo_equipado_id?: string;        // ID del glifo equipado (opcional)
  nivel_glifo?: number;              // Nivel del glifo equipado
  radio_bonus?: number;              // Radio de bonificación del glifo
  detalles?: DetalleEstadistica[];   // Detalles del zócalo y glifo (v0.5.3)
  bonificacion_adicional?: string;   // Bonificación adicional del glifo (v0.5.3)
  bonificacion_legendaria?: string;  // Bonificación legendaria del glifo (v0.5.3)
  requisitos?: {                     // Requisitos para bonificación legendaria (v0.5.3)
    descripcion: string;
    nivel_requerido?: number;
  };
  replicas?: number;                 // Cantidad de nodos idénticos (v0.5.3 - omitir si es 1)
  posicion?: { x: number; y: number };
  tags?: string[];
}

// Unión de todos los tipos de nodos
export type NodoParagon = 
  | NodoNormalParagon 
  | NodoMagicoParagon 
  | NodoRaroParagon 
  | NodoLegendarioParagon 
  | ZocaloGlifoParagon;

// Catálogo completo de nodos Paragon (nivel héroe)
export interface NodosParagonHeroe {
  nodos_normales: NodoNormalParagon[];
  nodos_magicos: NodoMagicoParagon[];
  nodos_raros: NodoRaroParagon[];
  nodos_legendarios: NodoLegendarioParagon[];
  zocalos: ZocaloGlifoParagon[];
}

// Atributo Paragon acumulado (para el personaje)
export interface AtributoParagonPersonaje {
  tipo: TipoAtributoParagon;
  valor_total: number | string;     // Valor acumulado total
  contribuciones?: Array<{           // De dónde viene el valor
    fuente: string;                  // "nodo_normal" | "nodo_raro" | "nodo_legendario"
    nodo_id: string;
    valor: number | string;
  }>;
}

// Tablero Paragon equipado por el personaje
export interface TableroParagonPersonaje {
  tablero_id: string;                // Referencia al tablero del héroe
  posicion: number;                  // Posición en el árbol (0 = central, 1-N = anexos)
  rotacion?: number;                 // Rotación del tablero (0, 90, 180, 270)
  nodos_activados: string[];         // IDs de nodos activados en este tablero
  zocalo_glifo?: {                   // Glifo equipado en el zócalo de este tablero
    zocalo_id: string;
    glifo_id: string;
    nivel_glifo: number;
  };
}

// Paragon completo del personaje
export interface ParagonPersonaje {
  nivel_paragon: number;             // Nivel Paragon actual (0-300)
  puntos_gastados: number;           // Puntos invertidos en nodos
  puntos_disponibles: number;        // Puntos disponibles para gastar
  tableros_equipados: TableroParagonPersonaje[]; // Tableros en uso
  // @deprecated (v0.5.3) - Los atributos se manejan en estadisticas.atributosPrincipales
  // atributos_acumulados: AtributoParagonPersonaje[]; // ELIMINADO: duplica atributosPrincipales
  nodos_activados_total: string[];   // Lista completa de IDs de todos los nodos activos
  glifos_equipados: Array<{          // Glifos equipados en zócalos Paragon
    zocalo_id: string;
    glifo_id: string;
    nivel: number;
  }>;
}

// Referencias Paragon del personaje (v0.5.1) - Modelo de Referencias
export interface ParagonRefs {
  tableros_equipados?: Array<{
    tablero_id: string;              // ID del tablero en el catálogo del héroe
    posicion: number;                // Posición en el árbol (0 = central, 1-N = anexos)
    rotacion?: number;               // Rotación (0, 90, 180, 270)
    nodos_activados_ids: string[];   // IDs de nodos activados en ESTE tablero específico
    zocalo_glifo?: {
      zocalo_id: string;
      glifo_id: string;              // ID del glifo del catálogo
      nivel_glifo: number;
    };
  }>;
  nodos_activados_ids?: string[];    // TODOS los IDs de nodos activos (de todos los tableros + huérfanos)
  nodos_huerfanos?: Array<{          // Nodos agregados sin tablero asignado (se enlazarán automáticamente)
    nodo_id: string;
    fecha_agregado: string;
    rareza?: string;                 // Normal, Mágico, Raro, Legendario
  }>;
}

// Atributos Paragon del personaje (datos calculados, no del catálogo) (v0.5.1)
export interface AtributosParagonPersonaje {
  nivel_paragon?: number;            // Nivel Paragon actual (0-300)
  puntos_gastados?: number;          // Puntos invertidos en nodos
  puntos_disponibles?: number;       // Puntos disponibles para gastar
  // @deprecated (v0.5.3) - Los atributos se manejan en estadisticas.atributosPrincipales con contribuciones
  // atributos_acumulados?: AtributoParagonPersonaje[];  // ELIMINADO: duplica atributosPrincipales
}

// Tipos para Estadísticas del Héroe (v0.3.7) - Modelo de Referencias
export interface EstadisticaHeroe {
  id: string;                   // ID único (ej: "stat_fuerza", "stat_aguante")
  nombre: string;               // Nombre mostrado (ej: "Fuerza", "Aguante")
  categoria: 'personaje' | 'atributosBase' | 'defensivo' | 'ofensivo' | 'utilidad' | 'jcj' | 'moneda' | 'atributosPrincipales' | 'armaduraYResistencias';
  tipo_valor: 'numero' | 'porcentaje' | 'texto';  // Tipo de dato del valor
  descripcion?: string;         // Descripción de la estadística (del tooltip)
  unidad?: string;              // Unidad de medida (ej: "%", "seg", "puntos", etc.)
  detalles?: DetalleEstadistica[];  // Detalles enriquecidos del tooltip (v0.3.7)
  palabras_clave?: string[];    // Keywords específicas (deprecated - usar tags)
  tags?: string[];              // IDs de tags globales del sistema
  subcategoria?: string;        // Subcategoría opcional (ej: "resistencias", "recursos")
}

export interface EstadisticasHeroe {
  estadisticas: EstadisticaHeroe[];
}

// Interface para detalles de estadísticas (v0.3.1, actualizado v0.3.7)
export interface DetalleEstadistica {
  texto: string;               // Texto descriptivo del detalle
  tipo?: 'contribucion' | 'bonificacion' | 'aclaracion' | 'mecanica' | 'efecto';  // Tipo de detalle (v0.3.7)
  valor?: string | number | null;     // Valor específico si aplica
  unidad?: string | null;      // Unidad del valor (v0.3.7)
  contribucion?: string | null;       // De dónde viene (ej: "objetos", "pasivas") (v0.3.7)
  activo?: boolean;            // Si el detalle está activo o inactivo (gris en UI) (v0.5.3)
  palabras_clave?: string[];   // Keywords específicas de este detalle (deprecated)
  tags?: string[];             // IDs de tags globales (v0.3.7)
}

// Tipos para Personajes
export interface Personaje {
  id: string;
  nombre: string;
  clase: string;
  nivel: number;
  nivel_paragon?: number;
  puertas_anexo?: number; // Cada puerta otorga +5 a fuerza, inteligencia, voluntad y destreza
  // Referencias a habilidades del héroe con modificadores equipados
  habilidades_refs?: {
    activas: Array<{
      skill_id: string;           // ID de la habilidad activa del héroe
      modificadores_ids: string[]; // IDs de modificadores equipados para esta skill
      nivel_actual?: number;       // Nivel específico del personaje (1-5)
    }>;
    pasivas: Array<{
      skill_id: string;            // ID de la habilidad pasiva del héroe
      puntos_asignados?: number;   // Puntos asignados por el personaje (0-3)
    }>;
  };
  // Solo referencias a glifos del héroe con su nivel
  glifos_refs?: Array<{
    id: string;  // ID del glifo en el héroe
    nivel_actual: number;  // Nivel específico del personaje
    nivel_maximo?: number;  // Nivel máximo del glifo (por defecto 100)
  }>;
  // Referencias a aspectos del héroe con nivel y valores actuales (v0.3.9)
  aspectos_refs?: Array<{
    aspecto_id: string;              // ID del aspecto en el héroe
    nivel_actual: string;             // Nivel actual del aspecto equipado (formato "X/21")
    slot_equipado?: string;           // Slot donde está equipado (ej: "Amuleto", "Pecho")
    valores_actuales: Record<string, string>;  // Valores numéricos actuales según nivel
  }> | string[];  // Retrocompatibilidad con formato antiguo
  // Referencias a estadísticas del héroe con valores específicos (v0.3.7)
  estadisticas_refs?: Array<{
  stat_id: string;           // ID de la estadística en el héroe
    valor: string | number;    // Valor específico del personaje
  }>;
  // Sistema Paragon del personaje (v0.5.1) - Modelo de Referencias
  paragon_refs?: ParagonRefs;           // Referencias a tableros/nodos del catálogo del héroe
  atributos_paragon?: AtributosParagonPersonaje;  // Datos calculados específicos del personaje
  // @deprecated (v0.5.1) - Usar paragon_refs + atributos_paragon en su lugar
  paragon?: ParagonPersonaje;
  // @deprecated (v0.3.7) - Usar estadisticas_refs en su lugar
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
  valor?: number;  // Para estructura enriquecida (equivalente a 'actual')
  atributo_ref?: string;  // Para estructura enriquecida
  atributo_nombre?: string;  // Para estructura enriquecida
  detalles?: DetalleEstadistica[];  // Para estructura enriquecida
}

export interface MonedaField {
  valor: number | string;
  atributo_ref: string;
  atributo_nombre: string;
  detalles?: DetalleEstadistica[];
}

export interface Moneda {
  oro?: string | MonedaField;
  obolos?: Obolos;
  polvoRojo?: number | MonedaField;
  marcasPalidas?: number | MonedaField;
  monedasDelAlcazar?: number | MonedaField;
  favor?: number | MonedaField;
  carneFresca?: string | MonedaField;
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
