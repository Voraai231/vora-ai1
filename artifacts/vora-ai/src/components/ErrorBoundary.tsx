import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, info);
  }

  handleReset = (): void => {
    this.setState({ error: null });
    if (typeof window !== "undefined") window.location.href = "/";
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="min-h-[100dvh] bg-background flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full glass-card p-8 rounded-2xl border border-destructive/40">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Something went sideways.</h1>
            <p className="text-sm text-muted-foreground mb-1 break-words">{this.state.error.message}</p>
            <p className="text-xs text-muted-foreground/70 mb-6">Don't worry — your projects are safe in Firestore.</p>
            <Button
              onClick={this.handleReset}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 shadow-[0_0_20px_rgba(0,255,255,0.3)]"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Reload Vora
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
