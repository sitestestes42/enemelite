import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  like,
  or,
  sql,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  aiUsage,
  attempts,
  auditLogs,
  contentItems,
  disciplines,
  errorNotebook,
  examConfigurations,
  essayPrompts,
  essays,
  essayVersions,
  favorites,
  InsertUser,
  mockAnswers,
  mockSessions,
  profiles,
  questionOptions,
  questions,
  searchHistory,
  studyEvents,
  studyPlans,
  studyTasks,
  themes,
  users,
  videos,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import {
  calendarDate,
  countWords,
  createThirtyOneDayRoute,
  estimateLines,
  isoDate,
  nextReview,
  REVIEW_INTERVALS,
} from "./services/learning";
import { isMockSessionExpired, serializeQuestionForStudy } from "./services/questionSafety";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Falha ao criar conexão:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("openId é obrigatório");
  const db = await requireDb();
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  const syncTextField = (field: "name" | "email" | "loginMethod") => {
    if (user[field] === undefined) return;
    values[field] = user[field] ?? null;
    updateSet[field] = user[field] ?? null;
  };
  syncTextField("name");
  syncTextField("email");
  syncTextField("loginMethod");
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

/** Creates only authorial demo material and never overwrites editorial data. */
export async function ensureSeedData() {
  const db = await requireDb();
  const [calendar] = await db.select().from(examConfigurations).limit(1);
  if (!calendar) {
    await db.insert(examConfigurations).values({
      edition: "ENEM 2026",
      examDayOne: "2026-11-08",
      examDayTwo: "2026-11-15",
      sourceUrl: "https://www.gov.br/inep/pt-br/centrais-de-conteudo/noticias/enem/enem-2026-falta-um-mes-para-o-primeiro-dia-de-provas",
    });
  }
  const [existing] = await db.select({ id: disciplines.id }).from(disciplines).limit(1);
  if (existing) return;

  await db.insert(disciplines).values([
    { slug: "linguagens", name: "Linguagens", area: "languages", description: "Leitura, língua portuguesa, literatura, artes e comunicação.", color: "#38BDF8", icon: "Languages" },
    { slug: "redacao", name: "Redação", area: "writing", description: "Argumentação, repertório e proposta de intervenção responsável.", color: "#A78BFA", icon: "PenLine" },
    { slug: "humanas", name: "Ciências Humanas", area: "humanities", description: "História, geografia, filosofia e sociologia em leitura crítica.", color: "#F59E0B", icon: "Landmark" },
    { slug: "natureza", name: "Ciências da Natureza", area: "nature", description: "Biologia, química e física por investigação e resolução de problemas.", color: "#34D399", icon: "Atom" },
    { slug: "matematica", name: "Matemática", area: "mathematics", description: "Modelagem, proporções, estatística, geometria e estratégias de cálculo.", color: "#22D3EE", icon: "Sigma" },
  ]);

  const allDisciplines = await db.select().from(disciplines);
  const disciplineBySlug = new Map(allDisciplines.map(item => [item.slug, item]));
  const getDiscipline = (slug: string) => {
    const item = disciplineBySlug.get(slug);
    if (!item) throw new Error(`Disciplina não encontrada: ${slug}`);
    return item;
  };

  await db.insert(themes).values([
    { disciplineId: getDiscipline("linguagens").id, slug: "leitura-argumentacao", name: "Leitura e argumentação", description: "Relações entre tese, ponto de vista, escolha lexical e efeito de sentido.", skillCode: "LC-07" },
    { disciplineId: getDiscipline("redacao").id, slug: "proposta-intervencao", name: "Projeto de texto e intervenção", description: "Organização do ponto de vista e detalhamento de uma ação socialmente responsável.", skillCode: "RED-05" },
    { disciplineId: getDiscipline("humanas").id, slug: "cidadania-participacao", name: "Cidadania e participação", description: "Leitura de processos históricos e participação social em diferentes escalas.", skillCode: "CH-15" },
    { disciplineId: getDiscipline("natureza").id, slug: "ecologia-fluxos", name: "Ecologia e fluxos de matéria", description: "Relações ecológicas, cadeias alimentares e ciclos biogeoquímicos.", skillCode: "CN-08" },
    { disciplineId: getDiscipline("matematica").id, slug: "porcentagem-modelagem", name: "Porcentagem e modelagem", description: "Razões, percentuais e leitura crítica de situações quantitativas.", skillCode: "MT-03" },
  ]);

  const allThemes = await db.select().from(themes);
  const themeBySlug = new Map(allThemes.map(item => [item.slug, item]));
  const getTheme = (slug: string) => {
    const item = themeBySlug.get(slug);
    if (!item) throw new Error(`Tema não encontrado: ${slug}`);
    return item;
  };
  const inepMatrix = "https://www.gov.br/inep/pt-br/centrais-de-conteudo/acervo-linha-editorial/publicacoes-institucionais/avaliacoes-e-exames-da-educacao-basica/matrizes-de-referencia-enem";
  const inepDocuments = "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/outros-documentos";

  await db.insert(contentItems).values([
    {
      disciplineId: getDiscipline("matematica").id, themeId: getTheme("porcentagem-modelagem").id, slug: "porcentagem-com-sentido", title: "Porcentagem com sentido: antes de calcular, modele", excerpt: "Um roteiro autoral para identificar a grandeza de referência antes de aplicar taxas e descontos.", body: "## Ideia central\nPorcentagem não é apenas uma conta: é uma razão em relação a uma base. Antes de multiplicar, pergunte: **qual quantidade representa 100%?**\n\n## Exemplo resolvido\nUma inscrição custa R$ 120 e recebe desconto de 15%. A base é 120. O desconto é 0,15 × 120 = 18. O valor final é 120 − 18 = 102.\n\n## Recuperação ativa\nExplique, sem olhar, por que dois descontos sucessivos de 10% não equivalem a 20% sobre o preço inicial.", difficulty: "basic", estimatedMinutes: 18, objectives: ["identificar a base percentual", "modelar aumento e desconto", "explicar o cálculo em linguagem natural"], references: [{ label: "Matriz de Referência do Enem", url: inepMatrix }], origin: "authorial", reviewStatus: "published" },
    {
      disciplineId: getDiscipline("natureza").id, themeId: getTheme("ecologia-fluxos").id, slug: "cadeias-alimentares-energia", title: "Cadeias alimentares: matéria circula, energia se transforma", excerpt: "Resumo autoral para relacionar níveis tróficos, decomposição e perda de energia.", body: "## Ideia central\nProdutores capturam energia; consumidores a transferem; decompositores devolvem matéria ao ambiente. Em cada transferência, parte da energia é dissipada, o que ajuda a explicar pirâmides de energia.\n\n## Exemplo resolvido\nSe a população de decompositores é reduzida, restos orgânicos podem se acumular e nutrientes retornam mais lentamente ao solo.\n\n## Recuperação ativa\nDesenhe uma teia alimentar simples e indique onde a matéria pode retornar ao ambiente.", difficulty: "intermediate", estimatedMinutes: 20, objectives: ["distinguir fluxo de energia e ciclagem de matéria", "interpretar relações ecológicas", "conectar decomposição e nutrientes"], references: [{ label: "Matriz de Referência do Enem", url: inepMatrix }], origin: "authorial", reviewStatus: "published" },
    {
      disciplineId: getDiscipline("redacao").id, themeId: getTheme("proposta-intervencao").id, slug: "intervencao-com-detalhamento", title: "Proposta de intervenção: ação, agente e detalhamento", excerpt: "Guia autoral para transformar uma intenção genérica em proposta verificável no texto dissertativo-argumentativo.", body: "## Ideia central\nUma proposta consistente descreve **quem** atua, **o que** fará, **como** fará, **para quê** e, quando couber, um detalhamento que viabilize a ação.\n\n## Exemplo\nEm vez de escrever apenas “o governo deve conscientizar”, especifique um órgão, uma medida, um meio de execução e a finalidade.\n\n## Cuidado\nO texto de treino não substitui os critérios oficiais. Consulte a cartilha do participante para estudar as competências da redação.", difficulty: "basic", estimatedMinutes: 16, objectives: ["detalhar uma intervenção", "manter respeito aos direitos humanos", "revisar a coerência entre diagnóstico e ação"], references: [{ label: "Documentos oficiais do Enem", url: inepDocuments }], origin: "authorial", reviewStatus: "published" },
    {
      disciplineId: getDiscipline("humanas").id, themeId: getTheme("cidadania-participacao").id, slug: "fonte-historica-ponto-vista", title: "Fonte histórica: contexto, autoria e ponto de vista", excerpt: "Leitura autoral para analisar documentos sem tratá-los como retratos neutros do passado.", body: "## Ideia central\nUma fonte é produzida em uma situação. Ao analisá-la, observe autoria, destinatário, linguagem, interesses e silêncios.\n\n## Método rápido\n1. Localize tempo e lugar. 2. Identifique quem fala. 3. Relacione a escolha de linguagem ao contexto. 4. Compare com o que a questão pergunta.\n\n## Recuperação ativa\nAo ler uma charge, descreva a crítica antes de escolher uma alternativa.", difficulty: "intermediate", estimatedMinutes: 18, objectives: ["contextualizar fontes", "identificar ponto de vista", "responder com base em evidência textual"], references: [{ label: "Matriz de Referência do Enem", url: inepMatrix }], origin: "authorial", reviewStatus: "published" },
  ]);

  // Links foram acessados durante a curadoria, mas permanecem pendentes para nova checagem editorial antes de recomendação automática.
  await db.insert(videos).values([
    { disciplineId: getDiscipline("matematica").id, themeId: getTheme("porcentagem-modelagem").id, title: "Aulão de matemática para o Enem e vestibulares", url: "https://www.youtube.com/watch?v=MSZdhDBoXe0", channel: "Curso Enem Gratuito", description: "Aulão público com capítulos de porcentagem, tabelas, funções, probabilidade e área. Revalidar disponibilidade antes de atribuir ao plano.", durationSeconds: 4971, source: "YouTube / Curso Enem Gratuito", availability: "pending" },
    { disciplineId: getDiscipline("natureza").id, themeId: getTheme("ecologia-fluxos").id, title: "Aulão de biologia para o Enem: temas de revisão", url: "https://www.youtube.com/watch?v=LH9vrmh-5Q0", channel: "Curso Enem Gratuito", description: "Aula pública de revisão com ecologia, ciclos, citologia, genética e evolução. Revalidar disponibilidade antes de atribuir ao plano.", durationSeconds: 4216, source: "YouTube / Curso Enem Gratuito", availability: "pending" },
  ]);

  const questionSeed: Array<{ disciplineSlug: string; themeSlug: string; stem: string; explanation: string; options: Array<{ key: string; text: string; correct: boolean }> }> = [
    { disciplineSlug: "matematica", themeSlug: "porcentagem-modelagem", stem: "Uma taxa mensal de R$ 200 recebeu desconto de 15%. Qual é o valor final da taxa?", explanation: "O desconto é 15% de 200, isto é, R$ 30. Portanto, 200 − 30 = R$ 170.", options: [{ key: "A", text: "R$ 150", correct: false }, { key: "B", text: "R$ 170", correct: true }, { key: "C", text: "R$ 185", correct: false }, { key: "D", text: "R$ 230", correct: false }] },
    { disciplineSlug: "natureza", themeSlug: "ecologia-fluxos", stem: "Em uma área florestal, a redução de decompositores tende a afetar principalmente qual processo?", explanation: "Decompositores participam da decomposição e da devolução de nutrientes ao ambiente. Menos decompositores pode reduzir a ciclagem de matéria.", options: [{ key: "A", text: "A entrada de luz solar no ecossistema", correct: false }, { key: "B", text: "A ciclagem de nutrientes da matéria orgânica", correct: true }, { key: "C", text: "A produção de gás oxigênio por rochas", correct: false }, { key: "D", text: "A rotação terrestre", correct: false }] },
    { disciplineSlug: "humanas", themeSlug: "cidadania-participacao", stem: "Ao analisar uma fonte histórica, o procedimento mais adequado é", explanation: "Uma fonte deve ser relacionada à autoria, ao contexto e à finalidade, pois escolhas de linguagem expressam um ponto de vista.", options: [{ key: "A", text: "considerá-la neutra por ter sido escrita no passado", correct: false }, { key: "B", text: "ignorar autoria e destinatário", correct: false }, { key: "C", text: "relacionar autoria, contexto e finalidade", correct: true }, { key: "D", text: "usar somente informações externas ao documento", correct: false }] },
    { disciplineSlug: "linguagens", themeSlug: "leitura-argumentacao", stem: "Em um texto argumentativo, conectivos como “portanto” e “porém” ajudam o leitor porque", explanation: "Eles explicitam relações lógicas entre ideias, como conclusão, contraste ou consequência, contribuindo para a coesão textual.", options: [{ key: "A", text: "substituem a necessidade de uma tese", correct: false }, { key: "B", text: "marcam relações entre as ideias", correct: true }, { key: "C", text: "eliminam a necessidade de exemplos", correct: false }, { key: "D", text: "transformam o texto em narrativa", correct: false }] },
    { disciplineSlug: "redacao", themeSlug: "proposta-intervencao", stem: "Em uma proposta de intervenção de treino, qual elemento torna a ação mais concreta?", explanation: "O detalhamento indica meio, responsável, finalidade ou execução, evitando uma recomendação vaga e desconectada do problema discutido.", options: [{ key: "A", text: "Repetir a tese com outras palavras", correct: false }, { key: "B", text: "Indicar agente, ação e meio de execução", correct: true }, { key: "C", text: "Usar uma citação sem explicar", correct: false }, { key: "D", text: "Evitar qualquer finalidade", correct: false }] },
  ];

  for (const item of questionSeed) {
    const [created] = await db.insert(questions).values({
      disciplineId: getDiscipline(item.disciplineSlug).id,
      themeId: getTheme(item.themeSlug).id,
      stem: item.stem,
      explanation: item.explanation,
      incorrectExplanations: {},
      difficulty: "basic",
      source: "ENEM ELITE · demonstração autoral",
      questionType: "multiple_choice",
      origin: "authorial",
      reviewStatus: "published",
    });
    const questionId = Number(created.insertId);
    await db.insert(questionOptions).values(item.options.map(option => ({ questionId, optionKey: option.key, text: option.text, isCorrect: option.correct })));
  }

  await db.insert(essayPrompts).values({
    title: "Uso crítico de ferramentas digitais no ambiente escolar",
    briefing: "Elabore um texto dissertativo-argumentativo de treino sobre caminhos para promover o uso crítico de ferramentas digitais no ambiente escolar brasileiro.",
    collection: "Coletânea autoral de demonstração: considere desafios de acesso, formação docente, privacidade e participação estudantil. Esta proposta não é tema oficial do Enem.",
    source: "ENEM ELITE · proposta autoral de demonstração",
    origin: "authorial",
    active: true,
  });
}

