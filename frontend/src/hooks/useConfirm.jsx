import { useState, useCallback } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

export const useConfirm = () => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'danger',
    resolve: null,
  });

  const confirm = useCallback(
    ({
      title = 'Are you sure?',
      message = 'This action cannot be undone.',
      confirmLabel = 'Delete',
      cancelLabel = 'Cancel',
      variant = 'danger',
    } = {}) =>
      new Promise((resolve) => {
        setConfirmState({
          isOpen: true,
          title,
          message,
          confirmLabel,
          cancelLabel,
          variant,
          resolve,
        });
      }),
    []
  );

  const handleConfirm = () => {
    confirmState.resolve?.(true);
    setConfirmState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  };

  const handleCancel = () => {
    confirmState.resolve?.(false);
    setConfirmState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  };

  const ConfirmDialogElement = (
    <ConfirmDialog
      isOpen={confirmState.isOpen}
      title={confirmState.title}
      message={confirmState.message}
      confirmLabel={confirmState.confirmLabel}
      cancelLabel={confirmState.cancelLabel}
      variant={confirmState.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, ConfirmDialogElement };
};
