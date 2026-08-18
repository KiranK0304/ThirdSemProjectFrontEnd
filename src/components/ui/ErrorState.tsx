import React from 'react';
import styles from './ErrorState.module.css';
import { Button } from './Button';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  message = 'Something went wrong', 
  onRetry 
}) => {
  return (
    <div className={styles.errorState}>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className={styles.retryButton}>
          Retry
        </Button>
      )}
    </div>
  );
};
