import { randomUUID } from 'crypto';
import jsonRepository from '../repositories/jsonRepository';
import {
  Aluno,
  Avaliacao,
  Conceito,
  DataContainer,
  Meta,
  Turma,
  validarAvaliacao,
  validarConceito
} from '../types/domain';

interface LancarAvaliacaoInput {
  turmaId: string;
  alunoId: string;
  metaId: string;
  conceito: string;
  notas?: string;
}

interface AlterarAvaliacaoInput {
  conceito: string;
  notas?: string;
}

type AvaliacaoFailResult = {
  success: false;
  error: string;
  status: 400 | 404 | 500;
};

type AvaliacaoSuccessResult = {
  success: true;
  avaliacao: Avaliacao;
};

type TurmaComAvaliacoesResult = {
  success: true;
  turma: Turma;
  alunos: Aluno[];
  metas: Meta[];
  avaliacoes: Avaliacao[];
};

class AvaliacaoService {
  private static readonly AVALIACOES_FILE = 'avaliacoes.json';
  private static readonly TURMAS_FILE = 'turmas.json';
  private static readonly ALUNOS_FILE = 'alunos.json';
  private static readonly METAS_FILE = 'metas.json';

  private static readonly MESSAGES = {
    TURMA_NOT_FOUND: 'Turma não encontrada.',
    ALUNO_NOT_FOUND: 'Aluno não encontrado.',
    ALUNO_NOT_ENROLLED: 'Aluno não está matriculado na turma informada.',
    META_NOT_FOUND: 'Meta não encontrada.',
    AVALIACAO_DUPLICADA: 'Avaliação já cadastrada para este aluno nesta meta e turma.',
    AVALIACAO_NOT_FOUND: 'Avaliação não encontrada.',
    PERSIST_CREATE: 'Falha ao persistir avaliação.',
    PERSIST_UPDATE: 'Falha ao persistir alteração da avaliação.'
  };

  private static fail(error: string, status: 400 | 404 | 500): AvaliacaoFailResult {
    return { success: false, error, status };
  }

  private static loadAvaliacaoContainer(): DataContainer<Avaliacao> {
    return jsonRepository.readOrDefault<DataContainer<Avaliacao>>(AvaliacaoService.AVALIACOES_FILE, {
      versao: '1.0',
      ultimaAtualizacao: new Date().toISOString(),
      itens: []
    });
  }

  private static loadTurmaContainer(): DataContainer<Turma> {
    return jsonRepository.readOrDefault<DataContainer<Turma>>(AvaliacaoService.TURMAS_FILE, {
      versao: '1.0',
      ultimaAtualizacao: new Date().toISOString(),
      itens: []
    });
  }

  private static loadAlunoContainer(): DataContainer<Aluno> {
    return jsonRepository.readOrDefault<DataContainer<Aluno>>(AvaliacaoService.ALUNOS_FILE, {
      versao: '1.0',
      ultimaAtualizacao: new Date().toISOString(),
      itens: []
    });
  }

  private static loadMetaContainer(): DataContainer<Meta> {
    return jsonRepository.readOrDefault<DataContainer<Meta>>(AvaliacaoService.METAS_FILE, {
      versao: '1.0',
      ultimaAtualizacao: new Date().toISOString(),
      itens: []
    });
  }

  private static saveAvaliacaoContainer(container: DataContainer<Avaliacao>): boolean {
    container.ultimaAtualizacao = new Date().toISOString();
    return jsonRepository.write(AvaliacaoService.AVALIACOES_FILE, container).success;
  }

  private static parseConceito(conceito: string): Conceito | null {
    try {
      validarConceito(conceito);
      return conceito as Conceito;
    } catch (_error) {
      return null;
    }
  }

