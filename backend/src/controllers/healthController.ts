import { Request, Response } from 'express';
import HealthService from '../services/healthService';

class HealthController {
  static healthcheck(_req: Request, res: Response): void {
    const payload = HealthService.check();
    const statusCode = payload.status === 'ok' ? 200 : 500;

    res.status(statusCode).json(payload);
  }
}

export default HealthController;
