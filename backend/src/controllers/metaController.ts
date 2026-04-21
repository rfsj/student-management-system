import { Request, Response } from 'express';
import MetaService from '../services/metaService';

class MetaController {
  private static sendError(res: Response, status: number, error?: string): void {
    res.status(status).json({ error: error ?? 'Erro inesperado no modulo de metas.' });
  }

  static listar(_req: Request, res: Response): void {
    const metas = MetaService.listar();
    res.status(200).json(metas);
  }

  static criar(req: Request, res: Response): void {
    const { nome, descricao } = req.body as { nome?: string; descricao?: string };
    const result = MetaService.criar({ nome: nome ?? '', descricao });

    if (!result.success) {
      MetaController.sendError(res, 400, result.error);
      return;
    }

    res.status(201).json(result.meta);
  }
}

export default MetaController;
