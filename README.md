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