const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zuipsuyioiwiicghhubz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1aXBzdXlpb2l3aWljZ2dodWJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTA5NTcsImV4cCI6MjA5NDQ4Njk1N30.Bel4q0iqYPktkLhrkqRSEOdfTbmrfvsjK6jf2ZtS_v4';
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET = 'fotos-convidados';

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    try {
        if (event.httpMethod === 'DELETE') {
            const { fileName } = JSON.parse(event.body);
            if (!fileName) {
                return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Nome do arquivo inválido' }) };
            }
            const { error } = await supabase.storage.from(BUCKET).remove([fileName]);
            if (error) throw new Error(error.message);
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

            const buffer = Buffer.from(fileData, 'base64');
            const uniqueName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

            const { error } = await supabase.storage
                .from(BUCKET)
                .upload(uniqueName, buffer, {
                    contentType: fileType,
                    upsert: false
                });

            if (error) {
                console.error('Erro no upload:', error);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ success: false, message: error.message })
                };
            }

            const { data: urlData } = supabase.storage
                .from(BUCKET)
                .getPublicUrl(uniqueName);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, url: urlData.publicUrl, name: uniqueName })
            };
        }

        if (event.httpMethod === 'GET') {
            const { data, error } = await supabase.storage
                .from(BUCKET)
                .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

            if (error) {
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ success: false, message: error.message })
                };
            }

            const files = (data || []).filter(f => f.name !== '.emptyFolderPlaceholder').map(file => {
                const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(file.name);
                return {
                    id: file.id,
                    name: file.name,
                    url: urlData.publicUrl,
                    type: file.name.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image'
                };
            });

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
    }
};
