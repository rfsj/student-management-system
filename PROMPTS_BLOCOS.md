# Prompts do Projeto por Blocos

Este arquivo reúne os prompts prontos para copiar e colar.
Escopo: planejamento e execução incremental.
Observação: este arquivo não inicia implementação.

## Bloco 1 – Fundação do projeto e contratos de domínio

### Objetivo do bloco
Estabelecer a base técnica mínima do sistema com arquitetura separada, tipagem de domínio e persistência JSON encapsulada.

### Funcionalidades agrupadas
- Estrutura inicial de backend Node com TypeScript e frontend React com TypeScript
- Camada de persistência JSON centralizada (leitura/escrita com tratamento de erro)
- Tipos e contratos iniciais de domínio: aluno, turma, meta, avaliação, notificação
- Configuração inicial de Cucumber + Gherkin para testes de aceitação

### Prompt de implementação
Implemente apenas a fundação técnica do sistema, sem CRUD completo ainda.
Restrições obrigatórias: backend em Node + TypeScript, frontend em React + TypeScript, persistência em JSON, testes de aceitação com Cucumber/Gherkin.
Tarefas:
1. Criar estrutura de pastas separando claramente backend, frontend e testes de aceitação.
2. No backend, separar rotas, controladores, serviços e repositórios JSON (sem regra de negócio complexa em rota).
3. Criar módulo de persistência JSON reutilizável com tratamento de:
   - arquivo inexistente
   - JSON inválido
   - escrita atômica simples para reduzir risco de corrupção
4. Definir tipos de domínio iniciais:
   - Aluno
   - Turma
   - Meta
   - Avaliacao (por aluno, por meta, por turma)
   - Conceito permitido: MANA, MPA, MA
   - Registro de alteração de avaliação para futura consolidação de email
5. Criar arquivo README técnico curto explicando como rodar backend, frontend e testes.
6. Não implementar funcionalidades de negócio completas neste bloco; apenas contratos, infraestrutura e endpoints de healthcheck.
Entregue lista de arquivos criados/alterados e instruções de validação manual.

### Prompt de testes
Crie testes de aceitação iniciais com Cucumber/Gherkin cobrindo:
- inicialização do sistema
- resposta de healthcheck do backend
- comportamento quando arquivo JSON ainda não existe
- comportamento quando JSON está inválido (erro tratado)
- validação de conceito inválido em nível de contrato (não aceitar fora de MANA/MPA/MA)
Inclua cenários felizes e de erro.
Inclua passo para validar que a estrutura de persistência não está espalhada pelo código.

### Prompt de melhoria
Faça revisão crítica apenas da fundação:
- clareza da separação entre camadas
- legibilidade dos tipos
- reusabilidade do módulo JSON
- pontos de acoplamento desnecessário
- riscos de sobrescrita de dados
- nomes e consistência de interfaces
Proponha refatorações localizadas e pequenas, sem alterar comportamento funcional.

### Critérios de conclusão
- Estrutura backend/frontend/testes criada e funcional
- Persistência JSON centralizada com tratamento de erros básicos
- Tipos de domínio definidos com conceitos válidos restritos
- Cucumber/Gherkin configurado e executando cenário simples
- Documentação mínima de execução disponível

### O que registrar no histórico
- Qualidade da arquitetura inicial
- Facilidade/dificuldade para configurar stack obrigatória
- Erros encontrados na persistência JSON
- Ajustes manuais necessários
- Impacto na produtividade ao iniciar com contratos claros

## Bloco 2 – CRUD e listagem de alunos

### Objetivo do bloco
Implementar gerenciamento completo de alunos com persistência JSON e validações de entrada.

### Funcionalidades agrupadas
- Criar aluno
- Editar aluno
- Remover aluno
- Listar alunos
- Validações de dados obrigatórios e unicidade de identificador

### Prompt de implementação
Implemente apenas o CRUD de alunos no backend, com persistência em JSON e separação por camadas.
Requisitos:
1. Endpoints para criar, editar, remover e listar alunos.
2. Validar campos obrigatórios e formato mínimo dos dados.
3. Garantir identificador único de aluno.
4. Persistir alterações no JSON usando o módulo centralizado já existente.
5. Tratar erros de aluno não encontrado, payload inválido e conflito de identificador.
6. Não misturar regras de turma/avaliação neste bloco.
7. Atualizar frontend com tela simples de listagem e formulário de cadastro/edição de aluno.
Entregar com mudanças pequenas e verificáveis.

