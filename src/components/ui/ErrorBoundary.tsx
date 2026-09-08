import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';
import styles from './ErrorBoundary.module.css';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error in React component tree:', error, errorInfo);
  }

  private handleReload = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles.container}>
          <div className={styles.card} role="alert" aria-live="assertive">
            <div className={styles.iconWrapper}>
              <FiAlertTriangle size={28} />
            </div>

            <h1 className={styles.title}>Something went wrong</h1>
            <p className={styles.description}>
              An unexpected error occurred while loading this page. You can reload the page or return to the home screen.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className={styles.details}>
                <summary className={styles.summary}>Technical error details (development only)</summary>
                <pre className={styles.errorStack}>{this.state.error.toString()}</pre>
              </details>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.reloadBtn}
                onClick={this.handleReload}
              >
                <FiRefreshCw size={16} />
                <span>Reload Page</span>
              </button>
              <button
                type="button"
                className={styles.homeBtn}
                onClick={this.handleGoHome}
              >
                <FiHome size={16} />
                <span>Return Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
