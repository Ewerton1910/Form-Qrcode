document.getElementById("empresaForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const nomePessoa = document.getElementById("nomePessoa").value;
  const nomeEmpresa = document.getElementById("nomeEmpresa").value;
  const turno = document.getElementById("turno").value;

  // Substitua pelo número do WhatsApp (internacional, sem +, sem espaços ou traços)
  const numeroWhatsApp = "5584987443832"; // Ex: 55 = Brasil, 11 = DDD, 999999999 = número

  // Formata a mensagem — %0A é quebra de linha
  const mensagem =
    `Nome da Pessoa: ${nomePessoa}%0A` +
    `Nome da Empresa: ${nomeEmpresa}%0A` +
    `Turno: ${turno}`;

  const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagem}`;

  // Abre o WhatsApp com a mensagem pré-preenchida
  window.open(urlWhatsApp, "_blank");
});
