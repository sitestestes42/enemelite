import {
  boolean,
  date,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Identidade autenticada pela plataforma e papel autorizado no banco. */
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
    status: mysqlEnum("status", ["active", "suspended"]).default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  table => [index("users_role_status_idx").on(table.role, table.status)]
);

export const profiles = mysqlTable(
  "profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
    displayName: varchar("displayName", { length: 120 }),
    weeklyGoalMinutes: int("weeklyGoalMinutes").default(600).notNull(),
    availableMinutesPerDay: int("availableMinutesPerDay").default(120).notNull(),
    studyDays: json("studyDays").$type<number[]>().notNull(),
    difficultSubjects: json("difficultSubjects").$type<string[]>().notNull(),
    onboardingComplete: boolean("onboardingComplete").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("profiles_user_idx").on(table.userId)]
);

/** Calendário editável da edição vigente; somente administração autorizada altera estes dados. */
export const examConfigurations = mysqlTable(
  "examConfigurations",
  {
    id: int("id").autoincrement().primaryKey(),
    edition: varchar("edition", { length: 32 }).notNull().unique(),
    examDayOne: date("examDayOne", { mode: "string" }).notNull(),
    examDayTwo: date("examDayTwo", { mode: "string" }).notNull(),
    sourceUrl: varchar("sourceUrl", { length: 1200 }).notNull(),
    updatedByUserId: int("updatedByUserId").references(() => users.id, { onDelete: "set null" }),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("exam_config_updated_idx").on(table.updatedAt)]
);

export const disciplines = mysqlTable(
  "disciplines",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 80 }).notNull().unique(),
    name: varchar("name", { length: 120 }).notNull(),
    area: mysqlEnum("area", ["languages", "writing", "humanities", "nature", "mathematics"]).notNull(),
    description: text("description").notNull(),
    color: varchar("color", { length: 16 }).notNull(),
    icon: varchar("icon", { length: 48 }).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("disciplines_area_idx").on(table.area)]
);

