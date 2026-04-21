import { randomUUID } from 'crypto';
import jsonRepository from '../repositories/jsonRepository';
import {
  AlteracaoDeAvaliacao,
  Conceito,
  ConsolidadoDiario,
  DataContainer,
  validarAlteracaoDeAvaliacao,
  validarConsolidadoDiario
} from '../types/domain';

interface RegistrarAlteracaoInput {
  avaliacaoId: string;
  alunoId: string;
  turmaId: string;
  metaId: string;
  valorAnterior?: Conceito;
  novoValor: Conceito;
  data?: string;
}

type ConsolidacaoFailResult = {
  success: false;
  error: string;
  status: 400 | 500;
};

type ConsolidacaoSuccessResult = {
  success: true;
};

type ConsultaConsolidacaoResult = {
  success: true;
  itens: ConsolidadoDiario[];
};

class ConsolidacaoService {
  private static readonly ALTERACOES_FILE = 'alteracoes-avaliacoes.json';
  private static readonly CONSOLIDACOES_FILE = 'consolidacoes-avaliacoes.json';

  private static readonly MESSAGES = {
    PERSIST_ALTERACAO: 'Falha ao persistir alteração de avaliação.',
    PERSIST_CONSOLIDACAO: 'Falha ao persistir consolidação diária.'
  };

  private static fail(error: string, status: 400 | 500): ConsolidacaoFailResult {
    return { success: false, error, status };
  }

  private static dateOnly(isoDate: string): string {
    return isoDate.slice(0, 10);
  }

  private static loadAlteracoesContainer(): DataContainer<AlteracaoDeAvaliacao> {
    return jsonRepository.readOrDefault<DataContainer<AlteracaoDeAvaliacao>>(ConsolidacaoService.ALTERACOES_FILE, {
      versao: '1.0',
      ultimaAtualizacao: new Date().toISOString(),
      itens: []
    });
  }

  private static saveAlteracoesContainer(container: DataContainer<AlteracaoDeAvaliacao>): boolean {
    container.ultimaAtualizacao = new Date().toISOString();
    return jsonRepository.write(ConsolidacaoService.ALTERACOES_FILE, container).success;
  }

  private static loadConsolidacoesContainer(): DataContainer<ConsolidadoDiario> {
    return jsonRepository.readOrDefault<DataContainer<ConsolidadoDiario>>(ConsolidacaoService.CONSOLIDACOES_FILE, {
      versao: '1.0',
      ultimaAtualizacao: new Date().toISOString(),
      itens: []
    });
  }

  private static saveConsolidacoesContainer(container: DataContainer<ConsolidadoDiario>): boolean {
    container.ultimaAtualizacao = new Date().toISOString();
    return jsonRepository.write(ConsolidacaoService.CONSOLIDACOES_FILE, container).success;
  }

  private static atualizarConsolidadoAlunoDia(alunoId: string, dataSimples: string): ConsolidacaoSuccessResult | ConsolidacaoFailResult {
    const alteracoesContainer = ConsolidacaoService.loadAlteracoesContainer();
    const consolidacoesContainer = ConsolidacaoService.loadConsolidacoesContainer();

    const alteracoesDoDia = alteracoesContainer.itens
      .filter((item) => item.alunoId === alunoId && item.dataSimples === dataSimples)
      .sort((a, b) => a.data.localeCompare(b.data));

    const existentes = consolidacoesContainer.itens.filter(
      (item) => !(item.alunoId === alunoId && item.dataSimples === dataSimples)
    );

    if (alteracoesDoDia.length === 0) {
      consolidacoesContainer.itens = existentes;
      if (!ConsolidacaoService.saveConsolidacoesContainer(consolidacoesContainer)) {
        return ConsolidacaoService.fail(ConsolidacaoService.MESSAGES.PERSIST_CONSOLIDACAO, 500);
      }

      return { success: true };
    }

    const consolidado: ConsolidadoDiario = {
      id: randomUUID(),
      alunoId,
      dataSimples,
      dataGeracao: new Date().toISOString(),
      alteracoes: alteracoesDoDia
    };

    try {
      validarConsolidadoDiario(consolidado);
    } catch (error) {
      return ConsolidacaoService.fail((error as Error).message, 400);
    }

    consolidacoesContainer.itens = [...existentes, consolidado];

    if (!ConsolidacaoService.saveConsolidacoesContainer(consolidacoesContainer)) {
      return ConsolidacaoService.fail(ConsolidacaoService.MESSAGES.PERSIST_CONSOLIDACAO, 500);
    }

    return { success: true };
  }

