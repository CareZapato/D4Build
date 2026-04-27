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

// ========================================
// TIPOS PARA TESTING DE INTEGRIDAD (v0.8.4+)
// ========================================

/** Resultado de un test individual de importación */
export interface IntegrityTestResult {
  id: string;                          // ID único del test
  jsonFileName: string;                // Nombre del archivo JSON probado
  categoria: string;                   // Categoría del JSON (skills, glifos, etc.)
  timestamp: string;                   // Momento del test
  success: boolean;                    // Si el test pasó
  errorMessage?: string;               // Mensaje de error si falló
  expectedElements: number;            // Elementos esperados según JSON
  savedElements: number;               // Elementos efectivamente guardados
  failedElements: string[];            // IDs de elementos que fallaron
  warningElements: string[];           // Elementos guardados con advertencias (v0.8.6)
  executionTimeMs: number;             // Tiempo de ejecución en milisegundos
  validationErrors: string[];          // Errores de validación específicos
}

/** Diferencia entre archivo original y generado */
export interface FileDifference {
  fileName: string;                    // Nombre del archivo comparado
  fileType: 'hero' | 'character' | 'mundo' | 'tags' | 'config';
  hasChanges: boolean;                 // Si hay diferencias
  originalSize: number;                // Tamaño del archivo original (bytes)
  generatedSize: number;               // Tamaño del archivo generado (bytes)
  addedFields: string[];               // Campos agregados en el generado
  removedFields: string[];             // Campos removidos del original
  modifiedFields: Array<{              // Campos modificados
    field: string;
    originalValue: any;
    generatedValue: any;
  }>;
  structuralIssues: string[];          // Problemas estructurales detectados
}

/** Métricas agregadas de los tests */
export interface IntegrityTestMetrics {
  totalTests: number;                  // Total de tests ejecutados
  passedTests: number;                 // Tests que pasaron
  failedTests: number;                 // Tests que fallaron
  totalExpected: number;               // Total de elementos esperados
  totalSaved: number;                  // Total de elementos guardados
  totalFailed: number;                 // Total de elementos fallados
  totalWarnings: number;               // Total de elementos con advertencias (v0.8.6)
  successRate: number;                 // Tasa de éxito (0-100)
  averageExecutionTimeMs: number;      // Tiempo promedio de ejecución
  categoriesBreakdown: Array<{         // Desglose por categoría
    categoria: string;
    total: number;
    passed: number;
    failed: number;
  }>;
}

/** Reporte completo de integridad */
export interface IntegrityReport {
  id: string;                          // ID único del reporte
  timestamp: string;                   // Momento de generación
  workspacePath: string;               // Ruta del workspace temporal usado
  metrics: IntegrityTestMetrics;       // Métricas agregadas
  testResults: IntegrityTestResult[];  // Resultados individuales de tests
  fileDifferences: FileDifference[];   // Diferencias entre archivos
  diagnosticPrompt: string;            // Prompt generado para IA
  recommendations: string[];           // Recomendaciones para mejoras
  criticalIssues: string[];            // Problemas críticos detectados
}

/** Estado del proceso de testing */
export interface IntegrityTestProgress {
  status: 'idle' | 'running' | 'completed' | 'error';
  currentTest: number;                 // Test actual
  totalTests: number;                  // Total de tests
  currentFileName: string;             // Archivo siendo procesado
  message: string;                     // Mensaje de estado
  progressPercent: number;             // Progreso 0-100
}

// ========================================
// METADATA DE JSONs GUARDADOS (v0.8.7+)
// ========================================

/** Metadata que acompaña a cada JSON guardado en galería */
export interface JSONMetadata {
  categoria: string;                   // Categoría del JSON (skills, glifos, etc.)
  timestamp: string;                   // Momento del guardado (ISO)
  
