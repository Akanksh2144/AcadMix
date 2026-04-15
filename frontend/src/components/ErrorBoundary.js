import React from 'react';

/**
 * ErrorBoundary — catches uncaught errors in child components.
 * 
 * Prevents a crash in one page from taking down the entire app.
 * Reports errors to Sentry automatically.
 * 
 * Usage:
 *   <ErrorBoundary>
 *     <StudentDashboard />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Report to Sentry
    if (window.Sentry?.captureException) {
      window.Sentry.captureException(error, {
        extra: { componentStack: errorInfo?.componentStack },
      });
    }
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.handleReset,
        });
      }

      // Default fallback
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '420px',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😵</div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
              color: '#1e293b',
            }}>
              Something went wrong
            </h2>
            <p style={{
              color: '#64748b',
              marginBottom: '1.5rem',
              lineHeight: 1.5,
            }}>
              {this.state.error?.message || 'An unexpected error occurred. Our team has been notified.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#334155',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
