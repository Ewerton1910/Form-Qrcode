// api/enviar-pedido.js
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
      diaRetirada,
    } = await request.json();

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // ⚠️ Pode usar onboarding@resend.dev para teste
      to: "ewertonjhonatas@hotmail.com", // 👈 SEU E-MAIL REAL AQUI!
      subject: `🍽️ Novo pedido de refeição - ${nomePessoa}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #eee; border-radius: 10px; padding: 20px; background: #f9f9f9;">
          <h2 style="color: #25D366;">📋 Novo Pedido de Refeição!</h2>
          <p><strong>👤 Nome:</strong> ${nomePessoa}</p>
          <p><strong>🔢 Matrícula:</strong> ${matricula}</p>
          <p><strong>🏢 Empresa:</strong> ${nomeEmpresa}</p>
          <p><strong>🕒 Turno:</strong> ${turno}</p>
          <p><strong>📆 Dia da Retirada:</strong> ${diaRetirada}</p>
          <p><strong>📱 Contato:</strong> ${contato}</p>
          <p><strong>🏪 Restaurante:</strong> ${restaurante}</p>
          <p><strong>🍲 Prato:</strong> ${prato}</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 0.9em;">Pedido enviado via formulário web</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "E-mail enviado!" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
