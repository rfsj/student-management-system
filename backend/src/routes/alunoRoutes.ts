import { Router } from 'express';
import AlunoController from '../controllers/alunoController';

const alunoRoutes = Router();

alunoRoutes.get('/', AlunoController.listar);
alunoRoutes.post('/', AlunoController.criar);
alunoRoutes.put('/:id', AlunoController.atualizar);
alunoRoutes.delete('/:id', AlunoController.remover);

export default alunoRoutes;