  static registrarAlteracao(input: RegistrarAlteracaoInput): ConsolidacaoSuccessResult | ConsolidacaoFailResult {
    const alteracoesContainer = ConsolidacaoService.loadAlteracoesContainer();
    const data = input.data ?? new Date().toISOString();
    const dataSimples = ConsolidacaoService.dateOnly(data);

    const alteracao: AlteracaoDeAvaliacao = {
      id: randomUUID(),
      avaliacaoId: input.avaliacaoId,
      alunoId: input.alunoId,
      turmaId: input.turmaId,
      metaId: input.metaId,
      valorAnterior: input.valorAnterior,
      novoValor: input.novoValor,
      data,
      dataSimples
    };

    try {
      validarAlteracaoDeAvaliacao(alteracao);
    } catch (error) {
      return ConsolidacaoService.fail((error as Error).message, 400);
    }

    alteracoesContainer.itens.push(alteracao);

    if (!ConsolidacaoService.saveAlteracoesContainer(alteracoesContainer)) {
      return ConsolidacaoService.fail(ConsolidacaoService.MESSAGES.PERSIST_ALTERACAO, 500);
    }

    return ConsolidacaoService.atualizarConsolidadoAlunoDia(input.alunoId, dataSimples);
  }

  static reprocessarTudo(): ConsolidacaoSuccessResult | ConsolidacaoFailResult {
    const alteracoesContainer = ConsolidacaoService.loadAlteracoesContainer();
    const consolidacoesContainer = ConsolidacaoService.loadConsolidacoesContainer();

    const agrupadas = new Map<string, AlteracaoDeAvaliacao[]>();

    alteracoesContainer.itens.forEach((item) => {
      const chave = `${item.alunoId}::${item.dataSimples}`;
      const atual = agrupadas.get(chave) ?? [];
      atual.push(item);
      agrupadas.set(chave, atual);
    });

    const novosConsolidados: ConsolidadoDiario[] = [];

    agrupadas.forEach((alteracoes, chave) => {
      const [alunoId, dataSimples] = chave.split('::');
      const consolidado: ConsolidadoDiario = {
        id: randomUUID(),
        alunoId,
        dataSimples,
        dataGeracao: new Date().toISOString(),
        alteracoes: [...alteracoes].sort((a, b) => a.data.localeCompare(b.data))
      };

      validarConsolidadoDiario(consolidado);
      novosConsolidados.push(consolidado);
    });

    consolidacoesContainer.itens = novosConsolidados;

    if (!ConsolidacaoService.saveConsolidacoesContainer(consolidacoesContainer)) {
      return ConsolidacaoService.fail(ConsolidacaoService.MESSAGES.PERSIST_CONSOLIDACAO, 500);
    }

    return { success: true };
  }

  static consultarPorAluno(alunoId: string): ConsultaConsolidacaoResult {
    const consolidacoes = ConsolidacaoService.loadConsolidacoesContainer().itens;
    const itens = consolidacoes
      .filter((item) => item.alunoId === alunoId)
      .sort((a, b) => b.dataSimples.localeCompare(a.dataSimples));

    return { success: true, itens };
  }

  static consultarPorAlunoEData(alunoId: string, dataSimples: string): ConsultaConsolidacaoResult {
    const consolidacoes = ConsolidacaoService.loadConsolidacoesContainer().itens;
    const itens = consolidacoes.filter((item) => item.alunoId === alunoId && item.dataSimples === dataSimples);

    return { success: true, itens };
  }
}

export default ConsolidacaoService;
export type { RegistrarAlteracaoInput };