export async function getPublicCatalog() {
  await ensureSeedData();
  const db = await requireDb();
  const [disciplineRows, contentRows, videoRows, questionCount] = await Promise.all([
    db.select().from(disciplines).where(eq(disciplines.isActive, true)),
    db.select({ content: contentItems, discipline: disciplines, theme: themes }).from(contentItems).innerJoin(disciplines, eq(contentItems.disciplineId, disciplines.id)).leftJoin(themes, eq(contentItems.themeId, themes.id)).where(eq(contentItems.reviewStatus, "published")).orderBy(desc(contentItems.updatedAt)),
    db.select({ video: videos, discipline: disciplines, theme: themes }).from(videos).innerJoin(disciplines, eq(videos.disciplineId, disciplines.id)).leftJoin(themes, eq(videos.themeId, themes.id)).orderBy(desc(videos.createdAt)),
    db.select({ value: count() }).from(questions).where(eq(questions.reviewStatus, "published")),
  ]);
  return { disciplines: disciplineRows, contents: contentRows, videos: videoRows, questionCount: Number(questionCount[0]?.value ?? 0) };
}

export async function getExamConfiguration() {
  await ensureSeedData();
  const db = await requireDb();
  const [calendar] = await db.select().from(examConfigurations).orderBy(desc(examConfigurations.updatedAt)).limit(1);
  if (!calendar) throw new Error("Calendário do Enem indisponível");
  return calendar;
}

