// script.js
document.getElementById('empresaForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const nomePessoa = document.getElementById('nomePessoa').value;
    const nomeEmpresa = document.getElementById('nomeEmpresa').value;
    const turno = document.getElementById('turno').value;

    const numeroWhatsApp = "5594992962392"; // 🔥 Seu número aqui

    // ✨ Mensagem estilizada com emojis e formatação
    const mensagem = 
        `📋 *NOVO REGISTRO RECEBIDO!*%0A` +
        `%0A` +
        `👤 *Nome da Pessoa:* ${nomePessoa}%0A` +
        `🏢 *Nome da Empresa:* ${nomeEmpresa}%0A` +
        `🕒 *Turno:* ${turno}%0A` +
        `%0A` +
        `✅ Informações enviadas com sucesso!%0A` +
        `📲 Em breve entraremos em contato.`;

    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagem}`;

    window.open(urlWhatsApp, '_blank');
});
