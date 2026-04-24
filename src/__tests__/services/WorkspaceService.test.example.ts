// 🧪 Tests de Ejemplo para WorkspaceService
// Archivo de referencia para implementar tests de las funciones de importación

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkspaceService } from '../../services/WorkspaceService';
import {
  mockPersonajeBasico,
  mockPersonajeCompleto,
  mockEstadisticas,
  mockHabilidades,
  mockGlifos,
  mockAspectos,
  crearPersonajePrueba,
  esIDPrueba
} from '../mockData';

// ============================================================================
// MOCK DEL FILE SYSTEM ACCESS API
// ============================================================================

// Mock de FileSystemDirectoryHandle y FileSystemFileHandle
// Nota: En producción, usar una librería como 'memfs' o 'mock-fs'
const mockFileSystem = {
  files: new Map<string, string>(),
  
  async getFileHandle(name: string, options?: { create?: boolean }) {
    const exists = this.files.has(name);
    if (!exists && !options?.create) {
      throw new Error('File not found');
    }
    return {
      async getFile() {
        const content = mockFileSystem.files.get(name) || '';
        return new File([content], name, { type: 'application/json' });
      },
      async createWritable() {
        return {
          async write(data: string) {
            mockFileSystem.files.set(name, data);
          },
          async close() {}
        };
      }
    };
  },
  
  clear() {
    this.files.clear();
  }
};

// ============================================================================
// SETUP Y TEARDOWN
// ============================================================================

