const styles = {
  success: {
    bar: 'bg-emerald-500',
    box: 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-white',
    text: 'text-emerald-900',
    icon: 'text-emerald-600 bg-emerald-100',
  },
  error: {
    bar: 'bg-rose-500',
    box: 'border-rose-200 bg-gradient-to-r from-rose-50 to-white',
    text: 'text-rose-900',
    icon: 'text-rose-600 bg-rose-100',
  },
  info: {
    bar: 'bg-blue-500',
    box: 'border-blue-200 bg-gradient-to-r from-blue-50 to-white',
    text: 'text-blue-900',
    icon: 'text-blue-600 bg-blue-100',
  },
};

const icons = {
  success: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  ),
  error: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  ),
  info: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
};

const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const theme = styles[toast.type] || styles.info;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto overflow-hidden rounded-xl border shadow-xl ${theme.box} animate-[fadeIn_0.25s_ease-out]`}
            role="status"
          >
            <div className={`h-1 ${theme.bar}`} />
            <div className="flex items-start gap-3 p-4">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${theme.icon}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {icons[toast.type] || icons.info}
                </svg>
              </div>
              <p className={`flex-1 text-sm font-medium leading-snug ${theme.text}`}>{toast.message}</p>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
