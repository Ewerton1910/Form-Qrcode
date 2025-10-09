document.getElementById("empresaForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const nomePessoa = document.getElementById("nomePessoa").value;
  const matricula = document.getElementById("matricula").value;
  const nomeEmpresa = document.getElementById("nomeEmpresa").value;
  const turno = document.getElementById("turno").value;
  const diaRetirada = document.getElementById("diaRetirada").value;
  const contato = document.getElementById("contato").value.replace(/\D/g, "");
  const prato = document.getElementById("prato").value;

  // Validação do contato
  const regexContato = /^\d{2}9\d{8}$/;
  if (!regexContato.test(contato)) {
    document.getElementById("erroContato").style.display = "block";
    document.getElementById("contato").focus();
    return;
  } else {
    document.getElementById("erroContato").style.display = "none"; // ← Corrigido!
  }

  // Validação do restaurante
  const restauranteInput = document.querySelector('input[name="restaurante"]:checked');
  if (!restauranteInput) {
    document.getElementById("erroRestaurante").style.display = "block";
    return;
  } else {
    document.getElementById("erroRestaurante").style.display = "none";
  }
  const restaurante = restauranteInput.value;

  const numeroWhatsApp = "5594991432471"; // ← Confira este número!

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

  // URL correta, sem espaços
  const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank");

  alert("Seu pedido será aberto no WhatsApp. Por favor, confirme o envio.");
});

function formatarTelefone(numero) {
  if (numero.length !== 11) return numero;
  return `(${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7)}`;
}

document.getElementById("contato").addEventListener("input", function (e) {
  let valor = e.target.value.replace(/\D/g, "");
  const pos = e.target.selectionStart;
  const campo = e.target;

  if (valor.length > 11) valor = valor.slice(0, 11);

  let formatado = "";
  if (valor.length === 0) formatado = "";
  else if (valor.length === 1) formatado = `(${valor}`;
  else if (valor.length === 2) formatado = `(${valor})`;
  else if (valor.length <= 7) formatado = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
  else formatado = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7)}`;

  campo.value = formatado;

  setTimeout(() => {
    let novaPos;
    if (pos <= 1) novaPos = pos + 1;
    else if (pos === 2) novaPos = pos + 2;
    else if (pos <= 7) novaPos = pos + 3;
    else novaPos = pos + (formatado.length - valor.length);
    novaPos = Math.min(novaPos, formatado.length);
    campo.selectionStart = novaPos;
    campo.selectionEnd = novaPos;
  }, 0);
});
