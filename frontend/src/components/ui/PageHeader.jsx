const PageHeader = ({ title, description, actions, icon }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="flex items-start gap-3">
      {icon && (
        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 text-white flex items-center justify-center shadow-sm shadow-brand-600/30">
          {icon}
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
