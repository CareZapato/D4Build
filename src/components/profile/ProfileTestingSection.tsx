import React, { useState } from 'react';
import { 
  FlaskConical, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronUp,
  Clock,
  FileJson,
  TrendingUp,
  Download
} from 'lucide-react';
import { IntegrityTestService } from '../../services/IntegrityTestService';
import { WorkspaceService } from '../../services/WorkspaceService';
import { 
  IntegrityReport, 
  IntegrityTestProgress, 
  IntegrityTestResult 
} from '../../types';

/**
 * ProfileTestingSection (v0.8.4)
 * 
 * Sección de testing de integridad para usuarios Premium/Admin.
 * Permite ejecutar tests automáticos sobre todos los JSONs guardados
 * y generar reportes detallados con diagnósticos para IA.
 */
export const ProfileTestingSection: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<IntegrityTestProgress | null>(null);
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleRunTests = async () => {
    if (!WorkspaceService.isWorkspaceLoaded()) {
      alert('⚠️ Debes cargar un workspace primero');
      return;
    }

    try {
      setIsRunning(true);
      setReport(null);

      // Configurar callback de progreso
      IntegrityTestService.setProgressCallback(setProgress);

      // Obtener handle del workspace
      const workspaceHandle = (WorkspaceService as any).fileSystemHandle;
      if (!workspaceHandle) {
        throw new Error('No se pudo obtener handle del workspace');
      }

      // Ejecutar tests completos
      const generatedReport = await IntegrityTestService.runFullIntegrityTest(workspaceHandle);
      setReport(generatedReport);
      
      console.log('✅ Testing completado', generatedReport);

    } catch (error) {
      console.error('❌ Error ejecutando tests:', error);
      alert(`Error ejecutando tests: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const copyPromptToClipboard = () => {
    if (!report) return;

    navigator.clipboard.writeText(report.diagnosticPrompt)
      .then(() => {
        alert('✅ Prompt diagnóstico copiado al portapapeles');
      })
      .catch((error) => {
        console.error('❌ Error copiando prompt:', error);
        alert('❌ No se pudo copiar el prompt');
      });
  };

  const downloadReport = () => {
    if (!report) return;

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `integrity_report_${report.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (successRate: number): string => {
    if (successRate >= 90) return 'text-green-400';
    if (successRate >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusIcon = (successRate: number) => {
    if (successRate >= 90) return <CheckCircle2 className="w-8 h-8 text-green-400" />;
    if (successRate >= 70) return <AlertTriangle className="w-8 h-8 text-yellow-400" />;
    return <XCircle className="w-8 h-8 text-red-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <FlaskConical className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Testing de Integridad</h2>
              <p className="text-sm text-gray-400 mt-1">
                Valida todos los JSONs guardados y genera diagnósticos detallados
              </p>
            </div>
          </div>

          {!isRunning && (
            <button
              onClick={handleRunTests}
              disabled={!WorkspaceService.isWorkspaceLoaded()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              Ejecutar Tests
            </button>
          )}
        </div>

        {/* Descripción */}
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-400 mb-2">¿Qué hace este sistema?</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Crea workspace temporal en carpeta <code className="text-purple-400">Tests/</code></li>
            <li>• Ejecuta TODOS los JSONs guardados en la galería de imágenes</li>
            <li>• Valida importaciones sin afectar tu workspace actual</li>
            <li>• Compara archivos originales vs generados</li>
            <li>• Genera reporte con métricas, gráficos y diagnósticos</li>
            <li>• Crea prompt optimizado para compartir con IA (Claude, GPT, etc.)</li>
          </ul>
        </div>
      </div>

      {/* Progreso */}
      {isRunning && progress && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Ejecutando Tests...</h3>
            <span className="text-sm text-gray-400">
              {progress.currentTest}/{progress.totalTests} tests
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">{progress.message}</span>
            <span className="text-purple-400 font-medium">{progress.progressPercent.toFixed(0)}%</span>
          </div>

          {progress.currentFileName && (
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
              <FileJson className="w-4 h-4" />
              <span className="truncate">{progress.currentFileName}</span>
            </div>
          )}
        </div>
      )}

      {/* Reporte */}
      {report && !isRunning && (
        <>
          {/* Métricas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tasa de Éxito */}
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Tasa de Éxito</span>
                {getStatusIcon(report.metrics.successRate)}
              </div>
              <div className={`text-3xl font-bold ${getStatusColor(report.metrics.successRate)}`}>
                {report.metrics.successRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {report.metrics.passedTests}/{report.metrics.totalTests} tests
              </div>
            </div>

            {/* Tests Totales */}
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Tests Totales</span>
                <FlaskConical className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white">
                {report.metrics.totalTests}
              </div>
              <div className="flex items-center gap-3 text-xs mt-1">
                <span className="text-green-400">✓ {report.metrics.passedTests}</span>
                <span className="text-red-400">✗ {report.metrics.failedTests}</span>
              </div>
            </div>

            {/* Elementos Guardados */}
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Elementos</span>
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white">
                {report.metrics.totalSaved}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                de {report.metrics.totalExpected} esperados
              </div>
              {report.metrics.totalWarnings > 0 && (
                <div className="text-xs text-yellow-500 mt-1">
                  ⚠️ {report.metrics.totalWarnings} con advertencia
                </div>
              )}
            </div>

            {/* Tiempo Promedio */}
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Tiempo Promedio</span>
                <Clock className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-3xl font-bold text-white">
                {report.metrics.averageExecutionTimeMs.toFixed(0)}
              </div>
              <div className="text-xs text-gray-500 mt-1">milisegundos</div>
            </div>
          </div>

          {/* Gráfico de Éxito/Fallo/Advertencias */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Distribución de Resultados</h3>
            <div className="flex items-center gap-4">
              {/* Barra visual */}
              <div className="flex-1 flex h-8 rounded-full overflow-hidden">
                <div
                  className="bg-green-500 flex items-center justify-center text-xs font-bold text-white"
                  style={{ width: `${(report.metrics.passedTests / report.metrics.totalTests) * 100}%` }}
                  title={`${report.metrics.passedTests} exitosos`}
                >
                  {report.metrics.passedTests > 0 && report.metrics.passedTests}
                </div>
                {report.metrics.totalWarnings > 0 && (
                  <div
                    className="bg-yellow-500 flex items-center justify-center text-xs font-bold text-black"
                    style={{ 
                      width: `${Math.min(
                        (report.metrics.totalWarnings / report.metrics.totalSaved) * 
                        ((report.metrics.passedTests / report.metrics.totalTests) * 100), 
                        20
                      )}%` 
                    }}
                    title={`${report.metrics.totalWarnings} elementos con advertencias`}
                  >
                    ⚠
                  </div>
                )}
                <div
                  className="bg-red-500 flex items-center justify-center text-xs font-bold text-white"
                  style={{ width: `${(report.metrics.failedTests / report.metrics.totalTests) * 100}%` }}
                  title={`${report.metrics.failedTests} fallidos`}
                >
                  {report.metrics.failedTests > 0 && report.metrics.failedTests}
                </div>
              </div>

              {/* Leyenda */}
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span className="text-gray-300">Exitosos: {report.metrics.passedTests}</span>
                </div>
                {report.metrics.totalWarnings > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-yellow-500" />
                    <span className="text-gray-300">Con advertencias: {report.metrics.totalWarnings}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500" />
                  <span className="text-gray-300">Fallidos: {report.metrics.failedTests}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Desglose por Categoría */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Desglose por Categoría</h3>
            <div className="space-y-3">
              {report.metrics.categoriesBreakdown.map((cat) => (
                <div key={cat.categoria} className="border border-gray-700 rounded-lg p-3">
                  <button
                    onClick={() => setExpandedCategory(
                      expandedCategory === cat.categoria ? null : cat.categoria
                    )}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <FileJson className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-medium capitalize">{cat.categoria}</span>
                      <span className="text-xs text-gray-500">({cat.total} tests)</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-green-400">✓ {cat.passed}</span>
                        <span className="text-red-400">✗ {cat.failed}</span>
                      </div>
                      {expandedCategory === cat.categoria ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {expandedCategory === cat.categoria && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      {report.testResults
                        .filter(t => t.categoria === cat.categoria)
                        .map((test) => (
                          <div
                            key={test.id}
                            className={`p-2 rounded mb-2 ${
                              test.success ? 'bg-green-500/10' : 'bg-red-500/10'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-300 truncate">
                                {test.jsonFileName}
                              </span>
                              <span className={`text-xs ${test.success ? 'text-green-400' : 'text-red-400'}`}>
                                {test.success ? '✓' : '✗'}
                              </span>
                            </div>
                            {!test.success && test.errorMessage && (
                              <div className="text-xs text-red-300 mt-1">{test.errorMessage}</div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Problemas Críticos */}
          {report.criticalIssues.length > 0 && (
            <div className="card border-2 border-red-500/50">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <h3 className="text-lg font-semibold text-red-400">Problemas Críticos</h3>
              </div>
              <ul className="space-y-2">
                {report.criticalIssues.map((issue, idx) => (
                  <li key={idx} className="text-sm text-red-300 pl-4 border-l-2 border-red-500">
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recomendaciones */}
          <div className="card border border-blue-500/30">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-semibold text-blue-400">Recomendaciones</h3>
            </div>
            <ul className="space-y-2">
              {report.recommendations.map((rec, idx) => (
                <li key={idx} className="text-sm text-gray-300 pl-4 border-l-2 border-blue-500">
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {/* Tests Fallidos Detallados */}
          {report.testResults.filter(t => !t.success).length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">
                Tests Fallidos ({report.testResults.filter(t => !t.success).length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {report.testResults
                  .filter(t => !t.success)
                  .map((test) => (
                    <div key={test.id} className="border border-red-500/30 rounded-lg p-3">
                      <button
                        onClick={() => setExpandedTest(expandedTest === test.id ? null : test.id)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-3">
                          <XCircle className="w-5 h-5 text-red-400" />
                          <div>
                            <div className="text-white font-medium">{test.jsonFileName}</div>
                            <div className="text-xs text-gray-400 capitalize">{test.categoria}</div>
                          </div>
                        </div>
                        {expandedTest === test.id ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>

                      {expandedTest === test.id && (
                        <div className="mt-3 pt-3 border-t border-red-500/30 space-y-2 text-sm">
                          <div>
                            <span className="text-gray-400">Error:</span>
                            <span className="text-red-300 ml-2">{test.errorMessage}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <span className="text-gray-400">Esperados:</span>
                              <span className="text-white ml-2">{test.expectedElements}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Guardados:</span>
                              <span className="text-green-400 ml-2">{test.savedElements}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Fallidos:</span>
                              <span className="text-red-400 ml-2">{test.failedElements.length}</span>
                            </div>
                          </div>
                          {test.warningElements && test.warningElements.length > 0 && (
                            <div>
                              <span className="text-yellow-400">⚠️ Elementos con advertencia ({test.warningElements.length}):</span>
                              <ul className="mt-1 space-y-1 pl-4">
                                {test.warningElements.map((warning, idx) => (
                                  <li key={idx} className="text-xs text-yellow-300">• {warning}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {test.validationErrors.length > 0 && (
                            <div>
                              <span className="text-gray-400">Errores de Validación:</span>
                              <ul className="mt-1 space-y-1 pl-4">
                                {test.validationErrors.map((err, idx) => (
                                  <li key={idx} className="text-xs text-red-300">• {err}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Acciones</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={copyPromptToClipboard}
                className="btn-primary flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar Prompt para IA
              </button>

              <button
                onClick={downloadReport}
                className="btn-secondary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar Reporte JSON
              </button>
            </div>

            <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-sm text-gray-300">
                💡 <strong>Tip:</strong> Copia el prompt diagnóstico y pégalo en tu chat con Claude, 
                GPT-4, o cualquier IA para obtener análisis detallado y soluciones específicas.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