export async function updateExamConfiguration(input: { actorUserId: number; edition: string; examDayOne: string; examDayTwo: string; sourceUrl: string }) {
  if (input.examDayOne >= input.examDayTwo) throw new Error("O segundo dia de prova deve ocorrer depois do primeiro");
  const db = await requireDb();
  const [current] = await db.select().from(examConfigurations).orderBy(desc(examConfigurations.updatedAt)).limit(1);
  if (current) {
    await db.update(examConfigurations).set({ edition: input.edition, examDayOne: input.examDayOne, examDayTwo: input.examDayTwo, sourceUrl: input.sourceUrl, updatedByUserId: input.actorUserId }).where(eq(examConfigurations.id, current.id));
  } else {
    await db.insert(examConfigurations).values({ edition: input.edition, examDayOne: input.examDayOne, examDayTwo: input.examDayTwo, sourceUrl: input.sourceUrl, updatedByUserId: input.actorUserId });
  }
  await logAudit(input.actorUserId, "exam_calendar.updated", "examConfiguration", current ? String(current.id) : undefined, { edition: input.edition, examDayOne: input.examDayOne, examDayTwo: input.examDayTwo });
  return getExamConfiguration();
}

export async function createStudyPlan(input: {
  userId: number;
  startDate: string;
  availableMinutesPerDay: number;
  studyDays: number[];
  difficultSubjects: string[];
}) {
  await ensureSeedData();
  const db = await requireDb();
  const [calendar] = await db.select().from(examConfigurations).orderBy(desc(examConfigurations.updatedAt)).limit(1);
  if (!calendar) throw new Error("Calendário do Enem ainda não foi configurado");
  await db.insert(profiles).values({ userId: input.userId, availableMinutesPerDay: input.availableMinutesPerDay, studyDays: input.studyDays, difficultSubjects: input.difficultSubjects, onboardingComplete: true }).onDuplicateKeyUpdate({ set: { availableMinutesPerDay: input.availableMinutesPerDay, studyDays: input.studyDays, difficultSubjects: input.difficultSubjects, onboardingComplete: true } });
  const [activePlan] = await db.select().from(studyPlans).where(and(eq(studyPlans.userId, input.userId), eq(studyPlans.status, "active"))).orderBy(desc(studyPlans.createdAt)).limit(1);
  let planId: number;
  if (activePlan) {
    planId = activePlan.id;
    await db.update(studyPlans).set({ startDate: input.startDate, examDayOne: calendar.examDayOne, examDayTwo: calendar.examDayTwo, availableMinutesPerDay: input.availableMinutesPerDay, studyDays: input.studyDays, difficultSubjects: input.difficultSubjects }).where(eq(studyPlans.id, planId));
  } else {
    const [created] = await db.insert(studyPlans).values({ userId: input.userId, startDate: input.startDate, examDayOne: calendar.examDayOne, examDayTwo: calendar.examDayTwo, availableMinutesPerDay: input.availableMinutesPerDay, studyDays: input.studyDays, difficultSubjects: input.difficultSubjects, status: "active" });
    planId = Number(created.insertId);
  }
  const availableDisciplines = await db.select().from(disciplines).where(eq(disciplines.isActive, true));
  const route = createThirtyOneDayRoute({ startDate: calendarDate(input.startDate), studyDays: input.studyDays, availableMinutes: input.availableMinutesPerDay, disciplines: availableDisciplines, difficultSubjects: input.difficultSubjects });
  const previousTasks = activePlan ? await db.select().from(studyTasks).where(eq(studyTasks.planId, planId)) : [];
  const previousByDay = new Map(previousTasks.map(task => [task.dayNumber, task]));
  for (const task of route) {
    const previous = previousByDay.get(task.dayNumber);
    if (!previous) {
      await db.insert(studyTasks).values({ ...task, planId, contentId: null, status: "todo" });
      continue;
    }
    if (previous.status === "done") continue;
    await db.update(studyTasks).set({ disciplineId: task.disciplineId, contentId: null, phase: task.phase, title: task.title, objective: task.objective, didacticSummary: task.didacticSummary, concepts: task.concepts, estimatedMinutes: task.estimatedMinutes, difficulty: task.difficulty, scheduledFor: task.scheduledFor, reviewOfDay: task.reviewOfDay, status: "todo", completedAt: null }).where(eq(studyTasks.id, previous.id));
  }
  await logAudit(input.userId, activePlan ? "study_plan.recalculated" : "study_plan.created", "studyPlan", String(planId), { days: 31, availableMinutesPerDay: input.availableMinutesPerDay });
  return { planId, taskCount: route.length, recalculated: Boolean(activePlan) };
}

