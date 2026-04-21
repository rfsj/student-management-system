import { randomUUID } from 'crypto';
import jsonRepository from '../repositories/jsonRepository';
import {
  Aluno,
  AlteracaoDeAvaliacao,
  ConsolidadoDiario,
  DataContainer,
  Meta,
  NotificacaoDiaria,
  StatusNotificacaoDiaria,
  Turma,
  validarNotificacaoDiaria
} from '../types/domain';

interface EmailAgrupamentoTurmaMeta {
  turmaId: string;
  turmaNome: string;
  metaId: string;
  metaNome: string;
  quantidadeAlteracoes: number;
  conceitoFinal: string;
}

interface DailyConsolidatedEmail {
  to: string;
  alunoId: string;
  alunoNome: string;
  dataSimples: string;
  assunto: string;
  agrupadoPorTurmaMeta: EmailAgrupamentoTurmaMeta[];
}

interface EmailSender {
  sendDailyConsolidated(email: DailyConsolidatedEmail): { success: boolean; error?: string };
}

interface EmailEnviadoLog {
  id: string;
  alunoId: string;
  dataSimples: string;
  to: string;
  assunto: string;
  enviadoEm: string;
  agrupadoPorTurmaMeta: EmailAgrupamentoTurmaMeta[];
}

type NotificacaoFailResult = {
  success: false;
  error: string;
  status: 400 | 500;
};

type NotificacaoSuccessResult = {
  success: true;
};

type DispatchSuccessResult = {
  success: true;
  processados: number;
  enviados: number;
  falhas: number;
};

type ListarNotificacoesResult = {
  success: true;
  itens: NotificacaoDiaria[];
};

type ListarEmailsResult = {
  success: true;
  itens: EmailEnviadoLog[];
};

class FakeEmailSender implements EmailSender {
  sendDailyConsolidated(email: DailyConsolidatedEmail): { success: boolean; error?: string } {
    if (email.to.toLowerCase().includes('falha')) {
      return { success: false, error: 'Falha simulada no adaptador de email.' };
    }

    return { success: true };
  }
}

class NotificacaoService {
  private static readonly NOTIFICACOES_FILE = 'notificacoes-email.json';
  private static readonly CONSOLIDACOES_FILE = 'consolidacoes-avaliacoes.json';
  private static readonly ALUNOS_FILE = 'alunos.json';
  private static readonly TURMAS_FILE = 'turmas.json';
  private static readonly METAS_FILE = 'metas.json';
  private static readonly EMAILS_ENVIADOS_FILE = 'emails-enviados.json';

  private static readonly MESSAGES = {
    PERSIST_NOTIFICACAO: 'Falha ao persistir estado de notificação diária.',
    PERSIST_EMAIL_LOG: 'Falha ao persistir log de email enviado.',
    PENDING_STATUS_INVALIDO: 'Status de notificação inválido. Use PENDENTE ou ENVIADO.'
  };

  private static readonly emailSender: EmailSender = new FakeEmailSender();

  private static fail(error: string, status: 400 | 500): NotificacaoFailResult {
    return { success: false, error, status };
  }

  private static loadContainer<T>(filename: string): DataContainer<T> {
    return jsonRepository.readOrDefault<DataContainer<T>>(filename, {
      versao: '1.0',
      ultimaAtualizacao: new Date().toISOString(),
      itens: []
    });
  }

  private static saveContainer<T>(filename: string, container: DataContainer<T>): boolean {
    container.ultimaAtualizacao = new Date().toISOString();
    return jsonRepository.write(filename, container).success;
  }

  private static loadNotificacoesContainer(): DataContainer<NotificacaoDiaria> {
    return NotificacaoService.loadContainer<NotificacaoDiaria>(NotificacaoService.NOTIFICACOES_FILE);
  }

  private static saveNotificacoesContainer(container: DataContainer<NotificacaoDiaria>): boolean {
    return NotificacaoService.saveContainer(NotificacaoService.NOTIFICACOES_FILE, container);
  }

  private static loadConsolidacoesContainer(): DataContainer<ConsolidadoDiario> {
    return NotificacaoService.loadContainer<ConsolidadoDiario>(NotificacaoService.CONSOLIDACOES_FILE);
  }

  private static loadAlunosContainer(): DataContainer<Aluno> {
    return NotificacaoService.loadContainer<Aluno>(NotificacaoService.ALUNOS_FILE);
  }

  private static loadTurmasContainer(): DataContainer<Turma> {
    return NotificacaoService.loadContainer<Turma>(NotificacaoService.TURMAS_FILE);
  }

  private static loadMetasContainer(): DataContainer<Meta> {
    return NotificacaoService.loadContainer<Meta>(NotificacaoService.METAS_FILE);
  }

  private static loadEmailsEnviadosContainer(): DataContainer<EmailEnviadoLog> {
    return NotificacaoService.loadContainer<EmailEnviadoLog>(NotificacaoService.EMAILS_ENVIADOS_FILE);
  }

