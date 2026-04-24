import { 
  IntegrityReport, 
  IntegrityTestResult, 
  IntegrityTestMetrics, 
  FileDifference,
  IntegrityTestProgress,
  Personaje,
  HabilidadesPersonaje,
  GlifosHeroe,
  AspectosHeroe,
  Estadisticas,
  Build,
  ParagonPersonaje
} from '../types';
import { ImageService } from './ImageService';
import type { ImageCategory } from './ImageService';

/**
 * IntegrityTestService (v0.8.4)
 * 
 * Servicio para testing de integridad de datos para usuarios Premium/Admin.
 * 
 * FUNCIONALIDADES:
 * - Crea workspace temporal en carpeta "Tests/"
 * - Ejecuta todos los JSONs guardados en galería de imágenes
 * - Valida importaciones con testing existente
 * - Compara archivos originales vs generados
 * - Genera reporte detallado con métricas
 * - Crea prompt diagnóstico para IA
 */
export class IntegrityTestService {
  private static testWorkspaceHandle: FileSystemDirectoryHandle | null = null;
  private static progressCallback: ((progress: IntegrityTestProgress) => void) | null = null;

  /**
   * Establece callback para reportar progreso
   */
  static setProgressCallback(callback: (progress: IntegrityTestProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Reporta progreso actual
   */
  private static reportProgress(progress: IntegrityTestProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  /**
   * Crea workspace temporal en carpeta "Tests/"
   * No afecta el workspace actual de trabajo
   */
  static async createTestWorkspace(baseWorkspaceHandle: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle> {
    try {
      this.reportProgress({
        status: 'running',
        currentTest: 0,
        totalTests: 0,
        currentFileName: 'Creando workspace temporal...',
        message: 'Preparando entorno de pruebas',
        progressPercent: 5
      });

      // Crear carpeta "Tests" en el workspace base
      const testsFolder = await baseWorkspaceHandle.getDirectoryHandle('Tests', { create: true });
      
      // Crear timestamp para esta ejecución
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const testRunFolder = await testsFolder.getDirectoryHandle(`test_run_${timestamp}`, { create: true });
      
      // Crear estructura completa del workspace temporal
      await testRunFolder.getDirectoryHandle('heroes', { create: true });
      await testRunFolder.getDirectoryHandle('personajes', { create: true });
      await testRunFolder.getDirectoryHandle('mundo', { create: true });
      
      const imagesDir = await testRunFolder.getDirectoryHandle('imagenes', { create: true });
      const categories: ImageCategory[] = [
        'skills', 'glifos', 'aspectos', 'estadisticas', 'paragon', 
        'gemas_runas', 'build', 'mundo', 'talismanes', 'mecanicas', 'otros'
      ];
      
      for (const cat of categories) {
        await imagesDir.getDirectoryHandle(cat, { create: true });
      }

      // Crear archivo de configuración del workspace temporal
      const configHandle = await testRunFolder.getFileHandle('workspace.json', { create: true });
      const writable = await configHandle.createWritable();
      await writable.write(JSON.stringify({
        ruta: testRunFolder.name,
        fecha_creacion: new Date().toISOString(),
        es_workspace_temporal: true,
        proposito: 'Integrity Testing'
      }, null, 2));
      await writable.close();

      this.testWorkspaceHandle = testRunFolder;
      console.log(`✅ Workspace temporal creado: Tests/${testRunFolder.name}`);
      
      return testRunFolder;
    } catch (error) {
      console.error('❌ Error creando workspace temporal:', error);
      throw new Error(`No se pudo crear workspace temporal: ${error}`);
    }
  }

  /**
   * Ordena los JSONs para ejecución en el orden correcto
   * 
   * ORDEN DE EJECUCIÓN:
   * 1. Estadísticas (crear personajes primero con datos básicos)
   * 2. Skills, Glifos, Aspectos, Paragon, Runas/Gemas, Build (datos que se enlazan a personajes)
   * 3. Mundo, Talismanes, Mecánicas, Otros (categorías independientes)
   */
  private static orderJSONsForExecution(
    jsons: Array<{ fileName: string; categoria: ImageCategory; content: string }>
  ): Array<{ fileName: string; categoria: ImageCategory; content: string }> {
    // Definir orden de prioridad
    const priorityOrder: Record<string, number> = {
      'estadisticas': 1,  // Primero: crear personajes
      'skills': 2,        // Segundo: datos de personaje
      'glifos': 2,
      'aspectos': 2,
      'paragon': 2,
      'gemas_runas': 2,   // Carpeta combinada
      'runas': 2,         // Carpeta individual
      'gemas': 2,         // Carpeta individual
      'build': 2,
      'talismanes': 3,    // Tercero: otros
      'mecanicas': 3,
      'mundo': 3,
      'otros': 3
    };

    return jsons.sort((a, b) => {
      const priorityA = priorityOrder[a.categoria] || 999;
      const priorityB = priorityOrder[b.categoria] || 999;
      
      // Ordenar por prioridad primero
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Si tienen la misma prioridad, ordenar alfabéticamente por nombre de archivo
      return a.fileName.localeCompare(b.fileName);
    });
  }

  /**
   * Lista todos los JSONs guardados en la galería de imágenes
   * Lee desde el workspace REAL (no el temporal) para encontrar los JSONs guardados
   */
  static async listAllGalleryJSONs(workspaceHandle: FileSystemDirectoryHandle): Promise<Array<{ fileName: string; categoria: ImageCategory; content: string }>> {
    const allJSONs: Array<{ fileName: string; categoria: ImageCategory; content: string }> = [];
    
    // Mapeo de categorías a carpetas físicas (algunas categorías comparten carpeta)
    const categoryFolderMap: Record<string, ImageCategory> = {
      'skills': 'skills',
      'glifos': 'glifos',
      'aspectos': 'aspectos',
      'estadisticas': 'estadisticas',
      'paragon': 'paragon',
      'gemas_runas': 'gemas_runas' as ImageCategory, // Carpeta física combinada
      'runas': 'runas',
      'gemas': 'gemas',
      'build': 'build',
      'mundo': 'mundo',
      'talismanes': 'talismanes',
      'mecanicas': 'mecanicas',
      'otros': 'otros'
    };

    this.reportProgress({
      status: 'running',
      currentTest: 0,
      totalTests: 0,
      currentFileName: 'Escaneando galería...',
      message: 'Buscando archivos JSON en todas las categorías',
      progressPercent: 10
    });

    console.log(`📂 Escaneando workspace: ${workspaceHandle.name}`);

    try {
      // Acceder a carpeta de imágenes en el workspace REAL
      const imagesFolder = await workspaceHandle.getDirectoryHandle('imagenes', { create: false });
      console.log(`✓ Carpeta imagenes encontrada`);

      // Escanear todas las carpetas físicas
      for (const [folderName, categoria] of Object.entries(categoryFolderMap)) {
        try {
          // Intentar acceder a la carpeta
          const categoryFolder = await imagesFolder.getDirectoryHandle(folderName, { create: false });
          console.log(`  📁 Escaneando ${folderName}...`);

          let jsonCount = 0;
          let totalFiles = 0;
          
          // @ts-ignore - File System Access API
          for await (const entry of categoryFolder.values()) {
            console.log(`     - Encontrado: ${entry.name} (tipo: ${entry.kind})`);
            totalFiles++;
            
            if (entry.kind === 'file' && entry.name.endsWith('.json')) {
              try {
                const fileHandle = await categoryFolder.getFileHandle(entry.name);
                const file = await fileHandle.getFile();
                const content = await file.text();
                
                allJSONs.push({
                  fileName: entry.name,
                  categoria: categoria,
                  content
                });
                jsonCount++;
                console.log(`    ✓ ${entry.name}`);
              } catch (error) {
                console.warn(`    ⚠️ Error leyendo ${entry.name}:`, error);
              }
            }
          }

          if (jsonCount > 0) {
            console.log(`  ✅ ${folderName}: ${jsonCount} JSONs encontrados (${totalFiles} archivos totales)`);
          } else if (totalFiles > 0) {
            console.log(`  ⊘ ${folderName}: ${totalFiles} archivos encontrados pero ningún .json`);
          }
        } catch (error) {
          // Categoría no existe o no tiene permisos, es normal
          console.log(`  ⊘ ${folderName}: carpeta no existe o vacía`);
        }
      }
    } catch (error) {
      console.error(`❌ Error accediendo a carpeta imagenes:`, error);
      throw new Error(`No se pudo acceder a la carpeta de imágenes: ${error}`);
    }

    console.log(`\n📊 Total de JSONs encontrados: ${allJSONs.length}`);
    
    if (allJSONs.length === 0) {
      console.log(`\n⚠️ ADVERTENCIA: No se encontraron JSONs en ninguna categoría`);
      console.log(`   ¿Has guardado capturas con JSON en la galería?`);
      console.log(`   Las capturas deben tener un archivo .json asociado`);
    }

    return allJSONs;
  }

  /**
   * Ejecuta un JSON individual a través del sistema de importación
   * Simula la importación real que haría el usuario CON PERSONAJE ASOCIADO
   */
  static async executeJSONTest(
    jsonFileName: string,
    categoria: ImageCategory,
    jsonContent: string
  ): Promise<IntegrityTestResult> {
    const startTime = performance.now();
    const testId = `test_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    console.log(`\n🧪 ════════════════════════════════════════════════════════`);
    console.log(`📄 TEST: ${jsonFileName}`);
    console.log(`📁 CATEGORÍA: ${categoria}`);
    console.log(`⏱️  INICIO: ${new Date().toLocaleTimeString()}`);

    try {
      const parsedJSON = JSON.parse(jsonContent);
      console.log(`✅ JSON parseado correctamente`);
      
      // 1. Extraer información del personaje del JSON
      const characterInfo = this.extractCharacterInfoFromJSON(parsedJSON, categoria);
      console.log(`   📝 Info extraída: ${characterInfo.nombre} (${characterInfo.clase}, Nv.${characterInfo.nivel})`);
      
      // 2. Determinar elementos esperados
      const expectedElements = this.countExpectedElements(parsedJSON, categoria);
      console.log(`📊 ELEMENTOS ESPERADOS: ${expectedElements}`);
      
      // 3. Crear o recuperar personaje para este test (solo si la categoría lo requiere)
      let character: Personaje | null = null;
      const needsCharacter = ['skills', 'glifos', 'aspectos', 'estadisticas', 'build', 'paragon', 'gemas_runas', 'talismanes', 'mecanicas'].includes(categoria);
      
      if (needsCharacter && this.testWorkspaceHandle) {
        character = await this.createOrGetCharacterForTest(
          {
            nombre: characterInfo.nombre || 'Test Character',
            clase: characterInfo.clase || 'Paladín',
            nivel: characterInfo.nivel || 100,
            nivel_paragon: characterInfo.nivel_paragon || 0
          },
          this.testWorkspaceHandle
        );
      }

      // 4. Simular importación real según categoría
      let importResult: { saved: number; failed: string[]; warnings: string[] } = { saved: 0, failed: [], warnings: [] };

      if (character && this.testWorkspaceHandle) {
        switch (categoria) {
          case 'skills':
            importResult = await this.simulateSkillsImport(parsedJSON, character, this.testWorkspaceHandle);
            break;
          case 'glifos':
            importResult = await this.simulateGlyphsImport(parsedJSON, character, this.testWorkspaceHandle);
            break;
          case 'aspectos':
            importResult = await this.simulateAspectsImport(parsedJSON, character, this.testWorkspaceHandle);
            break;
          case 'estadisticas':
            importResult = await this.simulateStatsImport(parsedJSON, character, this.testWorkspaceHandle);
            break;
          case 'build':
            importResult = await this.simulateBuildImport(parsedJSON, character, this.testWorkspaceHandle);
            break;
          case 'paragon':
            importResult = await this.simulateParagonImport(parsedJSON, character, this.testWorkspaceHandle);
            break;
          default:
            importResult = await this.simulateGenericImport(parsedJSON, categoria, character, this.testWorkspaceHandle);
        }
      } else {
        // Categorías que no necesitan personaje (mundo, otros)
        if (this.testWorkspaceHandle && character) {
          importResult = await this.simulateGenericImport(parsedJSON, categoria, character, this.testWorkspaceHandle);
        }
      }

      // 5. Validar estructura del JSON
      const validation = await this.validateJSONStructure(parsedJSON, categoria);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // 6. Calcular éxito basado en importación real
      const savedElements = importResult.saved;
      const failedElements = importResult.failed;
      const warningElements = importResult.warnings || [];
      const success = importResult.failed.length === 0 && savedElements > 0;

      console.log(`📊 ELEMENTOS GUARDADOS: ${savedElements}`);
      console.log(`❌ ELEMENTOS FALLIDOS: ${failedElements.length}`);
      if (warningElements.length > 0) {
        console.log(`⚠️ ELEMENTOS CON ADVERTENCIA: ${warningElements.length}`);
      }
      console.log(`⏱️  TIEMPO EJECUCIÓN: ${executionTime.toFixed(2)}ms`);

      if (success) {
        console.log(`✅ TEST PASADO: ${jsonFileName}`);
        console.log(`   💾 Se guardaron ${savedElements}/${expectedElements} elementos correctamente`);
        if (warningElements.length > 0) {
          console.log(`   ⚠️ ${warningElements.length} elementos con advertencias`);
        }
        console.log(`════════════════════════════════════════════════════════\n`);
        
        return {
          id: testId,
          jsonFileName,
          categoria,
          timestamp: new Date().toISOString(),
          success: true,
          expectedElements,
          savedElements,
          failedElements,
          warningElements,
          executionTimeMs: executionTime,
          validationErrors: []
        };
      } else {
        console.log(`❌ TEST FALLIDO: ${jsonFileName}`);
        
        if (failedElements.length > 0) {
          console.log(`🚨 ELEMENTOS QUE FALLARON (${failedElements.length}):`);
          failedElements.forEach((elem, idx) => {
            console.log(`   ${idx + 1}. ${elem}`);
          });
        }
        
        if (warningElements.length > 0) {
          console.log(`⚠️ ELEMENTOS CON ADVERTENCIA (${warningElements.length}):`);
          warningElements.forEach((elem, idx) => {
            console.log(`   ${idx + 1}. ${elem}`);
          });
        }
        
        if (validation.errors.length > 0) {
          console.log(`🔍 ERRORES DE VALIDACIÓN (${validation.errors.length}):`);
          validation.errors.forEach((err, idx) => {
            console.log(`   ${idx + 1}. ${err}`);
          });
        }
        
        console.log(`📉 TASA DE ÉXITO: ${expectedElements > 0 ? ((savedElements / expectedElements) * 100).toFixed(1) : 0}%`);
        console.log(`════════════════════════════════════════════════════════\n`);
        
        return {
          id: testId,
          jsonFileName,
          categoria,
          timestamp: new Date().toISOString(),
          success: false,
          errorMessage: failedElements.length > 0 ? `Fallaron ${failedElements.length} elementos` : 'No se guardó ningún elemento',
          expectedElements,
          savedElements,
          failedElements,
          warningElements,
          executionTimeMs: executionTime,
          validationErrors: validation.errors
        };
      }
    } catch (error) {
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      console.log(`💥 ERROR CRÍTICO: ${jsonFileName}`);
      console.log(`❌ TIPO: Parse/Execution Error`);
      console.log(`📝 MENSAJE: ${error}`);
      console.log(`⏱️  TIEMPO: ${executionTime.toFixed(2)}ms`);
      console.log(`════════════════════════════════════════════════════════\n`);
      
      return {
        id: testId,
        jsonFileName,
        categoria,
        timestamp: new Date().toISOString(),
        success: false,
        errorMessage: `Error: ${error}`,
        expectedElements: 0,
        savedElements: 0,
        failedElements: [],
        executionTimeMs: executionTime,
        validationErrors: [`Error crítico: ${error}`]
      };
    }
  }

  /**
   * Cuenta cuántos elementos se esperan según la estructura del JSON
   */
  private static countExpectedElements(data: any, categoria: ImageCategory): number {
    if (!data) return 0;

    // Mapeo de categorías a campos de arrays
    const arrayFields: Record<string, string[]> = {
      'skills': ['habilidades_activas', 'habilidades_pasivas', 'habilidades'],
      'glifos': ['glifos'],
      'aspectos': ['aspectos'],
      'paragon': ['tableros', 'nodos', 'atributos'],
      'gemas_runas': ['runas', 'gemas'],
      'runas': ['runas'],
      'gemas': ['gemas'],
      'mundo': ['eventos', 'mazmorras'],
      'talismanes': ['talismanes'],
      'mecanicas': ['mecanicas'],
      'build': ['equipamiento'],
      'estadisticas': ['atributosPrincipales', 'defensivo', 'ofensivo']
    };

    const fields = arrayFields[categoria] || [];
    let total = 0;

    for (const field of fields) {
      if (data[field]) {
        if (Array.isArray(data[field])) {
          total += data[field].length;
        } else if (typeof data[field] === 'object') {
          total += Object.keys(data[field]).length;
        }
      }
    }

    // Si no encontró campos específicos, intentar contar el objeto raíz
    if (total === 0 && typeof data === 'object') {
      if (Array.isArray(data)) {
        total = data.length;
      } else {
        total = Object.keys(data).length || 1;
      }
    }

    return total;
  }

  /**
   * Valida la estructura del JSON según el tipo de dato
   */
  private static async validateJSONStructure(
    data: any, 
    categoria: ImageCategory
  ): Promise<{ valid: boolean; errors: string[]; validElements: number; invalidElements: string[] }> {
    const errors: string[] = [];
    const invalidElements: string[] = [];
    let validElements = 0;

    // Validaciones específicas por categoría
    switch (categoria) {
      case 'skills':
        return this.validateSkillsJSON(data);
      case 'glifos':
        return this.validateGlyphsJSON(data);
      case 'aspectos':
        return this.validateAspectsJSON(data);
      case 'estadisticas':
        return this.validateStatsJSON(data);
      case 'paragon':
        return this.validateParagonJSON(data);
      case 'gemas_runas':
      case 'runas':
      case 'gemas':
        return this.validateGemsRunesJSON(data);
      case 'mundo':
        return this.validateWorldJSON(data);
      case 'talismanes':
        return this.validateCharmsJSON(data);
      case 'mecanicas':
        return this.validateMechanicsJSON(data);
      case 'build':
        return this.validateBuildJSON(data);
      default:
        return { valid: true, errors: [], validElements: 1, invalidElements: [] };
    }
  }

  // Validadores específicos por tipo
  private static validateSkillsJSON(data: any): { valid: boolean; errors: string[]; validElements: number; invalidElements: string[] } {
    const errors: string[] = [];
    const invalidElements: string[] = [];
    let validElements = 0;

    console.log(`   🔍 Validando estructura de habilidades...`);

    if (!data.habilidades_activas && !data.habilidades_pasivas && !data.habilidades) {
      const error = 'JSON debe contener habilidades_activas, habilidades_pasivas o habilidades';
      errors.push(error);
      console.log(`   ❌ ${error}`);
      return { valid: false, errors, validElements: 0, invalidElements: [] };
    }

    // Validar habilidades activas
    const activas = data.habilidades_activas || [];
    console.log(`   📋 Habilidades activas encontradas: ${activas.length}`);
    for (const skill of activas) {
      if (!skill.nombre) {
        const error = `Habilidad activa sin nombre en posición ${activas.indexOf(skill)}`;
        errors.push(error);
        invalidElements.push(`skill_activa_${activas.indexOf(skill)}`);
        console.log(`   ❌ ${error}`);
      } else {
        validElements++;
        console.log(`   ✓ Habilidad activa válida: ${skill.nombre}`);
      }
    }

    // Validar habilidades pasivas
    const pasivas = data.habilidades_pasivas || [];
    console.log(`   📋 Habilidades pasivas encontradas: ${pasivas.length}`);
    for (const skill of pasivas) {
      if (!skill.nombre) {
        const error = `Habilidad pasiva sin nombre en posición ${pasivas.indexOf(skill)}`;
        errors.push(error);
        invalidElements.push(`skill_pasiva_${pasivas.indexOf(skill)}`);
        console.log(`   ❌ ${error}`);
      } else {
        validElements++;
        console.log(`   ✓ Habilidad pasiva válida: ${skill.nombre}`);
      }
    }

    console.log(`   📊 Resumen Skills: ${validElements} válidas, ${invalidElements.length} inválidas`);
    return { valid: errors.length === 0, errors, validElements, invalidElements };
  }

  private static validateGlyphsJSON(data: any): { valid: boolean; errors: string[]; validElements: number; invalidElements: string[] } {
    const errors: string[] = [];
    const invalidElements: string[] = [];
    let validElements = 0;

    console.log(`   🔍 Validando estructura de glifos...`);

    if (!data.glifos || !Array.isArray(data.glifos)) {
      const error = 'JSON debe contener array "glifos"';
      errors.push(error);
      console.log(`   ❌ ${error}`);
      return { valid: false, errors, validElements: 0, invalidElements: [] };
    }

    console.log(`   📋 Glifos encontrados: ${data.glifos.length}`);
    for (const glifo of data.glifos) {
      const index = data.glifos.indexOf(glifo);
      if (!glifo.nombre) {
        const error = `Glifo sin nombre en posición ${index}`;
        errors.push(error);
        invalidElements.push(`glifo_${index}`);
        console.log(`   ❌ ${error} - Rareza: ${glifo.rareza || 'N/A'}`);
      } else {
        validElements++;
        console.log(`   ✓ Glifo válido: ${glifo.nombre} (${glifo.rareza || 'sin rareza'})`);
      }
    }

    console.log(`   📊 Resumen Glifos: ${validElements} válidos, ${invalidElements.length} inválidos`);
    return { valid: errors.length === 0, errors, validElements, invalidElements };
  }

  private static validateAspectsJSON(data: any): { valid: boolean; errors: string[]; validElements: number; invalidElements: string[] } {
    const errors: string[] = [];
    const invalidElements: string[] = [];
    let validElements = 0;

    console.log(`   🔍 Validando estructura de aspectos...`);

    if (!data.aspectos || !Array.isArray(data.aspectos)) {
      const error = 'JSON debe contener array "aspectos"';
      errors.push(error);
      console.log(`   ❌ ${error}`);
      return { valid: false, errors, validElements: 0, invalidElements: [] };
    }

    console.log(`   📋 Aspectos encontrados: ${data.aspectos.length}`);
    for (const aspecto of data.aspectos) {
      const index = data.aspectos.indexOf(aspecto);
      const nombre = aspecto.name || aspecto.nombre;
      if (!nombre) {
        const error = `Aspecto sin nombre en posición ${index}`;
        errors.push(error);
        invalidElements.push(`aspecto_${index}`);
        console.log(`   ❌ ${error} - Categoría: ${aspecto.category || 'N/A'}`);
      } else {
        validElements++;
        console.log(`   ✓ Aspecto válido: ${nombre} (${aspecto.category || 'sin categoría'})`);
      }
    }

    console.log(`   📊 Resumen Aspectos: ${validElements} válidos, ${invalidElements.length} inválidos`);
    return { valid: errors.length === 0, errors, validElements, invalidElements };
  }

  private static validateStatsJSON(data: any): { valid: boolean; errors: string[]; validElements: number; invalidElements: string[] } {
    const errors: string[] = [];
    let validElements = 0;

    console.log(`   🔍 Validando estructura de estadísticas...`);

    // Determinar si el JSON tiene estructura anidada o directa
    const statsData = data.estadisticas || data;
    const hasNestedStructure = !!data.estadisticas;
    
    if (hasNestedStructure) {
      console.log(`   📦 Estructura anidada detectada (data.estadisticas)`);
    }

    // Las estadísticas deben tener al menos una categoría
    const categories = ['atributosPrincipales', 'defensivo', 'ofensivo', 'utilidad', 'personaje'];
    const hasCategory = categories.some(cat => statsData[cat]);

    if (!hasCategory) {
      const error = `JSON debe contener al menos una categoría: ${categories.join(', ')}`;
      errors.push(error);
      console.log(`   ❌ ${error}`);
      console.log(`   📊 Campos en JSON:`, Object.keys(data));
      if (hasNestedStructure) {
        console.log(`   📊 Campos en data.estadisticas:`, Object.keys(statsData));
      }
      return { valid: false, errors, validElements: 0, invalidElements: [] };
    }

    // Contar campos válidos
    console.log(`   📋 Analizando categorías de estadísticas...`);
    for (const cat of categories) {
      if (statsData[cat] && typeof statsData[cat] === 'object') {
        const fieldCount = Object.keys(statsData[cat]).length;
        validElements += fieldCount;
        console.log(`   ✓ Categoría "${cat}": ${fieldCount} campos`);
      }
    }

    console.log(`   📊 Resumen Stats: ${validElements} campos válidos`);
    return { valid: errors.length === 0, errors, validElements, invalidElements: [] };
  }

  private static validateParagonJSON(data: any): { valid: boolean; errors: string[]; validElements: number; invalidElements: string[] } {
    const errors: string[] = [];
    const invalidElements: string[] = [];
    let validElements = 0;

    console.log(`   🔍 Validando estructura de Paragon...`);

    // Puede contener tableros, nodos, o atributos
    if (!data.tableros && !data.nodos && !data.atributos_totales) {
      const error = 'JSON debe contener tableros, nodos o atributos_totales';
      errors.push(error);
      console.log(`   ❌ ${error}`);
      return { valid: false, errors, validElements: 0, invalidElements: [] };
    }

    if (data.tableros) {
      const count = Array.isArray(data.tableros) ? data.tableros.length : 1;
      validElements += count;
      console.log(`   ✓ Tableros Paragon: ${count}`);
    }
    if (data.nodos) {
      const count = Array.isArray(data.nodos) ? data.nodos.length : 1;
      validElements += count;
      console.log(`   ✓ Nodos Paragon: ${count}`);
    }
    if (data.atributos_totales) {
      const count = Object.keys(data.atributos_totales).length;
      validElements += count;
      console.log(`   ✓ Atributos Totales: ${count}`);
    }

    console.log(`   📊 Resumen Paragon: ${validElements} elementos válidos`);
    return { valid: errors.length === 0, errors, validElements, invalidElements };
  }

  private static validateGemsRunesJSON(data: any): { valid: boolean; errors: string[]; validElements: number; invalidElements: string[] } {
    const errors: string[] = [];
    const invalidElements: string[] = [];
    let validElements = 0;

    console.log(`   🔍 Validando estructura de Runas/Gemas...`);

    if (!data.runas && !data.gemas) {
      const error = 'JSON debe contener "runas" o "gemas"';
      errors.push(error);
      console.log(`   ❌ ${error}`);
      return { valid: false, errors, validElements: 0, invalidElements: [] };
    }

    if (data.runas) {
      console.log(`   📋 Runas encontradas: ${(data.runas || []).length}`);
      for (const runa of data.runas || []) {
        const index = (data.runas || []).indexOf(runa);
        if (!runa.nombre) {
          const error = `Runa sin nombre en posición ${index}`;
          errors.push(error);
          invalidElements.push(`runa_${index}`);
          console.log(`   ❌ ${error}`);
        } else {
          validElements++;
          console.log(`   ✓ Runa válida: ${runa.nombre} (${runa.tipo || 'sin tipo'})`);
        }
      }
    }

    if (data.gemas) {
      console.log(`   📋 Gemas encontradas: ${(data.gemas || []).length}`);
      for (const gema of data.gemas || []) {
        const index = (data.gemas || []).indexOf(gema);
        if (!gema.nombre) {
          const error = `Gema sin nombre en posición ${index}`;
          errors.push(error);
          invalidElements.push(`gema_${index}`);
          console.log(`   ❌ ${error}`);
        } else {
          validElements++;
          console.log(`   ✓ Gema válida: ${gema.nombre} (${gema.color || 'sin color'})`);
        }
      }
    }

    console.log(`   📊 Resumen Runas/Gemas: ${validElements} válidos, ${invalidElements.length} inválidos`);
    return { valid: errors.length === 0, errors, validElements, invalidElements };
  }

  private static validateWorldJSON(data: any): { valid: boolean; errors: string[]; validElements: number; invalidElements: string[] } {
    const errors: string[] = [];
    const invalidElements: string[] = [];
    let validElements = 0;

    console.log(`   🔍 Validando estructura de Mundo...`);

    if (!data.eventos && !data.mazmorras) {
      const error = 'JSON debe contener "eventos" o "mazmorras"';
      errors.push(error);
      console.log(`   ❌ ${error}`);
      return { valid: false, errors, validElements: 0, invalidElements: [] };
    }

    if (data.eventos) {
      const count = Array.isArray(data.eventos) ? data.eventos.length : 1;
      validElements += count;
      console.log(`   ✓ Eventos de Mundo: ${count}`);
    }
    if (data.mazmorras) {
      const count = Array.isArray(data.mazmorras) ? data.mazmorras.length : 1;
      validElements += count;
      console.log(`   ✓ Mazmorras: ${count}`);
    }

    console.log(`   📊 Resumen Mundo: ${validElements} elementos válidos`);
    return { valid: errors.length === 0, errors, validElements, invalidElements };
  }

  private static validateCharmsJSON(data: any): { valid: boolean; errors: string[]; validElements: number; invalidElements: string[] } {
    const errors: string[] = [];
    const invalidElements: string[] = [];
    let validElements = 0;

    console.log(`   🔍 Validando estructura de Talismanes...`);

    if (!data.talismanes || !Array.isArray(data.talismanes)) {
      const error = 'JSON debe contener array "talismanes"';
      errors.push(error);
      console.log(`   ❌ ${error}`);
      return { valid: false, errors, validElements: 0, invalidElements: [] };
    }

    console.log(`   📋 Talismanes encontrados: ${data.talismanes.length}`);
    for (const talisman of data.talismanes) {
      const index = data.talismanes.indexOf(talisman);
      if (!talisman.nombre) {
        const error = `Talismán sin nombre en posición ${index}`;
        errors.push(error);
        invalidElements.push(`talisman_${index}`);
        console.log(`   ❌ ${error}`);
      } else {
        validElements++;
        console.log(`   ✓ Talismán válido: ${talisman.nombre} (${talisman.rareza || 'sin rareza'})`);
      }
    }

    console.log(`   📊 Resumen Talismanes: ${validElements} válidos, ${invalidElements.length} inválidos`);
    return { valid: errors.length === 0, errors, validElements, invalidElements };
  }

  private static validateMechanicsJSON(data: any): { valid: boolean; errors: string[]; validElements: number; invalidElements: string[] } {
    const errors: string[] = [];
    let validElements = 0;

    console.log(`   🔍 Validando estructura de Mecánicas...`);

    if (!data.mecanica_clase && !data.mecanicas) {
      const error = 'JSON debe contener "mecanica_clase" o "mecanicas"';
      errors.push(error);
      console.log(`   ❌ ${error}`);
      return { valid: false, errors, validElements: 0, invalidElements: [] };
    }

    validElements = 1; // Las mecánicas suelen ser un objeto único
    console.log(`   ✓ Estructura de mecánicas válida`);
    console.log(`   📊 Resumen Mecánicas: 1 elemento válido`);
    return { valid: true, errors: [], validElements, invalidElements: [] };
  }

  private static validateBuildJSON(data: any): { valid: boolean; errors: string[]; validElements: number; invalidElements: string[] } {
    const errors: string[] = [];
    let validElements = 0;

    console.log(`   🔍 Validando estructura de Build...`);

    if (!data.equipamiento || !Array.isArray(data.equipamiento)) {
      const error = 'JSON debe contener array "equipamiento"';
      errors.push(error);
      console.log(`   ❌ ${error}`);
      return { valid: false, errors, validElements: 0, invalidElements: [] };
    }

    validElements = data.equipamiento.length;
    console.log(`   ✓ Piezas de equipamiento: ${validElements}`);
    data.equipamiento.forEach((item: any, idx: number) => {
      console.log(`   ✓ Pieza ${idx + 1}: ${item.slot || 'sin slot'} - ${item.nombre || 'sin nombre'}`);
    });
    console.log(`   📊 Resumen Build: ${validElements} piezas válidas`);
    return { valid: true, errors: [], validElements, invalidElements: [] };
  }

  /**
   * Compara archivo original vs generado en workspace temporal
   */
  static async compareFiles(
    originalHandle: FileSystemDirectoryHandle,
    testHandle: FileSystemDirectoryHandle,
    fileName: string,
    fileType: 'hero' | 'character' | 'mundo' | 'tags' | 'config'
  ): Promise<FileDifference> {
    try {
      // Leer archivo original
      const originalFileHandle = await originalHandle.getFileHandle(fileName);
      const originalFile = await originalFileHandle.getFile();
      const originalContent = await originalFile.text();
      const originalData = JSON.parse(originalContent);
      const originalSize = originalFile.size;

      // Leer archivo generado
      const testFileHandle = await testHandle.getFileHandle(fileName);
      const testFile = await testFileHandle.getFile();
      const testContent = await testFile.text();
      const testData = JSON.parse(testContent);
      const testSize = testFile.size;

      // Comparar estructuras
      const comparison = this.deepCompare(originalData, testData);

      return {
        fileName,
        fileType,
        hasChanges: comparison.addedFields.length > 0 || 
                    comparison.removedFields.length > 0 || 
                    comparison.modifiedFields.length > 0,
        originalSize,
        generatedSize: testSize,
        addedFields: comparison.addedFields,
        removedFields: comparison.removedFields,
        modifiedFields: comparison.modifiedFields,
        structuralIssues: comparison.structuralIssues
      };
    } catch (error) {
      return {
        fileName,
        fileType,
        hasChanges: true,
        originalSize: 0,
        generatedSize: 0,
        addedFields: [],
        removedFields: [],
        modifiedFields: [],
        structuralIssues: [`Error comparando archivo: ${error}`]
      };
    }
  }

  /**
   * Compara dos objetos en profundidad
   */
  private static deepCompare(original: any, generated: any, path: string = ''): {
    addedFields: string[];
    removedFields: string[];
    modifiedFields: Array<{ field: string; originalValue: any; generatedValue: any }>;
    structuralIssues: string[];
  } {
    const result = {
      addedFields: [] as string[],
      removedFields: [] as string[],
      modifiedFields: [] as Array<{ field: string; originalValue: any; generatedValue: any }>,
      structuralIssues: [] as string[]
    };

    // Campos en original pero no en generado
    if (original && typeof original === 'object') {
      for (const key in original) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (!(key in generated)) {
          result.removedFields.push(currentPath);
        } else {
          // Comparar valores
          if (typeof original[key] === 'object' && typeof generated[key] === 'object') {
            const nested = this.deepCompare(original[key], generated[key], currentPath);
            result.addedFields.push(...nested.addedFields);
            result.removedFields.push(...nested.removedFields);
            result.modifiedFields.push(...nested.modifiedFields);
            result.structuralIssues.push(...nested.structuralIssues);
          } else if (original[key] !== generated[key]) {
            result.modifiedFields.push({
              field: currentPath,
              originalValue: original[key],
              generatedValue: generated[key]
            });
          }
        }
      }
    }

    // Campos en generado pero no en original
    if (generated && typeof generated === 'object') {
      for (const key in generated) {
        if (!(key in original)) {
          const currentPath = path ? `${path}.${key}` : key;
          result.addedFields.push(currentPath);
        }
      }
    }

    return result;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════
   * MÉTODOS AUXILIARES PARA MANIPULACIÓN DIRECTA DEL FILESYSTEM
   * (No usan WorkspaceService porque necesitan workspace temporal)
   * ═══════════════════════════════════════════════════════════════════════
   */

  /**
   * Guarda un personaje directamente en un workspace handle
   */
  private static async savePersonajeToHandle(
    personaje: Personaje,
    workspaceHandle: FileSystemDirectoryHandle
  ): Promise<void> {
    try {
      const personajesDir = await workspaceHandle.getDirectoryHandle('personajes', { create: true });
      const fileHandle = await personajesDir.getFileHandle(`${personaje.id}.json`, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(personaje, null, 2));
      await writable.close();
    } catch (error) {
      console.error(`❌ Error guardando personaje ${personaje.id}:`, error);
      throw error;
    }
  }

  /**
   * Carga un personaje directamente desde un workspace handle
   */
  private static async loadPersonajeFromHandle(
    characterId: string,
    workspaceHandle: FileSystemDirectoryHandle
  ): Promise<Personaje | null> {
    try {
      const personajesDir = await workspaceHandle.getDirectoryHandle('personajes');
      const fileHandle = await personajesDir.getFileHandle(`${characterId}.json`);
      const file = await fileHandle.getFile();
      const content = await file.text();
      return JSON.parse(content);
    } catch (error) {
      // Archivo no existe, es normal
      return null;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════
   * MÉTODOS PARA AUTO-GENERACIÓN DE PERSONAJES Y SIMULACIÓN DE IMPORTACIONES
   * ═══════════════════════════════════════════════════════════════════════
   */

  /**
   * Extrae información del personaje desde el JSON
   * Intenta inferir nombre, clase y nivel de diferentes campos del JSON
   */
  private static extractCharacterInfoFromJSON(data: any, categoria: ImageCategory): { 
    nombre?: string; 
    clase?: string; 
    nivel?: number;
    nivel_paragon?: number;
  } {
    const info: { nombre?: string; clase?: string; nivel?: number; nivel_paragon?: number } = {};

    // Extraer clase (prioritario)
    if (data.clase) info.clase = data.clase;
    else if (data.personaje?.clase) info.clase = data.personaje.clase;
    else if (data.character_class) info.clase = data.character_class;
    
    // Si no hay clase en el JSON, inferir de la categoría o usar default
    if (!info.clase) {
      // Buscar en nombres de habilidades o glifos si aplica
      if (categoria === 'skills' && data.habilidades_activas?.length > 0) {
        // Intentar inferir de nombres (ej: "Choque" → Paladín)
        info.clase = this.inferClassFromSkillNames(data.habilidades_activas);
      }
      
      // Si aún no hay clase, usar una por defecto basada en categoría
      info.clase = info.clase || 'Paladín'; // Default
    }

    // Extraer nivel
    if (data.nivel) info.nivel = parseInt(data.nivel);
    else if (data.atributosPrincipales?.nivel) info.nivel = parseInt(data.atributosPrincipales.nivel);
    else if (data.character_level) info.nivel = parseInt(data.character_level);
    else info.nivel = 100; // Default nivel máximo

    // Extraer nivel Paragon
    if (data.nivel_paragon) info.nivel_paragon = parseInt(data.nivel_paragon);
    else if (data.paragon_level) info.nivel_paragon = parseInt(data.paragon_level);
    else info.nivel_paragon = 0; // Default sin paragon

    // Extraer nombre (menos prioritario, se puede generar)
    if (data.nombre) info.nombre = data.nombre;
    else if (data.personaje?.nombre) info.nombre = data.personaje.nombre;
    else if (data.character_name) info.nombre = data.character_name;
    else info.nombre = `${info.clase}_Test_${Date.now()}`;

    return info;
  }

  /**
   * Infiere la clase desde nombres de habilidades
   */
  private static inferClassFromSkillNames(skills: any[]): string | undefined {
    const classKeywords: Record<string, string[]> = {
      'Paladín': ['choque', 'escudo', 'fe', 'sagrado', 'juramento', 'leviatán'],
      'Bárbaro': ['furia', 'rabia', 'arsenal', 'arma', 'berserker'],
      'Hechicero': ['maná', 'fuego', 'rayo', 'escarcha', 'conjuración'],
      'Pícaro': ['energía', 'sombra', 'veneno', 'sigilo', 'trampa'],
      'Druida': ['espíritu', 'tempestad', 'tierra', 'compañero'],
      'Nigromante': ['esencia', 'sangre', 'hueso', 'maldición', 'ejército']
    };

    for (const skill of skills) {
      const skillName = (skill.nombre || '').toLowerCase();
      
      for (const [className, keywords] of Object.entries(classKeywords)) {
        if (keywords.some(kw => skillName.includes(kw))) {
          return className;
        }
      }
    }

    return undefined;
  }

  /**
   * Crea o recupera el personaje para este test
   * Usa el workspace temporal para no afectar datos reales
   */
  private static async createOrGetCharacterForTest(
    characterInfo: { nombre: string; clase: string; nivel: number; nivel_paragon: number },
    workspaceHandle: FileSystemDirectoryHandle
  ): Promise<Personaje> {
    try {
      // ID consistente basado en la clase
      const characterId = `test_${characterInfo.clase.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_')}`;
      
      // Intentar cargar personaje existente
      let character = await this.loadPersonajeFromHandle(characterId, workspaceHandle);
      
      if (!character) {
        // Crear nuevo personaje para testing
        character = {
          id: characterId,
          nombre: characterInfo.nombre,
          clase: characterInfo.clase,
          nivel: characterInfo.nivel,
          nivel_paragon: characterInfo.nivel_paragon,
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
          habilidades_refs: { activas: [], pasivas: [] },
          glifos_refs: [],
          aspectos_refs: [],
          runas_refs: [],
          talismanes_refs: [],
          mecanicas_clase_refs: []
        };

        await this.savePersonajeToHandle(character, workspaceHandle);
        console.log(`   👤 Personaje creado: ${character.nombre} (${character.clase}, Nv.${character.nivel})`);
      } else {
        console.log(`   👤 Personaje existente: ${character.nombre} (${character.clase}, Nv.${character.nivel})`);
      }

      return character;
    } catch (error) {
      console.error(`   ❌ Error creando/cargando personaje:`, error);
      throw error;
    }
  }

  /**
   * Simula la importación de habilidades (como CharacterSkills.processJSONImport)
   */
  private static async simulateSkillsImport(
    data: any,
    character: Personaje,
    workspaceHandle: FileSystemDirectoryHandle
  ): Promise<{ saved: number; failed: string[]; warnings: string[] }> {
    let saved = 0;
    const failed: string[] = [];
    const warnings: string[] = [];

    console.log(`   🔨 Simulando importación de habilidades...`);
    console.log(`   📝 Campos en JSON:`, Object.keys(data));

    try {
      // Procesar habilidades activas
      if (data.habilidades_activas && Array.isArray(data.habilidades_activas)) {
        console.log(`   ✓ Encontradas ${data.habilidades_activas.length} habilidades activas`);
        
        for (const skill of data.habilidades_activas) {
          try {
            if (!skill.nombre) {
              console.log(`   ⚠️ Habilidad activa sin nombre encontrada:`, skill);
              failed.push('habilidad_sin_nombre');
              continue;
            }
            
            if (!skill.id) {
              skill.id = `skill_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
              warnings.push(`${skill.nombre} (ID autogenerado)`);
            }
            
            // Agregar referencia al personaje
            if (!character.habilidades_refs) {
              character.habilidades_refs = { activas: [], pasivas: [] };
            }
            
            // Evitar duplicados
            if (!character.habilidades_refs.activas.find(ref => ref.skill_id === skill.id)) {
              character.habilidades_refs.activas.push({
                skill_id: skill.id!,
                modificadores_ids: [],
                nivel_actual: skill.nivel || 1
              });
              saved++;
              console.log(`   ✓ Guardada habilidad activa: ${skill.nombre}`);
            }
          } catch (error) {
            failed.push(skill.nombre || 'habilidad_sin_nombre');
            console.log(`   ❌ Error procesando habilidad activa "${skill.nombre}":`, error);
          }
        }
      } else {
        console.log(`   ❌ data.habilidades_activas no encontrado o no es array`);
      }

      // Procesar habilidades pasivas
      if (data.habilidades_pasivas && Array.isArray(data.habilidades_pasivas)) {
        console.log(`   ✓ Encontradas ${data.habilidades_pasivas.length} habilidades pasivas`);
        
        for (const skill of data.habilidades_pasivas) {
          try {
            if (!skill.nombre) {
              console.log(`   ⚠️ Habilidad pasiva sin nombre encontrada:`, skill);
              failed.push('pasiva_sin_nombre');
              continue;
            }
            
            if (!skill.id) {
              skill.id = `skill_pasiva_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
              warnings.push(`${skill.nombre} (ID autogenerado pasiva)`);
            }
            
            if (!character.habilidades_refs) {
              character.habilidades_refs = { activas: [], pasivas: [] };
            }
            
            if (!character.habilidades_refs.pasivas.find(ref => ref.skill_id === skill.id)) {
              character.habilidades_refs.pasivas.push({
                skill_id: skill.id!,
                puntos_asignados: skill.nivel || 1
              });
              saved++;
              console.log(`   ✓ Guardada habilidad pasiva: ${skill.nombre}`);
            }
          } catch (error) {
            failed.push(skill.nombre || 'pasiva_sin_nombre');
            console.log(`   ❌ Error procesando habilidad pasiva "${skill.nombre}":`, error);
          }
        }
      } else {
        console.log(`   ❌ data.habilidades_pasivas no encontrado o no es array`);
      }

      if (saved === 0) {
        console.log(`   🚫 ADVERTENCIA: No se guardó ninguna habilidad`);
        console.log(`   📊 Campos disponibles en JSON:`, Object.keys(data));
      }

      // Guardar cambios en el personaje
      await this.savePersonajeToHandle(character, workspaceHandle);

      console.log(`   ✅ Habilidades importadas: ${saved} exitosas, ${failed.length} fallidas, ${warnings.length} con advertencias`);
    } catch (error) {
      console.log(`   ❌ Error en simulación de importación: ${error}`);
    }

    return { saved, failed, warnings };
  }

  /**
   * Simula la importación de glifos
   */
  private static async simulateGlyphsImport(
    data: any,
    character: Personaje,
    workspaceHandle: FileSystemDirectoryHandle
  ): Promise<{ saved: number; failed: string[]; warnings: string[] }> {
    let saved = 0;
    const failed: string[] = [];
    const warnings: string[] = [];

    console.log(`   🔨 Simulando importación de glifos...`);
    console.log(`   📝 Campos en JSON:`, Object.keys(data));

    try {
      if (data.glifos && Array.isArray(data.glifos)) {
        console.log(`   ✓ Encontrados ${data.glifos.length} glifos`);
        
        for (const glyph of data.glifos) {
          try {
            if (!glyph.nombre) {
              console.log(`   ⚠️ Glifo sin nombre encontrado:`, glyph);
              failed.push('glifo_sin_nombre');
              continue;
            }
            
            if (!glyph.id) {
              glyph.id = `glyph_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
              warnings.push(`${glyph.nombre} (ID autogenerado)`);
            }
            
            if (!character.glifos_refs) character.glifos_refs = [];
            
            if (!character.glifos_refs.find(ref => ref.id === glyph.id)) {
              character.glifos_refs.push({
                id: glyph.id!,
                nivel_actual: glyph.nivel_actual || glyph.nivel_requerido || 1,
                nivel_maximo: glyph.nivel_maximo || 100
              });
              saved++;
              console.log(`   ✓ Guardado glifo: ${glyph.nombre}`);
            }
          } catch (error) {
            failed.push(glyph.nombre || 'glyph_sin_nombre');
            console.log(`   ❌ Error procesando glifo "${glyph.nombre}":`, error);
          }
        }
      } else {
        console.log(`   ❌ data.glifos no encontrado o no es array`);
      }

      if (saved === 0) {
        console.log(`   🚫 ADVERTENCIA: No se guardó ningún glifo`);
        console.log(`   📊 Campos disponibles en JSON:`, Object.keys(data));
      }

      await this.savePersonajeToHandle(character, workspaceHandle);

      console.log(`   ✅ Glifos importados: ${saved} exitosos, ${failed.length} fallidos, ${warnings.length} con advertencias`);
    } catch (error) {
      console.log(`   ❌ Error en simulación: ${error}`);
    }

    return { saved, failed, warnings };
  }

  /**
   * Simula la importación de aspectos
   */
  private static async simulateAspectsImport(
    data: any,
    character: Personaje,
    workspaceHandle: FileSystemDirectoryHandle
  ): Promise<{ saved: number; failed: string[]; warnings: string[] }> {
    let saved = 0;
    const failed: string[] = [];
    const warnings: string[] = [];

    console.log(`   🔨 Simulando importación de aspectos...`);
    console.log(`   📝 Campos en JSON:`, Object.keys(data));

    try {
      const aspectos = data.aspectos_equipados || data.aspectos || [];
      
      if (!Array.isArray(aspectos)) {
        console.log(`   ❌ aspectos no es un array:`, typeof aspectos);
        return { saved: 0, failed: ['aspectos_no_es_array'], warnings: [] };
      }
      
      console.log(`   ✓ Encontrados ${aspectos.length} aspectos`);
      
      if (Array.isArray(aspectos)) {
        for (const aspect of aspectos) {
          try {
            const nombre = aspect.name || aspect.nombre;
            if (!nombre) {
              console.log(`   ⚠️ Aspecto sin nombre encontrado:`, aspect);
              failed.push('aspecto_sin_nombre');
              continue;
            }
            
            if (!aspect.id) {
              aspect.id = `aspect_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
              warnings.push(`${nombre} (ID autogenerado)`);
            }
            
            if (!character.aspectos_refs) character.aspectos_refs = [];
            
            // Convertir a formato de referencias si aún no lo está
            const isOldFormat = typeof character.aspectos_refs[0] === 'string';
            if (isOldFormat) character.aspectos_refs = [];
            
            if (!character.aspectos_refs.find((ref: any) => ref.aspecto_id === aspect.id)) {
              character.aspectos_refs.push({
                aspecto_id: aspect.id!,
                nivel_actual: aspect.level || aspect.nivel_actual || '1/21',
                slot_equipado: aspect.slot || 'sin_slot',
                valores_actuales: aspect.valores_actuales || {}
              });
              saved++;
              console.log(`   ✓ Guardado aspecto: ${nombre}`);
            }
          } catch (error) {
            failed.push(aspect.name || aspect.nombre || 'aspect_sin_nombre');
            console.log(`   ❌ Error procesando aspecto "${aspect.name || aspect.nombre}":`, error);
          }
        }
      }

      if (saved === 0) {
        console.log(`   🚫 ADVERTENCIA: No se guardó ningún aspecto`);
        console.log(`   📊 Campos disponibles en JSON:`, Object.keys(data));
      }

      await this.savePersonajeToHandle(character, workspaceHandle);

      console.log(`   ✅ Aspectos importados: ${saved} exitosos, ${failed.length} fallidos, ${warnings.length} con advertencias`);
    } catch (error) {
      console.log(`   ❌ Error en simulación: ${error}`);
    }

    return { saved, failed, warnings };
  }

  /**
   * Simula la importación de estadísticas
   */
  private static async simulateStatsImport(
    data: any,
    character: Personaje,
    workspaceHandle: FileSystemDirectoryHandle
  ): Promise<{ saved: number; failed: string[]; warnings: string[] }> {
    let saved = 0;
    const failed: string[] = [];
    const warnings: string[] = [];

    console.log(`   🔨 Simulando importación de estadísticas...`);
    console.log(`   📝 Datos recibidos:`, Object.keys(data));

    try {
      // Actualizar estadísticas del personaje
      if (!character.estadisticas) character.estadisticas = {};
      
      const categories = ['atributosPrincipales', 'defensivo', 'ofensivo', 'utilidad', 'personaje'];
      let fieldsUpdated = 0;
      
      // Determinar si el JSON tiene estructura anidada o directa
      const statsData = data.estadisticas || data;
      const hasNestedStructure = !!data.estadisticas;
      
      console.log(`   🔍 Buscando categorías de estadísticas en JSON...`);
      if (hasNestedStructure) {
        console.log(`   📦 Estructura anidada detectada (data.estadisticas)`);
      }
      
      for (const cat of categories) {
        if (statsData[cat]) {
          const fields = Object.keys(statsData[cat]);
          console.log(`   ✓ Categoría "${cat}" encontrada: ${fields.length} campos`);
          console.log(`      Campos: ${fields.slice(0, 5).join(', ')}${fields.length > 5 ? '...' : ''}`);
          character.estadisticas[cat] = { ...character.estadisticas[cat], ...statsData[cat] };
          fieldsUpdated += fields.length;
        } else {
          console.log(`   ❌ Categoría "${cat}" NO encontrada en JSON`);
        }
      }

      if (fieldsUpdated === 0) {
        console.log(`   🚫 ADVERTENCIA: No se encontró ninguna categoría de estadísticas`);
        console.log(`   📊 Campos disponibles en JSON:`, Object.keys(data));
        if (hasNestedStructure) {
          console.log(`   📊 Campos en data.estadisticas:`, Object.keys(statsData));
        }
        return { saved: 0, failed: ['No se encontraron campos de estadisticas'], warnings: [] };
      }

      // Actualizar nivel si viene en stats
      if (statsData.atributosPrincipales?.nivel) {
        character.nivel = parseInt(statsData.atributosPrincipales.nivel) || character.nivel;
      }
      if (data.nivel_paragon || statsData.nivel_paragon) {
        character.nivel_paragon = parseInt(data.nivel_paragon || statsData.nivel_paragon) || character.nivel_paragon;
      }

      // Guardar personaje
      console.log(`   💾 Guardando personaje ${character.id}...`);
      await this.savePersonajeToHandle(character, workspaceHandle);

      // Verificar que se guardó correctamente releyendo
      console.log(`   🔍 Verificando guardado mediante relectura...`);
      const savedCharacter = await this.loadPersonajeFromHandle(character.id, workspaceHandle);
      if (savedCharacter?.estadisticas) {
        // Contar cuántos campos se guardaron realmente
        for (const cat of categories) {
          if (savedCharacter.estadisticas[cat]) {
            const savedFields = Object.keys(savedCharacter.estadisticas[cat]);
            saved += savedFields.length;
            console.log(`   ✓ Verificado "${cat}": ${savedFields.length} campos guardados`);
          }
        }
      } else {
        console.log(`   ⚠️ ERROR: Personaje releído no tiene estadísticas`);
        console.log(`   📊 Personaje releído:`, savedCharacter ? 'existe pero sin estadisticas' : 'no existe');
      }

      console.log(`   ✅ Estadísticas importadas: ${saved} campos verificados (${fieldsUpdated} actualizados), ${warnings.length} con advertencias`);
    } catch (error) {
      console.log(`   ❌ Error en simulación: ${error}`);
      console.log(`   🐛 Stack:`, error instanceof Error ? error.stack : 'N/A');
    }

    return { saved, failed, warnings };
  }

  /**
   * Simula la importación de build
   */
  private static async simulateBuildImport(
    data: any,
    character: Personaje,
    workspaceHandle: FileSystemDirectoryHandle
  ): Promise<{ saved: number; failed: string[]; warnings: string[] }> {
    let saved = 0;
    const failed: string[] = [];
    const warnings: string[] = [];

    console.log(`   🔨 Simulando importación de build...`);

    try {
      if (data.build && data.build.piezas) {
        const buildId = `build_${Date.now()}`;
        const newBuild: Build = {
          id: buildId,
          nombre: data.build.nombre || `Build Test ${new Date().toLocaleDateString()}`,
          fecha_creacion: new Date().toISOString(),
          piezas: {}
        };

        // Procesar cada pieza
        if (Array.isArray(data.build.piezas)) {
          for (const pieza of data.build.piezas) {
            if (pieza.espacio) {
              newBuild.piezas[pieza.espacio as keyof Build['piezas']] = pieza;
              saved++;
            }
          }
        } else if (typeof data.build.piezas === 'object') {
          newBuild.piezas = data.build.piezas;
          saved = Object.keys(data.build.piezas).length;
        }

        character.build = newBuild;
      }

      await this.savePersonajeToHandle(character, workspaceHandle);

      console.log(`   ✅ Build importado: ${saved} piezas guardadas, ${warnings.length} con advertencias`);
    } catch (error) {
      console.log(`   ❌ Error en simulación: ${error}`);
    }

    return { saved, failed, warnings };
  }

  /**
   * Simula la importación de paragon
   */
  private static async simulateParagonImport(
    data: any,
    character: Personaje,
    workspaceHandle: FileSystemDirectoryHandle
  ): Promise<{ saved: number; failed: string[]; warnings: string[] }> {
    let saved = 0;
    const failed: string[] = [];
    const warnings: string[] = [];

    console.log(`   🔨 Simulando importación de paragon...`);

    try {
      // Simplificar: guardar la estructura paragon directamente
      if (data.tableros || data.nodos || data.atributos_totales) {
        if (!character.paragon) character.paragon = {} as ParagonPersonaje;
        
        if (data.tableros) {
          saved += Array.isArray(data.tableros) ? data.tableros.length : 1;
        }
        if (data.nodos) {
          saved += Array.isArray(data.nodos) ? data.nodos.length : 1;
        }
        if (data.atributos_totales) {
          saved += Object.keys(data.atributos_totales).length;
        }

        // Guardar datos de paragon
        character.paragon = data as ParagonPersonaje;
      }

      await this.savePersonajeToHandle(character, workspaceHandle);

      console.log(`   ✅ Paragon importado: ${saved} elementos guardados, ${warnings.length} con advertencias`);
    } catch (error) {
      console.log(`   ❌ Error en simulación: ${error}`);
    }

    return { saved, failed, warnings };
  }

  /**
   * Simula importaciones genéricas para otras categorías
   */
  private static async simulateGenericImport(
    data: any,
    categoria: ImageCategory,
    character: Personaje,
    workspaceHandle: FileSystemDirectoryHandle
  ): Promise<{ saved: number; failed: string[]; warnings: string[] }> {
    let saved = 0;
    const failed: string[] = [];
    const warnings: string[] = [];

    console.log(`   🔨 Simulando importación de ${categoria}...`);

    try {
      // Runas/Gemas (soporta tanto gemas_runas como runas/gemas separadas)
      if (categoria === 'gemas_runas' || categoria === 'runas' || categoria === 'gemas') {
        console.log(`   🔍 Datos de runas/gemas recibidos:`, Object.keys(data));
        
        // Manejar runas
        if (data.runas && Array.isArray(data.runas)) {
          console.log(`   ✓ Encontradas ${data.runas.length} runas`);
          if (!character.runas_refs) character.runas_refs = [];
          for (const runa of data.runas) {
            if (!runa.nombre) {
              console.log(`   ⚠️ Runa sin nombre encontrada:`, runa);
              continue;
            }
            if (!runa.id) {
              runa.id = `runa_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
              console.log(`   🆔 Generado ID para runa "${runa.nombre}": ${runa.id}`);
              warnings.push(`${runa.nombre} (ID autogenerado)`);
            }
            if (!character.runas_refs.find(r => r.runa_id === runa.id)) {
              character.runas_refs.push({ runa_id: runa.id });
              saved++;
              console.log(`   ✓ Runa guardada: ${runa.nombre}`);
            }
          }
        } else {
          console.log(`   ❌ data.runas no encontrado o no es array`);
        }
        
        // Manejar gemas (también van en runas_refs por compatibilidad)
        if (data.gemas && Array.isArray(data.gemas)) {
          console.log(`   ✓ Encontradas ${data.gemas.length} gemas`);
          if (!character.runas_refs) character.runas_refs = [];
          for (const gema of data.gemas) {
            if (!gema.nombre) {
              console.log(`   ⚠️ Gema sin nombre encontrada:`, gema);
              continue;
            }
            // Generar ID si no existe
            if (!gema.id) {
              gema.id = `gema_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
              console.log(`   🆔 Generado ID para gema "${gema.nombre}": ${gema.id}`);
              warnings.push(`${gema.nombre} (ID autogenerado)`);
            }
            
            if (!character.runas_refs.find(r => r.runa_id === gema.id)) {
              character.runas_refs.push({ runa_id: gema.id });
              saved++;
              console.log(`   ✓ Gema guardada: ${gema.nombre}`);
            }
          }
        } else {
          console.log(`   ❌ data.gemas no encontrado o no es array`);
        }
        
        if (saved === 0) {
          console.log(`   🚫 ADVERTENCIA: No se guardaron runas ni gemas`);
          console.log(`   📊 Campos disponibles en JSON:`, Object.keys(data));
        }
      }

      // Talismanes
      else if (categoria === 'talismanes') {
        if (data.talismanes && Array.isArray(data.talismanes)) {
          if (!character.talismanes_refs) character.talismanes_refs = [];
          for (const talisman of data.talismanes) {
            if (talisman.id && !character.talismanes_refs.includes(talisman.id)) {
              character.talismanes_refs.push(talisman.id);
              saved++;
            }
          }
        }
      }

      // Mecánicas
      else if (categoria === 'mecanicas') {
        if (data.mecanicas && Array.isArray(data.mecanicas)) {
          if (!character.mecanicas_clase_refs) character.mecanicas_clase_refs = [];
          for (const mecanica of data.mecanicas) {
            if (mecanica.id && !character.mecanicas_clase_refs.find(m => m.id === mecanica.id)) {
              character.mecanicas_clase_refs.push({
                id: mecanica.id,
                selecciones_activas: mecanica.selecciones?.map((s: any) => s.id) || []
              });
              saved++;
            }
          }
        }
      }

      // Mundo - guardar en campo específico
      else if (categoria === 'mundo') {
        console.log(`   🔍 Datos de mundo recibidos:`, Object.keys(data));
        
        if (!character.mundo) {
          character.mundo = {};
          console.log(`   🆕 Campo character.mundo inicializado`);
        }
        
        let worldItemsSaved = 0;
        
        if (data.eventos) {
          const eventCount = Array.isArray(data.eventos) ? data.eventos.length : 1;
          if (eventCount > 0) {
            character.mundo.eventos = data.eventos;
            worldItemsSaved += eventCount;
            saved += eventCount;
            console.log(`   ✓ Guardando eventos de mundo: ${eventCount}`);
            if (Array.isArray(data.eventos) && data.eventos.length > 0) {
              console.log(`      Primer evento:`, data.eventos[0].nombre || data.eventos[0].id || 'sin identificador');
            }
          } else {
            console.log(`   ⚠️ data.eventos existe pero está vacío`);
          }
        } else {
          console.log(`   ❌ data.eventos NO encontrado`);
        }
        
        if (data.mazmorras) {
          const dungeonCount = Array.isArray(data.mazmorras) ? data.mazmorras.length : 1;
          if (dungeonCount > 0) {
            character.mundo.mazmorras = data.mazmorras;
            worldItemsSaved += dungeonCount;
            saved += dungeonCount;
            console.log(`   ✓ Guardando mazmorras: ${dungeonCount}`);
            if (Array.isArray(data.mazmorras) && data.mazmorras.length > 0) {
              console.log(`      Primera mazmorra:`, data.mazmorras[0].nombre || data.mazmorras[0].id || 'sin identificador');
            }
          } else {
            console.log(`   ⚠️ data.mazmorras existe pero está vacío`);
          }
        } else {
          console.log(`   ❌ data.mazmorras NO encontrado`);
        }
        
        if (worldItemsSaved === 0) {
          console.log(`   🚫 ADVERTENCIA: No se encontraron eventos ni mazmorras con datos`);
          console.log(`   📊 Campos disponibles en JSON:`, Object.keys(data));
        } else {
          console.log(`   💾 Guardando personaje con ${worldItemsSaved} elementos de mundo...`);
        }
      }
      
      // Otros - contar sin guardar
      else {
        if (data.eventos) saved += Array.isArray(data.eventos) ? data.eventos.length : 1;
        if (data.mazmorras) saved += Array.isArray(data.mazmorras) ? data.mazmorras.length : 1;
      }

      await this.savePersonajeToHandle(character, workspaceHandle);

      console.log(`   ✅ ${categoria} importado: ${saved} elementos, ${warnings.length} con advertencias`);
    } catch (error) {
      console.log(`   ❌ Error en simulación: ${error}`);
    }

    return { saved, failed, warnings };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════
   * FIN MÉTODOS DE AUTO-GENERACIÓN Y SIMULACIÓN
   * ═══════════════════════════════════════════════════════════════════════
   */

  /**
   * Ejecuta el test de integridad completo
   */
  static async runFullIntegrityTest(
    workspaceHandle: FileSystemDirectoryHandle,
    reportId: string = `integrity_${Date.now()}`
  ): Promise<IntegrityReport> {
    const startTime = performance.now();
    
    console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
    console.log(`║        🧪 INTEGRITY TEST - INICIO DE EJECUCIÓN               ║`);
    console.log(`╚════════════════════════════════════════════════════════════════╝`);
    console.log(`📋 ID de Reporte: ${reportId}`);
    console.log(`⏱️  Timestamp: ${new Date().toISOString()}`);
    console.log(`📁 Workspace: ${workspaceHandle.name}\n`);

    try {
      // Paso 1: Crear workspace temporal
      console.log(`\n📂 PASO 1/7: Creando workspace temporal...`);
      const testWorkspace = await this.createTestWorkspace(workspaceHandle);
      console.log(`✅ Workspace temporal creado: ${testWorkspace.name}\n`);

      // Paso 2: Listar todos los JSONs desde el workspace REAL
      console.log(`📂 PASO 2/7: Escaneando galería de JSONs...`);
      const allJSONs = await this.listAllGalleryJSONs(workspaceHandle);

      if (allJSONs.length === 0) {
        console.log(`❌ ERROR: No se encontraron JSONs en la galería`);
        throw new Error('No se encontraron JSONs en la galería para probar');
      }
      
      console.log(`✅ JSONs encontrados: ${allJSONs.length}`);
      
      // Mostrar resumen por categoría
      const categoryCounts = new Map<string, number>();
      allJSONs.forEach(json => {
        categoryCounts.set(json.categoria, (categoryCounts.get(json.categoria) || 0) + 1);
      });
      console.log(`\n📊 DESGLOSE POR CATEGORÍA:`);
      categoryCounts.forEach((count, categoria) => {
        console.log(`   • ${categoria}: ${count} archivos`);
      });
      console.log(``);

      // ═══════════════════════════════════════════════════════════════════════
      // PASO 2.5: ORDENAR JSONs PARA ASEGURAR EJECUCIÓN CORRECTA
      // ═══════════════════════════════════════════════════════════════════════
      console.log(`\n📂 PASO 2.5: Ordenando JSONs para ejecución correcta...`);
      console.log(`🔄 Orden de ejecución:`);
      console.log(`   1. 📊 Estadísticas (crear personajes con datos básicos)`);
      console.log(`   2. ⚔️ Skills, Glifos, Aspectos, Paragon, Runas/Gemas, Build (enlazar a personajes)`);
      console.log(`   3. 🌍 Mundo, Talismanes, Mecánicas, Otros (categorías independientes)\n`);

      const orderedJSONs = this.orderJSONsForExecution(allJSONs);
      
      console.log(`✅ JSONs ordenados: ${orderedJSONs.length}`);
      console.log(`   📊 Grupo 1 (Estadísticas): ${orderedJSONs.filter(j => j.categoria === 'estadisticas').length}`);
      console.log(`   ⚔️ Grupo 2 (Datos de personaje): ${orderedJSONs.filter(j => ['skills', 'glifos', 'aspectos', 'paragon', 'gemas_runas', 'build'].includes(j.categoria)).length}`);
      console.log(`   🌍 Grupo 3 (Otros): ${orderedJSONs.filter(j => ['mundo', 'talismanes', 'mecanicas', 'otros'].includes(j.categoria)).length}\n`);

      // Paso 3: Ejecutar tests para cada JSON (en orden correcto)
      console.log(`\n📂 PASO 3/7: Ejecutando tests individuales...`);
      console.log(`════════════════════════════════════════════════════════════════\n`);
      
      const testResults: IntegrityTestResult[] = [];
      let currentCategory = '';
      
      // Usar JSONs ordenados en lugar de allJSONs sin orden
      for (let i = 0; i < orderedJSONs.length; i++) {
        const json = orderedJSONs[i];
        
        // Header por categoría
        if (currentCategory !== json.categoria) {
          currentCategory = json.categoria;
          console.log(`\n┌─────────────────────────────────────────────────────────────┐`);
          console.log(`│ 📁 CATEGORÍA: ${json.categoria.toUpperCase().padEnd(46)} │`);
          console.log(`└─────────────────────────────────────────────────────────────┘`);
        }
        
        this.reportProgress({
          status: 'running',
          currentTest: i + 1,
          totalTests: orderedJSONs.length,
          currentFileName: json.fileName,
          message: `Probando ${json.categoria}/${json.fileName}`,
          progressPercent: 15 + ((i / orderedJSONs.length) * 70)
        });

        const result = await this.executeJSONTest(json.fileName, json.categoria, json.content);
        testResults.push(result);
      }

      console.log(`\n════════════════════════════════════════════════════════════════`);
      console.log(`✅ PASO 3/7 COMPLETADO: ${testResults.length} tests ejecutados\n`);

      // Paso 4: Calcular métricas
      console.log(`📂 PASO 4/7: Calculando métricas agregadas...`);
      const metrics = this.calculateMetrics(testResults);
      
      console.log(`\n📊 RESUMEN DE MÉTRICAS:`);
      console.log(`   • Tests totales: ${metrics.totalTests}`);
      console.log(`   • Tests pasados: ${metrics.passedTests} (${((metrics.passedTests / metrics.totalTests) * 100).toFixed(1)}%)`);
      console.log(`   • Tests fallidos: ${metrics.failedTests} (${((metrics.failedTests / metrics.totalTests) * 100).toFixed(1)}%)`);
      console.log(`   • Elementos esperados: ${metrics.totalExpected}`);
      console.log(`   • Elementos guardados: ${metrics.totalSaved}`);
      console.log(`   • Elementos fallidos: ${metrics.totalFailed}`);
      console.log(`   • Elementos con advertencia: ${metrics.totalWarnings}`);
      console.log(`   • Tasa de éxito: ${metrics.successRate.toFixed(2)}%`);
      console.log(`   • Tiempo promedio: ${metrics.averageExecutionTimeMs.toFixed(2)}ms\n`);

      // Paso 5: Comparar archivos (si hay datos guardados)
      console.log(`📂 PASO 5/7: Comparando archivos...`);
      this.reportProgress({
        status: 'running',
        currentTest: orderedJSONs.length,
        totalTests: orderedJSONs.length,
        currentFileName: 'Comparando archivos...',
        message: 'Analizando diferencias entre original y test',
        progressPercent: 90
      });

      const fileDifferences: FileDifference[] = [];
      console.log(`⚠️  Comparación de archivos pendiente de implementación\n`);

      // Paso 6: Generar recomendaciones y detectar problemas críticos
      console.log(`📂 PASO 6/7: Analizando resultados y generando diagnóstico...`);
      const recommendations = this.generateRecommendations(testResults, metrics);
      const criticalIssues = this.detectCriticalIssues(testResults, metrics);

      if (criticalIssues.length > 0) {
        console.log(`\n🚨 PROBLEMAS CRÍTICOS DETECTADOS (${criticalIssues.length}):`);
        criticalIssues.forEach((issue, idx) => {
          console.log(`   ${idx + 1}. ${issue}`);
        });
      } else {
        console.log(`\n✅ No se detectaron problemas críticos`);
      }

      if (recommendations.length > 0) {
        console.log(`\n💡 RECOMENDACIONES (${recommendations.length}):`);
        recommendations.forEach((rec, idx) => {
          console.log(`   ${idx + 1}. ${rec}`);
        });
      }
      console.log(``);

      // Paso 7: Generar prompt diagnóstico
      console.log(`📂 PASO 7/7: Generando prompt diagnóstico para IA...`);
      const diagnosticPrompt = this.generateDiagnosticPrompt(testResults, metrics, recommendations, criticalIssues);
      console.log(`✅ Prompt diagnóstico generado (${diagnosticPrompt.length} caracteres)\n`);

      const endTime = performance.now();
      const totalTime = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
      console.log(`║        ✅ INTEGRITY TEST - COMPLETADO EXITOSAMENTE           ║`);
      console.log(`╚════════════════════════════════════════════════════════════════╝`);
      console.log(`⏱️  Tiempo total: ${totalTime}s`);
      console.log(`📊 Tasa de éxito: ${metrics.successRate.toFixed(2)}%`);
      console.log(`📋 Tests: ${metrics.passedTests}/${metrics.totalTests} pasados`);
      console.log(`📁 Reporte ID: ${reportId}\n`);

      this.reportProgress({
        status: 'completed',
        currentTest: orderedJSONs.length,
        totalTests: orderedJSONs.length,
        currentFileName: 'Completado',
        message: `${metrics.passedTests}/${metrics.totalTests} tests pasaron`,
        progressPercent: 100
      });

      return {
        id: reportId,
        timestamp: new Date().toISOString(),
        workspacePath: `Tests/${testWorkspace.name}`,
        metrics,
        testResults,
        fileDifferences,
        diagnosticPrompt,
        recommendations,
        criticalIssues
      };

    } catch (error) {
      this.reportProgress({
        status: 'error',
        currentTest: 0,
        totalTests: 0,
        currentFileName: 'Error',
        message: `Error durante testing: ${error}`,
        progressPercent: 0
      });

      throw error;
    }
  }

  /**
   * Calcula métricas agregadas de los resultados de tests
   */

  /**
   * Calcula métricas agregadas de los tests
   */
  private static calculateMetrics(results: IntegrityTestResult[]): IntegrityTestMetrics {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    const totalExpected = results.reduce((sum, r) => sum + r.expectedElements, 0);
    const totalSaved = results.reduce((sum, r) => sum + r.savedElements, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failedElements.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + (r.warningElements?.length || 0), 0);

    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const averageExecutionTimeMs = totalTests > 0 
      ? results.reduce((sum, r) => sum + r.executionTimeMs, 0) / totalTests 
      : 0;

    // Desglose por categoría
    const categoriesMap = new Map<string, { total: number; passed: number; failed: number }>();
    for (const result of results) {
      const existing = categoriesMap.get(result.categoria) || { total: 0, passed: 0, failed: 0 };
      existing.total++;
      if (result.success) existing.passed++;
      else existing.failed++;
      categoriesMap.set(result.categoria, existing);
    }

    const categoriesBreakdown = Array.from(categoriesMap.entries()).map(([categoria, stats]) => ({
      categoria,
      ...stats
    }));

    return {
      totalTests,
      passedTests,
      failedTests,
      totalExpected,
      totalSaved,
      totalFailed,
      totalWarnings,
      successRate,
      averageExecutionTimeMs,
      categoriesBreakdown
    };
  }

  /**
   * Genera recomendaciones basadas en los resultados
   */
  private static generateRecommendations(
    results: IntegrityTestResult[], 
    metrics: IntegrityTestMetrics
  ): string[] {
    const recommendations: string[] = [];

    // Tasa de éxito
    if (metrics.successRate < 70) {
      recommendations.push('⚠️ CRÍTICO: Tasa de éxito baja (<70%). Revisar prompts y validaciones urgentemente.');
    } else if (metrics.successRate < 90) {
      recommendations.push('⚡ Tasa de éxito moderada (<90%). Revisar casos específicos de falla.');
    } else {
      recommendations.push('✅ Tasa de éxito alta (≥90%). Sistema en buen estado.');
    }

    // Categorías problemáticas
    const problematicCategories = metrics.categoriesBreakdown
      .filter(cat => cat.failed > 0 && (cat.failed / cat.total) > 0.3);
    
    if (problematicCategories.length > 0) {
      recommendations.push(
        `🔍 Categorías con problemas: ${problematicCategories.map(c => c.categoria).join(', ')}. ` +
        `Revisar prompts específicos de estas categorías.`
      );
    }

    // Tiempo de ejecución
    if (metrics.averageExecutionTimeMs > 1000) {
      recommendations.push('⏱️ Tiempo de ejecución alto. Considerar optimizar validaciones.');
    }

    // Elementos perdidos
    if (metrics.totalFailed > 0) {
      const lossRate = (metrics.totalFailed / metrics.totalExpected) * 100;
      recommendations.push(
        `📊 ${metrics.totalFailed} elementos fallaron (${lossRate.toFixed(1)}% del total). ` +
        `Revisar validaciones de campos requeridos.`
      );
    }

    return recommendations;
  }

  /**
   * Detecta problemas críticos
   */
  private static detectCriticalIssues(
    results: IntegrityTestResult[], 
    metrics: IntegrityTestMetrics
  ): string[] {
    const issues: string[] = [];

    // Tests con 0 elementos guardados
    const zeroSaveTests = results.filter(r => r.expectedElements > 0 && r.savedElements === 0);
    if (zeroSaveTests.length > 0) {
      issues.push(
        `🚨 ${zeroSaveTests.length} tests no guardaron NINGÚN elemento. ` +
        `Archivos: ${zeroSaveTests.map(t => t.jsonFileName).join(', ')}`
      );
    }

    // Tests con errores de parsing
    const parseErrors = results.filter(r => 
      r.validationErrors.some(e => e.includes('Parse error'))
    );
    if (parseErrors.length > 0) {
      issues.push(
        `❌ ${parseErrors.length} archivos JSON con errores de sintaxis. ` +
        `Revisar formato de archivos.`
      );
    }

    // Categorías completamente rotas
    const brokenCategories = metrics.categoriesBreakdown
      .filter(cat => cat.failed === cat.total);
    
    if (brokenCategories.length > 0) {
      issues.push(
        `💥 CATEGORÍAS COMPLETAMENTE ROTAS: ${brokenCategories.map(c => c.categoria).join(', ')}. ` +
        `Importaciones no funcionan en estas categorías.`
      );
    }

    return issues;
  }

  /**
   * Genera prompt diagnóstico para IA
   */
  private static generateDiagnosticPrompt(
    results: IntegrityTestResult[],
    metrics: IntegrityTestMetrics,
    recommendations: string[],
    criticalIssues: string[]
  ): string {
    return `# 🔍 DIAGNÓSTICO DE INTEGRIDAD - D4Builds Testing System

## 📊 RESUMEN EJECUTIVO

**Fecha**: ${new Date().toISOString()}
**Tests Ejecutados**: ${metrics.totalTests}
**Tasa de Éxito**: ${metrics.successRate.toFixed(2)}%
**Estado General**: ${metrics.successRate >= 90 ? '✅ EXCELENTE' : metrics.successRate >= 70 ? '⚡ ACEPTABLE' : '🚨 CRÍTICO'}

### Métricas Clave
- ✅ Tests Exitosos: ${metrics.passedTests} (${((metrics.passedTests / metrics.totalTests) * 100).toFixed(1)}%)
- ❌ Tests Fallidos: ${metrics.failedTests} (${((metrics.failedTests / metrics.totalTests) * 100).toFixed(1)}%)
- 📦 Elementos Esperados: ${metrics.totalExpected}
- 💾 Elementos Guardados: ${metrics.totalSaved} (${((metrics.totalSaved / metrics.totalExpected) * 100).toFixed(1)}%)
- 🔥 Elementos Fallidos: ${metrics.totalFailed}
- ⚠️ Elementos con Advertencias: ${metrics.totalWarnings}
- ⏱️ Tiempo Promedio: ${metrics.averageExecutionTimeMs.toFixed(2)}ms

## 📋 DESGLOSE POR CATEGORÍA

${metrics.categoriesBreakdown.map(cat => `
### ${cat.categoria.toUpperCase()}
- Total: ${cat.total} tests
- Pasados: ${cat.passed} ✅
- Fallidos: ${cat.failed} ❌
- Tasa de éxito: ${cat.total > 0 ? ((cat.passed / cat.total) * 100).toFixed(1) : 0}%
`).join('\n')}

## 🚨 PROBLEMAS CRÍTICOS

${criticalIssues.length > 0 ? criticalIssues.map(issue => `- ${issue}`).join('\n') : '✅ No se detectaron problemas críticos'}

## 💡 RECOMENDACIONES

${recommendations.map(rec => `- ${rec}`).join('\n')}

## 🔥 TESTS FALLIDOS DETALLADOS

${results.filter(r => !r.success).map(result => `
### ❌ ${result.jsonFileName} (${result.categoria})
- **Error**: ${result.errorMessage || 'Error desconocido'}
- **Esperados**: ${result.expectedElements} elementos
- **Guardados**: ${result.savedElements} elementos
- **Fallidos**: ${result.failedElements.length} elementos
${result.warningElements && result.warningElements.length > 0 ? `- **⚠️ Con advertencias**: ${result.warningElements.length} elementos\n  - ${result.warningElements.join('\n  - ')}` : ''}
- **Errores de Validación**:
${result.validationErrors.map(e => `  - ${e}`).join('\n')}
`).join('\n')}

## 🎯 ACCIONES SUGERIDAS PARA CLAUDE/IA

Basándote en este diagnóstico:

1. **Priorizar** correcciones según impacto (categorías rotas > tests individuales)
2. **Revisar prompts** de las categorías con mayor tasa de fallo
3. **Validar campos requeridos** que causan pérdida de elementos
4. **Revisar advertencias** de IDs autogenerados y campos opcionales
5. **Optimizar** validaciones si tiempo de ejecución > 1000ms
6. **Corregir JSONs** con errores de sintaxis o estructura

### Preguntas Específicas para IA:

1. ¿Los prompts de categorías fallidas incluyen TODOS los campos requeridos?
2. ¿Las validaciones de importación son demasiado estrictas?
3. ¿Hay inconsistencias entre formato de prompt y validación?
4. ¿Se están perdiendo datos por campos opcionales no manejados?
5. ¿Los JSONs con advertencias necesitan campos adicionales o los valores actuales son suficientes?

---

**NOTA**: Este reporte fue generado automáticamente por IntegrityTestService v0.8.6
Copia este prompt completo y compártelo con tu IA para obtener análisis detallado y soluciones.
`;
  }

  /**
   * Limpia workspace temporal (opcional)
   */
  static async cleanupTestWorkspace(workspaceHandle: FileSystemDirectoryHandle): Promise<void> {
    try {
      const testsFolder = await workspaceHandle.getDirectoryHandle('Tests', { create: false });
      
      // Nota: File System Access API no soporta eliminar directorios directamente
      // Se debe hacer manualmente o mediante otros métodos
      console.log('⚠️ Workspace temporal debe limpiarse manualmente desde: Tests/');
      console.log('💡 Los tests antiguos pueden eliminarse desde el explorador de archivos');
      
    } catch (error) {
      console.warn('⚠️ No se pudo acceder a carpeta Tests para limpieza:', error);
    }
  }
}
