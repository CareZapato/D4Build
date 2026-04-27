import { AlertCircle, Check, X } from 'lucide-react';

interface PersonajeRestoreModalProps {
  isOpen: boolean;
  onConfirm: (applyToAll: boolean) => void;
  onCancel: () => void;
  existingPersonaje: {
    nombre: string;
    clase: string;
    nivel: number;
    id: string;
  };
  incomingData: {
    clase: string;
    nivel: number;
    id: string;
  };
}

export default function PersonajeRestoreModal({ 
  isOpen, 
  onConfirm, 
  onCancel,
  existingPersonaje,
  incomingData
}: PersonajeRestoreModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100000] p-4">
      <div className="absolute inset-0" onClick={onCancel}></div>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full relative z-[1] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <AlertCircle size={22} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Personaje Existente</h3>
              <p className="text-blue-100 text-sm">¿Importar sobre "{existingPersonaje.nombre}"?</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Comparación */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
              <div className="font-medium text-gray-900 mb-2 text-xs uppercase tracking-wide">Actual</div>
              <div className="text-gray-700"><span className="font-semibold">{existingPersonaje.clase}</span> · Nv.{existingPersonaje.nivel}</div>
              <div className="text-xs text-gray-500 font-mono truncate">ID: {existingPersonaje.id.slice(0, 8)}...</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 space-y-1.5">
              <div className="font-medium text-blue-900 mb-2 text-xs uppercase tracking-wide">Archivo</div>
              <div className="text-blue-700"><span className="font-semibold">{incomingData.clase}</span> · Nv.{incomingData.nivel}</div>
              <div className="text-xs text-blue-500 font-mono truncate">ID: {incomingData.id.slice(0, 8)}...</div>
            </div>
          </div>

          {/* Explicación */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <Check size={16} className="mt-0.5 flex-shrink-0 text-green-600" />
              <div className="text-gray-700">
                <span className="font-medium">Importar aquí:</span> Usa el personaje actual manteniendo clase/nivel
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <X size={16} className="mt-0.5 flex-shrink-0 text-gray-500" />
              <div className="text-gray-700">
                <span className="font-medium">Crear nuevo:</span> Crea otro personaje con los datos del archivo
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          <button
            onClick={() => onConfirm(true)}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 shadow-sm"
          >
            <Check size={18} />
            <span>Sí, importar aquí (aplicar a todos)</span>
          </button>
          <button
            onClick={() => onConfirm(false)}
            className="w-full px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Check size={18} />
            <span>Solo este archivo</span>
          </button>
          <button
            onClick={onCancel}
            className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            <X size={18} />
            <span>Crear nuevo personaje</span>
          </button>
        </div>
      </div>
    </div>
  );
}
