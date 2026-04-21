Feature: Aceitacao da consolidacao diaria de alteracoes
  Como usuario do sistema
  Quero consolidar alteracoes de avaliacao por aluno e por dia
  Para obter um resumo diario com alteracoes de todas as turmas

  Scenario: Multiplas alteracoes no mesmo dia para o mesmo aluno
    Given o ambiente de consolidacao esta limpo
    And existe uma avaliacao base para consolidacao
    When eu altero o conceito da avaliacao para "MPA"
    And eu altero o conceito da avaliacao para "MA"
    Then o resumo diario do aluno deve conter 3 alteracoes
    And deve existir apenas 1 consolidacao para o aluno no dia atual

  Scenario: Alteracoes em turmas diferentes no mesmo dia
    Given o ambiente de consolidacao esta limpo
    And existe um aluno com duas turmas para consolidacao
    When eu lanço avaliacoes nas duas turmas no mesmo dia
    Then o resumo diario do aluno deve conter alteracoes de 2 turmas

  Scenario: Dias diferentes geram consolidacoes distintas
    Given o ambiente de consolidacao esta limpo
    And existe uma avaliacao base para consolidacao
    When eu movo a primeira alteracao para o dia anterior
    And eu altero o conceito da avaliacao para "MPA"
    And eu reprocesso as consolidacoes
    Then o aluno deve possuir consolidacoes em 2 dias diferentes

  Scenario: Ausencia de alteracao sem consolidado
    Given o ambiente de consolidacao esta limpo
    And existe apenas um aluno sem alteracoes de avaliacao
    When eu consulto consolidacoes do aluno
    Then o status da resposta de consolidacao deve ser 404

  Scenario: Persistencia e recuperacao apos reinicio
    Given o ambiente de consolidacao esta limpo
    And existe uma avaliacao base para consolidacao
    When eu altero o conceito da avaliacao para "MPA"
    And eu reinicio o backend de consolidacao
    And eu consulto consolidacoes do aluno
    Then o status da resposta de consolidacao deve ser 200
    And o resumo diario do aluno deve conter 2 alteracoes