  private static saveEmailsEnviadosContainer(container: DataContainer<EmailEnviadoLog>): boolean {
    return NotificacaoService.saveContainer(NotificacaoService.EMAILS_ENVIADOS_FILE, container);
  }

  private static criarNotificacaoPendente(alunoId: string, dataSimples: string): NotificacaoDiaria {
    const agora = new Date().toISOString();

    return {
      id: randomUUID(),
      alunoId,
      dataSimples,
      status: 'PENDENTE',
      tentativas: 0,
      criadoEm: agora,
      atualizadoEm: agora
    };
  }

  private static atualizarFalhaEnvio(notificacao: NotificacaoDiaria, erro: string): void {
    notificacao.tentativas += 1;
    notificacao.ultimoErro = erro;
    notificacao.atualizadoEm = new Date().toISOString();
    notificacao.status = 'PENDENTE';
  }

  private static marcarComoEnviado(notificacao: NotificacaoDiaria): void {
    const agora = new Date().toISOString();
    notificacao.status = 'ENVIADO';
    notificacao.enviadoEm = agora;
    notificacao.atualizadoEm = agora;
    notificacao.ultimoErro = undefined;
  }

  private static montarAgrupamentoPorTurmaMeta(
    alteracoes: AlteracaoDeAvaliacao[],
    turmas: Turma[],
    metas: Meta[]
  ): EmailAgrupamentoTurmaMeta[] {
    const agrupamento = new Map<string, AlteracaoDeAvaliacao[]>();

    alteracoes.forEach((alteracao) => {
      const chave = `${alteracao.turmaId}::${alteracao.metaId}`;
      const atual = agrupamento.get(chave) ?? [];
      atual.push(alteracao);
      agrupamento.set(chave, atual);
    });

    const resultado: EmailAgrupamentoTurmaMeta[] = [];

    agrupamento.forEach((itens, chave) => {
      const [turmaId, metaId] = chave.split('::');
      const turma = turmas.find((item) => item.id === turmaId);
      const meta = metas.find((item) => item.id === metaId);
      const ultimaAlteracao = [...itens].sort((a, b) => b.data.localeCompare(a.data))[0];

      resultado.push({
        turmaId,
        turmaNome: turma?.nome ?? 'Turma desconhecida',
        metaId,
        metaNome: meta?.nome ?? 'Meta desconhecida',
        quantidadeAlteracoes: itens.length,
        conceitoFinal: ultimaAlteracao.novoValor
      });
    });

    return resultado.sort((a, b) => a.turmaNome.localeCompare(b.turmaNome) || a.metaNome.localeCompare(b.metaNome));
  }

  private static montarEmail(
    notificacao: NotificacaoDiaria,
    consolidado: ConsolidadoDiario,
    aluno: Aluno,
    turmas: Turma[],
    metas: Meta[]
  ): DailyConsolidatedEmail | NotificacaoFailResult {
    if (!aluno.email || aluno.email.trim() === '') {
      return NotificacaoService.fail('Aluno sem email cadastrado para envio da notificação.', 400);
    }

    const agrupadoPorTurmaMeta = NotificacaoService.montarAgrupamentoPorTurmaMeta(consolidado.alteracoes, turmas, metas);

    return {
      to: aluno.email,
      alunoId: notificacao.alunoId,
      alunoNome: aluno.nome,
      dataSimples: notificacao.dataSimples,
      assunto: `Resumo diário de avaliações - ${notificacao.dataSimples}`,
      agrupadoPorTurmaMeta
    };
  }

  private static registrarLogEmail(email: DailyConsolidatedEmail): NotificacaoSuccessResult | NotificacaoFailResult {
    const emailsContainer = NotificacaoService.loadEmailsEnviadosContainer();

    emailsContainer.itens.push({
      id: randomUUID(),
      alunoId: email.alunoId,
      dataSimples: email.dataSimples,
      to: email.to,
      assunto: email.assunto,
      enviadoEm: new Date().toISOString(),
      agrupadoPorTurmaMeta: email.agrupadoPorTurmaMeta
    });

    if (!NotificacaoService.saveEmailsEnviadosContainer(emailsContainer)) {
      return NotificacaoService.fail(NotificacaoService.MESSAGES.PERSIST_EMAIL_LOG, 500);
    }

    return { success: true };
  }

  static registrarPendencia(alunoId: string, dataSimples: string): NotificacaoSuccessResult | NotificacaoFailResult {
    const notificacoesContainer = NotificacaoService.loadNotificacoesContainer();
    const existente = notificacoesContainer.itens.find(
      (item) => item.alunoId === alunoId && item.dataSimples === dataSimples
    );

    if (existente) {
      return { success: true };
    }

    const pendencia = NotificacaoService.criarNotificacaoPendente(alunoId, dataSimples);

    try {
      validarNotificacaoDiaria(pendencia);
    } catch (error) {
      return NotificacaoService.fail((error as Error).message, 400);
    }

    notificacoesContainer.itens.push(pendencia);

    if (!NotificacaoService.saveNotificacoesContainer(notificacoesContainer)) {
      return NotificacaoService.fail(NotificacaoService.MESSAGES.PERSIST_NOTIFICACAO, 500);
    }

    return { success: true };
  }

