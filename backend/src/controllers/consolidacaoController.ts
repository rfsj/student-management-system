import { Request, Response } from 'express';
import ConsolidacaoService from '../services/consolidacaoService';

class ConsolidacaoController {
  private static sendError(res: Response, status: number, error?: string): void {
    res.status(status).json({ error: error ?? 'Erro inesperado no modulo de consolidacao.' });
  }

  static reprocessar(_req: Request, res: Response): void {
    const result = ConsolidacaoService.reprocessarTudo();

    if (!result.success) {
      ConsolidacaoController.sendError(res, result.status, result.error);
      return;
    }

    res.status(200).json({ mensagem: 'Consolidação reprocessada com sucesso.' });
  }

  static consultarPorAluno(req: Request, res: Response): void {
    const { alunoId } = req.params;
    const { data } = req.query as { data?: string };

    const result = data
      ? ConsolidacaoService.consultarPorAlunoEData(alunoId, data)
      : ConsolidacaoService.consultarPorAluno(alunoId);

    if (result.itens.length === 0) {
      ConsolidacaoController.sendError(res, 404, 'Nenhum consolidado encontrado para os critérios informados.');
      return;
    }

    res.status(200).json(result.itens);
  }
}

export default ConsolidacaoController;