### Prompt de testes
Criar cenários Gherkin/Cucumber para:
- cadastro de aluno com sucesso
- tentativa de cadastro com dados inválidos
- edição de aluno existente
- tentativa de edição de aluno inexistente
- remoção de aluno existente
- tentativa de remoção de aluno inexistente
- listagem de alunos após operações
- verificação de persistência em JSON após create/update/delete
Incluir regressão: operação de um aluno não pode afetar outro.

### Prompt de melhoria
Revisar o bloco de alunos buscando:
- duplicação entre controlador e serviço
- consistência de mensagens de erro
- clareza dos nomes de campos
- coesão dos módulos de validação
- oportunidades de simplificar sem quebrar testes
Sugerir melhorias incrementais e aplicar somente as seguras.

### Critérios de conclusão
- CRUD de alunos funcional ponta a ponta
- Persistência correta no JSON
- Validações de entrada aplicadas
- Cenários de aceitação cobrindo sucesso e falha
- Frontend mínimo de alunos operante

### O que registrar no histórico
- Se as validações evitaram dados inconsistentes
- Principais erros do agente neste bloco
- Ajustes manuais para alinhar contratos frontend/backend
- Qualidade dos cenários de aceitação
- Ganho de produtividade percebido

## Bloco 3 – CRUD de turmas

### Objetivo do bloco
Implementar gerenciamento completo de turmas, mantendo isolamento de responsabilidades em relação aos alunos.

### Funcionalidades agrupadas
- Criar turma
- Editar turma
- Remover turma
- Listar turmas
- Validações de integridade de dados de turma

### Prompt de implementação
Implemente o CRUD de turmas no backend e frontend, mantendo arquitetura modular.
Requisitos:
1. Endpoints para create/update/delete/list de turmas.
2. Validações de campos obrigatórios da turma.
3. Identificador único de turma.
4. Persistência JSON centralizada.
5. Erros explícitos para turma inexistente e payload inválido.
6. Não implementar matrícula ainda neste bloco.
7. Criar tela frontend de turmas equivalente ao padrão de alunos.
Preserve comportamento já estável do bloco anterior.

### Prompt de testes
Criar cenários Cucumber/Gherkin para:
- criação de turma com sucesso
- criação com dados inválidos
- edição de turma existente e inexistente
- remoção de turma existente e inexistente
- listagem de turmas após alterações
- persistência correta no JSON
- regressão: operações de turma não alteram dados de alunos

### Prompt de melhoria
Revisar bloco de turmas com foco em:
- consistência de design com módulo de alunos
- duplicação de validações
- extração de utilitários compartilháveis
- legibilidade de serviços e controladores
- robustez contra dados inconsistentes no JSON

### Critérios de conclusão
- CRUD de turmas completo e estável
- Persistência e validações funcionando
- Testes de aceitação cobrindo casos principais e de erro
- Frontend de turmas funcional

### O que registrar no histórico
- Nível de reaproveitamento entre módulos de aluno e turma
- Problemas de acoplamento identificados
- Ajustes manuais para manter consistência de API
- Impacto na manutenção futura

## Bloco 4 – Associação de alunos às turmas e visualização da turma

### Objetivo do bloco
Permitir matrícula de alunos em turmas e exibir cada turma com seus alunos.

### Funcionalidades agrupadas
- Associar aluno a turma
- Remover associação aluno-turma
- Listar alunos de uma turma
- Visualização da turma com composição de alunos

### Prompt de implementação
Implemente a associação aluno-turma com regras de integridade.
Requisitos:
1. Endpoint para matricular aluno em turma.
2. Endpoint para remover matrícula.
3. Impedir matrícula duplicada do mesmo aluno na mesma turma.
4. Tratar aluno inexistente e turma inexistente.
5. Expor endpoint de visualização de turma com seus alunos.
6. Persistir associações em JSON de forma consistente.
7. Atualizar frontend para matricular e visualizar alunos por turma.
Não incluir avaliações ainda, apenas vínculo aluno-turma.

### Prompt de testes
Criar cenários Gherkin/Cucumber para:
- matrícula com sucesso
- tentativa de matrícula duplicada
- matrícula com aluno inexistente
- matrícula com turma inexistente
- remoção de matrícula com sucesso
- visualização de turma contendo alunos matriculados
- persistência de vínculos após reinicialização
- regressão: remover aluno deve tratar vínculos com turmas de forma definida (explicitar regra adotada)

### Prompt de melhoria
Revisar associação aluno-turma:
- modelagem de relacionamento no JSON
- impacto de exclusões em cascata ou bloqueio (deixar decisão explícita)
- clareza das regras de negócio
- possíveis inconsistências de dados legados
- simplificação de pontos com alta complexidade condicional

