import React from 'react';
import styles from './Tag.module.css';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: 'neutral' | 'amber' | 'success' | 'danger' | 'warning';
}

export const Tag: React.FC<TagProps> = ({ variant, children, className = '', ...props }) => {
  return (
    <span className={`${styles.tag} ${styles[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};
