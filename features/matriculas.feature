Feature: Aceitacao de associacao de alunos as turmas
  Como usuario do sistema
  Quero matricular e desmatricular alunos em turmas
  Para visualizar cada turma com seus alunos vinculados

  Scenario: Matricula com sucesso
    Given o ambiente de matriculas esta limpo
    And existe um aluno para matricula com nome "Ana"
    And existe uma turma para matricula com nome "1A"
    When eu matriculo o aluno na turma
    Then o status da resposta de matriculas deve ser 200
    And a turma deve conter 1 aluno matriculado

  Scenario: Matricula duplicada
    Given o ambiente de matriculas esta limpo
    And existe um aluno para matricula com nome "Bruno"
    And existe uma turma para matricula com nome "2B"
    And o aluno ja esta matriculado na turma
    When eu tento matricular novamente o mesmo aluno na turma
    Then o status da resposta de matriculas deve ser 400
    And a resposta de erro de matriculas deve conter "Aluno já matriculado na turma."

  Scenario: Erro de aluno inexistente
    Given o ambiente de matriculas esta limpo
    And existe uma turma para matricula com nome "3C"
    When eu tento matricular um aluno inexistente
    Then o status da resposta de matriculas deve ser 404
    And a resposta de erro de matriculas deve conter "Aluno não encontrado."

  Scenario: Erro de turma inexistente
    Given o ambiente de matriculas esta limpo
    And existe um aluno para matricula com nome "Carla"
    When eu tento matricular em uma turma inexistente
    Then o status da resposta de matriculas deve ser 404
    And a resposta de erro de matriculas deve conter "Turma não encontrada."

  Scenario: Desmatricula com sucesso
    Given o ambiente de matriculas esta limpo
    And existe um aluno para matricula com nome "Diego"
    And existe uma turma para matricula com nome "4D"
    And o aluno ja esta matriculado na turma
    When eu removo a matricula do aluno na turma
    Then o status da resposta de matriculas deve ser 200
    And a turma deve conter 0 aluno matriculado

  Scenario: Visualizacao da turma com alunos
    Given o ambiente de matriculas esta limpo
    And existe um aluno para matricula com nome "Eva"
    And existe uma turma para matricula com nome "5E"
    And o aluno ja esta matriculado na turma
    When eu visualizo a turma com seus alunos
    Then o status da resposta de matriculas deve ser 200
    And a visualizacao da turma deve conter o aluno "Eva"

  Scenario: Persistencia de vinculos em JSON
    Given o ambiente de matriculas esta limpo
    And existe um aluno para matricula com nome "Felipe"
    And existe uma turma para matricula com nome "6F"
    When eu matriculo o aluno na turma
    Then o arquivo de turmas deve armazenar o vinculo de matricula
