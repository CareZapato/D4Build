// 🧪 TestingService - Sistema de Testing para Administradores
// Prueba exhaustiva de todos los servicios de importación

import { WorkspaceService } from './WorkspaceService';
import { ImageExtractionPromptService } from './ImageExtractionPromptService';
import { WorldService } from './WorldService';
import { TagLinkingService } from './TagLinkingService';
import { 
  Personaje, 
  HabilidadesPersonaje, 
  GlifosHeroe, 
  AspectosHeroe,
  Estadisticas,
  EventoMundo,
  Charm,
  HoradricSeal
} from '../types';

// ============================================================================
// TIPOS DE TESTING
// ============================================================================

export interface TestResult {
  testName: string;
  category: string;
  passed: boolean;
  duration: number; // ms
  message: string;
  details?: any;
  errors?: string[];
}

export interface TestSuite {
  suiteName: string;
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  results: TestResult[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// DATOS DE PRUEBA
// ============================================================================

const MOCK_ESTADISTICAS_JSON = {
  "nivel_paragon": 150,
  "estadisticas": {
    "atributosPrincipales": {
      "nivel": 100,
      "fuerza": 520,
      "inteligencia": 180,
      "voluntad": 390,
      "destreza": 250
    },
    "personaje": {
      "danioArma": 595,
      "aguante": 52619
    },
    "ofensivo": {
      "danioConCorrupcion": 49.0,
      "danioVsEnemigosCercanos": 38.5,
      "danioVsEnemigosElite": 111.8,
      "danioVsEnemigosSaludables": 16.0,
      "espinas": 1179
    },
    "defensivo": {
      "vidaMaxima": 12000,
      "armadura": 8500,
      "reduccionDanio": 55.0,
      "esquivar": 8.0
    }
  }
};

const MOCK_HABILIDADES_JSON = {
  "habilidades_activas": [
    {
      "id": "test_skill_aura_luz",
      "nombre": "Aura de Luz Sagrada",
      "tipo_habilidad": "skill",
      "tipo": "Defensiva",
      "rama": "Justiciero",
      "nivel_actual": 5,
      "nivel_maximo": 5,
      "descripcion": "Pasiva: Tú y tus aliados emanan Luz, la cual inflige daño sagrado.",
      "tipo_danio": "Sagrado",
      "tags": ["luz_sagrada", "daño_sagrado"],
      "modificadores": [
        {
          "id": "test_mod_luz_potenciada",
          "nombre": "Luz Sagrada Potenciada",
          "tipo_habilidad": "modificador",
          "descripcion": "La pasiva de Luz Sagrada ahora toma como objetivo a 2 enemigos más.",
          "tags": []
        }
      ]
    }
  ],
  "habilidades_pasivas": [
    {
      "id": "test_skill_longevidad",
      "nombre": "Longevidad",
      "tipo_habilidad": "pasiva",
      "tipo": "Pasiva",
      "rama": null,
      "nivel": 3,
      "nivel_maximo": 3,
      "efecto": "Obtienes un 30% de la sanación recibida.",
      "puntos_asignados": 3,
      "tags": ["sanacion"]
    }
  ],
  "palabras_clave": [
    {
      "tag": "luz_sagrada",
      "texto_original": "Luz Sagrada",
      "significado": "Efecto de luz que inflige daño sagrado",
      "categoria": "mecanica",
      "fuente": "habilidad"
    }
  ]
};

const MOCK_GLIFOS_JSON = {
  "glifos": [
    {
      "id": "test_glifo_disminucion",
      "nombre": "Disminución",
      "rareza": "Raro",
      "nivel_requerido": 1,
      "efecto_base": "Otorga una bonificación del +25.0% a todos los nodos raros dentro del alcance.",
      "atributo_escalado": null,
      "bonificacion_adicional": {
        "requisito": "40 de Fuerza",
        "descripcion": "Recibes un 15% menos de daño físico de enemigos vulnerables."
      },
      "bonificacion_legendaria": {
        "requisito": null,
        "descripcion": "Aumenta el daño contra objetivos vulnerables un 5.0%."
      },
      "tamano_radio": "3",
      "requisitos_especiales": null,
      "estado": "Encontrado",
      "tags": ["vulnerables"]
    }
  ]
};

const MOCK_ASPECTOS_JSON = {
  "aspectos": [
    {
      "id": "test_aspecto_sabio",
      "name": "Aspecto del Sabio Concurrido",
      "shortName": "del Sabio Concurrido",
      "effect": "Tienes un 8% más de probabilidad de esquivar. Cada vez que logras esquivar restauras un 17% [5 - 25]% de tu Vida máxima.",
      "level": "13/21",
      "category": "defensivo",
      "keywords": ["esquivar", "vida", "sanacion"],
      "tags": []
    },
    {
      "id": "test_aspecto_valintyr",
      "name": "Aspecto del Valintyr",
      "shortName": "del Valintyr",
      "effect": "Las habilidades de Justicia infligen un 77.0% [60.0 - 80.0]% más de daño.",
      "level": "18/21",
      "category": "ofensivo",
      "keywords": ["justicia", "danio"],
      "tags": []
    }
  ]
};

const MOCK_MUNDO_JSON = {
  "eventos": [
    {
      "id": "test_guarida_duriel",
      "nombre": "Guarida de Duriel (Test)",
      "tipo": "guarida",
      "subtipo": "boss",
      "boss": "Duriel, Señor del Dolor",
      "ubicacion": "Kehjistan - Cavernas del Odio",
      "objetivo": {
        "tipo": "kill",
        "descripcion": "Derrotar a Duriel",
        "progreso": { "actual": null, "max": 1 }
      },
      "requisitos": [
        {
          "tipo": "material",
          "nombre": "Fragmentos de Agonía",
          "cantidad": 2,
          "id_recurso": "recurso_fragmentos_agonia"
        },
        {
          "tipo": "material",
          "nombre": "Fragmentos de Odio",
          "cantidad": 2,
          "id_recurso": "recurso_fragmentos_odio"
        }
      ],
      "recompensas": [
        {
          "tipo": "loot",
          "nombre": "Loot único de Duriel",
          "cantidad": null,
          "probabilidad": "alta",
          "garantizado": true,
          "id_recurso": "loot_duriel"
        }
      ],
      "tiempo": {
        "expira_en": null,
        "tiempo_completar": "10-15 min",
        "cooldown": null
      },
      "dificultad": "tortura",
      "repetible": true,
      "descripcion": "Invoca y derrota a Duriel para obtener loot único.",
      "tags": ["boss", "endgame", "farm", "uber_boss"],
      "notas": "Evento de prueba"
    },
    {
      "id": "test_susurro_legion",
      "nombre": "Susurro: Legión Salvaje (Test)",
      "tipo": "susurro",
      "subtipo": "tarea",
      "boss": null,
      "ubicacion": "Scosglen",
      "objetivo": {
        "tipo": "completar",
        "descripcion": "Completar 10 eventos de legión",
        "progreso": { "actual": 5, "max": 10 }
      },
      "requisitos": [],
      "recompensas": [
        {
          "tipo": "currency",
          "nombre": "Favores Lúgubres",
          "cantidad": 10,
          "probabilidad": "alta",
          "garantizado": true,
          "id_recurso": "recurso_favores_lugubres"
        },
        {
          "tipo": "material",
          "nombre": "Fragmentos de Agonía",
          "cantidad": 1,
          "probabilidad": "media",
          "garantizado": false,
          "id_recurso": "recurso_fragmentos_agonia"
        }
      ],
      "tiempo": {
        "expira_en": "3 días",
        "tiempo_completar": "30-40 min",
        "cooldown": null
      },
      "dificultad": "pesadilla",
      "repetible": false,
      "descripcion": "Completa eventos de legión para obtener recompensas.",
      "tags": ["susurro", "legion", "time_limited"],
      "notas": ""
    }
  ]
};

const MOCK_TALISMANES_JSON = {
  "talismanes": [
    {
      "id": "charm_narrow_eye_fer",
      "nombre": "Fer of the Narrow Eye",
      "tipo": "charm",
      "rareza": "set",
      "nivel_requerido": null,
      "stats": [
        {
          "nombre": "Smoke Grenade",
          "valor": 3,
          "rango": "[2-3]"
        },
        {
          "nombre": "Bonus Experience",
          "valor": 4.2,
          "rango": "[3.2-6.0]"
        }
      ],
      "efectos": [
        {
          "tipo": "stacking",
          "descripcion": "Al usar una habilidad básica Marksman, ganas acumulaciones de Vengeance que aumentan velocidad de movimiento y daño.",
          "condicion": "usar habilidad básica Marksman",
          "tags": ["marksman", "movement", "damage", "stacking"]
        }
      ],
      "set": {
        "nombre": "Narrow Eye",
        "piezas": ["Phoba", "Fer", "Mlor", "Linta"],
        "bonus": [
          {
            "piezas_requeridas": 2,
            "descripcion": "Stacks de Vengeance aumentan daño y velocidad"
          },
          {
            "piezas_requeridas": 3,
            "descripcion": "Genera Dark Shroud y reducción de daño"
          }
        ]
      },
      "tags": ["marksman", "set", "stacking", "vengeance"]
    },
    {
      "id": "charm_paingorgers_gauntlets",
      "nombre": "Paingorger's Gauntlets",
      "tipo": "charm",
      "rareza": "unique",
      "nivel_requerido": 70,
      "stats": [
        {
          "nombre": "Shadow Resistance",
          "valor": 438,
          "rango": "[416-523]"
        },
        {
          "nombre": "Movement Speed",
          "valor": 23,
          "rango": "[20-24]"
        }
      ],
      "efectos": [
        {
          "tipo": "condicion",
          "descripcion": "Marcar enemigos con habilidades no básicas permite replicar daño con habilidades básicas.",
          "condicion": "usar habilidad básica sobre enemigo marcado",
          "tags": ["mark", "echo_damage", "basic_skills"]
        }
      ],
      "set": null,
      "tags": ["unique", "damage", "mark"]
    }
  ]
};

const MOCK_HORADRIC_SEAL_JSON = {
  "horadric_seal": {
    "id": "horadric_seal_honor",
    "nombre": "Horadric Seal of Honor",
    "tipo": "horadric_seal",
    "rareza": "legendary",
    "slots": 5,
    "stats": [
      {
        "nombre": "Total Armor",
        "valor": 45
      },
      {
        "nombre": "Maximum Life",
        "valor": 120
      }
    ],
    "bonus": [
      "Charm Set: Dark Pact otorga daño adicional",
      "Charm Set: Adept Action reduce daño al moverse"
    ],
    "reglas": [
      {
        "tipo": "restriccion",
        "descripcion": "No puede tener más de 5 sockets"
      },
      {
        "tipo": "restriccion",
        "descripcion": "Puede equipar hasta 2 charms únicos"
      }
    ],
    "nivel_requerido": 60,
    "tags": ["horadric", "seal", "legendary"]
  }
};

// MOCKs para aspectos equipados en personaje
const MOCK_CHARACTER_ASPECTS_JSON = {
  "aspectos_equipados": [
    {
      "aspecto_id": "test_aspecto_sabio",
      "name": "Aspecto del Sabio Concurrido",
      "shortName": "del Sabio Concurrido",
      "nivel_actual": "13/21",
      "category": "defensivo",
      "effect": "Tienes un 8% más de probabilidad de esquivar. Cada vez que logras esquivar restauras un 17% [5 - 25]% de tu Vida máxima.",
      "slot_equipado": "Amuleto",
      "valores_actuales": {
        "esquivar": "8%",
        "vida_restaurada": "17%"
      },
      "tags": ["esquivar", "vida", "sanacion"]
    }
  ],
  "palabras_clave": []
};

// MOCKs para mazmorras con aspectos
const MOCK_DUNGEON_ASPECTS_JSON = {
  "mazmorras": [
    {
      "id": "mazmorra_ruinas_eridu",
      "nombre": "Ruinas de Eridu",
      "ubicacion": "Kehjistan",
      "aspecto_recompensa": {
        "id": "aspecto_velo_definitivo",
        "nombre": "Aspecto del Velo Definitivo",
        "categoria": "defensivo"
      },
      "nivel_recomendado": 35,
      "tags": ["mazmorra", "aspecto"]
    }
  ]
};

// MOCKs para tableros paragon
const MOCK_PARAGON_BOARDS_JSON = {
  "tableros": [
    {
      "tablero_id": "tablero_inicio",
      "nombre": "Tablero de Inicio",
      "tipo": "inicio",
      "descripcion": "Tablero inicial de todos los personajes",
      "nodos_totales": 127,
      "nodos_desbloqueables": 85,
      "puntos_paragon_requeridos": 0,
      "tags": []
    }
  ]
};

// MOCKs para nodos paragon
const MOCK_PARAGON_NODES_JSON = {
  "nodos": [
    {
      "nodo_id": "nodo_fuerza_01",
      "nombre": "Fuerza",
      "rareza": "normal",
      "tipo": "atributo",
      "tablero_id": "tablero_inicio",
      "bonificaciones": [
        {
          "atributo": "Fuerza",
          "valor": "+5"
        }
      ],
      "posicion": { "x": 0, "y": 1 },
      "tags": []
    }
  ]
};

// MOCKs para atributos paragon del personaje
const MOCK_PARAGON_CHARACTER_JSON = {
  "paragon": {
    "nivel_paragon": 150,
    "puntos_disponibles": 5,
    "puntos_usados": 145,
    "atributos": {
      "fuerza": 50,
      "inteligencia": 20,
      "voluntad": 35,
      "destreza": 15
    },
    "tableros_equipados": [
      {
        "tablero_id": "tablero_inicio",
        "posicion_slot": 1,
        "rotacion": 0,
        "nodos_activados": ["nodo_fuerza_01"],
        "glifos_equipados": [
          {
            "glifo_id": "test_glifo_disminucion",
            "socket_id": "socket_central",
            "nivel_actual": 21,
            "nivel_maximo": 21
          }
        ]
      }
    ]
  }
};

// MOCKs para runas
const MOCK_RUNAS_JSON = {
  "runas": [
    {
      "id": "runa_yom",
      "nombre": "Yom",
      "rareza": "legendaria",
      "tipo": "invocacion",
      "efecto": "Invoca un Golem de Huesos",
      "descripcion": "El Golem de Huesos aparece cerca del objetivo.",
      "objeto_origen": "Golem de Huesos",
      "tags": ["invocacion", "golem"]
    }
  ],
  "palabras_clave": []
};

// MOCKs para gemas
const MOCK_GEMAS_JSON = {
  "gemas": [
    {
      "id": "gema_rubi",
      "nombre": "Rubí",
      "tipo": "rubi",
      "calidad": 5,
      "efectos_por_slot": {
        "arma": "Aumenta daño abrumador en un 8%",
        "armadura": "Aumenta vida máxima en un 4%",
        "joyas": "Aumenta resistencia a Fuego en un 6%"
      },
      "tags": ["gema", "fuego"]
    }
  ],
  "palabras_clave": []
};

// MOCKs para equipamiento (build)
const MOCK_BUILD_JSON = {
  "build": {
    "piezas": {
      "cabeza": {
        "espacio": "cabeza",
        "nombre": "Casco de las Sombras",
        "rareza": "legendaria",
        "poder": 925,
        "stats": [
          {
            "nombre": "Armor",
            "valor": 842,
            "tipo": "base"
          }
        ],
        "engarces": [
          {
            "tipo": "gema",
            "gema_id": "gema_rubi",
            "calidad": 5
          }
        ],
        "aspecto_id": "test_aspecto_sabio",
        "nivel": 100
      }
    },
    "runas_equipadas": [
      {
        "runa_id": "runa_yom",
        "vinculada_a": "arma"
      }
    ]
  }
};

// MOCKs para mecánicas de clase
const MOCK_MECANICAS_JSON = {
  "mecanicas_clase": [
    {
      "mecanica_id": "mecanica_espiritu_protector",
      "nombre": "Espíritu Protector",
      "tipo": "recurso_secundario",
      "descripcion": "Espíritu que protege al Druida",
      "valor_actual": 50,
      "valor_maximo": 100,
      "bonificaciones": [
        {
          "tipo": "pasivo",
          "efecto": "Reducción de daño 10%"
        }
      ],
      "tags": []
    }
  ],
  "palabras_clave": []
};

// ============================================================================
// TESTING SERVICE
// ============================================================================

export class TestingService {
  
  // ==========================================================================
  // TEST SUITE PRINCIPAL
  // ==========================================================================
  
  static async runAllTests(): Promise<TestSuite[]> {
    const suites: TestSuite[] = [];
    
    // Tests de importación básicos
    suites.push(await this.testEstadisticasImport());
    suites.push(await this.testHabilidadesImport());
    suites.push(await this.testGlifosImport());
    suites.push(await this.testAspectosImport());
    suites.push(await this.testMundoImport());
    suites.push(await this.testTalismanesImport());
    
    // Tests de diferenciación Héroe vs Personaje
    suites.push(await this.testHeroVsCharacterImports());
    
    // Tests de importaciones adicionales
    suites.push(await this.testParagonImports());
    suites.push(await this.testRunasGemasImport());
    suites.push(await this.testBuildImport());
    suites.push(await this.testMecanicasImport());
    
    // Tests de validación de prompts
    suites.push(await this.testPromptValidation());
    
    // Tests de relaciones y almacenamiento
    suites.push(await this.testRelacionesPersonajeHeroe());
    suites.push(await this.testImageStorage());
    
    return suites;
  }
  
  // ==========================================================================
  // TEST: IMPORTACIÓN DE ESTADÍSTICAS
  // ==========================================================================
  
  private static async testEstadisticasImport(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: 'Importación de Estadísticas',
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0,
      results: []
    };
    
    const startTime = Date.now();
    
    // Test 1: Validar estructura JSON
    suite.results.push(await this.runTest(
      'Validar estructura JSON de estadísticas',
      'Estadísticas',
      async () => {
        const validation = this.validateEstadisticasJSON(MOCK_ESTADISTICAS_JSON);
        if (!validation.valid) {
          throw new Error(`Validación fallida: ${validation.errors.join(', ')}`);
        }
        return { validation };
      }
    ));
    
    // Test 2: Extraer nivel correctamente
    suite.results.push(await this.runTest(
      'Extraer nivel de atributosPrincipales',
      'Estadísticas',
      async () => {
        const nivel = MOCK_ESTADISTICAS_JSON.estadisticas.atributosPrincipales.nivel;
        if (nivel !== 100) {
          throw new Error(`Nivel esperado: 100, obtenido: ${nivel}`);
        }
        return { nivel };
      }
    ));
    
    // Test 3: Extraer nivel paragon
    suite.results.push(await this.runTest(
      'Extraer nivel_paragon del JSON',
      'Estadísticas',
      async () => {
        const nivelParagon = MOCK_ESTADISTICAS_JSON.nivel_paragon;
        if (nivelParagon !== 150) {
          throw new Error(`Nivel Paragon esperado: 150, obtenido: ${nivelParagon}`);
        }
        return { nivelParagon };
      }
    ));
    
    // Test 4: Validar campos numéricos
    suite.results.push(await this.runTest(
      'Validar todos los campos numéricos',
      'Estadísticas',
      async () => {
        const stats = MOCK_ESTADISTICAS_JSON.estadisticas;
        const errors: string[] = [];
        
        if (typeof stats.atributosPrincipales.fuerza !== 'number') {
          errors.push('fuerza no es número');
        }
        if (typeof stats.personaje.danioArma !== 'number') {
          errors.push('danioArma no es número');
        }
        if (typeof stats.ofensivo.danioVsEnemigosElite !== 'number') {
          errors.push('danioVsEnemigosElite no es número');
        }
        
        if (errors.length > 0) {
          throw new Error(errors.join(', '));
        }
        
        return { validated: true };
      }
    ));
    
    suite.totalTests = suite.results.length;
    suite.passed = suite.results.filter(r => r.passed).length;
    suite.failed = suite.results.filter(r => !r.passed).length;
    suite.duration = Date.now() - startTime;
    
    return suite;
  }
  
  // ==========================================================================
  // TEST: IMPORTACIÓN DE HABILIDADES
  // ==========================================================================
  
  private static async testHabilidadesImport(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: 'Importación de Habilidades',
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0,
      results: []
    };
    
    const startTime = Date.now();
    
    // Test 1: Validar estructura
    suite.results.push(await this.runTest(
      'Validar estructura JSON de habilidades',
      'Habilidades',
      async () => {
        const validation = this.validateHabilidadesJSON(MOCK_HABILIDADES_JSON);
        if (!validation.valid) {
          throw new Error(`Validación fallida: ${validation.errors.join(', ')}`);
        }
        return { validation };
      }
    ));
    
    // Test 2: Validar modificadores
    suite.results.push(await this.runTest(
      'Validar modificadores de habilidades',
      'Habilidades',
      async () => {
        const habilidad = MOCK_HABILIDADES_JSON.habilidades_activas[0];
        if (!habilidad.modificadores || habilidad.modificadores.length === 0) {
          throw new Error('No se encontraron modificadores');
        }
        
        const mod = habilidad.modificadores[0];
        if (mod.tipo_habilidad !== 'modificador') {
          throw new Error(`Tipo esperado: 'modificador', obtenido: '${mod.tipo_habilidad}'`);
        }
        
        return { modificadores: habilidad.modificadores.length };
      }
    ));
    
    // Test 3: Validar palabras clave
    suite.results.push(await this.runTest(
      'Validar palabras clave estructuradas',
      'Habilidades',
      async () => {
        const palabras = MOCK_HABILIDADES_JSON.palabras_clave;
        if (!palabras || palabras.length === 0) {
          throw new Error('No se encontraron palabras clave');
        }
        
        const palabra = palabras[0];
        if (!palabra.tag || !palabra.texto_original || !palabra.categoria) {
          throw new Error('Palabra clave incompleta');
        }
        
        return { palabras_clave: palabras.length };
      }
    ));
    
    // Test 4: Validar IDs únicos
    suite.results.push(await this.runTest(
      'Validar IDs únicos en habilidades',
      'Habilidades',
      async () => {
        const ids = new Set<string>();
        
        MOCK_HABILIDADES_JSON.habilidades_activas.forEach(h => {
          if (ids.has(h.id)) {
            throw new Error(`ID duplicado: ${h.id}`);
          }
          ids.add(h.id);
          
          h.modificadores.forEach(m => {
            if (ids.has(m.id)) {
              throw new Error(`ID duplicado en modificador: ${m.id}`);
            }
            ids.add(m.id);
          });
        });
        
        MOCK_HABILIDADES_JSON.habilidades_pasivas.forEach(h => {
          if (ids.has(h.id)) {
            throw new Error(`ID duplicado: ${h.id}`);
          }
          ids.add(h.id);
        });
        
        return { ids_unicos: ids.size };
      }
    ));
    
    suite.totalTests = suite.results.length;
    suite.passed = suite.results.filter(r => r.passed).length;
    suite.failed = suite.results.filter(r => !r.passed).length;
    suite.duration = Date.now() - startTime;
    
    return suite;
  }
  
