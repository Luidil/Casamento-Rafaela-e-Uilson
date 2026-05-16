const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const nodemailer = require('nodemailer');
const fs = require('fs');

// Banco de dados SQLite
const dbPath = path.join('/tmp', 'casamento.db');
const db = new sqlite3.Database(dbPath);

// Configurar email
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Inicializar banco
function initDB() {
    return new Promise((resolve) => {
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS convidados (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    presenca BOOLEAN NOT NULL,
                    mensagem TEXT,
                    foto_url TEXT,
                    data_confirmacao DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            resolve();
        });
    });
}

// Enviar email
async function enviarEmailConfirmacao(nome, email) {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.log('Email não configurado');
            return;
        }

        const htmlEmail = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f5ede3; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(139, 94, 74, 0.1); }
                    .header { background: linear-gradient(135deg, #8B5E4A 0%, #C9A27E 100%); color: white; padding: 40px 20px; text-align: center; }
                    .header h1 { margin: 0; font-size: 2.5em; font-family: 'Cormorant Garamond', serif; }
                    .header p { margin: 10px 0 0 0; font-size: 1.1em; opacity: 0.9; }
                    .content { padding: 40px 20px; text-align: center; }
                    .mensagem { font-size: 1.1em; color: #2D2D2D; line-height: 1.8; margin: 20px 0; }
                    .destaque { color: #8B5E4A; font-weight: bold; }
                    .footer { background-color: #f5ede3; padding: 20px; text-align: center; font-size: 0.9em; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Uilson & Rafaela</h1>
                        <p>01 de Setembro de 2026</p>
                    </div>
                    <div class="content">
                        <h2 style="color: #8B5E4A; font-family: 'Cormorant Garamond', serif;">Obrigado, ${nome}!</h2>
                        <div class="mensagem">
                            <p>Que alegria saber que você estará conosco neste momento tão especial!</p>
                            <p>Sua presença é muito importante para nós. <span class="destaque">Esperamos você lá</span> para compartilharmos juntos este dia inesquecível.</p>
                            <p><span class="destaque">Obrigado por aceitar viver esse momento lindo</span> ao nosso lado. Sua companhia tornará este dia ainda mais especial.</p>
                            <p style="margin-top: 30px; font-style: italic; color: #8B5E4A;">Com amor,<br>Uilson & Rafaela</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Este é um email automático. Por favor, não responda.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'noreply@casamento.com',
            to: email,
            subject: 'Confirmação de Presença - Casamento Uilson & Rafaela',
            html: htmlEmail
        });

        console.log(`Email enviado para ${email}`);
    } catch (error) {
        console.error('Erro ao enviar email:', error.message);
    }
}

exports.handler = async (event, context) => {
    // CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    try {
        await initDB();

        if (event.httpMethod === 'POST') {
            const data = JSON.parse(event.body);
            const { nome, email, presenca, mensagem } = data;

            if (!nome || !email || presenca === undefined) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ success: false, message: 'Dados incompletos' })
                };
            }

            const presencaValue = presenca === 'sim' || presenca === true ? 1 : 0;

            return new Promise((resolve) => {
                db.get('SELECT id FROM convidados WHERE email = ?', [email], (err, row) => {
                    if (row) {
                        // Atualizar
                        db.run(
                            'UPDATE convidados SET nome = ?, presenca = ?, mensagem = ?, data_confirmacao = CURRENT_TIMESTAMP WHERE email = ?',
                            [nome, presencaValue, mensagem || null, email],
                            async (err) => {
                                if (presencaValue) {
                                    await enviarEmailConfirmacao(nome, email);
                                }
                                resolve({
                                    statusCode: 200,
                                    headers,
                                    body: JSON.stringify({ success: true, message: 'Confirmação atualizada!' })
                                });
                            }
                        );
                    } else {
                        // Inserir
                        db.run(
                            'INSERT INTO convidados (nome, email, presenca, mensagem) VALUES (?, ?, ?, ?)',
                            [nome, email, presencaValue, mensagem || null],
                            async (err) => {
                                if (presencaValue) {
                                    await enviarEmailConfirmacao(nome, email);
                                }
                                resolve({
                                    statusCode: 200,
                                    headers,
                                    body: JSON.stringify({ success: true, message: 'Confirmação enviada com sucesso!' })
                                });
                            }
                        );
                    }
                });
            });
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Método não permitido' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, message: error.message })
        };
    }
};
