const ADMIN_USER = "admin";
const ADMIN_PASS = atob("bDRuY2gwbjN0My0yMDI1IQ==");
let servicoAtivo = true;

// Inicializa Firebase (sem espaços extras!)
firebase.initializeApp({
  apiKey: "AIzaSyAE4cDYIovbsK61qug_wgDUdlbrR5lpvGM",
  authDomain: "lanchonete-pedidos.firebaseapp.com",
  databaseURL: "https://lanchonete-pedidos-default-rtdb.firebaseio.com", // ✅ SEM ESPAÇO
  projectId: "lanchonete-pedidos",
  storageBucket: "lanchonete-pedidos.firebasestorage.app",
  messagingSenderId: "558143780233",
  appId: "1:558143780233:web:2ddbbd6b5ef2dad6435d58"
});

// Sincroniza status
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

// Horários por restaurante
const HORARIOS_ALMOCO = {
  central: ["12:00", "12:15", "12:30", "12:45", "13:00"],
  campo: ["13:00", "13:15", "13:30", "13:45", "14:00"]
};

// ✅ Incrementa contador por restaurante e turno
function incrementarContadorPorTurno(restaurante, turno) {
  const db = firebase.database();
  const key = turno.toLowerCase(); // "Almoço" → "almoço"
  db.ref(`contadores/${restaurante}/${key}`).transaction(current => (current || 0) + 1);
}

// ✅ FUNÇÃO DEFINITIVA: Atualiza campos com base no turno e restaurante (SEM REPETIÇÃO)
function atualizarCamposPorTurnoERestaurante() {
  const turno = document.getElementById('turno')?.value;
  const restauranteSelecionado = document.querySelector('input[name="restaurante"]:checked')?.value;
  const containerHorario = document.getElementById('horarioContainer');
  const select = document.getElementById('horarioRetirada');

  // ✅ Limpa listeners anteriores
  if (window.firebaseUnsubscribers) {
    window.firebaseUnsubscribers.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
  }
  window.firebaseUnsubscribers = [];

  if (turno === "Almoço" && restauranteSelecionado) {
    const restauranteKey = restauranteSelecionado.toLowerCase();
    const horarios = HORARIOS_ALMOCO[restauranteKey] || [];

    const carregarHorarios = () => {
      // ✅ Limpa select antes de recarregar
      select.innerHTML = '<option value="" disabled selected>Carregando...</option>';
      let carregados = 0;
      let opcoesAtivas = [];

      horarios.forEach(horario => {
        firebase.database().ref(`horarios/${restauranteKey}/${horario}`).once('value', (snapshot) => {
          const data = snapshot.val() || { ativo: true, contador: 0 };
          carregados++;

          if (data.ativo) {
            opcoesAtivas.push({ value: horario, text: horario });
          }

          // Quando todos os horários forem carregados
          if (carregados === horarios.length) {
            select.innerHTML = '<option value="" disabled selected>Escolha o horário</option>';
            opcoesAtivas.forEach(opt => {
              const option = document.createElement('option');
              option.value = opt.value;
              option.textContent = opt.text;
              select.appendChild(option);
            });

            if (opcoesAtivas.length === 0) {
              select.innerHTML = '<option value="" disabled selected>Nenhum horário disponível</option>';
            }

            containerHorario.style.display = 'block';
          }
        });
      });
    };

    // ✅ Carrega imediatamente
    carregarHorarios();

    // ✅ Escuta mudanças em tempo real em CADA horário
    horarios.forEach(horario => {
      const unsubscribe = firebase.database().ref(`horarios/${restauranteKey}/${horario}`).on('value', carregarHorarios);
      window.firebaseUnsubscribers.push(unsubscribe);
    });
  } else {
    containerHorario.style.display = 'none';
  }
}

// Eventos
document.getElementById('turno')?.addEventListener('change', atualizarCamposPorTurnoERestaurante);
document.querySelectorAll('input[name="restaurante"]').forEach(radio => {
  radio.addEventListener('change', atualizarCamposPorTurnoERestaurante);
});

