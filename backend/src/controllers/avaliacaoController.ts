import { Request, Response } from 'express';
import AvaliacaoService from '../services/avaliacaoService';

class AvaliacaoController {
  private static sendError(res: Response, status: number, error?: string): void {
    res.status(status).json({ error: error ?? 'Erro inesperado no modulo de avaliacao.' });
  }

  static lancar(req: Request, res: Response): void {
    const { turmaId, alunoId, metaId, conceito, notas } = req.body as {
      turmaId?: string;
      alunoId?: string;
      metaId?: string;
      conceito?: string;
      notas?: string;
    };

    const result = AvaliacaoService.lancar({
      turmaId: turmaId ?? '',
      alunoId: alunoId ?? '',
      metaId: metaId ?? '',
      conceito: conceito ?? '',
      notas
    });

    if (!result.success) {
      AvaliacaoController.sendError(res, result.status, result.error);
      return;
    }

    res.status(201).json(result.avaliacao);
  }

  static alterar(req: Request, res: Response): void {
    const { id } = req.params;
    const { conceito, notas } = req.body as { conceito?: string; notas?: string };

    const result = AvaliacaoService.alterar(id, {
      conceito: conceito ?? '',
      notas
    });

    if (!result.success) {
      AvaliacaoController.sendError(res, result.status, result.error);
      return;
    }

    res.status(200).json(result.avaliacao);
  }
}

export default AvaliacaoController;
