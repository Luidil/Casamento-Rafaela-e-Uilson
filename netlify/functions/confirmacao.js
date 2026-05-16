const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const supabase = createClient(
    'https://zuipsuyioiwiicghhubz.supabase.co',
    'sb_publishable_R0wIUnlorZNtE3RrTYCPGw_1eVN1Yel'
);

async function enviarEmail(nome, email) {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return;
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
        });
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Confirmação de Presença - Casamento Uilson & Rafaela',
            html: `<div style="font-family:Arial;max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden">
                <div style="background:linear-gradient(135deg,#8B5E4A,#C9A27E);color:white;padding:40px 20px;text-align:center">
                    <h1 style="margin:0;font-size:2em">Uilson & Rafaela</h1>
                    <p style="margin:10px 0 0">01 de Setembro de 2026</p>
                </div>
                <div style="padding:40px 20px;text-align:center">
                    <h2 style="color:#8B5E4A">Obrigado, ${nome}!</h2>
                    <p>Que alegria saber que você estará conosco neste momento tão especial!</p>
                    <p>Sua presença é muito importante para nós. <strong style="color:#8B5E4A">Esperamos você lá!</strong></p>
                    <p style="font-style:italic;color:#8B5E4A">Com amor,<br>Uilson & Rafaela</p>
                </div>
            </div>`
        });
        console.log('Email enviado para', email);
    } catch (err) {
        console.error('Erro email:', err.message);
    }
}

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ success: false }) };

    try {
        const { nome, email, presenca, mensagem } = JSON.parse(event.body);

        if (!nome || presenca === undefined) {
            return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Nome e presença são obrigatórios' }) };
        }

        const emailValue = email || `guest-${Date.now()}@casamento.local`;
        const presencaValue = presenca === 'sim' || presenca === true;

        // Verificar se já existe
        const { data: existing } = await supabase
            .from('convidados')
            .select('id')
            .eq('email', emailValue)
            .maybeSingle();

        if (existing) {
            const { error } = await supabase
                .from('convidados')
                .update({ nome, presenca: presencaValue, mensagem: mensagem || null, data_confirmacao: new Date().toISOString() })
                .eq('email', emailValue);
            if (error) throw new Error(error.message);
            console.log('Atualizado:', nome);
        } else {
            const { error } = await supabase
                .from('convidados')
                .insert({ nome, email: emailValue, presenca: presencaValue, mensagem: mensagem || null });
            if (error) throw new Error(error.message);
            console.log('Inserido:', nome);
        }

        if (presencaValue && email) await enviarEmail(nome, email);

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Confirmação enviada com sucesso!' }) };
    } catch (error) {
        console.error('Erro:', error.message);
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: error.message }) };
    }
};
