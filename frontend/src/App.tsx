import { FormEvent, useEffect, useState } from 'react';

type Aluno = {
  id: string;
  nome: string;
  cpf: string;
  email?: string;
  dataCriacao: string;
  dataAtualizacao: string;
};

type Turma = {
  id: string;
  nome: string;
  descricao?: string;
  ano: number;
  semestre: number;
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
  cpf: string;
  email: string;
};

type TurmaFormState = {
  nome: string;
  descricao: string;
  ano: string;
  semestre: string;
};

type Pagina = 'alunos' | 'turmas' | 'avaliacoes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const ALUNO_API_BASE = `${API_BASE_URL}/alunos`;
const TURMA_API_BASE = `${API_BASE_URL}/turmas`;
const META_API_BASE = `${API_BASE_URL}/metas`;
const AVALIACAO_API_BASE = `${API_BASE_URL}/avaliacoes`;
const ANO_ATUAL = new Date().getFullYear();

function criarFormularioTurmaInicial(): TurmaFormState {
  return { nome: '', descricao: '', ano: String(ANO_ATUAL), semestre: '1' };
}

function normalizarNomeInput(valor: string): string {
  return valor.replace(/[^A-Za-zÀ-ÿ\s'-]/g, '').replace(/\s{2,}/g, ' ');
}

function normalizarCpfInput(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  const partes = [
    digitos.slice(0, 3),
    digitos.slice(3, 6),
    digitos.slice(6, 9),
    digitos.slice(9, 11)
  ].filter(Boolean);

  if (partes.length === 0) {
    return '';
  }

  if (partes.length === 1) {
    return partes[0];
  }

  if (partes.length === 2) {
    return `${partes[0]}.${partes[1]}`;
  }

  if (partes.length === 3) {
    return `${partes[0]}.${partes[1]}.${partes[2]}`;
  }

  return `${partes[0]}.${partes[1]}.${partes[2]}-${partes[3]}`;
}

function formatarCpf(valor: string): string {
  if (!valor) {
    return '-';
  }

  return normalizarCpfInput(valor);
}

function normalizarEmailInput(valor: string): string {
  return valor.replace(/\s+/g, '').toLowerCase();
}

function normalizarAnoInput(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, 4);
}

function ordenarPorNome<T extends { nome: string }>(itens: T[]): T[] {
  return [...itens].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
}

function normalizarAlunoCarregado(aluno: Partial<Aluno> & Pick<Aluno, 'id' | 'nome'>): Aluno {
  return {
    id: aluno.id,
    nome: aluno.nome ?? '',
    cpf: aluno.cpf ?? '',
    email: aluno.email,
    dataCriacao: aluno.dataCriacao ?? '',
    dataAtualizacao: aluno.dataAtualizacao ?? ''
  };
}

function normalizarTurmaCarregada(turma: Partial<Turma> & Pick<Turma, 'id' | 'nome'>): Turma {
  return {
    id: turma.id,
    nome: turma.nome ?? '',
    descricao: turma.descricao,
    ano: typeof turma.ano === 'number' ? turma.ano : ANO_ATUAL,
    semestre: turma.semestre === 2 ? 2 : 1,
    alunoIds: Array.isArray(turma.alunoIds) ? turma.alunoIds : [],
    dataCriacao: turma.dataCriacao ?? '',
    dataAtualizacao: turma.dataAtualizacao ?? ''
  };
}

function App() {
  const [paginaAtual, setPaginaAtual] = useState<Pagina>('alunos');
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunoForm, setAlunoForm] = useState<AlunoFormState>({ nome: '', cpf: '', email: '' });
  const [turmaForm, setTurmaForm] = useState<TurmaFormState>(criarFormularioTurmaInicial());
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
  const [pesquisaAlunos, setPesquisaAlunos] = useState<string>('');
  const [pesquisaTurmas, setPesquisaTurmas] = useState<string>('');
  const [pesquisaAvaliacoes, setPesquisaAvaliacoes] = useState<string>('');

  async function carregarAlunos(): Promise<void> {
    setCarregandoAlunos(true);
    setErroAlunos('');

    try {
      const response = await fetch(ALUNO_API_BASE);
      if (!response.ok) {
        throw new Error('Falha ao listar alunos.');
      }

      const data = (await response.json()) as Array<Partial<Aluno> & Pick<Aluno, 'id' | 'nome'>>;
      setAlunos(data.map(normalizarAlunoCarregado));
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

      const data = (await response.json()) as Array<Partial<Turma> & Pick<Turma, 'id' | 'nome'>>;
      const turmasNormalizadas = data.map(normalizarTurmaCarregada);
      setTurmas(turmasNormalizadas);

      const detalhes = await Promise.all(
        turmasNormalizadas.map(async (turma) => {
          const detalheResponse = await fetch(`${TURMA_API_BASE}/${turma.id}/avaliacoes`);
          if (!detalheResponse.ok) {
            throw new Error('Falha ao carregar avaliações da turma.');
          }

          const detalhe = (await detalheResponse.json()) as TurmaComAvaliacoesResponse;
          return {
            turmaId: turma.id,
            alunos: (detalhe.alunos ?? []).map(normalizarAlunoCarregado),
            avaliacoes: detalhe.avaliacoes
          };
        })
      );

      setAlunosPorTurma(
        detalhes.reduce<Record<string, Aluno[]>>((accumulator, item) => {
          accumulator[item.turmaId] = item.alunos;
          return accumulator;
        }, {})
      );

      setAvaliacoesPorTurma(
        detalhes.reduce<Record<string, Avaliacao[]>>((accumulator, item) => {
          accumulator[item.turmaId] = item.avaliacoes;
          return accumulator;
        }, {})
      );
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

    return buscarAvaliacao(turmaId, alunoId, metaId)?.conceito ?? '';
  }

  function atualizarConceitoSelecionado(turmaId: string, alunoId: string, metaId: string, conceito: string): void {
    const chave = chaveCelulaAvaliacao(turmaId, alunoId, metaId);
    setConceitoSelecionadoPorCelula((previous) => ({ ...previous, [chave]: conceito }));
  }

  function limparFormularioAluno(): void {
    setAlunoForm({ nome: '', cpf: '', email: '' });
    setEditingAlunoId(null);
  }

  function limparFormularioTurma(): void {
    setTurmaForm(criarFormularioTurmaInicial());
    setEditingTurmaId(null);
  }

  async function salvarAluno(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErroAlunos('');

    const payload = {
      nome: alunoForm.nome,
      cpf: alunoForm.cpf,
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
      descricao: turmaForm.descricao || undefined,
      ano: Number(turmaForm.ano),
      semestre: Number(turmaForm.semestre)
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
    setAlunoForm({ nome: aluno.nome, cpf: aluno.cpf, email: aluno.email || '' });
    setPaginaAtual('alunos');
  }

  function iniciarEdicaoTurma(turma: Turma): void {
    setEditingTurmaId(turma.id);
    setTurmaForm({
      nome: turma.nome,
      descricao: turma.descricao || '',
      ano: String(turma.ano),
      semestre: String(turma.semestre)
    });
    setPaginaAtual('turmas');
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
    return ordenarPorNome(alunos.filter((aluno) => !matriculados.has(aluno.id)));
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
    const endpoint = existente ? `${AVALIACAO_API_BASE}/${existente.id}` : AVALIACAO_API_BASE;
    const payload = existente ? { conceito } : { turmaId, alunoId, metaId, conceito };

    try {
      const response = await fetch(endpoint, {
        method: existente ? 'PUT' : 'POST',
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

  const termoPesquisaAlunos = pesquisaAlunos.trim().toLowerCase();
  const termoPesquisaTurmas = pesquisaTurmas.trim().toLowerCase();
  const termoPesquisaAvaliacoes = pesquisaAvaliacoes.trim().toLowerCase();

  const alunosOrdenados = ordenarPorNome(alunos);
  const alunosFiltrados = alunosOrdenados.filter((aluno) => {
    if (!termoPesquisaAlunos) {
      return true;
    }

    return [aluno.nome, aluno.cpf, aluno.email ?? ''].some((valor) => valor.toLowerCase().includes(termoPesquisaAlunos));
  });

  const turmasOrdenadas = ordenarPorNome(turmas);
  const turmasFiltradas = turmasOrdenadas.filter((turma) => {
    if (!termoPesquisaTurmas) {
      return true;
    }

    return [turma.nome, turma.descricao ?? '', String(turma.ano), String(turma.semestre)].some((valor) =>
      valor.toLowerCase().includes(termoPesquisaTurmas)
    );
  });

  const turmasFiltradasAvaliacoes = turmasOrdenadas.filter((turma) => {
    if (!termoPesquisaAvaliacoes) {
      return true;
    }

    const alunosDaTurma = ordenarPorNome(alunosPorTurma[turma.id] ?? []);
    const combinados = [
      turma.nome,
      turma.descricao ?? '',
      ...alunosDaTurma.flatMap((aluno) => [aluno.nome, aluno.cpf, aluno.email ?? ''])
    ];

    return combinados.some((valor) => valor.toLowerCase().includes(termoPesquisaAvaliacoes));
  });

  function renderTurmaCards(modo: 'matriculas' | 'avaliacoes', turmasVisiveis: Turma[]): JSX.Element {
    return (
      <div
        className={
          modo === 'avaliacoes'
            ? 'turmas-vinculos turmas-vinculos-avaliacoes'
            : 'turmas-vinculos turmas-vinculos-matriculas'
        }
      >
        {turmasVisiveis.map((turma) => {
          const disponiveis = obterAlunosDisponiveis(turma.id);
          const alunosMatriculados = ordenarPorNome(alunosPorTurma[turma.id] ?? []);

          return (
            <article className="turma-vinculo-card" key={`${modo}-${turma.id}`}>
              <div className="turma-card-header">
                <div>
                  <h3>{turma.nome}</h3>
                  <p>
                    Ano {turma.ano} - Semestre {turma.semestre}
                  </p>
                </div>
                {modo === 'matriculas' && (
                  <div className="card-actions">
                    <button type="button" className="secondary" onClick={() => iniciarEdicaoTurma(turma)}>
                      Editar turma
                    </button>
                    <button type="button" className="danger" onClick={() => void removerTurma(turma.id)}>
                      Remover turma
                    </button>
                  </div>
                )}
              </div>

              {turma.descricao && <p className="turma-descricao">{turma.descricao}</p>}

              {modo === 'matriculas' && (
                <>
                  <div className="matricula-form">
                    <select
                      value={alunoSelecionadoPorTurma[turma.id] ?? ''}
                      onChange={(event) => atualizarAlunoSelecionadoTurma(turma.id, event.target.value)}
                    >
                      <option value="">Selecione um aluno</option>
                          {disponiveis.map((aluno) => (
                        <option key={aluno.id} value={aluno.id}>
                          {aluno.nome} - {formatarCpf(aluno.cpf)}
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
                        <div>
                          <strong>{aluno.nome}</strong>
                          <span>{formatarCpf(aluno.cpf)}</span>
                        </div>
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
                </>
              )}

              {modo === 'avaliacoes' && (
                <div className="avaliacoes-bloco">
                  <h4>Avaliações por Meta</h4>

                  {metas.length === 0 ? (
                    <p>Sem metas cadastradas.</p>
                  ) : alunosMatriculados.length === 0 ? (
                    <p>Matricule alunos para lançar avaliações.</p>
                  ) : (
                    <div className="avaliacoes-table-wrapper">
                      <table className="avaliacoes-table">
                        <thead>
                          <tr>
                            <th>Aluno</th>
                            <th>CPF</th>
                            {metas.map((meta) => (
                              <th key={`${turma.id}-${meta.id}`}>{meta.nome}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {alunosMatriculados.map((aluno) => (
                            <tr key={`linha-${turma.id}-${aluno.id}`}>
                              <td>{aluno.nome}</td>
                              <td>{formatarCpf(aluno.cpf)}</td>
                              {metas.map((meta) => (
                                <td key={`celula-${turma.id}-${aluno.id}-${meta.id}`}>
                                  <div className="avaliacao-celula">
                                    <select
                                      value={conceitoSelecionado(turma.id, aluno.id, meta.id)}
                                      onChange={(event) =>
                                        atualizarConceitoSelecionado(turma.id, aluno.id, meta.id, event.target.value)
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
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}

        {turmasVisiveis.length === 0 && (
          <article className="turma-vinculo-card turma-vinculo-card-empty">
            <p>Nenhuma turma encontrada para o filtro informado.</p>
          </article>
        )}
      </div>
    );
  }

  return (
    <main className="container">
      <header className="hero">
        <div>
          <p className="eyebrow">Student Management System</p>
          <h1>Gestão de alunos, turmas e avaliações</h1>
          <p className="hero-copy">
            O fluxo foi separado em páginas para cadastro de alunos, organização das turmas e lançamento de avaliações.
          </p>
        </div>
      </header>

      <nav className="page-nav" aria-label="Navegação principal">
        <button
          type="button"
          className={paginaAtual === 'alunos' ? 'nav-button active' : 'nav-button'}
          onClick={() => setPaginaAtual('alunos')}
        >
          Alunos
        </button>
        <button
          type="button"
          className={paginaAtual === 'turmas' ? 'nav-button active' : 'nav-button'}
          onClick={() => setPaginaAtual('turmas')}
        >
          Turmas
        </button>
        <button
          type="button"
          className={paginaAtual === 'avaliacoes' ? 'nav-button active' : 'nav-button'}
          onClick={() => setPaginaAtual('avaliacoes')}
        >
          Avaliações
        </button>
      </nav>

      {paginaAtual === 'alunos' && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Alunos</h2>
              <p>Cadastre alunos com nome, CPF e email.</p>
            </div>
          </div>

          <div className="search-bar">
            <input
              value={pesquisaAlunos}
              onChange={(event) => setPesquisaAlunos(event.target.value)}
              placeholder="Pesquisar por nome, CPF ou email"
              type="search"
            />
          </div>

          <form className="form" onSubmit={(event) => void salvarAluno(event)}>
            <label>
              Nome
              <input
                value={alunoForm.nome}
                onChange={(event) =>
                  setAlunoForm((previous) => ({ ...previous, nome: normalizarNomeInput(event.target.value) }))
                }
                placeholder="Nome do aluno"
                required
              />
            </label>

            <label>
              CPF
              <input
                value={alunoForm.cpf}
                onChange={(event) =>
                  setAlunoForm((previous) => ({ ...previous, cpf: normalizarCpfInput(event.target.value) }))
                }
                placeholder="000.000.000-00"
                required
              />
            </label>

            <label>
              Email
              <input
                value={alunoForm.email}
                onChange={(event) =>
                  setAlunoForm((previous) => ({ ...previous, email: normalizarEmailInput(event.target.value) }))
                }
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
                  <th>CPF</th>
                  <th>Email</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {alunosFiltrados.map((aluno) => (
                  <tr key={aluno.id}>
                    <td>{aluno.nome}</td>
                    <td>{formatarCpf(aluno.cpf)}</td>
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
                {alunosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={4}>Nenhum aluno cadastrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      )}

      {paginaAtual === 'turmas' && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Turmas</h2>
              <p>Gerencie o tópico da turma, o ano, o semestre e as matrículas.</p>
            </div>
          </div>

          <div className="search-bar">
            <input
              value={pesquisaTurmas}
              onChange={(event) => setPesquisaTurmas(event.target.value)}
              placeholder="Pesquisar por tópico, descrição, ano ou semestre"
              type="search"
            />
          </div>

          <form className="form" onSubmit={(event) => void salvarTurma(event)}>
            <label>
              Tópico da turma
              <input
                value={turmaForm.nome}
                onChange={(event) => setTurmaForm((previous) => ({ ...previous, nome: event.target.value }))}
                placeholder="Introdução a Programação"
                required
              />
            </label>

            <label>
              Descrição
              <input
                value={turmaForm.descricao}
                onChange={(event) => setTurmaForm((previous) => ({ ...previous, descricao: event.target.value }))}
                placeholder="Resumo do conteúdo"
              />
            </label>

            <label>
              Ano
              <input
                value={turmaForm.ano}
                onChange={(event) =>
                  setTurmaForm((previous) => ({ ...previous, ano: normalizarAnoInput(event.target.value) }))
                }
                placeholder={String(ANO_ATUAL)}
                inputMode="numeric"
                required
              />
            </label>

            <label>
              Semestre
              <select
                value={turmaForm.semestre}
                onChange={(event) => setTurmaForm((previous) => ({ ...previous, semestre: event.target.value }))}
              >
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
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
            renderTurmaCards('matriculas', turmasFiltradas)
          )}
        </section>
      )}

      {paginaAtual === 'avaliacoes' && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Avaliações</h2>
              <p>Cada turma é exibida separadamente com seus alunos e avaliações por meta.</p>
            </div>
          </div>

          <div className="search-bar">
            <input
              value={pesquisaAvaliacoes}
              onChange={(event) => setPesquisaAvaliacoes(event.target.value)}
              placeholder="Pesquisar por turma, aluno ou CPF"
              type="search"
            />
          </div>

          {erroTurmas && <p className="erro">{erroTurmas}</p>}

          {carregandoTurmas ? <p>Carregando avaliações...</p> : renderTurmaCards('avaliacoes', turmasFiltradasAvaliacoes)}
        </section>
      )}
    </main>
  );
}

export default App;
