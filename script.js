const ADMIN_USER = "admin";
const ADMIN_PASS = atob("bDRuY2gwbjN0My0yMDI1IQ==");
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

// Sincroniza status
firebase.database().ref('servico/ativo').on('value', (snapshot) => {
  servicoAtivo = snapshot.val() !== false;
  const btn = document.getElementById('btnEnviar');
  if (btn) {
    // ✅ NÃO desabilita o botão — só muda o estilo
    btn.classList.toggle('btn-suspenso', !servicoAtivo);
    btn.textContent = servicoAtivo 
      ? '📤 Enviar Pedido para WhatsApp' 
      : '❌ Serviço Suspenso';
  }
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
    window.location.href = 'admin.html';
  } else {
    document.getElementById('loginError').style.display = 'block';
    setTimeout(() => document.getElementById('loginError').style.display = 'none', 3000);
  }
});

// Fecha modal suspenso
document.getElementById('btnFecharSuspenso')?.addEventListener('click', () => {
  document.getElementById('modalSuspenso').style.display = 'none';
});

// ✅ CLIQUE NO BOTÃO — SEMPRE FUNCIONA, MESMO "DESABILITADO"
document.getElementById('btnEnviar').addEventListener('click', function(e) {
  e.preventDefault();

  if (!servicoAtivo) {
    // Mostra modal
    document.getElementById('modalSuspenso').style.display = 'flex';
    return;
  }

  // Se estiver ativo, envia
  const nomePessoa = document.getElementById("nomePessoa").value;
  const matricula = document.getElementById("matricula").value;
  const nomeEmpresa = document.getElementById("nomeEmpresa").value;
  const turno = document.getElementById("turno").value;
  const diaRetirada = document.getElementById("diaRetirada").value;
  const contato = document.getElementById("contato").value.replace(/\D/g, "");
  const prato = document.getElementById("prato").value;

  if (!/^\d{2}9\d{8}$/.test(contato)) {
    alert("Número de WhatsApp inválido!");
    return;
  }

  const restauranteInput = document.querySelector('input[name="restaurante"]:checked');
  if (!restauranteInput) {
    alert("Selecione um restaurante!");
    return;
  }
  const restaurante = restauranteInput.value;

  const numeroWhatsApp = "5594991432471";
  const mensagem =
    `📋 *NOVO PEDIDO DE REFEIÇÃO!*\n` +
    `\n` +
    `👤 *Nome:* ${nomePessoa}\n` +
    `🔢 *Matrícula:* ${matricula}\n` +
    `📱 *Contato:* ${formatarTelefone(contato)}\n` +
    `🏢 *Empresa:* ${nomeEmpresa}\n` +
    `🕒 *Turno:* ${turno}\n` +
    `📅 *Dia da Retirada:* ${diaRetirada}\n` +
    `🏪 *Restaurante:* ${restaurante}\n` +
    `🍲 *Prato Escolhido:* ${prato}\n` +
    `\n` +
    `✅ Pedido registrado com sucesso!\n` +
    `📲 Entraremos em contato se houver alteração.`;

  window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURI(mensagem)}`, '_blank');
});

// Formatação telefone
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

// Validação do dia da retirada
const diaInput = document.querySelector('select[name="diaRetirada"]');
if (!diaInput.value) {
  document.getElementById("erroDia").style.display = "block";
  diaInput.focus();
  return;
} else {
  document.getElementById("erroDia").style.display = "none";
}
