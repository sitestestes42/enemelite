import { describe, expect, it } from "vitest";
import { createThirtyOneDayRoute, nextReview, nextStudyDate } from "./learning";

describe("rota de estudo de 31 dias", () => {
  const disciplines = [
    { id: 1, slug: "matematica", name: "Matemática", area: "mathematics" },
    { id: 2, slug: "redacao", name: "Redação", area: "writing" },
  ];

  it("gera 31 tarefas com fases pedagógicas e dias permitidos", () => {
    const route = createThirtyOneDayRoute({
      startDate: new Date("2026-10-09T12:00:00"),
      studyDays: [1, 3, 5],
      availableMinutes: 90,
      disciplines,
      difficultSubjects: ["matematica"],
    });
    expect(route).toHaveLength(31);
    expect(route[0].phase).toBe("diagnostic");
    expect(route[1].phase).toBe("consolidation");
    expect(route[18].phase).toBe("revision");
    expect(route[24].phase).toBe("mock");
    expect(route[30].phase).toBe("final");
    expect(route.every(task => [1, 3, 5].includes(new Date(`${task.scheduledFor}T12:00:00`).getDay()))).toBe(true);
    expect(route[0].disciplineId).toBe(1);
  });

  it("encontra o próximo dia válido sem pular a data quando ela é permitida", () => {
    expect(nextStudyDate(new Date("2026-10-12T12:00:00"), [1, 3, 5]).getDay()).toBe(1);
    expect(nextStudyDate(new Date("2026-10-13T12:00:00"), [1, 3, 5]).getDay()).toBe(3);
  });
});

describe("revisão espaçada", () => {
  it("aumenta o intervalo depois de um acerto e reinicia depois de um erro", () => {
    expect(nextReview(1, true).interval).toBe(3);
    expect(nextReview(7, true).interval).toBe(14);
    expect(nextReview(14, true).interval).toBe(14);
    expect(nextReview(7, false).interval).toBe(1);
  });
});
