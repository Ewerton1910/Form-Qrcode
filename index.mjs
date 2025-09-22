document.getElementById("empresaForm").addEventListener("submit", function (e) {
  e.preventDefault();

  // Captura todos os valores
  const nomePessoa = document.getElementById("nomePessoa").value;
  const matricula = document.getElementById("matricula").value;
  const nomeEmpresa = document.getElementById("nomeEmpresa").value;
  const turno = document.getElementById("turno").value;
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

  // 🎨 Mensagem estilizada com emojis e formatação
  const mensagem =
    `📋 *NOVO PEDIDO DE REFEIÇÃO!*%0A` +
    `%0A` +
    `👤 *Nome:* ${nomePessoa}%0A` +
    `🔢 *Matrícula:* ${matricula}%0A` +
    `📱 *Contato:* ${formatarTelefone(contato)}%0A` +
    `🏢 *Empresa:* ${nomeEmpresa}%0A` +
    `🕒 *Turno:* ${turno}%0A` +
    `🏪 *Restaurante:* ${restaurante}%0A` +
    `🍲 *Prato Escolhido:* ${prato}%0A` +
    `%0A` +
    `✅ Pedido registrado com sucesso!%0A` +
    `📲 Entraremos em contato se houver alteração.`;

  // Abre o WhatsApp com a mensagem formatada
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

  if (valor.length > 11) valor = valor.slice(0, 11);

  let formatado = valor;
  if (valor.length > 2) {
    formatado = `(${valor.slice(0, 2)})`;
    if (valor.length > 3) {
      formatado += ` ${valor.slice(2, 7)}`;
      if (valor.length > 8) {
        formatado += `-${valor.slice(7)}`;
      } else {
        formatado += valor.slice(2);
      }
    }
  }

  campo.value = formatado;

  setTimeout(() => {
    campo.selectionStart = campo.selectionEnd =
      pos + (formatado.length - valor.length);
  }, 0);
});
