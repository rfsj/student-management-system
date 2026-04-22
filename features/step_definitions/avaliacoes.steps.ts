import { After, AfterAll, Before, BeforeAll, Given, Then, When } from '@cucumber/cucumber';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { ChildProcess, spawn } from 'child_process';

type AlunoPayload = {
  id: string;
  nome: string;
};

type TurmaPayload = {
  id: string;
  nome: string;
};

type MetaPayload = {
  id: string;
  nome: string;
};

type AvaliacaoPayload = {
  id: string;
  turmaId: string;
  alunoId: string;
  metaId: string;
  conceito: string;
};

type TurmaComAvaliacoesPayload = {
  turma: TurmaPayload;
  alunos: AlunoPayload[];
  metas: MetaPayload[];
  avaliacoes: AvaliacaoPayload[];
};

let backendProcess: ChildProcess | null = null;
let startedByThisFile = false;
const BACKEND_PORT = 3100;
let lastStatus: number | null = null;
let lastBody = '';
let lastError: Error | null = null;

let alunoId: string | null = null;
let alunoNaoMatriculadoId: string | null = null;
let turmaPrincipalId: string | null = null;
let turmaSecundariaId: string | null = null;
let metaId: string | null = null;
let avaliacaoId: string | null = null;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dataFilePath(filename: string): string {
  return path.join(process.cwd(), 'backend/src/data', filename);
}

function deleteDataFile(filename: string): void {
  const filePath = dataFilePath(filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
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
        port: BACKEND_PORT,
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
      const response = await requestJson('GET', '/health');
      if (response.status === 200) {
        return true;
      }
    } catch (_error) {
      // aguardando backend
    }

    await wait(200);
  }

  return false;
}

async function criarAluno(nome: string): Promise<string> {
  const response = await requestJson('POST', '/alunos', {
    nome,
    cpf: '22345678901',
    email: `${nome.toLowerCase()}@escola.com`
  });
  if (response.status !== 201) {
    throw new Error(`Falha ao criar aluno: ${response.status} ${response.body}`);
  }

  return (JSON.parse(response.body) as AlunoPayload).id;
}

async function criarTurma(nome: string): Promise<string> {
  const response = await requestJson('POST', '/turmas', {
    nome,
    descricao: `Turma ${nome}`,
    ano: 2026,
    semestre: 1
  });
  if (response.status !== 201) {
    throw new Error(`Falha ao criar turma: ${response.status} ${response.body}`);
  }

  return (JSON.parse(response.body) as TurmaPayload).id;
}

async function matricular(turmaId: string, alunoIdParam: string): Promise<void> {
  const response = await requestJson('POST', `/turmas/${turmaId}/alunos/${alunoIdParam}`);
  if (response.status !== 200) {
    throw new Error(`Falha ao matricular aluno: ${response.status} ${response.body}`);
  }
}

async function obterPrimeiraMetaId(): Promise<string> {
  const response = await requestJson('GET', '/metas');
  if (response.status !== 200) {
    throw new Error(`Falha ao listar metas: ${response.status} ${response.body}`);
  }

  const metas = JSON.parse(response.body) as MetaPayload[];
  if (metas.length === 0) {
    throw new Error('Nenhuma meta disponível para testes.');
  }

  return metas[0].id;
}

BeforeAll(async function () {
  const alreadyRunning = await waitForBackendReady();
  if (alreadyRunning) {
    return;
  }

  backendProcess = spawn('node', ['-r', 'ts-node/register', 'backend/src/index.ts'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(BACKEND_PORT) },
    stdio: 'ignore'
  });
  startedByThisFile = true;

  const up = await waitForBackendReady();
  if (!up) {
    throw new Error('Backend nao iniciou para testes de avaliacoes.');
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
  alunoNaoMatriculadoId = null;
  turmaPrincipalId = null;
  turmaSecundariaId = null;
  metaId = null;
  avaliacaoId = null;
});

After(function () {
  deleteDataFile('avaliacoes.json');
  deleteDataFile('turmas.json');
  deleteDataFile('alunos.json');
  deleteDataFile('metas.json');
});

Given('o ambiente de avaliacoes esta limpo', function () {
  deleteDataFile('avaliacoes.json');
  deleteDataFile('turmas.json');
  deleteDataFile('alunos.json');
  deleteDataFile('metas.json');
});

Given('existe um aluno matriculado para avaliacao', async function () {
  const aluno = await criarAluno('Aluno Avaliacao');
  const turma = await criarTurma('Turma Avaliacao');
  await matricular(turma, aluno);

  alunoId = aluno;
  turmaPrincipalId = turma;
});

Given('existe uma meta para avaliacao', async function () {
  metaId = await obterPrimeiraMetaId();
});

When('eu lanço avaliacao com conceito {string}', async function (conceito: string) {
  if (!alunoId || !turmaPrincipalId || !metaId) {
    throw new Error('Contexto de avaliacao incompleto para lancamento.');
  }

  try {
    const response = await requestJson('POST', '/avaliacoes', {
      turmaId: turmaPrincipalId,
      alunoId,
      metaId,
      conceito
    });

    lastStatus = response.status;
    lastBody = response.body;

    if (response.status === 201) {
      avaliacaoId = (JSON.parse(response.body) as AvaliacaoPayload).id;
    }
  } catch (error) {
    lastError = error as Error;
  }
});

