Feature: Aceitacao de avaliacoes por metas
  Como usuario do sistema
  Quero lancar e alterar avaliacao por meta no contexto da turma
  Para acompanhar desempenho com conceitos validos

  Scenario: Lancamento de avaliacao com conceito valido
    Given o ambiente de avaliacoes esta limpo
    And existe um aluno matriculado para avaliacao
    And existe uma meta para avaliacao
    When eu lanço avaliacao com conceito "MPA"
    Then o status da resposta de avaliacoes deve ser 201
    And a resposta de avaliacoes deve conter o conceito "MPA"

  Scenario: Erro de conceito invalido
    Given o ambiente de avaliacoes esta limpo
    And existe um aluno matriculado para avaliacao
    And existe uma meta para avaliacao
    When eu lanço avaliacao com conceito "INVALIDO"
    Then o status da resposta de avaliacoes deve ser 400
    And a resposta de erro de avaliacoes deve conter "Conceito inválido"

  Scenario: Alteracao de avaliacao existente
    Given o ambiente de avaliacoes esta limpo
    And existe um aluno matriculado para avaliacao
    And existe uma meta para avaliacao
    And existe avaliacao lançada com conceito "MANA"
    When eu altero a avaliacao para conceito "MA"
    Then o status da resposta de avaliacoes deve ser 200
    And a resposta de avaliacoes deve conter o conceito "MA"

  Scenario: Erro para aluno nao matriculado
    Given o ambiente de avaliacoes esta limpo
    And existe um aluno nao matriculado para avaliacao
    And existe uma turma para avaliacao
    And existe uma meta para avaliacao
    When eu lanço avaliacao para aluno fora da turma
    Then o status da resposta de avaliacoes deve ser 400
    And a resposta de erro de avaliacoes deve conter "Aluno não está matriculado na turma informada."

  Scenario: Erro de meta inexistente
    Given o ambiente de avaliacoes esta limpo
    And existe um aluno matriculado para avaliacao
    When eu lanço avaliacao com meta inexistente
    Then o status da resposta de avaliacoes deve ser 404
    And a resposta de erro de avaliacoes deve conter "Meta não encontrada."

  Scenario: Visualizacao da turma com avaliacoes
    Given o ambiente de avaliacoes esta limpo
    And existe um aluno matriculado para avaliacao
    And existe uma meta para avaliacao
    And existe avaliacao lançada com conceito "MPA"
    When eu visualizo as avaliacoes da turma
    Then o status da resposta de avaliacoes deve ser 200
    And a visualizacao da turma deve conter 1 avaliacao

  Scenario: Regressao entre turmas
    Given o ambiente de avaliacoes esta limpo
    And existe um aluno matriculado em duas turmas
    And existe uma meta para avaliacao
    When eu lanço avaliacao apenas na turma principal
    Then a turma secundaria deve permanecer sem avaliacao
