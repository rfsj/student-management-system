# Prompts Passo a Passo para Execucao

Objetivo: usar prompts curtos, em ordem, para reduzir ambiguidade e retrabalho.
Regra de uso: execute um prompt por vez e so avance quando o criterio de conclusao do passo estiver atendido.

## Bloco 1 - Fundacao e contratos de dominio

### Objetivo do bloco
Subir a base tecnica minima do projeto com separacao de camadas, tipagem inicial e persistencia JSON centralizada.

### Funcionalidades agrupadas
- Estrutura base backend/frontend/testes
- Persistencia JSON encapsulada
- Tipos de dominio iniciais
- Healthcheck

### Prompt de implementacao
Prompt 1.1 - Estrutura inicial
1. Crie a estrutura de pastas para backend Node+TypeScript, frontend React+TypeScript e testes de aceitacao com Cucumber.
2. Nao implemente regras de negocio ainda.
3. Entregue lista de pastas/arquivos criados e comando de execucao basico.

Prompt 1.2 - Persistencia JSON centralizada
1. Crie um modulo unico para leitura e escrita JSON.
2. Trate arquivo inexistente e JSON invalido.
3. Adicione estrategia simples de escrita segura.
4. Mostre como os outros modulos devem consumir esse modulo (sem acesso direto espalhado).

Prompt 1.3 - Tipos de dominio e healthcheck
1. Defina tipos iniciais: Aluno, Turma, Meta, Avaliacao e AlteracaoDeAvaliacao.
2. Restrinja conceito para MANA, MPA e MA.
3. Crie endpoint de healthcheck.
4. Nao implemente CRUD completo neste passo.

### Prompt de testes
Prompt 1.T - Aceitacao da fundacao
1. Crie cenarios Gherkin para: healthcheck, JSON inexistente, JSON invalido e validacao de conceito invalido.
2. Inclua caso feliz e caso de erro para cada comportamento aplicavel.
3. Garanta que os cenarios sejam executaveis no pipeline local.

### Prompt de melhoria
Prompt 1.M - Revisao tecnica da base
1. Revise separacao de camadas e nomes dos tipos.
2. Identifique acoplamentos desnecessarios.
3. Aplique somente ajustes pequenos e seguros.

### Criterios de conclusao
- Projeto inicia localmente
- Healthcheck responde corretamente
- Persistencia JSON centralizada e tratada
- Cenarios de aceitacao iniciais passando

### O que registrar no historico
- O que funcionou bem na fundacao
- Erros encontrados na persistencia
- Ajustes manuais necessarios
- Impacto na produtividade

---

## Bloco 2 - CRUD e listagem de alunos

### Objetivo do bloco
Implementar CRUD de alunos com validacoes e persistencia JSON.

### Funcionalidades agrupadas
- Criar aluno
- Editar aluno
- Remover aluno
- Listar alunos

### Prompt de implementacao
Prompt 2.1 - Criacao e listagem
1. Implemente endpoint para criar aluno com validacao de campos obrigatorios.
2. Garanta identificador unico.
3. Implemente endpoint de listagem.
4. Persista via modulo JSON centralizado.

Prompt 2.2 - Edicao e remocao
1. Implemente endpoint para editar aluno existente.
2. Implemente endpoint para remover aluno.
3. Trate aluno inexistente e payload invalido.
4. Preserve consistencia dos dados no JSON.

Prompt 2.3 - Frontend minimo de alunos
1. Crie tela simples para listar alunos.
2. Adicione formulario para criar/editar.
3. Adicione acao de remocao.
4. Mantenha UI simples e funcional.

### Prompt de testes
Prompt 2.T - Aceitacao do CRUD de alunos
1. Crie cenarios para create, update, delete e list com sucesso.
2. Crie cenarios de erro para payload invalido e aluno inexistente.
3. Valide persistencia apos operacoes.
4. Inclua regressao: operacao de um aluno nao afeta outro.

