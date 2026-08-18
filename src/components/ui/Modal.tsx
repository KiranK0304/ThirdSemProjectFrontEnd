import React, { useEffect, useRef } from 'react';
import styles from './Modal.module.css';
import { Button } from './Button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, actions }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={styles.modal} 
        ref={modalRef} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          <Button 
            variant="ghost" 
            size="sm" 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </Button>
        </div>
        <div className={styles.content}>
          {children}
        </div>
        {actions && (
          <div className={styles.actions}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
