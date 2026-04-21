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
  alunoIds: string[];
  dataCriacao: string;
  dataAtualizacao: string;
};

type Meta = {
  id: string;
  nome: string;
  descricao?: string;
};

type Conceito = 'MANA' | 'MPA' | 'MA';

type Avaliacao = {
  id: string;
  alunoId: string;
  turmaId: string;
  metaId: string;
  conceito: Conceito;
  notas?: string;
  dataCriacao: string;
  dataAtualizacao: string;
};

type TurmaComAvaliacoesResponse = {
  turma: Turma;
  alunos: Aluno[];
  metas: Meta[];
  avaliacoes: Avaliacao[];
};

type AlunoFormState = {
  nome: string;
  email: string;
};

type TurmaFormState = {
  nome: string;
  descricao: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const ALUNO_API_BASE = `${API_BASE_URL}/alunos`;
const TURMA_API_BASE = `${API_BASE_URL}/turmas`;
const META_API_BASE = `${API_BASE_URL}/metas`;
const AVALIACAO_API_BASE = `${API_BASE_URL}/avaliacoes`;

function App() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunoForm, setAlunoForm] = useState<AlunoFormState>({ nome: '', email: '' });
  const [turmaForm, setTurmaForm] = useState<TurmaFormState>({ nome: '', descricao: '' });
  const [editingAlunoId, setEditingAlunoId] = useState<string | null>(null);
  const [editingTurmaId, setEditingTurmaId] = useState<string | null>(null);
  const [alunosPorTurma, setAlunosPorTurma] = useState<Record<string, Aluno[]>>({});
  const [avaliacoesPorTurma, setAvaliacoesPorTurma] = useState<Record<string, Avaliacao[]>>({});
  const [metas, setMetas] = useState<Meta[]>([]);
  const [alunoSelecionadoPorTurma, setAlunoSelecionadoPorTurma] = useState<Record<string, string>>({});
  const [conceitoSelecionadoPorCelula, setConceitoSelecionadoPorCelula] = useState<Record<string, string>>({});
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

  async function carregarMetas(): Promise<void> {
    try {
      const response = await fetch(META_API_BASE);
      if (!response.ok) {
        throw new Error('Falha ao listar metas.');
      }

      const data = (await response.json()) as Meta[];
      setMetas(data);
    } catch (error) {
      setErroTurmas((error as Error).message);
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

      const detalhes = await Promise.all(
        data.map(async (turma) => {
          const detalheResponse = await fetch(`${TURMA_API_BASE}/${turma.id}/avaliacoes`);
          if (!detalheResponse.ok) {
            throw new Error('Falha ao carregar avaliações da turma.');
          }

          const detalhe = (await detalheResponse.json()) as TurmaComAvaliacoesResponse;
          return {
            turmaId: turma.id,
            alunos: detalhe.alunos,
            avaliacoes: detalhe.avaliacoes
          };
        })
      );

      const alunosMapeados = detalhes.reduce<Record<string, Aluno[]>>((accumulator, item) => {
        accumulator[item.turmaId] = item.alunos;
        return accumulator;
      }, {});

      const avaliacoesMapeadas = detalhes.reduce<Record<string, Avaliacao[]>>((accumulator, item) => {
        accumulator[item.turmaId] = item.avaliacoes;
        return accumulator;
      }, {});

      setAlunosPorTurma(alunosMapeados);
      setAvaliacoesPorTurma(avaliacoesMapeadas);
    } catch (error) {
      setErroTurmas((error as Error).message);
    } finally {
      setCarregandoTurmas(false);
    }
  }

  useEffect(() => {
    void carregarAlunos();
    void carregarMetas();
    void carregarTurmas();
  }, []);

  function chaveCelulaAvaliacao(turmaId: string, alunoId: string, metaId: string): string {
    return `${turmaId}::${alunoId}::${metaId}`;
  }

  function buscarAvaliacao(turmaId: string, alunoId: string, metaId: string): Avaliacao | undefined {
    return (avaliacoesPorTurma[turmaId] ?? []).find(
      (avaliacao) => avaliacao.alunoId === alunoId && avaliacao.metaId === metaId
    );
  }

  function conceitoSelecionado(turmaId: string, alunoId: string, metaId: string): string {
    const chave = chaveCelulaAvaliacao(turmaId, alunoId, metaId);
    const selecionado = conceitoSelecionadoPorCelula[chave];
    if (selecionado) {
      return selecionado;
    }

    const existente = buscarAvaliacao(turmaId, alunoId, metaId);
    return existente?.conceito ?? '';
  }

  function atualizarConceitoSelecionado(turmaId: string, alunoId: string, metaId: string, conceito: string): void {
    const chave = chaveCelulaAvaliacao(turmaId, alunoId, metaId);
    setConceitoSelecionadoPorCelula((previous) => ({ ...previous, [chave]: conceito }));
  }

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

  function atualizarAlunoSelecionadoTurma(turmaId: string, alunoId: string): void {
    setAlunoSelecionadoPorTurma((previous) => ({ ...previous, [turmaId]: alunoId }));
  }

  function obterAlunosDisponiveis(turmaId: string): Aluno[] {
    const matriculados = new Set((alunosPorTurma[turmaId] ?? []).map((aluno) => aluno.id));
    return alunos.filter((aluno) => !matriculados.has(aluno.id));
  }

  async function matricularAlunoNaTurma(turmaId: string): Promise<void> {
    const alunoId = alunoSelecionadoPorTurma[turmaId];
    if (!alunoId) {
      setErroTurmas('Selecione um aluno para matricular.');
      return;
    }

    setErroTurmas('');

    try {
      const response = await fetch(`${TURMA_API_BASE}/${turmaId}/alunos/${alunoId}`, { method: 'POST' });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error || 'Falha ao matricular aluno na turma.');
      }

      await carregarTurmas();
      setAlunoSelecionadoPorTurma((previous) => ({ ...previous, [turmaId]: '' }));
    } catch (error) {
      setErroTurmas((error as Error).message);
    }
  }

  async function desmatricularAlunoDaTurma(turmaId: string, alunoId: string): Promise<void> {
    setErroTurmas('');

    try {
      const response = await fetch(`${TURMA_API_BASE}/${turmaId}/alunos/${alunoId}`, { method: 'DELETE' });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error || 'Falha ao remover matrícula.');
      }

      await carregarTurmas();
    } catch (error) {
      setErroTurmas((error as Error).message);
    }
  }

  async function salvarAvaliacao(turmaId: string, alunoId: string, metaId: string): Promise<void> {
    const conceito = conceitoSelecionado(turmaId, alunoId, metaId);
    if (!conceito) {
      setErroTurmas('Selecione um conceito para salvar a avaliação.');
      return;
    }

    setErroTurmas('');

    const existente = buscarAvaliacao(turmaId, alunoId, metaId);
    const isUpdate = Boolean(existente);
    const endpoint = isUpdate ? `${AVALIACAO_API_BASE}/${existente?.id ?? ''}` : AVALIACAO_API_BASE;

    const payload = isUpdate
      ? { conceito }
      : {
          turmaId,
          alunoId,
          metaId,
          conceito
        };

    try {
      const response = await fetch(endpoint, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error || 'Falha ao salvar avaliação.');
      }

      await carregarTurmas();
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
          <>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Descrição</th>
                  <th>Matriculados</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {turmas.map((turma) => (
                  <tr key={turma.id}>
                    <td>{turma.nome}</td>
                    <td>{turma.descricao || '-'}</td>
                    <td>{(alunosPorTurma[turma.id] ?? []).length}</td>
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
                    <td colSpan={4}>Nenhuma turma cadastrada.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="turmas-vinculos">
              {turmas.map((turma) => {
                const disponiveis = obterAlunosDisponiveis(turma.id);
                const alunosMatriculados = alunosPorTurma[turma.id] ?? [];

                return (
                  <article className="turma-vinculo-card" key={`vinculo-${turma.id}`}>
                    <h3>{turma.nome}</h3>

                    <div className="matricula-form">
                      <select
                        value={alunoSelecionadoPorTurma[turma.id] ?? ''}
                        onChange={(event) => atualizarAlunoSelecionadoTurma(turma.id, event.target.value)}
                      >
                        <option value="">Selecione um aluno</option>
                        {disponiveis.map((aluno) => (
                          <option key={aluno.id} value={aluno.id}>
                            {aluno.nome}
                          </option>
                        ))}
                      </select>
                      <button type="button" onClick={() => void matricularAlunoNaTurma(turma.id)}>
                        Matricular
                      </button>
                    </div>

                    <ul className="matriculados-lista">
                      {alunosMatriculados.map((aluno) => (
                        <li key={`${turma.id}-${aluno.id}`}>
                          <span>{aluno.nome}</span>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => void desmatricularAlunoDaTurma(turma.id, aluno.id)}
                          >
                            Remover matrícula
                          </button>
                        </li>
                      ))}

                      {alunosMatriculados.length === 0 && <li>Nenhum aluno matriculado nesta turma.</li>}
                    </ul>

                    <div className="avaliacoes-bloco">
                      <h4>Avaliações por Meta</h4>

                      {metas.length === 0 ? (
                        <p>Sem metas cadastradas.</p>
                      ) : alunosMatriculados.length === 0 ? (
                        <p>Matricule alunos para lançar avaliações.</p>
                      ) : (
                        <table className="avaliacoes-table">
                          <thead>
                            <tr>
                              <th>Aluno</th>
                              {metas.map((meta) => (
                                <th key={`${turma.id}-${meta.id}`}>{meta.nome}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {alunosMatriculados.map((aluno) => (
                              <tr key={`linha-${turma.id}-${aluno.id}`}>
                                <td>{aluno.nome}</td>
                                {metas.map((meta) => (
                                  <td key={`celula-${turma.id}-${aluno.id}-${meta.id}`}>
                                    <div className="avaliacao-celula">
                                      <select
                                        value={conceitoSelecionado(turma.id, aluno.id, meta.id)}
                                        onChange={(event) =>
                                          atualizarConceitoSelecionado(
                                            turma.id,
                                            aluno.id,
                                            meta.id,
                                            event.target.value
                                          )
                                        }
                                      >
                                        <option value="">-</option>
                                        <option value="MANA">MANA</option>
                                        <option value="MPA">MPA</option>
                                        <option value="MA">MA</option>
                                      </select>
                                      <button
                                        type="button"
                                        className="secondary"
                                        onClick={() => void salvarAvaliacao(turma.id, aluno.id, meta.id)}
                                      >
                                        Salvar
                                      </button>
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default App;