  // Inputs de destino (común a todas las categorías)
  destino: 'heroe' | 'personaje';      // Dónde se importa
  clase?: string;                      // Si destino es heroe
  personajeId?: string;                // Si destino es personaje
  personajeNombre?: string;            // Nombre del personaje (informativo)
  personajeNivel?: number;             // Nivel del personaje (informativo)
  personajeClase?: string;             // Clase del personaje (informativo)
  
  // Inputs específicos por categoría
  paragonType?: 'tablero' | 'nodo' | 'atributos';  // Para categoria 'paragon'
  runaGemaType?: 'runas' | 'gemas';    // Para categoria 'runas'
  mundoType?: 'eventos' | 'mazmorras_aspectos';  // Para categoria 'mundo'
  talismanType?: 'charms' | 'horadric_seal';  // Para categoria 'talismanes'
  
  // Metadata adicional
  manualElementCount?: number | null;  // Override manual de cantidad de elementos
  version?: string;                    // Versión de la app que guardó el JSON
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
// TIPOS PARA MECÁNICAS DE CLASE (v0.8.0)
// ============================================================================

// Palabra clave específica de mecánica de clase
export interface PalabraClaveClase {
  tag: string;                    // "sagrado"
  texto_original: string;         // "sagradas"
  significado: string;            // "Habilidades o efectos de daño divino o bendito."
  categoria: string;              // "tipo_daño" | "atributo" | "efecto" | etc.
  fuente: 'mecanica_clase';       // Siempre 'mecanica_clase' para este tipo
}

// Selección individual de mecánica (ej: un juramento específico)
export interface SeleccionMecanica {
  id: string;                     // "juramento_disciple"
  nombre: string;                 // "Disciple"
  categoria: string;              // "juramento" | "libro_hechizo" | "arsenal" | etc.
  grupo: string;                  // "juramento_principal" | "juramento_secundario" | etc.
  nivel: number;                  // Nivel actual de la selección
  nivel_maximo: number;           // Nivel máximo permitido
  activo: boolean;                // Si está actualmente activo/seleccionado
  efecto: string;                 // Descripción principal del efecto
  detalles: string[];             // Array de detalles/descripciones adicionales
  tags: string[];                 // Tags para búsqueda y filtrado
}

// Mecánica de clase completa
export interface MecanicaClase {
  id: string;                     // "mecanica_paladin_juramentos"
  nombre: string;                 // "Juramentos"
  tipo: 'mecanica_clase';         // Tipo fijo para identificación
  clase: string;                  // "Paladín" | "Bárbaro" | "Hechicero" | etc.
  selecciones: SeleccionMecanica[]; // Array de opciones seleccionables
  palabras_clave?: PalabraClaveClase[]; // Glosario de términos (opcional en personaje)
}

// Datos de mecánicas a nivel de héroe (múltiples mecánicas por clase)
export interface MecanicasClaseHeroe {
  mecanicas: MecanicaClase[];
}

// Referencia a mecánica de clase en personaje (solo IDs y estado)
export interface MecanicaClaseReferencia {
  id: string;                     // ID de la mecánica en el héroe
  selecciones_activas: string[];  // IDs de las selecciones activas
  notas?: string;                 // Notas adicionales del jugador
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

// ==========================================
// Tipos para Sistema de Progresión del Mundo (v0.9.0)
// ==========================================

export interface ObjetivoEvento {
  tipo: 'kill' | 'completar' | 'recolectar' | 'explorar' | 'defender';
  descripcion: string;
  progreso?: {
    actual: number | null;
    max: number | null;
  };
}

export interface RequisitoEvento {
  tipo: 'material' | 'llave' | 'nivel' | 'quest' | 'currency';
  nombre: string;
  cantidad: number;
  id_recurso?: string; // ID del nodo que genera este recurso (para linking)
}

export interface RecompensaEvento {
  tipo: 'material' | 'loot' | 'currency' | 'acceso' | 'experiencia' | 'fragmento';
  nombre: string;
  cantidad: number | null;
  probabilidad?: 'alta' | 'media' | 'baja' | null;
  garantizado: boolean;
  id_recurso?: string; // ID único del recurso generado (para linking)
}

export interface TiempoEvento {
  expira_en?: string | null; // "3 días", "24h", ISO timestamp, etc.
  tiempo_completar?: string | null; // Tiempo estimado: "5 min", "15 min"
  cooldown?: string | null; // Tiempo de recarga si es repetible
}

export interface EventoMundo {
  id: string; // Único identificador
  nombre: string;
  tipo: 'guarida' | 'susurro' | 'evento' | 'calabozo' | 'legion' | 'reserva';
  subtipo?: 'boss' | 'tarea' | 'ritual' | 'mapa' | 'elite' | 'evento_mundial';
  boss?: string | null; // Nombre del boss si aplica
  objetivo: ObjetivoEvento;
  requisitos: RequisitoEvento[];
  recompensas: RecompensaEvento[];
  tiempo?: TiempoEvento;
  ubicacion?: string; // Región/zona del mapa
  dificultad?: 'normal' | 'pesadilla' | 'tortura' | 'otro';
  repetible: boolean;
  descripcion: string;
  tags: string[]; // Tags: "boss", "farm", "endgame", "time_limited", etc.
  notas?: string; // Notas adicionales del usuario
}

export interface RelacionEvento {
  from: string; // ID del evento origen
  to: string; // ID del evento destino
  tipo: 'requiere' | 'genera' | 'desbloquea' | 'farm' | 'precondicion';
  recurso?: string | null; // Recurso involucrado en la relación
  descripcion?: string; // Descripción de la relación
  cantidad?: number | null; // Cantidad del recurso si aplica
}

export interface GrafoProgresion {
  nodos: string[]; // Lista de IDs de eventos
  relaciones: RelacionEvento[];
}

export interface PasoRuta {
  paso: number;
  evento_id: string;
  evento_nombre: string;
  tipo: string;
  motivo: string; // Explicación de por qué está en la ruta
  recursos_obtenidos?: string[]; // Qué recursos se obtienen
  recursos_consumidos?: string[]; // Qué recursos se consumen
}

export interface RutaOptima {
  objetivo: string; // Descripción del objetivo
  objetivo_recurso?: string; // Recurso específico que se busca
  pasos: PasoRuta[];
  eficiencia?: string; // Evaluación de la ruta
  tiempo_estimado?: string;
  repetible: boolean;
}

export interface IndiceRecurso {
  recurso: string; // Nombre del recurso
  tipo: 'material' | 'llave' | 'currency' | 'loot' | 'acceso';
  generado_por: string[]; // IDs de eventos que lo generan
  requerido_por: string[]; // IDs de eventos que lo requieren
  probabilidad_drop?: 'alta' | 'media' | 'baja' | null;
}

export interface AnalisisEconomia {
  tipo_economia: 'lineal' | 'circular' | 'mixta' | 'jerarquica';
  cuellos_botella: string[]; // Recursos difíciles de conseguir
  eventos_clave: string[]; // IDs de eventos críticos para progresión
  loops_farm: string[][]; // Arrays de IDs de eventos que forman loops
  recursos_escasos: string[]; // Recursos con pocos generadores
  recursos_abundantes: string[]; // Recursos con muchos generadores
  recomendaciones: string[]; // Sugerencias para optimizar
}

export interface DatosMundo {
  eventos: EventoMundo[];
  grafo: GrafoProgresion;
  indice_recursos: IndiceRecurso[];
  rutas_sugeridas?: RutaOptima[];
  analisis?: AnalisisEconomia;
  version: string;
  ultima_actualizacion: string; // ISO timestamp
  temporada?: string; // Temporada del juego si aplica
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
      en_batalla?: boolean;        // (v0.6.2) true si está en la barra de habilidades activas
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
    nivel_maximo?: number;  // Nivel máximo del glifo (por defecto 150, Temporada 7)
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
  // Referencias a runas equipadas (v0.5.4) - Máximo 4: 2 invocación, 2 ritual
  runas_refs?: Array<{
    runa_id: string;                    // ID de la runa en el catálogo del héroe
    vinculada_a?: 'arma' | 'escudo';    // A qué arma está vinculada (opcional)
  }>;
  // Build completa del personaje (v0.5.4)
  build?: Build;                        // Equipamiento completo del personaje
  // Referencias a mecánicas de clase (v0.8.0)
  mecanicas_clase_refs?: MecanicaClaseReferencia[];
  // Referencias a talismanes equipados (Temporada 13 - v0.8.1)
  talismanes_refs?: string[];  // IDs de talismanes (charms) del catálogo del héroe
  // Datos de mundo asociados al personaje (v0.8.6)
  mundo?: {
    eventos?: any[];     // Eventos de mundo asociados
    mazmorras?: any[];   // Mazmorras asociadas
  };
  notas?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  ultima_actualizacion?: string; // Fecha de última modificación (cualquier importación/edición)
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
  incluir_mecanicas?: boolean;
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

// ============================================================================
// RUNAS, GEMAS Y BUILD (v0.5.4)
// ============================================================================

/**
 * Runa - Runa de Invocación o Ritual
 * Las runas se equipan en armas (máx 4 por personaje: 2 invocación, 2 ritual)
 */
export interface Runa {
  id: string;
  nombre: string;                        // Ej: "EФM", "CHAC", "YAX", "LUM"
  rareza: 'legendario' | 'raro' | 'magico';
  tipo: 'invocacion' | 'ritual';         // Invocación: requiere ofrenda | Ritual: obtiene ofrenda
  efecto: string;                        // Descripción del efecto
  requerimiento?: {
    tipo: 'requiere' | 'obtiene';        // Requiere ofrenda o Obtiene ofrenda
    ofrenda: number;                     // Cantidad de ofrenda
  };
  descripcion?: string;                  // Texto en cursiva (ej: "Se vincula con una Runa de Ritual...")
  puede_desguazar?: boolean;             // Si se puede desguazar o no
  objeto_origen?: string;                // Ej: "Objeto de Vessel of Hatred"
  valor_venta?: number;
  en_bolsas?: number;
  tags?: string[];
}

/**
 * RunasHeroe - Catálogo de runas del héroe
 */
export interface RunasHeroe {
  runas: Runa[];
}

/**
 * Gema - Gema que se inserta en engarces del equipo
 * Cada gema tiene efectos diferentes según dónde se inserte (arma, armadura, joyas)
 */
export interface EfectoSlot {
  valor: number;
  unidad: 'plano' | 'porcentaje';
  atributo: string;
  descripcion: string;
  tags?: string[];
}

export interface Gema {
  id: string;
  tipo_objeto?: string;                  // "gema" (para consistencia con otros tipos)
  nombre: string;                        // Ej: "Cráneo Marqués", "Topacio Impecable"
  tipo?: string;                         // Tipo de gema: "craneo", "topacio", "esmeralda", etc. (DEPRECATED en favor de calidad)
  calidad?: string;                      // Calidad: "marqués", "impecable", "sin pulir", etc.
  rango_calidad?: number;                // Nivel numérico del tier (1, 2, 3...)
  requerimientos?: {
    nivel?: number;                      // Nivel mínimo requerido
  };
  
