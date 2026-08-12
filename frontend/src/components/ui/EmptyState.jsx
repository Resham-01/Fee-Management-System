const EmptyState = ({ icon, title, description, action }) => (
  <div className="px-6 py-12 text-center">
    {icon && (
      <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
        {icon}
      </div>
    )}
    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
    {description && <p className="mt-1.5 max-w-sm mx-auto text-sm text-slate-500">{description}</p>}
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

export default EmptyState;
