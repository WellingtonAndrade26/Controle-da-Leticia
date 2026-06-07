const API_BASE_URL = "https://controle-gastos-api-ruby.vercel.app";

const loginBox = document.getElementById("loginBox");
const appConteudo = document.getElementById("appConteudo");

const loginForm = document.getElementById("loginForm");
const cadastroForm = document.getElementById("cadastroForm");

const btnSair = document.getElementById("btnSair");

const boasVindasBanner = document.getElementById("boasVindasBanner");

const loginEmailInput = document.getElementById("loginEmail");
const loginSenhaInput = document.getElementById("loginSenha");

const cadastroNomeInput = document.getElementById("cadastroNome");
const cadastroEmailInput = document.getElementById("cadastroEmail");
const cadastroSenhaInput = document.getElementById("cadastroSenha");
const cadastroConfirmarSenhaInput = document.getElementById("cadastroConfirmarSenha");

const btnLogin = document.getElementById("btnLogin");
const btnCadastrar = document.getElementById("btnCadastrar");
const btnMostrarCadastro = document.getElementById("btnMostrarCadastro");
const btnMostrarLogin = document.getElementById("btnMostrarLogin");
const loginMensagem = document.getElementById("loginMensagem");

const formGasto = document.getElementById("formGasto");
const descricaoInput = document.getElementById("descricao");
const valorInput = document.getElementById("valor");
const categoriaInput = document.getElementById("categoria");
const dataInput = document.getElementById("data");
const orcamentoTotal = document.getElementById("orcamentoTotal");
const orcamentoInput = document.getElementById("orcamentoInput");
const mesSelecionadoInput = document.getElementById("mesSelecionado");
const btnAdicionarOrcamento = document.getElementById("btnAdicionarOrcamento");
const btnRetirarOrcamento = document.getElementById("btnRetirarOrcamento");
const btnDefinirOrcamento = document.getElementById("btnDefinirOrcamento");
const listaGastos = document.getElementById("listaGastos");
const totalGasto = document.getElementById("totalGasto");
const saldoRestante = document.getElementById("saldoRestante");
const textoSaldo = document.getElementById("textoSaldo");
const saldoBox = document.querySelector(".saldo-box");
const dashboardCategorias = document.getElementById("dashboardCategorias");
const valorGuardadoTotal = document.getElementById("valorGuardadoTotal");

let APP_TOKEN = localStorage.getItem("app_token") || "";
let gastos = [];
let orcamentos = {};
let mesSelecionado = new Date().toISOString().slice(0, 7);
let orcamento = 0;

mesSelecionadoInput.value = mesSelecionado;
dataInput.value = new Date().toISOString().split("T")[0];

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${APP_TOKEN}`
  };
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function atualizarBannerUsuario(nome) {
  const nomeFinal = nome || localStorage.getItem("app_user_name") || "Usuário";

  if (boasVindasBanner) {
    boasVindasBanner.textContent = `Bem-vindo(a), ${nomeFinal}`;
  }
}

function formatarData(data) {
  const partes = data.split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function mostrarMensagemLogin(texto) {
  if (loginMensagem) {
    loginMensagem.textContent = texto;
  }
}

function abrirApp() {
  loginBox.classList.add("oculto");
  appConteudo.classList.remove("oculto");
  atualizarBannerUsuario();
}

function fecharApp() {
  loginBox.classList.remove("oculto");
  appConteudo.classList.add("oculto");
}

async function cadastrarUsuario() {
  const name = cadastroNomeInput.value.trim();
  const email = cadastroEmailInput.value.trim();
  const password = cadastroSenhaInput.value;
  const confirmPassword = cadastroConfirmarSenhaInput.value;

  mostrarMensagemLogin("");

  if (!name || !email || !password || !confirmPassword) {
    mostrarMensagemLogin("Preencha todos os campos.");
    return;
  }

  if (password !== confirmPassword) {
    mostrarMensagemLogin("As senhas não conferem.");
    return;
  }

  try {
    const resposta = await fetch(`${API_BASE_URL}/api/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        password,
        confirmPassword
      })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      mostrarMensagemLogin(dados.error || "Não foi possível criar a conta.");
      return;
    }

    APP_TOKEN = dados.token;
    localStorage.setItem("app_token", APP_TOKEN);

    localStorage.setItem("app_user_name", dados.user.name);
    atualizarBannerUsuario(dados.user.name);

    abrirApp();
    await iniciarApp();
  } catch (erro) {
    console.error("Erro ao cadastrar:", erro);
    mostrarMensagemLogin("Erro ao conectar com o cadastro.");
  }
}

