import fs from 'fs';
import path from 'path';

/**
 * Interface para resultado de operações JSON
 */
interface JsonRepositoryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Módulo centralizado para persistência em JSON
 * 
 * Responsabilidades:
 * - Leitura e escrita de arquivos JSON
 * - Tratamento de arquivo inexistente
 * - Tratamento de JSON inválido
 * - Escrita segura com estratégia atômica
 * 
 * Uso: Este é o ÚNICO ponto de acesso direto ao sistema de arquivos.
 * Todos os outros módulos devem consumir este repositório.
 */
class JsonRepository {
  private readonly dataDir: string;

  constructor(dataDir: string = path.join(__dirname, '../data')) {
    this.dataDir = dataDir;
    this.ensureDataDirExists();
  }

  /**
   * Garante que o diretório de dados existe
   */
  private ensureDataDirExists(): void {
    if (!fs.existsSync(this.dataDir)) {
      try {
        fs.mkdirSync(this.dataDir, { recursive: true });
      } catch (error: any) {
        console.error(`Erro ao criar diretório de dados: ${this.dataDir}`, error.message);
      }
    }
  }

  /**
   * Resolve o caminho completo de um arquivo de dados
   */
  private getFilePath(filename: string): string {
    return path.join(this.dataDir, filename);
  }

  /**
   * Lê dados de um arquivo JSON
   * 
   * @param filename Nome do arquivo (ex: "alunos.json")
   * @returns {JsonRepositoryResult} Resultado com dados ou erro
   * 
   * Tratamentos:
   * - Arquivo inexistente: retorna { success: false, error: "..." }
   * - JSON inválido: retorna { success: false, error: "..." }
   */
  read<T = any>(filename: string): JsonRepositoryResult<T> {
    const filePath = this.getFilePath(filename);

    try {
      // Verificar se arquivo existe
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: `Arquivo não encontrado: ${filename}`
        };
      }

      // Ler arquivo
      const content = fs.readFileSync(filePath, 'utf-8');

      // Validar JSON
      let data: T;
      try {
        data = JSON.parse(content);
      } catch (parseError: any) {
        return {
          success: false,
          error: `JSON inválido em ${filename}: ${parseError.message}`
        };
      }

      return {
        success: true,
        data
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro ao ler ${filename}: ${error.message}`
      };
    }
  }

  /**
   * Escreve dados em um arquivo JSON de forma segura
   * 
   * Estratégia de escrita segura:
   * 1. Serializar dados para JSON
   * 2. Escrever em arquivo temporário
   * 3. Renomear arquivo temporário para arquivo final (operação atômica)
   * 4. Arquivo final só existe completo e válido
   * 
   * @param filename Nome do arquivo (ex: "alunos.json")
   * @param data Dados a escrever (será serializeado para JSON)
   * @returns {JsonRepositoryResult} Resultado de sucesso ou erro
   */
  write<T = any>(filename: string, data: T): JsonRepositoryResult<void> {
    const filePath = this.getFilePath(filename);
    const tempFilePath = `${filePath}.tmp`;

    try {
      // Serializar dados
      let jsonString: string;
      try {
        jsonString = JSON.stringify(data, null, 2);
      } catch (stringifyError: any) {
        return {
          success: false,
          error: `Erro ao serializar dados: ${stringifyError.message}`
        };
      }

      // Escrever em arquivo temporário
      try {
        fs.writeFileSync(tempFilePath, jsonString, 'utf-8');
      } catch (writeError: any) {
        return {
          success: false,
          error: `Erro ao escrever arquivo temporário: ${writeError.message}`
        };
      }

      // Renomear arquivo temporário para arquivo final (operação atômica)
      try {
        fs.renameSync(tempFilePath, filePath);
      } catch (renameError: any) {
        // Tentar limpar arquivo temporário em caso de erro
        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        } catch (cleanupError) {
          // Ignorar erro de limpeza
        }
        return {
          success: false,
          error: `Erro ao finalizar escrita: ${renameError.message}`
        };
      }

      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro geral ao escrever ${filename}: ${error.message}`
      };
    }
  }

  /**
   * Lê dados existentes ou retorna valor padrão se arquivo não existe
   * Útil para inicialização segura de dados
   * 
   * @param filename Nome do arquivo
   * @param defaultData Dados padrão se arquivo não existir
   * @returns Dados do arquivo ou dados padrão
   */
  readOrDefault<T = any>(filename: string, defaultData: T): T {
    const result = this.read<T>(filename);
    if (result.success && result.data) {
      return result.data;
    }
    return defaultData;
  }

  /**
   * Verifica se um arquivo existe
   */
  exists(filename: string): boolean {
    const filePath = this.getFilePath(filename);
    return fs.existsSync(filePath);
  }

  /**
   * Deleta um arquivo
   */
  delete(filename: string): JsonRepositoryResult<void> {
    const filePath = this.getFilePath(filename);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro ao deletar ${filename}: ${error.message}`
      };
    }
  }
}

// Instância singleton
const jsonRepository = new JsonRepository();

export default jsonRepository;
export { JsonRepository, JsonRepositoryResult };
