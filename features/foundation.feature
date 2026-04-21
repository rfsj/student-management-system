Feature: Fundacao do Sistema
  Como início do projeto
  Desejo validar que a infraestrutura está funcionando
  Para garantir a base técnica está pronta

  Scenario: Backend responde ao healthcheck
    Given o servidor backend está iniciado
    When eu faço uma requisição GET para "/health"
    Then a resposta deve ter status 200
    And a resposta deve conter "ok"

  Scenario: JSON inexistente é tratado
    Given o módulo de persistência foi inicializado
    When eu tentar ler um arquivo JSON que não existe
    Then o erro deve ser tratado adequadamente
    And o sistema não deve falhar

  Scenario: JSON inválido é tratado
    Given eu tenho um arquivo JSON corrompido
    When eu tentar ler este arquivo
    Then o erro deve ser tratado adequadamente
    And o sistema não deve falhar

  Scenario: Conceito inválido é rejeitado
    Given um contrato de avaliação foi definido
    When eu tentar criar uma avaliação com conceito "INVALIDO"
    Then a operação deve ser rejeitada
    And apenas MANA, MPA e MA devem ser aceitos

  Scenario: Persistência JSON centralizada funciona
    Given o repositório JSON está operacional
    When eu escrever dados válidos em um arquivo
    Then os dados devem ser salvos com sucesso
    And os dados devem ser recuperáveis

  Scenario: Escrita segura evita arquivo parcial
    Given o repositório JSON está operacional
    When eu escrever dados em arquivo durante operação
    Then o arquivo deve estar completo e válido
    And nenhum arquivo parcial deve permanecer

  Scenario: Validador de Aluno rejeita dados incompletos
    Given um validador de Aluno foi definido
    When eu tentar validar um Aluno sem id
    Then uma exceção deve ser lançada
    And a mensagem deve explicar que id é obrigatório

  Scenario: Validador de Turma rejeita dados incompletos
    Given um validador de Turma foi definido
    When eu tentar validar uma Turma sem nome
    Then uma exceção deve ser lançada
    And a mensagem deve explicar que nome é obrigatório

  Scenario: Validador de Avaliacao rejeita conceito inválido
    Given um validador de Avaliacao foi definido
    When eu tentar validar uma Avaliacao com conceito "OUTRO"
    Then uma exceção deve ser lançada
    And a mensagem deve mencionar conceito inválido

  Scenario: Healthcheck indica persistência disponível
    Given o servidor backend está iniciado
    When eu faço uma requisição GET para "/health"
    Then a resposta deve ter status 200
    And a resposta deve conter "persistence"
    And a resposta deve conter "timestamp"
