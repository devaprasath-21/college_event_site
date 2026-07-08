import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#330000', color: '#ffaaaa', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Frontend React Crash</h1>
          <p>The application crashed due to an unhandled exception.</p>
          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#111', borderRadius: '8px' }}>
            <strong>Error:</strong> {this.state.error?.toString()}
          </div>
          {this.state.errorInfo && (
            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#111', borderRadius: '8px', overflowX: 'auto' }}>
              <strong>Component Stack:</strong>
              <pre>{this.state.errorInfo.componentStack}</pre>
            </div>
          )}
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#ffaaaa', color: '#330000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
