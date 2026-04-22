import { After, AfterAll, Before, BeforeAll, Given, Then, When } from '@cucumber/cucumber';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { ChildProcess, spawn } from 'child_process';

type AlunoPayload = { id: string; nome: string; cpf: string; email?: string };
type TurmaPayload = { id: string; nome: string; ano: number; semestre: number };
type MetaPayload = { id: string; nome: string };
type AvaliacaoPayload = { id: string; turmaId: string; alunoId: string; metaId: string; conceito: string };
type DispatchPayload = { enviados: number; falhas: number; processados: number };
type NotificacaoPayload = {
  id: string;
  alunoId: string;
  dataSimples: string;
  status: 'PENDENTE' | 'ENVIADO';
  tentativas: number;
};
type EmailEnviadoPayload = {
  id: string;
  alunoId: string;
  dataSimples: string;
  agrupadoPorTurmaMeta: Array<{ turmaId: string; metaId: string }>;
};

let backendProcess: ChildProcess | null = null;
let startedByThisFile = false;
const BACKEND_PORT = 3100;

let lastStatus: number | null = null;
let lastBody = '';
let lastError: Error | null = null;
let lastDispatch: DispatchPayload | null = null;

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
    throw new Error('Backend nao iniciou para testes de notificacao.');
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

async function criarAluno(nome: string, email: string): Promise<string> {
  const response = await requestJson('POST', '/alunos', { nome, cpf: '42345678901', email });
  if (response.status !== 201) {
    throw new Error(`Falha ao criar aluno: ${response.status} ${response.body}`);
  }

  return (JSON.parse(response.body) as AlunoPayload).id;
}

async function atualizarEmailAluno(id: string, email: string): Promise<void> {
  const response = await requestJson('PUT', `/alunos/${id}`, { email });
  if (response.status !== 200) {
    throw new Error(`Falha ao atualizar aluno: ${response.status} ${response.body}`);
  }
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

async function consultarPendencias(alunoIdParam?: string): Promise<NotificacaoPayload[]> {
  const response = await requestJson('GET', '/notificacoes/pendencias?status=PENDENTE');
  if (response.status !== 200) {
    throw new Error(`Falha ao consultar pendencias: ${response.status} ${response.body}`);
  }

  const itens = JSON.parse(response.body) as NotificacaoPayload[];
  return alunoIdParam ? itens.filter((item) => item.alunoId === alunoIdParam) : itens;
}

async function consultarEmailsEnviados(alunoIdParam?: string, dataSimples?: string): Promise<EmailEnviadoPayload[]> {
  const filtros: string[] = [];
  if (alunoIdParam) {
    filtros.push(`alunoId=${encodeURIComponent(alunoIdParam)}`);
  }
  if (dataSimples) {
    filtros.push(`data=${encodeURIComponent(dataSimples)}`);
  }

  const sufixo = filtros.length > 0 ? `?${filtros.join('&')}` : '';
  const response = await requestJson('GET', `/notificacoes/enviados${sufixo}`);

  if (response.status !== 200) {
    throw new Error(`Falha ao consultar emails enviados: ${response.status} ${response.body}`);
  }

  return JSON.parse(response.body) as EmailEnviadoPayload[];
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
  lastDispatch = null;

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
  deleteDataFile('notificacoes-email.json');
  deleteDataFile('emails-enviados.json');
});

Given('o ambiente de notificacoes esta limpo', function () {
  deleteDataFile('avaliacoes.json');
  deleteDataFile('alunos.json');
  deleteDataFile('turmas.json');
  deleteDataFile('metas.json');
  deleteDataFile('alteracoes-avaliacoes.json');
  deleteDataFile('consolidacoes-avaliacoes.json');
  deleteDataFile('notificacoes-email.json');
  deleteDataFile('emails-enviados.json');
});

Given('existe uma avaliacao base para notificacao com email {string}', async function (email: string) {
  alunoId = await criarAluno('Aluno Notificacao', email);
  turmaAId = await criarTurma('Turma Notificacao A');
  await matricularAluno(turmaAId, alunoId);
  metaId = await obterMetaId();
  avaliacaoId = await criarAvaliacao(turmaAId, alunoId, metaId, 'MANA');
});

Given('existe um aluno com duas turmas para notificacao com email {string}', async function (email: string) {
  alunoId = await criarAluno('Aluno Notificacao Multi', email);
  turmaAId = await criarTurma('Turma Notificacao Multi A');
  turmaBId = await criarTurma('Turma Notificacao Multi B');
  await matricularAluno(turmaAId, alunoId);
  await matricularAluno(turmaBId, alunoId);
  metaId = await obterMetaId();
});

Given('existe apenas um aluno para notificacao sem alteracoes', async function () {
  alunoId = await criarAluno('Aluno Sem Alteracao Notificacao', 'sem.alteracao@escola.com');
});

