import React from 'react';
import styles from './FormField.module.css';

export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required,
  htmlFor,
  children
}) => {
  return (
    <div className={styles.field}>
      <label htmlFor={htmlFor} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
};