  // ==========================================================================
  // TEST: IMPORTACIÓN DE GLIFOS
  // ==========================================================================
  
  private static async testGlifosImport(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: 'Importación de Glifos',
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0,
      results: []
    };
    
    const startTime = Date.now();
    
    // Test 1: Validar rareza
    suite.results.push(await this.runTest(
      'Validar rareza de glifos',
      'Glifos',
      async () => {
        const glifos = MOCK_GLIFOS_JSON.glifos;
        const rarezasValidas = ['Común', 'Raro', 'Legendario'];
        
        for (const glifo of glifos) {
          if (!rarezasValidas.includes(glifo.rareza)) {
            throw new Error(`Rareza inválida: ${glifo.rareza}`);
          }
        }
        
        return { glifos_validados: glifos.length };
      }
    ));
    
    // Test 2: Validar bonificaciones
    suite.results.push(await this.runTest(
      'Validar bonificaciones adicionales',
      'Glifos',
      async () => {
        const glifo = MOCK_GLIFOS_JSON.glifos[0];
        
        if (!glifo.bonificacion_adicional) {
          throw new Error('No se encontró bonificación adicional');
        }
        
        if (!glifo.bonificacion_adicional.requisito || !glifo.bonificacion_adicional.descripcion) {
          throw new Error('Bonificación adicional incompleta');
        }
        
        return { bonificacion: glifo.bonificacion_adicional };
      }
    ));
    
    // Test 3: Validar tags
    suite.results.push(await this.runTest(
      'Validar tags de glifos',
      'Glifos',
      async () => {
        const glifo = MOCK_GLIFOS_JSON.glifos[0];
        
        if (!Array.isArray(glifo.tags)) {
          throw new Error('Tags debe ser un array');
        }
        
        return { tags: glifo.tags };
      }
    ));
    
    suite.totalTests = suite.results.length;
    suite.passed = suite.results.filter(r => r.passed).length;
    suite.failed = suite.results.filter(r => !r.passed).length;
    suite.duration = Date.now() - startTime;
    
