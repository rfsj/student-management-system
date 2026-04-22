Feature: Aceitacao do CRUD de alunos
  Como usuario do sistema
  Quero gerenciar alunos com seguranca
  Para manter os dados consistentes no JSON

  Scenario: Create de aluno com sucesso
    Given o ambiente de alunos esta limpo
    When eu crio um aluno com nome "Ana", cpf "12345678901" e email "ana@escola.com"
    Then o status da resposta de alunos deve ser 201
    And a resposta de alunos deve conter o nome "Ana"

  Scenario: List de alunos com sucesso
    Given o ambiente de alunos esta limpo
    And existe um aluno com nome "Bruno", cpf "12345678902" e email "bruno@escola.com"
    When eu listo os alunos
    Then o status da resposta de alunos deve ser 200
    And a lista de alunos deve conter 1 item
    And a lista de alunos deve conter o nome "Bruno"

  Scenario: Update de aluno com sucesso
    Given o ambiente de alunos esta limpo
    And existe um aluno com nome "Carla", cpf "12345678903" e email "carla@escola.com"
    When eu atualizo o aluno existente para nome "Carla Souza"
    Then o status da resposta de alunos deve ser 200
    And a resposta de alunos deve conter o nome "Carla Souza"

  Scenario: Delete de aluno com sucesso
    Given o ambiente de alunos esta limpo
    And existe um aluno com nome "Diego", cpf "12345678904" e email "diego@escola.com"
    When eu removo o aluno existente
    Then o status da resposta de alunos deve ser 204
    And a lista de alunos deve conter 0 item

  Scenario: Erro de payload invalido no create
    Given o ambiente de alunos esta limpo
    When eu tento criar um aluno sem nome
    Then o status da resposta de alunos deve ser 400
    And a resposta de erro de alunos deve conter "Campo nome é obrigatório."

  Scenario: Erro ao criar aluno sem cpf
    Given o ambiente de alunos esta limpo
    When eu tento criar um aluno sem cpf
    Then o status da resposta de alunos deve ser 400
    And a resposta de erro de alunos deve conter "Campo cpf é obrigatório."

  Scenario: Erro ao atualizar aluno inexistente
    Given o ambiente de alunos esta limpo
    When eu tento atualizar um aluno inexistente
    Then o status da resposta de alunos deve ser 404
    And a resposta de erro de alunos deve conter "Aluno não encontrado."

  Scenario: Erro ao remover aluno inexistente
    Given o ambiente de alunos esta limpo
    When eu tento remover um aluno inexistente
    Then o status da resposta de alunos deve ser 404
    And a resposta de erro de alunos deve conter "Aluno não encontrado."

  Scenario: Regressao de isolamento entre alunos
    Given o ambiente de alunos esta limpo
    And existem dois alunos cadastrados "Eva" e "Felipe"
    When eu atualizo somente o aluno "Eva" para "Eva Lima"
    Then o aluno "Felipe" deve permanecer inalterado
