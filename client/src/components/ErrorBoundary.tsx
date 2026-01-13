/**
 * Error Boundary Component
 *
 * Catches React component errors and displays a fallback UI
 * Integrates with Sentry for error reporting
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { captureException } from '../lib/sentry';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

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
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to Sentry
    captureException(error, {
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
    });

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Log to console in development
    if (import.meta.env.MODE === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                We're sorry, but something unexpected happened. The error has been reported
                to our team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {import.meta.env.MODE === 'development' && this.state.error && (
                <div className="bg-gray-100 p-3 rounded text-sm font-mono overflow-auto max-h-40">
                  <p className="text-red-600 font-bold mb-1">Error:</p>
                  <p className="text-red-600">{this.state.error.message}</p>
                  {this.state.errorInfo && (
                    <>
                      <p className="text-red-600 font-bold mt-2 mb-1">Component Stack:</p>
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleReset} className="flex-1">
                  Try again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Reload page
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={() => (window.location.href = '/')}
                className="w-full"
              >
                Go to homepage
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight error boundary for non-critical sections
 * Shows inline error message instead of full-page error
 */
export class InlineErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureException(error, {
      errorInfo: {
        componentStack: errorInfo.componentStack,
        boundaryType: 'inline',
      },
    });

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

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-900">Unable to load this section</p>
              <p className="text-sm text-red-700 mt-1">
                An error occurred. Our team has been notified.
              </p>
              {import.meta.env.MODE === 'development' && this.state.error && (
                <p className="text-xs text-red-600 mt-2 font-mono">
                  {this.state.error.message}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReset}
                className="mt-2"
              >
                Try again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