async function fazerLogin() {
  const email = loginEmailInput.value.trim();
  const password = loginSenhaInput.value;

  mostrarMensagemLogin("");

  if (!email || !password) {
    mostrarMensagemLogin("Informe email e senha.");
    return;
  }

  try {
    const resposta = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      mostrarMensagemLogin(dados.error || "Email ou senha inválidos.");
      return;
    }

    APP_TOKEN = dados.token;
    localStorage.setItem("app_token", APP_TOKEN);

    localStorage.setItem("app_user_name", dados.user.name);
    atualizarBannerUsuario(dados.user.name);

    abrirApp();
    await iniciarApp();
  } catch (erro) {
    console.error("Erro no login:", erro);
    mostrarMensagemLogin("Erro ao conectar com o login.");
  }
}

async function buscarGastosOnline() {
  const resposta = await fetch(`${API_BASE_URL}/api/expenses?month=${mesSelecionado}`, {
    headers: authHeaders()
  });

  if (resposta.status === 401) {
    localStorage.removeItem("app_token");
    APP_TOKEN = "";
    fecharApp();
    mostrarMensagemLogin("Faça login novamente.");
    return;
  }

  if (!resposta.ok) {
    throw new Error("Erro ao buscar gastos.");
  }

  const dados = await resposta.json();

  gastos = dados.map((item) => {
    return {
      id: item.id,
      descricao: item.name,
      valor: Number(item.value),
      categoria: item.category,
      data: item.date
    };
  });
}

async function buscarTodosGastosOnline() {
  const resposta = await fetch(`${API_BASE_URL}/api/expenses`, {
    headers: authHeaders()
  });

  if (!resposta.ok) {
    throw new Error("Erro ao buscar todos os gastos.");
  }

  const dados = await resposta.json();

  return dados.map((item) => {
    return {
      id: item.id,
      descricao: item.name,
      valor: Number(item.value),
      categoria: item.category,
      data: item.date
    };
  });
}

async function salvarGastoOnline(gasto) {
  const resposta = await fetch(`${API_BASE_URL}/api/expenses`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      name: gasto.descricao,
      value: Number(gasto.valor),
      category: gasto.categoria,
      date: gasto.data
    })
  });

  const texto = await resposta.text();

  if (!resposta.ok) {
    throw new Error(texto || "Erro ao salvar gasto.");
  }

  return JSON.parse(texto);
}

async function excluirGastoOnline(id) {
  const resposta = await fetch(`${API_BASE_URL}/api/expenses?id=${id}`, {
    method: "DELETE",
    headers: authHeaders()
  });

  if (!resposta.ok) {
    throw new Error("Erro ao excluir gasto.");
  }

  return await resposta.json();
}

async function buscarOrcamentosOnline() {
  const resposta = await fetch(`${API_BASE_URL}/api/budgets`, {
    headers: authHeaders()
  });

  if (!resposta.ok) {
    throw new Error("Erro ao buscar orçamentos.");
  }

  const dados = await resposta.json();

  orcamentos = {};

  dados.forEach((item) => {
    orcamentos[item.month] = Number(item.value);
  });

  orcamento = Number(orcamentos[mesSelecionado]) || 0;
}

