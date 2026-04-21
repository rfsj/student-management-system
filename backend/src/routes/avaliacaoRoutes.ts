import { Router } from 'express';
import AvaliacaoController from '../controllers/avaliacaoController';

const avaliacaoRoutes = Router();

avaliacaoRoutes.post('/', AvaliacaoController.lancar);
avaliacaoRoutes.put('/:id', AvaliacaoController.alterar);

export default avaliacaoRoutes;
