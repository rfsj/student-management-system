import { randomUUID } from 'crypto';
import jsonRepository from '../repositories/jsonRepository';
import { DataContainer, Meta, validarMeta } from '../types/domain';

interface CriarMetaInput {
  nome: string;
  descricao?: string;
}

class MetaService {
  private static readonly FILE_NAME = 'metas.json';

  private static readonly MESSAGES = {
    REQUIRED_NAME: 'Campo nome da meta é obrigatório.',
    DUPLICATE_NAME: 'Já existe meta cadastrada com este nome.',
    PERSIST_CREATE: 'Falha ao persistir meta.'
  };

  private static readonly DEFAULT_METAS: Array<{ nome: string; descricao: string }> = [
    { nome: 'Participacao', descricao: 'Participacao e colaboracao nas atividades.' },
    { nome: 'Leitura', descricao: 'Compreensao leitora e interpretacao de textos.' },
    { nome: 'Resolucao de Problemas', descricao: 'Aplicacao de conceitos para resolver problemas.' }
  ];

  private static fail(error: string): { success: false; error: string } {
    return { success: false, error };
  }

  private static saveContainer(container: DataContainer<Meta>): boolean {
    container.ultimaAtualizacao = new Date().toISOString();
    const writeResult = jsonRepository.write(MetaService.FILE_NAME, container);
    return writeResult.success;
  }

  private static createDefaultContainer(): DataContainer<Meta> {
    const agora = new Date().toISOString();
    return {
      versao: '1.0',
      ultimaAtualizacao: agora,
      itens: MetaService.DEFAULT_METAS.map((meta) => ({
        id: randomUUID(),
        nome: meta.nome,
        descricao: meta.descricao
      }))
    };
  }

  private static loadContainer(): DataContainer<Meta> {
    const exists = jsonRepository.exists(MetaService.FILE_NAME);

    if (!exists) {
      const defaultContainer = MetaService.createDefaultContainer();
      MetaService.saveContainer(defaultContainer);
      return defaultContainer;
    }

    return jsonRepository.readOrDefault<DataContainer<Meta>>(MetaService.FILE_NAME, {
      versao: '1.0',
      ultimaAtualizacao: new Date().toISOString(),
      itens: []
    });
  }

  static listar(): Meta[] {
    return MetaService.loadContainer().itens;
  }

  static criar(input: CriarMetaInput): { success: boolean; meta?: Meta; error?: string } {
    if (!input.nome || input.nome.trim() === '') {
      return MetaService.fail(MetaService.MESSAGES.REQUIRED_NAME);
    }

    const container = MetaService.loadContainer();
    const nomeNormalizado = input.nome.trim().toLowerCase();

    const duplicate = container.itens.some((meta) => meta.nome.trim().toLowerCase() === nomeNormalizado);
    if (duplicate) {
      return MetaService.fail(MetaService.MESSAGES.DUPLICATE_NAME);
    }

    const novaMeta: Meta = {
      id: randomUUID(),
      nome: input.nome.trim(),
      descricao: input.descricao?.trim() || undefined
    };

    try {
      validarMeta(novaMeta);
    } catch (error) {
      return MetaService.fail((error as Error).message);
    }

    container.itens.push(novaMeta);

    if (!MetaService.saveContainer(container)) {
      return MetaService.fail(MetaService.MESSAGES.PERSIST_CREATE);
    }

    return { success: true, meta: novaMeta };
  }
}

export default MetaService;
export type { CriarMetaInput };
