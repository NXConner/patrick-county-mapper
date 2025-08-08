import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Hook for logging/reporting
    // eslint-disable-next-line no-console
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div role="alert" className="min-h-screen w-full flex items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full space-y-4 text-center">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Try again, or refresh the page.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm" onClick={this.handleReset}>
                Try again
              </button>
              <button className="px-3 py-2 rounded-md border text-sm" onClick={() => window.location.reload()}>
                Refresh
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-left whitespace-pre-wrap text-xs bg-muted/30 p-3 rounded-md overflow-auto max-h-60">
                {String(this.state.error?.message || this.state.error)}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}