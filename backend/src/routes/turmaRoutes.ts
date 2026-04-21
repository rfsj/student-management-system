import { Router } from 'express';
import TurmaController from '../controllers/turmaController';

const turmaRoutes = Router();

turmaRoutes.get('/', TurmaController.listar);
turmaRoutes.get('/:id/alunos', TurmaController.visualizarComAlunos);
turmaRoutes.post('/', TurmaController.criar);
turmaRoutes.post('/:id/alunos/:alunoId', TurmaController.matricular);
turmaRoutes.put('/:id', TurmaController.atualizar);
turmaRoutes.delete('/:id', TurmaController.remover);
turmaRoutes.delete('/:id/alunos/:alunoId', TurmaController.desmatricular);

export default turmaRoutes;
