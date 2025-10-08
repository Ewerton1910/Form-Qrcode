// api/enviar-pedido.js — Versão simplificada (sem dependências)
export async function POST(request) {
  try {
    const {
      nomePessoa,
      matricula,
      nomeEmpresa,
      turno,
      contato,
      prato,
      restaurante,
      diaRetirada
    } = await request.json();

    // Construa o corpo do e-mail
    const emailBody = `
      📋 Novo Pedido de Refeição!
      
      👤 Nome: ${nomePessoa}
      🔢 Matrícula: ${matricula}
      🏢 Empresa: ${nomeEmpresa}
      🕒 Turno: ${turno}
      📆 Dia da Retirada: ${diaRetirada}
      📱 Contato: ${contato}
      🏪 Restaurante: ${restaurante}
      🍲 Prato: ${prato}
      
      Pedido enviado via formulário web.
    `;

    // Envia o e-mail via fetch para o Resend (sem biblioteca)
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Pedidos <pedidos@sualanchonete.com>',
        to: 'seuemail@empresa.com',
        subject: `🍽️ Novo pedido - ${nomePessoa}`,
        text: emailBody
      })
    });

    if (!res.ok) {
      throw new Error(`Resend error: ${await res.text()}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
