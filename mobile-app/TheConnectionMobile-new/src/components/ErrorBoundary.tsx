/**
 * Error Boundary Component for React Native
 *
 * Catches React component errors and displays a fallback UI
 * Integrates with Sentry for error reporting
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { captureException } from '../lib/sentry';

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
    if (__DEV__) {
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
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.description}>
              We're sorry, but something unexpected happened. The error has been reported
              to our team.
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error:</Text>
                <Text style={styles.errorMessage}>{this.state.error.message}</Text>
                {this.state.errorInfo && (
                  <>
                    <Text style={[styles.errorTitle, styles.stackTitle]}>
                      Component Stack:
                    </Text>
                    <Text style={styles.stackTrace}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  </>
                )}
              </ScrollView>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={this.handleReset}>
                <Text style={styles.buttonText}>Try again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  errorDetails: {
    maxHeight: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 12,
    color: '#dc2626',
    fontFamily: 'monospace',
  },
  stackTitle: {
    marginTop: 12,
  },
  stackTrace: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
