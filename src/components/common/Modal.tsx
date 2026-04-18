import React from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  onConfirm,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  showCancel = false
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-12 h-12 text-red-500" />;
      case 'confirm':
        return <AlertCircle className="w-12 h-12 text-d4-accent" />;
      default:
        return <Info className="w-12 h-12 text-blue-500" />;
    }
  };

  const getColorClass = () => {
    switch (type) {
      case 'success':
        return 'border-green-500';
      case 'warning':
        return 'border-yellow-500';
      case 'error':
        return 'border-red-500';
      case 'confirm':
        return 'border-d4-accent';
      default:
        return 'border-blue-500';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100000] p-4 animate-fade-in">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className={`card max-w-md w-full border-l-4 ${getColorClass()} animate-fade-in shadow-2xl relative z-[1]`}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-d4-text flex-1">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-d4-border/50 rounded transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5 text-d4-text-dim" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-4">
            {getIcon()}
          </div>
          <p className="text-base text-d4-text whitespace-pre-line leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          {showCancel && (
            <button
              onClick={onClose}
              className="btn-secondary px-6 py-2"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-6 py-2 font-bold rounded-md transition-all duration-200 ${
              type === 'error' || type === 'warning'
                ? 'btn-danger'
                : 'btn-primary'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
