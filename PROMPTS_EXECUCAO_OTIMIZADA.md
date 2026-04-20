# Prompts de Execução Otimizada

Este arquivo organiza os prompts na melhor ordem para reduzir retrabalho, estabilizar contratos cedo e diminuir regressões.

## Estratégia de otimização

1. Primeiro estabilizar base técnica e contratos.
2. Depois CRUDs independentes (alunos e turmas).
3. Em seguida relacionamento (matrícula), depois regra de negócio (avaliações).
4. Só então agregação e notificações (partes mais sensíveis a regressão).
5. Fechar com rodada forte de regressão e qualidade.

## Boas práticas obrigatórias para todos os blocos

- Fazer 1 bloco por vez, com PR pequeno e verificável.
- Não misturar refatoração ampla com nova funcionalidade.
- Atualizar testes de aceitação no mesmo bloco da mudança funcional.
- Preservar stack obrigatória: React+TS, Node+TS, JSON, Cucumber/Gherkin.
- Encapsular persistência JSON, sem espalhar acesso a arquivo.
- Declarar suposições de domínio quando algo não estiver definido.
- Não marcar como pronto sem passos claros de validação manual.

## Ordem recomendada de execução

1. Bloco 1: Fundação e contratos
2. Bloco 2: CRUD de alunos
3. Bloco 3: CRUD de turmas
4. Bloco 4: Associação aluno-turma
5. Bloco 5: Avaliações por metas
6. Bloco 6: Consolidação diária
7. Bloco 7: Email consolidado diário
8. Bloco 8: Fechamento e regressão final

---

## Bloco 1 - Fundação e contratos

### Prompt de implementação
Implemente somente a fundação do sistema (sem CRUD completo). Use backend Node + TypeScript, frontend React + TypeScript, persistência JSON e Cucumber/Gherkin.

Escopo:
1. Criar estrutura de pastas separando backend, frontend e aceitação.
2. No backend, separar rotas, controladores, serviços e repositórios.
3. Implementar módulo único de leitura/escrita JSON com tratamento de:
   - arquivo inexistente
   - JSON inválido
   - escrita segura para reduzir corrupção
4. Definir tipos de domínio iniciais:
   - Aluno
   - Turma
   - Meta
   - Avaliacao (aluno + meta + turma)
   - Conceito restrito a MANA, MPA e MA
   - Registro de alteração de avaliação para futura consolidação de email
5. Expor endpoint de healthcheck.
6. Atualizar README com passos de execução do backend, frontend e testes.

Restrições:
- Não implementar regras completas de negócio neste bloco.
- Não criar acoplamento entre domínio e camada de interface.

Entrega:
- Lista de arquivos alterados/criados.
- Passo a passo de validação manual.

### Prompt de testes
Crie cenários Cucumber/Gherkin para:
- inicialização do sistema
- healthcheck do backend
- leitura com arquivo JSON inexistente (comportamento tratado)
- leitura com JSON inválido (erro tratado)
- rejeição de conceito fora de MANA/MPA/MA

Inclua caso feliz e caso de erro.

### Prompt de melhoria
Revise o bloco com foco em:
- separação de camadas
- legibilidade dos tipos
- reuso da persistência JSON
- risco de sobrescrita de dados
- consistência de nomes e contratos

Aplique somente melhorias pequenas e seguras.

### Gate de saída
- Estrutura base funcionando.
- Healthcheck estável.
- Persistência JSON centralizada e tratada.
- Cenários de aceitação iniciais passando.

---

## Bloco 2 - CRUD de alunos

### Prompt de implementação
Implemente CRUD de alunos no backend e uma interface frontend mínima para listar/cadastrar/editar/remover.

Escopo:
1. Endpoints de create, update, delete e list de alunos.
2. Validação de campos obrigatórios.
3. Garantir identificador único de aluno.
4. Persistir via módulo JSON centralizado.
5. Tratar erros: aluno não encontrado, payload inválido e conflito de ID.

Restrições:
- Não misturar regras de turma e avaliação.

Entrega:
- Mudanças pequenas e testáveis.
- Evidência de persistência correta.

### Prompt de testes
Crie cenários Cucumber/Gherkin para:
- cadastro com sucesso
- cadastro inválido
- edição de aluno existente
- edição de aluno inexistente
- remoção de aluno existente
- remoção de aluno inexistente
- listagem após alterações
- persistência após create/update/delete
- regressão: operação em um aluno não impacta outro

