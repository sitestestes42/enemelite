import { COOKIE_NAME } from "@shared/const";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { users } from "../drizzle/schema";
import {
  answerQuestion,
  completeReview,
  createContentByAdmin,
  createStudyPlan,
  databaseReady,
  getAdminSummary,
  getDb,
  getExamConfiguration,
  getPublicCatalog,
  getRecentSearches,
  getStudentDashboard,
  listEssayPrompts,
  listEssays,
  listQuestions,
  listReviews,
  listUsersForAdmin,
  saveEssay,
  saveMockAnswer,
  searchPlatform,
  setTaskStatus,
  startMockSession,
  submitMockSession,
  toggleFavorite,
  updateExamConfiguration,
  updateUserByAdmin,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { askEducationalTutor } from "./services/tutor";

const studyDaySchema = z.array(z.number().int().min(0).max(6)).min(1).max(7);
const difficultySchema = z.enum(["basic", "intermediate", "advanced"]);
const areaSchema = z.enum(["mixed", "languages", "humanities", "nature", "mathematics"]);
const userView = (user: { id: number; name: string | null; email: string | null; loginMethod: string | null; role: "user" | "admin"; status: "active" | "suspended" }) => ({ id: user.id, name: user.name, email: user.email, loginMethod: user.loginMethod, role: user.role, status: user.status });

export const appRouter = router({
  system: systemRouter,
  health: publicProcedure.query(async () => ({ database: await databaseReady(), service: "ENEM ELITE" })),
  auth: router({
    me: publicProcedure.query(opts => (opts.ctx.user ? userView(opts.ctx.user) : null)),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Banco de dados indisponível");
      await db.delete(users).where(eq(users.id, ctx.user.id));
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  catalog: router({
    bootstrap: publicProcedure.query(getPublicCatalog),
    search: publicProcedure.input(z.object({ query: z.string().max(240) })).query(({ input, ctx }) => searchPlatform({ ...input, userId: ctx.user?.id })),
    recentSearches: protectedProcedure.query(({ ctx }) => getRecentSearches(ctx.user.id)),
    toggleFavorite: protectedProcedure.input(z.object({ entityType: z.enum(["content", "video", "question"]), entityId: z.number().int().positive() })).mutation(({ input, ctx }) => toggleFavorite(ctx.user.id, input.entityType, input.entityId)),
  }),
  study: router({
    dashboard: protectedProcedure.query(({ ctx }) => getStudentDashboard(ctx.user.id)),
    createPlan: protectedProcedure.input(z.object({
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      availableMinutesPerDay: z.number().int().min(30).max(720),
      studyDays: studyDaySchema,
      difficultSubjects: z.array(z.string().max(80)).max(8),
    })).mutation(({ input, ctx }) => createStudyPlan({ ...input, userId: ctx.user.id })),
    examSettings: protectedProcedure.query(getExamConfiguration),
    setTaskStatus: protectedProcedure.input(z.object({ taskId: z.number().int().positive(), status: z.enum(["todo", "done", "skipped"]) })).mutation(({ input, ctx }) => setTaskStatus(ctx.user.id, input.taskId, input.status)),
    reviews: protectedProcedure.query(({ ctx }) => listReviews(ctx.user.id)),
    completeReview: protectedProcedure.input(z.object({ notebookId: z.number().int().positive(), understood: z.boolean() })).mutation(({ input, ctx }) => completeReview(ctx.user.id, input.notebookId, input.understood)),
  }),
  questions: router({
    list: publicProcedure.input(z.object({ discipline: z.string().max(80).optional(), difficulty: difficultySchema.optional(), query: z.string().max(240).optional() }).optional()).query(({ input }) => listQuestions(input)),
    answer: protectedProcedure.input(z.object({
      questionId: z.number().int().positive(),
      optionId: z.number().int().positive(),
      confidence: z.enum(["low", "medium", "high"]),
      errorType: z.enum(["concept", "attention", "strategy", "interpretation", "other"]).optional(),
      note: z.string().max(1200).optional(),
    })).mutation(({ input, ctx }) => answerQuestion({ ...input, userId: ctx.user.id })),
  }),
  writing: router({
    prompts: publicProcedure.query(listEssayPrompts),
    list: protectedProcedure.query(({ ctx }) => listEssays(ctx.user.id)),
    save: protectedProcedure.input(z.object({
      essayId: z.number().int().positive().optional(),
      promptId: z.number().int().positive().optional(),
      title: z.string().trim().min(3).max(260),
      body: z.string().max(30000),
      checklist: z.record(z.string(), z.boolean()),
      status: z.enum(["draft", "submitted"]),
    }).superRefine((value, issue) => {
      if (value.status === "submitted" && value.body.trim().split(/\s+/u).filter(Boolean).length < 50) issue.addIssue({ code: "custom", path: ["body"], message: "Uma redação enviada para treino precisa ter ao menos 50 palavras." });
    })).mutation(({ input, ctx }) => saveEssay({ ...input, userId: ctx.user.id })),
  }),
  mocks: router({
    start: protectedProcedure.input(z.object({ area: areaSchema, questionCount: z.number().int().min(1).max(45), durationMinutes: z.number().int().min(5).max(360) })).mutation(({ input, ctx }) => startMockSession({ ...input, userId: ctx.user.id })),
    saveAnswer: protectedProcedure.input(z.object({ sessionId: z.number().int().positive(), questionId: z.number().int().positive(), optionId: z.number().int().positive().optional(), markedForReview: z.boolean() })).mutation(({ input, ctx }) => saveMockAnswer({ ...input, userId: ctx.user.id })),
    submit: protectedProcedure.input(z.object({ sessionId: z.number().int().positive() })).mutation(({ input, ctx }) => submitMockSession(ctx.user.id, input.sessionId)),
  }),
  tutor: router({
    status: publicProcedure.query(() => ({ configured: Boolean(process.env.MANUS_API_KEY), dailyLimit: 10 })),
    ask: protectedProcedure.input(z.object({ prompt: z.string().trim().min(3).max(1600) })).mutation(({ input, ctx }) => askEducationalTutor(ctx.user.id, input.prompt)),
  }),
  admin: router({
    summary: adminProcedure.query(getAdminSummary),
    users: adminProcedure.query(listUsersForAdmin),
    updateUser: adminProcedure.input(z.object({ userId: z.number().int().positive(), role: z.enum(["user", "admin"]).optional(), status: z.enum(["active", "suspended"]).optional() })).mutation(({ input, ctx }) => updateUserByAdmin({ ...input, actorUserId: ctx.user.id })),
    createContent: adminProcedure.input(z.object({
      disciplineId: z.number().int().positive(), themeId: z.number().int().positive().optional(), title: z.string().trim().min(3).max(240), excerpt: z.string().trim().min(10).max(1000), body: z.string().trim().min(30).max(50000), difficulty: difficultySchema, estimatedMinutes: z.number().int().min(1).max(480), objectives: z.array(z.string().max(240)).min(1).max(8), origin: z.enum(["authorial", "external", "official", "ai", "editorReviewed"]),
    })).mutation(({ input, ctx }) => createContentByAdmin({ ...input, actorUserId: ctx.user.id })),
    examSettings: adminProcedure.query(getExamConfiguration),
    updateExamSettings: adminProcedure.input(z.object({ edition: z.string().trim().min(4).max(32), examDayOne: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), examDayTwo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), sourceUrl: z.string().url().max(1200) })).mutation(({ input, ctx }) => updateExamConfiguration({ ...input, actorUserId: ctx.user.id })),
  }),
});

export type AppRouter = typeof appRouter;
