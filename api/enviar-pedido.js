// api/enviar-pedido.js — Versão correta para enviar e-mails
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

    // Envia o e-mail usando fetch direto (sem biblioteca)
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev', // Domínio de teste
        to: 'seuemail@empresa.com',   // Substitua pelo seu e-mail real
        subject: `🍽️ Novo pedido - ${nomePessoa}`,
        text: `
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
        `
      })
    });

    if (!res.ok) {
      throw new Error(`Erro ao enviar e-mail: ${await res.text()}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'E-mail enviado!' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
