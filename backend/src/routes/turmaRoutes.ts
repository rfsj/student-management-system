import { Router } from 'express';
import TurmaController from '../controllers/turmaController';

const turmaRoutes = Router();

turmaRoutes.get('/', TurmaController.listar);
turmaRoutes.post('/', TurmaController.criar);
turmaRoutes.put('/:id', TurmaController.atualizar);
turmaRoutes.delete('/:id', TurmaController.remover);

export default turmaRoutes;
