import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useTheme } from "@/hooks/useTheme";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import SharedProject from "@/pages/SharedProject";
import Admin from "@/pages/Admin";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import UpgradeSuccess from "@/pages/UpgradeSuccess";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ThemeBootstrap() {
  // Touch the hook so the theme class is applied to <html> on every page
  useTheme();
  return null;
}

function App() {
  useEffect(() => {
    // Initial theme class — read straight from localStorage so we don't FOUC.
    try {
      const stored = localStorage.getItem("vora.theme");
      if (stored === "light") document.documentElement.classList.add("light");
    } catch {}
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <ThemeBootstrap />
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/projects" component={Projects} />
                <Route path="/p/:slug" component={SharedProject} />
                <Route path="/admin" component={Admin} />
                <Route path="/privacy" component={Privacy} />
                <Route path="/terms" component={Terms} />
                <Route path="/upgrade-success" component={UpgradeSuccess} />
                <Route component={NotFound} />
              </Switch>
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