export async function getStudentDashboard(userId: number) {
  await ensureSeedData();
  const db = await requireDb();
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  const [plan] = await db.select().from(studyPlans).where(and(eq(studyPlans.userId, userId), eq(studyPlans.status, "active"))).orderBy(desc(studyPlans.createdAt)).limit(1);
  const today = isoDate(new Date());
  const [tasks, reviewRows, attemptRows, essayRows, mockRows, eventRows] = await Promise.all([
    plan ? db.select({ task: studyTasks, discipline: disciplines }).from(studyTasks).leftJoin(disciplines, eq(studyTasks.disciplineId, disciplines.id)).where(eq(studyTasks.planId, plan.id)).orderBy(studyTasks.dayNumber) : Promise.resolve([]),
    db.select({ item: errorNotebook, question: questions, discipline: disciplines }).from(errorNotebook).innerJoin(questions, eq(errorNotebook.questionId, questions.id)).innerJoin(disciplines, eq(questions.disciplineId, disciplines.id)).where(and(eq(errorNotebook.userId, userId), sql`${errorNotebook.nextReviewAt} <= ${today}`, sql`${errorNotebook.resolvedAt} is null`)).orderBy(errorNotebook.nextReviewAt),
    db.select({ attempt: attempts, discipline: disciplines }).from(attempts).innerJoin(questions, eq(attempts.questionId, questions.id)).innerJoin(disciplines, eq(questions.disciplineId, disciplines.id)).where(eq(attempts.userId, userId)),
    db.select().from(essays).where(eq(essays.userId, userId)).orderBy(desc(essays.updatedAt)).limit(5),
    db.select().from(mockSessions).where(eq(mockSessions.userId, userId)).orderBy(desc(mockSessions.startedAt)).limit(5),
    db.select().from(studyEvents).where(eq(studyEvents.userId, userId)).orderBy(desc(studyEvents.createdAt)).limit(30),
  ]);
  const completed = tasks.filter(item => item.task.status === "done").length;
  const total = tasks.length;
  const nextTask = tasks.find(item => item.task.status === "todo") ?? null;
  const correct = attemptRows.filter(item => item.attempt.isCorrect).length;
  const performance = new Map<string, { name: string; total: number; correct: number }>();
  attemptRows.forEach(item => {
    const current = performance.get(item.discipline.slug) ?? { name: item.discipline.name, total: 0, correct: 0 };
    current.total += 1;
    if (item.attempt.isCorrect) current.correct += 1;
    performance.set(item.discipline.slug, current);
  });
  const weeklyMinutes = eventRows.filter(item => new Date(item.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).reduce((totalMinutes, item) => totalMinutes + item.minutes, 0);
  return {
    profile,
    plan,
    tasks,
    nextTask,
    progress: { completed, total, percentage: total ? Math.round((completed / total) * 100) : 0 },
    reviews: reviewRows,
    stats: { attempts: attemptRows.length, correct, accuracy: attemptRows.length ? Math.round((correct / attemptRows.length) * 100) : null, weeklyMinutes },
    performance: Array.from(performance.values()).map(item => ({ ...item, accuracy: Math.round((item.correct / item.total) * 100) })),
    essays: essayRows,
    mocks: mockRows,
  };
}

export async function setTaskStatus(userId: number, taskId: number, status: "todo" | "done" | "skipped") {
  const db = await requireDb();
  const [row] = await db.select({ task: studyTasks, plan: studyPlans }).from(studyTasks).innerJoin(studyPlans, eq(studyTasks.planId, studyPlans.id)).where(and(eq(studyTasks.id, taskId), eq(studyPlans.userId, userId))).limit(1);
  if (!row) throw new Error("Tarefa não encontrada");
  await db.update(studyTasks).set({ status, completedAt: status === "done" ? new Date() : null }).where(eq(studyTasks.id, taskId));
  if (status === "done") await db.insert(studyEvents).values({ userId, eventType: "task_completed", minutes: row.task.estimatedMinutes, referenceType: "studyTask", referenceId: taskId });
  return { success: true };
}

export async function listQuestions(filters?: { discipline?: string; difficulty?: string; query?: string }) {
  await ensureSeedData();
  const db = await requireDb();
  const rows = await db.select({ question: questions, discipline: disciplines, theme: themes }).from(questions).innerJoin(disciplines, eq(questions.disciplineId, disciplines.id)).leftJoin(themes, eq(questions.themeId, themes.id)).where(eq(questions.reviewStatus, "published")).orderBy(desc(questions.createdAt));
  const filtered = rows.filter(row => {
    if (filters?.discipline && row.discipline.slug !== filters.discipline) return false;
    if (filters?.difficulty && row.question.difficulty !== filters.difficulty) return false;
    if (filters?.query && !`${row.question.stem} ${row.theme?.name ?? ""}`.toLowerCase().includes(filters.query.toLowerCase())) return false;
    return true;
  }).slice(0, 50);
  if (!filtered.length) return [];
  const options = await db.select().from(questionOptions).where(inArray(questionOptions.questionId, filtered.map(item => item.question.id)));
  return filtered.map(item => ({ discipline: item.discipline, theme: item.theme, question: serializeQuestionForStudy(item.question), options: options.filter(option => option.questionId === item.question.id).map(({ isCorrect: _isCorrect, ...option }) => option) }));
}

export async function answerQuestion(input: { userId: number; questionId: number; optionId: number; confidence: "low" | "medium" | "high"; errorType?: "concept" | "attention" | "strategy" | "interpretation" | "other"; note?: string }) {
  const db = await requireDb();
  const [option] = await db.select().from(questionOptions).where(and(eq(questionOptions.id, input.optionId), eq(questionOptions.questionId, input.questionId))).limit(1);
  const [question] = await db.select().from(questions).where(and(eq(questions.id, input.questionId), eq(questions.reviewStatus, "published"))).limit(1);
  if (!option || !question) throw new Error("Alternativa ou questão inválida");
  const isCorrect = option.isCorrect;
  await db.insert(attempts).values({ userId: input.userId, questionId: input.questionId, selectedOptionId: input.optionId, isCorrect, confidence: input.confidence });
  const correctOptions = await db.select().from(questionOptions).where(and(eq(questionOptions.questionId, input.questionId), eq(questionOptions.isCorrect, true)));
  const existing = await db.select().from(errorNotebook).where(and(eq(errorNotebook.userId, input.userId), eq(errorNotebook.questionId, input.questionId))).limit(1);
  if (!isCorrect) {
    const due = isoDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
    if (existing[0]) {
      await db.update(errorNotebook).set({ errorType: input.errorType ?? "concept", note: input.note ?? existing[0].note, confidence: input.confidence, mastery: Math.max(0, existing[0].mastery - 1), reviewIntervalDays: REVIEW_INTERVALS[0], nextReviewAt: due, resolvedAt: null }).where(eq(errorNotebook.id, existing[0].id));
    } else {
      await db.insert(errorNotebook).values({ userId: input.userId, questionId: input.questionId, errorType: input.errorType ?? "concept", note: input.note, confidence: input.confidence, mastery: 0, reviewIntervalDays: REVIEW_INTERVALS[0], nextReviewAt: due });
    }
  } else if (existing[0]) {
    const next = nextReview(existing[0].reviewIntervalDays, true);
    await db.update(errorNotebook).set({ mastery: Math.min(5, existing[0].mastery + 1), reviewIntervalDays: next.interval, nextReviewAt: next.due, resolvedAt: existing[0].mastery >= 4 ? new Date() : null }).where(eq(errorNotebook.id, existing[0].id));
  }
  await db.insert(studyEvents).values({ userId: input.userId, eventType: "question_answered", minutes: 3, referenceType: "question", referenceId: input.questionId });
  return { isCorrect, explanation: question.explanation, correctOptions: correctOptions.map(item => ({ id: item.id, key: item.optionKey, text: item.text })), incorrectExplanations: question.incorrectExplanations };
}

export async function listReviews(userId: number) {
  const db = await requireDb();
  const today = isoDate(new Date());
  return db.select({ item: errorNotebook, question: questions, discipline: disciplines }).from(errorNotebook).innerJoin(questions, eq(errorNotebook.questionId, questions.id)).innerJoin(disciplines, eq(questions.disciplineId, disciplines.id)).where(and(eq(errorNotebook.userId, userId), sql`${errorNotebook.nextReviewAt} <= ${today}`, sql`${errorNotebook.resolvedAt} is null`)).orderBy(errorNotebook.nextReviewAt);
}

export async function completeReview(userId: number, notebookId: number, understood: boolean) {
  const db = await requireDb();
  const [item] = await db.select().from(errorNotebook).where(and(eq(errorNotebook.id, notebookId), eq(errorNotebook.userId, userId))).limit(1);
  if (!item) throw new Error("Revisão não encontrada");
  const next = nextReview(item.reviewIntervalDays, understood);
  await db.update(errorNotebook).set({ mastery: understood ? Math.min(item.mastery + 1, 5) : Math.max(0, item.mastery - 1), reviewIntervalDays: next.interval, nextReviewAt: next.due, resolvedAt: understood && item.mastery >= 4 ? new Date() : null }).where(eq(errorNotebook.id, notebookId));
  await db.insert(studyEvents).values({ userId, eventType: "review_completed", minutes: 8, referenceType: "errorNotebook", referenceId: notebookId });
  return { nextReviewAt: next.due, intervalDays: next.interval };
}

export async function toggleFavorite(userId: number, entityType: "content" | "video" | "question", entityId: number) {
  const db = await requireDb();
  const [existing] = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.entityType, entityType), eq(favorites.entityId, entityId))).limit(1);
  if (existing) {
    await db.delete(favorites).where(eq(favorites.id, existing.id));
    return { favorited: false };
  }
  await db.insert(favorites).values({ userId, entityType, entityId });
  return { favorited: true };
}

