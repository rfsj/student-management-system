import { Request, Response } from 'express';
import TurmaService from '../services/turmaService';

class TurmaController {
  private static sendError(res: Response, status: number, error?: string): void {
    res.status(status).json({ error: error ?? 'Erro inesperado no modulo de turmas.' });
  }

  static listar(_req: Request, res: Response): void {
    const turmas = TurmaService.listar();
    res.status(200).json(turmas);
  }

  static criar(req: Request, res: Response): void {
    const { nome, descricao } = req.body as { nome?: string; descricao?: string };
    const result = TurmaService.criar({ nome: nome ?? '', descricao });

    if (!result.success) {
      TurmaController.sendError(res, 400, result.error);
      return;
    }

    res.status(201).json(result.turma);
  }

  static atualizar(req: Request, res: Response): void {
    const { id } = req.params;
    const { nome, descricao } = req.body as { nome?: string; descricao?: string };
    const result = TurmaService.atualizar(id, { nome, descricao });

    if (!result.success && result.notFound) {
      TurmaController.sendError(res, 404, result.error);
      return;
    }

    if (!result.success) {
      TurmaController.sendError(res, 400, result.error);
      return;
    }

    res.status(200).json(result.turma);
  }

  static remover(req: Request, res: Response): void {
    const { id } = req.params;
    const result = TurmaService.remover(id);

    if (!result.success && result.notFound) {
      TurmaController.sendError(res, 404, result.error);
      return;
    }

    if (!result.success) {
      TurmaController.sendError(res, 500, result.error);
      return;
    }

    res.status(204).send();
  }
}

export default TurmaController;
