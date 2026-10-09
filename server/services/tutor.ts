import { invokeLLM } from "../_core/llm";
import { canUseTutor, recordTutorUse } from "../db";

const officialSources = [
  "Matriz de Referência do Enem: https://www.gov.br/inep/pt-br/centrais-de-conteudo/acervo-linha-editorial/publicacoes-institucionais/avaliacoes-e-exames-da-educacao-basica/matrizes-de-referencia-enem",
  "Documentos oficiais do Enem: https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/outros-documentos",
];

export async function askEducationalTutor(userId: number, prompt: string) {
  if (!(await canUseTutor(userId))) {
    throw new Error("Limite diário do tutor atingido. Tente novamente amanhã.");
  }

  const result = await invokeLLM({
    maxTokens: 650,
    messages: [
      {
        role: "system",
        content: `Você é o Tutor ENEM ELITE. Responda em português brasileiro, de forma didática, objetiva e acolhedora. Ajude a explicar conceitos, propor uma questão autoral curta ou sugerir revisão. Não prometa aprovação, não estime nota TRI, não apresente correção automatizada como oficial e não invente referências. Quando uma afirmação depender de regra do Enem, prefira dizer que o estudante deve consultar as fontes oficiais. Fontes confiáveis disponíveis:\n${officialSources.join("\n")}`,
      },
      { role: "user", content: prompt.slice(0, 1600) },
    ],
  });
  const content = result.choices?.[0]?.message.content;
  const text = typeof content === "string" ? content.trim() : "";
  if (!text) throw new Error("O tutor não retornou uma resposta utilizável. Tente reformular a pergunta.");
  await recordTutorUse(userId);
  return { answer: text, disclaimer: "Resposta assistida por IA. Use-a como apoio de estudo e confira regras oficiais nas fontes indicadas." };
}
