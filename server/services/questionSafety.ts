import type { questions } from "../../drizzle/schema";

type InternalQuestion = typeof questions.$inferSelect;

/** Exposição permitida antes da resposta: sem resolução, explicações ou gabarito. */
export function serializeQuestionForStudy(question: InternalQuestion) {
  return {
    id: question.id,
    disciplineId: question.disciplineId,
    themeId: question.themeId,
    stem: question.stem,
    difficulty: question.difficulty,
    year: question.year,
    skillCode: question.skillCode,
    source: question.source,
    questionType: question.questionType,
    origin: question.origin,
    reviewStatus: question.reviewStatus,
    createdAt: question.createdAt,
  };
}

export function isMockSessionExpired(startedAt: Date, durationMinutes: number, now = new Date()) {
  return now.getTime() > startedAt.getTime() + durationMinutes * 60_000;
}
