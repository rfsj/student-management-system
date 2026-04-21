import express from 'express';
import HealthController from './controllers/healthController';
import alunoRoutes from './routes/alunoRoutes';
import turmaRoutes from './routes/turmaRoutes';
import metaRoutes from './routes/metaRoutes';
import avaliacaoRoutes from './routes/avaliacaoRoutes';
import consolidacaoRoutes from './routes/consolidacaoRoutes';
import notificacaoRoutes from './routes/notificacaoRoutes';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

// Health check endpoint
app.get('/health', HealthController.healthcheck);

// Alunos CRUD
app.use('/alunos', alunoRoutes);

// Turmas CRUD
app.use('/turmas', turmaRoutes);

// Metas
app.use('/metas', metaRoutes);

// Avaliacoes
app.use('/avaliacoes', avaliacaoRoutes);

// Consolidacao de alteracoes
app.use('/consolidacoes', consolidacaoRoutes);

// Notificacoes por email
app.use('/notificacoes', notificacaoRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});

export default app;
