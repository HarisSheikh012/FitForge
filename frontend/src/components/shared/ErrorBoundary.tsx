import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <h3 className="font-bold text-slate-800 dark:text-rose-400">Something went wrong</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-500 max-w-sm">
            An error occurred while rendering this component. Please try reloading or check back later.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-xs px-3 py-1.5 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
