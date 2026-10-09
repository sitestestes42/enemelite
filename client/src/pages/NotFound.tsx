import { EliteMark } from "@/components/enem/Brand";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return <main className="auth-gate"><div className="surface-panel max-w-lg text-center"><div className="mx-auto w-fit"><EliteMark /></div><Compass className="mx-auto mt-7 h-8 w-8 text-cyan-300" /><p className="eyebrow mt-5 justify-center">Rota não encontrada</p><h1 className="mt-3 text-3xl font-bold text-white">Esta página saiu do seu mapa de estudo.</h1><p className="mt-4 leading-7 text-slate-400">Volte ao início para encontrar a rota certa.</p><a className="btn-primary mt-7" href="/"><ArrowLeft />Ir para o início</a></div></main>;
}
