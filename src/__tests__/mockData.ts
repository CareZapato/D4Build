// 🧪 Mock Data para Testing - D4Builds
// Datos de prueba simplificados basados en JSON reales del workspace

import type { 
  Personaje, 
  Estadisticas, 
  HabilidadesPersonaje, 
  GlifosHeroe, 
  AspectosHeroe,
  Aspecto,
  Glifo
} from '../types';

// ============================================================================
// PERSONAJES DE PRUEBA
// ============================================================================

export const mockPersonajeBasico: Personaje = {
  id: "test_personaje_001",
  nombre: "Paladín de Prueba",
  clase: "Paladín",
  nivel: 50,
  nivel_paragon: 100,
  fecha_creacion: "2026-04-23T10:00:00.000Z",
  fecha_actualizacion: "2026-04-23T10:00:00.000Z",
  ultima_actualizacion: "2026-04-23T10:00:00.000Z"
};

export const mockPersonajeCompleto: Personaje = {
  ...mockPersonajeBasico,
  id: "test_personaje_002",
  nombre: "Paladín Completo",
  puertas_anexo: 5,
  notas: "Personaje de prueba con datos completos",
  estadisticas: mockEstadisticas,
  habilidades_refs: {
    activas: [
      {
        skill_id: "skill_activa_aura_luz_sagrada",
        modificadores_ids: ["mod_luz_sagrada_potenciada", "mod_rito_piedad"],
        nivel_actual: 5,
        en_batalla: true
      },
      {
        skill_id: "skill_activa_aura_rebeldia",
        modificadores_ids: ["mod_rebeldia_potenciada", "mod_rito_espinas"],
        nivel_actual: 5,
        en_batalla: false
      }
    ],
    pasivas: [
      {
        skill_id: "skill_pasiva_longevidad",
        puntos_asignados: 3
      },
      {
        skill_id: "skill_pasiva_renovacion",
        puntos_asignados: 2
      }
    ]
  },
  glifos_refs: [
    {
      id: "glifo_disminucion",
      nivel_actual: 15,
      nivel_maximo: 21
    },
    {
      id: "glifo_espiritu",
      nivel_actual: 18,
      nivel_maximo: 21
    }
  ],
  aspectos_refs: [
    "aspecto_sabio_concurrido",
    "aspecto_valintyr",
    "aspecto_umbral"
  ],
  runas_refs: [
    {
      runa_id: "runa_feo",
      vinculada_a: "arma"
    },
    {
      runa_id: "runa_neo",
      vinculada_a: "escudo"
    }
  ]
};

// ============================================================================
// ESTADÍSTICAS DE PRUEBA
// ============================================================================

export const mockEstadisticas: Estadisticas = {
  atributosPrincipales: {
    nivel: 50,
    fuerza: 520,
    inteligencia: 180,
    voluntad: 390,
    destreza: 250
  },
  personaje: {
    danioArma: 595,
    aguante: 52619
  },
  ofensivo: {
    danioConCorrupcion: 49.0,
    danioVsEnemigosCercanos: 38.5,
    danioVsEnemigosElite: 111.8,
    danioVsEnemigosSaludables: 16.0,
    espinas: 1179
  },
  defensivo: {
    vidaMaxima: 12000,
    armadura: 8500,
    reduccionDanio: 55.0,
    esquivar: 8.0
  },
  utilidad: {
    velocidadMovimiento: 15.0,
    velocidadAtaque: 12.5
  }
};

// ============================================================================
// HABILIDADES DE PRUEBA
// ============================================================================