  // Efectos antiguos (DEPRECATED - mantener para compatibilidad retroactiva)
  efectos?: {
    arma?: string;                       // Efecto textual cuando se inserta en arma
    armadura?: string;                   // Efecto textual cuando se inserta en armadura
    joyas?: string;                      // Efecto textual cuando se inserta en joyas (anillos/amuleto)
  };
  
  // Efectos nuevos (estructura completa con valor, unidad, tags)
  efectos_por_slot?: {
    arma?: EfectoSlot;                   // Efecto estructurado para arma
    armadura?: EfectoSlot;               // Efecto estructurado para armadura
    joyas?: EfectoSlot;                  // Efecto estructurado para joyas
  };
  
  descripcion_lore?: string;             // Texto descriptivo / lore
  descripcion?: string;                  // Texto descriptivo adicional (DEPRECATED)
  nivel_requerido?: number;              // (DEPRECATED - usar requerimientos.nivel)
  valor_venta?: number;
  en_bolsas?: number;                    // Cantidad en inventario (acumulable)
  
  clasificacion?: {
    perfil_general?: string[];           // Ej: ["ofensivo", "defensivo", "hibrido"]
    afinidades?: string[];               // Ej: ["cuerpo_a_cuerpo", "distancia"]
  };
  
  tags?: string[];
}

// ============================================
// Tipos para Talismanes (Temporada 13)
// ============================================

/**
 * EfectoTalisman - Efecto de un talismán
 */
export interface EfectoTalisman {
  tipo: 'pasivo' | 'condicion' | 'proc' | 'stacking';
  descripcion: string;
  valor?: number | string;
  condicion?: string; // Solo si tipo='condicion'
  stacks?: number; // Solo si tipo='stacking'
  tags?: string[];
}

/**
 * StatTalisman - Estadística de un talismán
 */
export interface StatTalisman {
  nombre: string;
  valor: number | string;
  tipo?: 'plano' | 'porcentaje' | 'multiplicador';
  tags?: string[];
}

/**
 * BonusSet - Bonificación de set progresiva
 */
export interface BonusSet {
  piezas_requeridas: number; // Cantidad de piezas necesarias
  descripcion: string; // Descripción del bonus
  stats?: StatTalisman[]; // Stats adicionales del bonus
}

/**
 * SetTalisman - Información del set al que pertenece un talismán
 */
export interface SetTalisman {
  nombre: string;
  piezas: string[]; // IDs de los talismanes del set
  bonus: BonusSet[]; // Bonos progresivos (2, 4, 6 piezas, etc.)
}

/**
 * Charm - Talismán/Charm equipable en el Sello Horádrico
 */
export interface Charm {
  id: string;
  nombre: string;
  rareza: 'rare' | 'unique' | 'set';
  nivel_item?: number;
  nivel_requerido?: number;
  stats: StatTalisman[];
  efectos: EfectoTalisman[];
  set?: SetTalisman; // Solo si rareza='set'
  descripcion?: string;
  lore?: string;
  tags?: string[];
}

/**
 * CharmsHeroe - Catálogo de talismanes del héroe
 */
export interface CharmsHeroe {
  talismanes: Charm[];
}

/**
 * ReglaHoradricSeal - Regla/Restricción del Sello Horádrico
 */
export interface ReglaHoradricSeal {
  tipo: 'restriccion' | 'bonus' | 'sinergía' | 'penalizacion';
  descripcion: string;
  condicion?: string;
}

/**
 * HoradricSeal - Núcleo del sistema de talismanes
 */
export interface HoradricSeal {
  id: string;
  nombre: string;
  rareza: 'rare' | 'legendary';
  slots: number; // CRÍTICO: cantidad de espacios para talismanes
  nivel_item?: number;
  nivel_requerido?: number;
  stats: StatTalisman[];
  bonus: string[]; // Bonificaciones base del sello
  reglas: ReglaHoradricSeal[];
  descripcion?: string;
  tags?: string[];
}

/**
 * HoradricSealHeroe - Sello Horádrico del héroe
 */
export interface HoradricSealHeroe {
  sello: HoradricSeal | null;
}

/**
 * TalismanesHeroe - Datos completos de talismanes del héroe (usado por WorkspaceService)
 */
export interface TalismanesHeroe {
  talismanes: Charm[];
  sello_horadrico: HoradricSeal | null;
}

/**
 * GemasHeroe - Catálogo de gemas del héroe
 */
export interface GemasHeroe {
  gemas: Gema[];
}

/**
 * GemasRunasCatalogo - Catálogo global compartido para runas y gemas
 */
export interface GemasRunasCatalogo {
  runas: Runa[];
  gemas: Gema[];
}

/**
 * Engarce - Espacio en una pieza de equipo para insertar runa o gema
 */
export interface Engarce {
  tipo: 'runa' | 'gema' | 'vacio';       // Tipo de engarce
  runa_id?: string;                      // ID de runa del catálogo (si tipo='runa')
  gema_id?: string;                      // ID de gema del catálogo (si tipo='gema')
  calidad_runa?: 'invocacion' | 'ritual'; // Si es runa, tipo de runa
}

/**
 * PiezaEquipo - Pieza individual de equipo/armadura
 * Representa yelmo, peto, guantes, anillos, armas, etc.
 */
export interface PiezaEquipo {
  id: string;
  nombre: string;                        // Ej: "Yelmo Excepcional Frenético"
  espacio: 'yelmo' | 'peto' | 'guantes' | 'pantalones' | 'botas' | 'arma' | 'amuleto' | 'anillo1' | 'anillo2' | 'escudo';
  tipo: string;                          // Ej: "Yelmo ancestral legendario", "Peto ancestral", etc.
  categoria?: 'ancestral' | 'excepcional' | 'normal';
  rareza: 'legendario' | 'raro' | 'magico' | 'normal';
  poder_objeto?: number;                 // Poder del objeto (Ej: 800)
  armadura?: number;                     // Valor de armadura (solo para armaduras)
  atributos: Array<{                     // Atributos de la pieza
    texto: string;                       // Texto completo del atributo
    valor?: string | number;             // Valor numérico extraído
    tipo?: string;                       // Tipo: 'fuerza', 'vida_maxima', 'resistencia', etc.
  }>;
  efectos_especiales?: Array<{           // Efectos especiales (Desenfreno, Hambre, etc.)
    nombre?: string;                     // Nombre del efecto: "Desenfreno", "Hambre"
    descripcion: string;                 // Descripción completa del efecto
    color?: 'rojo' | 'naranja' | 'verde' | 'azul' | 'morado'; // Color para UI
  }>;
  aspecto_id?: string;                   // Referencia al aspecto del catálogo (si tiene)
  aspecto_vinculado_id?: string;         // ID del aspecto del catálogo al que se vincula este equipo
  aspecto_descripcion_diferencia?: string; // Texto del aspecto tal como aparece en el arma (prevalece sobre catálogo)
  engarces?: Engarce[];                  // Lista de engarces disponibles
  durabilidad?: {
    actual: number;
    maxima: number;
  };
  templados?: {                          // Sistema de templado
    usados: number;
    maximos: number;
  };
  nivel_requerido?: number;
  objeto_origen?: string;                // Ej: "Objeto de Lord of Hatred"
  valor_venta?: number;
  tags?: string[];
}

/**
 * Build - Conjunto completo de equipamiento del personaje
 */
export interface Build {
  id: string;
  nombre?: string;                       // Nombre personalizado de la build
  fecha_creacion: string;
  fecha_actualizacion?: string;
  piezas: {
    yelmo?: PiezaEquipo;
    peto?: PiezaEquipo;
    guantes?: PiezaEquipo;
    pantalones?: PiezaEquipo;
    botas?: PiezaEquipo;
    arma?: PiezaEquipo;
    amuleto?: PiezaEquipo;
    anillo1?: PiezaEquipo;
    anillo2?: PiezaEquipo;
    escudo?: PiezaEquipo;                // Segunda arma / escudo
  };
  runas_equipadas?: Array<{              // Runas equipadas (máx 4)
    runa_id: string;                     // ID de runa del catálogo
    vinculada_a: 'arma' | 'escudo';      // A qué arma está vinculada
  }>;
  poder_total?: number;                  // Poder total de la build (suma de todas las piezas)
  atributos_totales?: {                  // Resumen de atributos totales
    fuerza?: number;
    inteligencia?: number;
    voluntad?: number;
    destreza?: number;
    vida_maxima?: number;
    armadura_total?: number;
    // ... otros atributos agregados
  };
}