### Prompt de melhoria
Revise com foco em:
- duplicação entre controller e service
- consistência de erros
- clareza dos nomes de campos
- coesão das validações

Faça ajustes localizados sem mudar comportamento esperado.

### Gate de saída
- CRUD de alunos funcional ponta a ponta.
- Testes de aceitação de alunos passando.
- Sem regressão do Bloco 1.

---

## Bloco 3 - CRUD de turmas

### Prompt de implementação
Implemente CRUD de turmas no backend e interface frontend mínima correspondente.

Escopo:
1. Endpoints de create, update, delete e list de turmas.
2. Validação de campos obrigatórios.
3. Garantir identificador único de turma.
4. Persistir via módulo JSON centralizado.
5. Tratar erros de turma inexistente e payload inválido.

Restrições:
- Não implementar matrícula neste bloco.

### Prompt de testes
Crie cenários Cucumber/Gherkin para:
- criação de turma com sucesso
- criação inválida
- edição existente e inexistente
- remoção existente e inexistente
- listagem após alterações
- persistência no JSON
- regressão: turmas não afetam dados de alunos

### Prompt de melhoria
Revise com foco em:
- consistência com módulo de alunos
- duplicação de validações
- extração de utilitários reutilizáveis
- robustez contra inconsistência no JSON

### Gate de saída
- CRUD de turmas estável.
- Testes de turmas passando.
- Regressões de alunos controladas.

---

## Bloco 4 - Associação aluno-turma

### Prompt de implementação
Implemente matrícula e desmatrícula de alunos em turmas.

Escopo:
1. Endpoint para matricular aluno em turma.
2. Endpoint para remover matrícula.
3. Bloquear matrícula duplicada.
4. Tratar aluno/turma inexistentes.
5. Endpoint de visualização da turma com alunos matriculados.
6. Persistir vínculos no JSON com consistência.
7. Atualizar frontend para matrícula e visualização.

Restrições:
- Não incluir avaliações ainda.

### Prompt de testes
Crie cenários Cucumber/Gherkin para:
- matrícula com sucesso
- matrícula duplicada
- aluno inexistente
- turma inexistente
- remoção de matrícula
- visualização da turma com alunos
- persistência após reinício
- regressão: regra explícita para remoção de aluno com vínculos

### Prompt de melhoria
Revise com foco em:
- modelagem de relacionamento no JSON
- regra de exclusão em cascata ou bloqueio (declarar decisão)
- clareza das regras
- simplificação de condicionais complexas

### Gate de saída
- Associação/desassociação funcionando.
- Visualização da turma correta.
- Testes de vínculo passando.

---

## Bloco 5 - Avaliações por metas

### Prompt de implementação
Implemente lançamento e alteração de avaliação por meta no contexto de turma.

Escopo:
1. Definir fonte de metas (cadastro ou catálogo), declarando suposição se necessário.
2. Endpoint para lançar avaliação por aluno + meta + turma.
3. Endpoint para alterar avaliação.
4. Restringir conceito a MANA, MPA e MA.
5. Impedir avaliação fora do contexto da turma.
6. Exibir avaliações na visualização da turma.
7. Atualizar frontend com tabela de avaliações por meta.

Restrições:
- Não implementar envio de email neste bloco.

### Prompt de testes
Crie cenários Cucumber/Gherkin para:
- lançamento com conceito válido
- rejeição de conceito inválido
- alteração de avaliação existente
- aluno não matriculado na turma
- meta inexistente
- visualização com avaliações corretas
- persistência no JSON
- regressão: avaliação de uma turma não aparece em outra

### Prompt de melhoria
Revise com foco em:
- modelagem aluno-meta-turma
- prevenção de duplicidade indevida
- organização das validações de conceito
- extensão futura de metas sem refatoração ampla

### Gate de saída
- Avaliações por metas funcionando por turma.
- Conceitos validados corretamente.
- Testes de avaliação passando.

---

## Bloco 6 - Consolidação diária

### Prompt de implementação
Implemente o registro e a consolidação diária de alterações de avaliação por aluno.

Escopo:
1. Registrar evento ao criar/alterar avaliação.
2. Consolidar por aluno e por data.
3. Agrupar mudanças de múltiplas turmas no mesmo dia.
4. Expor serviço de leitura do consolidado diário.
5. Persistir estado no JSON com consistência mínima.

