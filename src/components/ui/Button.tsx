import React from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, className = '', children, ...props }, ref) => {
    const classNames = [
      styles.button,
      styles[variant],
      styles[size],
      loading || disabled ? styles.disabled : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button ref={ref} disabled={disabled || loading} className={classNames} {...props}>
        {loading ? <span className={styles.spinner} /> : children}
      </button>
    );
  }
);
Button.displayName = 'Button';
