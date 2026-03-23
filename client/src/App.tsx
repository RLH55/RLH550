import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";

// Keep-Alive component: pings server every 4 minutes to prevent hibernation
function KeepAlive() {
  const pingQuery = trpc.keepAlive.ping.useQuery(undefined, {
    refetchInterval: 4 * 60 * 1000, // every 4 minutes
    refetchIntervalInBackground: true,
    staleTime: Infinity,
  });
  return null;
}

// Auth Guard: redirects based on user role
function AuthGuard({ children, requiredRole }: { children: React.ReactNode; requiredRole?: "admin" | "user" }) {
  const { data: me, isLoading } = trpc.auth.me.useQuery();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!me) {
      navigate("/");
      return;
    }
    if (requiredRole === "admin" && (me as any).role !== "admin") {
      navigate("/dashboard");
    }
    if (requiredRole === "user" && (me as any).role === "admin") {
      navigate("/admin");
    }
  }, [me, isLoading, requiredRole, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.08 0.025 265)" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: "oklch(0.65 0.20 195 / 0.3)", borderTopColor: "oklch(0.65 0.20 195)" }} />
          <p className="text-sm tracking-widest" style={{ color: "oklch(0.65 0.20 195)", fontFamily: "monospace" }}>
            OMAR HOST...
          </p>
        </div>
      </div>
    );
  }

  if (!me) return null;
  return <>{children}</>;
}

// Home redirect: if logged in, go to dashboard; otherwise show login
function HomeRedirect() {
  const { data: me, isLoading } = trpc.auth.me.useQuery();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (me) {
      if ((me as any).role === "admin") navigate("/admin");
      else navigate("/dashboard");
    }
  }, [me, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-2 rounded-full animate-spin"
          style={{ borderColor: "oklch(0.65 0.20 195 / 0.3)", borderTopColor: "oklch(0.65 0.20 195)" }} />
      </div>
    );
  }

  return <Login />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/login" component={Login} />
      <Route path="/admin">
        <AuthGuard requiredRole="admin">
          <AdminDashboard />
        </AuthGuard>
      </Route>
      <Route path="/dashboard">
        <AuthGuard requiredRole="user">
          <UserDashboard />
        </AuthGuard>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster position="top-right" theme="dark" />
          <KeepAlive />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
