import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'warning' | 'success' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  as?: 'button' | 'label';
  htmlFor?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent-blue hover:bg-accent-blue/80 text-white',
  secondary: 'bg-surface-element hover:bg-surface-element-hover text-text-secondary',
  warning: 'bg-accent-orange/20 hover:bg-accent-orange/30 text-accent-orange',
  success: 'bg-accent-green/20 hover:bg-accent-green/30 text-accent-green',
  danger: 'bg-status-danger-bg/50 hover:bg-status-danger-bg/80 text-status-danger-text',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  as = 'button',
  className,
  ...props
}) => {
  const baseClasses =
    'flex items-center justify-center gap-2 h-10 px-4 rounded-button text-sm font-medium transition-colors duration-200 disabled:bg-surface-element disabled:text-text-tertiary disabled:cursor-not-allowed';

  const classes = `${baseClasses} ${variantClasses[variant]} ${className || ''}`;

  if (as === 'label') {
    return (
      <label className={classes} {...(props as unknown as React.LabelHTMLAttributes<HTMLLabelElement>)}>
        {children}
      </label>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};
