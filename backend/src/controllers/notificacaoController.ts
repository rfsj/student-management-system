import { Request, Response } from 'express';
import { StatusNotificacaoDiaria } from '../types/domain';
import NotificacaoService from '../services/notificacaoService';

class NotificacaoController {
  private static sendError(res: Response, status: number, error?: string): void {
    res.status(status).json({ error: error ?? 'Erro inesperado no modulo de notificacao.' });
  }

  static dispatchDiario(req: Request, res: Response): void {
    const { dataSimples } = req.body as { dataSimples?: string };
    const result = NotificacaoService.dispatchDiario(dataSimples);

    if (!result.success) {
      NotificacaoController.sendError(res, result.status, result.error);
      return;
    }

    res.status(200).json({
      mensagem: 'Dispatch diário executado com sucesso.',
      processados: result.processados,
      enviados: result.enviados,
      falhas: result.falhas
    });
  }

  static reprocessarPendentes(_req: Request, res: Response): void {
    const result = NotificacaoService.reprocessarPendentes();

    if (!result.success) {
      NotificacaoController.sendError(res, result.status, result.error);
      return;
    }

    res.status(200).json({
      mensagem: 'Reprocessamento de pendências executado com sucesso.',
      processados: result.processados,
      enviados: result.enviados,
      falhas: result.falhas
    });
  }

  static listarPendencias(req: Request, res: Response): void {
    const { status } = req.query as { status?: StatusNotificacaoDiaria };
    const result = NotificacaoService.listarNotificacoes(status);

    if (!result.success) {
      NotificacaoController.sendError(res, result.status, result.error);
      return;
    }

    res.status(200).json(result.itens);
  }

  static listarEmailsEnviados(req: Request, res: Response): void {
    const { alunoId, data } = req.query as { alunoId?: string; data?: string };
    const result = NotificacaoService.listarEmailsEnviados(alunoId, data);

    res.status(200).json(result.itens);
  }
}

export default NotificacaoController;