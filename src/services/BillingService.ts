/**
 * BillingService - Servicio para rastreo de costos de API de OpenAI
 * Guarda registros de uso y costos en archivo JSON en la raíz del workspace
 */

import { WorkspaceService } from './WorkspaceService';

export interface BillingEntry {
  timestamp: string;           // ISO timestamp de la operación
  service: 'openai' | 'gemini'; // Servicio utilizado
  model: string;                // Modelo usado (ej: 'gpt-4o')
  category: string;             // Categoría procesada (ej: 'paragon', 'skills')
  tipo?: string;                // Tipo específico (ej: 'nodo', 'tablero')
  destination?: string;         // 'heroe' o 'personaje'
  clase?: string;               // Clase del héroe/personaje
  personaje?: string;           // Nombre del personaje
  tokens: {
    prompt: number;             // Tokens de entrada
    completion: number;         // Tokens de salida
    total: number;              // Total de tokens
  };
  cost: {
    input: number;              // Costo de tokens de entrada (USD)
    output: number;             // Costo de tokens de salida (USD)
    total: number;              // Costo total (USD)
  };
  success: boolean;             // Si la operación fue exitosa
  errorMessage?: string;        // Mensaje de error si aplica
}

export interface BillingData {
  entries: BillingEntry[];
  summary: {
    totalCost: number;          // Costo total acumulado (USD)
    totalTokens: number;        // Total de tokens usados
    totalRequests: number;      // Total de requests
    successfulRequests: number; // Requests exitosos
    failedRequests: number;     // Requests fallidos
    lastUpdated: string;        // Última actualización
  };
}

export class BillingService {
  private static BILLING_FILE = 'billing.json';
  
  // Precios de OpenAI (actualizado abril 2026)
  private static OPENAI_PRICES: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 0.005, output: 0.015 },           // $0.005 per 1K input, $0.015 per 1K output
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },   // Mini version
    'gpt-4-turbo': { input: 0.01, output: 0.03 },        // Turbo version
  };

  /**
   * Calcula el costo de una operación de OpenAI
   */
  static calculateOpenAICost(model: string, promptTokens: number, completionTokens: number): { input: number; output: number; total: number } {
    const prices = this.OPENAI_PRICES[model] || this.OPENAI_PRICES['gpt-4o'];
    
    // Costo = (tokens / 1000) * precio_por_1k
    const inputCost = (promptTokens / 1000) * prices.input;
    const outputCost = (completionTokens / 1000) * prices.output;
    
    return {
      input: inputCost,
      output: outputCost,
      total: inputCost + outputCost
    };
  }

  /**
   * Lee el archivo de billing actual desde el workspace
   */
  static async readBillingData(): Promise<BillingData> {
    try {
      // Intentar leer el archivo billing.json del workspace
      const jsonText = await WorkspaceService.readFile(this.BILLING_FILE);
      return JSON.parse(jsonText);
    } catch (error) {
      // Si no existe o hay error, crear estructura inicial
      return this.createEmptyBillingData();
    }
  }

  /**
   * Crea estructura vacía de billing
   */
  private static createEmptyBillingData(): BillingData {
    return {
      entries: [],
      summary: {
        totalCost: 0,
        totalTokens: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        lastUpdated: new Date().toISOString()
      }
    };
  }

  /**
   * Guarda una nueva entrada de billing en el workspace
   */
  static async recordBilling(entry: Omit<BillingEntry, 'timestamp'>): Promise<void> {
    try {
      // Leer datos actuales (o crear nuevo si no existe)
      let billingData: BillingData;
      try {
        const jsonText = await WorkspaceService.readFile(this.BILLING_FILE);
        billingData = JSON.parse(jsonText);
      } catch (error) {
        // Si no existe, crear nuevo
        billingData = this.createEmptyBillingData();
      }
      
      // Crear nueva entrada con timestamp
      const newEntry: BillingEntry = {
        ...entry,
        timestamp: new Date().toISOString()
      };
      
      // Agregar a la lista
      billingData.entries.push(newEntry);
      
      // Recalcular totales desde cero (más preciso)
      billingData.summary.totalCost = billingData.entries.reduce((sum, e) => sum + e.cost.total, 0);
      billingData.summary.totalTokens = billingData.entries.reduce((sum, e) => sum + e.tokens.total, 0);
      billingData.summary.totalRequests = billingData.entries.length;
      billingData.summary.successfulRequests = billingData.entries.filter(e => e.success).length;
      billingData.summary.failedRequests = billingData.entries.filter(e => !e.success).length;
      billingData.summary.lastUpdated = new Date().toISOString();
      
      // Guardar en workspace
      await WorkspaceService.saveFile(this.BILLING_FILE, JSON.stringify(billingData, null, 2));
    } catch (error) {
      console.error('❌ [BillingService] Error guardando billing:', error);
    }
  }

  /**
   * Registra una operación de OpenAI
   */
  static async recordOpenAI(params: {
    model: string;
    category: string;
    tipo?: string;
    destination?: string;
    clase?: string;
    personaje?: string;
    promptTokens: number;
    completionTokens: number;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    const cost = this.calculateOpenAICost(params.model, params.promptTokens, params.completionTokens);
    
    await this.recordBilling({
      service: 'openai',
      model: params.model,
      category: params.category,
      tipo: params.tipo,
      destination: params.destination,
      clase: params.clase,
      personaje: params.personaje,
      tokens: {
        prompt: params.promptTokens,
        completion: params.completionTokens,
        total: params.promptTokens + params.completionTokens
      },
      cost,
      success: params.success,
      errorMessage: params.errorMessage
    });
  }

  /**
   * Obtiene estadísticas resumidas
   */
  static async getStats(): Promise<BillingData['summary']> {
    const billingData = await this.readBillingData();
    return billingData.summary;
  }

  /**
   * Formatea costo para mostrar en UI
   */
  static formatCost(cost: number): string {
    if (cost < 0.01) {
      return `$${(cost * 1000).toFixed(3)}m`; // Milesimas
    }
    return `$${cost.toFixed(4)}`;
  }
}
