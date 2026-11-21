import React from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    console.error('[Clinical ErrorBoundary Caught]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 border border-rule bg-surface rounded-[2px] max-w-2xl mx-auto">
          <div className="flex items-center gap-2 pb-3 border-b border-rule text-blood font-mono text-xs uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            <span>Operational Exception Encountered</span>
          </div>
          <div className="py-4 space-y-2">
            <h3 className="font-serif text-lg text-ink font-semibold">
              This module failed to render
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              An unexpected client runtime exception interrupted the rendering of this ledger view.
              The error has been safely caught to prevent blanking the overall application.
            </p>
            {this.state.error && (
              <pre className="p-3 bg-paper border border-rule font-mono text-[11px] text-ink overflow-x-auto whitespace-pre-wrap rounded-[2px]">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
          <div className="pt-3 border-t border-rule flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blood text-paper text-xs font-medium rounded-[2px] hover:bg-blood-hover transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Component</span>
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-ink text-ink text-xs font-medium rounded-[2px] hover:bg-black/5 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
