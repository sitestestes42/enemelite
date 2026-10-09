export const REVIEW_INTERVALS = [1, 3, 7, 14] as const;

export type PlanPhase = "diagnostic" | "consolidation" | "practice" | "revision" | "mock" | "final";

const phaseForDay = (day: number): PlanPhase => {
  if (day === 1) return "diagnostic";
  if (day <= 10) return "consolidation";
  if (day <= 18) return "practice";
  if (day <= 24) return "revision";
  if (day <= 28) return "mock";
  return "final";
};

const phaseLabel: Record<PlanPhase, string> = {
  diagnostic: "Diagnóstico",
  consolidation: "Consolidação",
  practice: "Prática orientada",
  revision: "Revisão estratégica",
  mock: "Simulado e análise",
  final: "Preparação final",
};

export const addDays = (input: Date, days: number) => {
  const value = new Date(input);
  value.setDate(value.getDate() + days);
  return value;
};

export const isoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const calendarDate = (value: string) => new Date(`${value}T12:00:00`);

export function nextStudyDate(from: Date, permittedWeekdays: number[]): Date {
  const safeDays = permittedWeekdays.length ? permittedWeekdays : [0, 1, 2, 3, 4, 5, 6];
  let candidate = new Date(from);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (safeDays.includes(candidate.getDay())) return candidate;
    candidate = addDays(candidate, 1);
  }
  return candidate;
}

export function createThirtyOneDayRoute(input: {
  startDate: Date;
  studyDays: number[];
  availableMinutes: number;
  disciplines: Array<{ id: number; slug: string; name: string; area: string }>;
  difficultSubjects: string[];
}) {
  const orderedDisciplines = [...input.disciplines].sort((left, right) => {
    const leftHard = input.difficultSubjects.includes(left.slug ?? left.name.toLowerCase()) ? -1 : 0;
    const rightHard = input.difficultSubjects.includes(right.slug ?? right.name.toLowerCase()) ? -1 : 0;
    return leftHard - rightHard;
  });

  let cursor = nextStudyDate(input.startDate, input.studyDays);
  return Array.from({ length: 31 }, (_, index) => {
    const dayNumber = index + 1;
    const phase = phaseForDay(dayNumber);
    const discipline = orderedDisciplines[index % Math.max(orderedDisciplines.length, 1)];
    const isMock = phase === "mock";
    const isReview = phase === "revision" || phase === "final";
    const title = isMock
      ? `Dia ${dayNumber} · ${phaseLabel[phase]}`
      : `Dia ${dayNumber} · ${discipline?.name ?? "Estudo dirigido"}`;
    const task = {
      dayNumber,
      phase,
      title,
      disciplineId: isMock ? null : discipline?.id ?? null,
      objective: isMock
        ? "Aplicar estratégias de tempo, marcar dúvidas e analisar os erros antes de seguir."
        : `Construir domínio progressivo em ${discipline?.name ?? "conteúdos prioritários"} com estudo ativo e prática comentada.`,
      didacticSummary: isReview
        ? "Retome erros e conceitos-chave em blocos curtos. Priorize explicação em voz alta e uma nova tentativa."
        : "Leia o resumo, resolva uma questão, explique o raciocínio e registre a dúvida que ainda precisa de revisão.",
      concepts: isMock
        ? ["gestão de tempo", "leitura estratégica", "análise pós-prova"]
        : ["conceito central", "exemplo resolvido", "recuperação ativa"],
      estimatedMinutes: Math.max(30, Math.min(input.availableMinutes, isMock ? input.availableMinutes * 2 : input.availableMinutes)),
      difficulty: dayNumber < 8 ? "basic" : dayNumber < 22 ? "intermediate" : "advanced",
      scheduledFor: isoDate(cursor),
      reviewOfDay: isReview && dayNumber > 3 ? dayNumber - 3 : null,
    } as const;
    cursor = nextStudyDate(addDays(cursor, 1), input.studyDays);
    return task;
  });
}

export function nextReview(intervalDays: number, wasCorrect: boolean) {
  const currentIndex = Math.max(0, REVIEW_INTERVALS.indexOf(intervalDays as (typeof REVIEW_INTERVALS)[number]));
  const interval = wasCorrect
    ? REVIEW_INTERVALS[Math.min(currentIndex + 1, REVIEW_INTERVALS.length - 1)]
    : REVIEW_INTERVALS[0];
  return { interval, due: isoDate(addDays(new Date(), interval)) };
}

export function countWords(value: string) {
  return value.trim() ? value.trim().split(/\s+/u).length : 0;
}

export function estimateLines(value: string) {
  return Math.max(0, Math.ceil(countWords(value) / 8));
}
