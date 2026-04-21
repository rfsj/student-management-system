import { After, AfterAll, Before, BeforeAll, Given, Then, When } from '@cucumber/cucumber';
import http from 'http';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

import jsonRepository from '../../backend/src/repositories/jsonRepository';

type TurmaPayload = {
  id: string;
  nome: string;
  descricao?: string;
  dataCriacao: string;
  dataAtualizacao: string;
};

let backendProcess: ChildProcess | null = null;
let startedByThisFile = false;
let lastStatus: number | null = null;
let lastBody = '';
let lastError: Error | null = null;
let ultimaTurmaId: string | null = null;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestJson(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  payload?: unknown
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path: endpoint,
        method,
        headers: payload ? { 'Content-Type': 'application/json' } : undefined
      },
      (res: http.IncomingMessage) => {
        let data = '';
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on('end', () => {
          resolve({ status: res.statusCode ?? 0, body: data });
        });
      }
    );

    req.on('error', (err: Error) => reject(err));

    if (payload) {
      req.write(JSON.stringify(payload));
    }

    req.end();
  });
}

async function waitForBackendReady(): Promise<boolean> {
  const maxAttempts = 20;
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const result = await requestJson('GET', '/health');
      if (result.status === 200) {
        return true;
      }
    } catch (_error) {
      // aguardando subir
    }

    await wait(200);
  }

  return false;
}

BeforeAll(async function () {
  const alreadyRunning = await waitForBackendReady();
  if (alreadyRunning) {
    return;
  }

  backendProcess = spawn('node', ['-r', 'ts-node/register', 'backend/src/index.ts'], {
    cwd: path.join(__dirname, '../..'),
    stdio: 'ignore'
  });
  startedByThisFile = true;

  const up = await waitForBackendReady();
  if (!up) {
    throw new Error('Backend nao iniciou para testes de turmas.');
  }
});

AfterAll(async function () {
  if (backendProcess && startedByThisFile) {
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }

  startedByThisFile = false;
  await wait(100);
});

Before(function () {
  lastStatus = null;
  lastBody = '';
  lastError = null;
  ultimaTurmaId = null;
});

After(function () {
  if (jsonRepository.exists('turmas.json')) {
    jsonRepository.delete('turmas.json');
  }
});

Given('o ambiente de turmas esta limpo', function () {
  if (jsonRepository.exists('turmas.json')) {
    jsonRepository.delete('turmas.json');
  }
});

When('eu crio uma turma com nome {string} e descricao {string}', async function (nome: string, descricao: string) {
  try {
    const result = await requestJson('POST', '/turmas', { nome, descricao });
    lastStatus = result.status;
    lastBody = result.body;

    if (lastStatus === 201) {
      const turma = JSON.parse(lastBody) as TurmaPayload;
      ultimaTurmaId = turma.id;
    }
  } catch (error) {
    lastError = error as Error;
  }
});

Given('existe uma turma com nome {string} e descricao {string}', async function (nome: string, descricao: string) {
  const result = await requestJson('POST', '/turmas', { nome, descricao });
  if (result.status !== 201) {
    throw new Error(`Falha ao preparar turma: ${result.status} ${result.body}`);
  }
  const turma = JSON.parse(result.body) as TurmaPayload;
  ultimaTurmaId = turma.id;
});

When('eu listo as turmas', async function () {
  try {
    const result = await requestJson('GET', '/turmas');
    lastStatus = result.status;
    lastBody = result.body;
  } catch (error) {
    lastError = error as Error;
  }
});

When('eu atualizo a turma existente para nome {string}', async function (novoNome: string) {
  if (!ultimaTurmaId) {
    throw new Error('Turma de referencia nao encontrada para atualizacao.');
  }

  try {
    const result = await requestJson('PUT', `/turmas/${ultimaTurmaId}`, { nome: novoNome });
    lastStatus = result.status;
    lastBody = result.body;
  } catch (error) {
    lastError = error as Error;
  }
});

