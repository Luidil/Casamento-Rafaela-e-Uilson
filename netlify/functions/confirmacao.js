const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://casamento:casamento123@localhost:5433/casamento_db',
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : false
});

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

    let client;
    try {
        const { nome, email, presenca, mensagem } = JSON.parse(event.body);

        if (!nome || presenca === undefined) {
            return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Nome e presença são obrigatórios' }) };
        }

        const emailValue = email || `guest-${Date.now()}@casamento.local`;
        const presencaValue = presenca === 'sim' || presenca === true;

        client = await pool.connect();

        // Verificar se já existe
        const existing = await client.query(
            'SELECT id FROM convidados WHERE email = $1',
            [emailValue]
        );

        if (existing.rows.length > 0) {
            await client.query(
                'UPDATE convidados SET nome = $1, presenca = $2, mensagem = $3, data_confirmacao = NOW() WHERE email = $4',
                [nome, presencaValue, mensagem || null, emailValue]
            );
            console.log('Atualizado:', nome);
        } else {
            await client.query(
                'INSERT INTO convidados (nome, email, presenca, mensagem) VALUES ($1, $2, $3, $4)',
                [nome, emailValue, presencaValue, mensagem || null]
            );
            console.log('Inserido:', nome);
        }

        if (presencaValue && email) await enviarEmail(nome, email);

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Confirmação enviada com sucesso!' }) };
    } catch (error) {
        console.error('Erro:', error.message);
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: error.message }) };
    } finally {
        if (client) client.release();
    }
};
