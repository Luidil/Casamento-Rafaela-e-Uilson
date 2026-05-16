const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zuipsuyioiwiicghhubz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1aXBzdXlpb2l3aWljZ2dodWJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTA5NTcsImV4cCI6MjA5NDQ4Njk1N30.Bel4q0iqYPktkLhrkqRSEOdfTbmrfvsjK6jf2ZtS_v4';
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
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
        if (event.httpMethod === 'GET') {
            const { data, error } = await supabase
                .from('convidados')
                .select('*')
                .order('data_confirmacao', { ascending: false });

            if (error) throw error;

            const confirmados = data.filter(c => c.presenca === true);
            const recusados = data.filter(c => c.presenca === false);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
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
                    total: data.length
                })
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
