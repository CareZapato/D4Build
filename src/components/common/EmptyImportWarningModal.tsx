import { useState } from 'react';
import { AlertCircle, Save, X } from 'lucide-react';

interface EmptyImportWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndContinue: () => Promise<void>;
  category: string;
  hasImage: boolean;
}

export default function EmptyImportWarningModal({ 
  isOpen, 
  onClose, 
  onSaveAndContinue, 
  category,
  hasImage 
}: EmptyImportWarningModalProps) {
  if (!isOpen) return null;

  const [saving, setSaving] = useState(false);

  const handleSaveAndContinue = async () => {
    setSaving(true);
    try {
      await onSaveAndContinue();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100000]">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative z-[1]">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="text-yellow-600" size={24} />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                JSON sin datos para importar
              </h3>
              <p className="text-gray-600 mb-4">
                El JSON que intentaste importar en la categoría <span className="font-semibold">{category}</span> no 
                contiene datos válidos para esta categoría.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Posibles causas:</strong>
                </p>
                <ul className="text-sm text-yellow-700 mt-2 ml-4 list-disc">
                  <li>Categoría incorrecta seleccionada</li>
                  <li>JSON vacío o con formato incorrecto</li>
                  <li>Datos que no coinciden con la estructura esperada</li>
                </ul>
              </div>
              {hasImage && (
                <p className="text-sm text-gray-500 mb-4">
                  Puedes guardar la imagen y el JSON para procesarlos más tarde con la categoría correcta.
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              disabled={saving}
            >
              <X size={18} className="inline mr-2" />
              Cancelar
            </button>
            {hasImage && (
              <button
                onClick={handleSaveAndContinue}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                disabled={saving}
              >
                <Save size={18} className="inline mr-2" />
                {saving ? 'Guardando...' : 'Guardar y Continuar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