### Critérios de conclusão
- Matrícula e desmatrícula funcionando
- Visualização de turma com lista correta de alunos
- Integridade básica dos vínculos garantida
- Testes cobrindo sucesso, erro e persistência

### O que registrar no histórico
- Regra escolhida para exclusão e vínculos
- Dificuldades de consistência no JSON relacional
- Acertos e falhas do agente ao tratar integridade
- Impacto na previsibilidade do sistema

## Bloco 5 – Avaliações por metas com conceitos MANA, MPA e MA

### Objetivo do bloco
Implementar lançamento e consulta de avaliações por meta no contexto da turma.

### Funcionalidades agrupadas
- Estrutura de metas
- Lançamento de avaliação por aluno/meta/turma
- Alteração de avaliação
- Validação de conceitos permitidos
- Visualização da turma com alunos e avaliações

### Prompt de implementação
Implemente avaliações por meta no contexto de turma, sem email ainda.
Requisitos:
1. Definir claramente como metas são cadastradas/obtidas.
2. Se a lista de metas não existir no projeto, explicitar a suposição adotada.
3. Endpoint para lançar avaliação por aluno + meta + turma.
4. Endpoint para alterar avaliação existente.
5. Aceitar somente conceitos MANA, MPA e MA.
6. Garantir que avaliação pertença ao contexto de uma turma.
7. Atualizar visualização de turma para exibir alunos e suas avaliações por meta.
8. Atualizar frontend com tabela de avaliações por meta.
Não implementar envio de email neste bloco.

### Prompt de testes
Criar cenários Gherkin/Cucumber para:
- lançamento de avaliação com conceito válido
- rejeição de conceito inválido
- alteração de avaliação existente
- tentativa de avaliar aluno não matriculado na turma
- tentativa de avaliar meta inexistente
- visualização de turma exibindo avaliações corretas
- persistência de avaliações no JSON
- regressão: avaliação de uma turma não aparece em outra turma

### Prompt de melhoria
Revisar o módulo de avaliações:
- clareza da modelagem aluno-meta-turma
- prevenção de duplicidade indevida de registros
- organização de validações de conceito
- legibilidade da tabela de visualização
- possibilidade de extensão futura de metas sem refatoração ampla

### Critérios de conclusão
- Avaliações por meta operando por turma
- Conceitos válidos restritos corretamente
- Visualização por turma com alunos e avaliações
- Testes cobrindo cenário feliz, validações e regressões

### O que registrar no histórico
- Suposição adotada sobre catálogo de metas
- Pontos frágeis da modelagem inicial de avaliação
- Ajustes manuais para UI da tabela
- Impacto na qualidade percebida do domínio

## Bloco 6 – Consolidação diária de alterações de avaliação

### Objetivo do bloco
Registrar alterações de avaliação e consolidá-las por aluno por dia para notificação futura.

### Funcionalidades agrupadas
- Registro de eventos de alteração de avaliação
- Agregação diária por aluno
- Consolidação de mudanças de múltiplas turmas no mesmo dia
- Serviço desacoplado de consolidação (sem envio real ainda)

### Prompt de implementação
Implemente a lógica de consolidação diária de alterações, desacoplada da camada de envio.
Requisitos:
1. Ao criar ou alterar avaliação, registrar evento de mudança.
2. Consolidar eventos por aluno e por data.
3. Consolidar mudanças de todas as turmas do aluno no mesmo dia em um único pacote.
4. Expor serviço para obter o resumo consolidado diário por aluno.
5. Não enviar email real ainda; apenas preparar estrutura testável para envio.
6. Garantir que lógica de agregação não fique acoplada à interface HTTP.
7. Persistir eventos/estado necessário em JSON com consistência mínima.

### Prompt de testes
Criar cenários Cucumber/Gherkin para:
- múltiplas alterações no mesmo dia para mesmo aluno resultam em uma consolidação
- alterações em turmas diferentes no mesmo dia entram no mesmo consolidado
- alterações em dias diferentes geram consolidados distintos
- aluno sem alteração no dia não gera consolidado
- persistência e recuperação de consolidados após reinício
- regressão: criação/alteração de avaliação continua funcionando normalmente

### Prompt de melhoria
Revisar motor de consolidação:
- clareza das chaves de agrupamento por aluno/data
- deduplicação de eventos redundantes
- legibilidade da estrutura de resumo consolidado
- riscos de corrida/escrita concorrente no JSON
- simplificação de fluxo sem perda de rastreabilidade

### Critérios de conclusão
- Alterações de avaliação geram eventos
- Consolidação diária por aluno funcionando
- Múltiplas turmas consolidadas no mesmo dia
- Testes de aceitação cobrindo agregação e persistência