async function salvarOrcamentoOnline(mes, valor) {
  const resposta = await fetch(`${API_BASE_URL}/api/budgets`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      month: mes,
      value: Number(valor)
    })
  });

  const texto = await resposta.text();

  if (!resposta.ok) {
    throw new Error(texto || "Erro ao salvar orçamento.");
  }

  return JSON.parse(texto);
}

function pegarGastosDoMes() {
  return gastos.filter((gasto) => {
    return gasto.data.startsWith(mesSelecionado);
  });
}

function atualizarTudo() {
  mostrarGastos();
  atualizarTotal();
  atualizarOrcamento();
  atualizarSaldo();
  atualizarDashboardCategorias();
}

async function adicionarGasto(event) {
  event.preventDefault();

  const descricao = descricaoInput.value.trim();
  const valor = Number(valorInput.value);
  const categoria = categoriaInput.value;
  const data = dataInput.value;

  if (!descricao || valor <= 0 || !categoria || !data) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  try {
    await salvarGastoOnline({
      descricao,
      valor,
      categoria,
      data
    });

    await buscarGastosOnline();
    atualizarTudo();
    await atualizarValorGuardado();

    formGasto.reset();
    dataInput.value = new Date().toISOString().split("T")[0];
  } catch (erro) {
    console.error("Erro ao adicionar gasto:", erro);
    alert("Não foi possível salvar o gasto online.");
  }
}

function mostrarGastos() {
  listaGastos.innerHTML = "";

  const gastosDoMes = pegarGastosDoMes();

  if (gastosDoMes.length === 0) {
    listaGastos.innerHTML = "<li class='mensagem-vazia'>Nenhum gasto cadastrado neste mês.</li>";
    return;
  }

  gastosDoMes.forEach((gasto) => {
    const item = document.createElement("li");
    item.classList.add("gasto-item");

    item.innerHTML = `
      <div class="gasto-info">
        <strong>${gasto.descricao}</strong>
        <span>${gasto.categoria} • ${formatarData(gasto.data)}</span>
      </div>

      <div>
        <p class="gasto-valor">${formatarMoeda(gasto.valor)}</p>
        <button class="btn-excluir" onclick="excluirGasto('${gasto.id}')">
          Excluir
        </button>
      </div>
    `;

    listaGastos.appendChild(item);
  });
}

function atualizarTotal() {
  const gastosDoMes = pegarGastosDoMes();

  const total = gastosDoMes.reduce((soma, gasto) => {
    return soma + Number(gasto.valor);
  }, 0);

  totalGasto.textContent = formatarMoeda(total);
}

function atualizarOrcamento() {
  orcamentoTotal.textContent = formatarMoeda(orcamento);
}

function atualizarSaldo() {
  const gastosDoMes = pegarGastosDoMes();

  const total = gastosDoMes.reduce((soma, gasto) => {
    return soma + Number(gasto.valor);
  }, 0);

  const saldo = orcamento - total;

  if (saldo >= 0) {
    textoSaldo.textContent = "Disponível";
    saldoRestante.textContent = formatarMoeda(saldo);
    saldoBox.classList.remove("negativo");
  } else {
    textoSaldo.textContent = "Passou do orçamento";
    saldoRestante.textContent = formatarMoeda(Math.abs(saldo));
    saldoBox.classList.add("negativo");
  }
}

async function atualizarValorGuardado() {
  if (!valorGuardadoTotal) return;

  try {
    const todosGastos = await buscarTodosGastosOnline();

    let totalGuardado = 0;

    Object.keys(orcamentos).forEach((mes) => {
      const orcamentoDoMes = Number(orcamentos[mes]) || 0;

      const gastosDoMes = todosGastos.filter((gasto) => {
        return gasto.data.startsWith(mes);
      });

      const totalGastoDoMes = gastosDoMes.reduce((soma, gasto) => {
        return soma + Number(gasto.valor);
      }, 0);

      const sobraDoMes = orcamentoDoMes - totalGastoDoMes;

      if (sobraDoMes > 0) {
        totalGuardado += sobraDoMes;
      }
    });

    valorGuardadoTotal.textContent = formatarMoeda(totalGuardado);
  } catch (erro) {
    console.error("Erro ao calcular valor guardado:", erro);
    valorGuardadoTotal.textContent = formatarMoeda(0);
  }
}

