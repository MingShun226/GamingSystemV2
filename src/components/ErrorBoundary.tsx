
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gaming-dark flex items-center justify-center p-4">
          <div className="bg-gray-800/50 rounded-lg p-8 max-w-md w-full text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </div>
            
            <h1 className="text-white text-2xl font-bold mb-4">Something went wrong</h1>
            
            <p className="text-gray-400 mb-6">
              An unexpected error occurred. This has been logged and our team will investigate.
            </p>
            
            {this.state.error && (
              <div className="bg-gray-900/50 rounded p-3 mb-6 text-left">
                <p className="text-red-400 text-sm font-mono break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}
            
            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleRefresh}
                className="bg-gaming-teal hover:bg-gaming-teal/80 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
              
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="text-gray-300 border-gray-600 hover:bg-gray-700"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
