# ENEM ELITE — Plano de implementação

**Estado:** aprovado pelo escopo explícito do pedido; execução em andamento.

## Objetivo do produto

O ENEM ELITE será uma plataforma web premium em português brasileiro para organização de uma preparação intensiva de 31 dias para o ENEM. A primeira entrega operacional prioriza fluxos reais: identidade por login gerenciado, persistência no banco, autorização por papel, plano adaptável, questões, revisões, redação, simulados, catálogo, pesquisa e administração protegida. O produto não promete aprovação, resultados ou previsões de prova.

## Arquitetura executável

| Camada | Decisão | Responsabilidade |
| --- | --- | --- |
| Interface | React 19 + TypeScript + Vite + Tailwind | Páginas públicas, área do estudante, administração e responsividade. |
| Servidor | Express + tRPC | Validação Zod, regras de acesso, cálculos de desempenho e endpoints seguros. |
| Autenticação | Manus OAuth e sessão de aplicação validada | Identidade real, sessão HTTP-only, logout e resolução de papel no banco. O ambiente não fornece Supabase/Auth por e-mail. |
| Dados | MySQL gerenciado + Drizzle | Migrações versionadas, relações, índices e registros privados por usuário. |
| IA opcional | API LLM gerenciada, somente no servidor | Tutor com limites por usuário, fontes internas e indisponibilidade tratada sem bloquear a pesquisa convencional. |
| Implantação | Contêiner Express do template | Build reprodutível, `/api/health`, variáveis gerenciadas e dados persistentes fora do contêiner. |

A autenticação por e-mail/senha, confirmação e recuperação não serão simuladas: o ambiente disponível fornece OAuth real, não um provedor de e-mail transacional. As telas correspondentes explicam o método de acesso disponível e o limite é documentado.

## Modelo de dados e segurança

O esquema Drizzle cria entidades de perfis, papéis, disciplinas, temas, conteúdos, videoaulas, questões, alternativas, tentativas, favoritos, planos de estudo, tarefas, revisões, caderno de erros, redações/versões, propostas, simulados/respostas, registros de estudo e auditoria. Dados particulares sempre são filtrados por `ctx.user.id` no servidor; mutações nunca aceitam um ID de proprietário arbitrário. Procedimentos administrativos exigem `role = admin`, resolvido no banco a partir da identidade autenticada. O primeiro administrador é provisionado por variável de proprietário do ambiente ou por procedimento documentado e nunca por alteração de perfil no cliente.

O banco possui migrações verificáveis, chaves estrangeiras e índices para buscas por área, disciplina, tema, atualização e proprietário. O sistema preserva dados de produção durante testes; seeds são idempotentes e só criam a demonstração quando os catálogos estiverem vazios.

## Conteúdo demonstrativo e fontes

A demonstração inclui conteúdos, questões e temas **autorais**, devidamente rotulados. Fontes oficiais e externas serão cadastradas como referência, sem republicar provas ou materiais protegidos. Links de vídeo só recebem status “verificado” se a navegação os confirmar; se não, ficam “pendentes”. As datas da prova são configurações administrativas, não constantes do código. O calendário base não afirma datas sem confirmação oficial vigente.

## Design system — “Constelação de Progresso”

- **Movimento de design:** *Neo-futurismo editorial brasileiro* — uma leitura premium de painel de missão, com informação educacional clara em vez de estética gamer genérica.
- **Princípios:** densidade informacional gradual, progresso visível sem pressão, contraste acessível e foco pedagógico.
- **Filosofia de cor:** azul-marinho cria concentração e confiança; o violeta elétrico é a assinatura de impulso; ciano destaca conexões e dados; verde reconhece avanço; âmbar marca atenção sem alarmismo.
- **Paradigma de layout:** uma espinha vertical de “rota de estudo” conecta blocos de informação em vez de uma grade central repetitiva. Painéis assimétricos e linhas orbitais aproximam conteúdo, plano e métricas.
- **Elementos de assinatura:** anel de progresso com arco violeta-ciano, pontos de rota conectados e superfícies “glass graphite” com bordas luminosas discretas.
- **Interação:** ações de estudo são claras, com retorno imediato, confirmação antes de finalizar um simulado e estados vazios que indicam um próximo passo concreto.
- **Animação:** entradas curtas de 160–240 ms, progresso contínuo sem oscilações e `prefers-reduced-motion` desativa transições não essenciais.
- **Tipografia:** Manrope para interface e títulos (peso 500–800); Source Serif 4 em blocos extensos de leitura/redação. Escala tipográfica pronunciada e leitura confortável.
- **Essência da marca:** preparação ENEM organizada e adaptável para estudantes que querem decidir o próximo passo com confiança. Personalidade: precisa, acolhedora e ambiciosa.
- **Voz da marca:** direta, sem promessas indevidas. Exemplos: “Hoje, estude o que move sua preparação.” e “Revisar agora é transformar erro em repertório.”
- **Wordmark e cor assinatura:** “ENEM” em peso compacto e “ELITE” em espaçamento amplo, acompanhado de um arco de órbita ascendente; violeta `#8B5CF6` é a cor proprietária de assinatura.

## Estrutura de projeto

```text
client/
  src/
    components/        # navegação, design system, gráficos e estados reutilizáveis
    data/              # tipos e dados de apresentação não sensíveis
    pages/             # páginas públicas, estudante, admin e legal
    hooks/             # composição e autenticação
server/
  services/            # regras de domínio: plano, revisão, busca, simulado, IA
  routers.ts           # contratos tRPC, validação e autorização
  db.ts                # consultas reusáveis e seed idempotente
  _core/               # sessão OAuth, Vite e recursos da plataforma
drizzle/
  schema.ts            # fonte do modelo relacional
  *.sql                # migrações versionadas
client/public/
  manus-routes.json    # manifesto de rotas públicas e privadas renderizáveis
README.md              # execução, ambiente, migração, administração e publicação
```

## Fluxo de entrega

1. Criar esquema/migração, regras de domínio e catálogo demonstrativo idempotente.
2. Expor contratos tRPC protegidos para plano, biblioteca, busca, questões, revisão, redação, simulados e administração.
3. Construir o design system e as rotas públicas, de estudante e de administração, todas responsivas.
4. Configurar manifesto de rotas, iniciar o servidor e verificar a prévia.
5. Executar migrações, check de tipos, testes, build e correções.
6. Documentar variáveis, limitações, provisionamento seguro e procedimento de publicação; criar checkpoint e publicar somente após validação efetiva.

## Limites assumidos de forma transparente

- O provider disponível é Manus OAuth, não Supabase Auth: não será criado um falso fluxo de senha/e-mail.
- Sem SMTP configurado, recuperação/redefinição por e-mail não dispara mensagens.
- O tutor de IA depende da disponibilidade da API LLM gerenciada e terá limites no servidor.
- Não haverá monetização/checkout sem uma integração de pagamento real; a página de planos não será promovida como venda ativa.
- As datas ENEM não serão afirmadas no produto antes de validação em fonte do Inep; o administrador as configura.
