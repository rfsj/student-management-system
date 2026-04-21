import { Router } from 'express';
import MetaController from '../controllers/metaController';

const metaRoutes = Router();

metaRoutes.get('/', MetaController.listar);
metaRoutes.post('/', MetaController.criar);

export default metaRoutes;
