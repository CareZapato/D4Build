import { GeminiService } from './GeminiService';
import { OpenAIService } from './OpenAIService';
import { WorkspaceService } from './WorkspaceService';
import { BillingService } from './BillingService';

export interface AIReport {
  id: string;
  fecha: string;
  hora: string;
  personaje_id?: string;
  personaje_nombre?: string;
  clase?: string;
  tipo_prompt: string;
  titulo_prompt: string;
  prompt_usado: string;
  respuesta_ia: string;
  modelo: 'gemini-2.0-flash-exp' | 'gpt-4o';
  tokens_prompt: number;
  tokens_respuesta: number;
  costo_usd: number;
  duracion_ms: number;
  tags?: string[];
}

export interface AIReportMetadata {
  total_reportes: number;
  total_costo_usd: number;
  reportes_por_modelo: {
    gemini: number;
    openai: number;
  };
  reportes_por_tipo: Record<string, number>;
}

export class AIReportService {
  private static REPORTS_FOLDER = 'reportesIA';

  /**
   * Ejecutar consulta con IA y guardar reporte
   */
  static async executeAIQuery(params: {
    prompt: string;
    tipo_prompt: string;
    titulo_prompt: string;
    personaje_id?: string;
    personaje_nombre?: string;
    clase?: string;
    modelo?: 'gemini' | 'openai';
    tags?: string[];
  }): Promise<{ success: boolean; report?: AIReport; error?: string }> {
    const startTime = Date.now();
    const modelo = params.modelo || 'gemini';

    try {
      // Verificar que el workspace esté abierto
      const workspaceHandle = await WorkspaceService.getCurrentWorkspace();
      if (!workspaceHandle) {
        return { success: false, error: 'No hay workspace abierto' };
      }

      // Ejecutar consulta según modelo
      let respuestaIA = '';
      let tokensPrompt = 0;
      let tokensRespuesta = 0;
      let costoUSD = 0;
      let modeloUsado: 'gemini-2.0-flash-exp' | 'gpt-4o';

      if (modelo === 'gemini') {
        const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        if (!geminiApiKey || geminiApiKey === 'TU_API_KEY_AQUI') {
          return { success: false, error: 'API Key de Gemini no configurada' };
        }

        const result = await GeminiService.analyzeText(params.prompt, {
          apiKey: geminiApiKey,
          model: 'gemini-2.0-flash-exp'
        });

        if (!result.success || !result.response) {
          return { success: false, error: result.error || 'Error al procesar con Gemini' };
        }

        respuestaIA = result.response;
        tokensPrompt = result.usage?.promptTokens || 0;
        tokensRespuesta = result.usage?.responseTokens || 0;
        costoUSD = this.calculateGeminiCost(tokensPrompt, tokensRespuesta);
        modeloUsado = 'gemini-2.0-flash-exp';
      } else {
        const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
        if (!openaiApiKey || openaiApiKey === 'TU_API_KEY_AQUI') {
          return { success: false, error: 'API Key de OpenAI no configurada' };
        }

        const result = await OpenAIService.analyzeText(params.prompt, {
          apiKey: openaiApiKey,
          model: 'gpt-4o'
        });

        if (!result.success || !result.response) {
          return { success: false, error: result.error || 'Error al procesar con OpenAI' };
        }

        respuestaIA = result.response;
        tokensPrompt = result.usage?.promptTokens || 0;
        tokensRespuesta = result.usage?.responseTokens || 0;
        costoUSD = this.calculateOpenAICost(tokensPrompt, tokensRespuesta);
        modeloUsado = 'gpt-4o';
      }

      const duracionMs = Date.now() - startTime;
      const now = new Date();

      // Crear reporte
      const report: AIReport = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fecha: now.toISOString().split('T')[0],
        hora: now.toTimeString().split(' ')[0],
        personaje_id: params.personaje_id,
        personaje_nombre: params.personaje_nombre,
        clase: params.clase,
        tipo_prompt: params.tipo_prompt,
        titulo_prompt: params.titulo_prompt,
        prompt_usado: params.prompt,
        respuesta_ia: respuestaIA,
        modelo: modeloUsado,
        tokens_prompt: tokensPrompt,
        tokens_respuesta: tokensRespuesta,
        costo_usd: costoUSD,
        duracion_ms: duracionMs,
        tags: params.tags || []
      };

      // Guardar reporte en archivo
      await this.saveReport(report);

      // Registrar en billing
      await BillingService.trackUsage({
        tipo: 'ai_analysis',
        modelo: modeloUsado,
        tokens_prompt: tokensPrompt,
        tokens_respuesta: tokensRespuesta,
        costo: costoUSD,
        metadata: {
          tipo_prompt: params.tipo_prompt,
          personaje_id: params.personaje_id,
          report_id: report.id
        }
      });

      return { success: true, report };
    } catch (error) {
      console.error('Error ejecutando consulta IA:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Guardar reporte en archivo JSON
   */
  private static async saveReport(report: AIReport): Promise<void> {
    try {
      const workspaceHandle = await WorkspaceService.getCurrentWorkspace();
      if (!workspaceHandle) {
        throw new Error('No hay workspace abierto');
      }

      // Crear carpeta reportesIA si no existe
      let reportsFolder: FileSystemDirectoryHandle;
      try {
        reportsFolder = await workspaceHandle.getDirectoryHandle(this.REPORTS_FOLDER, { create: true });
      } catch (error) {
        console.error('Error creando carpeta reportesIA:', error);
        throw error;
      }

      // Nombre de archivo: YYYY-MM-DD_HH-MM-SS_tipo.json
      const timestamp = `${report.fecha}_${report.hora.replace(/:/g, '-')}`;
      const fileName = `${timestamp}_${report.tipo_prompt}.json`;

      const fileHandle = await reportsFolder.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(report, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Error guardando reporte:', error);
      throw error;
    }
  }

  /**
   * Cargar todos los reportes
   */
  static async loadAllReports(): Promise<AIReport[]> {
    try {
      const workspaceHandle = await WorkspaceService.getCurrentWorkspace();
      if (!workspaceHandle) {
        return [];
      }

      let reportsFolder: FileSystemDirectoryHandle;
      try {
        reportsFolder = await workspaceHandle.getDirectoryHandle(this.REPORTS_FOLDER);
      } catch {
        // Carpeta no existe todavía
        return [];
      }

      const reports: AIReport[] = [];
      
      for await (const entry of reportsFolder.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.json')) {
          try {
            const fileHandle = entry as FileSystemFileHandle;
            const file = await fileHandle.getFile();
            const content = await file.text();
            const report = JSON.parse(content) as AIReport;
            reports.push(report);
          } catch (error) {
            console.error(`Error cargando reporte ${entry.name}:`, error);
          }
        }
      }

      // Ordenar por fecha y hora (más recientes primero)
      return reports.sort((a, b) => {
        const dateA = new Date(`${a.fecha}T${a.hora}`).getTime();
        const dateB = new Date(`${b.fecha}T${b.hora}`).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error cargando reportes:', error);
      return [];
    }
  }

  /**
   * Eliminar un reporte
   */
  static async deleteReport(reportId: string): Promise<boolean> {
    try {
      const workspaceHandle = await WorkspaceService.getCurrentWorkspace();
      if (!workspaceHandle) {
        return false;
      }

      const reportsFolder = await workspaceHandle.getDirectoryHandle(this.REPORTS_FOLDER);
      
      // Buscar archivo por ID
      for await (const entry of reportsFolder.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.json')) {
          const fileHandle = entry as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          const content = await file.text();
          const report = JSON.parse(content) as AIReport;
          
          if (report.id === reportId) {
            await reportsFolder.removeEntry(entry.name);
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error eliminando reporte:', error);
      return false;
    }
  }

  /**
   * Obtener metadatos agregados
   */
  static async getReportsMetadata(): Promise<AIReportMetadata> {
    const reports = await this.loadAllReports();
    
    const metadata: AIReportMetadata = {
      total_reportes: reports.length,
      total_costo_usd: reports.reduce((sum, r) => sum + r.costo_usd, 0),
      reportes_por_modelo: {
        gemini: reports.filter(r => r.modelo === 'gemini-2.0-flash-exp').length,
        openai: reports.filter(r => r.modelo === 'gpt-4o').length
      },
      reportes_por_tipo: {}
    };

    // Agrupar por tipo
    reports.forEach(r => {
      metadata.reportes_por_tipo[r.tipo_prompt] = (metadata.reportes_por_tipo[r.tipo_prompt] || 0) + 1;
    });

    return metadata;
  }

  /**
   * Calcular costo de Gemini
   */
  private static calculateGeminiCost(promptTokens: number, responseTokens: number): number {
    // Precios Gemini 2.0 Flash (aprox): $0.10 / 1M tokens input, $0.40 / 1M tokens output
    const inputCost = (promptTokens / 1000000) * 0.10;
    const outputCost = (responseTokens / 1000000) * 0.40;
    return inputCost + outputCost;
  }

  /**
   * Calcular costo de OpenAI GPT-4o
   */
  private static calculateOpenAICost(promptTokens: number, responseTokens: number): number {
    // Precios GPT-4o (aprox): $2.50 / 1M tokens input, $10.00 / 1M tokens output
    const inputCost = (promptTokens / 1000000) * 2.50;
    const outputCost = (responseTokens / 1000000) * 10.00;
    return inputCost + outputCost;
  }
}
