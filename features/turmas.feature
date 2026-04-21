Feature: Aceitacao do CRUD de turmas
  Como usuario do sistema
  Quero gerenciar turmas com seguranca
  Para manter os dados consistentes no JSON

  Scenario: Create de turma com sucesso
    Given o ambiente de turmas esta limpo
    When eu crio uma turma com nome "1A" e descricao "Turma do primeiro ano"
    Then o status da resposta de turmas deve ser 201
    And a resposta de turmas deve conter o nome "1A"

  Scenario: List de turmas com sucesso
    Given o ambiente de turmas esta limpo
    And existe uma turma com nome "2B" e descricao "Turma da tarde"
    When eu listo as turmas
    Then o status da resposta de turmas deve ser 200
    And a lista de turmas deve conter 1 item
    And a lista de turmas deve conter o nome "2B"

  Scenario: Update de turma com sucesso
    Given o ambiente de turmas esta limpo
    And existe uma turma com nome "3C" e descricao "Descricao inicial"
    When eu atualizo a turma existente para nome "3C Atualizada"
    Then o status da resposta de turmas deve ser 200
    And a resposta de turmas deve conter o nome "3C Atualizada"

  Scenario: Delete de turma com sucesso
    Given o ambiente de turmas esta limpo
    And existe uma turma com nome "4D" e descricao "Turma temporaria"
    When eu removo a turma existente
    Then o status da resposta de turmas deve ser 204
    And a lista de turmas deve conter 0 item

  Scenario: Erro de payload invalido no create
    Given o ambiente de turmas esta limpo
    When eu tento criar uma turma sem nome
    Then o status da resposta de turmas deve ser 400
    And a resposta de erro de turmas deve conter "Campo nome é obrigatório."

  Scenario: Erro ao atualizar turma inexistente
    Given o ambiente de turmas esta limpo
    When eu tento atualizar uma turma inexistente
    Then o status da resposta de turmas deve ser 404
    And a resposta de erro de turmas deve conter "Turma não encontrada."

  Scenario: Erro ao remover turma inexistente
    Given o ambiente de turmas esta limpo
    When eu tento remover uma turma inexistente
    Then o status da resposta de turmas deve ser 404
    And a resposta de erro de turmas deve conter "Turma não encontrada."

  Scenario: Regressao de isolamento entre turmas
    Given o ambiente de turmas esta limpo
    And existem duas turmas cadastradas "5A" e "5B"
    When eu atualizo somente a turma "5A" para "5A Atualizada"
    Then a turma "5B" deve permanecer inalterada
