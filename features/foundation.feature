Feature: Aceitacao da fundacao
  Como base do sistema
  Desejo validar comportamentos essenciais da fundacao
  Para garantir execucao local confiavel no pipeline

  Scenario: Healthcheck retorna sucesso
    Given o servidor backend esta iniciado
    When eu faco uma requisicao GET para "/health"
    Then a resposta HTTP deve ter status 200
    And a resposta HTTP deve conter "ok"

  Scenario: Healthcheck em rota inexistente retorna erro
    Given o servidor backend esta iniciado
    When eu faco uma requisicao GET para "/health-inexistente"
    Then a resposta HTTP deve ter status 404

  Scenario: JSON existente e valido e lido com sucesso
    Given o modulo de persistencia foi inicializado
    When eu leio um arquivo JSON valido
    Then a leitura JSON deve ter sucesso

  Scenario: JSON inexistente retorna erro controlado
    Given o modulo de persistencia foi inicializado
    When eu leio um arquivo JSON inexistente
    Then a leitura JSON deve falhar
    And a mensagem de erro deve conter "Arquivo nao encontrado"

  Scenario: JSON valido nao gera erro de parse
    Given o modulo de persistencia foi inicializado
    When eu leio novamente o arquivo JSON valido
    Then a leitura JSON deve ter sucesso

  Scenario: JSON invalido retorna erro de parse
    Given eu tenho um arquivo JSON invalido
    When eu leio o arquivo JSON invalido
    Then a leitura JSON deve falhar
    And a mensagem de erro deve conter "JSON invalido"

  Scenario: Conceito valido e aceito
    Given o contrato de conceito foi definido
    When eu valido o conceito "MANA"
    Then a validacao de conceito deve ter sucesso

  Scenario: Conceito invalido e rejeitado
    Given o contrato de conceito foi definido
    When eu valido o conceito "INVALIDO"
    Then a validacao de conceito deve falhar
    And a mensagem de erro deve conter "Conceito invalido"
