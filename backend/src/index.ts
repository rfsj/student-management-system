import express from 'express';
import { default as jsonRepository } from './repositories/jsonRepository';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    // Testa se a persistência está funcionando
    const persisted = jsonRepository.exists('health-check');
    
    res.status(200).json({
      status: 'ok',
      message: 'Sistema de gerenciamento de alunos - Backend operacional',
      persistence: persisted ? 'arquivo de teste existe' : 'diretório de dados acessível',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erro ao verificar persistência',
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});

export default app;
