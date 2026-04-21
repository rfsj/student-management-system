import { FormEvent, useEffect, useState } from 'react';

type Aluno = {
  id: string;
  nome: string;
  email?: string;
  dataCriacao: string;
  dataAtualizacao: string;
};

type FormState = {
  nome: string;
  email: string;
};

const API_BASE = 'http://localhost:3000/alunos';

function App() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [form, setForm] = useState<FormState>({ nome: '', email: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [erro, setErro] = useState<string>('');
  const [carregando, setCarregando] = useState<boolean>(false);

  async function carregarAlunos(): Promise<void> {
    setCarregando(true);
    setErro('');
    try {
      const response = await fetch(API_BASE);
      if (!response.ok) {
        throw new Error('Falha ao listar alunos.');
      }
      const data = (await response.json()) as Aluno[];
      setAlunos(data);
    } catch (error) {
      setErro((error as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarAlunos();
  }, []);

  function limparFormulario(): void {
    setForm({ nome: '', email: '' });
    setEditingId(null);
  }

  async function salvarAluno(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErro('');

    const payload = {
      nome: form.nome,
      email: form.email || undefined
    };

    try {
      const response = await fetch(editingId ? `${API_BASE}/${editingId}` : API_BASE, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error || 'Falha ao salvar aluno.');
      }

      await carregarAlunos();
      limparFormulario();
    } catch (error) {
      setErro((error as Error).message);
    }
  }

  function iniciarEdicao(aluno: Aluno): void {
    setEditingId(aluno.id);
    setForm({ nome: aluno.nome, email: aluno.email || '' });
  }

  async function removerAluno(id: string): Promise<void> {
    setErro('');
    try {
      const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error || 'Falha ao remover aluno.');
      }
      await carregarAlunos();
      if (editingId === id) {
        limparFormulario();
      }
    } catch (error) {
      setErro((error as Error).message);
    }
  }

  return (
    <main className="container">
      <h1>CRUD de Alunos</h1>

      <form className="form" onSubmit={(event) => void salvarAluno(event)}>
        <label>
          Nome
          <input
            value={form.nome}
            onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))}
            placeholder="Nome do aluno"
            required
          />
        </label>

        <label>
          Email
          <input
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="email@exemplo.com"
            type="email"
          />
        </label>

        <div className="actions">
          <button type="submit">{editingId ? 'Atualizar' : 'Criar'} aluno</button>
          {editingId && (
            <button type="button" className="secondary" onClick={limparFormulario}>
              Cancelar edicao
            </button>
          )}
        </div>
      </form>

      {erro && <p className="erro">{erro}</p>}

      {carregando ? (
        <p>Carregando alunos...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((aluno) => (
              <tr key={aluno.id}>
                <td>{aluno.nome}</td>
                <td>{aluno.email || '-'}</td>
                <td className="row-actions">
                  <button type="button" className="secondary" onClick={() => iniciarEdicao(aluno)}>
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
    </main>
  );
}

export default App;
