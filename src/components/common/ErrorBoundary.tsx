import { Component, ErrorInfo, ReactNode } from 'react';
import { LegacyMapLink } from './LegacyMapLink';
import { t } from '@/i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle React errors gracefully.
 * Prevents the entire app from crashing when a component fails.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development, could send to error tracking service in production
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-dark-800 rounded-md border border-dark-600 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-danger/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-danger" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            </div>
            
            <h1 className="text-xl font-display font-bold text-white mb-2">
              {t('load_boundary_heading')}
            </h1>

            <p className="text-dark-300 mb-6 text-sm">
              {t('load_boundary_body')}
            </p>

            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-dark-400 cursor-pointer hover:text-dark-200">
                  {t('load_boundary_details_summary')}
                </summary>
                <pre className="mt-2 p-3 bg-dark-900 rounded-lg text-xs text-danger overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 bg-dark-700 hover:bg-dark-600 text-white font-medium rounded-md transition-colors"
              >
                {t('load_boundary_retry')}
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-md transition-colors"
              >
                {t('load_boundary_go_home')}
              </button>
              <LegacyMapLink variant="button" />
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