function atualizarDashboardCategorias() {
  dashboardCategorias.innerHTML = "";

  const gastosDoMes = pegarGastosDoMes();

  const total = gastosDoMes.reduce((soma, gasto) => {
    return soma + Number(gasto.valor);
  }, 0);

  if (gastosDoMes.length === 0) {
    dashboardCategorias.innerHTML = "<p class='mensagem-vazia'>Nenhum gasto cadastrado neste mês.</p>";
    return;
  }

  const categorias = {};

  gastosDoMes.forEach((gasto) => {
    if (categorias[gasto.categoria]) {
      categorias[gasto.categoria] += Number(gasto.valor);
    } else {
      categorias[gasto.categoria] = Number(gasto.valor);
    }
  });

  Object.keys(categorias).forEach((categoria) => {
    const valor = categorias[categoria];
    const porcentagem = total > 0 ? (valor / total) * 100 : 0;

    const item = document.createElement("div");
    item.classList.add("categoria-item");

    item.innerHTML = `
      <div class="categoria-topo">
        <strong>${categoria}</strong>
        <span>${formatarMoeda(valor)}</span>
      </div>

      <div class="barra-categoria">
        <div 
          class="barra-categoria-preenchida" 
          style="width: ${porcentagem}%"
        ></div>
      </div>
    `;

    dashboardCategorias.appendChild(item);
  });
}

async function excluirGasto(id) {
  const confirmar = confirm("Deseja excluir este gasto?");

  if (!confirmar) {
    return;
  }

  try {
    await excluirGastoOnline(id);
    await buscarGastosOnline();
    atualizarTudo();
    await atualizarValorGuardado();
  } catch (erro) {
    console.error("Erro ao excluir gasto:", erro);
    alert("Não foi possível excluir o gasto.");
  }
}

formGasto.addEventListener("submit", adicionarGasto);

btnAdicionarOrcamento.addEventListener("click", async function () {
  const valor = Number(orcamentoInput.value);

  if (valor <= 0) {
    alert("Digite um valor para adicionar.");
    return;
  }

  try {
    orcamento = orcamento + valor;

    await salvarOrcamentoOnline(mesSelecionado, orcamento);
    await buscarOrcamentosOnline();

    atualizarOrcamento();
    atualizarSaldo();
    await atualizarValorGuardado();

    orcamentoInput.value = "";
  } catch (erro) {
    console.error("Erro ao adicionar orçamento:", erro);
    alert("Não foi possível salvar o orçamento online.");
  }
});

btnRetirarOrcamento.addEventListener("click", async function () {
  const valor = Number(orcamentoInput.value);

  if (valor <= 0) {
    alert("Digite um valor para retirar.");
    return;
  }

  try {
    orcamento = orcamento - valor;

    if (orcamento < 0) {
      orcamento = 0;
    }

    await salvarOrcamentoOnline(mesSelecionado, orcamento);
    await buscarOrcamentosOnline();

    atualizarOrcamento();
    atualizarSaldo();
    await atualizarValorGuardado();

    orcamentoInput.value = "";
  } catch (erro) {
    console.error("Erro ao retirar orçamento:", erro);
    alert("Não foi possível salvar o orçamento online.");
  }
});

btnDefinirOrcamento.addEventListener("click", async function () {
  const valor = Number(orcamentoInput.value);

  if (valor < 0) {
    alert("Digite um valor válido.");
    return;
  }

  try {
    orcamento = valor;

    await salvarOrcamentoOnline(mesSelecionado, orcamento);
    await buscarOrcamentosOnline();

    atualizarOrcamento();
    atualizarSaldo();
    await atualizarValorGuardado();

    orcamentoInput.value = "";
  } catch (erro) {
    console.error("Erro ao definir orçamento:", erro);
    alert("Não foi possível salvar o orçamento online.");
  }
});

