// 🧪 AdminTesting - Panel de Testing para Administradores
// Solo accesible para usuarios con rol admin

import { useState } from 'react';
import { 
  TestingService, 
  TestSuite, 
  TestResult 
} from '../../services/TestingService';
import { 
  FlaskConical, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileJson,
  Image as ImageIcon,
  Link2,
  Zap,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export function AdminTesting() {
  const [isRunning, setIsRunning] = useState(false);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);

  // ==========================================================================
  // EJECUTAR TODOS LOS TESTS
  // ==========================================================================

  const handleRunAllTests = async () => {
    setIsRunning(true);
    setTestSuites([]);
    setSelectedTest(null);

    try {
      const results = await TestingService.runAllTests();
      setTestSuites(results);
      
      // Expandir automáticamente suites con errores
      const suitesConErrores = new Set<string>(
        results
          .filter(suite => suite.failed > 0)
          .map(suite => suite.suiteName)
      );
      setExpandedSuites(suitesConErrores);
    } catch (error) {
      console.error('Error ejecutando tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // ==========================================================================
  // TOGGLE SUITE EXPANSION
  // ==========================================================================

  const toggleSuite = (suiteName: string) => {
    const newExpanded = new Set(expandedSuites);
    if (newExpanded.has(suiteName)) {
      newExpanded.delete(suiteName);
    } else {
      newExpanded.add(suiteName);
    }
    setExpandedSuites(newExpanded);
  };

  // ==========================================================================
  // CALCULAR ESTADÍSTICAS GLOBALES
  // ==========================================================================

  const globalStats = testSuites.length > 0 ? {
    totalSuites: testSuites.length,
    totalTests: testSuites.reduce((sum, s) => sum + s.totalTests, 0),
    totalPassed: testSuites.reduce((sum, s) => sum + s.passed, 0),
    totalFailed: testSuites.reduce((sum, s) => sum + s.failed, 0),
    totalDuration: testSuites.reduce((sum, s) => sum + s.duration, 0),
    successRate: 0
  } : null;

  if (globalStats) {
    globalStats.successRate = globalStats.totalTests > 0
      ? Math.round((globalStats.totalPassed / globalStats.totalTests) * 100)
      : 0;
  }

  // ==========================================================================
  // OBTENER ÍCONO POR CATEGORÍA
  // ==========================================================================

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Estadísticas': return <BarChart3 className="w-4 h-4" />;
      case 'Habilidades': return <Zap className="w-4 h-4" />;
      case 'Glifos': return <FlaskConical className="w-4 h-4" />;
      case 'Aspectos': return <CheckCircle2 className="w-4 h-4" />;
      case 'Mundo': return <ImageIcon className="w-4 h-4" />;
      case 'Prompts': return <FileJson className="w-4 h-4" />;
      case 'Relaciones': return <Link2 className="w-4 h-4" />;
      case 'Imágenes': return <ImageIcon className="w-4 h-4" />;
      default: return <FileJson className="w-4 h-4" />;
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-br from-d4-surface via-d4-bg to-d4-surface border-2 border-d4-accent/30 p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30">
            <FlaskConical className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-d4-text">Sistema de Testing</h2>
            <p className="text-d4-text-dim mt-1">
              Panel de pruebas para validar servicios de importación y procesamiento de datos
            </p>
          </div>
        </div>

        {/* Botón de Ejecución */}
        <button
          onClick={handleRunAllTests}
          disabled={isRunning}
          className="px-6 py-3 rounded-lg font-bold text-sm shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-pink-600 text-white"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
              Ejecutando Tests...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 inline mr-2" />
              Ejecutar Todos los Tests
            </>
          )}
        </button>
      </div>

      {/* Estadísticas Globales */}
      {globalStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Tests */}
          <div className="card p-4 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-d4-text-dim">Total Tests</p>
                <p className="text-2xl font-bold text-blue-400">{globalStats.totalTests}</p>
              </div>
              <FlaskConical className="w-8 h-8 text-blue-400/50" />
            </div>
          </div>

          {/* Tests Pasados */}
          <div className="card p-4 bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-d4-text-dim">Pasados</p>
                <p className="text-2xl font-bold text-green-400">{globalStats.totalPassed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400/50" />
            </div>
          </div>

          {/* Tests Fallidos */}
          <div className="card p-4 bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-d4-text-dim">Fallidos</p>
                <p className="text-2xl font-bold text-red-400">{globalStats.totalFailed}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400/50" />
            </div>
          </div>

          {/* Tasa de Éxito */}
          <div className="card p-4 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-d4-text-dim">Tasa de Éxito</p>
                <p className="text-2xl font-bold text-purple-400">{globalStats.successRate}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-400/50" />
            </div>
          </div>
        </div>
      )}

      {/* Resultados por Suite */}
      {testSuites.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-d4-text">Resultados por Suite</h3>
          
          {testSuites.map((suite) => {
            const isExpanded = expandedSuites.has(suite.suiteName);
            const successRate = suite.totalTests > 0
              ? Math.round((suite.passed / suite.totalTests) * 100)
              : 0;

            return (
              <div 
                key={suite.suiteName} 
                className="card border border-d4-border bg-d4-surface"
              >
                {/* Suite Header */}
                <button
                  onClick={() => toggleSuite(suite.suiteName)}
                  className="w-full p-4 flex items-center justify-between hover:bg-d4-bg/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {suite.failed > 0 ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    )}
                    <div className="text-left">
                      <h4 className="text-lg font-bold text-d4-text">{suite.suiteName}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-d4-text-dim">
                          {suite.passed}/{suite.totalTests} pasados
                        </span>
                        <span className="text-sm text-d4-text-dim">
                          •
                        </span>
                        <span className="text-sm text-d4-text-dim">
                          {suite.duration}ms
                        </span>
                        <span className="text-sm text-d4-text-dim">
                          •
                        </span>
                        <span className={`text-sm font-bold ${
                          successRate === 100 ? 'text-green-400' :
                          successRate >= 80 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {successRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-d4-text-dim" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-d4-text-dim" />
                  )}
                </button>

                {/* Suite Results */}
                {isExpanded && (
                  <div className="border-t border-d4-border">
                    <div className="p-4 space-y-2">
                      {suite.results.map((result, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedTest(result)}
                          className={`w-full p-3 rounded-lg text-left transition-all ${
                            result.passed
                              ? 'bg-green-900/20 hover:bg-green-900/30 border border-green-500/30'
                              : 'bg-red-900/20 hover:bg-red-900/30 border border-red-500/30'
                          } ${selectedTest === result ? 'ring-2 ring-purple-500' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {getCategoryIcon(result.category)}
                              <div className="flex-1">
                                <p className="text-sm font-medium text-d4-text">
                                  {result.testName}
                                </p>
                                <p className={`text-xs mt-1 ${
                                  result.passed ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {result.message}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-d4-text-dim" />
                              <span className="text-xs text-d4-text-dim">
                                {result.duration}ms
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Panel de Detalles */}
      {selectedTest && (
        <div className="card border-2 border-purple-500/50 bg-gradient-to-br from-d4-surface to-d4-bg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getCategoryIcon(selectedTest.category)}
              <div>
                <h3 className="text-xl font-bold text-d4-text">{selectedTest.testName}</h3>
                <p className="text-sm text-d4-text-dim">{selectedTest.category}</p>
              </div>
            </div>
            {selectedTest.passed ? (
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            ) : (
              <XCircle className="w-8 h-8 text-red-400" />
            )}
          </div>

          {/* Mensaje */}
          <div className={`p-3 rounded-lg mb-4 ${
            selectedTest.passed
              ? 'bg-green-900/20 border border-green-500/30'
              : 'bg-red-900/20 border border-red-500/30'
          }`}>
            <p className={`text-sm ${
              selectedTest.passed ? 'text-green-400' : 'text-red-400'
            }`}>
              {selectedTest.message}
            </p>
          </div>

          {/* Detalles */}
          {selectedTest.details && (
            <div className="bg-d4-bg/50 p-4 rounded-lg border border-d4-border">
              <h4 className="text-sm font-bold text-d4-text mb-2">Detalles:</h4>
              <pre className="text-xs text-d4-text-dim overflow-auto max-h-64">
                {JSON.stringify(selectedTest.details, null, 2)}
              </pre>
            </div>
          )}

          {/* Errores */}
          {selectedTest.errors && selectedTest.errors.length > 0 && (
            <div className="mt-4 bg-red-900/20 p-4 rounded-lg border border-red-500/30">
              <h4 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Errores:
              </h4>
              <ul className="space-y-1">
                {selectedTest.errors.map((error, idx) => (
                  <li key={idx} className="text-xs text-red-300">• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Duración */}
          <div className="mt-4 flex items-center gap-2 text-sm text-d4-text-dim">
            <Clock className="w-4 h-4" />
            <span>Duración: {selectedTest.duration}ms</span>
          </div>
        </div>
      )}

      {/* Estado Inicial */}
      {testSuites.length === 0 && !isRunning && (
        <div className="card p-12 text-center">
          <FlaskConical className="w-16 h-16 mx-auto mb-4 text-d4-text-dim" />
          <p className="text-d4-text-dim">
            Haz clic en "Ejecutar Todos los Tests" para comenzar
          </p>
        </div>
      )}

      {/* Documentación */}
      <div className="card border border-d4-border/50 bg-d4-surface/50 p-6">
        <h3 className="text-lg font-bold text-d4-text mb-3 flex items-center gap-2">
          <FileJson className="w-5 h-5" />
          Documentación de Testing
        </h3>
        <div className="space-y-3 text-sm text-d4-text-dim">
          <div>
            <h4 className="font-bold text-d4-text mb-1">🎯 Suites de Prueba:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Estadísticas:</strong> Validación de estructura JSON, extracción de nivel y nivel paragon</li>
              <li><strong>Habilidades:</strong> Validación de habilidades activas/pasivas, modificadores, palabras clave</li>
              <li><strong>Glifos:</strong> Validación de rareza, bonificaciones, atributos escalados</li>
              <li><strong>Aspectos:</strong> Validación de categorías, formato de nivel, keywords</li>
              <li><strong>Mundo:</strong> Validación de eventos, requisitos, recompensas</li>
              <li><strong>Prompts:</strong> Validación de que los prompts incluyen todos los campos del JSON</li>
              <li><strong>Relaciones:</strong> Validación de integridad entre personajes y héroes</li>
              <li><strong>Imágenes:</strong> Validación de almacenamiento y estructura de carpetas</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-d4-text mb-1">📊 Métricas:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Duración de cada test en milisegundos</li>
              <li>Tasa de éxito por suite</li>
              <li>Detalles de errores y validaciones</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-d4-text mb-1">🔒 Seguridad:</h4>
            <p className="ml-4">Este panel solo es accesible para usuarios con rol de administrador.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
