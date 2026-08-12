const features = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3z" />
        <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
      </svg>
    ),
    title: 'Manage fees effortlessly',
    text: 'Create invoices, track payments and generate official receipts in seconds.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10h18M7 15h3m-6 4h16a1 1 0 001-1V6a1 1 0 00-1-1H3a1 1 0 00-1 1v12a1 1 0 001 1z" />
      </svg>
    ),
    title: 'Pay online securely',
    text: 'Parents pay with eSewa, Khalti, FonePay or bank transfer — fully integrated.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Real-time reports',
    text: 'Dashboards with live collection, pending and overdue fee insights.',
  },
];

const BrandPanel = () => (
  <div className="relative hidden lg:flex flex-col justify-between p-12 xl:p-16 overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-violet-800 text-white">
    {/* Decorative blobs */}
    <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-violet-500/30 blur-3xl" />
    <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-brand-500/25 blur-3xl" />
    <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-fuchsia-400/20 blur-2xl" />

    <div className="relative">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/25 flex items-center justify-center">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3z" />
            <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" opacity="0.6" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-bold font-display tracking-tight">Shulkaa Suvidha</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-brand-200">Fee Management System</p>
        </div>
      </div>
    </div>

    <div className="relative my-12">
      <h2 className="text-4xl xl:text-[2.75rem] font-extrabold font-display leading-[1.15] tracking-tight">
        Digital fees.
        <br />
        Happy parents.
        <br />
        <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
          Zero paperwork.
        </span>
      </h2>
      <p className="mt-4 text-brand-100/80 max-w-md leading-relaxed">
        The complete school &amp; college fee management platform with role-based access and online payment integration.
      </p>
    </div>

    <div className="relative space-y-4">
      {features.map((f) => (
        <div key={f.title} className="flex items-start gap-3.5">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-brand-100">
            {f.icon}
          </div>
          <div>
            <p className="text-sm font-semibold">{f.title}</p>
            <p className="text-sm text-brand-100/70">{f.text}</p>
          </div>
        </div>
      ))}
    </div>

    <p className="relative text-xs text-brand-200/60">© {new Date().getFullYear()} Shulkaa Suvidha. All rights reserved.</p>
  </div>
);

const AuthLayout = ({ children, maxWidth = 'max-w-md' }) => (
  <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
    <BrandPanel />
    <div className="flex items-center justify-center px-4 py-10 sm:px-8 relative">
      {/* Mobile brand mark */}
      <div className="lg:hidden absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/30">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3z" />
            <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" opacity="0.6" />
          </svg>
        </div>
      </div>

      <div className={`w-full ${maxWidth} animate-fade-in-up`}>{children}</div>
    </div>
  </div>
);

export default AuthLayout;