export const mockHabilidades: HabilidadesPersonaje = {
  clase: "Paladín",
  habilidades_activas: [
    {
      id: "skill_activa_aura_luz_sagrada",
      nombre: "Aura de Luz Sagrada",
      tipo_habilidad: "skill",
      tipo: "Defensiva",
      rama: "Justiciero",
      nivel_actual: 5,
      nivel_maximo: 5,
      descripcion: "Pasiva: Tú y tus aliados emanan Luz, la cual inflige 4,323 de daño sagrado cada 2 segundos a 3 enemigos cercanos aleatorios.",
      tipo_danio: "Sagrado",
      tags: [],
      modificadores: [
        {
          id: "mod_luz_sagrada_potenciada",
          nombre: "Luz Sagrada Potenciada",
          tipo_habilidad: "modificador",
          descripcion: "La pasiva de Luz Sagrada ahora toma como objetivo a otros 2 enemigos más.",
          tags: []
        },
        {
          id: "mod_rito_piedad",
          nombre: "Rito de la Piedad",
          tipo_habilidad: "modificador",
          descripcion: "La activa de Luz Sagrada se encadena 2 veces más y hace que tus aliados y tú se fortifiquen por un 4% de su Vida máxima.",
          tags: ["fortificar"]
        }
      ]
    },
    {
      id: "skill_activa_aura_rebeldia",
      nombre: "Aura de Rebeldía",
      tipo_habilidad: "skill",
      tipo: "Defensiva",
      rama: "Leviatán",
      nivel_actual: 5,
      nivel_maximo: 5,
      descripcion: "Pasiva: Tu presencia te refuerza a ti y a tus aliados, lo que otorga un 42% de armadura y una bonificación de un 42% a todas las resistencias.",
      tipo_danio: null,
      tags: ["imparable"],
      modificadores: [
        {
          id: "mod_rebeldia_potenciada",
          nombre: "Rebeldía Potenciada",
          tipo_habilidad: "modificador",
          descripcion: "La pasiva de Aura de Rebeldía también les otorga a tus aliados y a ti un 10% de Vida máxima.",
          tags: []
        }
      ]
    }
  ],
  habilidades_pasivas: [
    {
      id: "skill_pasiva_longevidad",
      nombre: "Longevidad",
      tipo_habilidad: "pasiva",
      tipo: "Pasiva",
      rama: null,
      nivel: 3,
      nivel_maximo: 3,
      efecto: "Obtienes un 30% de la sanación recibida.",
      puntos_asignados: 3,
      tags: []
    },
    {
      id: "skill_pasiva_renovacion",
      nombre: "Renovación",
      tipo_habilidad: "pasiva",
      tipo: "Pasiva",
      rama: null,
      nivel: 2,
      nivel_maximo: 3,
      efecto: "Bloquear te fortifica por un 1.0% de tu Vida máxima.",
      puntos_asignados: 2,
      tags: ["fortificar"]
    }
  ],
  palabras_clave: [
    {
      tag: "fortificar",
      texto_original: "fortificar",
      significado: "Fortificar es una reserva adicional de Vida que se drena para sanarte con el tiempo.",
      categoria: "mecanica",
      fuente: "tooltip"
    },
    {
      tag: "imparable",
      texto_original: "imparable",
      significado: "No puedes ser afectado por efectos de control de multitudes.",
      categoria: "estado",
      fuente: "habilidad"
    }
  ]
};

// ============================================================================
// GLIFOS DE PRUEBA
// ============================================================================

export const mockGlifos: GlifosHeroe = {
  clase: "Paladín",
  glifos: [
    {
      id: "glifo_disminucion",
      nombre: "Disminución",
      rareza: "Raro",
      nivel_requerido: 1,
      efecto_base: "Otorga una bonificación del +25.0% a todos los nodos raros dentro del alcance.",
      atributo_escalado: null,
      bonificacion_adicional: {
        requisito: "40 de Fuerza",
        descripcion: "Recibes un 15% menos de daño físico de enemigos vulnerables."
      },
      bonificacion_legendaria: {
        requisito: null,
        descripcion: "Aumenta el daño contra objetivos vulnerables un 5.0%."
      },
      tamano_radio: "3",
      requisitos_especiales: null,
      estado: "Encontrado",
      tags: ["vulnerables"]
    },
    {
      id: "glifo_espiritu",
      nombre: "Espíritu",
      rareza: "Raro",
      nivel_requerido: 1,
      efecto_base: "Por cada 5 de Voluntad adquirida dentro del alcance, infliges un +4.0% más de daño de golpe crítico.",
      atributo_escalado: {
        atributo: "Voluntad",
        bonificacion: "+4.0% más de daño de golpe crítico por cada 5 de Voluntad"
      },
      bonificacion_adicional: {
        requisito: "25 de Voluntad",
        descripcion: "Los golpes críticos aumentan el daño que el enemigo recibe de ti un 3% durante 20 segundos, hasta un 15%."
      },
      bonificacion_legendaria: {
        requisito: null,
        descripcion: "Aumenta el daño de golpe crítico un 8.0%."
      },
      tamano_radio: "3",
      requisitos_especiales: null,
      estado: "Encontrado",
      tags: []
    },
    {
      id: "glifo_ferviente",
      nombre: "Ferviente",
      rareza: "Legendario",
      nivel_requerido: 15,
      efecto_base: "Por cada 5 de Inteligencia adquirida dentro del alcance, infliges un +10.0% más de daño con elementos.",
      atributo_escalado: {
        atributo: "Inteligencia",
        bonificacion: "+10.0% más de daño elemental por cada 5 de Inteligencia"
      },
      bonificacion_adicional: {
        requisito: "40 de Inteligencia",
        descripcion: "Tus habilidades elementales tienen un 15% de probabilidad de aplicar todos los estados alterados elementales."
      },
      bonificacion_legendaria: {
        requisito: "80 de Inteligencia total",
        descripcion: "Los estados alterados elementales infligen un 25% más de daño."
      },
      tamano_radio: "5",
      requisitos_especiales: "Solo disponible en Nivel de Amenaza 3+",
      estado: "Mejorado",
      tags: ["elemental", "estados_alterados"]
    }
  ]
};

