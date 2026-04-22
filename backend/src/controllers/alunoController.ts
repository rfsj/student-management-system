import { Request, Response } from 'express';
import AlunoService from '../services/alunoService';

class AlunoController {
  private static sendError(res: Response, status: number, error?: string): void {
    res.status(status).json({ error: error ?? 'Erro inesperado no modulo de alunos.' });
  }

  static listar(_req: Request, res: Response): void {
    const alunos = AlunoService.listar();
    res.status(200).json(alunos);
  }

  static criar(req: Request, res: Response): void {
    const { nome, cpf, email } = req.body as { nome?: string; cpf?: string; email?: string };
    const result = AlunoService.criar({ nome: nome ?? '', cpf: cpf ?? '', email });

    if (!result.success) {
      AlunoController.sendError(res, 400, result.error);
      return;
    }

    res.status(201).json(result.aluno);
  }

  static atualizar(req: Request, res: Response): void {
    const { id } = req.params;
    const { nome, cpf, email } = req.body as { nome?: string; cpf?: string; email?: string };
    const result = AlunoService.atualizar(id, { nome, cpf, email });

    if (!result.success && result.notFound) {
      AlunoController.sendError(res, 404, result.error);
      return;
    }

    if (!result.success) {
      AlunoController.sendError(res, 400, result.error);
      return;
    }

    res.status(200).json(result.aluno);
  }

  static remover(req: Request, res: Response): void {
    const { id } = req.params;
    const result = AlunoService.remover(id);

    if (!result.success && result.notFound) {
      AlunoController.sendError(res, 404, result.error);
      return;
    }

    if (!result.success && result.conflict) {
      AlunoController.sendError(res, 409, result.error);
      return;
    }

    if (!result.success) {
      AlunoController.sendError(res, 500, result.error);
      return;
    }

    res.status(204).send();
  }
}

export default AlunoController;