export async function listEssayPrompts() {
  await ensureSeedData();
  const db = await requireDb();
  return db.select().from(essayPrompts).where(eq(essayPrompts.active, true)).orderBy(desc(essayPrompts.createdAt));
}

export async function saveEssay(input: { userId: number; essayId?: number; promptId?: number; title: string; body: string; checklist: Record<string, boolean>; status: "draft" | "submitted" }) {
  const db = await requireDb();
  const wordCount = countWords(input.body);
  const lineEstimate = estimateLines(input.body);
  let essayId = input.essayId;
  if (essayId) {
    const [owned] = await db.select().from(essays).where(and(eq(essays.id, essayId), eq(essays.userId, input.userId))).limit(1);
    if (!owned) throw new Error("Redação não encontrada");
    await db.update(essays).set({ title: input.title, body: input.body, wordCount, lineEstimate, checklist: input.checklist, status: input.status }).where(eq(essays.id, essayId));
  } else {
    const [created] = await db.insert(essays).values({ userId: input.userId, promptId: input.promptId, title: input.title, body: input.body, wordCount, lineEstimate, checklist: input.checklist, status: input.status });
    essayId = Number(created.insertId);
  }
  await db.insert(essayVersions).values({ essayId, body: input.body, wordCount });
  await db.insert(studyEvents).values({ userId: input.userId, eventType: "essay_saved", minutes: 10, referenceType: "essay", referenceId: essayId });
  return { essayId, wordCount, lineEstimate };
}

