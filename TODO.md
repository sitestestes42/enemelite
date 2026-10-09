# ENEM ELITE — Resultados de produto

## 1. Fundação segura e persistente

- [x] Usar React, TypeScript, Tailwind, Express/tRPC, Drizzle e banco gerenciado de forma integrada; não entregar frontend desconectado.
- [x] Versionar migrações, chaves estrangeiras, índices e validações para perfis, papéis, planos, tarefas, disciplinas, temas, conteúdos, questões, alternativas, tentativas, revisões, caderno de erros, favoritos, videos, redações, simulados, respostas, histórico de estudo e auditoria.
- [x] Validar entradas no servidor, proteger endpoints e nunca expor segredos, tokens privados ou credenciais administrativas no navegador.
- [x] Isolar os dados privados do estudante no banco e no servidor; qualquer autorização administrativa deve ter verificação específica de papel.

## 2. Identidade, conta e proteção de rotas

- [ ] Oferecer login, logout, sessão real, perfil, alteração de dados, exclusão de conta, tratamento de erro e proteção de páginas privadas sem localStorage como autenticação.
- [x] Disponibilizar cadastro, recuperação e redefinição como experiências honestas sobre o provedor real disponível, sem fingir confirmação de e-mail ou envio de recuperação.
- [x] Não permitir que usuário se torne administrador alterando o próprio perfil; não incluir senha administrativa no código.
- [x] Documentar e implementar o provisionamento seguro do primeiro administrador.

## 3. Experiência pública e identidade ENEM ELITE

- [x] Criar landing, sobre, metodologia, disciplinas, biblioteca pública demonstrativa, login, cadastro, recuperação/redefinição, privacidade e termos em português brasileiro.
- [x] Explicar valor e recursos reais sem depoimentos, números, aprovações, notas, probabilidades ou métricas inventadas.
- [x] Manter azul-marinho/grafite como base, violeta elétrico como destaque, ciano para dados, verde de progresso e âmbar para avisos, com ícones profissionais.
- [x] Entregar responsividade desktop/tablet/celular, navegação mobile, contraste, foco de teclado, mensagens claras e respeito a redução de movimento.

## 4. Plano ENEM de 31 dias adaptável

- [x] Criar programa editável por calendário, organizado em diagnóstico, consolidação, prática, revisão, simulados e preparação final para Linguagens, Redação, Humanas, Natureza e Matemática.
- [ ] Cada dia deve suportar objetivos, disciplinas, conteúdos, resumo, conceitos, vídeo, questões, correções, revisão, recuperação ativa, estimativa de tempo, tarefas concluídas, dificuldade e referências.
- [ ] Permitir início, horas disponíveis, dias de estudo, matérias difíceis, diagnóstico, recálculo de tarefas futuras preservando concluídas e redução de carga diária.
- [x] Distinguir os dois dias de prova por configuração administrativa, sem datas fixas espalhadas no código ou afirmações não verificadas.

## 5. Biblioteca, vídeos e fontes

- [ ] Organizar conteúdos por área, disciplina, tema, subtema, habilidade, dificuldade, objetivo, tempo, referências, atualização e revisão; conteúdos demonstrativos devem ser completos.
- [ ] Rotular autoral, fonte externa, oficial, gerado por IA e revisado; não apresentar IA como material oficialmente validado.
- [ ] Criar biblioteca de vídeo pesquisável com título, URL, canal/professor, disciplina, tema, descrição, duração confirmada quando houver, fonte, verificação e disponibilidade.
- [ ] Incluir favoritos, histórico, conclusão e recomendação de vídeo; vídeo não verificado deve ser marcado pendente e links/atribuições nunca podem ser inventados.

## 6. Questões, revisões e caderno de erros

- [x] Criar questões autorais demonstrativas com enunciado, alternativas, gabarito, resolução comentada, explicação de incorretas quando possível, disciplina, tema, habilidade, origem e revisão.
- [ ] Filtrar por área, disciplina, tema, subtema, dificuldade, ano, habilidade, fonte e tipo; permitir responder, corrigir, favoritar, anotar, reportar e revisar com tentativas persistentes.
- [ ] Registrar automaticamente erros, tipo de erro, anotação, confiança, domínio, próxima revisão, cartão de memória e recuperação ativa.
- [ ] Aplicar agenda configurável de 1, 3, 7 e 14 dias, adaptando carga e proximidade da prova sem criar acúmulo impossível; mostrar revisões de hoje.

## 7. Pesquisa e tutor responsável

- [ ] Pesquisar conteúdos, resumos, questões, temas, vídeos, simulados, redações e materiais por texto, filtros, agrupamento, ordenação, histórico, sugestões e estado vazio.
- [ ] Utilizar busca no banco e índices adequados; a busca convencional deve operar mesmo se a IA estiver indisponível.
- [x] Quando a API gerenciada estiver disponível, oferecer tutor no servidor com limite de uso, explicações, questões autorais e sugestões de revisão, priorizando fontes internas e sem inventar referências.

## 8. Redação, simulados e desempenho

- [ ] Implementar temas autorais de redação, editor, salvamento automático, versões, palavras, linhas estimadas, checklist, competências I–V, comentários, sugestões e histórico de avaliações.
- [ ] Quando houver avaliação assistida por IA, explicitar limitações e nunca afirmar correção ou nota oficial.
- [ ] Criar simulados com área, número de questões, cronômetro, navegação, marcação, respostas salvas, confirmação, correção comentada, resultado por disciplina, histórico, comparação e revisão recomendada.
- [x] Validar o estado e a nota do simulado no servidor; não permitir resultados arbitrários no navegador nem chamar percentual de TRI oficial.
- [ ] Exibir no dashboard dados reais: próxima tarefa, plano diário, progresso, revisões, questões, taxa de acerto, disciplinas, dificuldades, simulados, redações, tempo, metas e recomendações; sem histórico, usar estados vazios orientativos.

## 9. Administração e auditoria

- [x] Separar e proteger `/admin` e áreas para usuários, questões, conteúdos, vídeos, disciplinas, temas, simulados, redações, relatórios, configurações e auditoria.
- [ ] Permitir, apenas a admin autorizada, listar/pesquisar usuários autorizados, gerenciar papéis, suspender/reativar, CRUD editorial, calendário/plano, métricas reais e ações auditáveis.

## 10. Verificação, documentação e publicação

- [x] Criar manifesto de rotas e executar migrações, diagnóstico TypeScript, testes, check e build; corrigir erros encontrados e registrar o resultado real.
- [x] Documentar execução, banco, variáveis, migrações, autenticação, administração, criação segura do administrador, implantação, monitoramento, recuperação, integrações e limitações.
- [x] Registrar fontes oficiais do Inep, Matriz de Referência, provas, gabaritos e comunicados quando verificados; não inventar calendário vigente.
- [ ] Publicar apenas se o fluxo confirmar publicação; caso contrário, entregar URL de prévia claramente identificada.
