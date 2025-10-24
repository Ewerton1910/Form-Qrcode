// 🔐 Credenciais de admin (senha ofuscada)
const ADMIN_USER = "admin";
const ADMIN_PASS = atob("bDRuY2hvbjN0My0yMDI1IQ=="); // Substitua pela sua senha ofuscada

// Horários por restaurante (só para Almoço)
const HORARIOS_ALMOCO = {
  Central: ["12:00", "12:15", "12:30", "12:45", "13:00"],
  Campo: ["13:00", "13:15", "13:30", "13:45", "14:00"]
};

let servicoAtivo = true;

// Inicializa Firebase
firebase.initializeApp({
  apiKey: "AIzaSyAE4cDYIovbsK61qug_wgDUdlbrR5lpvGM",
  authDomain: "lanchonete-pedidos.firebaseapp.com",
  databaseURL: "https://lanchonete-pedidos-default-rtdb.firebaseio.com",
  projectId: "lanchonete-pedidos",
  storageBucket: "lanchonete-pedidos.firebasestorage.app",
  messagingSenderId: "558143780233",
  appId: "1:558143780233:web:2ddbbd6b5ef2dad6435d58"
});

// Sincroniza status do serviço
firebase.database().ref('servico/ativo').on('value', (snapshot) => {
  servicoAtivo = snapshot.val() !== false;
  const btn = document.getElementById('btnEnviar');
  if (btn) {
    btn.classList.toggle('btn-suspenso', !servicoAtivo);
    btn.textContent = servicoAtivo 
      ? '📤 Enviar Pedido para WhatsApp' 
      : '❌ Serviço Suspenso';
  }
});

// Calcula próxima data de Terça (2) ou Quinta (4)
function calcularProximaData(diaSemana) {
  const hoje = new Date();
  const diaAtual = hoje.getDay();
  let diasParaAdicionar = 0;

  if (diaSemana === 2) { // Terça
    if (diaAtual < 2) diasParaAdicionar = 2 - diaAtual;
    else if (diaAtual === 2) diasParaAdicionar = 7;
    else diasParaAdicionar = 9 - diaAtual;
  } else if (diaSemana === 4) { // Quinta
    if (diaAtual < 4) diasParaAdicionar = 4 - diaAtual;
    else if (diaAtual === 4) diasParaAdicionar = 7;
    else diasParaAdicionar = 11 - diaAtual;
  }

  const data = new Date();
  data.setDate(data.getDate() + diasParaAdicionar);
  return data;
}

// Formata data como "Terça-Feira, 21/10/2025"
function formatarDataExibicao(data) {
  const diasSemana = ["Domingo", "Segunda-Feira", "Terça-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sábado"];
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  const nomeDia = diasSemana[data.getDay()];
  return `${nomeDia}, ${dia}/${mes}/${ano}`;
}

// Atualiza campos com base no turno
function atualizarCamposPorTurno() {
  const turno = document.getElementById('turno').value;
  const containerHorario = document.getElementById('horarioContainer');

  if (turno === "Almoço") {
    const restauranteSelecionado = document.querySelector('input[name="restaurante"]:checked')?.value;
    containerHorario.style.display = restauranteSelecionado ? 'block' : 'none';
  } else {
    containerHorario.style.display = 'none';
  }
}

// Eventos
document.getElementById('turno').addEventListener('change', atualizarCamposPorTurno);
document.querySelectorAll('input[name="restaurante"]').forEach(radio => {
  radio.addEventListener('change', atualizarCamposPorTurno);
});

// Login
document.getElementById('btnLogin')?.addEventListener('click', () => {
  document.getElementById('modalLogin').style.display = 'block';
});
document.querySelector('.close')?.addEventListener('click', () => {
  document.getElementById('modalLogin').style.display = 'none';
});
document.getElementById('btnSubmitLogin')?.addEventListener('click', () => {
  const user = document.getElementById('loginUser')?.value;
  const pass = document.getElementById('loginPass')?.value;
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    window.location.href = 'admin.html';
  } else {
    document.getElementById('loginError').style.display = 'block';
    setTimeout(() => document.getElementById('loginError').style.display = 'none', 3000);
  }
});