// ============================================================================
// ASPECTOS DE PRUEBA
// ============================================================================

export const mockAspectos: AspectosHeroe = {
  clase: "Paladín",
  aspectos: [
    {
      id: "aspecto_sabio_concurrido",
      name: "Aspecto del Sabio Concurrido",
      shortName: "del Sabio Concurrido",
      effect: "Tienes un 8% más de probabilidad de esquivar. Cada vez que logras esquivar restauras un 17% [5 - 25]% de tu Vida máxima.",
      level: "13/21",
      category: "defensivo",
      keywords: ["esquivar", "vida", "sanacion"],
      tags: []
    },
    {
      id: "aspecto_senor_sangre",
      name: "Aspecto del Señor de la Sangre",
      shortName: "del Señor de la Sangre",
      effect: "Golpe afortunado: hasta un 20% de probabilidad de sanarte por un 8.2% [1.0 - 9.0]% de tu Vida máxima.",
      level: "19/21",
      category: "defensivo",
      keywords: ["golpe_afortunado", "sanacion", "vida"],
      tags: ["golpe_afortunado"]
    },
    {
      id: "aspecto_umbral",
      name: "Aspecto del Umbral",
      shortName: "del Umbral",
      effect: "Restaura 6.0 [1.0 - 8.0] de tu recurso primario cuando tienes a un enemigo bajo el control de multitudes.",
      level: "6/8",
      category: "recurso",
      keywords: ["control_multitudes", "recurso", "regeneracion"],
      tags: ["control_multitudes"]
    },
    {
      id: "aspecto_valintyr",
      name: "Aspecto del Valintyr",
      shortName: "del Valintyr",
      effect: "Las habilidades de Justicia infligen un 77.0% [60.0 - 80.0]% más de daño.",
      level: "18/21",
      category: "ofensivo",
      keywords: ["justicia", "danio", "habilidades"],
      tags: []
    },
    {
      id: "aspecto_yunque_glynn",
      name: "Aspecto del Yunque de Glynn",
      shortName: "del Yunque de Glynn",
      effect: "Tu Determinación máxima aumenta en 4 [1 - 5]. La Determinación aumenta tu reducción de daño en un 2% adicional.",
      level: "16/21",
      category: "defensivo",
      keywords: ["determinacion", "reduccion_danio"],
      tags: ["determinacion"]
    }
  ]
};

// ============================================================================
// EVENTOS DEL MUNDO DE PRUEBA
// ============================================================================

