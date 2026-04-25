import { 
  IntegrityReport, 
  IntegrityTestResult, 
  IntegrityTestMetrics, 
  IntegrityTestProgress
} from '../types';
import { ImageService } from './ImageService';
import type { ImageCategory } from './ImageService';

/**
 * IntegrityTestService (v0.8.6 - Simplificado)
 * 
 * Servicio de validación de formato JSON para usuarios Premium/Admin.
 * 
 * FUNCIONALIDADES:
 * ✅ Escanea JSONs en carpeta imagenes/ del workspace
 * ✅ Valida estructura y formato según categoría
 * ✅ Detecta errores de formato (campos requeridos, tipos de datos)
 * ✅ Genera reporte detallado con métricas
 * ✅ Reporte en tiempo real con progreso
 * 
 * CAMBIOS v0.8.6:
 * - ❌ Eliminado: Creación de workspace temporal
 * - ❌ Eliminado: Importación real de datos
 * - ❌ Eliminado: Creación de personajes de prueba
 * - ✅ Solo validación de formato JSON
 */
export class IntegrityTestService {
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
   * Ejecuta validación completa de todos los JSONs en la galería
   */
  static async runFullIntegrityTest(
    workspaceHandle: FileSystemDirectoryHandle,
    reportId: string = `integrity_${Date.now()}`
  ): Promise<IntegrityReport> {
    const startTime = performance.now();
    
    console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
    console.log(`║     🧪 VALIDACIÓN DE FORMATO JSON - INICIO                    ║`);
    console.log(`╚════════════════════════════════════════════════════════════════╝`);
    console.log(`📋 ID de Reporte: ${reportId}`);
    console.log(`⏱️  Timestamp: ${new Date().toISOString()}`);
    console.log(`📁 Workspace: ${workspaceHandle.name}\n`);

    try {
      // Paso 1: Listar todos los JSONs
      console.log(`📂 PASO 1/3: Escaneando galería de JSONs...`);
      this.reportProgress({
        status: 'running',
        currentTest: 0,
        totalTests: 0,
        currentFileName: 'Escaneando JSONs...',
        message: 'Buscando archivos JSON en imagenes/',
        progressPercent: 10
      });

      const allJSONs = await this.listAllGalleryJSONs(workspaceHandle);

      if (allJSONs.length === 0) {
        console.log(`❌ ERROR: No se encontraron JSONs en la galería`);
        throw new Error('No se encontraron JSONs en la galería para validar');
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

      // Paso 2: Validar cada JSON
      console.log(`\n📂 PASO 2/3: Validando formato de JSONs...`);
      console.log(`════════════════════════════════════════════════════════════════\n`);
      
      const testResults: IntegrityTestResult[] = [];
      let currentCategory = '';
      
      for (let i = 0; i < allJSONs.length; i++) {
        const json = allJSONs[i];
        
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
          totalTests: allJSONs.length,
          currentFileName: json.fileName,
          message: `Validando ${json.categoria}/${json.fileName}`,
          progressPercent: 15 + ((i / allJSONs.length) * 70)
        });

        const result = await this.validateJSONFile(json.fileName, json.categoria, json.content);
        testResults.push(result);
      }

      console.log(`\n════════════════════════════════════════════════════════════════`);
      console.log(`✅ PASO 2/3 COMPLETADO: ${testResults.length} JSONs validados\n`);

      // Paso 3: Calcular métricas
      console.log(`📂 PASO 3/3: Calculando métricas agregadas...`);
      this.reportProgress({
        status: 'running',
        currentTest: allJSONs.length,
        totalTests: allJSONs.length,
        currentFileName: 'Generando reporte...',
        message: 'Calculando métricas y generando reporte final',
        progressPercent: 90
      });

      const metrics = this.calculateMetrics(testResults);
      
      console.log(`\n📊 RESUMEN DE MÉTRICAS:`);
      console.log(`   • Tests totales: ${metrics.totalTests}`);
      console.log(`   • Tests pasados: ${metrics.passedTests} (${((metrics.passedTests / metrics.totalTests) * 100).toFixed(1)}%)`);
      console.log(`   • Tests fallidos: ${metrics.failedTests} (${((metrics.failedTests / metrics.totalTests) * 100).toFixed(1)}%)`);
      console.log(`   • Elementos esperados: ${metrics.totalExpected}`);
      console.log(`   • Elementos válidos: ${metrics.totalSaved}`);
      console.log(`   • Elementos inválidos: ${metrics.totalFailed}`);
      console.log(`   • Tasa de éxito: ${metrics.successRate.toFixed(2)}%`);
      console.log(`   • Tiempo promedio: ${metrics.averageExecutionTimeMs.toFixed(2)}ms\n`);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Generar recomendaciones
      const recommendations = this.generateRecommendations(testResults, metrics);
      const criticalIssues = this.detectCriticalIssues(testResults, metrics);

      if (criticalIssues.length > 0) {
        console.log(`\n🚨 PROBLEMAS CRÍTICOS DETECTADOS (${criticalIssues.length}):`);
        criticalIssues.forEach((issue, idx) => {
          console.log(`   ${idx + 1}. ${issue}`);
        });
      }

      // Reporte final
      const report: IntegrityReport = {
        id: reportId,
        timestamp: new Date().toISOString(),
        workspaceName: workspaceHandle.name,
        totalTests: testResults.length,
        passedTests: testResults.filter(t => t.success).length,
        failedTests: testResults.filter(t => !t.success).length,
        metrics,
        results: testResults,
        fileDifferences: [],
        recommendations,
        criticalIssues,
        executionTimeMs: totalTime
      };

      console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
      console.log(`║     ✅ VALIDACIÓN COMPLETADA                                   ║`);
      console.log(`╚════════════════════════════════════════════════════════════════╝`);
      console.log(`⏱️  Tiempo total: ${totalTime.toFixed(2)}ms (${(totalTime / 1000).toFixed(2)}s)`);
      console.log(`📊 Tasa de éxito: ${metrics.successRate.toFixed(1)}%`);
      console.log(`✅ Aprobados: ${report.passedTests}`);
      console.log(`❌ Fallidos: ${report.failedTests}`);
      console.log(`📋 Reporte ID: ${reportId}\n`);

      this.reportProgress({
        status: 'completed',
        currentTest: allJSONs.length,
        totalTests: allJSONs.length,
        currentFileName: 'Completado',
        message: `✅ ${report.passedTests} aprobados, ❌ ${report.failedTests} fallidos`,
        progressPercent: 100
      });

      return report;

    } catch (error) {
      console.error(`💥 ERROR FATAL EN TESTING:`, error);
      
      this.reportProgress({
        status: 'error',
        currentTest: 0,
        totalTests: 0,
        currentFileName: 'Error',
        message: `Error: ${error}`,
        progressPercent: 0
      });

      throw error;
    }
  }

  /**
   * Lista todos los JSONs en la carpeta imagenes/
   */
  static async listAllGalleryJSONs(
    workspaceHandle: FileSystemDirectoryHandle
  ): Promise<Array<{ fileName: string; categoria: ImageCategory; content: string }>> {
    const foundJSONs: Array<{ fileName: string; categoria: ImageCategory; content: string }> = [];

    try {
      const imagesDir = await workspaceHandle.getDirectoryHandle('imagenes');
      
      const categories: ImageCategory[] = [
        'skills', 'glifos', 'aspectos', 'estadisticas', 'paragon', 
        'gemas_runas', 'runas', 'gemas', 'build', 'mundo', 
        'talismanes', 'mecanicas', 'otros'
      ];

      for (const categoria of categories) {
        try {
          const categoryDir = await imagesDir.getDirectoryHandle(categoria);
          
          for await (const entry of categoryDir.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.json')) {
              const fileHandle = entry as FileSystemFileHandle;
              const file = await fileHandle.getFile();
              const content = await file.text();
              
              foundJSONs.push({
                fileName: entry.name,
                categoria,
                content
              });
            }
          }
        } catch (error) {
          // Categoría no existe, continuar
        }
      }

      return foundJSONs;

    } catch (error) {
      console.error('Error listando JSONs:', error);
      throw error;
    }
  }

  /**
   * Valida formato de un JSON individual
   */
  private static async validateJSONFile(
    jsonFileName: string,
    categoria: ImageCategory,
    jsonContent: string
  ): Promise<IntegrityTestResult> {
    const startTime = performance.now();
    const testId = `test_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    console.log(`\n🧪 ════════════════════════════════════════════════════════`);
    console.log(`📄 VALIDANDO: ${jsonFileName}`);
    console.log(`📁 CATEGORÍA: ${categoria}`);
    console.log(`⏱️  INICIO: ${new Date().toLocaleTimeString()}`);

    try {
      // 1. Parse del JSON
      const parsedJSON = JSON.parse(jsonContent);
      console.log(`✅ JSON parseado correctamente`);
      
      // 2. Determinar elementos esperados
      const expectedElements = this.countExpectedElements(parsedJSON, categoria);
      console.log(`📊 ELEMENTOS ESPERADOS: ${expectedElements}`);
      
      // 3. Validar estructura del JSON
      console.log(`🔍 Validando formato...`);
      const validation = await this.validateJSONStructure(parsedJSON, categoria);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // 4. Determinar éxito basado en validación
      const success = validation.valid && validation.errors.length === 0;
      const validElements = validation.validElements;
      const invalidElements = validation.invalidElements || [];

      console.log(`📊 ELEMENTOS VÁLIDOS: ${validElements}`);
      if (invalidElements.length > 0) {
        console.log(`❌ ELEMENTOS INVÁLIDOS: ${invalidElements.length}`);
      }
      console.log(`⏱️  TIEMPO VALIDACIÓN: ${executionTime.toFixed(2)}ms`);

      if (success) {
        console.log(`✅ FORMATO VÁLIDO: ${jsonFileName}`);
        console.log(`   ✓ ${validElements}/${expectedElements} elementos válidos`);
        console.log(`════════════════════════════════════════════════════════\n`);
        
        return {
          id: testId,
          jsonFileName,
          categoria,
          timestamp: new Date().toISOString(),
          success: true,
          expectedElements,
          savedElements: validElements,
          failedElements: invalidElements,
          warningElements: [],
          executionTimeMs: executionTime,
          validationErrors: []
        };
      } else {
        console.log(`❌ FORMATO INVÁLIDO: ${jsonFileName}`);
        
        if (invalidElements.length > 0) {
          console.log(`🚨 ELEMENTOS INVÁLIDOS (${invalidElements.length}):`);
          invalidElements.forEach((elem, idx) => {
            console.log(`   ${idx + 1}. ${elem}`);
          });
        }
        
        if (validation.errors.length > 0) {
          console.log(`🔍 ERRORES DE VALIDACIÓN (${validation.errors.length}):`);
          validation.errors.forEach((err, idx) => {
            console.log(`   ${idx + 1}. ${err}`);
          });
        }
        
        console.log(`📉 TASA DE VALIDACIÓN: ${expectedElements > 0 ? ((validElements / expectedElements) * 100).toFixed(1) : 0}%`);
        console.log(`════════════════════════════════════════════════════════\n`);
        
        return {
          id: testId,
          jsonFileName,
          categoria,
          timestamp: new Date().toISOString(),
          success: false,
          errorMessage: validation.errors.length > 0 
            ? `Errores: ${validation.errors.slice(0, 3).join('; ')}${validation.errors.length > 3 ? '...' : ''}` 
            : 'Formato inválido',
          expectedElements,
          savedElements: validElements,
          failedElements: invalidElements,
          warningElements: [],
          executionTimeMs: executionTime,
          validationErrors: validation.errors
        };
      }
    } catch (error) {
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      console.log(`💥 ERROR DE SINTAXIS: ${jsonFileName}`);
      console.log(`❌ No se pudo parsear el JSON`);
      console.log(`📝 MENSAJE: ${error}`);
      console.log(`⏱️  TIEMPO: ${executionTime.toFixed(2)}ms`);
      console.log(`════════════════════════════════════════════════════════\n`);
      
      return {
        id: testId,
        jsonFileName,
        categoria,
        timestamp: new Date().toISOString(),
        success: false,
        errorMessage: `Error de sintaxis JSON: ${error}`,
        expectedElements: 0,
        savedElements: 0,
        failedElements: [],
        executionTimeMs: executionTime,
        validationErrors: [`Error de sintaxis: ${error}`]
      };
    }
  }

  /**
   * Cuenta elementos esperados según categoría
   */
  private static countExpectedElements(data: any, categoria: ImageCategory): number {
    if (!data) return 0;

    // Para estadísticas, contar campos en categorías
    if (categoria === 'estadisticas') {
      const statsData = data.estadisticas || data;
      const categories = ['atributosPrincipales', 'defensivo', 'ofensivo', 'utilidad', 'personaje', 'armaduraYResistencias', 'jcj', 'moneda'];
      let count = 0;
      for (const cat of categories) {
        if (statsData[cat] && typeof statsData[cat] === 'object') {
          count += Object.keys(statsData[cat]).filter(k => k !== 'detalles' && k !== 'palabras_clave').length;
        }
      }
      return count || 1;
    }

    // Para arrays, contar elementos
    const arrayFields: Record<string, string[]> = {
      'skills': ['habilidades_activas', 'habilidades_pasivas'],
      'glifos': ['glifos'],
      'aspectos': ['aspectos', 'aspectos_equipados'],
      'paragon': ['tableros', 'nodos'],
      'gemas_runas': ['runas', 'gemas'],
      'runas': ['runas'],
      'gemas': ['gemas'],
      'mundo': ['eventos', 'mazmorras'],
      'talismanes': ['talismanes'],
      'mecanicas': ['mecanicas'],
      'build': ['piezas']
    };

    const fields = arrayFields[categoria] || [];
    let total = 0;
    
    for (const field of fields) {
      if (data[field]) {
        if (Array.isArray(data[field])) {
          total += data[field].length;
        } else if (typeof data[field] === 'object') {
          total += Object.keys(data[field]).length;
        } else {
          total += 1;
        }
      }
    }

    return total || 1;
  }

  /**
   * Valida estructura según categoría
   */
  private static async validateJSONStructure(
    data: any, 
    categoria: ImageCategory
  ): Promise<{ valid: boolean; errors: string[]; validElements: number; invalidElements: string[] }> {
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

  // ═══════════════════════════════════════════════════════════════════════
  // VALIDADORES ESPECÍFICOS POR CATEGORÍA
  // ═══════════════════════════════════════════════════════════════════════

  private static validateSkillsJSON(data: any): { valid: boolean; errors: string[]; validElements: number; invalidElements: string[] } {
    const errors: string[] = [];
    const invalidElements: string[] = [];
    let validElements = 0;

    console.log(`   🔍 Validando estructura de habilidades...`);

    if (!data.habilidades_activas && !data.habilidades_pasivas && !data.habilidades) {
      errors.push('JSON debe contener habilidades_activas, habilidades_pasivas o habilidades');
      return { valid: false, errors, validElements: 0, invalidElements: [] };
    }

    const activas = data.habilidades_activas || [];
    const pasivas = data.habilidades_pasivas || [];

    for (const skill of activas) {
      if (!skill.nombre) {
        invalidElements.push(`skill_activa_${activas.indexOf(skill)}`);
      } else {
        validElements++;
      }
    }

    for (const skill of pasivas) {
      if (!skill.nombre) {
        invalidElements.push(`skill_pasiva_${pasivas.indexOf(skill)}`);
      } else {
        validElements++;
      }
    }

    console.log(`   📊 ${validElements} válidas, ${invalidElements.length} inválidas`);
    return { valid: errors.length === 0 && invalidElements.length === 0, errors, validElements, invalidElements };
  }

  private static validateGlyphsJSON(data: any): { valid: boolean; errors: string[]; validElements: number; invalidElements: string[] } {
    const errors: string[] = [];
    const invalidElements: string[] = [];
    let validElements = 0;

    console.log(`   🔍 Validando estructura de glifos...`);

    if (!data.glifos || !Array.isArray(data.glifos)) {
      errors.push('JSON debe contener array "glifos"');
      return { valid: false, errors, validElements: 0, invalidElements: [] };
    }

    for (const glifo of data.glifos) {
      if (!glifo.nombre) {
        invalidElements.push(`glifo_${data.glifos.indexOf(glifo)}`);
      } else {
        validElements++;
      }
    }

    console.log(`   📊 ${validElements} válidos, ${invalidElements.length} inválidos`);
    return { valid: errors.length === 0 && invalidElements.length === 0, errors, validElements, invalidElements };
  }

  private static validateAspectsJSON(data: any): { valid: boolean; errors: string[]; validElements: number; invalidElements: string[] } {
    const errors: string[] = [];
    const invalidElements: string[] = [];
    let validElements = 0;

    console.log(`   🔍 Validando estructura de aspectos...`);

    const aspectos = data.aspectos || data.aspectos_equipados || [];
    
    if (!Array.isArray(aspectos) || aspectos.length === 0) {
      errors.push('JSON debe contener array "aspectos" o "aspectos_equipados"');
      return { valid: false, errors, validElements: 0, invalidElements: [] };
    }

    for (const aspecto of aspectos) {
      const nombre = aspecto.name || aspecto.nombre;
      if (!nombre) {
        invalidElements.push(`aspecto_${aspectos.indexOf(aspecto)}`);
      } else {
        validElements++;
      }
    }

    console.log(`   📊 ${validElements} válidos, ${invalidElements.length} inválidos`);
    return { valid: errors.length === 0 && invalidElements.length === 0, errors, validElements, invalidElements };
  }

  private static validateStatsJSON(data: any): { valid: boolean; errors: string[]; validElements: number; invalidElements: string[] } {
    const errors: string[] = [];
    let validElements = 0;

    console.log(`   🔍 Validando estructura de estadísticas...`);

    const statsData = data.estadisticas || data;
    const categories = ['atributosPrincipales', 'defensivo', 'ofensivo', 'utilidad', 'personaje', 'armaduraYResistencias', 'jcj', 'moneda'];
    const hasCategory = categories.some(cat => statsData[cat]);

    if (!hasCategory) {
      errors.push(`JSON debe contener al menos una categoría: ${categories.join(', ')}`);
      return { valid: false, errors, validElements: 0, invalidElements: [] };
    }

    for (const cat of categories) {
      if (statsData[cat] && typeof statsData[cat] === 'object') {
        const fieldCount = Object.keys(statsData[cat]).filter(k => k !== 'detalles' && k !== 'palabras_clave').length;
        validElements += fieldCount;
        console.log(`   ✓ "${cat}": ${fieldCount} campos`);
      }
    }

    console.log(`   📊 ${validElements} campos válidos`);
    return { valid: errors.length === 0, errors, validElements, invalidElements: [] };
  }

  private static validateParagonJSON(data: any): { valid: boolean; errors: string[]; validElements: number; invalidElements: string[] } {
    const errors: string[] = [];
    let validElements = 0;

    console.log(`   🔍 Validando estructura de Paragon...`);

    if (!data.tableros && !data.nodos && !data.atributos_totales && !data.paragon) {
      errors.push('JSON debe contener tableros, nodos, atributos_totales o paragon');
      return { valid: false, errors, validElements: 0, invalidElements: [] };
    }

    if (data.tableros) validElements += Array.isArray(data.tableros) ? data.tableros.length : 1;
    if (data.nodos) validElements += Array.isArray(data.nodos) ? data.nodos.length : 1;
    if (data.atributos_totales) validElements += 1;
    if (data.paragon) validElements += 1;

    console.log(`   📊 ${validElements} elementos válidos`);
    return { valid: true, errors: [], validElements, invalidElements: [] };
  }

  private static validateGemsRunesJSON(data: any): { valid: boolean; errors: string[]; validElements: number; invalidElements: string[] } {
    const errors: string[] = [];
    const invalidElements: string[] = [];
    let validElements = 0;

    console.log(`   🔍 Validando estructura de Runas/Gemas...`);

    if (!data.runas && !data.gemas) {
      errors.push('JSON debe contener "runas" o "gemas"');
      return { valid: false, errors, validElements: 0, invalidElements: [] };
    }

    const items = [...(data.runas || []), ...(data.gemas || [])];
    for (const item of items) {
      if (!item.nombre) {
        invalidElements.push(`item_${items.indexOf(item)}`);
      } else {
        validElements++;
      }
    }

    console.log(`   📊 ${validElements} válidos, ${invalidElements.length} inválidos`);
    return { valid: errors.length === 0 && invalidElements.length === 0, errors, validElements, invalidElements };
  }

  private static validateWorldJSON(data: any): { valid: boolean; errors: string[]; validElements: number; invalidElements: string[] } {
    const errors: string[] = [];
    let validElements = 0;

    console.log(`   🔍 Validando estructura de Mundo...`);

    if (!data.eventos && !data.mazmorras) {
      errors.push('JSON debe contener "eventos" o "mazmorras"');
      return { valid: false, errors, validElements: 0, invalidElements: [] };
    }

    if (data.eventos) validElements += Array.isArray(data.eventos) ? data.eventos.length : 1;
    if (data.mazmorras) validElements += Array.isArray(data.mazmorras) ? data.mazmorras.length : 1;

    console.log(`   📊 ${validElements} elementos válidos`);
    return { valid: true, errors: [], validElements, invalidElements: [] };
  }

  private static validateCharmsJSON(data: any): { valid: boolean; errors: string[]; validElements: number; invalidElements: string[] } {
    const errors: string[] = [];
    const invalidElements: string[] = [];
    let validElements = 0;

    console.log(`   🔍 Validando estructura de Talismanes...`);

    if (!data.talismanes || !Array.isArray(data.talismanes)) {
      errors.push('JSON debe contener array "talismanes"');
      return { valid: false, errors, validElements: 0, invalidElements: [] };
    }

    for (const talisman of data.talismanes) {
      if (!talisman.nombre) {
        invalidElements.push(`talisman_${data.talismanes.indexOf(talisman)}`);
      } else {
        validElements++;
      }
    }

    console.log(`   📊 ${validElements} válidos, ${invalidElements.length} inválidos`);
    return { valid: errors.length === 0 && invalidElements.length === 0, errors, validElements, invalidElements };
  }

  private static validateMechanicsJSON(data: any): { valid: boolean; errors: string[]; validElements: number; invalidElements: string[] } {
    console.log(`   🔍 Validando estructura de Mecánicas...`);

    if (!data.mecanica_clase && !data.mecanicas) {
      return { valid: false, errors: ['JSON debe contener "mecanica_clase" o "mecanicas"'], validElements: 0, invalidElements: [] };
    }

    console.log(`   📊 1 elemento válido`);
    return { valid: true, errors: [], validElements: 1, invalidElements: [] };
  }

  private static validateBuildJSON(data: any): { valid: boolean; errors: string[]; validElements: number; invalidElements: string[] } {
    const errors: string[] = [];
    let validElements = 0;

    console.log(`   🔍 Validando estructura de Build...`);

    if (!data.build && !data.piezas) {
      errors.push('JSON debe contener "build" o "piezas"');
      return { valid: false, errors, validElements: 0, invalidElements: [] };
    }

    const piezas = data.build?.piezas || data.piezas;
    if (piezas) {
      validElements = Array.isArray(piezas) ? piezas.length : Object.keys(piezas).length;
    }

    console.log(`   📊 ${validElements} piezas válidas`);
    return { valid: true, errors: [], validElements, invalidElements: [] };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MÉTRICAS Y REPORTES
  // ═══════════════════════════════════════════════════════════════════════

  private static calculateMetrics(results: IntegrityTestResult[]): IntegrityTestMetrics {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = results.filter(r => !r.success).length;

    const totalExpected = results.reduce((sum, r) => sum + (r.expectedElements || 0), 0);
    const totalSaved = results.reduce((sum, r) => sum + (r.savedElements || 0), 0);
    const totalFailed = results.reduce((sum, r) => sum + (r.failedElements?.length || 0), 0);
    const totalWarnings = results.reduce((sum, r) => sum + (r.warningElements?.length || 0), 0);

    const totalTime = results.reduce((sum, r) => sum + (r.executionTimeMs || 0), 0);
    const averageExecutionTimeMs = totalTests > 0 ? totalTime / totalTests : 0;

    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    return {
      totalTests,
      passedTests,
      failedTests,
      totalExpected,
      totalSaved,
      totalFailed,
      totalWarnings,
      successRate,
      averageExecutionTimeMs
    };
  }

  private static generateRecommendations(results: IntegrityTestResult[], metrics: IntegrityTestMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.failedTests > 0) {
      recommendations.push(`Se detectaron ${metrics.failedTests} JSONs con errores de formato. Revisa los detalles en el reporte.`);
    }

    if (metrics.successRate < 50) {
      recommendations.push('Más del 50% de los JSONs tienen errores. Considera revisar el proceso de generación de JSONs con IA.');
    }

    if (metrics.successRate === 100) {
      recommendations.push('✅ Todos los JSONs tienen formato válido. Excelente calidad de datos.');
    }

    return recommendations;
  }

  private static detectCriticalIssues(results: IntegrityTestResult[], metrics: IntegrityTestMetrics): string[] {
    const issues: string[] = [];

    const parseErrors = results.filter(r => 
      r.errorMessage && r.errorMessage.includes('sintaxis')
    );

    if (parseErrors.length > 0) {
      issues.push(`${parseErrors.length} JSON(s) con errores de sintaxis que impiden su parseo.`);
    }

    const missingRequiredFields = results.filter(r => 
      r.validationErrors && r.validationErrors.some(e => e.includes('debe contener'))
    );

    if (missingRequiredFields.length > 0) {
      issues.push(`${missingRequiredFields.length} JSON(s) con campos requeridos faltantes.`);
    }

    return issues;
  }
}
