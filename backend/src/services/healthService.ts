import jsonRepository from '../repositories/jsonRepository';

interface HealthcheckPayload {
  status: 'ok' | 'error';
  message: string;
  persistence?: string;
  timestamp: string;
}

class HealthService {
  static check(): HealthcheckPayload {
    try {
      const persisted = jsonRepository.exists('health-check');

      return {
        status: 'ok',
        message: 'Sistema de gerenciamento de alunos - Backend operacional',
        persistence: persisted ? 'arquivo de teste existe' : 'diretorio de dados acessivel',
        timestamp: new Date().toISOString()
      };
    } catch (_error) {
      return {
        status: 'error',
        message: 'Erro ao verificar persistencia',
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default HealthService;
export type { HealthcheckPayload };