### Prompt de melhoria
Prompt 2.M - Revisao do modulo de alunos
1. Revise duplicacao entre controller e service.
2. Padronize mensagens de erro.
3. Melhore nomes e coesao das validacoes.

### Criterios de conclusao
- CRUD de alunos funcional ponta a ponta
- Persistencia correta no JSON
- Testes de aceitacao do bloco em verde

### O que registrar no historico
- Qualidade das validacoes
- Problemas encontrados
- Ajustes manuais
- Impacto na qualidade

---

## Bloco 3 - CRUD de turmas

### Objetivo do bloco
Implementar CRUD de turmas com validacoes e persistencia.

### Funcionalidades agrupadas
- Criar turma
- Editar turma
- Remover turma
- Listar turmas

### Prompt de implementacao
Prompt 3.1 - Criacao e listagem de turmas
1. Implemente endpoint para criar turma.
2. Valide campos obrigatorios e ID unico.
3. Implemente listagem de turmas.

Prompt 3.2 - Edicao e remocao de turmas
1. Implemente endpoint para editar turma.
2. Implemente endpoint para remover turma.
3. Trate turma inexistente e payload invalido.

Prompt 3.3 - Frontend minimo de turmas
1. Crie tela simples de turmas com listagem.
2. Adicione formulario de criar/editar.
3. Adicione remocao.

### Prompt de testes
Prompt 3.T - Aceitacao do CRUD de turmas
1. Crie cenarios de sucesso para create/update/delete/list.
2. Crie cenarios de erro para dados invalidos e turma inexistente.
3. Valide persistencia no JSON.
4. Inclua regressao: turmas nao alteram dados de alunos.

### Prompt de melhoria
Prompt 3.M - Revisao do modulo de turmas
1. Garanta consistencia com padrao de alunos.
2. Reduza duplicacoes de validacao.
3. Melhore legibilidade sem refatoracao ampla.

### Criterios de conclusao
- CRUD de turmas funcional
- Testes de aceitacao do bloco em verde
- Sem regressao do bloco de alunos

### O que registrar no historico
- Reaproveitamento entre modulos
- Pontos de acoplamento
- Ajustes manuais

---

## Bloco 4 - Associacao de alunos as turmas

### Objetivo do bloco
Implementar matricula/desmatricula e visualizacao de turma com alunos.

### Funcionalidades agrupadas
- Matricular aluno
- Remover matricula
- Visualizar turma com alunos

### Prompt de implementacao
Prompt 4.1 - Matricula
1. Implemente endpoint para matricular aluno em turma.
2. Bloqueie matricula duplicada.
3. Trate aluno/turma inexistentes.

Prompt 4.2 - Desmatricula e visualizacao
1. Implemente endpoint para remover matricula.
2. Implemente endpoint para visualizar turma com lista de alunos.
3. Persista vinculos com consistencia no JSON.

Prompt 4.3 - Frontend de vinculos
1. Adicione UI para matricular aluno em turma.
2. Exiba alunos vinculados por turma.
3. Adicione remocao de vinculo.

### Prompt de testes
Prompt 4.T - Aceitacao de matriculas
1. Crie cenarios para matricula com sucesso e duplicada.
2. Crie cenarios para aluno/turma inexistentes.
3. Crie cenario de desmatricula e visualizacao.
4. Valide persistencia apos reinicio.

### Prompt de melhoria
Prompt 4.M - Revisao de integridade relacional
1. Revise modelagem de vinculos no JSON.
2. Documente regra para exclusao de aluno com vinculos.
3. Simplifique condicionais complexas.

### Criterios de conclusao
- Matricula e desmatricula funcionando
- Turma exibe alunos corretamente
- Testes do bloco em verde

### O que registrar no historico
- Decisoes de integridade adotadas
- Dificuldades com dados relacionais em JSON

---

## Bloco 5 - Avaliacoes por metas

