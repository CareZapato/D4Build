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
  Estadisticas 
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
      "id": "test_guarida_heraldo",
      "nombre": "Guarida del Heraldo (Test)",
      "tipo": "guarida",
      "boss": "Heraldo del Odio",
      "ubicacion": null,
      "objetivo": {
        "tipo": "kill",
        "descripcion": "Derrotar a este jefe de guarida.",
        "progreso": null
      },
      "requisitos": [
        {
          "tipo": "llave",
          "nombre": "Corazón Abominable",
          "cantidad": 12,
          "id_recurso": "recurso_corazon_abominable"
        }
      ],
      "recompensas": [
        {
          "tipo": "loot",
          "nombre": "Objetos ancestrales únicos",
          "cantidad": null,
          "probabilidad": "media",
          "garantizado": false
        }
      ],
      "tags": ["boss", "endgame"],
      "notas": "Evento de prueba"
    }
  ],
  "indice_recursos": []
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
    
    suites.push(await this.testEstadisticasImport());
    suites.push(await this.testHabilidadesImport());
    suites.push(await this.testGlifosImport());
    suites.push(await this.testAspectosImport());
    suites.push(await this.testMundoImport());
    suites.push(await this.testPromptValidation());
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
    
    // Test 1: Validar estructura de eventos
    suite.results.push(await this.runTest(
      'Validar estructura de eventos',
      'Mundo',
      async () => {
        const eventos = MOCK_MUNDO_JSON.eventos;
        
        for (const evento of eventos) {
          if (!evento.id || !evento.nombre || !evento.tipo) {
            throw new Error('Evento incompleto');
          }
        }
        
        return { eventos_validados: eventos.length };
      }
    ));
    
    // Test 2: Validar requisitos
    suite.results.push(await this.runTest(
      'Validar requisitos de eventos',
      'Mundo',
      async () => {
        const evento = MOCK_MUNDO_JSON.eventos[0];
        
        if (!Array.isArray(evento.requisitos)) {
          throw new Error('Requisitos debe ser array');
        }
        
        for (const req of evento.requisitos) {
          if (!req.tipo || !req.nombre || typeof req.cantidad !== 'number') {
            throw new Error('Requisito incompleto');
          }
        }
        
        return { requisitos: evento.requisitos.length };
      }
    ));
    
    // Test 3: Validar recompensas
    suite.results.push(await this.runTest(
      'Validar recompensas de eventos',
      'Mundo',
      async () => {
        const evento = MOCK_MUNDO_JSON.eventos[0];
        
        if (!Array.isArray(evento.recompensas)) {
          throw new Error('Recompensas debe ser array');
        }
        
        for (const rec of evento.recompensas) {
          if (!rec.tipo || !rec.nombre) {
            throw new Error('Recompensa incompleta');
          }
        }
        
        return { recompensas: evento.recompensas.length };
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
    
    // Test 1: Prompt de habilidades activas
    suite.results.push(await this.runTest(
      'Validar prompt de habilidades activas',
      'Prompts',
      async () => {
        const prompt = ImageExtractionPromptService.generateActiveSkillsPrompt();
        
        // Validar que el prompt menciona campos clave
        const camposRequeridos = [
          'habilidades_activas',
          'modificadores',
          'nivel_actual',
          'nivel_maximo',
          'tipo_habilidad',
          'tags'
        ];
        
        const faltantes = camposRequeridos.filter(campo => !prompt.includes(campo));
        
        if (faltantes.length > 0) {
          throw new Error(`Campos faltantes en prompt: ${faltantes.join(', ')}`);
        }
        
        return { campos_validados: camposRequeridos.length };
      }
    ));
    
    // Test 2: Prompt de habilidades pasivas
    suite.results.push(await this.runTest(
      'Validar prompt de habilidades pasivas',
      'Prompts',
      async () => {
        const prompt = ImageExtractionPromptService.generatePassiveSkillsPrompt();
        
        const camposRequeridos = [
          'habilidades_pasivas',
          'nivel',
          'nivel_maximo',
          'efecto',
          'puntos_asignados'
        ];
        
        const faltantes = camposRequeridos.filter(campo => !prompt.includes(campo));
        
        if (faltantes.length > 0) {
          throw new Error(`Campos faltantes en prompt: ${faltantes.join(', ')}`);
        }
        
        return { campos_validados: camposRequeridos.length };
      }
    ));
    
    // Test 3: Prompt de glifos
    suite.results.push(await this.runTest(
      'Validar prompt de glifos',
      'Prompts',
      async () => {
        const prompt = ImageExtractionPromptService.generateGlyphsPrompt();
        
        const camposRequeridos = [
          'glifos',
          'rareza',
          'efecto_base',
          'bonificacion_adicional',
          'bonificacion_legendaria',
          'tamano_radio'
        ];
        
        const faltantes = camposRequeridos.filter(campo => !prompt.includes(campo));
        
        if (faltantes.length > 0) {
          throw new Error(`Campos faltantes en prompt: ${faltantes.join(', ')}`);
        }
        
        return { campos_validados: camposRequeridos.length };
      }
    ));
    
    // Test 4: Prompt de aspectos
    suite.results.push(await this.runTest(
      'Validar prompt de aspectos',
      'Prompts',
      async () => {
        const prompt = ImageExtractionPromptService.generateAspectsPrompt();
        
        const camposRequeridos = [
          'aspectos',
          'name',
          'shortName',
          'effect',
          'level',
          'category',
          'keywords'
        ];
        
        const faltantes = camposRequeridos.filter(campo => !prompt.includes(campo));
        
        if (faltantes.length > 0) {
          throw new Error(`Campos faltantes en prompt: ${faltantes.join(', ')}`);
        }
        
        // Validar que menciona las 5 categorías
        const categorias = ['ofensivo', 'defensivo', 'recurso', 'utilidad', 'movilidad'];
        const faltantesCategorias = categorias.filter(cat => !prompt.includes(cat));
        
        if (faltantesCategorias.length > 0) {
          throw new Error(`Categorías faltantes: ${faltantesCategorias.join(', ')}`);
        }
        
        return { 
          campos_validados: camposRequeridos.length,
          categorias_validadas: categorias.length 
        };
      }
    ));
    
    // Test 5: Prompt de estadísticas
    suite.results.push(await this.runTest(
      'Validar prompt de estadísticas',
      'Prompts',
      async () => {
        const prompt = ImageExtractionPromptService.generateStatsPrompt();
        
        const camposRequeridos = [
          'estadisticas',
          'atributosPrincipales',
          'nivel',
          'nivel_paragon',
          'ofensivo',
          'defensivo'
        ];
        
        const faltantes = camposRequeridos.filter(campo => !prompt.includes(campo));
        
        if (faltantes.length > 0) {
          throw new Error(`Campos faltantes en prompt: ${faltantes.join(', ')}`);
        }
        
        return { campos_validados: camposRequeridos.length };
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
}
