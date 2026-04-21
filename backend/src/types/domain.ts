/**
 * Tipos de Domínio do Sistema
 */

/**
 * Conceitos válidos para avaliação
 * Restrição obrigatória: apenas estes três valores são aceitos
 */
enum Conceito {
  MANA = 'MANA',  // Meta Ainda Não Atingida
  MPA = 'MPA',    // Meta Parcialmente Atingida
  MA = 'MA'       // Meta Atingida
}

/**
 * Validador de conceitos
 */
const CONCEITOS_VALIDOS = Object.values(Conceito);

function ehConceitoValido(valor: any): valor is Conceito {
  return CONCEITOS_VALIDOS.includes(valor);
}

function validarConceito(valor: any): void {
  if (!ehConceitoValido(valor)) {
    throw new Error(
      `Conceito inválido: "${valor}". Valores aceitos: ${CONCEITOS_VALIDOS.join(', ')}`
    );
  }
}

/**
 * Estudante/Aluno
 */
interface Aluno {
  id: string;
  nome: string;
  email?: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

/**
 * Validador de Aluno
 */
function validarAluno(aluno: any): asserts aluno is Aluno {
  if (!aluno.id || typeof aluno.id !== 'string' || aluno.id.trim() === '') {
    throw new Error('Aluno.id é obrigatório e deve ser uma string não-vazia');
  }
  if (!aluno.nome || typeof aluno.nome !== 'string' || aluno.nome.trim() === '') {
    throw new Error('Aluno.nome é obrigatório e deve ser uma string não-vazia');
  }
  if (!aluno.dataCriacao || typeof aluno.dataCriacao !== 'string') {
    throw new Error('Aluno.dataCriacao é obrigatório e deve ser uma string (ISO)');
  }
  if (!aluno.dataAtualizacao || typeof aluno.dataAtualizacao !== 'string') {
    throw new Error('Aluno.dataAtualizacao é obrigatório e deve ser uma string (ISO)');
  }
}

/**
 * Turma/Classe
 */
interface Turma {
  id: string;
  nome: string;
  descricao?: string;
  alunoIds: string[];
  dataCriacao: string;
  dataAtualizacao: string;
}

/**
 * Validador de Turma
 */
function validarTurma(turma: any): asserts turma is Turma {
  if (!turma.id || typeof turma.id !== 'string' || turma.id.trim() === '') {
    throw new Error('Turma.id é obrigatório e deve ser uma string não-vazia');
  }
  if (!turma.nome || typeof turma.nome !== 'string' || turma.nome.trim() === '') {
    throw new Error('Turma.nome é obrigatório e deve ser uma string não-vazia');
  }
  if (!turma.dataCriacao || typeof turma.dataCriacao !== 'string') {
    throw new Error('Turma.dataCriacao é obrigatório e deve ser uma string (ISO)');
  }
  if (!turma.dataAtualizacao || typeof turma.dataAtualizacao !== 'string') {
    throw new Error('Turma.dataAtualizacao é obrigatório e deve ser uma string (ISO)');
  }
  if (!Array.isArray(turma.alunoIds)) {
    throw new Error('Turma.alunoIds é obrigatório e deve ser uma lista de strings');
  }

  if (turma.alunoIds.some((id: unknown) => typeof id !== 'string' || id.trim() === '')) {
    throw new Error('Turma.alunoIds deve conter apenas IDs de alunos válidos');
  }

  if (new Set(turma.alunoIds).size !== turma.alunoIds.length) {
    throw new Error('Turma.alunoIds não pode conter IDs duplicados');
  }
}

/**
 * Meta de aprendizado
 */
interface Meta {
  id: string;
  nome: string;
  descricao?: string;
}

/**
 * Validador de Meta
 */
function validarMeta(meta: any): asserts meta is Meta {
  if (!meta.id || typeof meta.id !== 'string' || meta.id.trim() === '') {
    throw new Error('Meta.id é obrigatório e deve ser uma string não-vazia');
  }
  if (!meta.nome || typeof meta.nome !== 'string' || meta.nome.trim() === '') {
    throw new Error('Meta.nome é obrigatório e deve ser uma string não-vazia');
  }
}

/**
 * Avaliação de um aluno em uma meta dentro de uma turma
 */
interface Avaliacao {
  id: string;
  alunoId: string;
  turmaId: string;
  metaId: string;
  conceito: Conceito;
  dataCriacao: string;
  dataAtualizacao: string;
  notas?: string;
}

/**
 * Validador de Avaliacao
 */
function validarAvaliacao(avaliacao: any): asserts avaliacao is Avaliacao {
  if (!avaliacao.id || typeof avaliacao.id !== 'string' || avaliacao.id.trim() === '') {
    throw new Error('Avaliacao.id é obrigatório e deve ser uma string não-vazia');
  }
  if (!avaliacao.alunoId || typeof avaliacao.alunoId !== 'string' || avaliacao.alunoId.trim() === '') {
    throw new Error('Avaliacao.alunoId é obrigatório e deve ser uma string não-vazia');
  }
  if (!avaliacao.turmaId || typeof avaliacao.turmaId !== 'string' || avaliacao.turmaId.trim() === '') {
    throw new Error('Avaliacao.turmaId é obrigatório e deve ser uma string não-vazia');
  }
  if (!avaliacao.metaId || typeof avaliacao.metaId !== 'string' || avaliacao.metaId.trim() === '') {
    throw new Error('Avaliacao.metaId é obrigatório e deve ser uma string não-vazia');
  }
  if (!ehConceitoValido(avaliacao.conceito)) {
    throw new Error('Avaliacao.conceito inválido ou ausente');
  }
  if (!avaliacao.dataCriacao || typeof avaliacao.dataCriacao !== 'string') {
    throw new Error('Avaliacao.dataCriacao é obrigatório e deve ser uma string (ISO)');
  }
  if (!avaliacao.dataAtualizacao || typeof avaliacao.dataAtualizacao !== 'string') {
    throw new Error('Avaliacao.dataAtualizacao é obrigatório e deve ser uma string (ISO)');
  }
}

/**
 * Registro de alteração de avaliação para consolidação de email
 */
interface AlteracaoDeAvaliacao {
  id: string;
  avaliacaoId: string;
  alunoId: string;
  turmaId: string;
  metaId: string;
  valorAnterior?: Conceito;
  novoValor: Conceito;
  data: string;
  // Timestamp para facilitar agregação por dia
  dataSimples: string; // formato: YYYY-MM-DD
}

/**
 * Consolidado diário de alterações por aluno
 */
interface ConsolidadoDiario {
  id: string;
  alunoId: string;
  dataSimples: string;
  dataGeracao: string;
  alteracoes: AlteracaoDeAvaliacao[];
}

type StatusNotificacaoDiaria = 'PENDENTE' | 'ENVIADO';

interface NotificacaoDiaria {
  id: string;
  alunoId: string;
  dataSimples: string;
  status: StatusNotificacaoDiaria;
  tentativas: number;
  criadoEm: string;
  atualizadoEm: string;
  enviadoEm?: string;
  ultimoErro?: string;
}

/**
 * Validador de AlteracaoDeAvaliacao
 */
function validarAlteracaoDeAvaliacao(alteracao: any): asserts alteracao is AlteracaoDeAvaliacao {
  if (!alteracao.id || typeof alteracao.id !== 'string' || alteracao.id.trim() === '') {
    throw new Error('AlteracaoDeAvaliacao.id é obrigatório e deve ser uma string não-vazia');
  }
  if (!alteracao.avaliacaoId || typeof alteracao.avaliacaoId !== 'string' || alteracao.avaliacaoId.trim() === '') {
    throw new Error('AlteracaoDeAvaliacao.avaliacaoId é obrigatório e deve ser uma string não-vazia');
  }
  if (!alteracao.alunoId || typeof alteracao.alunoId !== 'string' || alteracao.alunoId.trim() === '') {
    throw new Error('AlteracaoDeAvaliacao.alunoId é obrigatório e deve ser uma string não-vazia');
  }
  if (!alteracao.turmaId || typeof alteracao.turmaId !== 'string' || alteracao.turmaId.trim() === '') {
    throw new Error('AlteracaoDeAvaliacao.turmaId é obrigatório e deve ser uma string não-vazia');
  }
  if (!alteracao.metaId || typeof alteracao.metaId !== 'string' || alteracao.metaId.trim() === '') {
    throw new Error('AlteracaoDeAvaliacao.metaId é obrigatório e deve ser uma string não-vazia');
  }
  if (!ehConceitoValido(alteracao.novoValor)) {
    throw new Error('AlteracaoDeAvaliacao.novoValor inválido ou ausente');
  }
  if (alteracao.valorAnterior !== undefined && !ehConceitoValido(alteracao.valorAnterior)) {
    throw new Error('AlteracaoDeAvaliacao.valorAnterior é inválido');
  }
  if (!alteracao.data || typeof alteracao.data !== 'string') {
    throw new Error('AlteracaoDeAvaliacao.data é obrigatório e deve ser uma string (ISO)');
  }
  if (!alteracao.dataSimples || typeof alteracao.dataSimples !== 'string') {
    throw new Error('AlteracaoDeAvaliacao.dataSimples é obrigatório (formato: YYYY-MM-DD)');
  }
}

function validarConsolidadoDiario(consolidado: any): asserts consolidado is ConsolidadoDiario {
  if (!consolidado.id || typeof consolidado.id !== 'string' || consolidado.id.trim() === '') {
    throw new Error('ConsolidadoDiario.id é obrigatório e deve ser uma string não-vazia');
  }
  if (!consolidado.alunoId || typeof consolidado.alunoId !== 'string' || consolidado.alunoId.trim() === '') {
    throw new Error('ConsolidadoDiario.alunoId é obrigatório e deve ser uma string não-vazia');
  }
  if (!consolidado.dataSimples || typeof consolidado.dataSimples !== 'string') {
    throw new Error('ConsolidadoDiario.dataSimples é obrigatório (formato: YYYY-MM-DD)');
  }
  if (!consolidado.dataGeracao || typeof consolidado.dataGeracao !== 'string') {
    throw new Error('ConsolidadoDiario.dataGeracao é obrigatório e deve ser uma string (ISO)');
  }
  if (!Array.isArray(consolidado.alteracoes)) {
    throw new Error('ConsolidadoDiario.alteracoes deve ser uma lista');
  }

  consolidado.alteracoes.forEach((alteracao: unknown) => validarAlteracaoDeAvaliacao(alteracao));
}

const STATUS_NOTIFICACAO_VALIDOS: StatusNotificacaoDiaria[] = ['PENDENTE', 'ENVIADO'];

function validarNotificacaoDiaria(notificacao: any): asserts notificacao is NotificacaoDiaria {
  if (!notificacao.id || typeof notificacao.id !== 'string' || notificacao.id.trim() === '') {
    throw new Error('NotificacaoDiaria.id é obrigatório e deve ser uma string não-vazia');
  }
  if (!notificacao.alunoId || typeof notificacao.alunoId !== 'string' || notificacao.alunoId.trim() === '') {
    throw new Error('NotificacaoDiaria.alunoId é obrigatório e deve ser uma string não-vazia');
  }
  if (!notificacao.dataSimples || typeof notificacao.dataSimples !== 'string') {
    throw new Error('NotificacaoDiaria.dataSimples é obrigatório (formato: YYYY-MM-DD)');
  }
  if (!STATUS_NOTIFICACAO_VALIDOS.includes(notificacao.status)) {
    throw new Error('NotificacaoDiaria.status inválido. Valores aceitos: PENDENTE, ENVIADO');
  }
  if (typeof notificacao.tentativas !== 'number' || notificacao.tentativas < 0) {
    throw new Error('NotificacaoDiaria.tentativas deve ser um número maior ou igual a zero');
  }
  if (!notificacao.criadoEm || typeof notificacao.criadoEm !== 'string') {
    throw new Error('NotificacaoDiaria.criadoEm é obrigatório e deve ser uma string (ISO)');
  }
  if (!notificacao.atualizadoEm || typeof notificacao.atualizadoEm !== 'string') {
    throw new Error('NotificacaoDiaria.atualizadoEm é obrigatório e deve ser uma string (ISO)');
  }
  if (notificacao.enviadoEm !== undefined && typeof notificacao.enviadoEm !== 'string') {
    throw new Error('NotificacaoDiaria.enviadoEm deve ser string quando informado');
  }
  if (notificacao.ultimoErro !== undefined && typeof notificacao.ultimoErro !== 'string') {
    throw new Error('NotificacaoDiaria.ultimoErro deve ser string quando informado');
  }
}

/**
 * Container para armazenar todas as entidades
 * Cada arquivo JSON terá uma dessas estruturas
 */
interface DataContainer<T> {
  versao: string;
  ultimaAtualizacao: string;
  itens: T[];
}

export {
  Conceito,
  ehConceitoValido,
  validarConceito,
  Aluno,
  validarAluno,
  Turma,
  validarTurma,
  Meta,
  validarMeta,
  Avaliacao,
  validarAvaliacao,
  AlteracaoDeAvaliacao,
  validarAlteracaoDeAvaliacao,
  ConsolidadoDiario,
  validarConsolidadoDiario,
  StatusNotificacaoDiaria,
  NotificacaoDiaria,
  validarNotificacaoDiaria,
  DataContainer
};
