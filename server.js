/**
 * Servidor Local - Site de Casamento
 * Execute: node server.js
 * Banco: PostgreSQL (Supabase)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Client } = require('pg');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const multiparty = require('multiparty');

// Configuração do PostgreSQL Supabase
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Luidillindo123@db.zuipsuyioiwiicghhubz.supabase.co:5432/postgres';

const db = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

db.connect((err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao PostgreSQL:', err.message);
        console.error('Connection string:', connectionString.replace(/:[^@]*@/, ':***@'));
        process.exit(1);
    } else {
        console.log('✅ Conectado ao PostgreSQL Supabase');
        initializeDatabase();
    }
});

// Inicializar banco de dados com todas as tabelas
function initializeDatabase() {
    const tables = [
        `CREATE TABLE IF NOT EXISTS convidados (
            id SERIAL PRIMARY KEY,
            nome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            presenca BOOLEAN NOT NULL,
            mensagem TEXT,
            foto_url TEXT,
            data_confirmacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS fotos (
            id SERIAL PRIMARY KEY,
            nome_original TEXT NOT NULL,
            nome_arquivo TEXT NOT NULL,
            tipo_arquivo TEXT NOT NULL,
            tamanho INTEGER NOT NULL,
            url TEXT NOT NULL,
            id_convidado INTEGER REFERENCES convidados(id) ON DELETE SET NULL,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS presentes (
            id SERIAL PRIMARY KEY,
            nome TEXT NOT NULL,
            descricao TEXT,
            categoria TEXT,
            preco REAL,
            link_compra TEXT,
            imagem_url TEXT,
            quantidade_total INTEGER DEFAULT 1,
            quantidade_comprada INTEGER DEFAULT 0,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS musicas (
            id SERIAL PRIMARY KEY,
            titulo TEXT NOT NULL,
            artista TEXT NOT NULL,
            solicitado_por TEXT,
            id_convidado INTEGER REFERENCES convidados(id) ON DELETE SET NULL,
            observacoes TEXT,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS comentarios (
            id SERIAL PRIMARY KEY,
            id_convidado INTEGER REFERENCES convidados(id) ON DELETE CASCADE,
            nome TEXT NOT NULL,
            email TEXT NOT NULL,
            mensagem TEXT NOT NULL,
            aprovado BOOLEAN DEFAULT false,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS galeria_fotos (
            id SERIAL PRIMARY KEY,
            titulo TEXT NOT NULL,
            descricao TEXT,
            categoria TEXT,
            ordem INTEGER DEFAULT 0,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS fotos_galeria (
            id SERIAL PRIMARY KEY,
            id_galeria INTEGER NOT NULL REFERENCES galeria_fotos(id) ON DELETE CASCADE,
            nome_original TEXT NOT NULL,
            nome_arquivo TEXT NOT NULL,
            tipo_arquivo TEXT NOT NULL,
            tamanho INTEGER NOT NULL,
            url TEXT NOT NULL,
            ordem INTEGER DEFAULT 0,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS fotos_convidados (
            id SERIAL PRIMARY KEY,
            id_convidado INTEGER NOT NULL REFERENCES convidados(id) ON DELETE CASCADE,
            nome_original TEXT NOT NULL,
            nome_arquivo TEXT NOT NULL,
            tipo_arquivo TEXT NOT NULL,
            tamanho INTEGER NOT NULL,
            url TEXT NOT NULL,
            aprovado BOOLEAN DEFAULT false,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS cronograma (
            id SERIAL PRIMARY KEY,
            horario TEXT NOT NULL,
            evento TEXT NOT NULL,
            descricao TEXT,
            local TEXT,
            ordem INTEGER DEFAULT 0,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS hospedagem (
            id SERIAL PRIMARY KEY,
            nome TEXT NOT NULL,
            tipo TEXT,
            endereco TEXT,
            telefone TEXT,
            email TEXT,
            website TEXT,
            descricao TEXT,
            preco_aproximado TEXT,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS transporte (
            id SERIAL PRIMARY KEY,
            tipo TEXT,
            saida_local TEXT,
            saida_horario TEXT,
            destino_local TEXT,
            destino_horario TEXT,
            capacidade INTEGER,
            observacoes TEXT,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS logs (
            id SERIAL PRIMARY KEY,
            tipo_acao TEXT NOT NULL,
            descricao TEXT,
            id_convidado INTEGER REFERENCES convidados(id) ON DELETE SET NULL,
            ip_address TEXT,
            user_agent TEXT,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS configuracoes (
            id SERIAL PRIMARY KEY,
            chave TEXT NOT NULL UNIQUE,
            valor TEXT NOT NULL,
            descricao TEXT,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE INDEX IF NOT EXISTS ix_convidados_email ON convidados(email)`,
        `CREATE INDEX IF NOT EXISTS ix_convidados_presenca ON convidados(presenca)`,
        `CREATE INDEX IF NOT EXISTS ix_fotos_convidado ON fotos(id_convidado)`,
        `CREATE INDEX IF NOT EXISTS ix_fotos_galeria_id ON fotos_galeria(id_galeria)`
    ];

    tables.forEach((sql, index) => {
        db.query(sql, (err) => {
            if (err && !err.message.includes('already exists')) {
                console.error(`❌ Erro ao criar tabela ${index}:`, err.message);
            } else if (!err) {
                console.log(`✅ Tabela ${index} criada/verificada`);
            }
        });
    });
}

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Testar conexão de email
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter.verify((error, success) => {
        if (error) {
            console.warn('⚠️ Email não configurado:', error.message);
        } else {
            console.log('✅ Email configurado com sucesso');
        }
    });
}

// Função auxiliar para executar queries com PostgreSQL
function executeQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) {
                console.error('❌ Erro na query:', err.message);
                reject(err);
            } else {
                resolve({ 
                    rows: result.rows || [],
                    lastID: result.rows?.[0]?.id,
                    changes: result.rowCount || 0
                });
            }
        });
    });
}

const PORT = 5500;
const BASE_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

const QR_CODE_OPTIONS = {
    errorCorrectionLevel: 'H',
    margin: 1,
    color: {
        dark: '#8B5E4A',
        light: '#FAF7F2'
    }
};

// Parse body da requisição
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

function getRequestOrigin(req) {
    const forwardedProto = req.headers['x-forwarded-proto'];
    const proto = typeof forwardedProto === 'string'
        ? forwardedProto.split(',')[0].trim()
        : 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;

    return `${proto}://${host}`;
}

function buildQrCodeTargetUrl(req, target) {
    if (typeof target !== 'string' || target.length === 0 || target.length > 500) {
        throw new Error('Destino do QR Code inválido');
    }

    if (!/^\/(?!\/)[^\s]*$/.test(target)) {
        throw new Error('Destino do QR Code deve ser relativo ao site');
    }

    return new URL(target, getRequestOrigin(req)).toString();
}

async function buildQrCodePngBuffer(targetUrl) {
    const dataUrl = await QRCode.toDataURL(targetUrl, {
        type: 'image/png',
        width: 900,
        ...QR_CODE_OPTIONS
    });

    return Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
}

async function streamQrCodePdf(res, targetUrl) {
    const qrCodeBuffer = await buildQrCodePngBuffer(targetUrl);

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 48
        });

        doc.on('error', reject);
        res.on('error', reject);
        res.on('finish', resolve);

        doc.pipe(res);

        doc
            .fillColor('#8B5E4A')
            .fontSize(28)
            .text('Compartilhe Seus Momentos', { align: 'center' });

        doc.roundedRect(72, 120, 451, 520, 18)
            .fillAndStroke('#FAF7F2', '#E6D3C1');

        doc.image(qrCodeBuffer, 132, 180, {
            fit: [330, 330],
            align: 'center',
            valign: 'center'
        });

        doc.end();
    });
}

// API: Salvar confirmação
async function handleConfirmacao(data) {
    try {
        const { nome, email, presenca, mensagem, fotoUrl } = data;
        
        if (!nome || !email || presenca === undefined) {
            return { success: false, message: 'Dados incompletos' };
        }

        const presencaValue = presenca === 'sim' || presenca === true ? true : false;
        const msgValue = mensagem || null;
        const fotoValue = fotoUrl || null;

        // Verificar se já existe
        const existing = await executeQuery('SELECT id FROM convidados WHERE email = $1', [email]);
        
        if (existing.rows.length > 0) {
            // Atualizar existente
            await executeQuery(`
                UPDATE convidados 
                SET nome = $1, presenca = $2, mensagem = $3, foto_url = COALESCE($4, foto_url), data_confirmacao = CURRENT_TIMESTAMP
                WHERE email = $5
            `, [nome, presencaValue, msgValue, fotoValue, email]);
            
            // Enviar email se confirmou presença
            if (presencaValue) {
                await enviarEmailConfirmacao(nome, email);
            }
            
            return { success: true, message: 'Confirmação atualizada!' };
        } else {
            // Inserir novo
            await executeQuery(`
                INSERT INTO convidados (nome, email, presenca, mensagem, foto_url)
                VALUES ($1, $2, $3, $4, $5)
            `, [nome, email, presencaValue, msgValue, fotoValue]);
            
            // Enviar email se confirmou presença
            if (presencaValue) {
                await enviarEmailConfirmacao(nome, email);
            }
            
            return { success: true, message: 'Confirmação enviada com sucesso!' };
        }
    } catch (error) {
        console.error('❌ Erro ao salvar:', error.message);
        return { success: false, message: 'Erro ao salvar dados: ' + error.message };
    }
}

// Função para enviar email de confirmação
async function enviarEmailConfirmacao(nome, email) {
    try {
        // Verificar se email está configurado
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.log('⚠️ Email não configurado, pulando envio');
            return;
        }
        
        // Pega uma foto aleatória da pasta Fotos
        const fotosDir = path.join(__dirname, 'Fotos');
        const fotos = fs.readdirSync(fotosDir).filter(f => 
            f.match(/\.(jpg|jpeg|png|gif)$/i)
        );
        
        if (fotos.length === 0) {
            console.warn('Nenhuma foto encontrada na pasta Fotos');
            return;
        }
        
        const fotoAleatoria = fotos[Math.floor(Math.random() * fotos.length)];
        const caminhoFoto = path.join(fotosDir, fotoAleatoria);
        
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
                    .foto { max-width: 100%; height: auto; border-radius: 10px; margin: 20px 0; }
                    .mensagem { font-size: 1.1em; color: #2D2D2D; line-height: 1.8; margin: 20px 0; }
                    .destaque { color: #8B5E4A; font-weight: bold; }
                    .footer { background-color: #f5ede3; padding: 20px; text-align: center; font-size: 0.9em; color: #666; }
                    .btn { display: inline-block; background-color: #8B5E4A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
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
                        <img src="cid:foto" alt="Casal" class="foto" style="max-width: 400px;">
                        <div class="mensagem">
                            <p>Que alegria saber que você estará conosco neste momento tão especial!</p>
                            <p>Sua presença é muito importante para nós. <span class="destaque">Esperamos você lá</span> para compartilharmos juntos este dia inesquecível.</p>
                            <p><span class="destaque">Obrigado por aceitar viver esse momento lindo</span> ao nosso lado. Sua companhia tornará este dia ainda mais especial.</p>
                            <p style="margin-top: 30px; font-style: italic; color: #8B5E4A;">Com amor,<br>Uilson & Rafaela</p>
                        </div>
                        <a href="http://localhost:5500" class="btn" style="display: inline-block; background-color: #8B5E4A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px;">Voltar ao Site</a>
                    </div>
                    <div class="footer">
                        <p>Este é um email automático. Por favor, não responda.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@casamento.com',
            to: email,
            subject: 'Confirmação de Presença - Casamento Uilson & Rafaela',
            html: htmlEmail,
            attachments: [
                {
                    filename: fotoAleatoria,
                    path: caminhoFoto,
                    cid: 'foto'
                }
            ]
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email enviado para ${email}`);
    } catch (error) {
        console.error('⚠️ Erro ao enviar email (continuando mesmo assim):', error.message);
    }
}

// API: Listar confirmações
async function handleListarConfirmacoes() {
    try {
        const result = await executeQuery(`
            SELECT * FROM convidados WHERE presenca = true ORDER BY data_confirmacao DESC
        `);
        
        const total = await executeQuery('SELECT COUNT(*) as count FROM convidados');
        
        return { 
            success: true, 
            confirmados: result.rows,
            total: total.rows[0]?.count || 0
        };
    } catch (error) {
        console.error('❌ Erro ao listar:', error.message);
        return { success: false, message: 'Erro ao buscar dados' };
    }
}

// API: Listar todos os convidados (admin)
async function handleListarTodosConvidados() {
    try {
        const result = await executeQuery(`
            SELECT id, nome, email, presenca, mensagem, foto_url, data_confirmacao 
            FROM convidados ORDER BY data_confirmacao DESC
        `);
        
        const confirmados = result.rows.filter(c => c.presenca === true);
        const recusados = result.rows.filter(c => c.presenca === false);
        
        return { 
            success: true, 
            confirmados: confirmados.map(c => ({
                Nome: c.nome,
                Email: c.email,
                Presenca: c.presenca,
                Mensagem: c.mensagem,
                FotoUrl: c.foto_url,
                DataConfirmacao: c.data_confirmacao
            })),
            recusados: recusados.map(c => ({
                Nome: c.nome,
                Email: c.email,
                Presenca: c.presenca,
                Mensagem: c.mensagem,
                FotoUrl: c.foto_url,
                DataConfirmacao: c.data_confirmacao
            })),
            total: result.rows.length
        };
    } catch (error) {
        console.error('❌ Erro ao listar:', error.message);
        return { success: false, message: 'Erro ao buscar dados' };
    }
}

// Criar pasta de uploads
const uploadsDir = path.join(BASE_DIR, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const server = http.createServer(async (req, res) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    
    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // API Routes
    if (req.url.startsWith('/api/')) {
        if (req.method === 'GET' && req.url.startsWith('/api/qrcode-pdf')) {
            try {
                const requestUrl = new URL(req.url, getRequestOrigin(req));
                const target = requestUrl.searchParams.get('target') || '/#fotos';
                const qrCodeUrl = buildQrCodeTargetUrl(req, target);

                res.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'attachment; filename="qrcode-fotos.pdf"',
                    'Cache-Control': 'no-store'
                });

                await streamQrCodePdf(res, qrCodeUrl);
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: error.message }));
            }
            return;
        }

        res.setHeader('Content-Type', 'application/json');
        
        // POST /api/confirmacao
        if (req.method === 'POST' && req.url === '/api/confirmacao') {
            try {
                const body = await parseBody(req);
                const data = JSON.parse(body);
                const result = await handleConfirmacao(data);
                res.writeHead(200);
                res.end(JSON.stringify(result));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: 'Dados inválidos' }));
            }
            return;
        }
        
        // GET /api/confirmacoes
        if (req.method === 'GET' && req.url === '/api/confirmacoes') {
            const result = await handleListarConfirmacoes();
            res.writeHead(200);
            res.end(JSON.stringify(result));
            return;
        }
        
        // GET /api/admin/convidados
        if (req.method === 'GET' && req.url === '/api/admin/convidados') {
            const result = await handleListarTodosConvidados();
            res.writeHead(200);
            res.end(JSON.stringify(result));
            return;
        }
        
        // GET /api/uploaded-files
        if (req.method === 'GET' && req.url === '/api/uploaded-files') {
            try {
                const uploadsDir = path.join(__dirname, 'uploads');
                const files = fs.readdirSync(uploadsDir).map(file => ({
                    id: Date.now() + Math.random(),
                    name: file,
                    url: `/uploads/${file}`,
                    type: file.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image'
                }));
                
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, files }));
            } catch (error) {
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, files: [] }));
            }
            return;
        }
        
        // POST /api/upload
        if (req.method === 'POST' && req.url.startsWith('/api/upload')) {
            const contentType = req.headers['content-type'] || '';
            if (!contentType.includes('multipart/form-data')) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: 'Content-Type deve ser multipart/form-data' }));
                return;
            }

            const form = new multiparty.Form({ uploadDir: uploadsDir });
            form.parse(req, (err, fields, files) => {
                if (err) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'Erro ao fazer upload' }));
                    return;
                }

                const uploadedFiles = files.file || [];
                const results = uploadedFiles.map(file => ({
                    id: Date.now() + Math.random(),
                    name: path.basename(file.path),
                    url: `/uploads/${path.basename(file.path)}`,
                    type: file.headers['content-type'].includes('video') ? 'video' : 'image'
                }));

                res.writeHead(200);
                res.end(JSON.stringify({ success: true, files: results }));
            });
            return;
        }
        
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, message: 'Rota não encontrada' }));
        return;
    }
    
    // Servir arquivos estáticos
    let filePath = path.join(BASE_DIR, req.url === '/' ? 'index.html' : req.url);
    
    // Prevenir directory traversal
    if (!filePath.startsWith(BASE_DIR)) {
        res.writeHead(403);
        res.end('Acesso negado');
        return;
    }
    
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404);
            res.end('Arquivo não encontrado');
            return;
        }
        
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, () => {
    console.log('========================================');
    console.log('🎉 Servidor do Site de Casamento');
    console.log(`Acesse: http://localhost:${PORT}`);
    console.log('Pressione Ctrl+C para parar');
    console.log('========================================');
});
