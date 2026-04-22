import { After, AfterAll, Before, BeforeAll, Given, Then, When } from '@cucumber/cucumber';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { ChildProcess, spawn } from 'child_process';

type AlunoPayload = { id: string; nome: string };
type TurmaPayload = { id: string; nome: string };
type MetaPayload = { id: string; nome: string };
type AvaliacaoPayload = { id: string; turmaId: string; alunoId: string; metaId: string; conceito: string };
type AlteracaoPayload = {
  id: string;
  avaliacaoId: string;
  alunoId: string;
  turmaId: string;
  metaId: string;
  valorAnterior?: string;
  novoValor: string;
  data: string;
  dataSimples: string;
};
type ConsolidadoPayload = {
  id: string;
  alunoId: string;
  dataSimples: string;
  dataGeracao: string;
  alteracoes: AlteracaoPayload[];
};

let backendProcess: ChildProcess | null = null;
let startedByThisFile = false;
const BACKEND_PORT = 3100;
let lastStatus: number | null = null;
let lastBody = '';
let lastError: Error | null = null;

let alunoId: string | null = null;
let turmaAId: string | null = null;
let turmaBId: string | null = null;
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
  for (let i = 0; i < 20; i += 1) {
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

async function startBackend(): Promise<void> {
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

  const ready = await waitForBackendReady();
  if (!ready) {
    throw new Error('Backend nao iniciou para testes de consolidacao.');
  }
}

async function stopBackend(): Promise<void> {
  if (backendProcess && startedByThisFile) {
    backendProcess.kill('SIGTERM');
    backendProcess = null;
    startedByThisFile = false;
    await wait(200);
  }
}

async function criarAluno(nome: string): Promise<string> {
  const response = await requestJson('POST', '/alunos', {
    nome,
    cpf: '32345678901',
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

async function matricularAluno(turmaId: string, alunoIdParam: string): Promise<void> {
  const response = await requestJson('POST', `/turmas/${turmaId}/alunos/${alunoIdParam}`);
  if (response.status !== 200) {
    throw new Error(`Falha ao matricular aluno: ${response.status} ${response.body}`);
  }
}

async function obterMetaId(): Promise<string> {
  const response = await requestJson('GET', '/metas');
  if (response.status !== 200) {
    throw new Error(`Falha ao listar metas: ${response.status} ${response.body}`);
  }

  const metas = JSON.parse(response.body) as MetaPayload[];
  if (metas.length === 0) {
    throw new Error('Nenhuma meta encontrada.');
  }

  return metas[0].id;
}

async function criarAvaliacao(turmaId: string, alunoIdParam: string, metaIdParam: string, conceito: string): Promise<string> {
  const response = await requestJson('POST', '/avaliacoes', {
    turmaId,
    alunoId: alunoIdParam,
    metaId: metaIdParam,
    conceito
  });

  if (response.status !== 201) {
    throw new Error(`Falha ao criar avaliacao: ${response.status} ${response.body}`);
  }

  return (JSON.parse(response.body) as AvaliacaoPayload).id;
}

function readJsonFile<T>(filename: string): T {
  const filePath = dataFilePath(filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

function writeJsonFile(filename: string, value: unknown): void {
  const filePath = dataFilePath(filename);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
}

BeforeAll(async function () {
  await startBackend();
});

AfterAll(async function () {
  await stopBackend();
});

Before(function () {
  lastStatus = null;
  lastBody = '';
  lastError = null;

  alunoId = null;
  turmaAId = null;
  turmaBId = null;
  metaId = null;
  avaliacaoId = null;
});

After(function () {
  deleteDataFile('avaliacoes.json');
  deleteDataFile('alunos.json');
  deleteDataFile('turmas.json');
  deleteDataFile('metas.json');
  deleteDataFile('alteracoes-avaliacoes.json');
  deleteDataFile('consolidacoes-avaliacoes.json');
});

Given('o ambiente de consolidacao esta limpo', function () {
  deleteDataFile('avaliacoes.json');
  deleteDataFile('alunos.json');
  deleteDataFile('turmas.json');
  deleteDataFile('metas.json');
  deleteDataFile('alteracoes-avaliacoes.json');
  deleteDataFile('consolidacoes-avaliacoes.json');
});

Given('existe uma avaliacao base para consolidacao', async function () {
  alunoId = await criarAluno('Aluno Consolidacao');
  turmaAId = await criarTurma('Turma Consolidacao A');
  await matricularAluno(turmaAId, alunoId);
  metaId = await obterMetaId();
  avaliacaoId = await criarAvaliacao(turmaAId, alunoId, metaId, 'MANA');
});

When('eu altero o conceito da avaliacao para {string}', async function (conceito: string) {
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

Then('o resumo diario do aluno deve conter {int} alteracoes', async function (quantidade: number) {
  if (!alunoId) {
    throw new Error('Aluno nao preparado para consulta de consolidacao.');
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const response = await requestJson('GET', `/consolidacoes/alunos/${alunoId}?data=${hoje}`);
  if (response.status !== 200) {
    throw new Error(`Falha ao consultar consolidacao: ${response.status} ${response.body}`);
  }

  const payload = JSON.parse(response.body) as ConsolidadoPayload[];
  const total = payload[0]?.alteracoes.length ?? 0;

  if (total !== quantidade) {
    throw new Error(`Esperado ${quantidade} alteracoes, encontrado ${total}.`);
  }
});

Then('deve existir apenas 1 consolidacao para o aluno no dia atual', async function () {
  if (!alunoId) {
    throw new Error('Aluno nao preparado para validacao de consolidacao diaria.');
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const response = await requestJson('GET', `/consolidacoes/alunos/${alunoId}?data=${hoje}`);
  const payload = JSON.parse(response.body) as ConsolidadoPayload[];

  if (payload.length !== 1) {
    throw new Error(`Esperado 1 consolidacao no dia, encontrado ${payload.length}.`);
  }
});

Given('existe um aluno com duas turmas para consolidacao', async function () {
  alunoId = await criarAluno('Aluno Multi Turma');
  turmaAId = await criarTurma('Turma Multi A');
  turmaBId = await criarTurma('Turma Multi B');
  await matricularAluno(turmaAId, alunoId);
  await matricularAluno(turmaBId, alunoId);
  metaId = await obterMetaId();
});

When('eu lanço avaliacoes nas duas turmas no mesmo dia', async function () {
  if (!alunoId || !turmaAId || !turmaBId || !metaId) {
    throw new Error('Contexto incompleto para lancamentos em duas turmas.');
  }

  await criarAvaliacao(turmaAId, alunoId, metaId, 'MPA');
  await criarAvaliacao(turmaBId, alunoId, metaId, 'MA');
});

Then('o resumo diario do aluno deve conter alteracoes de {int} turmas', async function (quantidade: number) {
  if (!alunoId) {
    throw new Error('Aluno nao preparado para consulta de turmas distintas.');
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const response = await requestJson('GET', `/consolidacoes/alunos/${alunoId}?data=${hoje}`);
  if (response.status !== 200) {
    throw new Error(`Falha ao consultar consolidacao: ${response.status} ${response.body}`);
  }

  const payload = JSON.parse(response.body) as ConsolidadoPayload[];
  const turmas = new Set((payload[0]?.alteracoes ?? []).map((item) => item.turmaId));

  if (turmas.size !== quantidade) {
    throw new Error(`Esperado consolidacao com ${quantidade} turmas, encontrado ${turmas.size}.`);
  }
});

When('eu movo a primeira alteracao para o dia anterior', function () {
  const alteracoes = readJsonFile<{ versao: string; ultimaAtualizacao: string; itens: AlteracaoPayload[] }>(
    'alteracoes-avaliacoes.json'
  );

  if (alteracoes.itens.length === 0) {
    throw new Error('Nenhuma alteracao encontrada para ajustar data.');
  }

  const primeira = alteracoes.itens[0];
  const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000);
  primeira.data = ontem.toISOString();
  primeira.dataSimples = ontem.toISOString().slice(0, 10);

  writeJsonFile('alteracoes-avaliacoes.json', alteracoes);
});

When('eu reprocesso as consolidacoes', async function () {
  const response = await requestJson('POST', '/consolidacoes/reprocessar');
  if (response.status !== 200) {
    throw new Error(`Falha ao reprocessar consolidacoes: ${response.status} ${response.body}`);
  }
});

Then('o aluno deve possuir consolidacoes em {int} dias diferentes', async function (quantidade: number) {
  if (!alunoId) {
    throw new Error('Aluno nao preparado para validacao por dias diferentes.');
  }

  const response = await requestJson('GET', `/consolidacoes/alunos/${alunoId}`);
  if (response.status !== 200) {
    throw new Error(`Falha ao consultar consolidacoes: ${response.status} ${response.body}`);
  }

  const payload = JSON.parse(response.body) as ConsolidadoPayload[];
  const dias = new Set(payload.map((item) => item.dataSimples));

  if (dias.size !== quantidade) {
    throw new Error(`Esperado ${quantidade} dias, encontrado ${dias.size}.`);
  }
});

Given('existe apenas um aluno sem alteracoes de avaliacao', async function () {
  alunoId = await criarAluno('Aluno Sem Alteracao');
});

When('eu consulto consolidacoes do aluno', async function () {
  if (!alunoId) {
    throw new Error('Aluno nao preparado para consulta de consolidacoes.');
  }

  try {
    const response = await requestJson('GET', `/consolidacoes/alunos/${alunoId}`);
    lastStatus = response.status;
    lastBody = response.body;
  } catch (error) {
    lastError = error as Error;
  }
});

When('eu reinicio o backend de consolidacao', async function () {
  await stopBackend();
  await startBackend();
});

Then('o status da resposta de consolidacao deve ser {int}', function (status: number) {
  if (lastError) {
    throw lastError;
  }

  if (lastStatus !== status) {
    throw new Error(`Status esperado ${status}, recebido ${lastStatus}. Corpo: ${lastBody}`);
  }
});
