import { After, AfterAll, Before, BeforeAll, Given, Then, When } from '@cucumber/cucumber';
import http from 'http';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

import jsonRepository from '../../backend/src/repositories/jsonRepository';

type AlunoPayload = {
  id: string;
  nome: string;
  email?: string;
  dataCriacao: string;
  dataAtualizacao: string;
};

let backendProcess: ChildProcess | null = null;
let startedByThisFile = false;
let lastStatus: number | null = null;
let lastBody = '';
let lastError: Error | null = null;
let ultimoAlunoId: string | null = null;

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
    throw new Error('Backend nao iniciou para testes de alunos.');
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
  ultimoAlunoId = null;
});

After(function () {
  if (jsonRepository.exists('alunos.json')) {
    jsonRepository.delete('alunos.json');
  }
});

Given('o ambiente de alunos esta limpo', function () {
  if (jsonRepository.exists('alunos.json')) {
    jsonRepository.delete('alunos.json');
  }
});

When('eu crio um aluno com nome {string} e email {string}', async function (nome: string, email: string) {
  try {
    const result = await requestJson('POST', '/alunos', { nome, email });
    lastStatus = result.status;
    lastBody = result.body;

    if (lastStatus === 201) {
      const aluno = JSON.parse(lastBody) as AlunoPayload;
      ultimoAlunoId = aluno.id;
    }
  } catch (error) {
    lastError = error as Error;
  }
});

Given('existe um aluno com nome {string} e email {string}', async function (nome: string, email: string) {
  const result = await requestJson('POST', '/alunos', { nome, email });
  if (result.status !== 201) {
    throw new Error(`Falha ao preparar aluno: ${result.status} ${result.body}`);
  }
  const aluno = JSON.parse(result.body) as AlunoPayload;
  ultimoAlunoId = aluno.id;
});

When('eu listo os alunos', async function () {
  try {
    const result = await requestJson('GET', '/alunos');
    lastStatus = result.status;
    lastBody = result.body;
  } catch (error) {
    lastError = error as Error;
  }
});

When('eu atualizo o aluno existente para nome {string}', async function (novoNome: string) {
  if (!ultimoAlunoId) {
    throw new Error('Aluno de referencia nao encontrado para atualizacao.');
  }

  try {
    const result = await requestJson('PUT', `/alunos/${ultimoAlunoId}`, { nome: novoNome });
    lastStatus = result.status;
    lastBody = result.body;
  } catch (error) {
    lastError = error as Error;
  }
});

When('eu removo o aluno existente', async function () {
  if (!ultimoAlunoId) {
    throw new Error('Aluno de referencia nao encontrado para remocao.');
  }

  try {
    const result = await requestJson('DELETE', `/alunos/${ultimoAlunoId}`);
    lastStatus = result.status;
    lastBody = result.body;

    const listResult = await requestJson('GET', '/alunos');
    lastBody = listResult.body;
  } catch (error) {
    lastError = error as Error;
  }
});

When('eu tento criar um aluno sem nome', async function () {
  try {
    const result = await requestJson('POST', '/alunos', { email: 'semnome@escola.com' });
    lastStatus = result.status;
    lastBody = result.body;
  } catch (error) {
    lastError = error as Error;
  }
});

When('eu tento atualizar um aluno inexistente', async function () {
  try {
    const result = await requestJson('PUT', '/alunos/id-inexistente', { nome: 'Nome X' });
    lastStatus = result.status;
    lastBody = result.body;
  } catch (error) {
    lastError = error as Error;
  }
});

When('eu tento remover um aluno inexistente', async function () {
  try {
    const result = await requestJson('DELETE', '/alunos/id-inexistente');
    lastStatus = result.status;
    lastBody = result.body;
  } catch (error) {
    lastError = error as Error;
  }
});

Given('existem dois alunos cadastrados {string} e {string}', async function (nomeA: string, nomeB: string) {
  const r1 = await requestJson('POST', '/alunos', { nome: nomeA, email: `${nomeA.toLowerCase()}@escola.com` });
  const r2 = await requestJson('POST', '/alunos', { nome: nomeB, email: `${nomeB.toLowerCase()}@escola.com` });

  if (r1.status !== 201 || r2.status !== 201) {
    throw new Error('Falha ao criar alunos de regressao.');
  }

  const alunoA = JSON.parse(r1.body) as AlunoPayload;
  ultimoAlunoId = alunoA.id;
});

When('eu atualizo somente o aluno {string} para {string}', async function (_nomeAtual: string, novoNome: string) {
  if (!ultimoAlunoId) {
    throw new Error('Aluno alvo nao encontrado para regressao.');
  }

  const result = await requestJson('PUT', `/alunos/${ultimoAlunoId}`, { nome: novoNome });
  lastStatus = result.status;
  lastBody = result.body;
});

Then('o status da resposta de alunos deve ser {int}', function (status: number) {
  if (lastError) {
    throw lastError;
  }

  if (lastStatus !== status) {
    throw new Error(`Status esperado ${status}, recebido ${lastStatus}. Corpo: ${lastBody}`);
  }
});

Then('a resposta de alunos deve conter o nome {string}', function (nome: string) {
  if (!lastBody.includes(nome)) {
    throw new Error(`Nome ${nome} nao encontrado na resposta: ${lastBody}`);
  }
});

Then('a lista de alunos deve conter {int} item', function (quantidade: number) {
  const parsed = JSON.parse(lastBody) as AlunoPayload[];
  if (parsed.length !== quantidade) {
    throw new Error(`Quantidade esperada ${quantidade}, encontrada ${parsed.length}`);
  }
});

Then('a lista de alunos deve conter o nome {string}', function (nome: string) {
  const parsed = JSON.parse(lastBody) as AlunoPayload[];
  const found = parsed.some((a) => a.nome === nome);
  if (!found) {
    throw new Error(`Nome ${nome} nao encontrado na lista.`);
  }
});

Then('a resposta de erro de alunos deve conter {string}', function (texto: string) {
  if (!lastBody.includes(texto)) {
    throw new Error(`Texto de erro ${texto} nao encontrado em ${lastBody}`);
  }
});

Then('o aluno {string} deve permanecer inalterado', async function (nome: string) {
  const result = await requestJson('GET', '/alunos');
  const parsed = JSON.parse(result.body) as AlunoPayload[];
  const found = parsed.find((a) => a.nome === nome);

  if (!found) {
    throw new Error(`Aluno ${nome} nao encontrado apos atualizacao de outro aluno.`);
  }
});