  static listarNotificacoes(status?: StatusNotificacaoDiaria): ListarNotificacoesResult | NotificacaoFailResult {
    if (status && status !== 'PENDENTE' && status !== 'ENVIADO') {
      return NotificacaoService.fail(NotificacaoService.MESSAGES.PENDING_STATUS_INVALIDO, 400);
    }

    const notificacoes = NotificacaoService.loadNotificacoesContainer().itens;
    const itens = status
      ? notificacoes.filter((item) => item.status === status)
      : notificacoes;

    return {
      success: true,
      itens: [...itens].sort((a, b) => b.dataSimples.localeCompare(a.dataSimples))
    };
  }

  static listarEmailsEnviados(alunoId?: string, dataSimples?: string): ListarEmailsResult {
    const enviados = NotificacaoService.loadEmailsEnviadosContainer().itens;
    const itens = enviados.filter((item) => {
      const alunoMatch = alunoId ? item.alunoId === alunoId : true;
      const dataMatch = dataSimples ? item.dataSimples === dataSimples : true;
      return alunoMatch && dataMatch;
    });

    return {
      success: true,
      itens: [...itens].sort((a, b) => b.enviadoEm.localeCompare(a.enviadoEm))
    };
  }

  static dispatchDiario(dataSimples?: string): DispatchSuccessResult | NotificacaoFailResult {
    const notificacoesContainer = NotificacaoService.loadNotificacoesContainer();
    const consolidacoes = NotificacaoService.loadConsolidacoesContainer().itens;
    const alunos = NotificacaoService.loadAlunosContainer().itens;
    const turmas = NotificacaoService.loadTurmasContainer().itens;
    const metas = NotificacaoService.loadMetasContainer().itens;

    const pendencias = notificacoesContainer.itens.filter((item) => {
      const pendente = item.status === 'PENDENTE';
      const dataMatch = dataSimples ? item.dataSimples === dataSimples : true;
      return pendente && dataMatch;
    });

    let enviados = 0;
    let falhas = 0;

    pendencias.forEach((notificacao) => {
      const consolidado = consolidacoes.find(
        (item) => item.alunoId === notificacao.alunoId && item.dataSimples === notificacao.dataSimples
      );
      const aluno = alunos.find((item) => item.id === notificacao.alunoId);

      if (!consolidado || !aluno) {
        NotificacaoService.atualizarFalhaEnvio(
          notificacao,
          'Consolidado diário ou aluno não encontrado para a notificação.'
        );
        falhas += 1;
        return;
      }

      const email = NotificacaoService.montarEmail(notificacao, consolidado, aluno, turmas, metas);
      if ('success' in email && !email.success) {
        NotificacaoService.atualizarFalhaEnvio(notificacao, email.error);
        falhas += 1;
        return;
      }

      const envio = NotificacaoService.emailSender.sendDailyConsolidated(email as DailyConsolidatedEmail);
      if (!envio.success) {
        NotificacaoService.atualizarFalhaEnvio(notificacao, envio.error ?? 'Falha desconhecida no envio de email.');
        falhas += 1;
        return;
      }

      const logResult = NotificacaoService.registrarLogEmail(email as DailyConsolidatedEmail);
      if (!logResult.success) {
        NotificacaoService.atualizarFalhaEnvio(notificacao, logResult.error);
        falhas += 1;
        return;
      }

      NotificacaoService.marcarComoEnviado(notificacao);
      enviados += 1;
    });

    const validacaoErro = notificacoesContainer.itens.find((item) => {
      try {
        validarNotificacaoDiaria(item);
        return false;
      } catch (_error) {
        return true;
      }
    });

    if (validacaoErro) {
      return NotificacaoService.fail('Notificação diária inválida durante persistência do dispatch.', 400);
    }

    if (!NotificacaoService.saveNotificacoesContainer(notificacoesContainer)) {
      return NotificacaoService.fail(NotificacaoService.MESSAGES.PERSIST_NOTIFICACAO, 500);
    }

    return {
      success: true,
      processados: pendencias.length,
      enviados,
      falhas
    };
  }

  static reprocessarPendentes(): DispatchSuccessResult | NotificacaoFailResult {
    return NotificacaoService.dispatchDiario();
  }
}

export default NotificacaoService;
export type {
  DailyConsolidatedEmail,
  DispatchSuccessResult,
  EmailSender,
  NotificacaoFailResult,
  NotificacaoSuccessResult
};