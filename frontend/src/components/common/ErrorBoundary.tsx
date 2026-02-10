/* ErrorBoundary Component - React error boundary for graceful error handling */

import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary Component (T061)
 *
 * Catches React component errors and displays a fallback UI.
 * Prevents entire app from crashing due to component errors.
 */
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Send to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && window.reportError) {
      window.reportError({
        error: error.toString(),
        errorInfo: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-screen bg-red-50">
            <div className="max-w-md p-8 bg-white rounded-lg shadow-lg border border-red-200">
              {/* Error Icon */}
              <div className="flex justify-center mb-4">
                <svg
                  className="w-12 h-12 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 0V7a2 2 0 012-2h2.586a1 1 0 00-.707-1.707h-2.172A2 2 0 0010 2.414V2a2 2 0 00-2 2v1.172A1 1 0 006.707 4.293H4.535a2 2 0 00-2 2v2.172a1 1 0 001.707.707H4a2 2 0 012-2h2v2a2 2 0 00-2 2v2h-2a2 2 0 00-2 2v2.172a1 1 0 001.707.707h2.172a2 2 0 002 2h2v-2a2 2 0 002-2v-2h2a2 2 0 002-2v-2.172a1 1 0 00-1.707-.707H20a2 2 0 00-2-2h-2.172a1 1 0 00.707-1.707H14a2 2 0 00-2-2z"
                  />
                </svg>
              </div>

              {/* Error Title */}
              <h2 className="text-2xl font-bold text-red-800 mb-2 text-center">
                Something went wrong
              </h2>

              {/* Error Message */}
              <p className="text-gray-700 text-center mb-4">
                We're sorry, but something unexpected happened in the application.
              </p>

              {/* Error Details (in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-4 p-4 bg-gray-100 rounded text-sm">
                  <p className="font-mono text-red-600 break-words">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-gray-600 mt-2 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={this.handleReset}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded transition"
                >
                  Refresh Page
                </button>
              </div>

              {/* Support Link */}
              <p className="text-xs text-gray-500 text-center mt-4">
                If this problem persists, please contact support.
              </p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