export const mockEventosMundo = {
  eventos: [
    {
      id: "test_guarida_heraldo",
      nombre: "Guarida del Heraldo (Test)",
      tipo: "guarida",
      boss: "Heraldo del Odio",
      ubicacion: null,
      objetivo: {
        tipo: "kill",
        descripcion: "Derrotar a este jefe de guarida otorga acceso a la Reserva del Heraldo del Odio.",
        progreso: null
      },
      requisitos: [
        {
          tipo: "llave",
          nombre: "Corazón Abominable",
          cantidad: 12,
          id_recurso: "recurso_corazon_abominable"
        }
      ],
      recompensas: [
        {
          tipo: "loot",
          nombre: "Objetos ancestrales únicos",
          cantidad: null,
          probabilidad: "media",
          garantizado: false,
          id_recurso: "recurso_loot_ancestral"
        },
        {
          tipo: "loot",
          nombre: "Objetos míticos únicos",
          cantidad: null,
          probabilidad: "baja",
          garantizado: false,
          id_recurso: "recurso_loot_mitico"
        }
      ],
      nivel_recomendado: null,
      dificultad: null,
      tiempo_estimado: null,
      tags: ["boss", "endgame"],
      notas: "Evento de prueba para testing"
    },
    {
      id: "test_mazmorra_putrefaccion",
      nombre: "Mazmorra: Foso de Putrefacción (Test)",
      tipo: "mazmorra",
      boss: null,
      ubicacion: "Kehjistán",
      objetivo: {
        tipo: "clear",
        descripcion: "Completa la mazmorra",
        progreso: null
      },
      requisitos: [],
      recompensas: [
        {
          tipo: "xp",
          nombre: "Experiencia de Paragon",
          cantidad: 1000,
          probabilidad: "alta",
          garantizado: true
        }
      ],
      nivel_recomendado: 50,
      dificultad: "Normal",
      tiempo_estimado: "15 minutos",
      tags: ["mazmorra", "leveling"],
      notas: "Mazmorra de prueba"
    }
  ],
  indice_recursos: [
    {
      id: "recurso_corazon_abominable",
      nombre: "Corazón Abominable",
      tipo: "llave",
      descripcion: "Llave para acceder a la guarida del Heraldo",
      rareza: "raro",
      apilable: true,
      max_stack: 99
    },
    {
      id: "recurso_fragmentos_agonia",
      nombre: "Fragmento de Agonía",
      tipo: "material",
      descripcion: "Material requerido para invocar a Duriel",
      rareza: "unico",
      apilable: true,
      max_stack: 99
    }
  ]
};

// ============================================================================
// UTILIDADES PARA TESTING
// ============================================================================

/**
 * Crear un personaje de prueba con opciones personalizadas
 */
export function crearPersonajePrueba(overrides: Partial<Personaje> = {}): Personaje {
  return {
    ...mockPersonajeBasico,
    id: `test_personaje_${Date.now()}`,
    ...overrides
  };
}

/**
 * Crear estadísticas de prueba con valores personalizados
 */
export function crearEstadisticasPrueba(overrides: Partial<Estadisticas> = {}): Estadisticas {
  return {
    ...mockEstadisticas,
    ...overrides
  };
}

/**
 * Crear un aspecto de prueba
 */
export function crearAspectoPrueba(overrides: Partial<Aspecto> = {}): Aspecto {
  return {
    id: `test_aspecto_${Date.now()}`,
    name: "Aspecto de Prueba",
    shortName: "de Prueba",
    effect: "Efecto de prueba",
    level: "10/21",
    category: "ofensivo",
    keywords: [],
    tags: [],
    ...overrides
  };
}

/**
 * Crear un glifo de prueba
 */
export function crearGlifoPrueba(overrides: Partial<Glifo> = {}): Glifo {
  return {
    id: `test_glifo_${Date.now()}`,
    nombre: "Glifo de Prueba",
    rareza: "Raro",
    nivel_requerido: 1,
    efecto_base: "Efecto base de prueba",
    tamano_radio: "3",
    estado: "Encontrado",
    tags: [],
    ...overrides
  };
}

/**
 * Obtener JSON de prueba por categoría
 */
export function obtenerJSONPrueba(categoria: string): any {
  const datos: Record<string, any> = {
    'personaje': mockPersonajeCompleto,
    'estadisticas': mockEstadisticas,
    'habilidades': mockHabilidades,
    'glifos': mockGlifos,
    'aspectos': mockAspectos,
    'mundo': mockEventosMundo
  };

  return datos[categoria] || null;
}

/**
 * Limpiar IDs de prueba (para cleanup después de tests)
 */
export function esIDPrueba(id: string): boolean {
  return id.startsWith('test_');
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  mockPersonajeBasico,
  mockPersonajeCompleto,
  mockEstadisticas,
  mockHabilidades,
  mockGlifos,
  mockAspectos,
  mockEventosMundo,
  crearPersonajePrueba,
  crearEstadisticasPrueba,
  crearAspectoPrueba,
  crearGlifoPrueba,
  obtenerJSONPrueba,
  esIDPrueba
};
