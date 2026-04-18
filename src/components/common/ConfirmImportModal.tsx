import React from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

export interface ImportSummary {
  habilidadesActivas?: {
    actualizadas: number;
    agregadas: number;
  };
  habilidadesPasivas?: {
    actualizadas: number;
    agregadas: number;
  };
  glifos?: {
    actualizados: number;
    agregados: number;
  };
  aspectos?: {
    actualizados: number;
    agregados: number;
  };
  estadisticas?: {
    seccionesActualizadas: string[];
  };
  palabrasClave?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  summary: ImportSummary;
  type: 'habilidades' | 'glifos' | 'aspectos' | 'estadisticas';
}

const ConfirmImportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  summary,
  type
}) => {
  if (!isOpen) return null;

  const renderSummary = () => {
    const items: string[] = [];

    if (type === 'habilidades') {
      if (summary.habilidadesActivas) {
        const { actualizadas, agregadas } = summary.habilidadesActivas;
        if (actualizadas > 0) items.push(`${actualizadas} habilidad${actualizadas > 1 ? 'es' : ''} activa${actualizadas > 1 ? 's' : ''} actualizada${actualizadas > 1 ? 's' : ''}`);
        if (agregadas > 0) items.push(`${agregadas} habilidad${agregadas > 1 ? 'es' : ''} activa${agregadas > 1 ? 's' : ''} nueva${agregadas > 1 ? 's' : ''}`);
      }
      if (summary.habilidadesPasivas) {
        const { actualizadas, agregadas } = summary.habilidadesPasivas;
        if (actualizadas > 0) items.push(`${actualizadas} habilidad${actualizadas > 1 ? 'es' : ''} pasiva${actualizadas > 1 ? 's' : ''} actualizada${actualizadas > 1 ? 's' : ''}`);
        if (agregadas > 0) items.push(`${agregadas} habilidad${agregadas > 1 ? 'es' : ''} pasiva${agregadas > 1 ? 's' : ''} nueva${agregadas > 1 ? 's' : ''}`);
      }
    }

    if (type === 'glifos' && summary.glifos) {
      const { actualizados, agregados } = summary.glifos;
      if (actualizados > 0) items.push(`${actualizados} glifo${actualizados > 1 ? 's' : ''} actualizado${actualizados > 1 ? 's' : ''}`);
      if (agregados > 0) items.push(`${agregados} glifo${agregados > 1 ? 's' : ''} nuevo${agregados > 1 ? 's' : ''}`);
    }

    if (type === 'aspectos' && summary.aspectos) {
      const { actualizados, agregados } = summary.aspectos;
      if (actualizados > 0) items.push(`${actualizados} aspecto${actualizados > 1 ? 's' : ''} actualizado${actualizados > 1 ? 's' : ''}`);
      if (agregados > 0) items.push(`${agregados} aspecto${agregados > 1 ? 's' : ''} nuevo${agregados > 1 ? 's' : ''}`);
    }

    if (type === 'estadisticas' && summary.estadisticas) {
      const { seccionesActualizadas } = summary.estadisticas;
      if (seccionesActualizadas.length > 0) {
        items.push(`Secciones actualizadas: ${seccionesActualizadas.join(', ')}`);
      }
    }

    if (summary.palabrasClave && summary.palabrasClave > 0) {
      items.push(`${summary.palabrasClave} palabra${summary.palabrasClave > 1 ? 's' : ''} clave agregada${summary.palabrasClave > 1 ? 's' : ''}`);
    }

    return items;
  };

  const summaryItems = renderSummary();
  const hasChanges = summaryItems.length > 0;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100000] p-4 animate-fade-in">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="card max-w-lg w-full border-l-4 border-d4-accent animate-fade-in shadow-2xl relative z-[1]">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-d4-text flex-1">Confirmar Importación</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-d4-border/50 rounded transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5 text-d4-text-dim" />
          </button>
        </div>

        <div className="mb-6">
          {hasChanges ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-8 h-8 text-d4-accent flex-shrink-0" />
                <p className="text-sm text-d4-text">
                  Se realizarán los siguientes cambios:
                </p>
              </div>
              <ul className="space-y-2 bg-d4-bg p-4 rounded border border-d4-border">
                {summaryItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-d4-text">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="flex items-center gap-2 text-yellow-500">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm">
                No se detectaron cambios para aplicar.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="btn-secondary px-6 py-2"
          >
            Cancelar
          </button>
          {hasChanges && (
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="btn-primary px-6 py-2"
            >
              Confirmar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmImportModal;
