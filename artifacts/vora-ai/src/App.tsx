import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import LandingPage from "@/pages/LandingPage";
import HomePage from "@/pages/HomePage";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import SharedProject from "@/pages/SharedProject";
import Admin from "@/pages/Admin";
import ContentStudio from "@/pages/ContentStudio";
import Learn from "@/pages/Learn";
import AuthPage from "@/pages/AuthPage";
import PricingPage from "@/pages/PricingPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import RefundPage from "@/pages/RefundPage";
import NotFound from "@/pages/not-found";
import { AIChatBot } from "@/components/AIChatBot";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Switch>
                <Route path="/" component={LandingPage} />
                <Route path="/home" component={HomePage} />
                <Route path="/build" component={Dashboard} />
                <Route path="/auth" component={AuthPage} />
                <Route path="/projects" component={Projects} />
                <Route path="/p/:slug" component={SharedProject} />
                <Route path="/admin" component={Admin} />
                <Route path="/studio" component={ContentStudio} />
                <Route path="/learn" component={Learn} />
                <Route path="/pricing" component={PricingPage} />
                <Route path="/terms" component={TermsPage} />
                <Route path="/privacy" component={PrivacyPage} />
                <Route path="/refund" component={RefundPage} />
                <Route component={NotFound} />
              </Switch>
            </WouterRouter>
            <Toaster />
            <AIChatBot />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