export const themes = mysqlTable(
  "themes",
  {
    id: int("id").autoincrement().primaryKey(),
    disciplineId: int("disciplineId").notNull().references(() => disciplines.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description").notNull(),
    skillCode: varchar("skillCode", { length: 32 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("themes_discipline_idx").on(table.disciplineId)]
);

export const contentItems = mysqlTable(
  "contentItems",
  {
    id: int("id").autoincrement().primaryKey(),
    disciplineId: int("disciplineId").notNull().references(() => disciplines.id, { onDelete: "restrict" }),
    themeId: int("themeId").references(() => themes.id, { onDelete: "set null" }),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    title: varchar("title", { length: 240 }).notNull(),
    excerpt: text("excerpt").notNull(),
    body: text("body").notNull(),
    difficulty: mysqlEnum("difficulty", ["basic", "intermediate", "advanced"]).default("basic").notNull(),
    estimatedMinutes: int("estimatedMinutes").default(15).notNull(),
    objectives: json("objectives").$type<string[]>().notNull(),
    references: json("references").$type<Array<{ label: string; url: string }>>().notNull(),
    origin: mysqlEnum("origin", ["authorial", "external", "official", "ai", "editorReviewed"]).default("authorial").notNull(),
    reviewStatus: mysqlEnum("reviewStatus", ["draft", "published", "archived"]).default("published").notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    publishedAt: timestamp("publishedAt"),
  },
  table => [
    index("contents_catalog_idx").on(table.disciplineId, table.themeId, table.reviewStatus),
    index("contents_updated_idx").on(table.updatedAt),
  ]
);

export const videos = mysqlTable(
  "videos",
  {
    id: int("id").autoincrement().primaryKey(),
    disciplineId: int("disciplineId").notNull().references(() => disciplines.id, { onDelete: "restrict" }),
    themeId: int("themeId").references(() => themes.id, { onDelete: "set null" }),
    title: varchar("title", { length: 255 }).notNull(),
    url: varchar("url", { length: 1200 }).notNull(),
    channel: varchar("channel", { length: 160 }).notNull(),
    description: text("description").notNull(),
    durationSeconds: int("durationSeconds"),
    source: varchar("source", { length: 255 }).notNull(),
    verifiedAt: timestamp("verifiedAt"),
    availability: mysqlEnum("availability", ["verified", "pending", "unavailable"]).default("pending").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("videos_catalog_idx").on(table.disciplineId, table.themeId, table.availability)]
);

export const questions = mysqlTable(
  "questions",
  {
    id: int("id").autoincrement().primaryKey(),
    disciplineId: int("disciplineId").notNull().references(() => disciplines.id, { onDelete: "restrict" }),
    themeId: int("themeId").references(() => themes.id, { onDelete: "set null" }),
    stem: text("stem").notNull(),
    explanation: text("explanation").notNull(),
    incorrectExplanations: json("incorrectExplanations").$type<Record<string, string>>().notNull(),
    difficulty: mysqlEnum("difficulty", ["basic", "intermediate", "advanced"]).default("basic").notNull(),
    year: int("year"),
    skillCode: varchar("skillCode", { length: 32 }),
    source: varchar("source", { length: 160 }).notNull(),
    questionType: varchar("questionType", { length: 64 }).default("multiple_choice").notNull(),
    origin: mysqlEnum("origin", ["authorial", "official", "external", "ai"]).default("authorial").notNull(),
    reviewStatus: mysqlEnum("reviewStatus", ["draft", "published", "archived"]).default("published").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("questions_filter_idx").on(table.disciplineId, table.themeId, table.difficulty, table.reviewStatus),
    index("questions_source_year_idx").on(table.source, table.year),
  ]
);

export const questionOptions = mysqlTable(
  "questionOptions",
  {
    id: int("id").autoincrement().primaryKey(),
    questionId: int("questionId").notNull().references(() => questions.id, { onDelete: "cascade" }),
    optionKey: varchar("optionKey", { length: 1 }).notNull(),
    text: text("text").notNull(),
    isCorrect: boolean("isCorrect").default(false).notNull(),
  },
  table => [uniqueIndex("question_option_unique").on(table.questionId, table.optionKey)]
);

export const studyPlans = mysqlTable(
  "studyPlans",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).default("Rota de 31 dias").notNull(),
    startDate: date("startDate", { mode: "string" }).notNull(),
    examDayOne: date("examDayOne", { mode: "string" }),
    examDayTwo: date("examDayTwo", { mode: "string" }),
    availableMinutesPerDay: int("availableMinutesPerDay").notNull(),
    studyDays: json("studyDays").$type<number[]>().notNull(),
    difficultSubjects: json("difficultSubjects").$type<string[]>().notNull(),
    status: mysqlEnum("status", ["active", "paused", "completed"]).default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("plans_user_status_idx").on(table.userId, table.status)]
);

export const studyTasks = mysqlTable(
  "studyTasks",
  {
    id: int("id").autoincrement().primaryKey(),
    planId: int("planId").notNull().references(() => studyPlans.id, { onDelete: "cascade" }),
    disciplineId: int("disciplineId").references(() => disciplines.id, { onDelete: "set null" }),
    contentId: int("contentId").references(() => contentItems.id, { onDelete: "set null" }),
    dayNumber: int("dayNumber").notNull(),
    phase: mysqlEnum("phase", ["diagnostic", "consolidation", "practice", "revision", "mock", "final"]).notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    objective: text("objective").notNull(),
    didacticSummary: text("didacticSummary").notNull(),
    concepts: json("concepts").$type<string[]>().notNull(),
    estimatedMinutes: int("estimatedMinutes").notNull(),
    difficulty: mysqlEnum("difficulty", ["basic", "intermediate", "advanced"]).default("basic").notNull(),
    scheduledFor: date("scheduledFor", { mode: "string" }).notNull(),
    reviewOfDay: int("reviewOfDay"),
    status: mysqlEnum("status", ["todo", "done", "skipped"]).default("todo").notNull(),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("tasks_plan_day_unique").on(table.planId, table.dayNumber),
    index("tasks_today_idx").on(table.planId, table.scheduledFor, table.status),
  ]
);

export const attempts = mysqlTable(
  "attempts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    questionId: int("questionId").notNull().references(() => questions.id, { onDelete: "cascade" }),
    selectedOptionId: int("selectedOptionId").references(() => questionOptions.id, { onDelete: "set null" }),
    isCorrect: boolean("isCorrect").notNull(),
    confidence: mysqlEnum("confidence", ["low", "medium", "high"]).default("medium").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("attempts_user_question_idx").on(table.userId, table.questionId), index("attempts_user_created_idx").on(table.userId, table.createdAt)]
);

export const errorNotebook = mysqlTable(
  "errorNotebook",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    questionId: int("questionId").notNull().references(() => questions.id, { onDelete: "cascade" }),
    errorType: mysqlEnum("errorType", ["concept", "attention", "strategy", "interpretation", "other"]).default("concept").notNull(),
    note: text("note"),
    confidence: mysqlEnum("confidence", ["low", "medium", "high"]).default("medium").notNull(),
    mastery: int("mastery").default(0).notNull(),
    nextReviewAt: date("nextReviewAt", { mode: "string" }).notNull(),
    reviewIntervalDays: int("reviewIntervalDays").default(1).notNull(),
    resolvedAt: timestamp("resolvedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("notebook_user_question_unique").on(table.userId, table.questionId), index("notebook_due_idx").on(table.userId, table.nextReviewAt)]
);

export const favorites = mysqlTable(
  "favorites",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    entityType: mysqlEnum("entityType", ["content", "video", "question"]).notNull(),
    entityId: int("entityId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("favorites_entity_unique").on(table.userId, table.entityType, table.entityId)]
);

export const videoProgress = mysqlTable(
  "videoProgress",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    videoId: int("videoId").notNull().references(() => videos.id, { onDelete: "cascade" }),
    completed: boolean("completed").default(false).notNull(),
    lastWatchedAt: timestamp("lastWatchedAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("video_progress_unique").on(table.userId, table.videoId)]
);

export const essayPrompts = mysqlTable(
  "essayPrompts",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 260 }).notNull(),
    briefing: text("briefing").notNull(),
    collection: text("collection").notNull(),
    source: varchar("source", { length: 200 }).notNull(),
    origin: mysqlEnum("origin", ["authorial", "official", "external"]).default("authorial").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("essay_prompts_active_idx").on(table.active)]
);