// Fecha modal de suspenso
document.getElementById('btnFecharSuspenso')?.addEventListener('click', () => {
  document.getElementById('modalSuspenso').style.display = 'none';
});

// Clique no botão Enviar
document.getElementById('btnEnviar').addEventListener('click', function(e) {
  e.preventDefault();

  if (!servicoAtivo) {
    document.getElementById('modalSuspenso').style.display = 'flex';
    return;
  }

  // Captura valores
  const nomePessoa = document.getElementById("nomePessoa").value;
  const matricula = document.getElementById("matricula").value;
  const nomeEmpresa = document.getElementById("nomeEmpresa").value;
  const turno = document.getElementById("turno").value;
  const contato = document.getElementById("contato").value.replace(/\D/g, "");
  const prato = document.getElementById("prato").value;
  const restauranteInput = document.querySelector('input[name="restaurante"]:checked');
  const restaurante = restauranteInput ? restauranteInput.value : "";

  // Validação do contato
  if (!/^\d{2}9\d{8}$/.test(contato)) {
    document.getElementById("erroContato").style.display = "block";
    return;
  } else {
    document.getElementById("erroContato").style.display = "none";
  }

  // Validação do restaurante
  if (!restauranteInput) {
    document.getElementById("erroRestaurante").style.display = "block";
    return;
  } else {
    document.getElementById("erroRestaurante").style.display = "none";
  }

  // Validação do Dia da Retirada (obrigatório para todos)
  const diaSelecionado = document.getElementById("diaRetirada").value;
  if (!diaSelecionado) {
    document.getElementById("erroDia").style.display = "block";
    return;
  }
  document.getElementById("erroDia").style.display = "none";

  // Calcula data exata
  const dataRetirada = calcularProximaData(parseInt(diaSelecionado));
  const linhaData = `📅 *Dia da Retirada:* ${formatarDataExibicao(dataRetirada)}\n`;

  // Validação e montagem do horário (só Almoço)
  let linhaHorario = "";
  const horarioContainer = document.getElementById('horarioContainer');
  if (horarioContainer.style.display !== 'none') {
    const horarioRetirada = document.getElementById("horarioRetirada").value;
    if (!horarioRetirada) {
      document.getElementById("erroHorario").style.display = "block";
      return;
    }
    document.getElementById("erroHorario").style.display = "none";
    linhaHorario = `🕒 *Horário da Retirada:* ${horarioRetirada}\n`;
  }

  // Monta mensagem final
  const mensagem =
    `📋 *NOVO PEDIDO DE REFEIÇÃO!*\n` +
    `\n` +
    `👤 *Nome:* ${nomePessoa}\n` +
    `🔢 *Matrícula:* ${matricula}\n` +
    linhaData +
    linhaHorario +
    `📱 *Contato:* ${formatarTelefone(contato)}\n` +
    `🏢 *Empresa:* ${nomeEmpresa}\n` +
    `🕓 *Turno:* ${turno}\n` +
    `🏪 *Restaurante:* ${restaurante}\n` +
    `🍲 *Prato Escolhido:* ${prato}\n` +
    `\n` +
    `✅ Pedido registrado com sucesso!\n` +
    `📲 Entraremos em contato se houver alteração.`;

  // Envia para WhatsApp
  window.open(`https://wa.me/5584987443832?text=${encodeURI(mensagem)}`, '_blank');
});

// Formatação de telefone
function formatarTelefone(numero) {
  if (numero.length !== 11) return numero;
  return `(${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7)}`;
}
document.getElementById("contato")?.addEventListener("input", function (e) {
  let valor = e.target.value.replace(/\D/g, "");
  if (valor.length > 11) valor = valor.slice(0, 11);
  let formatado = "";
  if (valor.length === 0) formatado = "";
  else if (valor.length === 1) formatado = `(${valor}`;
  else if (valor.length === 2) formatado = `(${valor})`;
  else if (valor.length <= 7) formatado = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
  else formatado = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7)}`;
  e.target.value = formatado;
});