When('eu altero a avaliacao para {string} no fluxo de notificacao', async function (conceito: string) {
  if (!avaliacaoId) {
    throw new Error('Avaliacao nao preparada para alteracao no fluxo de notificacao.');
  }

  try {
    const response = await requestJson('PUT', `/avaliacoes/${avaliacaoId}`, { conceito });
    lastStatus = response.status;
    lastBody = response.body;
  } catch (error) {
    lastError = error as Error;
  }
});

When('eu lanço avaliacoes nas duas turmas para notificacao', async function () {
  if (!alunoId || !turmaAId || !turmaBId || !metaId) {
    throw new Error('Contexto incompleto para notificacao em duas turmas.');
  }

  await criarAvaliacao(turmaAId, alunoId, metaId, 'MPA');
  await criarAvaliacao(turmaBId, alunoId, metaId, 'MA');
});

When('eu executo o dispatch diario de notificacoes', async function () {
  const hoje = new Date().toISOString().slice(0, 10);

  try {
    const response = await requestJson('POST', '/notificacoes/dispatch', { dataSimples: hoje });
    lastStatus = response.status;
    lastBody = response.body;
    if (response.status === 200) {
      lastDispatch = JSON.parse(response.body) as DispatchPayload;
    }
  } catch (error) {
    lastError = error as Error;
  }
});

When('eu atualizo o email do aluno para {string}', async function (email: string) {
  if (!alunoId) {
    throw new Error('Aluno nao preparado para atualizacao de email.');
  }

  await atualizarEmailAluno(alunoId, email);
});

When('eu reprocesso as notificacoes pendentes', async function () {
  try {
    const response = await requestJson('POST', '/notificacoes/reprocessar');
    lastStatus = response.status;
    lastBody = response.body;
    if (response.status === 200) {
      lastDispatch = JSON.parse(response.body) as DispatchPayload;
    }
  } catch (error) {
    lastError = error as Error;
  }
});

Then('deve existir pendencia de notificacao para o aluno no dia atual', async function () {
  if (lastError) {
    throw lastError;
  }
  if (lastStatus !== 200) {
    throw new Error(`Status esperado 200 na alteracao, recebido ${lastStatus}. Corpo: ${lastBody}`);
  }
  if (!alunoId) {
    throw new Error('Aluno nao preparado para validacao de pendencia.');
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const pendencias = await consultarPendencias(alunoId);
  const encontrada = pendencias.some((item) => item.dataSimples === hoje && item.status === 'PENDENTE');

  if (!encontrada) {
    throw new Error('Pendencia de notificacao nao encontrada para o aluno no dia atual.');
  }
});

Then('deve existir apenas 1 email enviado para o aluno no dia atual', async function () {
  if (!alunoId) {
    throw new Error('Aluno nao preparado para validacao de email enviado.');
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const enviados = await consultarEmailsEnviados(alunoId, hoje);

  if (enviados.length !== 1) {
    throw new Error(`Esperado 1 email enviado, encontrado ${enviados.length}.`);
  }
});

Then('o email enviado deve conter alteracoes de {int} turmas', async function (quantidade: number) {
  if (!alunoId) {
    throw new Error('Aluno nao preparado para validacao de consolidacao no email.');
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const enviados = await consultarEmailsEnviados(alunoId, hoje);
  if (enviados.length === 0) {
    throw new Error('Nenhum email enviado encontrado para validar conteudo.');
  }

  const turmas = new Set(enviados[0].agrupadoPorTurmaMeta.map((item) => item.turmaId));
  if (turmas.size !== quantidade) {
    throw new Error(`Esperado email com ${quantidade} turmas, encontrado ${turmas.size}.`);
  }
});

Then('a notificacao deve permanecer pendente', async function () {
  if (!alunoId) {
    throw new Error('Aluno nao preparado para validacao de pendencia apos falha.');
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const pendencias = await consultarPendencias(alunoId);
  const pendenteHoje = pendencias.find((item) => item.dataSimples === hoje);

  if (!pendenteHoje) {
    throw new Error('Notificacao deveria permanecer pendente, mas nao foi encontrada.');
  }
});

Then('nao deve existir pendencia para o aluno no dia atual', async function () {
  if (!alunoId) {
    throw new Error('Aluno nao preparado para validacao de ausencia de pendencia.');
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const pendencias = await consultarPendencias(alunoId);
  const pendenteHoje = pendencias.find((item) => item.dataSimples === hoje);

  if (pendenteHoje) {
    throw new Error('Nao era esperado encontrar pendencia para o aluno no dia atual.');
  }
});

Then('o dispatch de notificacoes deve indicar 0 envios', function () {
  if (lastError) {
    throw lastError;
  }
  if (lastStatus !== 200) {
    throw new Error(`Status esperado 200, recebido ${lastStatus}. Corpo: ${lastBody}`);
  }
  if (!lastDispatch) {
    throw new Error('Resposta de dispatch nao foi registrada.');
  }

  if (lastDispatch.enviados !== 0) {
    throw new Error(`Esperado 0 envios, recebido ${lastDispatch.enviados}.`);
  }
});