Given('existe avaliacao lançada com conceito {string}', async function (conceito: string) {
  if (!alunoId || !turmaPrincipalId || !metaId) {
    throw new Error('Contexto de avaliacao incompleto para preparacao.');
  }

  const response = await requestJson('POST', '/avaliacoes', {
    turmaId: turmaPrincipalId,
    alunoId,
    metaId,
    conceito
  });

  if (response.status !== 201) {
    throw new Error(`Falha ao preparar avaliacao: ${response.status} ${response.body}`);
  }

  avaliacaoId = (JSON.parse(response.body) as AvaliacaoPayload).id;
});

When('eu altero a avaliacao para conceito {string}', async function (conceito: string) {
  if (!avaliacaoId) {
    throw new Error('Avaliacao nao preparada para alteracao.');
  }

  try {
    const response = await requestJson('PUT', `/avaliacoes/${avaliacaoId}`, { conceito });
    lastStatus = response.status;
    lastBody = response.body;
  } catch (error) {
    lastError = error as Error;
  }
});

Given('existe um aluno nao matriculado para avaliacao', async function () {
  alunoNaoMatriculadoId = await criarAluno('Aluno Solto');
});

Given('existe uma turma para avaliacao', async function () {
  turmaPrincipalId = await criarTurma('Turma Sem Matricula');
});

When('eu lanço avaliacao para aluno fora da turma', async function () {
  if (!turmaPrincipalId || !alunoNaoMatriculadoId || !metaId) {
    throw new Error('Contexto incompleto para teste de aluno fora da turma.');
  }

  try {
    const response = await requestJson('POST', '/avaliacoes', {
      turmaId: turmaPrincipalId,
      alunoId: alunoNaoMatriculadoId,
      metaId,
      conceito: 'MPA'
    });

    lastStatus = response.status;
    lastBody = response.body;
  } catch (error) {
    lastError = error as Error;
  }
});

When('eu lanço avaliacao com meta inexistente', async function () {
  if (!turmaPrincipalId || !alunoId) {
    throw new Error('Contexto incompleto para teste de meta inexistente.');
  }

  try {
    const response = await requestJson('POST', '/avaliacoes', {
      turmaId: turmaPrincipalId,
      alunoId,
      metaId: 'meta-inexistente',
      conceito: 'MPA'
    });

    lastStatus = response.status;
    lastBody = response.body;
  } catch (error) {
    lastError = error as Error;
  }
});

When('eu visualizo as avaliacoes da turma', async function () {
  if (!turmaPrincipalId) {
    throw new Error('Turma nao preparada para visualizacao de avaliacoes.');
  }

  try {
    const response = await requestJson('GET', `/turmas/${turmaPrincipalId}/avaliacoes`);
    lastStatus = response.status;
    lastBody = response.body;
  } catch (error) {
    lastError = error as Error;
  }
});

Given('existe um aluno matriculado em duas turmas', async function () {
  const aluno = await criarAluno('Aluno Duas Turmas');
  const turmaA = await criarTurma('Turma A');
  const turmaB = await criarTurma('Turma B');

  await matricular(turmaA, aluno);
  await matricular(turmaB, aluno);

  alunoId = aluno;
  turmaPrincipalId = turmaA;
  turmaSecundariaId = turmaB;
});

When('eu lanço avaliacao apenas na turma principal', async function () {
  if (!turmaPrincipalId || !alunoId || !metaId) {
    throw new Error('Contexto incompleto para lancamento na turma principal.');
  }

  const response = await requestJson('POST', '/avaliacoes', {
    turmaId: turmaPrincipalId,
    alunoId,
    metaId,
    conceito: 'MA'
  });

  if (response.status !== 201) {
    throw new Error(`Falha ao lançar avaliação na turma principal: ${response.status} ${response.body}`);
  }
});

Then('a turma secundaria deve permanecer sem avaliacao', async function () {
  if (!turmaSecundariaId) {
    throw new Error('Turma secundaria nao disponivel para regressao.');
  }

  const response = await requestJson('GET', `/turmas/${turmaSecundariaId}/avaliacoes`);
  if (response.status !== 200) {
    throw new Error(`Falha ao visualizar turma secundaria: ${response.status} ${response.body}`);
  }

  const payload = JSON.parse(response.body) as TurmaComAvaliacoesPayload;
  if (payload.avaliacoes.length !== 0) {
    throw new Error('Regressao detectada: turma secundaria recebeu avaliacao indevida.');
  }
});

Then('o status da resposta de avaliacoes deve ser {int}', function (status: number) {
  if (lastError) {
    throw lastError;
  }

  if (lastStatus !== status) {
    throw new Error(`Status esperado ${status}, recebido ${lastStatus}. Corpo: ${lastBody}`);
  }
});

Then('a resposta de avaliacoes deve conter o conceito {string}', function (conceito: string) {
  if (!lastBody.includes(conceito)) {
    throw new Error(`Conceito ${conceito} nao encontrado na resposta: ${lastBody}`);
  }
});

Then('a resposta de erro de avaliacoes deve conter {string}', function (texto: string) {
  if (!lastBody.includes(texto)) {
    throw new Error(`Texto de erro ${texto} nao encontrado em ${lastBody}`);
  }
});

Then('a visualizacao da turma deve conter {int} avaliacao', function (quantidade: number) {
  const payload = JSON.parse(lastBody) as TurmaComAvaliacoesPayload;
  if (payload.avaliacoes.length !== quantidade) {
    throw new Error(`Quantidade esperada ${quantidade}, encontrada ${payload.avaliacoes.length}`);
  }
});
