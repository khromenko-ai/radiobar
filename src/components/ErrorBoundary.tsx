import React, { Component, ErrorInfo, ReactNode } from 'react';

export interface Props {
  children: ReactNode;
}

export interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Immersive Dinner App:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('immersive_dinner_session');
      localStorage.removeItem('immersive_sessions');
    } catch {
      // Ignore
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#050505] text-[#f5f5f0] flex flex-col items-center justify-center p-6 text-center font-sans">
          <h2 className="text-xl font-serif tracking-widest text-[#f5f5f0] mb-3">
            SYSTEM ERROR
          </h2>
          <p className="text-xs text-[#a0a0a0] max-w-sm mb-6 leading-relaxed font-mono text-left break-all bg-[#111] p-3 rounded border border-[#333]">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-6 py-2.5 rounded-full border border-[#333333] text-xs uppercase tracking-widest text-[#f5f5f0] hover:bg-[#111111] active:scale-95 transition-all cursor-pointer"
          >
            Возобновить вечер
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
