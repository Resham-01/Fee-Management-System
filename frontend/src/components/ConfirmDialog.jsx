const variants = {
  danger: {
    button: 'bg-gradient-to-b from-rose-600 to-rose-700 text-white shadow-sm shadow-rose-600/30 hover:from-rose-500 hover:to-rose-600 focus-visible:ring-rose-500/30',
    icon: 'bg-rose-100 text-rose-600',
    iconPath: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    ),
  },
  info: {
    button: 'bg-gradient-to-b from-brand-600 to-brand-700 text-white shadow-sm shadow-brand-600/30 hover:from-brand-500 hover:to-brand-600 focus-visible:ring-brand-500/30',
    icon: 'bg-brand-100 text-brand-600',
    iconPath: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
};

const ConfirmDialog = ({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const cfg = variants[variant] || variants.danger;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-md rounded-2xl bg-white shadow-lift border border-slate-100 overflow-hidden animate-scale-in"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${cfg.icon}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {cfg.iconPath}
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 id="confirm-dialog-title" className="text-lg font-bold font-display text-slate-900">
                {title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition focus-visible:ring-4 ${cfg.button}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
