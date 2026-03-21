// Tipos para Habilidades
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
}

export interface EfectoGenerado {
  nombre: string;
  duracion_segundos?: number;
  descripcion?: string;
  efectos?: string[];
}

export interface EfectoPasivo {
  efectos: string[];
}

export interface EfectoActivo {
  efecto: string;
}

export interface HabilidadActiva {
  id?: string;
  nombre: string;
  tipo: string;
  subtipo?: string;
  rama: string;
  nivel: number;
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
}

export interface HabilidadPasiva {
  id?: string;
  nombre: string;
  nivel: number | null;
  efecto: string;
  tipo?: string;
  categoria?: 'activa' | 'pasiva';
  descripcion?: string;
  bonificaciones?: string[];
  bonificacion_danio_actual?: string;
  siguiente_rango?: SiguienteRango;
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
  keywords: string[];
  tags: string[];
}

export interface AspectosHeroe {
  aspectos: Aspecto[];
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
}

export interface AtributosBase {
  fuerza?: number;
  inteligencia?: number;
  voluntad?: number;
  destreza?: number;
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
