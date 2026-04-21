import { FormEvent, useEffect, useState } from 'react';

type Aluno = {
  id: string;
  nome: string;
  email?: string;
  dataCriacao: string;
  dataAtualizacao: string;
};

type Turma = {
  id: string;
  nome: string;
  descricao?: string;
  dataCriacao: string;
  dataAtualizacao: string;
};

type AlunoFormState = {
  nome: string;
  email: string;
};

type TurmaFormState = {
  nome: string;
  descricao: string;
};

const ALUNO_API_BASE = 'http://localhost:3000/alunos';
const TURMA_API_BASE = 'http://localhost:3000/turmas';

function App() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunoForm, setAlunoForm] = useState<AlunoFormState>({ nome: '', email: '' });
  const [turmaForm, setTurmaForm] = useState<TurmaFormState>({ nome: '', descricao: '' });
  const [editingAlunoId, setEditingAlunoId] = useState<string | null>(null);
  const [editingTurmaId, setEditingTurmaId] = useState<string | null>(null);
  const [erroAlunos, setErroAlunos] = useState<string>('');
  const [erroTurmas, setErroTurmas] = useState<string>('');
  const [carregandoAlunos, setCarregandoAlunos] = useState<boolean>(false);
  const [carregandoTurmas, setCarregandoTurmas] = useState<boolean>(false);

  async function carregarAlunos(): Promise<void> {
    setCarregandoAlunos(true);
    setErroAlunos('');
    try {
      const response = await fetch(ALUNO_API_BASE);
      if (!response.ok) {
        throw new Error('Falha ao listar alunos.');
      }
      const data = (await response.json()) as Aluno[];
      setAlunos(data);
    } catch (error) {
      setErroAlunos((error as Error).message);
    } finally {
      setCarregandoAlunos(false);
    }
  }

  async function carregarTurmas(): Promise<void> {
    setCarregandoTurmas(true);
    setErroTurmas('');
    try {
      const response = await fetch(TURMA_API_BASE);
      if (!response.ok) {
        throw new Error('Falha ao listar turmas.');
      }
      const data = (await response.json()) as Turma[];
      setTurmas(data);
    } catch (error) {
      setErroTurmas((error as Error).message);
    } finally {
      setCarregandoTurmas(false);
    }
  }

  useEffect(() => {
    void carregarAlunos();
    void carregarTurmas();
  }, []);

  function limparFormularioAluno(): void {
    setAlunoForm({ nome: '', email: '' });
    setEditingAlunoId(null);
  }

  function limparFormularioTurma(): void {
    setTurmaForm({ nome: '', descricao: '' });
    setEditingTurmaId(null);
  }

  async function salvarAluno(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErroAlunos('');

    const payload = {
      nome: alunoForm.nome,
      email: alunoForm.email || undefined
    };

    try {
      const response = await fetch(editingAlunoId ? `${ALUNO_API_BASE}/${editingAlunoId}` : ALUNO_API_BASE, {
        method: editingAlunoId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error || 'Falha ao salvar aluno.');
      }

      await carregarAlunos();
      limparFormularioAluno();
    } catch (error) {
      setErroAlunos((error as Error).message);
    }
  }

  async function salvarTurma(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErroTurmas('');

    const payload = {
      nome: turmaForm.nome,
      descricao: turmaForm.descricao || undefined
    };

    try {
      const response = await fetch(editingTurmaId ? `${TURMA_API_BASE}/${editingTurmaId}` : TURMA_API_BASE, {
        method: editingTurmaId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error || 'Falha ao salvar turma.');
      }

      await carregarTurmas();
      limparFormularioTurma();
    } catch (error) {
      setErroTurmas((error as Error).message);
    }
  }

  function iniciarEdicaoAluno(aluno: Aluno): void {
    setEditingAlunoId(aluno.id);
    setAlunoForm({ nome: aluno.nome, email: aluno.email || '' });
  }

  function iniciarEdicaoTurma(turma: Turma): void {
    setEditingTurmaId(turma.id);
    setTurmaForm({ nome: turma.nome, descricao: turma.descricao || '' });
  }

  async function removerAluno(id: string): Promise<void> {
    setErroAlunos('');
    try {
      const response = await fetch(`${ALUNO_API_BASE}/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error || 'Falha ao remover aluno.');
      }
      await carregarAlunos();
      if (editingAlunoId === id) {
        limparFormularioAluno();
      }
    } catch (error) {
      setErroAlunos((error as Error).message);
    }
  }

  async function removerTurma(id: string): Promise<void> {
    setErroTurmas('');
    try {
      const response = await fetch(`${TURMA_API_BASE}/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error || 'Falha ao remover turma.');
      }
      await carregarTurmas();
      if (editingTurmaId === id) {
        limparFormularioTurma();
      }
    } catch (error) {
      setErroTurmas((error as Error).message);
    }
  }

  return (
    <main className="container">
      <h1>Gestão Escolar</h1>

      <section className="panel">
        <h2>Alunos</h2>

        <form className="form" onSubmit={(event) => void salvarAluno(event)}>
          <label>
            Nome
            <input
              value={alunoForm.nome}
              onChange={(event) => setAlunoForm((previous) => ({ ...previous, nome: event.target.value }))}
              placeholder="Nome do aluno"
              required
            />
          </label>

          <label>
            Email
            <input
              value={alunoForm.email}
              onChange={(event) => setAlunoForm((previous) => ({ ...previous, email: event.target.value }))}
              placeholder="email@exemplo.com"
              type="email"
            />
          </label>

          <div className="actions">
            <button type="submit">{editingAlunoId ? 'Atualizar' : 'Criar'} aluno</button>
            {editingAlunoId && (
              <button type="button" className="secondary" onClick={limparFormularioAluno}>
                Cancelar edição
              </button>
            )}
          </div>
        </form>

        {erroAlunos && <p className="erro">{erroAlunos}</p>}

        {carregandoAlunos ? (
          <p>Carregando alunos...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {alunos.map((aluno) => (
                <tr key={aluno.id}>
                  <td>{aluno.nome}</td>
                  <td>{aluno.email || '-'}</td>
                  <td className="row-actions">
                    <button type="button" className="secondary" onClick={() => iniciarEdicaoAluno(aluno)}>
                      Editar
                    </button>
                    <button type="button" className="danger" onClick={() => void removerAluno(aluno.id)}>
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
              {alunos.length === 0 && (
                <tr>
                  <td colSpan={3}>Nenhum aluno cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <h2>Turmas</h2>

        <form className="form" onSubmit={(event) => void salvarTurma(event)}>
          <label>
            Nome
            <input
              value={turmaForm.nome}
              onChange={(event) => setTurmaForm((previous) => ({ ...previous, nome: event.target.value }))}
              placeholder="Nome da turma"
              required
            />
          </label>

          <label>
            Descrição
            <input
              value={turmaForm.descricao}
              onChange={(event) => setTurmaForm((previous) => ({ ...previous, descricao: event.target.value }))}
              placeholder="Descrição da turma"
            />
          </label>

          <div className="actions">
            <button type="submit">{editingTurmaId ? 'Atualizar' : 'Criar'} turma</button>
            {editingTurmaId && (
              <button type="button" className="secondary" onClick={limparFormularioTurma}>
                Cancelar edição
              </button>
            )}
          </div>
        </form>

        {erroTurmas && <p className="erro">{erroTurmas}</p>}

        {carregandoTurmas ? (
          <p>Carregando turmas...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {turmas.map((turma) => (
                <tr key={turma.id}>
                  <td>{turma.nome}</td>
                  <td>{turma.descricao || '-'}</td>
                  <td className="row-actions">
                    <button type="button" className="secondary" onClick={() => iniciarEdicaoTurma(turma)}>
                      Editar
                    </button>
                    <button type="button" className="danger" onClick={() => void removerTurma(turma.id)}>
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
              {turmas.length === 0 && (
                <tr>
                  <td colSpan={3}>Nenhuma turma cadastrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

export default App;
