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
  jsonInputsProcessed?: number;
  totalInputItems?: number;
  itemsImported?: number;
  itemsUpdated?: number;
  itemsSkipped?: number;
  processedJsons?: Array<{
    categoria: string;
    archivo: string;
    totalInputItems: number;
    imported: number;
    updated: number;
    repeated: number;
    success: boolean;
    error?: string;
  }>;
  addedItems?: string[];
  updatedItemsList?: string[];
  repeatedItems?: string[];
  itemDetails?: Array<{
    name: string;
    category: string;
    status: 'agregado' | 'actualizado' | 'repetido';
  }>;
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
  onContinue?: () => void;
  continueLabel?: string;
}

const ImportResultsModal: React.FC<ImportResultsModalProps> = ({
  isOpen,
  onClose,
  results,
  onContinue,
  continueLabel = 'Continuar'
}) => {
  if (!isOpen || !results) return null;

  const hasErrors = results.validationErrors.some(e => e.severity === 'error');

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      skills: 'Habilidades',
      glifos: 'Glifos',
      aspectos: 'Aspectos',
      estadisticas: 'Estadísticas',
      paragon: 'Paragón',
      runas: 'Runas',
      gemas: 'Gemas',
      build: 'Equipo',
      todas: 'Todas las categorías',
      otros: 'Otros'
    };
    return labels[category] || category;
  };

  const getStatusClass = (status: 'agregado' | 'actualizado' | 'repetido'): string => {
    if (status === 'agregado') return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30';
    if (status === 'actualizado') return 'text-sky-300 bg-sky-500/10 border-sky-500/30';
    return 'text-amber-300 bg-amber-500/10 border-amber-500/30';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-[100000] p-4">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="bg-[#15171f] border border-white/10 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col relative z-[1]">
        {/* Header */}
        <div className={`px-4 py-3 border-b border-white/10 flex items-center justify-between ${
          results.success && !hasErrors 
            ? 'bg-emerald-950/30' 
            : hasErrors 
            ? 'bg-rose-950/30' 
            : 'bg-amber-950/30'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {results.success && !hasErrors ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : hasErrors ? (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            ) : (
              <Info className="w-5 h-5 text-amber-400" />
            )}
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white truncate">
                {results.success && !hasErrors 
                  ? 'Importación exitosa' 
                  : hasErrors 
                  ? 'Importación con errores' 
                  : 'Importación con advertencias'}
              </h2>
              <p className="text-gray-400 text-xs mt-0.5 truncate">
                {getCategoryLabel(results.category)} → {results.targetName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Summary */}
          {results.success && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-white mb-2">Resumen</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(results.jsonInputsProcessed !== undefined || results.totalInputItems !== undefined) && (
                  <div className="bg-black/20 rounded border border-white/10 px-2 py-1.5">
                    <p className="text-gray-400 text-[11px]">JSONs</p>
                    <p className="text-lg font-semibold text-cyan-300">{results.jsonInputsProcessed ?? 1}</p>
                  </div>
                )}
                {results.itemsImported !== undefined && (
                  <div className="bg-black/20 rounded border border-white/10 px-2 py-1.5">
                    <p className="text-gray-400 text-[11px]">Nuevos</p>
                    <p className="text-lg font-semibold text-emerald-300">{results.itemsImported}</p>
                  </div>
                )}
                {results.itemsUpdated !== undefined && (
                  <div className="bg-black/20 rounded border border-white/10 px-2 py-1.5">
                    <p className="text-gray-400 text-[11px]">Actualizados</p>
                    <p className="text-lg font-semibold text-sky-300">{results.itemsUpdated}</p>
                  </div>
                )}
                {results.itemsSkipped !== undefined && (
                  <div className="bg-black/20 rounded border border-white/10 px-2 py-1.5">
                    <p className="text-gray-400 text-[11px]">Repetidos</p>
                    <p className="text-lg font-semibold text-amber-300">{results.itemsSkipped}</p>
                  </div>
                )}
                {results.totalInputItems !== undefined && (
                  <div className="bg-black/20 rounded border border-white/10 px-2 py-1.5">
                    <p className="text-gray-400 text-[11px]">Elementos</p>
                    <p className="text-lg font-semibold text-violet-300">{results.totalInputItems}</p>
                  </div>
                )}
              </div>

              {results.processedJsons && results.processedJsons.length > 0 && (
                <details className="mt-3 bg-black/20 border border-white/10 rounded p-2">
                  <summary className="text-xs text-gray-200 cursor-pointer font-medium">
                    JSONs procesados ({results.processedJsons.length})
                  </summary>
                  <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {results.processedJsons.map((row, idx) => (
                      <div key={`${row.categoria}-${row.archivo}-${idx}`} className="text-[11px] bg-black/25 border border-white/10 rounded px-2 py-1.5">
                        <p className="text-gray-100 font-medium truncate">{row.categoria} / {row.archivo}</p>
                        <p className="text-gray-400">Entrada {row.totalInputItems} · Nuevos {row.imported} · Actualizados {row.updated} · Repetidos {row.repeated}</p>
                        {!row.success && row.error && <p className="text-rose-300 mt-0.5">{row.error}</p>}
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {results.itemDetails && results.itemDetails.length > 0 && (
                <details className="mt-3 bg-black/20 border border-white/10 rounded p-2">
                  <summary className="text-xs text-gray-200 cursor-pointer font-medium">
                    Elementos procesados ({results.itemDetails.length})
                  </summary>
                  <div className="mt-2 border border-white/10 rounded overflow-hidden">
                    <div className="grid grid-cols-12 gap-2 px-2 py-1 text-[10px] uppercase tracking-wide text-gray-400 bg-black/30 border-b border-white/10">
                      <span className="col-span-5">Nombre</span>
                      <span className="col-span-4">Categoría</span>
                      <span className="col-span-3">Estado</span>
                    </div>
                    <div className="max-h-56 overflow-y-auto divide-y divide-white/5">
                      {results.itemDetails.map((item, idx) => (
                        <div key={`${item.name}-${item.status}-${idx}`} className="grid grid-cols-12 gap-2 px-2 py-1.5 text-[11px] text-gray-200">
                          <span className="col-span-5 truncate" title={item.name}>{item.name}</span>
                          <span className="col-span-4 truncate text-gray-400" title={item.category}>{item.category}</span>
                          <span className="col-span-3">
                            <span className={`inline-flex px-1.5 py-0.5 rounded border text-[10px] uppercase tracking-wide ${getStatusClass(item.status)}`}>
                              {item.status}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              )}

              {results.fieldsAdded && results.fieldsAdded.length > 0 && (
                <div className="mt-3">
                  <p className="text-gray-400 text-xs mb-1.5">Campos detectados:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {results.fieldsAdded.map((field, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] rounded"
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
            <div className="bg-rose-900/15 border border-rose-500/40 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-rose-300 mb-1">Error</h3>
              <p className="text-gray-300 text-sm">{results.errorMessage}</p>
            </div>
          )}

          {/* Validation Errors */}
          {results.validationErrors.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-white mb-2">
                Validación de estructura
              </h3>
              <div className="space-y-1.5">
                {results.validationErrors.map((error, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded ${
                      error.severity === 'error'
                        ? 'bg-rose-900/15 border border-rose-500/40'
                        : 'bg-amber-900/15 border border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {error.severity === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{error.field}</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          Esperado: <code className="text-blue-300">{error.expected}</code>
                        </p>
                        <p className="text-gray-400 text-xs">
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
          <details className="bg-white/5 border border-white/10 rounded-lg p-3">
            <summary className="text-sm font-semibold text-white cursor-pointer">JSON procesado</summary>
            <div className="bg-black/25 rounded-lg p-3 overflow-x-auto mt-2">
              <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap">
                {results.rawJSON || 'No hay JSON disponible'}
              </pre>
            </div>
            {results.parsedJSON && (
              <details className="mt-2">
                <summary className="text-sky-300 cursor-pointer hover:text-sky-200 text-xs">
                  Ver JSON parseado (objeto JavaScript)
                </summary>
                <div className="bg-black/25 rounded-lg p-3 mt-2 overflow-x-auto">
                  <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(results.parsedJSON, null, 2)}
                  </pre>
                </div>
              </details>
            )}
          </details>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 flex justify-end gap-2">
          {onContinue && (
            <button
              onClick={onContinue}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded transition-colors"
            >
              {continueLabel}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportResultsModal;
