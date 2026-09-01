import { getStore } from '@netlify/blobs';
import { Pool } from 'pg';

// O limite de payload de uma function síncrona no Netlify é de ~6 MB.
// Mantemos uma margem de segurança porque headers e overhead de transporte
// também contam para esse total.
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const STORE_NAME = 'fotos-casamento';

// Allowlist explícita em vez de aceitar qualquer 'image/*': um SVG enviado por
// um convidado e servido no domínio do site seria um vetor de XSS.
const ALLOWED_TYPES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/3gpp'
]);

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-File-Name, X-File-Type'
};

let pool;
let schemaPromise;

function getPool() {
    if (!pool) {
        const connectionString =
            process.env.DATABASE_URL ||
            process.env.NETLIFY_DATABASE_URL ||
            'postgresql://casamento:casamento123@localhost:5433/casamento_db';

        pool = new Pool({
            connectionString,
            ssl: /neon\.tech|sslmode=require/.test(connectionString)
                ? { rejectUnauthorized: false }
                : false,
            max: 3,
            idleTimeoutMillis: 10000,
            connectionTimeoutMillis: 8000
        });
        pool.on('error', (err) => console.error('Erro no pool do Postgres:', err.message));
    }
    return pool;
}

// A tabela guarda apenas os metadados: os bytes da imagem ficam no Netlify Blobs.
// Roda uma vez por cold start e só emite DDL quando algo realmente falta, para
// não pegar lock exclusivo na tabela a cada invocação.
function ensureSchema(client) {
    if (!schemaPromise) {
        schemaPromise = (async () => {
            await client.query(`
                CREATE TABLE IF NOT EXISTS fotos (
                    id SERIAL PRIMARY KEY,
                    nome VARCHAR(255) NOT NULL,
                    tipo VARCHAR(255) NOT NULL,
                    dados TEXT,
                    blob_key TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `);
            await client.query(
                'CREATE INDEX IF NOT EXISTS idx_fotos_created_at ON fotos(created_at DESC)'
            );

            // Tabelas criadas pela versão anterior não têm blob_key e exigem
            // dados (o base64) preenchido.
            const { rows } = await client.query(`
                SELECT column_name, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'fotos' AND column_name IN ('blob_key', 'dados')
            `);

            if (!rows.some((row) => row.column_name === 'blob_key')) {
                await client.query('ALTER TABLE fotos ADD COLUMN blob_key TEXT');
            }
            if (rows.some((row) => row.column_name === 'dados' && row.is_nullable === 'NO')) {
                await client.query('ALTER TABLE fotos ALTER COLUMN dados DROP NOT NULL');
            }
        })().catch((error) => {
            schemaPromise = undefined;
            throw error;
        });
    }
    return schemaPromise;
}

function json(body, status = 200) {
    return Response.json(body, {
        status,
        headers: CORS_HEADERS
    });
}

function safeFileName(name) {
    const cleaned = String(name || 'foto')
        .split(/[\\/]/)
        .pop()
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .slice(-120);
    return cleaned || 'foto';
}

// Descarta parâmetros como '; charset=' e normaliza para comparação.
function normalizeType(type) {
    return String(type || '').split(';')[0].trim().toLowerCase();
}

async function readUpload(req) {
    const contentType = req.headers.get('content-type') || '';

    // Formato antigo (JSON + base64), mantido para navegadores que ainda
    // tenham a versão anterior do script em cache.
    if (contentType.includes('application/json')) {
        const { fileName, fileData, fileType } = await req.json();
        if (!fileName || !fileData) return null;
        return {
            fileName,
            fileType: normalizeType(fileType) || 'image/jpeg',
            bytes: Buffer.from(fileData, 'base64')
        };
    }

    // Formato atual: o arquivo é enviado como corpo binário puro, o que evita
    // os ~33% de inflação do base64 que estourava o limite de payload.
    const buffer = Buffer.from(await req.arrayBuffer());
    if (buffer.length === 0) return null;

    // O nome chega percent-encoded porque headers HTTP só carregam ASCII.
    const rawName = req.headers.get('x-file-name') || 'foto.jpg';
    let fileName = rawName;
    try {
        fileName = decodeURIComponent(rawName);
    } catch {
        // Mantém o valor original se não for um encoding válido.
    }

    return {
        fileName,
        fileType: normalizeType(req.headers.get('x-file-type') || contentType) || 'image/jpeg',
        bytes: buffer
    };
}

