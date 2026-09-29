import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-6 text-[#F8FAFC] font-mono">
          <div className="max-w-lg w-full bg-[#111827] border border-red-800/80 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-950/80 border border-red-600 text-red-400 mx-auto shadow-lg animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                Command Center Render Exception
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                A component error was safely caught. The application can be recovered below.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-[#162235] border border-slate-700 rounded-lg text-left text-[11px] text-red-300 overflow-x-auto max-h-36">
                <code>{this.state.error.toString()}</code>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] text-[#0B0F17] font-extrabold text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>RELOAD COMMAND CENTER</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
