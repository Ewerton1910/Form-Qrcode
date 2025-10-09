document.getElementById("empresaForm").addEventListener("submit", function (e) {
  e.preventDefault();

  // Captura todos os valores
  const nomePessoa = document.getElementById("nomePessoa").value;
  const matricula = document.getElementById("matricula").value;
  const nomeEmpresa = document.getElementById("nomeEmpresa").value;
  const turno = document.getElementById("turno").value;
  const diaRetirada = document.getElementById("diaRetirada").value; // ← NOVO
  const contato = document.getElementById("contato").value.replace(/\D/g, "");
  const prato = document.getElementById("prato").value;

  // Validação do contato (Brasil: DDD + 9 dígitos)
  const regexContato = /^\d{2}9\d{8}$/;
  if (!regexContato.test(contato)) {
    document.getElementById("erroContato").style.display = "block";
    document.getElementById("contato").focus();
    return;
  } else {
    document.getElementById("erroContato").style.display = "none";
  }

  // Validação do restaurante (radio button)
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

  // 🔥 Substitua pelo seu número (sem +, sem espaços, formato internacional)
  const numeroWhatsApp = "5584987443832"; // 👈 ALTERE AQUI!

  // 🎨 Mensagem estilizada com emojis e formatação — inclui o novo campo
  const mensagem =
    `📋 *NOVO PEDIDO DE REFEIÇÃO!*\n` +
    `\n` +
    `👤 *Nome:* ${nomePessoa}\n` +
    `🔢 *Matrícula:* ${matricula}\n` +
    `📱 *Contato:* ${formatarTelefone(contato)}\n` +
    `🏢 *Empresa:* ${nomeEmpresa}\n` +
    `🕒 *Turno:* ${turno}\n` +
    `📅 *Dia da Retirada:* ${diaRetirada}\n` + // ← Nova linha
    `🏪 *Restaurante:* ${restaurante}\n` +
    `🍲 *Prato Escolhido:* ${prato}\n` +
    `\n` +
    `✅ Pedido registrado com sucesso!\n` +
    `📲 Entraremos em contato se houver alteração.`;

  // ✅ Corrigido: removido espaço extra na URL
  window.open(
    `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`,
    "_blank"
  );

  // Feedback para o usuário
  alert("Seu pedido será aberto no WhatsApp. Por favor, confirme o envio.");
});

// Função para formatar telefone: (11) 98765-4321
function formatarTelefone(numero) {
  if (numero.length !== 11) return numero;
  return `(${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7)}`;
}

// ✨ Formatação automática do campo de contato
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

  campo.value = formatado;

  setTimeout(() => {
    let novaPos;
    if (pos <= 1) {
      novaPos = pos + 1;
    } else if (pos === 2) {
      novaPos = pos + 2;
    } else if (pos <= 7) {
      novaPos = pos + 3;
    } else {
      novaPos = pos + (formatado.length - valor.length);
    }
    novaPos = Math.min(novaPos, formatado.length);
    campo.selectionStart = novaPos;
    campo.selectionEnd = novaPos;
  }, 0);
});
