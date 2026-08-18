import React from 'react';
import styles from './TextArea.module.css';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = '', id, rows = 4, ...props }, ref) => {
    const textareaId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);
    
    return (
      <div className={`${styles.container} ${className}`}>
        {label && (
          <label htmlFor={textareaId} className={styles.label}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={`${styles.textarea} ${error ? styles.errorTextarea : ''}`}
          {...props}
        />
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    );
  }
);
TextArea.displayName = 'TextArea';