Restrições:
- Ainda sem envio real de email.
- Regra de consolidação desacoplada da interface HTTP.

### Prompt de testes
Crie cenários Cucumber/Gherkin para:
- múltiplas alterações no dia gerando um único consolidado
- alterações em turmas diferentes no mesmo consolidado
- alterações em dias diferentes gerando consolidados distintos
- ausência de alteração não gera consolidado
- persistência e recuperação após reinício
- regressão das operações de avaliação

### Prompt de melhoria
Revise com foco em:
- chave de agrupamento aluno/data
- deduplicação de eventos redundantes
- riscos de concorrência/escrita no JSON
- legibilidade da estrutura consolidada

### Gate de saída
- Consolidação por aluno/dia correta.
- Multi-turma no mesmo consolidado funcionando.
- Testes de consolidação passando.

---

## Bloco 7 - Email consolidado diário

### Prompt de implementação
Implemente notificação por email baseada no consolidado diário, garantindo no máximo um email por aluno por dia.

Escopo:
1. Criar interface de serviço de email desacoplada.
2. Implementar adaptador inicial testável (mock/fake se necessário).
3. Criar dispatch diário com limite de 1 email por aluno por dia.
4. Marcar consolidado como enviado após sucesso.
5. Agrupar conteúdo por turma e meta no email.
6. Tratar falha sem perda de pendências.

Restrições:
- Não acoplar lógica de envio ao controller.

### Prompt de testes
Crie cenários Cucumber/Gherkin para:
- alteração de avaliação gera pendência
- múltiplas alterações no dia disparam somente 1 email
- alterações de várias turmas no mesmo email
- falha de envio não marca como enviado
- reprocessamento posterior envia pendências
- sem alterações no dia não envia email
- regressão de regras de avaliação

### Prompt de melhoria
Revise com foco em:
- separação entre agregação e envio
- estado pendente/enviado
- prevenção de duplicidade
- qualidade do payload do email
- logs mínimos úteis

### Gate de saída
- Regra de 1 email por aluno/dia cumprida.
- Conteúdo consolidado correto.
- Falha e reprocessamento cobertos.

---

## Bloco 8 - Fechamento e regressão final

### Prompt de implementação
Execute fechamento técnico incremental e seguro.

Escopo:
1. Validar fluxos ponta a ponta obrigatórios do sistema.
2. Corrigir inconsistências de contrato frontend/backend.
3. Ajustar mensagens de erro para previsibilidade.
4. Aplicar melhorias localizadas de legibilidade/modularidade.
5. Produzir checklist final de validação manual.

Restrições:
- Não trocar stack.
- Não migrar persistência.
- Não remover funcionalidades obrigatórias.

### Prompt de testes
Organize suíte Cucumber/Gherkin final cobrindo:
- CRUD e listagem de alunos
- CRUD de turmas
- associação aluno-turma
- avaliações por metas com MANA/MPA/MA
- visualização da turma com alunos e avaliações
- notificação por alteração de avaliação
- consolidação para um email por aluno por dia
- regressão cruzada entre módulos

### Prompt de melhoria
Faça revisão crítica final em:
- corretude
- modularidade
- legibilidade
- reusabilidade
- extensibilidade
- segurança
- performance
- duplicação
- clareza de nomes
- acoplamento

Aplicar somente refatorações de baixo risco.

### Gate de saída
- Requisitos obrigatórios atendidos.
- Suíte de aceitação principal em verde.
- Riscos residuais documentados.

---

## Modelo curto para usar ao iniciar qualquer bloco

Use este texto no começo de cada execução:

Objetivo do bloco atual: [preencher].
Escopo incluído: [preencher].
Escopo excluído: [preencher].
Arquivos esperados para alteração: [preencher].
Testes Cucumber/Gherkin a criar/atualizar: [preencher].
Validação manual esperada: [preencher].
Riscos e suposições: [preencher].

## Modelo curto para registro no histórico do experimento

- Prompt objetivo usado nesta etapa
- O que o agente tentou fazer
- O que funcionou bem
- O que funcionou mal
- Problemas de qualidade encontrados
- Rejeição parcial/total (se houve)
- Ajuste manual (se houve)
- Impacto na produtividade
- Impacto na qualidade