### O que registrar no histórico
- Estratégia de agregação adotada
- Problemas de consistência encontrados
- Qualidade da separação entre agregação e entrega
- Impacto na confiabilidade de notificação

## Bloco 7 – Envio de email ao aluno com consolidação diária

### Objetivo do bloco
Implementar mecanismo de notificação por email, garantindo no máximo um email por aluno por dia com todas as alterações consolidadas.

### Funcionalidades agrupadas
- Adaptador de envio de email desacoplado e substituível
- Processo de disparo com base na consolidação diária
- Controle para evitar múltiplos emails no mesmo dia por aluno
- Conteúdo de email com alterações de todas as turmas do dia

### Prompt de implementação
Implemente a camada de envio de email integrada ao consolidado diário.
Requisitos:
1. Criar interface de serviço de email desacoplada da regra de negócio.
2. Implementar adaptador inicial (mock/testável) caso envio real não esteja disponível.
3. Criar processo de dispatch que consulta consolidados e envia no máximo 1 email por aluno por dia.
4. Marcar consolidado como enviado para evitar reenvio duplicado.
5. Incluir no conteúdo do email as alterações agrupadas por turma e meta.
6. Tratar falhas de envio sem perder o consolidado.
7. Não acoplar lógica de envio ao controller HTTP.

### Prompt de testes
Criar cenários Gherkin/Cucumber para:
- alteração de avaliação gera notificação pendente
- múltiplas alterações no dia geram somente 1 email por aluno
- alterações em turmas diferentes aparecem no mesmo email
- falha no envio não marca como enviado indevidamente
- reprocessamento posterior envia corretamente pendências
- ausência de alterações no dia não envia email
- regressão: regras de avaliação permanecem corretas

### Prompt de melhoria
Revisar módulo de notificação:
- desacoplamento entre agregação e envio
- clareza do estado enviado/pendente
- prevenção de envios duplicados
- qualidade do payload do email
- observabilidade mínima (logs úteis sem excesso)

### Critérios de conclusão
- Envio diário único por aluno implementado
- Consolidação multi-turma refletida no conteúdo
- Falhas de envio tratadas com segurança
- Cobertura de testes para sucesso, falha e regressão

### O que registrar no histórico
- Efetividade da estratégia anti-duplicidade
- Pontos de fragilidade no fluxo de envio
- Ajustes manuais necessários no conteúdo de email
- Impacto na qualidade e confiança do processo

## Bloco 8 – Fechamento, cobertura de aceitação e revisão final

### Objetivo do bloco
Consolidar o sistema completo com foco em cobertura de aceitação, regressões e qualidade geral.

### Funcionalidades agrupadas
- Revisão ponta a ponta dos fluxos principais
- Ampliação e organização dos cenários de aceitação
- Correções de bugs e inconsistências de contrato
- Refinos de legibilidade e modularidade sem refatoração massiva

### Prompt de implementação
Execute uma rodada de fechamento técnico com mudanças pequenas e seguras:
1. Validar todos os fluxos obrigatórios do projeto fim a fim.
2. Corrigir inconsistências de contrato entre frontend e backend.
3. Ajustar mensagens de erro para previsibilidade.
4. Aplicar melhorias localizadas de legibilidade e modularidade.
5. Não trocar stack, não migrar persistência e não remover funcionalidades.
6. Produzir checklist de validação manual final.

### Prompt de testes
Criar/organizar suíte de aceitação completa com Cucumber/Gherkin cobrindo:
- CRUD de alunos
- listagem de alunos
- CRUD de turmas
- associação de alunos às turmas
- avaliações por metas
- conceitos MANA/MPA/MA
- visualização de turma com alunos e avaliações
- envio de email quando há alteração de avaliação
- consolidação de alterações para 1 email por aluno por dia, incluindo múltiplas turmas
Incluir cenário de regressão cruzada entre módulos e cenários de erro relevantes.

### Prompt de melhoria
Fazer revisão crítica final do sistema com foco em:
- corretude
- modularidade
- legibilidade
- reusabilidade
- extensibilidade
- segurança
- performance
- duplicação
- clareza de nomes
- acoplamento desnecessário
Aplicar apenas refatorações localizadas e de baixo risco; registrar riscos remanescentes.

### Critérios de conclusão
- Todos os requisitos obrigatórios contemplados
- Suíte de aceitação cobrindo fluxos principais e erros
- Sem regressões funcionais conhecidas
- Checklist de validação manual executável
- Riscos residuais explicitados

### O que registrar no histórico
- Qualidade final percebida do código
- O que o agente fez bem e mal
- Correções manuais pós-agente
- Se houve rejeição parcial/total de alguma entrega
- Impacto final em produtividade e qualidade
