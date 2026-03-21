import { useState, useCallback } from 'react';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

const initialState: ModalState = {
  isOpen: false,
  title: '',
  message: '',
  type: 'info',
  showCancel: false,
};

export const useModal = () => {
  const [modalState, setModalState] = useState<ModalState>(initialState);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const showModal = useCallback((options: Omit<ModalState, 'isOpen'>) => {
    setModalState({
      ...options,
      isOpen: true,
    });
  }, []);

  const showInfo = useCallback((message: string, title: string = 'Información') => {
    showModal({ title, message, type: 'info' });
  }, [showModal]);

  const showSuccess = useCallback((message: string, title: string = 'Éxito') => {
    showModal({ title, message, type: 'success' });
  }, [showModal]);

  const showWarning = useCallback((message: string, title: string = 'Advertencia') => {
    showModal({ title, message, type: 'warning' });
  }, [showModal]);

  const showError = useCallback((message: string, title: string = 'Error') => {
    showModal({ title, message, type: 'error' });
  }, [showModal]);

  const showConfirm = useCallback((
    message: string,
    title: string = 'Confirmar',
    confirmText: string = 'Sí',
    cancelText: string = 'No'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
      showModal({
        title,
        message,
        type: 'confirm',
        confirmText,
        cancelText,
        showCancel: true,
        onConfirm: () => {
          resolve(true);
          closeModal();
        }
      });
    });
  }, [showModal]);

  const closeModal = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
    setModalState(initialState);
  }, [resolvePromise]);

  const handleConfirm = useCallback(() => {
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }
    if (resolvePromise) {
      resolvePromise(true);
      setResolvePromise(null);
    }
    setModalState(initialState);
  }, [modalState, resolvePromise]);

  return {
    isOpen: modalState.isOpen,
    type: modalState.type,
    title: modalState.title,
    message: modalState.message,
    confirmText: modalState.confirmText,
    cancelText: modalState.cancelText,
    showCancel: modalState.showCancel,
    onClose: closeModal,
    onConfirm: handleConfirm,
    showInfo,
    showSuccess,
    showWarning,
    showError,
    showConfirm
  };
};
