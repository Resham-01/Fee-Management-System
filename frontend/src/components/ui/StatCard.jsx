const iconColors = {
  brand: 'bg-brand-50 text-brand-600 ring-brand-600/10',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-600/10',
  amber: 'bg-amber-50 text-amber-600 ring-amber-600/10',
  rose: 'bg-rose-50 text-rose-600 ring-rose-600/10',
  sky: 'bg-sky-50 text-sky-600 ring-sky-600/10',
  violet: 'bg-violet-50 text-violet-600 ring-violet-600/10',
};

const StatCard = ({ label, value, icon, tone = 'brand', sublabel, onClick }) => {
  const content = (
    <div
      onClick={onClick}
      className={`card p-5 ${onClick ? 'cursor-pointer hover:shadow-lift hover:border-slate-300 transition-shadow' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl sm:text-[1.75rem] font-bold font-display text-slate-900 tracking-tight truncate">
            {value}
          </p>
          {sublabel && <p className="mt-1 text-xs text-slate-400">{sublabel}</p>}
        </div>
        {icon && (
          <div className={`flex-shrink-0 w-11 h-11 rounded-xl ring-1 ring-inset flex items-center justify-center ${iconColors[tone]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  return content;
};

export default StatCard;
