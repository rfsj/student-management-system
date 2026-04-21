Feature: Aceitacao do envio de email consolidado diario
  Como usuario do sistema
  Quero enviar no maximo um email por aluno por dia
  Para consolidar alteracoes de avaliacao com resiliencia em falhas

  Scenario: Gera pendencia apos alteracao de avaliacao
    Given o ambiente de notificacoes esta limpo
    And existe uma avaliacao base para notificacao com email "aluno.notificacao@escola.com"
    When eu altero a avaliacao para "MPA" no fluxo de notificacao
    Then deve existir pendencia de notificacao para o aluno no dia atual

  Scenario: Varias alteracoes no dia geram apenas um email
    Given o ambiente de notificacoes esta limpo
    And existe uma avaliacao base para notificacao com email "aluno.unico@escola.com"
    When eu altero a avaliacao para "MPA" no fluxo de notificacao
    And eu altero a avaliacao para "MA" no fluxo de notificacao
    And eu executo o dispatch diario de notificacoes
    Then deve existir apenas 1 email enviado para o aluno no dia atual

  Scenario: Consolidacao de turmas diferentes no mesmo email
    Given o ambiente de notificacoes esta limpo
    And existe um aluno com duas turmas para notificacao com email "aluno.multi@escola.com"
    When eu lanço avaliacoes nas duas turmas para notificacao
    And eu executo o dispatch diario de notificacoes
    Then o email enviado deve conter alteracoes de 2 turmas

  Scenario: Falha de envio nao marca como enviado
    Given o ambiente de notificacoes esta limpo
    And existe uma avaliacao base para notificacao com email "falha.envio@escola.com"
    When eu altero a avaliacao para "MPA" no fluxo de notificacao
    And eu executo o dispatch diario de notificacoes
    Then a notificacao deve permanecer pendente

  Scenario: Reprocessamento posterior apos falha
    Given o ambiente de notificacoes esta limpo
    And existe uma avaliacao base para notificacao com email "falha.reprocesso@escola.com"
    When eu altero a avaliacao para "MA" no fluxo de notificacao
    And eu executo o dispatch diario de notificacoes
    And eu atualizo o email do aluno para "aluno.recuperado@escola.com"
    And eu reprocesso as notificacoes pendentes
    Then deve existir apenas 1 email enviado para o aluno no dia atual
    And nao deve existir pendencia para o aluno no dia atual

  Scenario: Ausencia de alteracoes nao gera envio
    Given o ambiente de notificacoes esta limpo
    And existe apenas um aluno para notificacao sem alteracoes
    When eu executo o dispatch diario de notificacoes
    Then o dispatch de notificacoes deve indicar 0 envios