import { randomUUID } from 'crypto';
import jsonRepository from '../repositories/jsonRepository';
import { Aluno, DataContainer, validarAluno } from '../types/domain';
import { hasMeaningfulUpdate, sanitizeOptionalText } from './crudHelpers';

interface CriarAlunoInput {
  nome: string;
  email?: string;
}

interface AtualizarAlunoInput {
  nome?: string;
  email?: string;
}

class AlunoService {
  private static readonly FILE_NAME = 'alunos.json';
  private static readonly MESSAGES = {
    REQUIRED_NAME: 'Campo nome é obrigatório.',
    UPDATE_AT_LEAST_ONE: 'Informe ao menos um campo para atualizar (nome ou email).',
    NOT_FOUND: 'Aluno não encontrado.',
    PERSIST_CREATE: 'Falha ao persistir aluno.',
    PERSIST_UPDATE: 'Falha ao persistir atualização do aluno.',
    PERSIST_DELETE: 'Falha ao persistir remoção do aluno.'
  };

  private static fail(error: string, notFound = false): { success: false; error: string; notFound?: boolean } {
    return notFound ? { success: false, error, notFound: true } : { success: false, error };
  }

  private static loadContainer(): DataContainer<Aluno> {
    return jsonRepository.readOrDefault<DataContainer<Aluno>>(AlunoService.FILE_NAME, {
      versao: '1.0',
      ultimaAtualizacao: new Date().toISOString(),
      itens: []
    });
  }

  private static saveContainer(container: DataContainer<Aluno>): boolean {
    container.ultimaAtualizacao = new Date().toISOString();
    const writeResult = jsonRepository.write(AlunoService.FILE_NAME, container);
    return writeResult.success;
  }

  static listar(): Aluno[] {
    return AlunoService.loadContainer().itens;
  }

  static criar(input: CriarAlunoInput): { success: boolean; aluno?: Aluno; error?: string } {
    if (!input.nome || input.nome.trim() === '') {
      return AlunoService.fail(AlunoService.MESSAGES.REQUIRED_NAME);
    }

    const container = AlunoService.loadContainer();
    const agora = new Date().toISOString();

    const novoAluno: Aluno = {
      id: randomUUID(),
      nome: input.nome.trim(),
      email: sanitizeOptionalText(input.email),
      dataCriacao: agora,
      dataAtualizacao: agora
    };

    try {
      validarAluno(novoAluno);
    } catch (error) {
      return AlunoService.fail((error as Error).message);
    }

    container.itens.push(novoAluno);
    const saved = AlunoService.saveContainer(container);

    if (!saved) {
      return AlunoService.fail(AlunoService.MESSAGES.PERSIST_CREATE);
    }

    return { success: true, aluno: novoAluno };
  }

  static atualizar(
    id: string,
    input: AtualizarAlunoInput
  ): { success: boolean; aluno?: Aluno; error?: string; notFound?: boolean } {
    if (!hasMeaningfulUpdate([input.nome, input.email])) {
      return AlunoService.fail(AlunoService.MESSAGES.UPDATE_AT_LEAST_ONE);
    }

    const container = AlunoService.loadContainer();
    const index = container.itens.findIndex((item) => item.id === id);

    if (index === -1) {
      return AlunoService.fail(AlunoService.MESSAGES.NOT_FOUND, true);
    }

    const atual = container.itens[index];
    const atualizado: Aluno = {
      ...atual,
      nome: input.nome !== undefined ? input.nome.trim() : atual.nome,
      email: sanitizeOptionalText(input.email) ?? atual.email,
      dataAtualizacao: new Date().toISOString()
    };

    try {
      validarAluno(atualizado);
    } catch (error) {
      return AlunoService.fail((error as Error).message);
    }

    container.itens[index] = atualizado;
    const saved = AlunoService.saveContainer(container);

    if (!saved) {
      return AlunoService.fail(AlunoService.MESSAGES.PERSIST_UPDATE);
    }

    return { success: true, aluno: atualizado };
  }

  static remover(id: string): { success: boolean; error?: string; notFound?: boolean } {
    const container = AlunoService.loadContainer();
    const index = container.itens.findIndex((item) => item.id === id);

    if (index === -1) {
      return AlunoService.fail(AlunoService.MESSAGES.NOT_FOUND, true);
    }

    container.itens.splice(index, 1);
    const saved = AlunoService.saveContainer(container);

    if (!saved) {
      return AlunoService.fail(AlunoService.MESSAGES.PERSIST_DELETE);
    }

    return { success: true };
  }
}

export default AlunoService;
export type { CriarAlunoInput, AtualizarAlunoInput };
