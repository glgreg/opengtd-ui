// Endereço da API
const API = 'http://localhost:8080';

// Texto de cada status para mostrar na tela
const NOMES_STATUS = new Map([
  ['espera', 'Em espera'],
  ['andamento', 'Em andamento'],
  ['concluido', 'Concluída'],
  ['fracassado', 'Fracassada'],
]);

// Pilha de telas: a última que abriu é a primeira que fecha
const pilha = [];

// Tarefa que está aberta no detalhe
let tarefaAberta = null;

// null = criando uma tarefa nova; um número = editando a tarefa com esse id
let idEmEdicao = null;

// ==========================================
// Navegação
// ==========================================

const telasAba = document.querySelectorAll('.tela-aba');
const botoesNav = document.querySelectorAll('.nav-botao');

function trocarAba(idTela, botao) {
  telasAba.forEach((tela) => tela.classList.remove('visivel'));
  botoesNav.forEach((item) => item.classList.remove('ativo'));

  document.querySelector(idTela).classList.add('visivel');
  botao.classList.add('ativo');
}

const navInicio = document.querySelector('#nav-inicio');
const navTarefas = document.querySelector('#nav-tarefas');
const navPerfil = document.querySelector('#nav-perfil');

navInicio.addEventListener('click', () => trocarAba('#tela-inicio', navInicio));
navTarefas.addEventListener('click', () => trocarAba('#tela-tarefas', navTarefas));
navPerfil.addEventListener('click', () => trocarAba('#tela-perfil', navPerfil));

// Abre uma tela por cima de tudo
function abrirTela(idTela) {
  pilha.push(idTela);
  document.querySelector(idTela).classList.add('visivel');
}

// Fecha a tela do topo da pilha
function voltar() {
  const idTela = pilha.pop();
  document.querySelector(idTela).classList.remove('visivel');
}

document.querySelectorAll('.botao-voltar').forEach((botao) => {
  botao.addEventListener('click', voltar);
});

// ==========================================
// Perfil: GET /perfil e PUT /perfil
// ==========================================

const campoNome = document.querySelector('#campo-nome');

async function carregarPerfil() {
  const resposta = await fetch(`${API}/perfil`);
  const perfil = await resposta.json();

  // Início
  document.querySelector('#inicio-nome').textContent = `Olá, ${perfil.nome}!`;
  document.querySelector('#inicio-streak').textContent = perfil.streak;
  document.querySelector('#inicio-xp').textContent = perfil.xpAtual;
  document.querySelector('#inicio-nivel').textContent = `Nível ${perfil.nivel}`;
  document.querySelector('#inicio-meta').textContent = `Faltam ${perfil.xpProximoNivel} XP para o nível ${perfil.nivel + 1}`;

  // Perfil
  document.querySelector('#perfil-nome').textContent = perfil.nome;
  document.querySelector('#perfil-nivel').textContent = perfil.nivel;
  document.querySelector('#perfil-xp').textContent = perfil.xpAtual;
  document.querySelector('#perfil-streak').textContent = perfil.streak;
  campoNome.value = perfil.nome;
}

document.querySelector('#formulario-perfil').addEventListener('submit', async (event) => {
  event.preventDefault();

  await fetch(`${API}/perfil`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: campoNome.value }),
  });

  carregarPerfil();
});

// ==========================================
// Início: GET /dashboard e GET /tarefas
// ==========================================

async function carregarDashboard() {
  const resposta = await fetch(`${API}/dashboard`);
  const dashboard = await resposta.json();

  document.querySelector('#contador-espera').textContent = dashboard.tarefasEmEspera;
  document.querySelector('#contador-andamento').textContent = dashboard.tarefasEmAndamento;
  document.querySelector('#contador-concluidas').textContent = dashboard.tarefasConcluidas;
  document.querySelector('#contador-fracassadas').textContent = dashboard.tarefasFracassadas;
}

// Cria um item da lista que abre o detalhe da tarefa
function criarItem(tarefa, detalhe) {
  const botao = document.createElement('button');
  botao.classList.add('item');
  botao.textContent = tarefa.titulo;

  const info = document.createElement('span');
  info.textContent = detalhe;
  botao.appendChild(info);

  botao.addEventListener('click', () => abrirDetalhe(tarefa.id));

  const item = document.createElement('li');
  item.appendChild(botao);
  return item;
}

function mostrarVazio(lista, texto) {
  const item = document.createElement('li');
  item.classList.add('vazio');
  item.textContent = texto;
  lista.appendChild(item);
}

const listaAndamento = document.querySelector('#lista-andamento');

async function carregarAndamento() {
  const resposta = await fetch(`${API}/tarefas`);
  const tarefas = await resposta.json();

  const emAndamento = tarefas.filter((tarefa) => tarefa.status === 'andamento');

  listaAndamento.textContent = '';
  emAndamento.forEach((tarefa) => {
    listaAndamento.appendChild(criarItem(tarefa, tarefa.descricao));
  });

  if (emAndamento.length === 0) {
    mostrarVazio(listaAndamento, 'Nenhuma tarefa em andamento.');
  }
}