### Objetivo do bloco
Implementar lancamento/alteracao de avaliacao por meta no contexto da turma.

### Funcionalidades agrupadas
- Lancar avaliacao
- Alterar avaliacao
- Validar conceitos MANA/MPA/MA
- Visualizar avaliacoes na turma

### Prompt de implementacao
Prompt 5.1 - Catalogo de metas e contrato
1. Defina como metas serao obtidas/cadastradas.
2. Se houver suposicao, documente explicitamente.
3. Garanta tipagem extensivel.

Prompt 5.2 - Lancamento e alteracao de avaliacao
1. Implemente endpoint para lancar avaliacao por aluno+meta+turma.
2. Implemente endpoint para alterar avaliacao.
3. Permita apenas MANA, MPA e MA.
4. Impeca avaliacao fora do contexto da turma.

Prompt 5.3 - Visualizacao no frontend
1. Exiba tabela de avaliacoes por meta na tela da turma.
2. Permita atualizar conceito.
3. Mantenha clareza da relacao aluno-meta-turma.

### Prompt de testes
Prompt 5.T - Aceitacao de avaliacoes
1. Crie cenarios para conceito valido e conceito invalido.
2. Crie cenarios para alteracao de avaliacao.
3. Cubra aluno nao matriculado e meta inexistente.
4. Valide visualizacao da turma com avaliacoes.
5. Inclua regressao entre turmas.

### Prompt de melhoria
Prompt 5.M - Revisao do dominio de avaliacao
1. Revise duplicidade de registros.
2. Garanta clareza de validacoes.
3. Ajuste modelagem para facilitar extensao futura.

### Criterios de conclusao
- Avaliacoes por meta funcionando por turma
- Conceitos restritos corretamente
- Testes do bloco em verde

### O que registrar no historico
- Suposicoes sobre metas
- Fragilidades detectadas na modelagem

---

## Bloco 6 - Consolidacao diaria de alteracoes

### Objetivo do bloco
Consolidar alteracoes de avaliacao por aluno e por dia, reunindo mudancas de todas as turmas.

### Funcionalidades agrupadas
- Registro de alteracoes
- Agrupamento por aluno/data
- Consolidacao multi-turma

### Prompt de implementacao
Prompt 6.1 - Registro de eventos
1. Registre evento ao criar ou alterar avaliacao.
2. Estruture evento com aluno, turma, meta, valor anterior, novo valor e data.

Prompt 6.2 - Motor de consolidacao
1. Implemente agregacao por aluno e dia.
2. Reuna alteracoes de todas as turmas do aluno no mesmo consolidado.
3. Mantenha servico desacoplado da camada HTTP.

Prompt 6.3 - Persistencia e consulta
1. Persista consolidado no JSON com estado consistente.
2. Exponha servico de consulta do resumo diario por aluno.

### Prompt de testes
Prompt 6.T - Aceitacao da consolidacao
1. Cubra multiplas alteracoes no mesmo dia para o mesmo aluno.
2. Cubra alteracoes em turmas diferentes no mesmo dia.
3. Cubra dias diferentes gerando consolidacoes distintas.
4. Cubra ausencia de alteracao sem consolidado.
5. Valide persistencia e recuperacao apos reinicio.

### Prompt de melhoria
Prompt 6.M - Revisao de agregacao
1. Revise chave de agrupamento aluno/data.
2. Evite eventos redundantes.
3. Melhore legibilidade e previsibilidade da estrutura consolidada.

### Criterios de conclusao
- Consolidacao diaria correta
- Consolidacao multi-turma correta
- Testes do bloco em verde

### O que registrar no historico
- Estrategia de agregacao adotada
- Riscos de consistencia identificados

---

## Bloco 7 - Envio de email consolidado diario

### Objetivo do bloco
Enviar no maximo 1 email por aluno por dia, com todas as alteracoes consolidadas do dia.

