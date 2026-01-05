import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKey?: string | number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component that catches JavaScript errors in child components
 * and displays a fallback UI instead of crashing the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props): void {
    // Reset error state if resetKey changes
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.handleReset();
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-red-500/30 rounded-lg p-6 max-w-lg w-full">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">⚠️</span>
              <h2 className="text-xl font-bold text-red-400">Something went wrong</h2>
            </div>

            <p className="text-gray-300 mb-4">
              An unexpected error occurred. This might be a temporary issue.
            </p>

            {this.state.error && (
              <div className="bg-slate-900/50 rounded p-3 mb-4 overflow-auto max-h-32">
                <code className="text-red-300 text-sm font-mono">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={this.handleReset} variant="primary">
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
              >
                Reload Page
              </Button>
            </div>

            <details className="mt-4 text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-400">
                Technical details
              </summary>
              <pre className="mt-2 bg-slate-900/50 p-2 rounded overflow-auto max-h-48">
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Smaller error boundary for wrapping individual sections/panels
 */
export class PanelErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('Panel error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⚠️</span>
            <span className="text-red-400 font-medium">Panel Error</span>
          </div>
          <p className="text-gray-400 text-sm mb-3">
            This section encountered an error.
          </p>
          <Button onClick={this.handleReset} size="sm" variant="secondary">
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap a component with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <PanelErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </PanelErrorBoundary>
    );
  };
}
