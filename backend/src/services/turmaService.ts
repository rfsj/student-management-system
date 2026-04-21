import { randomUUID } from 'crypto';
import jsonRepository from '../repositories/jsonRepository';
import { DataContainer, Turma, validarTurma } from '../types/domain';

interface CriarTurmaInput {
  nome: string;
  descricao?: string;
}

interface AtualizarTurmaInput {
  nome?: string;
  descricao?: string;
}

class TurmaService {
  private static readonly FILE_NAME = 'turmas.json';
  private static readonly MESSAGES = {
    REQUIRED_NAME: 'Campo nome é obrigatório.',
    UPDATE_AT_LEAST_ONE: 'Informe ao menos um campo para atualizar (nome ou descricao).',
    NOT_FOUND: 'Turma não encontrada.',
    PERSIST_CREATE: 'Falha ao persistir turma.',
    PERSIST_UPDATE: 'Falha ao persistir atualização da turma.',
    PERSIST_DELETE: 'Falha ao persistir remoção da turma.'
  };

  private static fail(error: string, notFound = false): { success: false; error: string; notFound?: boolean } {
    return notFound ? { success: false, error, notFound: true } : { success: false, error };
  }

  private static loadContainer(): DataContainer<Turma> {
    return jsonRepository.readOrDefault<DataContainer<Turma>>(TurmaService.FILE_NAME, {
      versao: '1.0',
      ultimaAtualizacao: new Date().toISOString(),
      itens: []
    });
  }

  private static saveContainer(container: DataContainer<Turma>): boolean {
    container.ultimaAtualizacao = new Date().toISOString();
    const writeResult = jsonRepository.write(TurmaService.FILE_NAME, container);
    return writeResult.success;
  }

  static listar(): Turma[] {
    return TurmaService.loadContainer().itens;
  }

  static criar(input: CriarTurmaInput): { success: boolean; turma?: Turma; error?: string } {
    if (!input.nome || input.nome.trim() === '') {
      return TurmaService.fail(TurmaService.MESSAGES.REQUIRED_NAME);
    }

    const container = TurmaService.loadContainer();
    const agora = new Date().toISOString();

    const novaTurma: Turma = {
      id: randomUUID(),
      nome: input.nome.trim(),
      descricao: input.descricao?.trim() || undefined,
      dataCriacao: agora,
      dataAtualizacao: agora
    };

    try {
      validarTurma(novaTurma);
    } catch (error) {
      return TurmaService.fail((error as Error).message);
    }

    container.itens.push(novaTurma);
    const saved = TurmaService.saveContainer(container);

    if (!saved) {
      return TurmaService.fail(TurmaService.MESSAGES.PERSIST_CREATE);
    }

    return { success: true, turma: novaTurma };
  }

  static atualizar(
    id: string,
    input: AtualizarTurmaInput
  ): { success: boolean; turma?: Turma; error?: string; notFound?: boolean } {
    if ((!input.nome || input.nome.trim() === '') && input.descricao === undefined) {
      return TurmaService.fail(TurmaService.MESSAGES.UPDATE_AT_LEAST_ONE);
    }

    const container = TurmaService.loadContainer();
    const index = container.itens.findIndex((item) => item.id === id);

    if (index === -1) {
      return TurmaService.fail(TurmaService.MESSAGES.NOT_FOUND, true);
    }

    const atual = container.itens[index];
    const atualizado: Turma = {
      ...atual,
      nome: input.nome !== undefined ? input.nome.trim() : atual.nome,
      descricao: input.descricao !== undefined ? input.descricao.trim() || undefined : atual.descricao,
      dataAtualizacao: new Date().toISOString()
    };

    try {
      validarTurma(atualizado);
    } catch (error) {
      return TurmaService.fail((error as Error).message);
    }

    container.itens[index] = atualizado;
    const saved = TurmaService.saveContainer(container);

    if (!saved) {
      return TurmaService.fail(TurmaService.MESSAGES.PERSIST_UPDATE);
    }

    return { success: true, turma: atualizado };
  }

  static remover(id: string): { success: boolean; error?: string; notFound?: boolean } {
    const container = TurmaService.loadContainer();
    const index = container.itens.findIndex((item) => item.id === id);

    if (index === -1) {
      return TurmaService.fail(TurmaService.MESSAGES.NOT_FOUND, true);
    }

    container.itens.splice(index, 1);
    const saved = TurmaService.saveContainer(container);

    if (!saved) {
      return TurmaService.fail(TurmaService.MESSAGES.PERSIST_DELETE);
    }

    return { success: true };
  }
}

export default TurmaService;
export type { CriarTurmaInput, AtualizarTurmaInput };
