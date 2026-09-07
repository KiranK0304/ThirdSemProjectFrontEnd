import React from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import styles from './ConfirmModal.module.css'
import { FiAlertTriangle, FiInfo } from 'react-icons/fi'

export interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title?: string
  description?: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary' | 'warning'
  loading?: boolean
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false,
}) => {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className={styles.container}>
        <div className={`${styles.iconBox} ${styles[variant]}`}>
          {variant === 'danger' || variant === 'warning' ? (
            <FiAlertTriangle size={22} />
          ) : (
            <FiInfo size={22} />
          )}
        </div>
        <div className={styles.body}>
          {typeof description === 'string' ? (
            <p className={styles.description}>{description}</p>
          ) : (
            description
          )}
        </div>
      </div>
      <div className={styles.actions}>
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}
