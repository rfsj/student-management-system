import jsonRepository from '../repositories/jsonRepository';
import { Aluno, DataContainer, Turma } from '../types/domain';

type MatriculaFailResult = {
  success: false;
  error: string;
  status: 400 | 404 | 500;
};

type MatriculaSuccessResult = {
  success: true;
  turma: Turma;
};

type TurmaComAlunosResult = {
  success: true;
  turma: Turma;
  alunos: Aluno[];
};

class MatriculaService {
  private static readonly TURMAS_FILE = 'turmas.json';
  private static readonly ALUNOS_FILE = 'alunos.json';

  private static readonly MESSAGES = {
    TURMA_NOT_FOUND: 'Turma não encontrada.',
    ALUNO_NOT_FOUND: 'Aluno não encontrado.',
    MATRICULA_DUPLICADA: 'Aluno já matriculado na turma.',
    MATRICULA_NOT_FOUND: 'Matrícula não encontrada para esta turma.',
    PERSIST_UPDATE: 'Falha ao persistir atualização de matrícula.'
  };

  private static fail(error: string, status: 400 | 404 | 500): MatriculaFailResult {
    return { success: false, error, status };
  }

  private static loadTurmasContainer(): DataContainer<Turma> {
    return jsonRepository.readOrDefault<DataContainer<Turma>>(MatriculaService.TURMAS_FILE, {
      versao: '1.0',
      ultimaAtualizacao: new Date().toISOString(),
      itens: []
    });
  }

  private static loadAlunosContainer(): DataContainer<Aluno> {
    return jsonRepository.readOrDefault<DataContainer<Aluno>>(MatriculaService.ALUNOS_FILE, {
      versao: '1.0',
      ultimaAtualizacao: new Date().toISOString(),
      itens: []
    });
  }

  private static saveTurmasContainer(container: DataContainer<Turma>): boolean {
    container.ultimaAtualizacao = new Date().toISOString();
    const writeResult = jsonRepository.write(MatriculaService.TURMAS_FILE, container);
    return writeResult.success;
  }

  static matricular(alunoId: string, turmaId: string): MatriculaSuccessResult | MatriculaFailResult {
    const turmasContainer = MatriculaService.loadTurmasContainer();
    const alunosContainer = MatriculaService.loadAlunosContainer();

    const turmaIndex = turmasContainer.itens.findIndex((item) => item.id === turmaId);
    if (turmaIndex === -1) {
      return MatriculaService.fail(MatriculaService.MESSAGES.TURMA_NOT_FOUND, 404);
    }

    const alunoExiste = alunosContainer.itens.some((item) => item.id === alunoId);
    if (!alunoExiste) {
      return MatriculaService.fail(MatriculaService.MESSAGES.ALUNO_NOT_FOUND, 404);
    }

    const turma = turmasContainer.itens[turmaIndex];
    const alunoIds = turma.alunoIds ?? [];

    if (alunoIds.includes(alunoId)) {
      return MatriculaService.fail(MatriculaService.MESSAGES.MATRICULA_DUPLICADA, 400);
    }

    const turmaAtualizada: Turma = {
      ...turma,
      alunoIds: [...alunoIds, alunoId],
      dataAtualizacao: new Date().toISOString()
    };

    turmasContainer.itens[turmaIndex] = turmaAtualizada;

    if (!MatriculaService.saveTurmasContainer(turmasContainer)) {
      return MatriculaService.fail(MatriculaService.MESSAGES.PERSIST_UPDATE, 500);
    }

    return { success: true, turma: turmaAtualizada };
  }

  static desmatricular(alunoId: string, turmaId: string): MatriculaSuccessResult | MatriculaFailResult {
    const turmasContainer = MatriculaService.loadTurmasContainer();
    const alunosContainer = MatriculaService.loadAlunosContainer();

    const turmaIndex = turmasContainer.itens.findIndex((item) => item.id === turmaId);
    if (turmaIndex === -1) {
      return MatriculaService.fail(MatriculaService.MESSAGES.TURMA_NOT_FOUND, 404);
    }

    const alunoExiste = alunosContainer.itens.some((item) => item.id === alunoId);
    if (!alunoExiste) {
      return MatriculaService.fail(MatriculaService.MESSAGES.ALUNO_NOT_FOUND, 404);
    }

    const turma = turmasContainer.itens[turmaIndex];
    const alunoIds = turma.alunoIds ?? [];

    if (!alunoIds.includes(alunoId)) {
      return MatriculaService.fail(MatriculaService.MESSAGES.MATRICULA_NOT_FOUND, 404);
    }

    const turmaAtualizada: Turma = {
      ...turma,
      alunoIds: alunoIds.filter((id) => id !== alunoId),
      dataAtualizacao: new Date().toISOString()
    };

    turmasContainer.itens[turmaIndex] = turmaAtualizada;

    if (!MatriculaService.saveTurmasContainer(turmasContainer)) {
      return MatriculaService.fail(MatriculaService.MESSAGES.PERSIST_UPDATE, 500);
    }

    return { success: true, turma: turmaAtualizada };
  }

  static visualizarTurmaComAlunos(turmaId: string): TurmaComAlunosResult | MatriculaFailResult {
    const turmasContainer = MatriculaService.loadTurmasContainer();
    const alunosContainer = MatriculaService.loadAlunosContainer();

    const turma = turmasContainer.itens.find((item) => item.id === turmaId);
    if (!turma) {
      return MatriculaService.fail(MatriculaService.MESSAGES.TURMA_NOT_FOUND, 404);
    }

    const alunoIds = turma.alunoIds ?? [];
    const alunos = alunosContainer.itens.filter((item) => alunoIds.includes(item.id));

    return {
      success: true,
      turma,
      alunos
    };
  }
}

export default MatriculaService;
