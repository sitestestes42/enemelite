import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Admin from "@/pages/Admin";
import Legal from "@/pages/Legal";
import Marketing from "@/pages/Marketing";
import Student from "@/pages/Student";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return <Switch>
    <Route path="/" component={() => <Marketing kind="home" />} />
    <Route path="/sobre" component={() => <Marketing kind="sobre" />} />
    <Route path="/metodologia" component={() => <Marketing kind="metodologia" />} />
    <Route path="/disciplinas" component={() => <Marketing kind="disciplinas" />} />
    <Route path="/biblioteca" component={() => <Marketing kind="biblioteca" />} />
    <Route path="/planos" component={() => <Marketing kind="planos" />} />
    <Route path="/login" component={() => <Marketing kind="login" />} />
    <Route path="/cadastro" component={() => <Marketing kind="cadastro" />} />
    <Route path="/recuperar-senha" component={() => <Marketing kind="recuperar" />} />
    <Route path="/redefinir-senha" component={() => <Marketing kind="redefinir" />} />
    <Route path="/privacidade" component={() => <Legal kind="privacy" />} />
    <Route path="/termos" component={() => <Legal kind="terms" />} />
    <Route path="/app" component={Student} />
    <Route path="/app/:section" component={Student} />
    <Route path="/admin" component={Admin} />
    <Route path="/admin/:section" component={Admin} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
