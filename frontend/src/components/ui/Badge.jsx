const tones = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-500/10',
  indigo: 'bg-brand-50 text-brand-700 ring-brand-600/10',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  rose: 'bg-rose-50 text-rose-700 ring-rose-600/10',
  sky: 'bg-sky-50 text-sky-700 ring-sky-600/10',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/10',
};

const Badge = ({ tone = 'slate', dot = false, children, className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${tones[tone]} ${className}`}
  >
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {children}
  </span>
);

export default Badge;