export const essays = mysqlTable(
  "essays",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    promptId: int("promptId").references(() => essayPrompts.id, { onDelete: "set null" }),
    title: varchar("title", { length: 260 }).notNull(),
    body: text("body").notNull(),
    wordCount: int("wordCount").default(0).notNull(),
    lineEstimate: int("lineEstimate").default(0).notNull(),
    checklist: json("checklist").$type<Record<string, boolean>>().notNull(),
    status: mysqlEnum("status", ["draft", "submitted", "reviewed"]).default("draft").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("essays_user_status_idx").on(table.userId, table.status)]
);

export const essayVersions = mysqlTable(
  "essayVersions",
  {
    id: int("id").autoincrement().primaryKey(),
    essayId: int("essayId").notNull().references(() => essays.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    wordCount: int("wordCount").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("essay_versions_essay_idx").on(table.essayId, table.createdAt)]
);

export const mocks = mysqlTable(
  "mocks",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull(),
    area: mysqlEnum("area", ["mixed", "languages", "humanities", "nature", "mathematics"]).default("mixed").notNull(),
    durationMinutes: int("durationMinutes").notNull(),
    isPublished: boolean("isPublished").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("mocks_published_idx").on(table.isPublished, table.area)]
);

export const mockQuestions = mysqlTable(
  "mockQuestions",
  {
    id: int("id").autoincrement().primaryKey(),
    mockId: int("mockId").notNull().references(() => mocks.id, { onDelete: "cascade" }),
    questionId: int("questionId").notNull().references(() => questions.id, { onDelete: "cascade" }),
    position: int("position").notNull(),
  },
  table => [uniqueIndex("mock_question_position_unique").on(table.mockId, table.position), uniqueIndex("mock_question_unique").on(table.mockId, table.questionId)]
);

export const mockSessions = mysqlTable(
  "mockSessions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    mockId: int("mockId").references(() => mocks.id, { onDelete: "set null" }),
    area: mysqlEnum("area", ["mixed", "languages", "humanities", "nature", "mathematics"]).default("mixed").notNull(),
    durationMinutes: int("durationMinutes").notNull(),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    submittedAt: timestamp("submittedAt"),
    scoreCorrect: int("scoreCorrect").default(0).notNull(),
    scoreTotal: int("scoreTotal").default(0).notNull(),
    status: mysqlEnum("status", ["in_progress", "submitted"]).default("in_progress").notNull(),
  },
  table => [index("mock_sessions_user_idx").on(table.userId, table.status, table.startedAt)]
);

export const mockAnswers = mysqlTable(
  "mockAnswers",
  {
    id: int("id").autoincrement().primaryKey(),
    sessionId: int("sessionId").notNull().references(() => mockSessions.id, { onDelete: "cascade" }),
    questionId: int("questionId").notNull().references(() => questions.id, { onDelete: "cascade" }),
    selectedOptionId: int("selectedOptionId").references(() => questionOptions.id, { onDelete: "set null" }),
    markedForReview: boolean("markedForReview").default(false).notNull(),
    isCorrect: boolean("isCorrect"),
  },
  table => [uniqueIndex("mock_answer_unique").on(table.sessionId, table.questionId)]
);

export const studyEvents = mysqlTable(
  "studyEvents",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    eventType: varchar("eventType", { length: 64 }).notNull(),
    minutes: int("minutes").default(0).notNull(),
    referenceType: varchar("referenceType", { length: 64 }),
    referenceId: int("referenceId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("study_events_user_created_idx").on(table.userId, table.createdAt)]
);

export const searchHistory = mysqlTable(
  "searchHistory",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").references(() => users.id, { onDelete: "set null" }),
    query: varchar("query", { length: 240 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("search_history_user_created_idx").on(table.userId, table.createdAt)]
);

export const aiUsage = mysqlTable(
  "aiUsage",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 64 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("ai_usage_daily_idx").on(table.userId, table.createdAt)]
);

export const auditLogs = mysqlTable(
  "auditLogs",
  {
    id: int("id").autoincrement().primaryKey(),
    actorUserId: int("actorUserId").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 120 }).notNull(),
    entityType: varchar("entityType", { length: 80 }).notNull(),
    entityId: varchar("entityId", { length: 80 }),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("audit_action_created_idx").on(table.action, table.createdAt)]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
