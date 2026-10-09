import { EliteMark, Metric, Pill, SectionTitle } from "@/components/enem/Brand";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowLeft, BookOpen, FileText, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const adminLinks = ["visao-geral", "usuarios", "questoes", "conteudos", "videos", "disciplinas", "temas", "simulados", "redacoes", "relatorios", "configuracoes", "auditoria"];

export default function Admin() {
  const { user, loading } = useAuth();
  const [location, navigate] = useLocation();
  const section = location.split("/")[2] || "visao-geral";
  if (loading) return <div className="app-loading"><span className="orbital-loader" />Verificando permissões...</div>;
  if (!user || user.role !== "admin") return <main className="auth-gate"><div className="surface-panel max-w-lg text-center"><ShieldCheck className="mx-auto h-9 w-9 text-amber-300" /><h1 className="mt-5 text-2xl font-bold text-white">Área restrita</h1><p className="mt-3 text-slate-400">A administração exige um papel autorizado no banco de dados. Alterações no perfil do navegador não concedem acesso.</p><a href="/app" className="btn-primary mt-6">Voltar ao painel</a></div></main>;
  return <div className="admin-shell"><aside className="admin-sidebar"><a href="/admin"><EliteMark /></a><p className="mt-10 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Administração</p><nav>{adminLinks.map(item => <button key={item} className={section === item ? "active" : ""} onClick={() => navigate(item === "visao-geral" ? "/admin" : `/admin/${item}`)}>{item.replace("-", " ")}</button>)}</nav><a className="admin-back" href="/app"><ArrowLeft />Área do estudante</a></aside><main className="admin-content"><header><div><p className="eyebrow">Área administrativa</p><h1>{section.replace("-", " ")}</h1></div><Pill tone="amber">Acesso autorizado</Pill></header><AdminContent section={section} /></main></div>;
}

