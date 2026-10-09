import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { EliteMark } from "@/components/enem/Brand";
import { BookOpen, BrainCircuit, CalendarDays, FileText, LayoutDashboard, LogOut, Menu, PenLine, Search, Settings, ShieldCheck, Target, X } from "lucide-react";
import { useState, type ReactNode } from "react";

const links = [
  { key: "inicio", label: "Visão geral", icon: LayoutDashboard },
  { key: "plano", label: "Plano de 31 dias", icon: CalendarDays },
  { key: "questoes", label: "Questões", icon: Target },
  { key: "revisoes", label: "Revisões", icon: BrainCircuit },
  { key: "redacao", label: "Redação", icon: PenLine },
  { key: "simulados", label: "Simulados", icon: FileText },
  { key: "biblioteca", label: "Biblioteca", icon: BookOpen },
  { key: "tutor", label: "Tutor", icon: Search },
];

export function StudentShell({ section, onNavigate, children }: { section: string; onNavigate: (section: string) => void; children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) return <div className="app-loading"><span className="orbital-loader" />Preparando seu ambiente de estudo...</div>;
  if (!user) {
    return (
      <main className="auth-gate">
        <div className="surface-panel max-w-lg text-center">
          <div className="mx-auto mb-6 w-fit"><EliteMark /></div>
          <p className="eyebrow justify-center">Área do estudante</p>
          <h1 className="mt-3 text-3xl font-bold text-white">Entre para organizar sua rota.</h1>
          <p className="mt-4 leading-7 text-slate-400">O ENEM ELITE usa a autenticação segura disponível neste ambiente. Sua sessão é protegida no servidor.</p>
          <button className="btn-primary mt-8 w-full" onClick={() => startLogin()}>Entrar com conta Manus</button>
          <a className="mt-5 inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200" href="/cadastro">Como criar ou acessar minha conta</a>
        </div>
      </main>
    );
  }

  const navigate = (key: string) => { onNavigate(key); setMenuOpen(false); };
  return (
    <div className="student-shell">
      <aside className={`student-sidebar ${menuOpen ? "open" : ""}`} aria-label="Navegação do estudante">
        <div className="flex items-center justify-between px-5 py-6"><EliteMark /><button className="icon-button lg:hidden" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}><X /></button></div>
        <div className="px-4"><p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Sua preparação</p>
          <nav className="space-y-1">{links.map(link => { const Icon = link.icon; return <button key={link.key} onClick={() => navigate(link.key)} className={`student-nav ${section === link.key ? "active" : ""}`}><Icon /><span>{link.label}</span></button>; })}</nav>
        </div>
        {user.role === "admin" ? <div className="mx-4 mt-5 border-t border-white/8 pt-5"><button className="student-nav" onClick={() => { window.location.href = "/admin"; }}><ShieldCheck /><span>Administração</span></button></div> : null}
        <div className="mt-auto border-t border-white/8 p-4">
          <button className="student-nav mb-2" onClick={() => navigate("perfil")}><Settings /><span>Perfil e dados</span></button>
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/[0.035] p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{user.name || "Estudante"}</p><p className="truncate text-xs text-slate-500">{user.email || "Conta autenticada"}</p></div><button className="icon-button" aria-label="Sair" onClick={() => logout()}><LogOut className="h-4 w-4" /></button></div>
        </div>
      </aside>
      {menuOpen ? <button aria-label="Fechar navegação" className="sidebar-backdrop" onClick={() => setMenuOpen(false)} /> : null}
      <main className="student-main">
        <header className="student-topbar"><button className="icon-button lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu /></button><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">ENEM ELITE</p><p className="text-sm text-slate-400">Sua preparação, no seu ritmo.</p></div><button className="top-search" onClick={() => navigate("tutor")}><Search className="h-4 w-4" /><span>Pergunte ao tutor</span></button></header>
        <div className="student-content">{children}</div>
      </main>
    </div>
  );
}
