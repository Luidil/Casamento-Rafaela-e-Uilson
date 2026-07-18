const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://casamento:casamento123@localhost:5433/casamento_db',
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : false
});

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    let client;
    try {
        client = await pool.connect();

        if (event.httpMethod === 'DELETE') {
            const { fileName } = JSON.parse(event.body);
            if (!fileName) {
                return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Nome do arquivo inválido' }) };
            }
            await client.query('DELETE FROM fotos WHERE nome = $1', [fileName]);
            return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }

        if (event.httpMethod === 'POST') {
            const { fileName, fileData, fileType } = JSON.parse(event.body);

            if (!fileName || !fileData) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ success: false, message: 'Arquivo inválido' })
                };
            }

            const uniqueName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

            await client.query(
                'INSERT INTO fotos (nome, tipo, dados) VALUES ($1, $2, $3)',
                [uniqueName, fileType, fileData]
            );

            // Retorna URL que aponta pra própria function pra servir a imagem
            const baseUrl = event.headers.host
                ? `${event.headers['x-forwarded-proto'] || 'http'}://${event.headers.host}`
                : '';
            const url = `${baseUrl}/.netlify/functions/upload?file=${encodeURIComponent(uniqueName)}`;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, url, name: uniqueName })
            };
        }

        if (event.httpMethod === 'GET') {
            // Se tem query param "file", serve a imagem
            const params = event.queryStringParameters || {};
            if (params.file) {
                const result = await client.query(
                    'SELECT dados, tipo FROM fotos WHERE nome = $1',
                    [params.file]
                );

                if (result.rows.length === 0) {
                    return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Arquivo não encontrado' }) };
                }

                const { dados, tipo } = result.rows[0];
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': tipo,
                        'Cache-Control': 'public, max-age=31536000'
                    },
                    body: dados,
                    isBase64Encoded: true
                };
            }

            // Lista todas as fotos
            const result = await client.query(
                'SELECT id, nome, tipo, created_at FROM fotos ORDER BY created_at DESC LIMIT 100'
            );

            const baseUrl = event.headers.host
                ? `${event.headers['x-forwarded-proto'] || 'http'}://${event.headers.host}`
                : '';

            const files = result.rows.map(file => ({
                id: file.id,
                name: file.nome,
                url: `${baseUrl}/.netlify/functions/upload?file=${encodeURIComponent(file.nome)}`,
                type: file.tipo.startsWith('video') ? 'video' : 'image'
            }));

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, files })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Método não permitido' })
        };
    } catch (error) {
        console.error('Erro:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, message: error.message })
        };
    } finally {
        if (client) client.release();
    }
};
