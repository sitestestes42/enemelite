import { describe, expect, it } from "vitest";
import { isMockSessionExpired, serializeQuestionForStudy } from "./questionSafety";

describe("serialização pública de questões", () => {
  it("não expõe resolução, explicações ou campos de gabarito antes da resposta", () => {
    const publicQuestion = serializeQuestionForStudy({
      id: 11,
      disciplineId: 2,
      themeId: null,
      stem: "Enunciado de teste",
      explanation: "Explicação confidencial antes da correção",
      incorrectExplanations: { A: "..." },
      difficulty: "basic",
      year: 2026,
      skillCode: "H1",
      source: "Autoral",
      questionType: "multiple_choice",
      origin: "authorial",
      reviewStatus: "published",
      createdAt: new Date("2026-01-01T12:00:00Z"),
      updatedAt: new Date("2026-01-01T12:00:00Z"),
    });
    expect(publicQuestion).toMatchObject({ id: 11, stem: "Enunciado de teste" });
    expect(publicQuestion).not.toHaveProperty("explanation");
    expect(publicQuestion).not.toHaveProperty("incorrectExplanations");
    expect(publicQuestion).not.toHaveProperty("isCorrect");
  });
});

describe("prazo de simulados", () => {
  it("bloqueia alterações depois da duração registrada no servidor", () => {
    const start = new Date("2026-10-10T12:00:00Z");
    expect(isMockSessionExpired(start, 20, new Date("2026-10-10T12:19:59Z"))).toBe(false);
    expect(isMockSessionExpired(start, 20, new Date("2026-10-10T12:20:01Z"))).toBe(true);
  });
});
