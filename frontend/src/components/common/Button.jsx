import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ink focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-blood text-paper hover:bg-blood-hover border border-blood rounded-[2px]',
    secondary: 'bg-transparent text-ink border border-ink hover:bg-ink/5 rounded-[2px]',
    tertiary: 'bg-transparent text-muted hover:text-ink underline underline-offset-4 decoration-rule hover:decoration-ink p-0',
    ghost: 'bg-transparent text-ink hover:bg-black/5 rounded-[2px]',
    danger: 'bg-transparent text-blood border border-blood hover:bg-blood/5 rounded-[2px]',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-xs px-3.5 py-1.5',
    lg: 'text-sm px-4 py-2',
    none: '',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[variant === 'tertiary' ? 'none' : size]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1" />
      )}
      {children}
    </button>
  );
};

export default Button;
