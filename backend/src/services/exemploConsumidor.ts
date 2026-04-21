/**
 * Exemplo de como consumir o módulo centralizado de persistência
 */

import jsonRepository from '../repositories/jsonRepository';
import { 
  DataContainer, 
  Aluno, 
  validarAluno 
} from '../types/domain';

/**
 * Exemplo 1: Ler alunos existentes ou retornar lista vazia se não existe
 */
export function exemplo1_lerAlunos() {
  const container = jsonRepository.readOrDefault<DataContainer<Aluno>>(
    'alunos.json',
    {
      versao: '1.0',
      ultimaAtualizacao: new Date().toISOString(),
      itens: []
    }
  );

  console.log(`Alunos lidos: ${container.itens.length}`);
  return container;
}

/**
 * Exemplo 2: Escrever alunos de forma segura
 */
export function exemplo2_salvarAlunos(alunos: Aluno[]) {
  const container: DataContainer<Aluno> = {
    versao: '1.0',
    ultimaAtualizacao: new Date().toISOString(),
    itens: alunos
  };

  const result = jsonRepository.write('alunos.json', container);

  if (result.success) {
    console.log(`Alunos salvos com sucesso: ${alunos.length}`);
  } else {
    console.error(`Erro ao salvar alunos: ${result.error}`);
  }

  return result;
}

/**
 * Exemplo 3: Tratar erros de leitura (JSON inválido)
 */
export function exemplo3_lerComTratamentoDeErro() {
  const result = jsonRepository.read<DataContainer<Aluno>>('alunos.json');

  if (result.success && result.data) {
    console.log(`Lidos ${result.data.itens.length} alunos`);
    return result.data;
  } else {
    console.error(`Erro: ${result.error}`);
    console.log('Retornando container vazio como fallback');
    return {
      versao: '1.0',
      ultimaAtualizacao: new Date().toISOString(),
      itens: []
    };
  }
}

/**
 * Exemplo 4: Verificar e deletar
 */
export function exemplo4_verificarEDeletar() {
  if (jsonRepository.exists('backup.json')) {
    console.log('Backup encontrado, deletando');
    const deleteResult = jsonRepository.delete('backup.json');
    if (deleteResult.success) {
      console.log('Backup deletado');
    } else {
      console.error(`Erro ao deletar: ${deleteResult.error}`);
    }
  }
}

/**
 * Padrão recomendado para serviços
 * 
 * Em vez de acessar arquivos diretamente, crie um serviço que usa jsonRepository:
 */
export class ExemploAlunoService {
  /**
   * Buscar todos os alunos
   */
  static buscarTodos(): Aluno[] {
    const result = jsonRepository.read<DataContainer<Aluno>>('alunos.json');

    if (!result.success || !result.data) {
      console.warn(`Erro ao buscar alunos: ${result.error}`);
      return [];
    }

    return result.data.itens;
  }

  /**
   * Criar novo aluno
   * Valida os dados antes de persistir
   */
  static criar(aluno: Aluno): boolean {
    try {
      // Validar dados antes de persistir
      validarAluno(aluno);
    } catch (error: any) {
      console.error(`Validação falhou: ${error.message}`);
      return false;
    }

    const container = jsonRepository.readOrDefault<DataContainer<Aluno>>(
      'alunos.json',
      {
        versao: '1.0',
        ultimaAtualizacao: new Date().toISOString(),
        itens: []
      }
    );

    // Verificar ID duplicado
    if (container.itens.some(a => a.id === aluno.id)) {
      console.error(`Aluno com ID ${aluno.id} já existe`);
      return false;
    }

    container.itens.push(aluno);
    container.ultimaAtualizacao = new Date().toISOString();

    const result = jsonRepository.write('alunos.json', container);
    return result.success;
  }

  /**
   * Atualizar aluno
   */
  static atualizar(id: string, alunoAtualizado: Partial<Aluno>): boolean {
    const container = jsonRepository.readOrDefault<DataContainer<Aluno>>(
      'alunos.json',
      { versao: '1.0', ultimaAtualizacao: new Date().toISOString(), itens: [] }
    );

    const index = container.itens.findIndex(a => a.id === id);
    if (index === -1) {
      console.error(`Aluno com ID ${id} não encontrado`);
      return false;
    }

    container.itens[index] = {
      ...container.itens[index],
      ...alunoAtualizado,
      dataAtualizacao: new Date().toISOString()
    };

    container.ultimaAtualizacao = new Date().toISOString();

    const result = jsonRepository.write('alunos.json', container);
    return result.success;
  }

  /**
   * Deletar aluno
   */
  static deletar(id: string): boolean {
    const container = jsonRepository.readOrDefault<DataContainer<Aluno>>(
      'alunos.json',
      { versao: '1.0', ultimaAtualizacao: new Date().toISOString(), itens: [] }
    );

    const index = container.itens.findIndex(a => a.id === id);
    if (index === -1) {
      console.error(`Aluno com ID ${id} não encontrado`);
      return false;
    }

    container.itens.splice(index, 1);
    container.ultimaAtualizacao = new Date().toISOString();

    const result = jsonRepository.write('alunos.json', container);
    return result.success;
  }
}

export default ExemploAlunoService;