export async function listEssays(userId: number) {
  const db = await requireDb();
  return db.select({ essay: essays, prompt: essayPrompts }).from(essays).leftJoin(essayPrompts, eq(essays.promptId, essayPrompts.id)).where(eq(essays.userId, userId)).orderBy(desc(essays.updatedAt));
}

export async function startMockSession(input: { userId: number; area: "mixed" | "languages" | "humanities" | "nature" | "mathematics"; questionCount: number; durationMinutes: number }) {
  await ensureSeedData();
  const db = await requireDb();
  const catalog = await db.select({ question: questions, discipline: disciplines }).from(questions).innerJoin(disciplines, eq(questions.disciplineId, disciplines.id)).where(eq(questions.reviewStatus, "published"));
  const selected = catalog.filter(row => input.area === "mixed" || row.discipline.area === input.area).slice(0, input.questionCount);
  if (selected.length !== input.questionCount) throw new Error("Não há questões publicadas suficientes para esta seleção");
  const [created] = await db.insert(mockSessions).values({ userId: input.userId, area: input.area, durationMinutes: input.durationMinutes, scoreTotal: selected.length, status: "in_progress" });
  const sessionId = Number(created.insertId);
  await db.insert(mockAnswers).values(selected.map(row => ({ sessionId, questionId: row.question.id, selectedOptionId: null, markedForReview: false })));
  const optionRows = await db.select().from(questionOptions).where(inArray(questionOptions.questionId, selected.map(row => row.question.id)));
  return { sessionId, durationMinutes: input.durationMinutes, questions: selected.map(row => ({ discipline: row.discipline, question: serializeQuestionForStudy(row.question), options: optionRows.filter(option => option.questionId === row.question.id).map(({ isCorrect: _isCorrect, ...option }) => option) })) };
}

