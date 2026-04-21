import express from 'express';
import HealthController from './controllers/healthController';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', HealthController.healthcheck);

// Start server
app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});

export default app;
