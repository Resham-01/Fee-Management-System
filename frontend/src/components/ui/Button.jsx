const variants = {
  primary:
    'bg-gradient-to-b from-brand-600 to-brand-700 text-white shadow-sm shadow-brand-600/30 hover:from-brand-500 hover:to-brand-600 focus-visible:ring-brand-500/30 active:from-brand-700 active:to-brand-800',
  secondary:
    'bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-slate-400/20',
  success:
    'bg-gradient-to-b from-emerald-600 to-emerald-700 text-white shadow-sm shadow-emerald-600/30 hover:from-emerald-500 hover:to-emerald-600 focus-visible:ring-emerald-500/30',
  danger:
    'bg-gradient-to-b from-rose-600 to-rose-700 text-white shadow-sm shadow-rose-600/30 hover:from-rose-500 hover:to-rose-600 focus-visible:ring-rose-500/30',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400/20',
  outline:
    'text-brand-700 border border-brand-200 bg-brand-50 hover:bg-brand-100 focus-visible:ring-brand-500/20',
};

const sizes = {
  xs: 'px-2.5 py-1.5 text-xs',
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
  icon: 'p-2',
};

const Spinner = ({ className = 'h-4 w-4' }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-90"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  className = '',
  type = 'button',
  ...props
}) => (
  <button type={type} className={`btn ${variants[variant]} ${sizes[size]} ${className}`} disabled={loading || props.disabled} {...props}>
    {loading ? <Spinner className={`${size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} /> : icon}
    {children}
  </button>
);

export default Button;
