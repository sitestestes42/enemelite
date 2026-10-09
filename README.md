# ENEM ELITE

> **Sua preparação. Seu ritmo. Sua aprovação como objetivo.**
>
> Plataforma de preparação para o ENEM com plano adaptável de 31 dias, banco de questões autorais, revisão espaçada, redação, simulados, busca, painel do estudante e administração protegida.

## O que está implementado

A aplicação usa **React + TypeScript + Tailwind** na interface e **Express + tRPC + Drizzle + MySQL gerenciado** no servidor. Não há frontend isolado: ações de plano, questões, revisão, redação, simulados, favoritos, pesquisa, auditoria e autorização passam pelo servidor e persistem no banco.

| Área | Entrega funcional |
| --- | --- |
| Identidade | Manus OAuth, cookie de sessão HTTP-only, logout, proteção de rotas e exclusão de conta. |
| Estudante | Dashboard com dados reais, criador de plano de 31 dias, tarefas concluíveis, desempenho, revisões, banco de questões, redação e simulados. |
| Conteúdo | Cinco disciplinas, quatro conteúdos didáticos completos e cinco questões **autorais de demonstração**, com origem explicitada. |
| Vídeos | Catálogo com links públicos e status `pending`; os itens não são recomendados automaticamente antes de rechecagem editorial. |
| Revisão | Caderno de erros automático e agenda inicial 1/3/7/14 dias, ajustada por acerto ou erro. |
| Redação | Proposta autoral, editor, contador de palavras/linhas, autosave, versões e estado de envio de treino. |
| Simulados | Criação, cronômetro no cliente, respostas persistidas e correção calculada no servidor; sem falsa simulação TRI. |
| Busca | Consulta persistente em conteúdos, questões, vídeos e temas, com agrupamento de resultados e histórico por usuário autenticado. |
| Tutor | Endpoint de IA somente no servidor, com limite de 10 perguntas por dia e aviso de limitações; depende de `MANUS_API_KEY`. |
| Admin | Rotas protegidas, resumo de dados reais, usuários, suspensão/reativação, conteúdo em rascunho e auditoria. |

## Arquitetura

```text
client/                         React, páginas e componentes responsivos
  src/pages/                    Landing, estudante, admin, legal e 404
  src/components/enem/          Marca, indicadores e shell autenticado
server/routers.ts               Contratos tRPC, Zod, autorização por papel
server/db.ts                    Consultas, seeds idempotentes e domínio persistente
server/services/learning.ts     Plano, agenda e revisão espaçada puros/testáveis
server/services/tutor.ts        Tutor LLM com limites e instruções responsáveis
server/services/questionSafety.ts Serialização sem gabaritos e guarda de prazo do simulado
drizzle/schema.ts               26 tabelas MySQL e índices
drizzle/0001_*.sql, 0002_*.sql  Migrações de domínio versionadas
```

As entidades incluem usuários/perfis, disciplinas/temas, conteúdos, vídeos, questões/alternativas, planos/tarefas, tentativas, caderno de erros, favoritos, progresso de vídeo, temas/redações/versões, simulados/respostas, eventos de estudo, histórico de busca, uso de IA e auditoria.

## Executar localmente

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

A aplicação usa a porta `3000` por padrão e respeita `PORT`. O manifesto de páginas está em `client/public/manus-routes.json`; a saúde do processo está em `GET /api/health`.

### Variáveis de ambiente

Copie `.env.example` apenas para referência. Em um projeto gerenciado Manus, `DATABASE_URL`, `MANUS_PROJECT_ID`, `MANUS_OAUTH_PORTAL_URL`, `MANUS_OAUTH_API_URL`, `MANUS_JWT_SECRET`, `MANUS_API_URL` e `MANUS_API_KEY` são fornecidas no processo; não devem ser copiadas para arquivos do cliente.

`OWNER_OPEN_ID` é opcional. Quando configurada como segredo protegido, a primeira autenticação daquele OpenID recebe papel `admin`. Sem essa variável, a autenticação funciona, mas não há provisionamento automático de administração.

## Banco e migrações

As migrações do domínio estão em `drizzle/0001_parallel_vision.sql` e `drizzle/0002_curved_iceman.sql` e foram geradas pelo comando:

```bash
pnpm db:push
```

Em ambientes de produção, use a migração versionada:

```bash
pnpm db:migrate
```

