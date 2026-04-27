/**
 * Servidor Local - Site de Casamento
 * Execute: node server.js
 * Banco: PostgreSQL
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Pool } = require('pg');
const multiparty = require('multiparty');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

// Configuração do PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5433),
    database: process.env.DB_NAME || 'casamento_db',
    user: process.env.DB_USER || 'casamento_user',
    password: process.env.DB_PASSWORD || '',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Testar conexão
pool.query('SELECT NOW()')
    .then(() => console.log('✅ Conectado ao PostgreSQL'))
    .catch(err => console.error('❌ Erro ao conectar:', err.message));

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
        
        if (!nome || !email || !presenca) {
            return { success: false, message: 'Dados incompletos' };
        }

        const presencaValue = presenca === 'sim';
        const msgValue = mensagem || null;
        const fotoValue = fotoUrl || null;

        // Verificar se já existe
        const existing = await pool.query('SELECT id FROM convidados WHERE email = $1', [email]);
        
        if (existing.rows.length > 0) {
            // Atualizar existente
            await pool.query(`
                UPDATE convidados 
                SET nome = $1, presenca = $2, mensagem = $3, foto_url = COALESCE($4, foto_url), data_confirmacao = NOW()
                WHERE email = $5
            `, [nome, presencaValue, msgValue, fotoValue, email]);
            
            return { success: true, message: 'Confirmação atualizada!' };
        } else {
            // Inserir novo
            await pool.query(`
                INSERT INTO convidados (nome, email, presenca, mensagem, foto_url)
                VALUES ($1, $2, $3, $4, $5)
            `, [nome, email, presencaValue, msgValue, fotoValue]);
            
            return { success: true, message: 'Confirmação enviada com sucesso!' };
        }
    } catch (error) {
        console.error('Erro ao salvar:', error);
        return { success: false, message: 'Erro ao salvar dados' };
    }
}

// API: Listar confirmações
async function handleListarConfirmacoes() {
    try {
        const result = await pool.query(`
            SELECT * FROM convidados WHERE presenca = true ORDER BY data_confirmacao DESC
        `);
        
        const total = await pool.query('SELECT COUNT(*) as count FROM convidados');
        
        return { 
            success: true, 
            confirmados: result.rows,
            total: parseInt(total.rows[0].count)
        };
    } catch (error) {
        console.error('Erro ao listar:', error);
        return { success: false, message: 'Erro ao buscar dados' };
    }
}

// API: Listar todos os convidados (admin)
async function handleListarTodosConvidados() {
    try {
        const result = await pool.query(`
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
                Presenca: c.presenca ? 1 : 0,
                Mensagem: c.mensagem,
                FotoUrl: c.foto_url,
                DataConfirmacao: c.data_confirmacao
            })),
            recusados: recusados.map(c => ({
                Nome: c.nome,
                Email: c.email,
                Presenca: c.presenca ? 1 : 0,
                Mensagem: c.mensagem,
                FotoUrl: c.foto_url,
                DataConfirmacao: c.data_confirmacao
            })),
            total: result.rows.length
        };
    } catch (error) {
        console.error('Erro ao listar:', error);
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
                    res.end(JSON.stringify({ success: false, message: 'Erro ao processar upload' }));
                    return;
                }
                
                const file = files.file && files.file[0];
                if (!file) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'Nenhum arquivo enviado' }));
                    return;
                }
                
                const fotoUrl = '/uploads/' + path.basename(file.path);
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, url: fotoUrl }));
            });
            return;
        }
        
        // 404 para APIs desconhecidas
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, message: 'API não encontrada' }));
        return;
    }
    
    // Arquivos estáticos
    let filePath = req.url.split('?')[0];
    
    if (filePath === '/') {
        filePath = '/index.html';
    }
    
    // Security: prevent directory traversal
    filePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
    
    const fullPath = path.join(BASE_DIR, filePath);
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.readFile(fullPath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('Página não encontrada');
            } else {
                res.writeHead(500);
                res.end('Erro no servidor');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log('========================================');
    console.log('🎉 Servidor do Site de Casamento');
    console.log(`   Acesse: http://localhost:${PORT}`);
    console.log('   Pressione Ctrl+C para parar');
    console.log('========================================');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Porta ${PORT} já está em uso!`);
        console.error(`   Tente usar outra porta ou pare o processo existente.`);
    } else {
        console.error('❌ Erro no servidor:', err);
    }
    process.exit(1);
});

// Fechar conexão ao parar
process.on('SIGINT', () => {
    pool.end();
    process.exit();
});
