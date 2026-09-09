import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Layout primitives                                                  */
/* ------------------------------------------------------------------ */

export function Card({ children, className = '', padded = true }: { children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${padded ? 'p-5 sm:p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        {eyebrow && (
          <p className="text-[#C9A84C] text-xs font-semibold tracking-[0.2em] uppercase mb-1">{eyebrow}</p>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0d1b0f]">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Buttons                                                            */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const BTN: Record<ButtonVariant, string> = {
  primary: 'bg-[#0d1b0f] text-white hover:bg-[#1a3320] border border-transparent',
  secondary: 'bg-white text-[#0d1b0f] border border-gray-200 hover:border-gray-300',
  ghost: 'bg-transparent text-gray-500 hover:text-[#0d1b0f] border border-transparent',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
};

export function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...rest
}: {
  children: ReactNode;
  variant?: ButtonVariant;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${BTN[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Feedback / status                                                  */
/* ------------------------------------------------------------------ */

export function Spinner({ className = 'w-6 h-6' }: { className?: string }) {
  return <div className={`${className} border-[3px] border-[#C9A84C] border-t-transparent rounded-full animate-spin`} />;
}

export function Loading({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
      <Spinner />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ icon, title, hint, action }: { icon?: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-gray-300 mb-3">{icon}</div>}
      <p className="font-semibold text-[#0d1b0f]">{title}</p>
      {hint && <p className="text-gray-400 text-sm mt-1 max-w-sm">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: 'default' | 'gold' | 'green' | 'amber';
}) {
  const tones: Record<string, string> = {
    default: 'text-[#0d1b0f]',
    gold: 'text-[#8a6d24]',
    green: 'text-emerald-700',
    amber: 'text-amber-700',
  };
  return (
    <Card className="relative">
      <div className="flex items-start justify-between">
        <p className="text-gray-500 text-sm font-medium">{label}</p>
        {icon && <div className="text-[#C9A84C]">{icon}</div>}
      </div>
      <p className={`text-2xl sm:text-[28px] font-bold mt-3 ${tones[tone]}`}>{value}</p>
      {hint && <p className="text-gray-400 text-xs mt-1">{hint}</p>}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Form fields                                                        */
/* ------------------------------------------------------------------ */

const CONTROL =
  'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent disabled:bg-gray-50';

export function Field({ label, hint, children }: { label?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      {label && <span className="block text-gray-700 text-sm font-semibold mb-1.5">{label}</span>}
      {children}
      {hint && <span className="block text-gray-400 text-xs mt-1">{hint}</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${CONTROL} ${props.className ?? ''}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${CONTROL} ${props.className ?? ''}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${CONTROL} resize-none ${props.className ?? ''}`} />;
}

/* ------------------------------------------------------------------ */
/*  Modal                                                              */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'md' | 'lg';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${size === 'lg' ? 'max-w-2xl' : 'max-w-md'} my-8`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-[#0d1b0f]">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toast (very small, context-free)                                   */
/* ------------------------------------------------------------------ */

export function Toast({ toast }: { toast: { type: 'success' | 'error'; msg: string } | null }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-[60] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium ${
        toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
      }`}
    >
      {toast.msg}
    </div>
  );
}