export default async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(req.url);
    const store = getStore(STORE_NAME);
    let client;

    try {
        if (req.method === 'POST') {
            const upload = await readUpload(req);

            if (!upload) {
                return json({ success: false, message: 'Arquivo inválido ou vazio.' }, 400);
            }

            if (!ALLOWED_TYPES.has(upload.fileType)) {
                return json(
                    { success: false, message: 'Formato não suportado. Envie fotos (JPG, PNG, WEBP, HEIC) ou vídeos (MP4, WEBM).' },
                    415
                );
            }

            if (upload.bytes.length > MAX_UPLOAD_BYTES) {
                return json(
                    {
                        success: false,
                        message: `Arquivo muito grande (${(upload.bytes.length / 1024 / 1024).toFixed(1)} MB). O limite é de 5 MB por arquivo.`
                    },
                    413
                );
            }

            const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeFileName(upload.fileName)}`;

            await store.set(name, upload.bytes);

            try {
                client = await getPool().connect();
                await ensureSchema(client);
                await client.query(
                    'INSERT INTO fotos (nome, tipo, blob_key) VALUES ($1, $2, $3)',
                    [name, upload.fileType, name]
                );
            } catch (error) {
                // Sem a linha de metadados a foto ficaria invisível na galeria,
                // então o blob não deve continuar ocupando espaço.
                await store.delete(name).catch(() => {});
                throw error;
            }

            return json({
                success: true,
                name,
                url: `${url.origin}/.netlify/functions/upload?file=${encodeURIComponent(name)}`
            });
        }

        if (req.method === 'GET') {
            const file = url.searchParams.get('file');

            // Serve o arquivo a partir do Blobs.
            if (file) {
                client = await getPool().connect();
                await ensureSchema(client);
                const { rows } = await client.query(
                    'SELECT tipo, dados, blob_key FROM fotos WHERE nome = $1 LIMIT 1',
                    [file]
                );

                if (rows.length === 0) {
                    return json({ success: false, message: 'Arquivo não encontrado.' }, 404);
                }

                const { tipo, dados, blob_key: blobKey } = rows[0];
                const safeType = ALLOWED_TYPES.has(normalizeType(tipo))
                    ? normalizeType(tipo)
                    : 'application/octet-stream';
                const cacheHeaders = {
                    'Content-Type': safeType,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'X-Content-Type-Options': 'nosniff',
                    'Access-Control-Allow-Origin': '*'
                };

                const blob = blobKey ? await store.get(blobKey, { type: 'arrayBuffer' }) : null;
                if (blob) {
                    return new Response(blob, { status: 200, headers: cacheHeaders });
                }

                // Registros antigos, gravados em base64 na própria tabela.
                if (dados) {
                    return new Response(Buffer.from(dados, 'base64'), { status: 200, headers: cacheHeaders });
                }

                return json({ success: false, message: 'Arquivo não encontrado.' }, 404);
            }

            // Lista a galeria.
            client = await getPool().connect();
            await ensureSchema(client);
            const { rows } = await client.query(
                'SELECT id, nome, tipo FROM fotos ORDER BY created_at DESC, id DESC LIMIT 200'
            );

            return json({
                success: true,
                files: rows.map((row) => ({
                    id: row.id,
                    name: row.nome,
                    url: `${url.origin}/.netlify/functions/upload?file=${encodeURIComponent(row.nome)}`,
                    type: String(row.tipo || '').startsWith('video') ? 'video' : 'image'
                }))
            });
        }

        if (req.method === 'DELETE') {
            const { fileName } = await req.json().catch(() => ({}));
            if (!fileName) {
                return json({ success: false, message: 'Nome do arquivo inválido.' }, 400);
            }

            client = await getPool().connect();
            await ensureSchema(client);
            const { rows } = await client.query(
                'DELETE FROM fotos WHERE nome = $1 RETURNING blob_key',
                [fileName]
            );

            for (const row of rows) {
                if (row.blob_key) {
                    await store.delete(row.blob_key).catch((error) =>
                        console.error('Falha ao remover blob:', error.message)
                    );
                }
            }

            return json({ success: true });
        }

        return json({ success: false, message: 'Método não permitido.' }, 405);
    } catch (error) {
        console.error('Erro no upload de fotos:', error);
        return json(
            { success: false, message: 'Não foi possível processar o arquivo. Tente novamente.' },
            500
        );
    } finally {
        if (client) client.release();
    }
};