O catálogo demonstrativo é idempotente e nasce na primeira consulta quando as disciplinas estiverem vazias. Ele nunca substitui conteúdo editorial existente. Como o banco gerenciado é compartilhado entre desenvolvimento e publicação, não use comandos destrutivos sem backup e autorização explícita.

## Provisionar o primeiro administrador com segurança

O procedimento preferencial é configurar `OWNER_OPEN_ID` como um segredo protegido **antes** do primeiro login do responsável. Confirme o OpenID por um canal confiável e nunca o exponha no frontend ou em logs.

Caso a variável não esteja disponível, permita que a pessoa responsável faça login uma vez e promova a conta somente por uma sessão administrativa de banco com privilégios mínimos, após confirmar a identidade. Exemplo conceitual:

```sql
UPDATE users SET role = 'admin' WHERE openId = '<OPENID_CONFIRMADO>';
```

Não há rota pública para autopromoção. A tela de perfil não altera `role`, e um administrador não pode alterar o próprio papel pelo painel.

## Conteúdo, fontes e calendário

O arquivo [docs-fontes-enem.md](docs-fontes-enem.md) registra as fontes oficiais consultadas. Para o ENEM 2026, o comunicado do Inep de 8 de outubro informa aplicações em **8 e 15 de novembro de 2026**. Essas datas são gravadas no plano, portanto podem ser atualizadas por curadoria; não estão espalhadas como regras rígidas no cliente.

A Matriz de Referência orienta a organização das áreas e competências. Os materiais demonstrativos do projeto são identificados como autorais. Os dois vídeos de demonstração foram cadastrados como **pendentes de rechecagem**: links externos podem ficar indisponíveis e não devem ser promovidos como verificados até nova curadoria.

## Administração

A área administrativa exige `role = admin` resolvido no banco pelo servidor:

- `/admin` — métricas persistidas e atalhos operacionais;
- `/admin/usuarios` — listagem, busca futura, suspensão e reativação;
- `/admin/conteudos` — criação de rascunho com trilha de auditoria;
- `/admin/configuracoes` — calendário persistente da edição, os dois dias de prova e URL de fonte oficial;
- `/admin/auditoria` — ações administrativas relevantes.

As rotas para questões, vídeos, disciplinas, temas, simulados, redações, relatórios e configurações já estão declaradas e protegidas. O modelo de dados suporta essas entidades; a interface de CRUD editorial integral continua como evolução de produto.

## Testes executados

Comandos executados nesta entrega:

```text
pnpm check  → aprovado
pnpm test   → 4 arquivos, 11 testes aprovados
pnpm db:push → migrações 0001 e 0002 geradas e aplicadas
```

A suíte cobre sessão/logout do starter, validação da integração de sessão da plataforma, regras puras do ENEM ELITE (geração das 31 tarefas, respeito a dias de estudo e progressão/reinício da revisão) e serialização de questão sem vazamento de gabarito, além de expiração de simulado. A prévia foi verificada em desktop e celular; `GET /manus-routes.json`, `GET /api/health` e o catálogo persistente também responderam corretamente.

## Limitações conhecidas e próximas etapas

- O ambiente disponível oferece Manus OAuth, não Supabase Auth com senha/e-mail. Por isso cadastro, recuperação e redefinição apresentam o fluxo real de identidade, sem simular e-mails ou senhas locais.
- Confirmação de e-mail e recuperação por e-mail exigem um provedor transacional que não foi configurado.
- O tutor está implementado e protegido no servidor, mas sua resposta real depende da disponibilidade da API gerenciada; nenhuma chamada de IA foi simulada ou afirmada como testada nesta entrega.
- A interface administrativa integral para CRUD de questões, vídeos, disciplinas, temas, simulados e redações é uma evolução pendente, embora tabelas, regras de acesso e rotas protegidas estejam preparadas.
- Não há cobrança, Stripe ou planos pagos ativos; a página de planos informa essa condição em vez de exibir preços inventados.
- Os resultados de simulados não são TRI e nenhuma função promete resultado no ENEM.

## Publicação

O projeto possui `Dockerfile`, servidor configurado e `/api/health`. Para publicar, execute build, faça checkpoint no repositório canônico e use o fluxo de publicação do projeto gerenciado. O aplicativo só deve ser anunciado como publicado depois de a plataforma confirmar a URL de produção.