export async function saveMockAnswer(input: { userId: number; sessionId: number; questionId: number; optionId?: number; markedForReview: boolean }) {
  const db = await requireDb();
  const [session] = await db.select().from(mockSessions).where(and(eq(mockSessions.id, input.sessionId), eq(mockSessions.userId, input.userId), eq(mockSessions.status, "in_progress"))).limit(1);
  if (!session) throw new Error("Simulado não disponível");
  if (isMockSessionExpired(session.startedAt, session.durationMinutes)) throw new Error("O tempo deste simulado expirou. Envie para receber a correção registrada.");
  const [sessionAnswer] = await db.select().from(mockAnswers).where(and(eq(mockAnswers.sessionId, input.sessionId), eq(mockAnswers.questionId, input.questionId))).limit(1);
  if (!sessionAnswer) throw new Error("Questão não pertence a este simulado");
  if (input.optionId) {
    const [option] = await db.select().from(questionOptions).where(and(eq(questionOptions.id, input.optionId), eq(questionOptions.questionId, input.questionId))).limit(1);
    if (!option) throw new Error("Alternativa inválida");
  }
  await db.update(mockAnswers).set({ selectedOptionId: input.optionId ?? null, markedForReview: input.markedForReview }).where(and(eq(mockAnswers.sessionId, input.sessionId), eq(mockAnswers.questionId, input.questionId)));
  return { success: true };
}

export async function submitMockSession(userId: number, sessionId: number) {
  const db = await requireDb();
  const [session] = await db.select().from(mockSessions).where(and(eq(mockSessions.id, sessionId), eq(mockSessions.userId, userId), eq(mockSessions.status, "in_progress"))).limit(1);
  if (!session) throw new Error("Simulado não encontrado ou já enviado");
  const rows = await db.select({ answer: mockAnswers, option: questionOptions, question: questions, discipline: disciplines }).from(mockAnswers).leftJoin(questionOptions, eq(mockAnswers.selectedOptionId, questionOptions.id)).innerJoin(questions, eq(mockAnswers.questionId, questions.id)).innerJoin(disciplines, eq(questions.disciplineId, disciplines.id)).where(eq(mockAnswers.sessionId, sessionId));
  let correct = 0;
  const subject = new Map<string, { name: string; total: number; correct: number }>();
  for (const row of rows) {
    const isCorrect = Boolean(row.option?.isCorrect);
    if (isCorrect) correct += 1;
    await db.update(mockAnswers).set({ isCorrect }).where(eq(mockAnswers.id, row.answer.id));
    const current = subject.get(row.discipline.slug) ?? { name: row.discipline.name, total: 0, correct: 0 };
    current.total += 1;
    if (isCorrect) current.correct += 1;
    subject.set(row.discipline.slug, current);
  }
  await db.update(mockSessions).set({ status: "submitted", submittedAt: new Date(), scoreCorrect: correct, scoreTotal: rows.length }).where(eq(mockSessions.id, sessionId));
  await db.insert(studyEvents).values({ userId, eventType: "mock_submitted", minutes: session.durationMinutes, referenceType: "mockSession", referenceId: sessionId });
  return { correct, total: rows.length, timedOut: isMockSessionExpired(session.startedAt, session.durationMinutes), byDiscipline: Array.from(subject.values()).map(item => ({ ...item, accuracy: item.total ? Math.round((item.correct / item.total) * 100) : 0 })), disclaimer: "Resultado baseado em acertos nas questões deste simulado autoral. Não é estimativa TRI nem nota oficial." };
}

