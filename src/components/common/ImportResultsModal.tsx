import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface ImportValidationError {
  field: string;
  expected: string;
  received: string;
  severity: 'error' | 'warning';
}

export interface ImportResultDetails {
  success: boolean;
  category: string;
  promptType: 'heroe' | 'personaje';
  targetName: string; // Nombre del héroe o personaje
  itemsImported?: number;
  itemsUpdated?: number;
  fieldsAdded?: string[];
  validationErrors: ImportValidationError[];
  rawJSON: string;
  parsedJSON?: any;
  errorMessage?: string;
}

interface ImportResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: ImportResultDetails | null;
}

const ImportResultsModal: React.FC<ImportResultsModalProps> = ({ isOpen, onClose, results }) => {
  if (!isOpen || !results) return null;

  const hasErrors = results.validationErrors.some(e => e.severity === 'error');
  const hasWarnings = results.validationErrors.some(e => e.severity === 'warning');

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      skills: 'Habilidades',
      glifos: 'Glifos',
      aspectos: 'Aspectos',
      estadisticas: 'Estadísticas',
      otros: 'Otros'
    };
    return labels[category] || category;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`p-6 border-b border-gray-700 flex items-center justify-between ${
          results.success && !hasErrors 
            ? 'bg-green-900/20' 
            : hasErrors 
            ? 'bg-red-900/20' 
            : 'bg-yellow-900/20'
        }`}>
          <div className="flex items-center gap-3">
            {results.success && !hasErrors ? (
              <CheckCircle className="w-8 h-8 text-green-400" />
            ) : hasErrors ? (
              <AlertCircle className="w-8 h-8 text-red-400" />
            ) : (
              <Info className="w-8 h-8 text-yellow-400" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">
                {results.success && !hasErrors 
                  ? '✅ Importación Exitosa' 
                  : hasErrors 
                  ? '❌ Importación con Errores' 
                  : '⚠️ Importación con Advertencias'}
              </h2>
              <p className="text-gray-300 text-sm mt-1">
                {getCategoryLabel(results.category)} → {results.targetName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary */}
          {results.success && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">📊 Resumen de Importación</h3>
              <div className="grid grid-cols-2 gap-4">
                {results.itemsImported !== undefined && (
                  <div>
                    <p className="text-gray-400 text-sm">Items Nuevos</p>
                    <p className="text-2xl font-bold text-green-400">{results.itemsImported}</p>
                  </div>
                )}
                {results.itemsUpdated !== undefined && (
                  <div>
                    <p className="text-gray-400 text-sm">Items Actualizados</p>
                    <p className="text-2xl font-bold text-blue-400">{results.itemsUpdated}</p>
                  </div>
                )}
              </div>
              {results.fieldsAdded && results.fieldsAdded.length > 0 && (
                <div className="mt-4">
                  <p className="text-gray-400 text-sm mb-2">Campos Agregados:</p>
                  <div className="flex flex-wrap gap-2">
                    {results.fieldsAdded.map((field, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-green-900/30 text-green-300 text-xs rounded"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {results.errorMessage && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-400 mb-2">❌ Error</h3>
              <p className="text-gray-300">{results.errorMessage}</p>
            </div>
          )}

          {/* Validation Errors */}
          {results.validationErrors.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                🔍 Validación de Estructura
              </h3>
              <div className="space-y-2">
                {results.validationErrors.map((error, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      error.severity === 'error'
                        ? 'bg-red-900/20 border border-red-500/50'
                        : 'bg-yellow-900/20 border border-yellow-500/50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {error.severity === 'error' ? (
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-white font-medium">{error.field}</p>
                        <p className="text-gray-400 text-sm mt-1">
                          Esperado: <code className="text-blue-300">{error.expected}</code>
                        </p>
                        <p className="text-gray-400 text-sm">
                          Recibido: <code className="text-orange-300">{error.received}</code>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* JSON Preview */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">📄 JSON Recibido de Gemini</h3>
            <div className="bg-gray-900/80 rounded-lg p-4 overflow-x-auto">
              <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap">
                {results.rawJSON || 'No hay JSON disponible'}
              </pre>
            </div>
            {results.parsedJSON && (
              <details className="mt-3">
                <summary className="text-blue-400 cursor-pointer hover:text-blue-300 text-sm">
                  Ver JSON parseado (objeto JavaScript)
                </summary>
                <div className="bg-gray-900/80 rounded-lg p-4 mt-2 overflow-x-auto">
                  <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap">
                    {JSON.stringify(results.parsedJSON, null, 2)}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          {results.success && !hasErrors && (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              🔄 Recargar Página
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportResultsModal;
