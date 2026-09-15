import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`celestial-card group relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 dark:backdrop-blur-xl sm:p-6 ${className}`}
    >
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}

export function PageHeader({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: ReactNode }) {
  return (
    <div className="celestial-page-header mb-7">
      <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-50">
        {icon && (
          <span className="celestial-icon-shell flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-indigo-100 dark:ring-white/10">
            {icon}
          </span>
        )}
        <span className="celestial-gradient-text">{title}</span>
      </h1>
      {subtitle && <p className="mt-2 text-gray-600 dark:text-gray-400">{subtitle}</p>}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  type = 'button',
  className = '',
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
  title?: string;
}) {
  const variants: Record<string, string> = {
    primary:
      'celestial-primary-button bg-indigo-600 text-white disabled:bg-indigo-300 dark:disabled:opacity-40 dark:disabled:hover:shadow-none',
    secondary:
      'bg-gray-200 text-gray-800 hover:bg-gray-300 ' +
      'dark:bg-white/5 dark:text-gray-100 dark:border dark:border-white/10 dark:hover:bg-white/10 dark:hover:border-white/20',
    danger:
      'bg-red-600 text-white hover:bg-red-500 disabled:bg-red-300 ' +
      'dark:bg-linear-to-r dark:from-rose-500 dark:to-orange-500 dark:hover:shadow-[0_0_30px_-6px_rgba(244,63,94,0.6)]',
    ghost:
      'text-gray-600 hover:bg-gray-100 ' +
      'dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed active:scale-[0.98] ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{children}</label>;
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props;
  return (
    <input
      {...rest}
      className={`celestial-control w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-all duration-150 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-emerald-300/60 dark:focus:ring-2 dark:focus:ring-sky-400/35 dark:disabled:bg-white/[0.02] ${className}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', children, ...rest } = props;
  return (
    <select
      {...rest}
      className={`celestial-control w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-all duration-150 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-gray-100 dark:focus:border-emerald-300/60 dark:focus:ring-2 dark:focus:ring-sky-400/35 ${className}`}
    >
      {children}
    </select>
  );
}

export function ItemIcon({ src, alt, size = 24 }: { src?: string; alt: string; size?: number }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="shrink-0 rounded-md ring-1 ring-black/5 transition-transform duration-150 group-hover:scale-105 dark:ring-white/10"
      style={{ width: size, height: size }}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'warning' | 'danger' }) {
  const tones: Record<string, string> = {
    neutral:
      'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300 dark:ring-1 dark:ring-white/10',
    warning:
      'bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-1 dark:ring-amber-400/20',
    danger: 'bg-red-100 text-red-800 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-1 dark:ring-rose-400/20',
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}