// ==========================================
// Tarefas: GET /tarefas/resumo
// ==========================================

const listaTarefas = document.querySelector('#lista-tarefas');

async function carregarTarefas() {
  const resposta = await fetch(`${API}/tarefas/resumo`);
  const tarefas = await resposta.json();

  listaTarefas.textContent = '';
  for (const tarefa of tarefas) {
    listaTarefas.appendChild(criarItem(tarefa, `Peso ${tarefa.peso}`));
  }

  if (tarefas.length === 0) {
    mostrarVazio(listaTarefas, 'Nenhuma tarefa ainda. Toque no + para criar.');
  }
}

// Depois de qualquer mudança, as abas buscam tudo de novo na API
function carregarTudo() {
  carregarPerfil();
  carregarDashboard();
  carregarAndamento();
  carregarTarefas();
}

// ==========================================
// Detalhe: GET, PUT e DELETE /tarefas/{id}
// ==========================================

async function carregarDetalhe(id) {
  const resposta = await fetch(`${API}/tarefas/${id}`);
  tarefaAberta = await resposta.json();

  // A API guarda a data em segundos; o Date do JavaScript usa milissegundos
  const data = new Date(tarefaAberta.timestamp * 1000);

  // A classe status-... pinta o chip com a cor do status
  const status = document.querySelector('#detalhe-status');
  status.textContent = NOMES_STATUS.get(tarefaAberta.status);
  status.className = `chip status-${tarefaAberta.status}`;

  document.querySelector('#detalhe-titulo').textContent = tarefaAberta.titulo;
  document.querySelector('#detalhe-descricao').textContent = tarefaAberta.descricao;
  document.querySelector('#detalhe-peso').textContent = tarefaAberta.peso;
  document.querySelector('#detalhe-data').textContent = data.toLocaleDateString('pt-BR');
  document.querySelector('#detalhe-tags').textContent = tarefaAberta.tags.join(', ');
}

async function abrirDetalhe(id) {
  await carregarDetalhe(id);
  abrirTela('#tela-detalhe');
}

// Concluir ou fracassar muda o XP e a sequência lá na API
async function mudarStatus(status) {
  await fetch(`${API}/tarefas/${tarefaAberta.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: status }),
  });

  await carregarDetalhe(tarefaAberta.id);
  carregarTudo();
}

document.querySelector('#botao-iniciar').addEventListener('click', () => mudarStatus('andamento'));
document.querySelector('#botao-concluir').addEventListener('click', () => mudarStatus('concluido'));
document.querySelector('#botao-fracassar').addEventListener('click', () => mudarStatus('fracassado'));

document.querySelector('#botao-excluir').addEventListener('click', async () => {
  await fetch(`${API}/tarefas/${tarefaAberta.id}`, { method: 'DELETE' });

  voltar();
  carregarTudo();
});

// ==========================================
// Formulário: POST /tarefas e PUT /tarefas/{id}
// ==========================================

const formularioTarefa = document.querySelector('#formulario-tarefa');
const formularioTitulo = document.querySelector('#formulario-titulo');
const campoTitulo = document.querySelector('#campo-titulo');
const campoDescricao = document.querySelector('#campo-descricao');
const campoPeso = document.querySelector('#campo-peso');
const campoTags = document.querySelector('#campo-tags');

// Botão + da aba Tarefas: formulário vazio
document.querySelector('#botao-nova').addEventListener('click', () => {
  idEmEdicao = null;
  formularioTarefa.reset();
  formularioTitulo.textContent = 'Nova tarefa';
  abrirTela('#tela-formulario');
});

// Botão Editar do detalhe: formulário preenchido
document.querySelector('#botao-editar').addEventListener('click', () => {
  idEmEdicao = tarefaAberta.id;
  campoTitulo.value = tarefaAberta.titulo;
  campoDescricao.value = tarefaAberta.descricao;
  campoPeso.value = tarefaAberta.peso;
  campoTags.value = tarefaAberta.tags.join(', ');
  formularioTitulo.textContent = 'Editar tarefa';
  abrirTela('#tela-formulario');
});

formularioTarefa.addEventListener('submit', async (event) => {
  event.preventDefault();

  // "faculdade, casa" vira ["faculdade", "casa"]
  let tags = [];
  if (campoTags.value !== '') {
    tags = campoTags.value.split(',').map((tag) => tag.trim());
  }

  const tarefa = {
    titulo: campoTitulo.value,
    descricao: campoDescricao.value,
    peso: campoPeso.value,
    tags: tags,
  };

  if (idEmEdicao === null) {
    await fetch(`${API}/tarefas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tarefa),
    });
  } else {
    await fetch(`${API}/tarefas/${idEmEdicao}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tarefa),
    });
    await carregarDetalhe(idEmEdicao);
  }

  voltar();
  carregarTudo();
});

// Primeira carga
carregarTudo();
