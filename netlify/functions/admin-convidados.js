// ID da Google Sheet
const SHEET_ID = '1RTxxXaK4P0EswifIkob5YcdX6PzVAOK7EncuN_8GbPM';

// Buscar dados da Google Sheet
async function getConvidados() {
    try {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
        const response = await fetch(url);
        const text = await response.text();
        
        // Remove o prefixo da resposta
        const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const data = JSON.parse(jsonStr);
        
        const convidados = [];
        if (data.table && data.table.rows) {
            data.table.rows.forEach((row, index) => {
                if (index === 0) return; // Pula header
                
                const presencaRaw = row.c[3]?.v;
                const presenca = presencaRaw === 'sim' || presencaRaw === true || presencaRaw === 1;
                
                convidados.push({
                    Nome: row.c[1]?.v || '',
                    Email: row.c[2]?.v || '',
                    Presenca: presenca ? 1 : 0,
                    Mensagem: row.c[4]?.v || '',
                    FotoUrl: null,
                    DataConfirmacao: row.c[5]?.v || new Date().toISOString()
                });
            });
        }
        
        return convidados;
    } catch (error) {
        console.error('Erro ao buscar dados da Google Sheet:', error);
        return [];
    }
}

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
            const convidados = await getConvidados();
            const confirmados = convidados.filter(c => c.Presenca === 1);
            const recusados = convidados.filter(c => c.Presenca === 0);

            console.log('Retornando convidados:', { 
                confirmados: confirmados.length, 
                recusados: recusados.length, 
                total: convidados.length 
            });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    confirmados,
                    recusados,
                    total: convidados.length
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
