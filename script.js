// Credenciais de admin (altere conforme necessário)
const ADMIN_USER = "admin";
const ADMIN_PASS = "senha123";

// Verifica status do serviço ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
  const btnEnviar = document.getElementById("btnEnviar");
  if (localStorage.getItem("servicoAtivo") === "false") {
    btnEnviar.disabled = true;
    btnEnviar.textContent = "❌ Serviço Suspenso";
    btnEnviar.style.backgroundColor = "#ccc";
  }
});

// Botão de login admin
document.getElementById("btnLogin").addEventListener("click", function () {
  document.getElementById("modalLogin").style.display = "block";
});

// Fecha modal de login
document.querySelector(".close").addEventListener("click", function () {
  document.getElementById("modalLogin").style.display = "none";
});

// Login
document
  .getElementById("btnSubmitLogin")
  .addEventListener("click", function () {
    const user = document.getElementById("loginUser").value;
    const pass = document.getElementById("loginPass").value;

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      window.location.href = "admin.html";
    } else {
      document.getElementById("loginError").style.display = "block";
      setTimeout(function () {
        document.getElementById("loginError").style.display = "none";
      }, 3000);
    }
  });

// Intercepta envio do formulário
document.getElementById("empresaForm").addEventListener("submit", function (e) {
  // Verifica se o serviço está desativado
  if (localStorage.getItem("servicoAtivo") === "false") {
    e.preventDefault();
    document.getElementById("modalSuspenso").style.display = "block";
    return;
  }

  // Se estiver ativo, envia para WhatsApp
  e.preventDefault();

  const nomePessoa = document.getElementById("nomePessoa").value;
  const matricula = document.getElementById("matricula").value;
  const nomeEmpresa = document.getElementById("nomeEmpresa").value;
  const turno = document.getElementById("turno").value;
  const contato = document.getElementById("contato").value.replace(/\D/g, "");
  const prato = document.getElementById("prato").value;

  // Validação do contato
  const regexContato = /^\d{2}9\d{8}$/;
  if (!regexContato.test(contato)) {
    document.getElementById("erroContato").style.display = "block";
    document.getElementById("contato").focus();
    return;
  } else {
    document.getElementById("erroContato").style.display = "none";
  }

  // Validação do restaurante
  const restauranteInput = document.querySelector(
    'input[name="restaurante"]:checked'
  );
  if (!restauranteInput) {
    document.getElementById("erroRestaurante").style.display = "block";
    document.querySelector('input[name="restaurante"]').focus();
    return;
  } else {
    document.getElementById("erroRestaurante").style.display = "none";
  }
  const restaurante = restauranteInput.value;

  // Número do WhatsApp
  const numeroWhatsApp = "5594991432471";

  // Mensagem formatada
  const mensagem =
    `📋 *NOVO PEDIDO DE REFEIÇÃO!*\n` +
    `\n` +
    `👤 *Nome:* ${nomePessoa}\n` +
    `🔢 *Matrícula:* ${matricula}\n` +
    `📱 *Contato:* ${formatarTelefone(contato)}\n` +
    `🏢 *Empresa:* ${nomeEmpresa}\n` +
    `🕒 *Turno:* ${turno}\n` +
    `🏪 *Restaurante:* ${restaurante}\n` +
    `🍲 *Prato Escolhido:* ${prato}\n` +
    `\n` +
    `✅ Pedido registrado com sucesso!\n` +
    `📲 Entraremos em contato se houver alteração.`;

  // Abre WhatsApp
  window.open(
    `https://wa.me/${numeroWhatsApp}?text=${encodeURI(mensagem)}`,
    "_blank"
  );
  alert("Seu pedido será aberto no WhatsApp. Por favor, confirme o envio.");
});

// Formata telefone
function formatarTelefone(numero) {
  if (numero.length !== 11) return numero;
  return `(${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7)}`;
}

// Formatação automática do campo de contato
document.getElementById("contato").addEventListener("input", function (e) {
  let valor = e.target.value.replace(/\D/g, "");
  const pos = e.target.selectionStart;
  const campo = e.target;

  if (valor.length > 11) {
    valor = valor.slice(0, 11);
  }

  let formatado = "";
  if (valor.length === 0) {
    formatado = "";
  } else if (valor.length === 1) {
    formatado = `(${valor}`;
  } else if (valor.length === 2) {
    formatado = `(${valor})`;
  } else if (valor.length <= 7) {
    formatado = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
  } else {
    formatado = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7)}`;
  }

  const diff = formatado.length - valor.length;
  campo.value = formatado;

  setTimeout(function () {
    let novaPos;
    if (pos <= 1) {
      novaPos = pos + 1;
    } else if (pos === 2) {
      novaPos = pos + 2;
    } else if (pos <= 7) {
      novaPos = pos + 3;
    } else {
      novaPos = pos + diff;
    }
    novaPos = Math.min(novaPos, formatado.length);
    campo.selectionStart = novaPos;
    campo.selectionEnd = novaPos;
  }, 0);
});

// Fecha modal de serviço suspenso
const btnFecharSuspenso = document.getElementById("btnFecharSuspenso");
if (btnFecharSuspenso) {
  btnFecharSuspenso.addEventListener("click", function () {
    document.getElementById("modalSuspenso").style.display = "none";
  });
}
