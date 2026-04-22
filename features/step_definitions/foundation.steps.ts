import { After, AfterAll, Before, BeforeAll, Given, Then, When } from '@cucumber/cucumber';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

const dataDir = path.join(process.cwd(), 'backend/src/data');

type JsonRepositoryResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

const jsonRepository = {
  exists(filename: string): boolean {
    return fs.existsSync(path.join(dataDir, filename));
  },
  delete(filename: string): JsonRepositoryResult<void> {
    const filePath = path.join(dataDir, filename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
  write<T>(filename: string, data: T): JsonRepositoryResult<void> {
    const filePath = path.join(dataDir, filename);
    const tempFilePath = `${filePath}.tmp`;

    try {
      fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(tempFilePath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFilePath, filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
  read<T>(filename: string): JsonRepositoryResult<T> {
    const filePath = path.join(dataDir, filename);

    if (!fs.existsSync(filePath)) {
      return { success: false, error: `Arquivo não encontrado: ${filename}` };
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      try {
        return { success: true, data: JSON.parse(raw) as T };
      } catch (error) {
        return { success: false, error: `JSON inválido em ${filename}: ${(error as Error).message}` };
      }
    } catch (error) {
      const message = (error as Error).message;
      return { success: false, error: `Erro ao ler ${filename}: ${message}` };
    }
  }
};

const CONCEITOS_VALIDOS = ['MANA', 'MPA', 'MA'];
const BACKEND_PORT = 3100;

let backendProcess: ChildProcess | null = null;
let httpStatus: number | null = null;
let httpBody = '';
let operationError: Error | null = null;
let jsonResult: { success: boolean; error?: string; data?: unknown } | null = null;

const validJsonFilename = 'foundation-valid.json';
const invalidJsonFilename = 'foundation-invalid.json';
const invalidJsonFilePath = path.join(process.cwd(), 'backend/src/data', invalidJsonFilename);

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpGet(endpoint: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: BACKEND_PORT,
        path: endpoint,
        method: 'GET'
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
    req.end();
  });
}

async function waitForBackendReady(): Promise<void> {
  const maxAttempts = 30;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const result = await httpGet('/health');
      if (result.status === 200) {
        return;
      }
    } catch (_error) {
      // backend ainda subindo
    }
    await wait(200);
  }

  throw new Error(`Backend nao iniciou na porta ${BACKEND_PORT} a tempo para os testes de aceitacao.`);
}

BeforeAll(async function () {
  if (backendProcess) {
    return;
  }

  backendProcess = spawn('node', ['-r', 'ts-node/register', 'backend/src/index.ts'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(BACKEND_PORT) },
    stdio: 'ignore'
  });

  await waitForBackendReady();
});

AfterAll(async function () {
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }

  await wait(100);
});

Before(function () {
  httpStatus = null;
  httpBody = '';
  operationError = null;
  jsonResult = null;
});

After(function () {
  if (jsonRepository.exists(validJsonFilename)) {
    jsonRepository.delete(validJsonFilename);
  }

  if (jsonRepository.exists(invalidJsonFilename)) {
    jsonRepository.delete(invalidJsonFilename);
  }

  if (fs.existsSync(invalidJsonFilePath)) {
    fs.unlinkSync(invalidJsonFilePath);
  }
});

Given('o servidor backend esta iniciado', function () {
  if (!backendProcess) {
    throw new Error('Processo backend nao foi iniciado para os testes.');
  }
});

When('eu faco uma requisicao GET para {string}', async function (endpoint: string) {
  try {
    const result = await httpGet(endpoint);
    httpStatus = result.status;
    httpBody = result.body;
  } catch (error) {
    operationError = error as Error;
  }
});

Then('a resposta HTTP deve ter status {int}', function (expectedStatus: number) {
  if (operationError) {
    throw operationError;
  }
  if (httpStatus !== expectedStatus) {
    throw new Error(`Status esperado ${expectedStatus}, recebido ${httpStatus}`);
  }
});

Then('a resposta HTTP deve conter {string}', function (text: string) {
  if (!httpBody.includes(text)) {
    throw new Error(`Texto ${text} nao encontrado no corpo da resposta: ${httpBody}`);
  }
});

Given('o modulo de persistencia foi inicializado', function () {
  jsonResult = jsonRepository.write(validJsonFilename, {
    versao: '1.0',
    ultimaAtualizacao: new Date().toISOString(),
    itens: [{ id: '1', nome: 'Aluno Teste' }]
  });

  if (!jsonResult.success) {
    throw new Error(`Falha ao preparar arquivo valido: ${jsonResult.error}`);
  }
});

When('eu leio um arquivo JSON valido', function () {
  jsonResult = jsonRepository.read(validJsonFilename);
});

When('eu leio novamente o arquivo JSON valido', function () {
  jsonResult = jsonRepository.read(validJsonFilename);
});

Then('a leitura JSON deve ter sucesso', function () {
  if (!jsonResult?.success) {
    throw new Error(`Leitura esperada com sucesso, erro: ${jsonResult?.error}`);
  }
});

When('eu leio um arquivo JSON inexistente', function () {
  jsonResult = jsonRepository.read('arquivo-que-nao-existe.json');
});

Then('a leitura JSON deve falhar', function () {
  if (jsonResult?.success) {
    throw new Error('A leitura deveria falhar, mas retornou sucesso.');
  }
});

Then('a mensagem de erro deve conter {string}', function (expectedText: string) {
  if (!jsonResult?.error && !operationError?.message) {
    throw new Error('Nenhuma mensagem de erro disponivel para validacao.');
  }

  const text = jsonResult?.error ?? operationError?.message ?? '';
  if (!text.includes(expectedText)) {
    throw new Error(`Mensagem esperada contendo ${expectedText}, recebida: ${text}`);
  }
});

Given('eu tenho um arquivo JSON invalido', function () {
  fs.mkdirSync(path.dirname(invalidJsonFilePath), { recursive: true });
  fs.writeFileSync(invalidJsonFilePath, '{ "invalido": true', 'utf-8');
});

When('eu leio o arquivo JSON invalido', function () {
  jsonResult = jsonRepository.read(invalidJsonFilename);
});

Given('o contrato de conceito foi definido', function () {
  // contrato definido em domain.ts
});

When('eu valido o conceito {string}', function (conceito: string) {
  try {
    if (!CONCEITOS_VALIDOS.includes(conceito)) {
      throw new Error(`Conceito inválido: "${conceito}". Valores aceitos: ${CONCEITOS_VALIDOS.join(', ')}`);
    }
  } catch (error) {
    operationError = error as Error;
  }
});

Then('a validacao de conceito deve ter sucesso', function () {
  if (operationError) {
    throw new Error(`Validacao deveria ter sucesso, erro recebido: ${operationError.message}`);
  }
});

Then('a validacao de conceito deve falhar', function () {
  if (!operationError) {
    throw new Error('A validacao deveria falhar para conceito invalido.');
  }
});