function AdminContent({ section }: { section: string }) {
  const utils = trpc.useUtils();
  const summary = trpc.admin.summary.useQuery();
  const users = trpc.admin.users.useQuery(undefined, { enabled: section === "usuarios" });
  const catalog = trpc.catalog.bootstrap.useQuery();
  const updateUser = trpc.admin.updateUser.useMutation({ onSuccess: () => users.refetch() });
  const createContent = trpc.admin.createContent.useMutation({ onSuccess: () => utils.admin.summary.invalidate() });
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [disciplineId, setDisciplineId] = useState<number>();
  if (section === "usuarios") return <section className="surface-panel overflow-x-auto"><SectionTitle eyebrow="Usuários autorizados" title="Papéis e situação de acesso" description="Ações são registradas em auditoria. Uma administração não pode alterar seu próprio papel por esta tela." /><table className="admin-table mt-7"><thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Situação</th><th>Ação</th></tr></thead><tbody>{users.data?.map((row: any) => <tr key={row.user.id}><td>{row.user.name || "—"}</td><td>{row.user.email || "—"}</td><td><Pill tone={row.user.role === "admin" ? "violet" : "slate"}>{row.user.role}</Pill></td><td><Pill tone={row.user.status === "active" ? "green" : "amber"}>{row.user.status}</Pill></td><td><button disabled={updateUser.isPending} className="table-action" onClick={() => updateUser.mutate({ userId: row.user.id, status: row.user.status === "active" ? "suspended" : "active" })}>{row.user.status === "active" ? "Suspender" : "Reativar"}</button></td></tr>)}</tbody></table></section>;
  if (section === "conteudos") return <section className="surface-panel"><SectionTitle eyebrow="Curadoria editorial" title="Cadastrar conteúdo em rascunho" description="A publicação editorial exige revisão. O conteúdo novo nasce como rascunho e a ação fica auditada." /><div className="form-grid mt-7"><label>Disciplina<select value={disciplineId || ""} onChange={e => setDisciplineId(Number(e.target.value))}><option value="">Selecione</option>{catalog.data?.disciplines.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Título<input value={title} onChange={e => setTitle(e.target.value)} /></label></div><label className="mt-5 block">Resumo<textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} /></label><label className="mt-5 block">Conteúdo<textarea className="min-h-48" value={body} onChange={e => setBody(e.target.value)} /></label>{createContent.error ? <p className="form-error">{createContent.error.message}</p> : null}<button className="btn-primary mt-6" disabled={!disciplineId || !title || !excerpt || !body || createContent.isPending} onClick={() => createContent.mutate({ disciplineId: disciplineId!, title, excerpt, body, difficulty: "basic", estimatedMinutes: 15, objectives: ["Objetivo editorial a revisar"], origin: "authorial" })}>Salvar como rascunho</button></section>;
  if (section === "auditoria") return <section className="surface-panel"><SectionTitle eyebrow="Rastreabilidade" title="Ações administrativas recentes" description="Somente ações relevantes são registradas. O log não contém segredos ou senhas." /><div className="mt-6 space-y-3">{summary.data?.audit.map((item: any) => <div className="audit-row" key={item.id}><span>{new Date(item.createdAt).toLocaleString("pt-BR")}</span><strong>{item.action}</strong><p>{item.entityType} {item.entityId ? `#${item.entityId}` : ""}</p></div>)}</div></section>;
  if (section === "configuracoes") return <CalendarSettings />;
  if (section !== "visao-geral") return <section className="surface-panel"><AlertTriangle className="h-7 w-7 text-amber-300" /><h2 className="mt-4 text-xl font-bold text-white">Módulo preparado para a próxima operação editorial.</h2><p className="mt-2 max-w-2xl leading-7 text-slate-400">A rota está protegida e incluída na navegação administrativa. Nesta primeira entrega, as operações persistentes disponíveis são usuários, conteúdo em rascunho, relatórios do painel e auditoria. Questões, vídeos, disciplinas, temas, simulados e redações já têm modelo de dados e serão ampliados pela curadoria autorizada.</p></section>;
  return <section className="space-y-6"><div className="grid gap-4 md:grid-cols-3"><Metric label="Usuários" value={summary.data?.users ?? "—"} detail="contas no banco" icon={<Users />} /><Metric label="Questões" value={summary.data?.questions ?? "—"} detail="itens cadastrados" icon={<FileText />} /><Metric label="Conteúdos" value={summary.data?.contents ?? "—"} detail="itens editoriais" icon={<BookOpen />} /></div><div className="surface-panel"><SectionTitle eyebrow="Operação" title="O painel mostra dados do banco, não projeções." description="Use as rotas ao lado para administrar acessos, cadastrar rascunhos e consultar a trilha de auditoria." /><div className="admin-quick-grid mt-7"><a href="/admin/usuarios"><Users />Gerenciar usuários</a><a href="/admin/conteudos"><BookOpen />Novo conteúdo</a><a href="/admin/auditoria"><LayoutDashboard />Auditoria</a></div></div></section>;
}

function CalendarSettings() {
  const settings = trpc.admin.examSettings.useQuery();
  const utils = trpc.useUtils();
  const [edition, setEdition] = useState("");
  const [examDayOne, setExamDayOne] = useState("");
  const [examDayTwo, setExamDayTwo] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const save = trpc.admin.updateExamSettings.useMutation({ onSuccess: () => { utils.admin.examSettings.invalidate(); utils.study.examSettings.invalidate(); } });
  const current = settings.data;
  useEffect(() => { if (!current) return; setEdition(current.edition); setExamDayOne(current.examDayOne); setExamDayTwo(current.examDayTwo); setSourceUrl(current.sourceUrl); }, [current]);
  return <section className="surface-panel"><SectionTitle eyebrow="Calendário da edição" title="Datas de prova e fonte oficial" description="A rota do estudante consulta esta configuração no servidor. Salvar uma edição não altera tarefas já concluídas; novos cálculos usarão as datas atualizadas." /><div className="form-grid mt-7"><label>Edição<input value={edition} onChange={e => setEdition(e.target.value)} placeholder="ENEM 2026" /></label><label>Primeiro dia<input type="date" value={examDayOne} onChange={e => setExamDayOne(e.target.value)} /></label><label>Segundo dia<input type="date" value={examDayTwo} onChange={e => setExamDayTwo(e.target.value)} /></label><label>Fonte oficial<input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://..." /></label></div>{save.error ? <p className="form-error">{save.error.message}</p> : null}<button className="btn-primary mt-6" disabled={!edition || !examDayOne || !examDayTwo || !sourceUrl || save.isPending} onClick={() => save.mutate({ edition, examDayOne, examDayTwo, sourceUrl })}>Salvar calendário</button></section>;
}
