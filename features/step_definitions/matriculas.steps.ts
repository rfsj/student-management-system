import { After, AfterAll, Before, BeforeAll, Given, Then, When } from '@cucumber/cucumber';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

type AlunoPayload = {
  id: string;
  nome: string;
  email?: string;
  dataCriacao: string;
  dataAtualizacao: string;
};

type TurmaPayload = {
  id: string;
  nome: string;
  descricao?: string;
  alunoIds?: string[];
  dataCriacao: string;
  dataAtualizacao: string;
};

type TurmasContainer = {
  versao: string;
  ultimaAtualizacao: string;
  itens: TurmaPayload[];
};

type TurmaComAlunosPayload = {
  turma: TurmaPayload;
  alunos: AlunoPayload[];
};

let backendProcess: ChildProcess | null = null;
let startedByThisFile = false;
let lastStatus: number | null = null;
let lastBody = '';
let lastError: Error | null = null;
let alunoId: string | null = null;
let turmaId: string | null = null;

const dataFilePath = (filename: string): string => path.join(process.cwd(), 'backend/src/data', filename);

function deleteDataFile(filename: string): void {
  const filePath = dataFilePath(filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function readJsonData<T>(filename: string): { success: boolean; data?: T; error?: string } {
  try {
    const filePath = dataFilePath(filename);
    if (!fs.existsSync(filePath)) {
      return { success: false, error: `Arquivo não encontrado: ${filename}` };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, data: JSON.parse(content) as T };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

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
      // aguardando backend
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
    cwd: process.cwd(),
    stdio: 'ignore'
  });
  startedByThisFile = true;

  const up = await waitForBackendReady();
  if (!up) {
    throw new Error('Backend nao iniciou para testes de matriculas.');
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
  alunoId = null;
  turmaId = null;
});

After(function () {
  deleteDataFile('alunos.json');
  deleteDataFile('turmas.json');
});

Given('o ambiente de matriculas esta limpo', function () {
  deleteDataFile('alunos.json');
  deleteDataFile('turmas.json');
});

Given('existe um aluno para matricula com nome {string}', async function (nome: string) {
  const result = await requestJson('POST', '/alunos', {
    nome,
    email: `${nome.toLowerCase()}@escola.com`
  });

  if (result.status !== 201) {
    throw new Error(`Falha ao preparar aluno: ${result.status} ${result.body}`);
  }

  const aluno = JSON.parse(result.body) as AlunoPayload;
  alunoId = aluno.id;
});

Given('existe uma turma para matricula com nome {string}', async function (nome: string) {
  const result = await requestJson('POST', '/turmas', {
    nome,
    descricao: `Turma ${nome}`
  });

  if (result.status !== 201) {
    throw new Error(`Falha ao preparar turma: ${result.status} ${result.body}`);
  }

  const turma = JSON.parse(result.body) as TurmaPayload;
  turmaId = turma.id;
});

When('eu matriculo o aluno na turma', async function () {
  if (!alunoId || !turmaId) {
    throw new Error('Aluno ou turma nao preparados para matricula.');
  }

  try {
    const result = await requestJson('POST', `/turmas/${turmaId}/alunos/${alunoId}`);
    lastStatus = result.status;
    lastBody = result.body;
  } catch (error) {
    lastError = error as Error;
  }
});

Given('o aluno ja esta matriculado na turma', async function () {
  if (!alunoId || !turmaId) {
    throw new Error('Aluno ou turma nao preparados para pre-matricula.');
  }

  const result = await requestJson('POST', `/turmas/${turmaId}/alunos/${alunoId}`);
  if (result.status !== 200) {
    throw new Error(`Falha na pre-matricula: ${result.status} ${result.body}`);
  }
});

When('eu tento matricular novamente o mesmo aluno na turma', async function () {
  if (!alunoId || !turmaId) {
    throw new Error('Aluno ou turma nao preparados para matricula duplicada.');
  }

  try {
    const result = await requestJson('POST', `/turmas/${turmaId}/alunos/${alunoId}`);
    lastStatus = result.status;
    lastBody = result.body;
  } catch (error) {
    lastError = error as Error;
  }
});

When('eu tento matricular um aluno inexistente', async function () {
  if (!turmaId) {
    throw new Error('Turma nao preparada para teste com aluno inexistente.');
  }

  try {
    const result = await requestJson('POST', `/turmas/${turmaId}/alunos/aluno-inexistente`);
    lastStatus = result.status;
    lastBody = result.body;
  } catch (error) {
    lastError = error as Error;
  }
});

When('eu tento matricular em uma turma inexistente', async function () {
  if (!alunoId) {
    throw new Error('Aluno nao preparado para teste com turma inexistente.');
  }

  try {
    const result = await requestJson('POST', `/turmas/turma-inexistente/alunos/${alunoId}`);
    lastStatus = result.status;
    lastBody = result.body;
  } catch (error) {
    lastError = error as Error;
  }
});

When('eu removo a matricula do aluno na turma', async function () {
  if (!alunoId || !turmaId) {
    throw new Error('Aluno ou turma nao preparados para desmatricula.');
  }

  try {
    const result = await requestJson('DELETE', `/turmas/${turmaId}/alunos/${alunoId}`);
    lastStatus = result.status;
    lastBody = result.body;
  } catch (error) {
    lastError = error as Error;
  }
});

When('eu tento excluir o aluno que possui vinculo', async function () {
  if (!alunoId) {
    throw new Error('Aluno nao preparado para teste de exclusao com vinculo.');
  }

  try {
    const result = await requestJson('DELETE', `/alunos/${alunoId}`);
    lastStatus = result.status;
    lastBody = result.body;
  } catch (error) {
    lastError = error as Error;
  }
});

When('eu visualizo a turma com seus alunos', async function () {
  if (!turmaId) {
    throw new Error('Turma nao preparada para visualizacao.');
  }

  try {
    const result = await requestJson('GET', `/turmas/${turmaId}/alunos`);
    lastStatus = result.status;
    lastBody = result.body;
  } catch (error) {
    lastError = error as Error;
  }
});

Then('o status da resposta de matriculas deve ser {int}', function (status: number) {
  if (lastError) {
    throw lastError;
  }

  if (lastStatus !== status) {
    throw new Error(`Status esperado ${status}, recebido ${lastStatus}. Corpo: ${lastBody}`);
  }
});

Then('a resposta de erro de matriculas deve conter {string}', function (texto: string) {
  if (!lastBody.includes(texto)) {
    throw new Error(`Texto de erro ${texto} nao encontrado em ${lastBody}`);
  }
});

Then('a turma deve conter {int} aluno matriculado', async function (quantidade: number) {
  if (!turmaId) {
    throw new Error('Turma nao preparada para contagem de matriculas.');
  }

  const result = await requestJson('GET', `/turmas/${turmaId}/alunos`);
  const parsed = JSON.parse(result.body) as TurmaComAlunosPayload;

  if (parsed.alunos.length !== quantidade) {
    throw new Error(`Quantidade esperada ${quantidade}, encontrada ${parsed.alunos.length}`);
  }
});

Then('a visualizacao da turma deve conter o aluno {string}', function (nome: string) {
  const parsed = JSON.parse(lastBody) as TurmaComAlunosPayload;
  const found = parsed.alunos.some((aluno) => aluno.nome === nome);

  if (!found) {
    throw new Error(`Aluno ${nome} nao encontrado na visualizacao da turma.`);
  }
});

Then('o arquivo de turmas deve armazenar o vinculo de matricula', function () {
  if (!alunoId || !turmaId) {
    throw new Error('Aluno ou turma nao preparados para validacao de persistencia.');
  }

  const container = readJsonData<TurmasContainer>('turmas.json');
  if (!container.success || !container.data) {
    throw new Error(`Falha ao ler turmas.json para validar persistencia: ${container.error}`);
  }

  const turma = container.data.itens.find((item) => item.id === turmaId);
  if (!turma) {
    throw new Error('Turma nao encontrada no arquivo turmas.json.');
  }

  const alunoIds = turma.alunoIds ?? [];
  if (!alunoIds.includes(alunoId)) {
    throw new Error('Vinculo de matricula nao foi persistido em turmas.json.');
  }
});
