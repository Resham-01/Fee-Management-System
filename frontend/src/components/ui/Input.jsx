export const Label = ({ children, htmlFor, className = '' }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-slate-700 mb-1.5 ${className}`}>
    {children}
  </label>
);

export const Field = ({ label, htmlFor, hint, error, required, children, className = '' }) => (
  <div className={className}>
    {label && (
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </Label>
    )}
    {children}
    {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
  </div>
);

const Input = ({ className = '', ...props }) => (
  <input className={`input-base ${className}`} {...props} />
);

export default Input;