describe('WorkspaceService - Personajes', () => {
  beforeEach(() => {
    // Limpiar el sistema de archivos mock antes de cada test
    mockFileSystem.clear();
    
    // Mock del directorio del workspace
    vi.spyOn(WorkspaceService as any, 'workspaceHandle').mockReturnValue(mockFileSystem);
  });

  afterEach(() => {
    // Limpiar todos los personajes de prueba
    mockFileSystem.clear();
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // TESTS DE CREACIÓN DE PERSONAJES
  // ==========================================================================

  describe('savePersonaje', () => {
    it('debe crear un personaje nuevo correctamente', async () => {
      // Arrange
      const personaje = mockPersonajeBasico;

      // Act
      await WorkspaceService.savePersonaje(personaje);

      // Assert
      const archivo = mockFileSystem.files.get('personajes/test_personaje_001.json');
      expect(archivo).toBeDefined();
      
      const personajeGuardado = JSON.parse(archivo!);
      expect(personajeGuardado.id).toBe(personaje.id);
      expect(personajeGuardado.nombre).toBe(personaje.nombre);
      expect(personajeGuardado.clase).toBe(personaje.clase);
      expect(personajeGuardado.nivel).toBe(personaje.nivel);
    });

    it('debe crear personaje con estadísticas completas', async () => {
      // Arrange
      const personaje = crearPersonajePrueba({
        estadisticas: mockEstadisticas
      });

      // Act
      await WorkspaceService.savePersonaje(personaje);

      // Assert
      const cargado = await WorkspaceService.loadPersonaje(personaje.id);
      expect(cargado).not.toBeNull();
      expect(cargado?.estadisticas).toBeDefined();
      expect(cargado?.estadisticas?.atributosPrincipales.nivel).toBe(50);
      expect(cargado?.estadisticas?.atributosPrincipales.fuerza).toBe(520);
    });

    it('debe validar campos requeridos', async () => {
      // Arrange
      const personajeInvalido = {
        // Falta 'id'
        nombre: "Test",
        clase: "Paladín"
      } as any;

      // Act & Assert
      await expect(
        WorkspaceService.savePersonaje(personajeInvalido)
      ).rejects.toThrow();
    });
  });

  // ==========================================================================
  // TESTS DE ACTUALIZACIÓN CON MERGE
  // ==========================================================================

  describe('savePersonajeMerge', () => {
    it('debe actualizar personaje existente preservando datos', async () => {
      // Arrange
      const personajeOriginal = mockPersonajeCompleto;
      await WorkspaceService.savePersonaje(personajeOriginal);

      // Modificar solo las estadísticas
      const personajeActualizado = {
        ...personajeOriginal,
        estadisticas: {
          ...mockEstadisticas,
          atributosPrincipales: {
            ...mockEstadisticas.atributosPrincipales!,
            nivel: 60 // Cambio de nivel
          }
        }
      };

      // Act
      await WorkspaceService.savePersonajeMerge(personajeActualizado);

      // Assert
      const cargado = await WorkspaceService.loadPersonaje(personajeOriginal.id);
      expect(cargado).not.toBeNull();
      expect(cargado?.estadisticas?.atributosPrincipales.nivel).toBe(60);
      // Verificar que se preservaron otros datos
      expect(cargado?.habilidades_refs?.activas).toHaveLength(2);
      expect(cargado?.glifos_refs).toHaveLength(2);
    });

    it('debe actualizar fecha_actualizacion automáticamente', async () => {
      // Arrange
      const personaje = mockPersonajeBasico;
      await WorkspaceService.savePersonaje(personaje);

      const fechaOriginal = personaje.fecha_actualizacion;
      
      // Esperar un milisegundo para asegurar fecha diferente
      await new Promise(resolve => setTimeout(resolve, 10));

      // Act
      await WorkspaceService.savePersonajeMerge({
        ...personaje,
        nivel: 51
      });

      // Assert
      const cargado = await WorkspaceService.loadPersonaje(personaje.id);
      expect(cargado?.fecha_actualizacion).not.toBe(fechaOriginal);
      expect(cargado?.ultima_actualizacion).toBeDefined();
    });
  });

  // ==========================================================================
  // TESTS DE CARGA DE PERSONAJES
  // ==========================================================================

  describe('loadPersonaje', () => {
    it('debe cargar personaje existente correctamente', async () => {
      // Arrange
      const personaje = mockPersonajeCompleto;
      await WorkspaceService.savePersonaje(personaje);

      // Act
      const cargado = await WorkspaceService.loadPersonaje(personaje.id);

      // Assert
      expect(cargado).not.toBeNull();
      expect(cargado?.id).toBe(personaje.id);
      expect(cargado?.nombre).toBe(personaje.nombre);
      expect(cargado?.habilidades_refs).toBeDefined();
      expect(cargado?.glifos_refs).toBeDefined();
    });

    it('debe retornar null para personaje no existente', async () => {
      // Act
      const cargado = await WorkspaceService.loadPersonaje('no_existe');

      // Assert
      expect(cargado).toBeNull();
    });

    it('debe cargar correctamente referencias de habilidades', async () => {
      // Arrange
      const personaje = mockPersonajeCompleto;
      await WorkspaceService.savePersonaje(personaje);

      // Act
      const cargado = await WorkspaceService.loadPersonaje(personaje.id);

      // Assert
      expect(cargado?.habilidades_refs?.activas).toHaveLength(2);
      expect(cargado?.habilidades_refs?.activas[0].skill_id).toBe('skill_activa_aura_luz_sagrada');
      expect(cargado?.habilidades_refs?.activas[0].modificadores_ids).toHaveLength(2);
      expect(cargado?.habilidades_refs?.pasivas).toHaveLength(2);
    });
  });
});

// ============================================================================
// TESTS DE HABILIDADES DE HÉROE
// ============================================================================

describe('WorkspaceService - Habilidades de Héroe', () => {
  beforeEach(() => {
    mockFileSystem.clear();
    vi.spyOn(WorkspaceService as any, 'workspaceHandle').mockReturnValue(mockFileSystem);
  });

  afterEach(() => {
    mockFileSystem.clear();
    vi.restoreAllMocks();
  });

  describe('saveHeroSkills / loadHeroSkills', () => {
    it('debe guardar habilidades de héroe correctamente', async () => {
      // Arrange
      const clase = "Paladín";
      const habilidades = mockHabilidades;

      // Act
      await WorkspaceService.saveHeroSkills(clase, habilidades);

      // Assert
      const archivo = mockFileSystem.files.get('heroes/Paladín_habilidades.json');
      expect(archivo).toBeDefined();
      
      const guardadas = JSON.parse(archivo!);
      expect(guardadas.clase).toBe(clase);
      expect(guardadas.habilidades_activas).toHaveLength(2);
      expect(guardadas.habilidades_pasivas).toHaveLength(2);
    });

    it('debe cargar habilidades guardadas correctamente', async () => {
      // Arrange
      const clase = "Paladín";
      await WorkspaceService.saveHeroSkills(clase, mockHabilidades);

      // Act
      const cargadas = await WorkspaceService.loadHeroSkills(clase);

      // Assert
      expect(cargadas).not.toBeNull();
      expect(cargadas?.habilidades_activas[0].nombre).toBe('Aura de Luz Sagrada');
      expect(cargadas?.habilidades_activas[0].modificadores).toHaveLength(2);
      expect(cargadas?.palabras_clave).toHaveLength(2);
    });

    it('debe validar modificadores de habilidades', async () => {
      // Arrange
      const clase = "Paladín";
      await WorkspaceService.saveHeroSkills(clase, mockHabilidades);

      // Act
      const cargadas = await WorkspaceService.loadHeroSkills(clase);

      // Assert
      const primeraActiva = cargadas?.habilidades_activas[0];
      expect(primeraActiva?.modificadores[0].id).toBe('mod_luz_sagrada_potenciada');
      expect(primeraActiva?.modificadores[1].tags).toContain('fortificar');
    });
  });
});

// ============================================================================
// TESTS DE GLIFOS DE HÉROE
// ============================================================================

describe('WorkspaceService - Glifos de Héroe', () => {
  beforeEach(() => {
    mockFileSystem.clear();
    vi.spyOn(WorkspaceService as any, 'workspaceHandle').mockReturnValue(mockFileSystem);
  });

  afterEach(() => {
    mockFileSystem.clear();
    vi.restoreAllMocks();
  });

  describe('saveHeroGlyphs / loadHeroGlyphs', () => {
    it('debe guardar glifos de héroe correctamente', async () => {
      // Arrange
      const clase = "Paladín";
      const glifos = mockGlifos;

      // Act
      await WorkspaceService.saveHeroGlyphs(clase, glifos);

      // Assert
      const cargados = await WorkspaceService.loadHeroGlyphs(clase);
      expect(cargados).not.toBeNull();
      expect(cargados?.glifos).toHaveLength(3);
    });

    it('debe validar rarezas de glifos', async () => {
      // Arrange
      const clase = "Paladín";
      await WorkspaceService.saveHeroGlyphs(clase, mockGlifos);

      // Act
      const cargados = await WorkspaceService.loadHeroGlyphs(clase);

      // Assert
      const raros = cargados?.glifos.filter(g => g.rareza === 'Raro');
      const legendarios = cargados?.glifos.filter(g => g.rareza === 'Legendario');
      
      expect(raros).toHaveLength(2);
      expect(legendarios).toHaveLength(1);
    });

    it('debe cargar bonificaciones adicionales correctamente', async () => {
      // Arrange
      const clase = "Paladín";
      await WorkspaceService.saveHeroGlyphs(clase, mockGlifos);

      // Act
      const cargados = await WorkspaceService.loadHeroGlyphs(clase);

      // Assert
      const glifoEspiritu = cargados?.glifos.find(g => g.id === 'glifo_espiritu');
      expect(glifoEspiritu?.bonificacion_adicional).toBeDefined();
      expect(glifoEspiritu?.bonificacion_adicional?.requisito).toBe('25 de Voluntad');
      expect(glifoEspiritu?.atributo_escalado?.atributo).toBe('Voluntad');
    });
  });
});

// ============================================================================
// TESTS DE ASPECTOS DE HÉROE
// ============================================================================

describe('WorkspaceService - Aspectos de Héroe', () => {
  beforeEach(() => {
    mockFileSystem.clear();
    vi.spyOn(WorkspaceService as any, 'workspaceHandle').mockReturnValue(mockFileSystem);
  });

  afterEach(() => {
    mockFileSystem.clear();
    vi.restoreAllMocks();
  });

  describe('saveHeroAspects / loadHeroAspects', () => {
    it('debe guardar aspectos de héroe correctamente', async () => {
      // Arrange
      const clase = "Paladín";
      const aspectos = mockAspectos;

      // Act
      await WorkspaceService.saveHeroAspects(clase, aspectos);

      // Assert
      const cargados = await WorkspaceService.loadHeroAspects(clase);
      expect(cargados).not.toBeNull();
      expect(cargados?.aspectos).toHaveLength(5);
    });

    it('debe validar categorías de aspectos', async () => {
      // Arrange
      const clase = "Paladín";
      await WorkspaceService.saveHeroAspects(clase, mockAspectos);

      // Act
      const cargados = await WorkspaceService.loadHeroAspects(clase);

      // Assert
      const categorias = cargados?.aspectos.map(a => a.category);
      expect(categorias).toContain('ofensivo');
      expect(categorias).toContain('defensivo');
      expect(categorias).toContain('recurso');
      
      // Contar por categoría
      const ofensivos = cargados?.aspectos.filter(a => a.category === 'ofensivo');
      const defensivos = cargados?.aspectos.filter(a => a.category === 'defensivo');
      
      expect(ofensivos).toHaveLength(1);
      expect(defensivos).toHaveLength(3);
    });

    it('debe parsear formato de nivel correctamente', async () => {
      // Arrange
      const clase = "Paladín";
      await WorkspaceService.saveHeroAspects(clase, mockAspectos);

      // Act
      const cargados = await WorkspaceService.loadHeroAspects(clase);

      // Assert
      const aspectoSabio = cargados?.aspectos.find(a => a.id === 'aspecto_sabio_concurrido');
      expect(aspectoSabio?.level).toBe('13/21');
      
      // Validar que el nivel actual es menor o igual al máximo
      const [nivelActual, nivelMaximo] = aspectoSabio!.level.split('/').map(Number);
      expect(nivelActual).toBeLessThanOrEqual(nivelMaximo);
    });
  });
});

// ============================================================================
// TESTS DE INTEGRACIÓN
// ============================================================================

describe('WorkspaceService - Integración Completa', () => {
  beforeEach(() => {
    mockFileSystem.clear();
    vi.spyOn(WorkspaceService as any, 'workspaceHandle').mockReturnValue(mockFileSystem);
  });

  afterEach(() => {
    mockFileSystem.clear();
    vi.restoreAllMocks();
  });

  it('debe crear un flujo completo de héroe y personaje', async () => {
    // 1. Guardar datos maestro de héroe
    await WorkspaceService.saveHeroSkills("Paladín", mockHabilidades);
    await WorkspaceService.saveHeroGlyphs("Paladín", mockGlifos);
    await WorkspaceService.saveHeroAspects("Paladín", mockAspectos);

    // 2. Crear personaje con referencias
    const personaje = mockPersonajeCompleto;
    await WorkspaceService.savePersonaje(personaje);

    // 3. Cargar y validar
    const personajeCargado = await WorkspaceService.loadPersonaje(personaje.id);
    const habilidadesCargadas = await WorkspaceService.loadHeroSkills("Paladín");
    const glifosCargados = await WorkspaceService.loadHeroGlyphs("Paladín");
    const aspectosCargados = await WorkspaceService.loadHeroAspects("Paladín");

    // Validar que todo se cargó correctamente
    expect(personajeCargado).not.toBeNull();
    expect(habilidadesCargadas).not.toBeNull();
    expect(glifosCargados).not.toBeNull();
    expect(aspectosCargados).not.toBeNull();

    // Validar referencias
    expect(personajeCargado?.habilidades_refs?.activas).toHaveLength(2);
    expect(personajeCargado?.glifos_refs).toHaveLength(2);
    expect(personajeCargado?.aspectos_refs).toHaveLength(3);

    // Validar que las referencias apuntan a datos maestro válidos
    const primeraHabilidadRef = personajeCargado?.habilidades_refs?.activas[0].skill_id;
    const habilidadExiste = habilidadesCargadas?.habilidades_activas.some(
      h => h.id === primeraHabilidadRef
    );
    expect(habilidadExiste).toBe(true);
  });

  it('debe limpiar todos los datos de prueba', async () => {
    // Crear varios personajes de prueba
    const personaje1 = crearPersonajePrueba();
    const personaje2 = crearPersonajePrueba();
    const personaje3 = crearPersonajePrueba();

    await WorkspaceService.savePersonaje(personaje1);
    await WorkspaceService.savePersonaje(personaje2);
    await WorkspaceService.savePersonaje(personaje3);

    // Verificar que todos los archivos son IDs de prueba
    const archivos = Array.from(mockFileSystem.files.keys());
    const archivosPrueba = archivos.filter(a => {
      const contenido = mockFileSystem.files.get(a)!;
      const datos = JSON.parse(contenido);
      return esIDPrueba(datos.id);
    });

    expect(archivosPrueba.length).toBeGreaterThan(0);

    // Limpiar
    mockFileSystem.clear();

    // Validar limpieza
    expect(mockFileSystem.files.size).toBe(0);
  });
});

// ============================================================================
// NOTAS DE IMPLEMENTACIÓN
// ============================================================================

/*
 * IMPORTANTE: Este es un archivo de EJEMPLO
 * 
 * Para usar estos tests en producción:
 * 
 * 1. Instalar dependencias:
 *    npm install -D vitest @vitest/ui
 * 
 * 2. Configurar vitest.config.ts:
 *    import { defineConfig } from 'vitest/config'
 *    export default defineConfig({
 *      test: {
 *        globals: true,
 *        environment: 'jsdom',
 *      },
 *    })
 * 
 * 3. Implementar mocks completos del File System Access API
 *    (usar 'memfs' o similar)
 * 
 * 4. Agregar script al package.json:
 *    "test": "vitest",
 *    "test:ui": "vitest --ui",
 *    "test:coverage": "vitest --coverage"
 * 
 * 5. Ejecutar tests:
 *    npm test
 * 
 * 6. Ver resultados en UI:
 *    npm run test:ui
 */