### Funcionalidades agrupadas
- Servico de email desacoplado
- Dispatch diario
- Controle anti-duplicidade
- Reprocessamento seguro

### Prompt de implementacao
Prompt 7.1 - Contrato de notificacao
1. Crie interface de envio de email desacoplada.
2. Implemente adaptador inicial testavel (mock/fake).

Prompt 7.2 - Dispatch diario
1. Consuma consolidacoes pendentes do dia.
2. Envie no maximo 1 email por aluno/dia.
3. Agrupe conteudo por turma e meta.

Prompt 7.3 - Estado e resiliencia
1. Marque como enviado apenas apos sucesso.
2. Em caso de falha, mantenha pendente para reprocessamento.
3. Nao acople regra ao controller.

### Prompt de testes
Prompt 7.T - Aceitacao de notificacoes
1. Cubra geracao de pendencia apos alteracao de avaliacao.
2. Cubra varias alteracoes no dia com apenas 1 email.
3. Cubra consolidacao de varias turmas no mesmo email.
4. Cubra falha de envio sem marcar como enviado.
5. Cubra reprocessamento posterior.
6. Cubra ausencia de alteracoes sem envio.

### Prompt de melhoria
Prompt 7.M - Revisao do fluxo de email
1. Revise separacao entre agregacao e envio.
2. Fortaleca controle de duplicidade.
3. Melhore payload e logs essenciais.

### Criterios de conclusao
- Regra de 1 email por aluno/dia atendida
- Falha e reprocessamento funcionando
- Testes do bloco em verde

### O que registrar no historico
- Confiabilidade do envio
- Pontos de fragilidade no fluxo

---

## Bloco 8 - Fechamento, regressao e qualidade final

### Objetivo do bloco
Consolidar qualidade final e cobertura de aceitacao ponta a ponta.

### Funcionalidades agrupadas
- Revisao de fluxos completos
- Regressao cruzada
- Ajustes finais de contrato/erros

### Prompt de implementacao
Prompt 8.1 - Ajustes finais de comportamento
1. Valide fluxos ponta a ponta obrigatorios.
2. Corrija inconsistencias de contrato frontend/backend.
3. Padronize mensagens de erro relevantes.

Prompt 8.2 - Checklist manual final
1. Produza checklist manual objetivo para validar todos os requisitos.
2. Liste riscos residuais conhecidos.

### Prompt de testes
Prompt 8.T - Suite final de aceitacao
1. Organize cenarios para todos os requisitos obrigatorios.
2. Garanta cobertura de casos felizes, erros e regressao cruzada.
3. Execute suite principal e reporte resultado por grupo.

### Prompt de melhoria
Prompt 8.M - Revisao final de engenharia
1. Revise corretude, modularidade e legibilidade.
2. Revise duplicacao, acoplamento e extensibilidade.
3. Aplique somente refatoracoes localizadas de baixo risco.

### Criterios de conclusao
- Todos os requisitos obrigatorios cobertos
- Suite de aceitacao principal em verde
- Riscos residuais documentados

### O que registrar no historico
- Resultado final do ciclo
- Qualidade percebida
- Ajustes manuais restantes

---

## Ordem pratica de uso (copiar e colar)

1. 1.1 -> 1.2 -> 1.3 -> 1.T -> 1.M
2. 2.1 -> 2.2 -> 2.3 -> 2.T -> 2.M
3. 3.1 -> 3.2 -> 3.3 -> 3.T -> 3.M
4. 4.1 -> 4.2 -> 4.3 -> 4.T -> 4.M
5. 5.1 -> 5.2 -> 5.3 -> 5.T -> 5.M
6. 6.1 -> 6.2 -> 6.3 -> 6.T -> 6.M
7. 7.1 -> 7.2 -> 7.3 -> 7.T -> 7.M
8. 8.1 -> 8.2 -> 8.T -> 8.M

Regra de passagem: so ir para o proximo item quando testes e validacao manual do item atual estiverem OK.