mesSelecionadoInput.addEventListener("change", async function () {
  mesSelecionado = mesSelecionadoInput.value;

  await buscarOrcamentosOnline();
  await buscarGastosOnline();

  atualizarTudo();
  await atualizarValorGuardado();
});

if (btnMostrarCadastro) {
  btnMostrarCadastro.addEventListener("click", function () {
    loginForm.classList.add("oculto");
    cadastroForm.classList.remove("oculto");
    mostrarMensagemLogin("");
  });
}

if (btnMostrarLogin) {
  btnMostrarLogin.addEventListener("click", function () {
    cadastroForm.classList.add("oculto");
    loginForm.classList.remove("oculto");
    mostrarMensagemLogin("");
  });
}

if (btnLogin) {
  btnLogin.addEventListener("click", fazerLogin);
}

if (btnCadastrar) {
  btnCadastrar.addEventListener("click", cadastrarUsuario);
}

loginSenhaInput?.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    fazerLogin();
  }
});

cadastroConfirmarSenhaInput?.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    cadastrarUsuario();
  }
});

let eventoInstalacao = null;

const btnInstallApp = document.getElementById("btnInstallApp");

function estaNoModoApp() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function esconderBotaoInstalar() {
  if (btnInstallApp) {
    btnInstallApp.classList.add("oculto");
  }
}

function mostrarBotaoInstalar() {
  if (btnInstallApp && !estaNoModoApp()) {
    btnInstallApp.classList.remove("oculto");
  }
}

window.addEventListener("load", function () {
  if (estaNoModoApp()) {
    esconderBotaoInstalar();
  } else {
    mostrarBotaoInstalar();
  }
});

window.addEventListener("beforeinstallprompt", function (event) {
  event.preventDefault();

  eventoInstalacao = event;

  mostrarBotaoInstalar();
});

if (btnInstallApp) {
  btnInstallApp.addEventListener("click", async function () {
    if (estaNoModoApp()) {
      esconderBotaoInstalar();
      return;
    }

    if (!eventoInstalacao) {
      alert("Para instalar, toque nos três pontinhos do navegador e escolha 'Adicionar à tela inicial' ou 'Instalar app'.");
      return;
    }

    eventoInstalacao.prompt();

    const escolha = await eventoInstalacao.userChoice;

    if (escolha.outcome === "accepted") {
      esconderBotaoInstalar();
    }

    eventoInstalacao = null;
  });
}

window.addEventListener("appinstalled", function () {
  esconderBotaoInstalar();
});

async function iniciarApp() {
  await buscarOrcamentosOnline();
  await buscarGastosOnline();
  atualizarTudo();
  await atualizarValorGuardado();
}

async function verificarLoginSalvo() {
  if (!APP_TOKEN) {
    fecharApp();
    return;
  }

  try {
    abrirApp();
    await iniciarApp();
  } catch (erro) {
    console.error("Erro ao iniciar com login salvo:", erro);
    localStorage.removeItem("app_token");
    APP_TOKEN = "";
    fecharApp();
  }
}

if (btnSair) {
  btnSair.addEventListener("click", function () {
    const confirmar = confirm("Deseja sair da sua conta?");

    if (!confirmar) {
      return;
    }

    localStorage.removeItem("app_token");
    localStorage.removeItem("app_user_name");

    APP_TOKEN = "";
    gastos = [];
    orcamentos = {};
    orcamento = 0;

    fecharApp();

    if (loginEmailInput) {
      loginEmailInput.value = "";
    }

    if (loginSenhaInput) {
      loginSenhaInput.value = "";
    }

    mostrarMensagemLogin("Você saiu da conta.");
  });
}

verificarLoginSalvo();