# student-management-system

## Docker

Suba o backend e o frontend com:

```bash
docker compose up --build
```

Depois abra:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000/health

## Integridade Relacional (Bloco 4)

Modelagem de vínculos no JSON:

- O relacionamento aluno-turma é persistido em `turmas.json`, no campo obrigatório `alunoIds` de cada turma.
- Cada item de `alunoIds` deve ser um ID de aluno válido, não vazio e sem duplicidade dentro da turma.

Regra para exclusão de aluno com vínculos:

- Não é permitido excluir aluno que ainda esteja matriculado em uma ou mais turmas.
- A API retorna `409 Conflict` com mensagem orientando a remover matrículas antes da exclusão.
- Fluxo recomendado: desmatricular o aluno de todas as turmas e só então executar a exclusão do cadastro.

## Avaliacoes por Metas (Bloco 5)

Definição adotada para catálogo de metas:

- As metas são obtidas pela API `GET /metas`.
- O arquivo `metas.json` é inicializado automaticamente com um catálogo padrão na primeira leitura.
- Novas metas podem ser cadastradas via `POST /metas` sem alterar o contrato de avaliação.

Contratos de avaliação:

- Lançamento: `POST /avaliacoes` com `turmaId`, `alunoId`, `metaId` e `conceito`.
- Alteração: `PUT /avaliacoes/:id` com novo `conceito`.
- Visualização por turma: `GET /turmas/:id/avaliacoes` com alunos, metas e avaliações da turma.

## Consolidacao Diaria de Alteracoes (Bloco 6)

Regras de consolidação:

- Toda criação ou alteração de avaliação gera um evento em `alteracoes-avaliacoes.json`.
- Eventos são agrupados por `alunoId` + `dataSimples` (YYYY-MM-DD).
- O consolidado diário é persistido em `consolidacoes-avaliacoes.json` e reúne alterações de todas as turmas do aluno no dia.

Endpoints de consolidação:

- Reprocessar consolidação completa: `POST /consolidacoes/reprocessar`
- Consultar consolidado por aluno: `GET /consolidacoes/alunos/:alunoId`
- Consultar consolidado por aluno e dia: `GET /consolidacoes/alunos/:alunoId?data=YYYY-MM-DD`

## Envio de Email Consolidado Diario (Bloco 7)

Regras de notificação:

- Cada alteração de avaliação gera ou mantém uma pendência de notificação para a chave `alunoId + dataSimples`.
- O dispatch diário envia no máximo 1 email por aluno por dia.
- O conteúdo do email é agrupado por turma e meta.
- A notificação só é marcada como `ENVIADO` após sucesso no envio.
- Em caso de falha, a notificação permanece `PENDENTE` para reprocessamento.

Adaptador inicial de email:

- O projeto usa um adaptador fake desacoplado para permitir teste do fluxo sem infraestrutura externa.
- Para simular falha, basta usar um email contendo `falha`.

Endpoints de notificação:

- Dispatch diário: `POST /notificacoes/dispatch` (opcional body `{ "dataSimples": "YYYY-MM-DD" }`)
- Reprocessar pendências: `POST /notificacoes/reprocessar`
- Listar pendências/enviados: `GET /notificacoes/pendencias?status=PENDENTE|ENVIADO`
- Consultar log de envios: `GET /notificacoes/enviados?alunoId=<id>&data=YYYY-MM-DD`

## Fechamento Final (Bloco 8)

Checklist manual objetivo:

- `GET /health` responde 200.
- CRUD de alunos: criar, listar, editar, remover e validações de erro.
- CRUD de turmas: criar, listar, editar, remover e validações de erro.
- Matrículas: matricular, desmatricular, impedir duplicidade e consultar turma com alunos.
- Avaliações por meta: lançar, alterar, bloquear conceito inválido e bloquear aluno fora da turma.
- Consolidação diária: alterações no mesmo dia agrupadas por aluno e com dados de múltiplas turmas.
- Notificações: gerar pendência, enviar no máximo 1 email por aluno/dia, manter pendente em falha e permitir reprocessamento.
- Frontend: build executa com sucesso e integração básica com backend permanece funcional.

Riscos residuais conhecidos:

- Persistência em JSON não oferece transação ACID entre múltiplos arquivos.
- Em ambiente concorrente, escritas simultâneas podem sobrescrever alterações sem lock distribuído.
- Adaptador de email atual é fake; para produção é necessário substituir por provedor real com observabilidade.
- Execução com Node muito novo pode emitir avisos de compatibilidade do Cucumber, mesmo com cenários passando.