export async function searchPlatform(input: { query: string; userId?: number | null }) {
  await ensureSeedData();
  const db = await requireDb();
  const term = `%${input.query.trim()}%`;
  if (input.userId && input.query.trim()) await db.insert(searchHistory).values({ userId: input.userId, query: input.query.trim().slice(0, 240) });
  if (!input.query.trim()) return { contents: [], questions: [], videos: [], themes: [] };
  const [contentRows, questionRows, videoRows, themeRows] = await Promise.all([
    db.select({ content: contentItems, discipline: disciplines }).from(contentItems).innerJoin(disciplines, eq(contentItems.disciplineId, disciplines.id)).where(and(eq(contentItems.reviewStatus, "published"), or(like(contentItems.title, term), like(contentItems.excerpt, term), like(contentItems.body, term)))).limit(12),
    db.select({ question: questions, discipline: disciplines }).from(questions).innerJoin(disciplines, eq(questions.disciplineId, disciplines.id)).where(and(eq(questions.reviewStatus, "published"), like(questions.stem, term))).limit(12),
    db.select({ video: videos, discipline: disciplines }).from(videos).innerJoin(disciplines, eq(videos.disciplineId, disciplines.id)).where(or(like(videos.title, term), like(videos.description, term), like(videos.channel, term))).limit(12),
    db.select({ theme: themes, discipline: disciplines }).from(themes).innerJoin(disciplines, eq(themes.disciplineId, disciplines.id)).where(or(like(themes.name, term), like(themes.description, term))).limit(12),
  ]);
  return { contents: contentRows, questions: questionRows.map(row => ({ discipline: row.discipline, question: serializeQuestionForStudy(row.question) })), videos: videoRows, themes: themeRows };
}

export async function getRecentSearches(userId: number) {
  const db = await requireDb();
  return db.select().from(searchHistory).where(eq(searchHistory.userId, userId)).orderBy(desc(searchHistory.createdAt)).limit(8);
}

export async function canUseTutor(userId: number) {
  const db = await requireDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [usage] = await db.select({ value: count() }).from(aiUsage).where(and(eq(aiUsage.userId, userId), gte(aiUsage.createdAt, since)));
  return Number(usage?.value ?? 0) < 10;
}

export async function recordTutorUse(userId: number) {
  const db = await requireDb();
  await db.insert(aiUsage).values({ userId, action: "tutor.ask" });
}

export async function listUsersForAdmin() {
  const db = await requireDb();
  const rows = await db.select({ user: users, profile: profiles }).from(users).leftJoin(profiles, eq(users.id, profiles.userId)).orderBy(desc(users.createdAt)).limit(100);
  return rows.map(row => ({ user: { id: row.user.id, name: row.user.name, email: row.user.email, role: row.user.role, status: row.user.status, createdAt: row.user.createdAt, lastSignedIn: row.user.lastSignedIn }, profile: row.profile }));
}

export async function updateUserByAdmin(input: { actorUserId: number; userId: number; role?: "user" | "admin"; status?: "active" | "suspended" }) {
  const db = await requireDb();
  if (input.actorUserId === input.userId && input.role) throw new Error("Não é permitido alterar o próprio papel administrativo");
  const values: Partial<typeof users.$inferInsert> = {};
  if (input.role) values.role = input.role;
  if (input.status) values.status = input.status;
  if (!Object.keys(values).length) return { success: true };
  await db.update(users).set(values).where(eq(users.id, input.userId));
  await logAudit(input.actorUserId, "user.updated", "user", String(input.userId), values as Record<string, unknown>);
  return { success: true };
}

export async function createContentByAdmin(input: { actorUserId: number; disciplineId: number; themeId?: number; title: string; excerpt: string; body: string; difficulty: "basic" | "intermediate" | "advanced"; estimatedMinutes: number; objectives: string[]; origin: "authorial" | "external" | "official" | "ai" | "editorReviewed" }) {
  const db = await requireDb();
  const slug = `${input.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`;
  const [created] = await db.insert(contentItems).values({ disciplineId: input.disciplineId, themeId: input.themeId, title: input.title, excerpt: input.excerpt, body: input.body, difficulty: input.difficulty, estimatedMinutes: input.estimatedMinutes, objectives: input.objectives, origin: input.origin, slug, references: [], reviewStatus: "draft" });
  const id = Number(created.insertId);
  await logAudit(input.actorUserId, "content.created", "content", String(id), { title: input.title, reviewStatus: "draft" });
  return { id, reviewStatus: "draft" as const };
}

export async function getAdminSummary() {
  const db = await requireDb();
  const [userCount, questionCount, contentCount, audit] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(questions),
    db.select({ value: count() }).from(contentItems),
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(12),
  ]);
  return { users: Number(userCount[0]?.value ?? 0), questions: Number(questionCount[0]?.value ?? 0), contents: Number(contentCount[0]?.value ?? 0), audit };
}

export async function logAudit(actorUserId: number | null, action: string, entityType: string, entityId?: string, metadata?: Record<string, unknown>) {
  const db = await requireDb();
  await db.insert(auditLogs).values({ actorUserId, action, entityType, entityId, metadata });
}

export async function databaseReady() {
  try {
    const db = await requireDb();
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}
