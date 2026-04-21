import { Router } from 'express';
import ConsolidacaoController from '../controllers/consolidacaoController';

const consolidacaoRoutes = Router();

consolidacaoRoutes.post('/reprocessar', ConsolidacaoController.reprocessar);
consolidacaoRoutes.get('/alunos/:alunoId', ConsolidacaoController.consultarPorAluno);

export default consolidacaoRoutes;
