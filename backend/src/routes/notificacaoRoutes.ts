import { Router } from 'express';
import NotificacaoController from '../controllers/notificacaoController';

const notificacaoRoutes = Router();

notificacaoRoutes.post('/dispatch', NotificacaoController.dispatchDiario);
notificacaoRoutes.post('/reprocessar', NotificacaoController.reprocessarPendentes);
notificacaoRoutes.get('/pendencias', NotificacaoController.listarPendencias);
notificacaoRoutes.get('/enviados', NotificacaoController.listarEmailsEnviados);

export default notificacaoRoutes;