  static lancar(input: LancarAvaliacaoInput): AvaliacaoSuccessResult | AvaliacaoFailResult {
    const turmas = AvaliacaoService.loadTurmaContainer();
    const alunos = AvaliacaoService.loadAlunoContainer();
    const metas = AvaliacaoService.loadMetaContainer();
    const avaliacoes = AvaliacaoService.loadAvaliacaoContainer();

    const turma = turmas.itens.find((item) => item.id === input.turmaId);
    if (!turma) {
      return AvaliacaoService.fail(AvaliacaoService.MESSAGES.TURMA_NOT_FOUND, 404);
    }

    const aluno = alunos.itens.find((item) => item.id === input.alunoId);
    if (!aluno) {
      return AvaliacaoService.fail(AvaliacaoService.MESSAGES.ALUNO_NOT_FOUND, 404);
    }

    const matriculado = turma.alunoIds.includes(input.alunoId);
    if (!matriculado) {
      return AvaliacaoService.fail(AvaliacaoService.MESSAGES.ALUNO_NOT_ENROLLED, 400);
    }

    const meta = metas.itens.find((item) => item.id === input.metaId);
    if (!meta) {
      return AvaliacaoService.fail(AvaliacaoService.MESSAGES.META_NOT_FOUND, 404);
    }

    const conceito = AvaliacaoService.parseConceito(input.conceito);
    if (!conceito) {
      return AvaliacaoService.fail('Conceito inválido. Valores aceitos: MANA, MPA, MA.', 400);
    }

    const duplicate = avaliacoes.itens.some(
      (item) => item.turmaId === input.turmaId && item.alunoId === input.alunoId && item.metaId === input.metaId
    );
    if (duplicate) {
      return AvaliacaoService.fail(AvaliacaoService.MESSAGES.AVALIACAO_DUPLICADA, 400);
    }

    const agora = new Date().toISOString();
    const novaAvaliacao: Avaliacao = {
      id: randomUUID(),
      turmaId: input.turmaId,
      alunoId: input.alunoId,
      metaId: input.metaId,
      conceito,
      notas: input.notas?.trim() || undefined,
      dataCriacao: agora,
      dataAtualizacao: agora
    };

    try {
      validarAvaliacao(novaAvaliacao);
    } catch (error) {
      return AvaliacaoService.fail((error as Error).message, 400);
    }

    avaliacoes.itens.push(novaAvaliacao);

    if (!AvaliacaoService.saveAvaliacaoContainer(avaliacoes)) {
      return AvaliacaoService.fail(AvaliacaoService.MESSAGES.PERSIST_CREATE, 500);
    }

    return { success: true, avaliacao: novaAvaliacao };
  }

  static alterar(id: string, input: AlterarAvaliacaoInput): AvaliacaoSuccessResult | AvaliacaoFailResult {
    const avaliacoes = AvaliacaoService.loadAvaliacaoContainer();
    const index = avaliacoes.itens.findIndex((item) => item.id === id);

    if (index === -1) {
      return AvaliacaoService.fail(AvaliacaoService.MESSAGES.AVALIACAO_NOT_FOUND, 404);
    }

    const conceito = AvaliacaoService.parseConceito(input.conceito);
    if (!conceito) {
      return AvaliacaoService.fail('Conceito inválido. Valores aceitos: MANA, MPA, MA.', 400);
    }

    const atual = avaliacoes.itens[index];
    const atualizado: Avaliacao = {
      ...atual,
      conceito,
      notas: input.notas?.trim() || atual.notas,
      dataAtualizacao: new Date().toISOString()
    };

    try {
      validarAvaliacao(atualizado);
    } catch (error) {
      return AvaliacaoService.fail((error as Error).message, 400);
    }

    avaliacoes.itens[index] = atualizado;

    if (!AvaliacaoService.saveAvaliacaoContainer(avaliacoes)) {
      return AvaliacaoService.fail(AvaliacaoService.MESSAGES.PERSIST_UPDATE, 500);
    }

    return { success: true, avaliacao: atualizado };
  }

  static visualizarPorTurma(turmaId: string): TurmaComAvaliacoesResult | AvaliacaoFailResult {
    const turmas = AvaliacaoService.loadTurmaContainer();
    const alunos = AvaliacaoService.loadAlunoContainer();
    const metas = AvaliacaoService.loadMetaContainer();
    const avaliacoes = AvaliacaoService.loadAvaliacaoContainer();

    const turma = turmas.itens.find((item) => item.id === turmaId);
    if (!turma) {
      return AvaliacaoService.fail(AvaliacaoService.MESSAGES.TURMA_NOT_FOUND, 404);
    }

    const alunosDaTurma = alunos.itens.filter((aluno) => turma.alunoIds.includes(aluno.id));
    const avaliacoesDaTurma = avaliacoes.itens.filter((avaliacao) => avaliacao.turmaId === turma.id);

    return {
      success: true,
      turma,
      alunos: alunosDaTurma,
      metas: metas.itens,
      avaliacoes: avaliacoesDaTurma
    };
  }
}

export default AvaliacaoService;
export type { AlterarAvaliacaoInput, LancarAvaliacaoInput };