When('eu removo a turma existente', async function () {
  if (!ultimaTurmaId) {
    throw new Error('Turma de referencia nao encontrada para remocao.');
  }

  try {
    const result = await requestJson('DELETE', `/turmas/${ultimaTurmaId}`);
    lastStatus = result.status;
    lastBody = result.body;

    const listResult = await requestJson('GET', '/turmas');
    lastBody = listResult.body;
  } catch (error) {
    lastError = error as Error;
  }
});

When('eu tento criar uma turma sem nome', async function () {
  try {
    const result = await requestJson('POST', '/turmas', { descricao: 'Sem nome' });
    lastStatus = result.status;
    lastBody = result.body;
  } catch (error) {
    lastError = error as Error;
  }
});

When('eu tento atualizar uma turma inexistente', async function () {
  try {
    const result = await requestJson('PUT', '/turmas/id-inexistente', { nome: 'Nome X' });
    lastStatus = result.status;
    lastBody = result.body;
  } catch (error) {
    lastError = error as Error;
  }
});

When('eu tento remover uma turma inexistente', async function () {
  try {
    const result = await requestJson('DELETE', '/turmas/id-inexistente');
    lastStatus = result.status;
    lastBody = result.body;
  } catch (error) {
    lastError = error as Error;
  }
});

Given('existem duas turmas cadastradas {string} e {string}', async function (nomeA: string, nomeB: string) {
  const r1 = await requestJson('POST', '/turmas', { nome: nomeA, descricao: `${nomeA} descricao` });
  const r2 = await requestJson('POST', '/turmas', { nome: nomeB, descricao: `${nomeB} descricao` });

  if (r1.status !== 201 || r2.status !== 201) {
    throw new Error('Falha ao criar turmas de regressao.');
  }

  const turmaA = JSON.parse(r1.body) as TurmaPayload;
  ultimaTurmaId = turmaA.id;
});

When('eu atualizo somente a turma {string} para {string}', async function (_nomeAtual: string, novoNome: string) {
  if (!ultimaTurmaId) {
    throw new Error('Turma alvo nao encontrada para regressao.');
  }

  const result = await requestJson('PUT', `/turmas/${ultimaTurmaId}`, { nome: novoNome });
  lastStatus = result.status;
  lastBody = result.body;
});

Then('o status da resposta de turmas deve ser {int}', function (status: number) {
  if (lastError) {
    throw lastError;
  }

  if (lastStatus !== status) {
    throw new Error(`Status esperado ${status}, recebido ${lastStatus}. Corpo: ${lastBody}`);
  }
});

Then('a resposta de turmas deve conter o nome {string}', function (nome: string) {
  if (!lastBody.includes(nome)) {
    throw new Error(`Nome ${nome} nao encontrado na resposta: ${lastBody}`);
  }
});

Then('a lista de turmas deve conter {int} item', function (quantidade: number) {
  const parsed = JSON.parse(lastBody) as TurmaPayload[];
  if (parsed.length !== quantidade) {
    throw new Error(`Quantidade esperada ${quantidade}, encontrada ${parsed.length}`);
  }
});

Then('a lista de turmas deve conter o nome {string}', function (nome: string) {
  const parsed = JSON.parse(lastBody) as TurmaPayload[];
  const found = parsed.some((t) => t.nome === nome);
  if (!found) {
    throw new Error(`Nome ${nome} nao encontrado na lista.`);
  }
});

Then('a resposta de erro de turmas deve conter {string}', function (texto: string) {
  if (!lastBody.includes(texto)) {
    throw new Error(`Texto de erro ${texto} nao encontrado em ${lastBody}`);
  }
});

Then('a turma {string} deve permanecer inalterada', async function (nome: string) {
  const result = await requestJson('GET', '/turmas');
  const parsed = JSON.parse(result.body) as TurmaPayload[];
  const found = parsed.find((t) => t.nome === nome);

  if (!found) {
    throw new Error(`Turma ${nome} nao encontrada apos atualizacao de outra turma.`);
  }
});
