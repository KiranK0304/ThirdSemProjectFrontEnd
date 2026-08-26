import React from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
  loadingText?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, loadingText, disabled, className = '', children, ...props }, ref) => {
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
        {loading ? (
          <>
            <span className={styles.spinner} />
            {loadingText && <span className={styles.loadingText}>{loadingText}</span>}
          </>
        ) : children}
      </button>
    );
  }
);
Button.displayName = 'Button';