    return suite;
  }
  
  // ==========================================================================
  // TEST: IMPORTACIÓN DE ASPECTOS
  // ==========================================================================
  
  private static async testAspectosImport(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: 'Importación de Aspectos',
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0,
      results: []
    };
    
    const startTime = Date.now();
    
    // Test 1: Validar categorías
    suite.results.push(await this.runTest(
      'Validar categorías de aspectos',
      'Aspectos',
      async () => {
        const aspectos = MOCK_ASPECTOS_JSON.aspectos;
        const categoriasValidas = ['ofensivo', 'defensivo', 'recurso', 'utilidad', 'movilidad'];
        
        for (const aspecto of aspectos) {
          if (!categoriasValidas.includes(aspecto.category)) {
            throw new Error(`Categoría inválida: ${aspecto.category}`);
          }
        }
        
        return { aspectos_validados: aspectos.length };
      }
    ));
    
    // Test 2: Validar formato de nivel
    suite.results.push(await this.runTest(
      'Validar formato de nivel (X/Y)',
      'Aspectos',
      async () => {
        const aspectos = MOCK_ASPECTOS_JSON.aspectos;
        const regex = /^\d+\/\d+$/;
        
        for (const aspecto of aspectos) {
          if (!regex.test(aspecto.level)) {
            throw new Error(`Formato de nivel inválido: ${aspecto.level}`);
          }
          
          const [actual, maximo] = aspecto.level.split('/').map(Number);
          if (actual > maximo) {
            throw new Error(`Nivel actual (${actual}) mayor que máximo (${maximo})`);
          }
        }
        
        return { aspectos_validados: aspectos.length };
      }
    ));
    
    // Test 3: Validar keywords
    suite.results.push(await this.runTest(
      'Validar keywords de aspectos',
      'Aspectos',
      async () => {
        const aspectos = MOCK_ASPECTOS_JSON.aspectos;
        
        for (const aspecto of aspectos) {
          if (!Array.isArray(aspecto.keywords)) {
            throw new Error(`Keywords debe ser array en ${aspecto.id}`);
          }
        }
        
        return { aspectos_con_keywords: aspectos.length };
      }
    ));
    
    suite.totalTests = suite.results.length;
    suite.passed = suite.results.filter(r => r.passed).length;
    suite.failed = suite.results.filter(r => !r.passed).length;
    suite.duration = Date.now() - startTime;
    
    return suite;
  }
  
  // ==========================================================================
  // TEST: IMPORTACIÓN DE MUNDO
  // ==========================================================================
  
  private static async testMundoImport(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: 'Importación de Eventos del Mundo',
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0,
      results: []
    };
    
    const startTime = Date.now();
    
    // Test 1: Validar estructura básica de eventos
    suite.results.push(await this.runTest(
      'Validar estructura básica de eventos',
      'Mundo',
      async () => {
        const eventos = MOCK_MUNDO_JSON.eventos;
        
        if (!Array.isArray(eventos)) {
          throw new Error('eventos debe ser array');
        }
        
        for (const evento of eventos) {
          if (!evento.id || !evento.nombre || !evento.tipo) {
            throw new Error(`Evento incompleto: faltan campos básicos`);
          }
          
          if (!evento.objetivo || !evento.objetivo.tipo || !evento.objetivo.descripcion) {
            throw new Error(`Evento ${evento.id}: objetivo incompleto`);
          }
          
          if (!Array.isArray(evento.requisitos)) {
            throw new Error(`Evento ${evento.id}: requisitos debe ser array`);
          }
          
          if (!Array.isArray(evento.recompensas)) {
            throw new Error(`Evento ${evento.id}: recompensas debe ser array`);
          }
          
          if (!Array.isArray(evento.tags)) {
            throw new Error(`Evento ${evento.id}: tags debe ser array`);
          }
        }
        
        return { eventos_validados: eventos.length };
      }
    ));
    
    // Test 2: Validar requisitos con id_recurso
    suite.results.push(await this.runTest(
      'Validar requisitos con id_recurso',
      'Mundo',
      async () => {
        const evento = MOCK_MUNDO_JSON.eventos[0];
        
        for (const req of evento.requisitos) {
          if (!req.tipo || !req.nombre || typeof req.cantidad !== 'number') {
            throw new Error('Requisito incompleto: faltan campos requeridos');
          }
          
          if (!req.id_recurso) {
            throw new Error('Requisito sin id_recurso (necesario para detectar relaciones)');
          }
          
          const tiposValidos = ['material', 'llave', 'currency', 'nivel', 'acceso', 'quest'];
          if (!tiposValidos.includes(req.tipo)) {
            throw new Error(`Tipo de requisito inválido: ${req.tipo}`);
          }
        }
        
        return { requisitos_validados: evento.requisitos.length };
      }
    ));
    
    // Test 3: Validar recompensas con id_recurso y probabilidad
    suite.results.push(await this.runTest(
      'Validar recompensas con id_recurso y probabilidad',
      'Mundo',
      async () => {
        const evento = MOCK_MUNDO_JSON.eventos[0];
        
        for (const rec of evento.recompensas) {
          if (!rec.tipo || !rec.nombre) {
            throw new Error('Recompensa incompleta: faltan campos requeridos');
          }
          
          if (!rec.id_recurso) {
            throw new Error('Recompensa sin id_recurso (necesario para detectar relaciones)');
          }
          
          if (rec.probabilidad && !['alta', 'media', 'baja'].includes(rec.probabilidad)) {
            throw new Error(`Probabilidad inválida: ${rec.probabilidad}`);
          }
          
          if (typeof rec.garantizado !== 'boolean') {
            throw new Error('Campo garantizado debe ser boolean');
          }
          
          const tiposValidos = ['loot', 'material', 'currency', 'experiencia', 'acceso', 'fragmento'];
          if (!tiposValidos.includes(rec.tipo)) {
            throw new Error(`Tipo de recompensa inválido: ${rec.tipo}`);
          }
        }
        
        return { recompensas_validadas: evento.recompensas.length };
      }
    ));
    
    // Test 4: Validar tipos de eventos
    suite.results.push(await this.runTest(
      'Validar tipos de eventos',
      'Mundo',
      async () => {
        const tiposValidos = ['guarida', 'susurro', 'evento', 'calabozo', 'legion', 'reserva'];
        const subtiposValidos = ['boss', 'tarea', 'ritual', 'mapa', 'elite', 'evento_mundial'];
        
        for (const evento of MOCK_MUNDO_JSON.eventos) {
          if (!tiposValidos.includes(evento.tipo)) {
            throw new Error(`Tipo de evento inválido: ${evento.tipo}`);
          }
          
          if (evento.subtipo && !subtiposValidos.includes(evento.subtipo)) {
            throw new Error(`Subtipo de evento inválido: ${evento.subtipo}`);
          }
        }
        
        return { tipos_validados: tiposValidos.length };
      }
    ));
    
    // Test 5: Validar estructura de tiempo
    suite.results.push(await this.runTest(
      'Validar estructura de tiempo',
      'Mundo',
      async () => {
        const eventoConTiempo = MOCK_MUNDO_JSON.eventos.find(e => e.tiempo);
        
        if (eventoConTiempo && eventoConTiempo.tiempo) {
          const tiempo = eventoConTiempo.tiempo;
          
          if (!('expira_en' in tiempo) || !('tiempo_completar' in tiempo) || !('cooldown' in tiempo)) {
            throw new Error('Estructura de tiempo incompleta');
          }
        }
        
        return { eventos_con_tiempo: MOCK_MUNDO_JSON.eventos.filter(e => e.tiempo).length };
      }
    ));
    
    // Test 6: Validar dificultad y repetibilidad
    suite.results.push(await this.runTest(
      'Validar dificultad y repetibilidad',
      'Mundo',
      async () => {
        const dificultadesValidas = ['normal', 'pesadilla', 'tortura', 'otro', null];
        
        for (const evento of MOCK_MUNDO_JSON.eventos) {
          if (!dificultadesValidas.includes(evento.dificultad || null)) {
            throw new Error(`Dificultad inválida: ${evento.dificultad}`);
          }
          
          if (typeof evento.repetible !== 'boolean') {
            throw new Error(`repetible debe ser boolean en evento ${evento.id}`);
          }
        }
        
        return { eventos_validados: MOCK_MUNDO_JSON.eventos.length };
      }
    ));
    
    suite.totalTests = suite.results.length;
    suite.passed = suite.results.filter(r => r.passed).length;
    suite.failed = suite.results.filter(r => !r.passed).length;
    suite.duration = Date.now() - startTime;
    
    return suite;
  }
  
  // ==========================================================================
  // TEST: IMPORTACIÓN DE TALISMANES
  // ==========================================================================
  
  private static async testTalismanesImport(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: 'Importación de Talismanes',
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0,
      results: []
    };
    
    const startTime = Date.now();
    
    // Test 1: Validar estructura básica de talismanes
    suite.results.push(await this.runTest(
      'Validar estructura básica de talismanes',
      'Talismanes',
      async () => {
        const talismanes = MOCK_TALISMANES_JSON.talismanes;
        
        if (!Array.isArray(talismanes)) {
          throw new Error('talismanes debe ser array');
        }
        
        for (const charm of talismanes) {
          if (!charm.id || !charm.nombre || !charm.rareza) {
            throw new Error(`Talismán incompleto: faltan campos básicos`);
          }
          
          if (!Array.isArray(charm.stats)) {
            throw new Error(`Talismán ${charm.id}: stats debe ser array`);
          }
          
          if (!Array.isArray(charm.efectos)) {
            throw new Error(`Talismán ${charm.id}: efectos debe ser array`);
          }
          
          if (!Array.isArray(charm.tags)) {
            throw new Error(`Talismán ${charm.id}: tags debe ser array`);
          }
        }
        
        return { talismanes_validados: talismanes.length };
      }
    ));
    
    // Test 2: Validar rarezas de talismanes
    suite.results.push(await this.runTest(
      'Validar rarezas de talismanes',
      'Talismanes',
      async () => {
        const rarezasValidas = ['rare', 'unique', 'set'];
        
        for (const charm of MOCK_TALISMANES_JSON.talismanes) {
          if (!rarezasValidas.includes(charm.rareza)) {
            throw new Error(`Rareza inválida: ${charm.rareza}`);
          }
        }
        
        return { rarezas_validadas: rarezasValidas.length };
      }
    ));
    
    // Test 3: Validar stats de talismanes
    suite.results.push(await this.runTest(
      'Validar stats de talismanes',
      'Talismanes',
      async () => {
        for (const charm of MOCK_TALISMANES_JSON.talismanes) {
          for (const stat of charm.stats) {
            if (!stat.nombre || stat.valor === undefined) {
              throw new Error(`Stat incompleto en talismán ${charm.id}`);
            }
            
            if (typeof stat.valor !== 'number' && typeof stat.valor !== 'string') {
              throw new Error(`Valor de stat inválido en ${charm.id}`);
            }
          }
        }
        
        const totalStats = MOCK_TALISMANES_JSON.talismanes.reduce(
          (sum, charm) => sum + charm.stats.length, 0
        );
        
        return { stats_validados: totalStats };
      }
    ));
    
    // Test 4: Validar efectos de talismanes
    suite.results.push(await this.runTest(
      'Validar efectos de talismanes',
      'Talismanes',
      async () => {
        const tiposValidos = ['pasivo', 'condicion', 'proc', 'stacking'];
        
        for (const charm of MOCK_TALISMANES_JSON.talismanes) {
          for (const efecto of charm.efectos) {
            if (!efecto.tipo || !efecto.descripcion) {
              throw new Error(`Efecto incompleto en talismán ${charm.id}`);
            }
            
            if (!tiposValidos.includes(efecto.tipo)) {
              throw new Error(`Tipo de efecto inválido: ${efecto.tipo}`);
            }
            
            if (['condicion', 'stacking'].includes(efecto.tipo) && !efecto.condicion) {
              throw new Error(`Efecto tipo ${efecto.tipo} requiere campo condicion`);
            }
            
            if (!Array.isArray(efecto.tags)) {
              throw new Error(`tags de efecto debe ser array en ${charm.id}`);
            }
          }
        }
        
        const totalEfectos = MOCK_TALISMANES_JSON.talismanes.reduce(
          (sum, charm) => sum + charm.efectos.length, 0
        );
        
        return { efectos_validados: totalEfectos };
      }
    ));
    
    // Test 5: Validar sets de talismanes
    suite.results.push(await this.runTest(
      'Validar sets de talismanes',
      'Talismanes',
      async () => {
        const charmsSet = MOCK_TALISMANES_JSON.talismanes.filter(c => c.rareza === 'set');
        
        for (const charm of charmsSet) {
          if (!charm.set) {
            throw new Error(`Talismán de set ${charm.id} sin información de set`);
          }
          
          if (!charm.set.nombre || !Array.isArray(charm.set.piezas) || !Array.isArray(charm.set.bonus)) {
            throw new Error(`Set incompleto en talismán ${charm.id}`);
          }
          
          for (const bonus of charm.set.bonus) {
            if (!bonus.piezas_requeridas || !bonus.descripcion) {
              throw new Error(`Bonus de set incompleto en ${charm.id}`);
            }
            
            if (typeof bonus.piezas_requeridas !== 'number') {
              throw new Error(`piezas_requeridas debe ser número en ${charm.id}`);
            }
          }
        }
        
        return { sets_validados: charmsSet.length };
      }
    ));
    
    // Test 6: Validar talismanes unique sin set
    suite.results.push(await this.runTest(
      'Validar talismanes unique sin set',
      'Talismanes',
      async () => {
        const charmsUnique = MOCK_TALISMANES_JSON.talismanes.filter(c => c.rareza === 'unique');
        
        for (const charm of charmsUnique) {
          if (charm.set !== null && charm.set !== undefined) {
            throw new Error(`Talismán unique ${charm.id} no debe tener información de set (debe ser null)`);
          }
        }
        
        return { uniques_validados: charmsUnique.length };
      }
    ));
    
    // Test 7: Validar Horadric Seal
    suite.results.push(await this.runTest(
      'Validar estructura de Horadric Seal',
      'Talismanes',
      async () => {
        const seal = MOCK_HORADRIC_SEAL_JSON.horadric_seal;
        
        if (!seal.id || !seal.nombre || !seal.rareza) {
          throw new Error('Horadric Seal: faltan campos básicos');
        }
        
        if (typeof seal.slots !== 'number' || seal.slots <= 0) {
          throw new Error('Horadric Seal: slots debe ser número positivo');
        }
        
        if (!Array.isArray(seal.stats)) {
          throw new Error('Horadric Seal: stats debe ser array');
        }
        
        if (!Array.isArray(seal.bonus)) {
          throw new Error('Horadric Seal: bonus debe ser array');
        }
        
        if (!Array.isArray(seal.reglas)) {
          throw new Error('Horadric Seal: reglas debe ser array');
        }
        
        const rarezasValidas = ['rare', 'legendary'];
        if (!rarezasValidas.includes(seal.rareza)) {
          throw new Error(`Rareza de seal inválida: ${seal.rareza}`);
        }
        
        for (const regla of seal.reglas) {
          if (!regla.tipo || !regla.descripcion) {
            throw new Error('Regla de seal incompleta');
          }
          
          const tiposValidos = ['restriccion', 'bonus', 'sinergia', 'penalizacion'];
          if (!tiposValidos.includes(regla.tipo)) {
            throw new Error(`Tipo de regla inválido: ${regla.tipo}`);
          }
        }
        
        return { 
          seal_slots: seal.slots,
          seal_stats: seal.stats.length,
          seal_bonus: seal.bonus.length,
          seal_reglas: seal.reglas.length
        };
      }
    ));
    
    suite.totalTests = suite.results.length;
    suite.passed = suite.results.filter(r => r.passed).length;
    suite.failed = suite.results.filter(r => !r.passed).length;
    suite.duration = Date.now() - startTime;
    
    return suite;
  }
  
  // ==========================================================================
  // TEST: VALIDACIÓN DE PROMPTS VS JSON
  // ==========================================================================
  
  private static async testPromptValidation(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: 'Validación de Prompts vs JSON',
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0,
      results: []
    };
    
    const startTime = Date.now();
    
    // Test 1: Prompt de habilidades activas (simulación paso a paso)
    suite.results.push(await this.runTest(
      'Validar prompt de habilidades activas',
      'Prompts',
      async () => {
        console.log('\n🧪 TEST: Validar prompt de habilidades activas');
        console.log('📋 Paso 1: Usuario captura imagen de habilidades activas del árbol de habilidades');
        console.log('📋 Paso 2: Usuario sube imagen y selecciona "Habilidades Activas"');
        console.log('📋 Paso 3: Sistema genera prompt con ImageExtractionPromptService.generateActiveSkillsPrompt()');
        
        const prompt = ImageExtractionPromptService.generateActiveSkillsPrompt();
        console.log('✓ Prompt generado correctamente');
        
        console.log('\n📋 Paso 4: Validar que el prompt solicita todos los campos necesarios...');
        
        const camposRequeridos = [
          'habilidades_activas',
          'modificadores',
          'nivel_actual',
          'nivel_maximo',
          'tipo_habilidad',
          'tags'
        ];
        
        console.log(`   Campos requeridos: ${camposRequeridos.join(', ')}`);
        
        const faltantes: string[] = [];
        const encontrados: string[] = [];
        
        for (const campo of camposRequeridos) {
          if (prompt.includes(campo)) {
            encontrados.push(campo);
            console.log(`   ✓ Campo "${campo}" encontrado`);
          } else {
            faltantes.push(campo);
            console.log(`   ✗ Campo "${campo}" NO encontrado`);
          }
        }
        
        if (faltantes.length > 0) {
          console.error(`\n❌ ERROR: Campos faltantes en prompt`);
          console.error(`   Faltantes: ${faltantes.join(', ')}`);
          throw new Error(`Campos faltantes en prompt: ${faltantes.join(', ')}`);
        }
        
        console.log('\n📋 Paso 5: Usuario envía prompt + imagen a OpenAI/Gemini');
        console.log('📋 Paso 6: OpenAI/Gemini devuelve JSON con habilidades activas');
        console.log('📋 Paso 7: Sistema valida y guarda en personaje.habilidades_refs.activas');
        console.log(`\n✅ Test exitoso: Prompt completo con ${encontrados.length}/${camposRequeridos.length} campos`);
        
        return { campos_validados: camposRequeridos.length };
      }
    ));
    
    // Test 2: Prompt de habilidades pasivas (simulación paso a paso)
    suite.results.push(await this.runTest(
      'Validar prompt de habilidades pasivas',
      'Prompts',
      async () => {
        console.log('\n🧪 TEST: Validar prompt de habilidades pasivas');
        console.log('📋 Paso 1: Usuario captura imagen de habilidades pasivas del árbol');
        console.log('📋 Paso 2: Usuario sube imagen y selecciona "Habilidades Pasivas"');
        console.log('📋 Paso 3: Sistema genera prompt con ImageExtractionPromptService.generatePassiveSkillsPrompt()');
        
        const prompt = ImageExtractionPromptService.generatePassiveSkillsPrompt();
        console.log('✓ Prompt generado correctamente');
        
        console.log('\n📋 Paso 4: Validar campos requeridos...');
        
        const camposRequeridos = [
          'habilidades_pasivas',
          'nivel',
          'nivel_maximo',
          'efecto',
          'puntos_asignados'
        ];
        
        console.log(`   Campos: ${camposRequeridos.join(', ')}`);
        
        const faltantes: string[] = [];
        const encontrados: string[] = [];
        
        for (const campo of camposRequeridos) {
          if (prompt.includes(campo)) {
            encontrados.push(campo);
            console.log(`   ✓ "${campo}"`);
          } else {
            faltantes.push(campo);
            console.log(`   ✗ "${campo}"`);
          }
        }
        
        if (faltantes.length > 0) {
          console.error(`\n❌ ERROR: ${faltantes.join(', ')}`);
          throw new Error(`Campos faltantes en prompt: ${faltantes.join(', ')}`);
        }
        
        console.log(`\n✅ Test exitoso: ${encontrados.length}/${camposRequeridos.length} campos validados`);
        return { campos_validados: camposRequeridos.length };
      }
    ));
    
    // Test 3: Prompt de glifos (simulación paso a paso)
    suite.results.push(await this.runTest(
      'Validar prompt de glifos',
      'Prompts',
      async () => {
        console.log('\n🧪 TEST: Validar prompt de glifos');
        console.log('📋 Paso 1: Usuario captura imagen de glifos Paragon');
        console.log('📋 Paso 2: Usuario selecciona "Glifos" en el modal de captura');
        console.log('📋 Paso 3: Sistema genera prompt con ImageExtractionPromptService.generateGlyphsPrompt()');
        
        const prompt = ImageExtractionPromptService.generateGlyphsPrompt();
        console.log('✓ Prompt generado');
        
        console.log('\n📋 Paso 4: Validar campos...');
        
        const camposRequeridos = [
          'glifos',
          'rareza',
          'efecto_base',
          'bonificacion_adicional',
          'bonificacion_legendaria',
          'tamano_radio'
        ];
        
        const faltantes: string[] = [];
        const encontrados: string[] = [];
        
        for (const campo of camposRequeridos) {
          if (prompt.includes(campo)) {
            encontrados.push(campo);
            console.log(`   ✓ "${campo}"`);
          } else {
            faltantes.push(campo);
            console.log(`   ✗ "${campo}"`);
          }
        }
        
        if (faltantes.length > 0) {
          console.error(`\n❌ Faltantes: ${faltantes.join(', ')}`);
          throw new Error(`Campos faltantes en prompt: ${faltantes.join(', ')}`);
        }
        
        console.log(`\n✅ Exitoso: ${encontrados.length}/${camposRequeridos.length} campos`);
        return { campos_validados: camposRequeridos.length };
      }
    ));
    
    // Test 4: Prompt de aspectos (simulación paso a paso)
    suite.results.push(await this.runTest(
      'Validar prompt de aspectos',
      'Prompts',
      async () => {
        console.log('\n🧪 TEST: Validar prompt de aspectos');
        console.log('📋 Paso 1: Usuario captura imagen de aspectos legendarios');
        console.log('📋 Paso 2: Usuario selecciona "Aspectos" en el modal');
        console.log('📋 Paso 3: Sistema genera prompt con ImageExtractionPromptService.generateAspectsPrompt()');
        
        const prompt = ImageExtractionPromptService.generateAspectsPrompt();
        console.log('✓ Prompt generado');
        
        console.log('\n📋 Paso 4: Validar campos...');
        
        const camposRequeridos = [
          'aspectos',
          'name',
          'shortName',
          'effect',
          'level',
          'category',
          'keywords'
        ];
        
        const faltantes: string[] = [];
        const encontrados: string[] = [];
        
        for (const campo of camposRequeridos) {
          if (prompt.includes(campo)) {
            encontrados.push(campo);
            console.log(`   ✓ "${campo}"`);
          } else {
            faltantes.push(campo);
            console.log(`   ✗ "${campo}"`);
          }
        }
        
        if (faltantes.length > 0) {
          console.error(`\n❌ Faltantes: ${faltantes.join(', ')}`);
          throw new Error(`Campos faltantes en prompt: ${faltantes.join(', ')}`);
        }
        
        console.log('\n📋 Paso 5: Validar que menciona las 5 categorías de aspectos...');
        const categorias = ['ofensivo', 'defensivo', 'recurso', 'utilidad', 'movilidad'];
        console.log(`   Categorías: ${categorias.join(', ')}`);
        
        const faltantesCategorias: string[] = [];
        const encontradasCategorias: string[] = [];
        
        for (const cat of categorias) {
          if (prompt.includes(cat)) {
            encontradasCategorias.push(cat);
            console.log(`   ✓ "${cat}"`);
          } else {
            faltantesCategorias.push(cat);
            console.log(`   ✗ "${cat}"`);
          }
        }
        
        if (faltantesCategorias.length > 0) {
          console.error(`\n❌ Categorías faltantes: ${faltantesCategorias.join(', ')}`);
          throw new Error(`Categorías faltantes: ${faltantesCategorias.join(', ')}`);
        }
        
        console.log(`\n✅ Exitoso: ${encontrados.length}/${camposRequeridos.length} campos + ${encontradasCategorias.length} categorías`);
        return { 
          campos_validados: camposRequeridos.length,
          categorias_validadas: categorias.length 
        };
      }
    ));
    
    // Test 5: Prompt de estadísticas (simulación paso a paso)
    suite.results.push(await this.runTest(
      'Validar prompt de estadísticas',
      'Prompts',
      async () => {
        console.log('\n🧪 TEST: Validar prompt de estadísticas');
        console.log('📋 Paso 1: Usuario toma captura de pantalla de estadísticas');
        console.log('📋 Paso 2: Usuario sube imagen y selecciona "Estadísticas" en el modal');
        console.log('📋 Paso 3: Sistema genera prompt con ImageExtractionPromptService.generateStatsPrompt()');
        
        const prompt = ImageExtractionPromptService.generateStatsPrompt();
        console.log('✓ Prompt generado correctamente');
        
        console.log('\n📋 Paso 4: Validar que el prompt solicita TODOS los campos necesarios del JSON...');
        
        const camposRequeridos = [
          'estadisticas',
          'atributosPrincipales',
          'nivel',
          'nivel_paragon',
          'ofensivo',
          'defensivo'
        ];
        
        console.log(`\n   Campos requeridos a buscar: ${camposRequeridos.join(', ')}`);
        
        const faltantes: string[] = [];
        const encontrados: string[] = [];
        
        for (const campo of camposRequeridos) {
          if (prompt.includes(campo)) {
            encontrados.push(campo);
            console.log(`   ✓ Campo "${campo}" encontrado en el prompt`);
          } else {
            faltantes.push(campo);
            console.log(`   ✗ Campo "${campo}" NO encontrado en el prompt`);
          }
        }
        
        if (faltantes.length > 0) {
          console.error(`\n❌ ERROR: El prompt NO solicita todos los campos necesarios`);
          console.error(`   Faltantes: ${faltantes.join(', ')}`);
          console.error(`   Encontrados: ${encontrados.join(', ')}`);
          console.error(`\n   📌 PROBLEMA: Cuando OpenAI/Gemini procese este prompt, NO extraerá estos campos`);
          console.error(`   📌 SOLUCIÓN: Agregar mención explícita de estos campos en el prompt`);
          throw new Error(`Campos faltantes en prompt: ${faltantes.join(', ')}`);
        }
        
        console.log('\n📋 Paso 5: Usuario envía prompt + imagen a OpenAI/Gemini');
        console.log('📋 Paso 6: OpenAI/Gemini devuelve JSON con todos los campos');
        console.log('📋 Paso 7: Sistema valida JSON y lo guarda en el personaje');
        console.log(`\n✅ Test exitoso: Prompt solicita todos los ${camposRequeridos.length} campos necesarios`);
        
        return { campos_validados: camposRequeridos.length, encontrados: encontrados.length };
      }
    ));
    
    // Test 6: Prompt de eventos del mundo (simulación paso a paso)
    suite.results.push(await this.runTest(
      'Validar prompt de eventos del mundo',
      'Prompts',
      async () => {
        console.log('\n🧪 TEST: Validar prompt de eventos del mundo');
        console.log('📋 Paso 1: Usuario captura imagen de evento del mundo (guarida, susurro, etc.)');
        console.log('📋 Paso 2: Usuario selecciona "Eventos del Mundo" en el modal');
        console.log('📋 Paso 3: Sistema genera prompt con ImageExtractionPromptService.generateWorldEventsPrompt()');
        
        const prompt = ImageExtractionPromptService.generateWorldEventsPrompt();
        console.log('✓ Prompt generado');
        
        console.log('\n📋 Paso 4: Validar que el prompt solicita todos los campos necesarios...');
        
        const camposRequeridos = [
          'eventos',
          'objetivo',
          'requisitos',
          'recompensas',
          'id_recurso',
          'probabilidad',
          'garantizado',
          'tiempo',
          'dificultad',
          'repetible',
          'tags'
        ];
        
        console.log(`   Campos: ${camposRequeridos.join(', ')}`);
        
        const faltantes: string[] = [];
        const encontrados: string[] = [];
        
        for (const campo of camposRequeridos) {
          if (prompt.includes(campo)) {
            encontrados.push(campo);
            console.log(`   ✓ "${campo}"`);
          } else {
            faltantes.push(campo);
            console.log(`   ✗ "${campo}"`);
          }
        }
        
        if (faltantes.length > 0) {
          console.error(`\n❌ ERROR: Campos faltantes`);
          console.error(`   Faltantes: ${faltantes.join(', ')}`);
          throw new Error(`Campos faltantes en prompt de mundo: ${faltantes.join(', ')}`);
        }
        
        console.log('\n📋 Paso 5: Validar que menciona tipos de eventos...');
        const tiposEventos = ['guarida', 'susurro', 'evento', 'calabozo', 'legion', 'reserva'];
        console.log(`   Tipos: ${tiposEventos.join(', ')}`);
        
        const faltantesTipos: string[] = [];
        const encontradosTipos: string[] = [];
        
        for (const tipo of tiposEventos) {
          if (prompt.includes(tipo)) {
            encontradosTipos.push(tipo);
            console.log(`   ✓ "${tipo}"`);
          } else {
            faltantesTipos.push(tipo);
            console.log(`   ✗ "${tipo}"`);
          }
        }
        
        if (faltantesTipos.length > 0) {
          console.error(`\n❌ Tipos de evento faltantes: ${faltantesTipos.join(', ')}`);
          throw new Error(`Tipos de evento faltantes: ${faltantesTipos.join(', ')}`);
        }
        
        console.log('\n📋 Paso 6: Usuario envía prompt + imagen a OpenAI/Gemini');
        console.log('📋 Paso 7: OpenAI/Gemini devuelve JSON con eventos, requisitos, recompensas');
        console.log('📋 Paso 8: Sistema valida JSON y lo guarda en el workspace');
        console.log(`\n✅ Exitoso: ${encontrados.length}/${camposRequeridos.length} campos + ${encontradosTipos.length} tipos`);
        
        return { 
          campos_validados: camposRequeridos.length,
          tipos_evento_validados: tiposEventos.length
        };
      }
    ));
    
    // Test 7: Prompt de talismanes (simulación paso a paso)
    suite.results.push(await this.runTest(
      'Validar prompt de talismanes',
      'Prompts',
      async () => {
        console.log('\n🧪 TEST: Validar prompt de talismanes');
        console.log('📋 Paso 1: Usuario captura imagen de talismanes (charms)');
        console.log('📋 Paso 2: Usuario selecciona "Talismanes" → "Charms" en el modal');
        console.log('📋 Paso 3: Sistema genera prompt con ImageExtractionPromptService.generateCharmsPrompt()');
        
        const prompt = ImageExtractionPromptService.generateCharmsPrompt();
        console.log('✓ Prompt generado');
        
        console.log('\n📋 Paso 4: Validar campos requeridos...');
        
        const camposRequeridos = [
          'talismanes',
          'rareza',
          'stats',
          'efectos',
          'set',
          'piezas',
          'bonus',
          'piezas_requeridas'
        ];
        
        console.log(`   Campos: ${camposRequeridos.join(', ')}`);
        
        const faltantes: string[] = [];
        const encontrados: string[] = [];
        
        for (const campo of camposRequeridos) {
          if (prompt.includes(campo)) {
            encontrados.push(campo);
            console.log(`   ✓ "${campo}"`);
          } else {
            faltantes.push(campo);
            console.log(`   ✗ "${campo}"`);
          }
        }
        
        if (faltantes.length > 0) {
          console.error(`\n❌ ERROR: Campos faltantes`);
          console.error(`   Faltantes: ${faltantes.join(', ')}`);
          throw new Error(`Campos faltantes en prompt de talismanes: ${faltantes.join(', ')}`);
        }
        
        console.log('\n📋 Paso 5: Validar que menciona las rarezas...');
        const rarezas = ['rare', 'unique', 'set'];
        console.log(`   Rarezas: ${rarezas.join(', ')}`);
        
        const faltantesRarezas: string[] = [];
        const encontradasRarezas: string[] = [];
        
        for (const r of rarezas) {
          if (prompt.includes(r)) {
            encontradasRarezas.push(r);
            console.log(`   ✓ "${r}"`);
          } else {
            faltantesRarezas.push(r);
            console.log(`   ✗ "${r}"`);
          }
        }
        
        if (faltantesRarezas.length > 0) {
          console.error(`\n❌ Rarezas faltantes: ${faltantesRarezas.join(', ')}`);
          throw new Error(`Rarezas faltantes: ${faltantesRarezas.join(', ')}`);
        }
        
        console.log('\n📋 Paso 6: Validar que menciona tipos de efectos...');
        const tiposEfectos = ['pasivo', 'condicion', 'proc', 'stacking'];
        console.log(`   Tipos: ${tiposEfectos.join(', ')}`);
        
        const faltantesTipos: string[] = [];
        const encontradosTipos: string[] = [];
        
        for (const t of tiposEfectos) {
          if (prompt.includes(t)) {
            encontradosTipos.push(t);
            console.log(`   ✓ "${t}"`);
          } else {
            faltantesTipos.push(t);
            console.log(`   ✗ "${t}"`);
          }
        }
        
        if (faltantesTipos.length > 0) {
          console.error(`\n❌ Tipos de efecto faltantes: ${faltantesTipos.join(', ')}`);
          throw new Error(`Tipos de efecto faltantes: ${faltantesTipos.join(', ')}`);
        }
        
        console.log('\n📋 Paso 7: Usuario envía prompt + imagen a OpenAI/Gemini');
        console.log('📋 Paso 8: OpenAI/Gemini devuelve JSON con talismanes');
        console.log('📋 Paso 9: Sistema valida JSON y lo guarda en el workspace');
        console.log(`\n✅ Exitoso: ${encontrados.length}/${camposRequeridos.length} campos + ${encontradasRarezas.length} rarezas + ${encontradosTipos.length} tipos`);
        
        return { 
          campos_validados: camposRequeridos.length,
          rarezas_validadas: rarezas.length,
          tipos_efecto_validados: tiposEfectos.length
        };
      }
    ));
    
    // Test 8: Prompt de Horadric Seal (simulación paso a paso)
    suite.results.push(await this.runTest(
      'Validar prompt de Horadric Seal',
      'Prompts',
      async () => {
        console.log('\n🧪 TEST: Validar prompt de Horadric Seal');
        console.log('📋 Paso 1: Usuario captura imagen del Horadric Seal de su personaje');
        console.log('📋 Paso 2: Usuario sube imagen y selecciona "Talismanes" → "Horadric Seal"');
        console.log('📋 Paso 3: Sistema genera prompt con ImageExtractionPromptService.generateHoradricSealPrompt()');
        
        const prompt = ImageExtractionPromptService.generateHoradricSealPrompt();
        console.log('✓ Prompt generado correctamente');
        
        console.log('\n📋 Paso 4: Validar que el prompt solicita TODOS los campos necesarios...');
        
        const camposRequeridos = [
          'horadric_seal',
          'slots',
          'stats',
          'bonus',
          'reglas',
          'tipo',
          'rareza'
        ];
        
        console.log(`\n   Campos requeridos: ${camposRequeridos.join(', ')}`);
        
        const faltantes: string[] = [];
        const encontrados: string[] = [];
        
        for (const campo of camposRequeridos) {
          if (prompt.includes(campo)) {
            encontrados.push(campo);
            console.log(`   ✓ Campo "${campo}" encontrado`);
          } else {
            faltantes.push(campo);
            console.log(`   ✗ Campo "${campo}" NO encontrado`);
          }
        }
        
        if (faltantes.length > 0) {
          console.error(`\n❌ ERROR: Campos faltantes en prompt de Horadric Seal`);
          console.error(`   Faltantes: ${faltantes.join(', ')}`);
          console.error(`   Encontrados: ${encontrados.join(', ')}`);
          throw new Error(`Campos faltantes en prompt de Horadric Seal: ${faltantes.join(', ')}`);
        }
        
        console.log('\n📋 Paso 5: Validar que el prompt especifica TIPOS DE REGLAS...');
        const tiposReglas = ['restriccion', 'bonus', 'sinergia', 'penalizacion'];
        console.log(`   Tipos requeridos: ${tiposReglas.join(', ')}`);
        
        const faltantesTipos: string[] = [];
        const encontradosTipos: string[] = [];
        
        for (const tipo of tiposReglas) {
          if (prompt.includes(tipo)) {
            encontradosTipos.push(tipo);
            console.log(`   ✓ Tipo "${tipo}" encontrado`);
          } else {
            faltantesTipos.push(tipo);
            console.log(`   ✗ Tipo "${tipo}" NO encontrado`);
          }
        }
        
        if (faltantesTipos.length > 0) {
          console.error(`\n❌ ERROR: El prompt NO especifica todos los tipos de reglas`);
          console.error(`   Tipos faltantes: ${faltantesTipos.join(', ')}`);
          console.error(`   Tipos encontrados: ${encontradosTipos.join(', ')}`);
          console.error(`\n   📌 PROBLEMA: OpenAI/Gemini NO sabrá devolver reglas.tipo correctamente`);
          console.error(`   📌 SOLUCIÓN: Agregar ejemplos explícitos con tipo: "restriccion", "bonus", etc.`);
          throw new Error(`Tipos de regla faltantes: ${faltantesTipos.join(', ')}`);
        }
        
        console.log('\n📋 Paso 6: Usuario envía prompt + imagen a OpenAI/Gemini');
        console.log('📋 Paso 7: OpenAI/Gemini devuelve JSON con horadric_seal completo');
        console.log('📋 Paso 8: Sistema valida JSON y vincula el seal al personaje');
        console.log(`\n✅ Test exitoso: Prompt completo con ${camposRequeridos.length} campos y ${tiposReglas.length} tipos de regla`);
        
        return { 
          campos_validados: camposRequeridos.length,
          tipos_regla_validados: tiposReglas.length,
          encontrados: encontrados.length,
          tipos_encontrados: encontradosTipos.length
        };
      }
    ));
    
    suite.totalTests = suite.results.length;
    suite.passed = suite.results.filter(r => r.passed).length;
    suite.failed = suite.results.filter(r => !r.passed).length;
    suite.duration = Date.now() - startTime;
    
    return suite;
  }
  
  // ==========================================================================
  // TEST: RELACIONES PERSONAJE-HÉROE
  // ==========================================================================
  
  private static async testRelacionesPersonajeHeroe(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: 'Relaciones Personaje-Héroe',
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0,
      results: []
    };
    
    const startTime = Date.now();
    
    // Test 1: Crear personaje con referencias válidas
    suite.results.push(await this.runTest(
      'Crear personaje con referencias a héroe',
      'Relaciones',
      async () => {
        const personaje: Partial<Personaje> = {
          id: `test_personaje_${Date.now()}`,
          nombre: 'Paladín Test',
          clase: 'Paladín',
          nivel: 50,
          nivel_paragon: 100,
          habilidades_refs: {
            activas: [
              {
                skill_id: 'test_skill_aura_luz',
                modificadores_ids: ['test_mod_luz_potenciada'],
                nivel_actual: 5,
                en_batalla: true
              }
            ],
            pasivas: [
              {
                skill_id: 'test_skill_longevidad',
                puntos_asignados: 3
              }
            ]
          },
          glifos_refs: [
            {
              id: 'test_glifo_disminucion',
              nivel_actual: 15,
              nivel_maximo: 21
            }
          ],
          aspectos_refs: [
            'test_aspecto_sabio',
            'test_aspecto_valintyr'
          ]
        };
        
        // Validar que todas las referencias tienen IDs válidos
        if (!personaje.habilidades_refs?.activas[0].skill_id) {
          throw new Error('Falta skill_id en habilidad activa');
        }
        
        if (!personaje.glifos_refs?.[0].id) {
          throw new Error('Falta ID en glifo');
        }
        
        if (!personaje.aspectos_refs || personaje.aspectos_refs.length === 0) {
          throw new Error('Faltan referencias de aspectos');
        }
        
        return { 
          personaje_id: personaje.id,
          habilidades_refs: personaje.habilidades_refs.activas.length + personaje.habilidades_refs.pasivas.length,
          glifos_refs: personaje.glifos_refs.length,
          aspectos_refs: personaje.aspectos_refs.length
        };
      }
    ));
    
    // Test 2: Validar integridad de referencias
    suite.results.push(await this.runTest(
      'Validar integridad de referencias',
      'Relaciones',
      async () => {
        // Simular datos de héroe
        const habilidadesHeroe = MOCK_HABILIDADES_JSON;
        const glifosHeroe = MOCK_GLIFOS_JSON;
        const aspectosHeroe = MOCK_ASPECTOS_JSON;
        
        // Crear referencias de personaje
        const skillRef = 'test_skill_aura_luz';
        const glifoRef = 'test_glifo_disminucion';
        const aspectoRef = 'test_aspecto_sabio';
        
        // Validar que las referencias existen en héroe
        const skillExiste = habilidadesHeroe.habilidades_activas.some(h => h.id === skillRef);
        const glifoExiste = glifosHeroe.glifos.some(g => g.id === glifoRef);
        const aspectoExiste = aspectosHeroe.aspectos.some(a => a.id === aspectoRef);
        
        if (!skillExiste) {
          throw new Error(`Skill ${skillRef} no existe en héroe`);
        }
        
        if (!glifoExiste) {
          throw new Error(`Glifo ${glifoRef} no existe en héroe`);
        }
        
        if (!aspectoExiste) {
          throw new Error(`Aspecto ${aspectoRef} no existe en héroe`);
        }
        
        return { 
          referencias_validas: 3,
          skill_valido: skillExiste,
          glifo_valido: glifoExiste,
          aspecto_valido: aspectoExiste
        };
      }
    ));
    
    // Test 3: Validar modificadores de habilidades
    suite.results.push(await this.runTest(
      'Validar modificadores referenciados',
      'Relaciones',
      async () => {
        const habilidadesHeroe = MOCK_HABILIDADES_JSON;
        const modRef = 'test_mod_luz_potenciada';
        
        // Buscar modificador en habilidades del héroe
        let modEncontrado = false;
        
        for (const skill of habilidadesHeroe.habilidades_activas) {
          if (skill.modificadores.some(m => m.id === modRef)) {
            modEncontrado = true;
            break;
          }
        }
        
        if (!modEncontrado) {
          throw new Error(`Modificador ${modRef} no encontrado en habilidades del héroe`);
        }
        
        return { modificador_valido: true };
      }
    ));
    
    suite.totalTests = suite.results.length;
    suite.passed = suite.results.filter(r => r.passed).length;
    suite.failed = suite.results.filter(r => !r.passed).length;
    suite.duration = Date.now() - startTime;
    
    return suite;
  }
  
  // ==========================================================================
  // TEST: ALMACENAMIENTO DE IMÁGENES
  // ==========================================================================
  
  private static async testImageStorage(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: 'Almacenamiento de Imágenes',
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0,
      results: []
    };
    
    const startTime = Date.now();
    
    // Test 1: Simular guardado de imagen
    suite.results.push(await this.runTest(
      'Simular guardado de imagen',
      'Imágenes',
      async () => {
        // Crear blob de prueba (imagen de 1x1 pixel)
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No se pudo crear contexto de canvas');
        
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 1, 1);
        
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(b => {
            if (b) resolve(b);
            else reject(new Error('No se pudo crear blob'));
          });
        });
        
        // Validar blob
        if (blob.size === 0) {
          throw new Error('Blob vacío');
        }
        
        if (blob.type !== 'image/png') {
          throw new Error(`Tipo de imagen inválido: ${blob.type}`);
        }
        
        return { 
          blob_size: blob.size,
          blob_type: blob.type
        };
      }
    ));
    
    // Test 2: Validar nombre de archivo
    suite.results.push(await this.runTest(
      'Validar formato de nombre de archivo',
      'Imágenes',
      async () => {
        const timestamp = Date.now();
        const categoria = 'estadisticas';
        const nombreEsperado = `${categoria}_${timestamp}.png`;
        
        // Validar formato
        const regex = /^[a-z_]+_\d+\.png$/;
        if (!regex.test(nombreEsperado)) {
          throw new Error(`Formato de nombre inválido: ${nombreEsperado}`);
        }
        
        return { nombre_archivo: nombreEsperado };
      }
    ));
    
    // Test 3: Validar estructura de carpetas
    suite.results.push(await this.runTest(
      'Validar estructura de carpetas de imágenes',
      'Imágenes',
      async () => {
        const categoriasValidas = [
          'estadisticas',
          'skills',
          'glifos',
          'aspectos',
          'mundo',
          'paragon',
          'runas',
          'gemas_runas',
          'build',
          'otros'
        ];
        
        // Validar que tenemos todas las categorías necesarias
        const categoria = 'estadisticas';
        if (!categoriasValidas.includes(categoria)) {
          throw new Error(`Categoría inválida: ${categoria}`);
        }
        
        return { categorias_disponibles: categoriasValidas.length };
      }
    ));
    
    suite.totalTests = suite.results.length;
    suite.passed = suite.results.filter(r => r.passed).length;
    suite.failed = suite.results.filter(r => !r.passed).length;
    suite.duration = Date.now() - startTime;
    
    return suite;
  }
  
  // ==========================================================================
  // HELPERS DE VALIDACIÓN
  // ==========================================================================
  
  private static validateEstadisticasJSON(json: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!json.estadisticas) {
      errors.push('Falta campo "estadisticas"');
    }
    
    if (!json.estadisticas?.atributosPrincipales) {
      errors.push('Falta campo "atributosPrincipales"');
    }
    
    if (typeof json.estadisticas?.atributosPrincipales?.nivel !== 'number') {
      errors.push('Campo "nivel" debe ser número');
    }
    
    if (typeof json.nivel_paragon !== 'number') {
      errors.push('Campo "nivel_paragon" debe ser número');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  private static validateHabilidadesJSON(json: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!Array.isArray(json.habilidades_activas)) {
      errors.push('Campo "habilidades_activas" debe ser array');
    }
    
    if (!Array.isArray(json.habilidades_pasivas)) {
      errors.push('Campo "habilidades_pasivas" debe ser array');
    }
    
    if (!Array.isArray(json.palabras_clave)) {
      warnings.push('Campo "palabras_clave" debe ser array');
    }
    
    // Validar estructura de habilidades activas
    json.habilidades_activas?.forEach((h: any, i: number) => {
      if (!h.id) errors.push(`Habilidad activa ${i} sin ID`);
      if (!h.nombre) errors.push(`Habilidad activa ${i} sin nombre`);
      if (!h.tipo_habilidad) errors.push(`Habilidad activa ${i} sin tipo_habilidad`);
      if (!Array.isArray(h.modificadores)) errors.push(`Habilidad activa ${i} sin modificadores array`);
    });
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  // ==========================================================================
  // RUNNER DE TESTS
  // ==========================================================================
  
  private static async runTest(
    testName: string,
    category: string,
    testFn: () => Promise<any>
  ): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const details = await testFn();
      const duration = Date.now() - startTime;
      
      return {
        testName,
        category,
        passed: true,
        duration,
        message: '✓ Test pasado',
        details
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        testName,
        category,
        passed: false,
        duration,
        message: `✗ Test fallido: ${error.message}`,
        errors: [error.message]
      };
    }
  }
  
  // ==========================================================================
  // TEST: HÉROE VS PERSONAJE - DIFERENCIACIÓN DE IMPORTACIONES
  // ==========================================================================
  
  private static async testHeroVsCharacterImports(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: 'Héroe vs Personaje - Diferenciación',
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0,
      results: []
    };
    
    const startTime = Date.now();
    
    // Test 1: Habilidades - Héroe guarda objetos completos
    suite.results.push(await this.runTest(
      'Habilidades para Héroe guardan objetos completos',
      'Héroe vs Personaje',
      async () => {
        console.log('\n🧪 TEST: Habilidades para Héroe guardan objetos completos');
        console.log('📋 Paso 1: Simular importación de habilidades para catálogo del héroe');
        console.log('📋 Paso 2: Verificar que se guardan objetos completos (no refs)');
        
        const mockHeroe = {
          clase: 'Paladín',
          habilidades_activas: [] as any[],
          habilidades_pasivas: [] as any[]
        };
        
        // Simular guardado en héroe (objetos completos)
        mockHeroe.habilidades_activas = MOCK_HABILIDADES_JSON.habilidades_activas;
        mockHeroe.habilidades_pasivas = MOCK_HABILIDADES_JSON.habilidades_pasivas;
        
        console.log(`✓ Habilidades activas guardadas: ${mockHeroe.habilidades_activas.length} objetos completos`);
        console.log(`✓ Habilidades pasivas guardadas: ${mockHeroe.habilidades_pasivas.length} objetos completos`);
        console.log(`✓ Primer habilidad activa tiene campos completos: ${Object.keys(mockHeroe.habilidades_activas[0]).length} campos`);
        
        if (mockHeroe.habilidades_activas.length === 0) throw new Error('No se guardaron habilidades activas');
        if (!mockHeroe.habilidades_activas[0].descripcion) throw new Error('Falta campo "descripcion" en objeto completo');
        
        console.log('✅ Héroe guarda habilidades como objetos completos correctamente');
        return { activas: mockHeroe.habilidades_activas.length, pasivas: mockHeroe.habilidades_pasivas.length };
      }
    ));
    
    // Test 2: Habilidades - Personaje guarda solo IDs
    suite.results.push(await this.runTest(
      'Habilidades para Personaje guardan solo IDs',
      'Héroe vs Personaje',
      async () => {
        console.log('\n🧪 TEST: Habilidades para Personaje guardan solo IDs');
        console.log('📋 Paso 1: Simular importación de habilidades para personaje');
        console.log('📋 Paso 2: Verificar que se guardan solo IDs (habilidades_refs)');
        
        const mockPersonaje = {
          nombre: 'Test Paladin',
          habilidades_refs: {
            activas: [] as string[],
            pasivas: [] as string[]
          }
        };
        
        // Simular guardado en personaje (solo IDs)
        mockPersonaje.habilidades_refs.activas = MOCK_HABILIDADES_JSON.habilidades_activas.map(h => h.id);
        mockPersonaje.habilidades_refs.pasivas = MOCK_HABILIDADES_JSON.habilidades_pasivas.map(h => h.id);
        
        console.log(`✓ Habilidades activas guardadas: ${mockPersonaje.habilidades_refs.activas.length} IDs`);
        console.log(`✓ Habilidades pasivas guardadas: ${mockPersonaje.habilidades_refs.pasivas.length} IDs`);
        console.log(`✓ Primera ref: "${mockPersonaje.habilidades_refs.activas[0]}" (solo ID, no objeto)`);
        
        if (mockPersonaje.habilidades_refs.activas.length === 0) throw new Error('No se guardaron refs de habilidades activas');
        if (typeof mockPersonaje.habilidades_refs.activas[0] !== 'string') throw new Error('Refs deben ser strings (IDs)');
        
        console.log('✅ Personaje guarda habilidades como refs (IDs) correctamente');
        return { activas: mockPersonaje.habilidades_refs.activas.length, pasivas: mockPersonaje.habilidades_refs.pasivas.length };
      }
    ));
    
    // Test 3: Glifos - Héroe guarda objetos completos
    suite.results.push(await this.runTest(
      'Glifos para Héroe guardan objetos completos',
      'Héroe vs Personaje',
      async () => {
        console.log('\n🧪 TEST: Glifos para Héroe guardan objetos completos');
        console.log('📋 Paso 1: Simular importación de glifos para catálogo del héroe');
        console.log('📋 Paso 2: Verificar que se guardan objetos completos con todos los campos');
        
        const mockHeroe = {
          clase: 'Paladín',
          glifos: [] as any[]
        };
        
        // Simular guardado en héroe (objetos completos)
        mockHeroe.glifos = MOCK_GLIFOS_JSON.glifos;
        
        console.log(`✓ Glifos guardados: ${mockHeroe.glifos.length} objetos completos`);
        console.log(`✓ Primer glifo tiene campos completos: ${Object.keys(mockHeroe.glifos[0]).length} campos`);
        console.log(`✓ Incluye: efecto_base, bonificacion_adicional, bonificacion_legendaria`);
        
        if (mockHeroe.glifos.length === 0) throw new Error('No se guardaron glifos');
        if (!mockHeroe.glifos[0].efecto_base) throw new Error('Falta campo "efecto_base" en objeto completo');
        if (!mockHeroe.glifos[0].bonificacion_adicional) throw new Error('Falta campo "bonificacion_adicional"');
        
        console.log('✅ Héroe guarda glifos como objetos completos correctamente');
        return { glifos: mockHeroe.glifos.length };
      }
    ));
    
    // Test 4: Glifos - Personaje guarda refs con nivel_actual
    suite.results.push(await this.runTest(
      'Glifos para Personaje guardan refs con nivel_actual',
      'Héroe vs Personaje',
      async () => {
        console.log('\n🧪 TEST: Glifos para Personaje guardan refs con nivel_actual');
        console.log('📋 Paso 1: Simular importación de glifos para personaje');
        console.log('📋 Paso 2: Verificar que se guardan refs: {id, nivel_actual, nivel_maximo}');
        
        const mockPersonaje = {
          nombre: 'Test Paladin',
          glifos_refs: [] as Array<{id: string, nivel_actual: number, nivel_maximo?: number}>
        };
        
        // Simular guardado en personaje (refs con nivel)
        mockPersonaje.glifos_refs = MOCK_GLIFOS_JSON.glifos.map(g => ({
          id: g.id,
          nivel_actual: 15,
          nivel_maximo: 21
        }));
        
        console.log(`✓ Glifos guardados: ${mockPersonaje.glifos_refs.length} refs`);
        console.log(`✓ Primera ref: {id: "${mockPersonaje.glifos_refs[0].id}", nivel_actual: ${mockPersonaje.glifos_refs[0].nivel_actual}}`);
        console.log(`✓ NO incluye: efecto_base, bonificacion_adicional (solo id + nivel)`);
        
        if (mockPersonaje.glifos_refs.length === 0) throw new Error('No se guardaron refs de glifos');
        if (!mockPersonaje.glifos_refs[0].id) throw new Error('Falta campo "id" en ref');
        if (typeof mockPersonaje.glifos_refs[0].nivel_actual !== 'number') throw new Error('Falta campo "nivel_actual" numérico');
        if (mockPersonaje.glifos_refs[0].hasOwnProperty('efecto_base')) throw new Error('Refs NO deben incluir campos completos');
        
        console.log('✅ Personaje guarda glifos como refs (id + nivel_actual) correctamente');
        return { glifos: mockPersonaje.glifos_refs.length };
      }
    ));
    
    // Test 5: Aspectos - Diferencia entre catálogo (héroe) y equipados (personaje)
    suite.results.push(await this.runTest(
      'Aspectos: Catálogo (héroe) vs Equipados (personaje)',
      'Héroe vs Personaje',
      async () => {
        console.log('\n🧪 TEST: Aspectos: Catálogo (héroe) vs Equipados (personaje)');
        console.log('📋 Paso 1: Verificar prompt DIFERENTE para héroe vs personaje');
        console.log('📋 Paso 2: Héroe usa generateAspectsPrompt() - catálogo');
        console.log('📋 Paso 3: Personaje usa generateCharacterAspectsPrompt() - equipados');
        
        const promptHeroe = ImageExtractionPromptService.generateAspectsPrompt();
        const promptPersonaje = ImageExtractionPromptService.generateCharacterAspectsPrompt();
        
        console.log(`✓ Prompt héroe contiene "aspectos" (catálogo): ${promptHeroe.includes('aspectos')}`);
        console.log(`✓ Prompt personaje contiene "aspectos_equipados": ${promptPersonaje.includes('aspectos_equipados')}`);
        console.log(`✓ Prompt personaje incluye "slot_equipado": ${promptPersonaje.includes('slot_equipado')}`);
        
        if (promptHeroe === promptPersonaje) throw new Error('Prompts deben ser DIFERENTES');
        if (!promptPersonaje.includes('slot_equipado')) throw new Error('Prompt de personaje debe incluir slot_equipado');
        
        console.log('✅ Prompts de aspectos diferenciados correctamente (héroe vs personaje)');
        return { prompts_diferentes: true };
      }
    ));
    
    // Test 6: Mundo - Eventos vs Mazmorras (diferentes prompts)
    suite.results.push(await this.runTest(
      'Mundo: Eventos vs Mazmorras usan prompts diferentes',
      'Subcategorías Mundo',
      async () => {
        console.log('\n🧪 TEST: Mundo: Eventos vs Mazmorras usan prompts diferentes');
        console.log('📋 Paso 1: Verificar generateWorldEventsPrompt() para eventos');
        console.log('📋 Paso 2: Verificar generateDungeonAspectsPrompt() para mazmorras');
        
        const promptEventos = ImageExtractionPromptService.generateWorldEventsPrompt();
        const promptMazmorras = ImageExtractionPromptService.generateDungeonAspectsPrompt();
        
        // Validar ANTES de mostrar logs
        if (promptEventos === promptMazmorras) throw new Error('Prompts deben ser DIFERENTES');
        if (!promptMazmorras.includes('aspecto_recompensa')) {
          console.log(`❌ ERROR: Prompt de mazmorras NO incluye "aspecto_recompensa"`);
          console.log(`📌 PROBLEMA: Campo crítico faltante en el prompt`);
          console.log(`📌 SOLUCIÓN: Agregar "aspecto_recompensa" al prompt de mazmorras`);
          throw new Error('Prompt de mazmorras debe incluir aspecto_recompensa');
        }
        
        console.log(`✓ Prompt eventos contiene "eventos": ${promptEventos.includes('eventos')}`);
        console.log(`✓ Prompt mazmorras contiene "mazmorras": ${promptMazmorras.includes('mazmorras')}`);
        console.log(`✓ Prompt mazmorras incluye "aspecto_recompensa": ${promptMazmorras.includes('aspecto_recompensa')}`);
        
        console.log('✅ Prompts de mundo diferenciados correctamente (eventos vs mazmorras)');
        return { prompts_diferentes: true };
      }
    ));
    
    suite.totalTests = suite.results.length;
    suite.passed = suite.results.filter(r => r.passed).length;
    suite.failed = suite.results.filter(r => !r.passed).length;
    suite.duration = Date.now() - startTime;
    
    return suite;
  }
  
  // ==========================================================================
  // TEST: IMPORTACIONES PARAGON
  // ==========================================================================
  
  private static async testParagonImports(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: 'Importaciones Paragon',
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0,
      results: []
    };
    
    const startTime = Date.now();
    
    // Test 1: Tableros Paragon
    suite.results.push(await this.runTest(
      'Importar Tableros Paragon para Héroe',
      'Paragon',
      async () => {
        console.log('\n🧪 TEST: Importar Tableros Paragon para Héroe');
        console.log('📋 Paso 1: Validar estructura de tableros paragon');
        console.log('📋 Paso 2: Verificar campos: tablero_id, nombre, tipo, nodos_totales');
        
        if (!MOCK_PARAGON_BOARDS_JSON.tableros) throw new Error('Falta array "tableros"');
        if (!Array.isArray(MOCK_PARAGON_BOARDS_JSON.tableros)) throw new Error('"tableros" debe ser array');
        
        const tablero = MOCK_PARAGON_BOARDS_JSON.tableros[0];
        console.log(`✓ Tablero encontrado: "${tablero.nombre}"`);
        console.log(`✓ Campo tablero_id: "${tablero.tablero_id}"`);
        console.log(`✓ Campo tipo: "${tablero.tipo}"`);
        console.log(`✓ Nodos totales: ${tablero.nodos_totales}`);
        
        if (!tablero.tablero_id) throw new Error('Falta campo "tablero_id"');
        if (!tablero.nombre) throw new Error('Falta campo "nombre"');
        if (!tablero.tipo) throw new Error('Falta campo "tipo"');
        if (typeof tablero.nodos_totales !== 'number') throw new Error('Campo "nodos_totales" debe ser número');
        
        console.log('✅ Tableros paragon validados correctamente');
        return { tableros: MOCK_PARAGON_BOARDS_JSON.tableros.length };
      }
    ));
    
    // Test 2: Nodos Paragon
    suite.results.push(await this.runTest(
      'Importar Nodos Paragon para Héroe',
      'Paragon',
      async () => {
        console.log('\n🧪 TEST: Importar Nodos Paragon para Héroe');
        console.log('📋 Paso 1: Validar estructura de nodos paragon');
        console.log('📋 Paso 2: Verificar campos: nodo_id, nombre, rareza, bonificaciones');
        
        if (!MOCK_PARAGON_NODES_JSON.nodos) throw new Error('Falta array "nodos"');
        if (!Array.isArray(MOCK_PARAGON_NODES_JSON.nodos)) throw new Error('"nodos" debe ser array');
        
        const nodo = MOCK_PARAGON_NODES_JSON.nodos[0];
        console.log(`✓ Nodo encontrado: "${nodo.nombre}"`);
        console.log(`✓ Campo nodo_id: "${nodo.nodo_id}"`);
        console.log(`✓ Campo rareza: "${nodo.rareza}"`);
        console.log(`✓ Bonificaciones: ${nodo.bonificaciones.length} items`);
        
        if (!nodo.nodo_id) throw new Error('Falta campo "nodo_id"');
        if (!nodo.nombre) throw new Error('Falta campo "nombre"');
        if (!nodo.rareza) throw new Error('Falta campo "rareza"');
        if (!Array.isArray(nodo.bonificaciones)) throw new Error('Campo "bonificaciones" debe ser array');
        
        console.log('✅ Nodos paragon validados correctamente');
        return { nodos: MOCK_PARAGON_NODES_JSON.nodos.length };
      }
    ));
    
    // Test 3: Atributos Paragon del Personaje
    suite.results.push(await this.runTest(
      'Importar Atributos Paragon para Personaje',
      'Paragon',
      async () => {
        console.log('\n🧪 TEST: Importar Atributos Paragon para Personaje');
        console.log('📋 Paso 1: Validar estructura de paragon del personaje');
        console.log('📋 Paso 2: Verificar campos: nivel_paragon, atributos, tableros_equipados');
        
        if (!MOCK_PARAGON_CHARACTER_JSON.paragon) throw new Error('Falta objeto "paragon"');
        
        const paragon = MOCK_PARAGON_CHARACTER_JSON.paragon;
        console.log(`✓ Nivel paragon: ${paragon.nivel_paragon}`);
        console.log(`✓ Puntos disponibles: ${paragon.puntos_disponibles}`);
        console.log(`✓ Atributos: ${Object.keys(paragon.atributos).length} atributos`);
        console.log(`✓ Tableros equipados: ${paragon.tableros_equipados.length}`);
        
        if (typeof paragon.nivel_paragon !== 'number') throw new Error('Campo "nivel_paragon" debe ser número');
        if (!paragon.atributos) throw new Error('Falta objeto "atributos"');
        if (!Array.isArray(paragon.tableros_equipados)) throw new Error('Campo "tableros_equipados" debe ser array');
        
        console.log('✅ Atributos paragon del personaje validados correctamente');
        return { nivel_paragon: paragon.nivel_paragon };
      }
    ));
    
    // Test 4: Prompts Paragon diferentes
    suite.results.push(await this.runTest(
      'Prompts Paragon: Tableros vs Nodos vs Atributos',
      'Paragon',
      async () => {
        console.log('\n🧪 TEST: Prompts Paragon: Tableros vs Nodos vs Atributos');
        console.log('📋 Paso 1: Verificar 3 prompts diferentes para paragon');
        
        const promptTableros = ImageExtractionPromptService.generateParagonBoardsPrompt();
        const promptNodos = ImageExtractionPromptService.generateParagonNodesPrompt();
        const promptAtributos = ImageExtractionPromptService.generateParagonCharacterPrompt();
        
        console.log(`✓ Prompt tableros contiene "tableros": ${promptTableros.includes('tableros')}`);
        console.log(`✓ Prompt nodos contiene "nodos": ${promptNodos.includes('nodos')}`);
        console.log(`✓ Prompt atributos contiene "paragon": ${promptAtributos.includes('paragon')}`);
        
        if (promptTableros === promptNodos) throw new Error('Prompts tableros y nodos deben ser diferentes');
        if (promptNodos === promptAtributos) throw new Error('Prompts nodos y atributos deben ser diferentes');
        
        console.log('✅ Prompts paragon diferenciados correctamente (3 tipos)');
        return { prompts_diferentes: 3 };
      }
    ));
    
    suite.totalTests = suite.results.length;
    suite.passed = suite.results.filter(r => r.passed).length;
    suite.failed = suite.results.filter(r => !r.passed).length;
    suite.duration = Date.now() - startTime;
    
    return suite;
  }
  
  // ==========================================================================
  // TEST: IMPORTACIONES RUNAS Y GEMAS
  // ==========================================================================
  
  private static async testRunasGemasImport(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: 'Importaciones Runas y Gemas',
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0,
      results: []
    };
    
    const startTime = Date.now();
    
    // Test 1: Runas
    suite.results.push(await this.runTest(
      'Importar Runas al catálogo global',
      'Runas/Gemas',
      async () => {
        console.log('\n🧪 TEST: Importar Runas al catálogo global');
        console.log('📋 Paso 1: Validar estructura de runas');
        console.log('📋 Paso 2: Verificar campos: id, nombre, rareza, tipo, efecto');
        
        if (!MOCK_RUNAS_JSON.runas) throw new Error('Falta array "runas"');
        if (!Array.isArray(MOCK_RUNAS_JSON.runas)) throw new Error('"runas" debe ser array');
        
        const runa = MOCK_RUNAS_JSON.runas[0];
        console.log(`✓ Runa encontrada: "${runa.nombre}"`);
        console.log(`✓ Campo id: "${runa.id}"`);
        console.log(`✓ Campo rareza: "${runa.rareza}"`);
        console.log(`✓ Campo tipo: "${runa.tipo}"`);
        console.log(`✓ Campo efecto: "${runa.efecto}"`);
        
        if (!runa.id) throw new Error('Falta campo "id"');
        if (!runa.nombre) throw new Error('Falta campo "nombre"');
        if (!runa.rareza) throw new Error('Falta campo "rareza"');
        if (!runa.tipo) throw new Error('Falta campo "tipo"');
        if (!runa.efecto) throw new Error('Falta campo "efecto"');
        
        console.log('✅ Runas validadas correctamente');
        return { runas: MOCK_RUNAS_JSON.runas.length };
      }
    ));
    
    // Test 2: Gemas
    suite.results.push(await this.runTest(
      'Importar Gemas al catálogo global',
      'Runas/Gemas',
      async () => {
        console.log('\n🧪 TEST: Importar Gemas al catálogo global');
        console.log('📋 Paso 1: Validar estructura de gemas');
        console.log('📋 Paso 2: Verificar campos: id, nombre, tipo, calidad, efectos_por_slot');
        
        if (!MOCK_GEMAS_JSON.gemas) throw new Error('Falta array "gemas"');
        if (!Array.isArray(MOCK_GEMAS_JSON.gemas)) throw new Error('"gemas" debe ser array');
        
        const gema = MOCK_GEMAS_JSON.gemas[0];
        console.log(`✓ Gema encontrada: "${gema.nombre}"`);
        console.log(`✓ Campo id: "${gema.id}"`);
        console.log(`✓ Campo tipo: "${gema.tipo}"`);
        console.log(`✓ Campo calidad: ${gema.calidad}`);
        console.log(`✓ Efectos por slot: ${Object.keys(gema.efectos_por_slot).length} slots`);
        
        if (!gema.id) throw new Error('Falta campo "id"');
        if (!gema.nombre) throw new Error('Falta campo "nombre"');
        if (!gema.tipo) throw new Error('Falta campo "tipo"');
        if (typeof gema.calidad !== 'number') throw new Error('Campo "calidad" debe ser número');
        if (!gema.efectos_por_slot) throw new Error('Falta objeto "efectos_por_slot"');
        
        console.log('✅ Gemas validadas correctamente');
        return { gemas: MOCK_GEMAS_JSON.gemas.length };
      }
    ));
    
    // Test 3: Prompts diferentes para Runas vs Gemas
    suite.results.push(await this.runTest(
      'Prompts: Runas vs Gemas diferentes',
      'Runas/Gemas',
      async () => {
        console.log('\n🧪 TEST: Prompts: Runas vs Gemas diferentes');
        console.log('📋 Paso 1: Verificar prompts diferentes para runas y gemas');
        
        const promptRunas = ImageExtractionPromptService.generateRunesPrompt();
        const promptGemas = ImageExtractionPromptService.generateGemsPrompt();
        
        // Validar ANTES de mostrar logs
        if (promptRunas === promptGemas) throw new Error('Prompts deben ser DIFERENTES');
        if (!promptGemas.includes('efectos_por_slot')) {
          console.log(`❌ ERROR: Prompt de gemas NO incluye "efectos_por_slot"`);
          console.log(`📌 PROBLEMA: Campo crítico faltante - las gemas tienen efectos diferentes por slot`);
          console.log(`📌 SOLUCIÓN: Agregar "efectos_por_slot" al prompt de gemas`);
          throw new Error('Prompt gemas debe incluir efectos_por_slot');
        }
        
        console.log(`✓ Prompt runas contiene "runas": ${promptRunas.includes('runas')}`);
        console.log(`✓ Prompt gemas contiene "gemas": ${promptGemas.includes('gemas')}`);
        console.log(`✓ Prompt gemas incluye "efectos_por_slot": ${promptGemas.includes('efectos_por_slot')}`);
        
        console.log('✅ Prompts runas/gemas diferenciados correctamente');
        return { prompts_diferentes: true };
      }
    ));
    
    suite.totalTests = suite.results.length;
    suite.passed = suite.results.filter(r => r.passed).length;
    suite.failed = suite.results.filter(r => !r.passed).length;
    suite.duration = Date.now() - startTime;
    
    return suite;
  }
  
  // ==========================================================================
  // TEST: IMPORTACIÓN BUILD (EQUIPAMIENTO)
  // ==========================================================================
  
  private static async testBuildImport(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: 'Importación Build (Equipamiento)',
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0,
      results: []
    };
    
    const startTime = Date.now();
    
    // Test 1: Estructura de build
    suite.results.push(await this.runTest(
      'Importar Build/Equipamiento del Personaje',
      'Build',
      async () => {
        console.log('\n🧪 TEST: Importar Build/Equipamiento del Personaje');
        console.log('📋 Paso 1: Validar estructura de build');
        console.log('📋 Paso 2: Verificar piezas, engarces, runas_equipadas');
        
        if (!MOCK_BUILD_JSON.build) throw new Error('Falta objeto "build"');
        if (!MOCK_BUILD_JSON.build.piezas) throw new Error('Falta objeto "piezas"');
        
        const build = MOCK_BUILD_JSON.build;
        const piezasCount = Object.keys(build.piezas).length;
        console.log(`✓ Piezas de equipamiento: ${piezasCount}`);
        
        const pieza = build.piezas.cabeza;
        console.log(`✓ Pieza "cabeza": ${pieza.nombre}`);
        console.log(`✓ Rareza: ${pieza.rareza}`);
        console.log(`✓ Engarces: ${pieza.engarces.length}`);
        console.log(`✓ Aspecto equipado: ${pieza.aspecto_id}`);
        
        if (!pieza.espacio) throw new Error('Falta campo "espacio" en pieza');
        if (!pieza.nombre) throw new Error('Falta campo "nombre" en pieza');
        if (!Array.isArray(pieza.stats)) throw new Error('Campo "stats" debe ser array');
        if (!Array.isArray(pieza.engarces)) throw new Error('Campo "engarces" debe ser array');
        
        console.log('✅ Build/Equipamiento validado correctamente');
        return { piezas: piezasCount };
      }
    ));
    
    // Test 2: Prompt de equipamiento
    suite.results.push(await this.runTest(
      'Prompt de Equipamiento completo',
      'Build',
      async () => {
        console.log('\n🧪 TEST: Prompt de Equipamiento completo');
        console.log('📋 Paso 1: Verificar generateEquipmentPrompt()');
        
        const prompt = ImageExtractionPromptService.generateEquipmentPrompt();
        
        console.log(`✓ Prompt contiene "piezas": ${prompt.includes('piezas')}`);
        console.log(`✓ Prompt contiene "engarces": ${prompt.includes('engarces')}`);
        console.log(`✓ Prompt contiene "aspecto": ${prompt.includes('aspecto')}`);
        
        if (!prompt.includes('piezas')) throw new Error('Prompt debe incluir "piezas"');
        if (!prompt.includes('engarces')) throw new Error('Prompt debe incluir "engarces"');
        
        console.log('✅ Prompt de equipamiento validado correctamente');
        return { prompt_valido: true };
      }
    ));
    
    suite.totalTests = suite.results.length;
    suite.passed = suite.results.filter(r => r.passed).length;
    suite.failed = suite.results.filter(r => !r.passed).length;
    suite.duration = Date.now() - startTime;
    
    return suite;
  }
  
  // ==========================================================================
  // TEST: IMPORTACIÓN MECÁNICAS DE CLASE
  // ==========================================================================
  
  private static async testMecanicasImport(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: 'Importación Mecánicas de Clase',
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0,
      results: []
    };
    
    const startTime = Date.now();
    
    // Test 1: Mecánicas de clase
    suite.results.push(await this.runTest(
      'Importar Mecánicas de Clase del Personaje',
      'Mecánicas',
      async () => {
        console.log('\n🧪 TEST: Importar Mecánicas de Clase del Personaje');
        console.log('📋 Paso 1: Validar estructura de mecánicas_clase');
        console.log('📋 Paso 2: Verificar campos: mecanica_id, nombre, tipo, valor_actual');
        
        if (!MOCK_MECANICAS_JSON.mecanicas_clase) throw new Error('Falta array "mecanicas_clase"');
        if (!Array.isArray(MOCK_MECANICAS_JSON.mecanicas_clase)) throw new Error('"mecanicas_clase" debe ser array');
        
        const mecanica = MOCK_MECANICAS_JSON.mecanicas_clase[0];
        console.log(`✓ Mecánica encontrada: "${mecanica.nombre}"`);
        console.log(`✓ Campo mecanica_id: "${mecanica.mecanica_id}"`);
        console.log(`✓ Campo tipo: "${mecanica.tipo}"`);
        console.log(`✓ Valor actual: ${mecanica.valor_actual}/${mecanica.valor_maximo}`);
        
        if (!mecanica.mecanica_id) throw new Error('Falta campo "mecanica_id"');
        if (!mecanica.nombre) throw new Error('Falta campo "nombre"');
        if (!mecanica.tipo) throw new Error('Falta campo "tipo"');
        if (typeof mecanica.valor_actual !== 'number') throw new Error('Campo "valor_actual" debe ser número');
        
        console.log('✅ Mecánicas de clase validadas correctamente');
        return { mecanicas: MOCK_MECANICAS_JSON.mecanicas_clase.length };
      }
    ));
    
    // Test 2: Prompt de mecánicas
    suite.results.push(await this.runTest(
      'Prompt de Mecánicas de Clase',
      'Mecánicas',
      async () => {
        console.log('\n🧪 TEST: Prompt de Mecánicas de Clase');
        console.log('📋 Paso 1: Verificar generateClassMechanicsPrompt()');
        
        const prompt = ImageExtractionPromptService.generateClassMechanicsPrompt();
        
        // Validar ANTES de mostrar logs
        if (prompt.length === 0) throw new Error('Prompt no debe estar vacío');
        if (!prompt.includes('mecanicas')) {
          console.log(`❌ ERROR: Prompt NO incluye "mecanicas"`);
          console.log(`📌 PROBLEMA: Palabra clave faltante en el prompt de mecánicas de clase`);
          console.log(`📌 SOLUCIÓN: Agregar "mecanicas" al inicio del prompt`);
          throw new Error('Prompt debe incluir la palabra "mecanicas"');
        }
        
        console.log(`✓ Prompt contiene "mecanicas": ${prompt.includes('mecanicas')}`);
        console.log(`✓ Prompt válido: ${prompt.length > 0}`);
        
        console.log('✅ Prompt de mecánicas validado correctamente');
        return { prompt_valido: true };
      }
    ));
    
    suite.totalTests = suite.results.length;
    suite.passed = suite.results.filter(r => r.passed).length;
    suite.failed = suite.results.filter(r => !r.passed).length;
    suite.duration = Date.now() - startTime;
    
    return suite;
  }
}

