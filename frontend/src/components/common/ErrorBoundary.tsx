import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AgroAI ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[500px] w-full flex items-center justify-center p-6 bg-surface">
          <div className="max-w-lg w-full bg-surface-container-lowest border border-error/30 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-5 text-on-surface">
            <div className="flex items-center gap-3 text-error">
              <div className="w-12 h-12 rounded-xl bg-error-container text-on-error-container flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[28px]">warning</span>
              </div>
              <div>
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                  Workspace Error Encountered
                </h2>
                <p className="text-xs text-on-surface-variant">
                  A component error occurred while rendering this view.
                </p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed bg-surface p-3 rounded-lg border border-outline-variant/30">
              The application recovered safely without crashing your entire session. You can retry loading this view or return to the main dashboard.
            </p>

            {this.state.error && (
              <details className="text-xs bg-surface-container/40 p-3 rounded-lg border border-outline-variant/20 group">
                <summary className="font-semibold text-secondary cursor-pointer select-none flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] group-open:rotate-90 transition-transform">
                    chevron_right
                  </span>
                  <span>Technical Diagnostic Details</span>
                </summary>
                <div className="mt-2 text-[11px] font-mono text-error/90 whitespace-pre-wrap break-all overflow-x-auto p-2 bg-black/10 rounded">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack && (
                    <div className="mt-2 text-on-surface-variant font-mono">
                      {this.state.errorInfo.componentStack}
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={this.handleGoHome}
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Return to Dashboard
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Retry Loading</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