// Login
document.getElementById('btnLogin')?.addEventListener('click', () => {
  document.getElementById('modalLogin').style.display = 'flex';
});
document.querySelector('.close')?.addEventListener('click', () => {
  document.getElementById('modalLogin').style.display = 'none';
});
document.getElementById('btnSubmitLogin')?.addEventListener('click', () => {
  const user = document.getElementById('loginUser')?.value;
  const pass = document.getElementById('loginPass')?.value;
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    window.location.href = 'painel-controle-interno-a1b2c3.html';
  } else {
    document.getElementById('loginError').style.display = 'block';
    setTimeout(() => document.getElementById('loginError').style.display = 'none', 3000);
  }
});

// Fecha modal suspenso
document.getElementById('btnFecharSuspenso')?.addEventListener('click', () => {
  document.getElementById('modalSuspenso').style.display = 'none';
});

// ✅ Verifica chave secreta no admin (segurança básica)
function verificarAcessoAdmin() {
  const urlParams = new URLSearchParams(window.location.search);
  const chave = urlParams.get('chave');
  if (chave !== 'AcessoLiberado123') {
    alert("Acesso negado!");
    window.location.href = 'index.html';
    throw new Error("Acesso negado!");
  }
}

// ✅ CLIQUE NO BOTÃO — COM CONTADORES POR RESTAURANTE E TURNO
document.getElementById('btnEnviar').addEventListener('click', function(e) {
  e.preventDefault();

  if (!servicoAtivo) {
    document.getElementById('modalSuspenso').style.display = 'flex';
    return;
  }

  // Validação do Dia da Retirada
  const diaSelecionado = document.getElementById("diaRetirada").value;
  if (!diaSelecionado) {
    alert("Selecione o dia da retirada!");
    return;
  }

  // Calcula data exata
  const dataRetirada = calcularProximaData(parseInt(diaSelecionado));
  const linhaDataExibida = formatarDataExibicao(dataRetirada);

  // Captura demais valores
  const nomePessoa = document.getElementById("nomePessoa").value;
  const matricula = document.getElementById("matricula").value;
  const nomeEmpresa = document.getElementById("nomeEmpresa").value;
  const turno = document.getElementById("turno").value;
  const contato = document.getElementById("contato").value.replace(/\D/g, "");
  const prato = document.getElementById("prato").value;
  const restauranteInput = document.querySelector('input[name="restaurante"]:checked');
  if (!restauranteInput) {
    alert("Selecione um restaurante!");
    return;
  }
  const restaurante = restauranteInput.value;

  // Validação do contato
  if (!/^\d{2}9\d{8}$/.test(contato)) {
    alert("Número de WhatsApp inválido!");
    return;
  }

  // Horário (só se for Almoço)
  let linhaHorario = "";
  let horarioRetirada = "";
  const horarioContainer = document.getElementById('horarioContainer');
  if (horarioContainer.style.display !== 'none') {
    horarioRetirada = document.getElementById("horarioRetirada").value;
    if (!horarioRetirada) {
      alert("Selecione o horário da retirada!");
      return;
    }
    linhaHorario = `🕒 *Horário da Retirada:* ${horarioRetirada}\n`;
  }

  // ✅ Incrementa contadores por restaurante e turno
  incrementarContadorPorTurno(restaurante.toLowerCase(), turno);

  // Contador por horário (só no Almoço)
  if (turno === "Almoço" && horarioRetirada) {
    const db = firebase.database();
    const ref = db.ref(`horarios/${restaurante.toLowerCase()}/${horarioRetirada}/contador`);
    ref.transaction(current => (current || 0) + 1);
  }

  // Monta mensagem
  const numeroWhatsApp = "5584987443832";
  const mensagem =
    `📋 *NOVO PEDIDO DE REFEIÇÃO!*\n` +
    `\n` +
    `👤 *Nome:* ${nomePessoa}\n` +
    `🔢 *Matrícula:* ${matricula}\n` +
    `📱 *Contato:* ${formatarTelefone(contato)}\n` +
    `🏢 *Empresa:* ${nomeEmpresa}\n` +
    `🕓 *Turno:* ${turno}\n` +
    `📅 *Dia da Retirada:* ${linhaDataExibida}\n` +
    linhaHorario +
    `🏪 *Restaurante:* ${restaurante}\n` +
    `🍲 *Prato Escolhido:* ${prato}\n` +
    `\n` +
    `✅ Pedido registrado com sucesso!\n` +
    `📲 Entraremos em contato se houver alteração.`;

  // ✅ Corrigido: removido espaço extra
  window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURI(mensagem)}`, '_blank');
  alert("Seu pedido será aberto no WhatsApp. Por favor, confirme o envio.");
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
