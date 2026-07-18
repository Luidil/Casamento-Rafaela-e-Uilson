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
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'text/html; charset=utf-8'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: 'Método não permitido' };
    }

    let client;
    try {
        client = await pool.connect();

        const result = await client.query(
            'SELECT id, nome, email, presenca, mensagem, data_confirmacao FROM convidados ORDER BY data_confirmacao DESC'
        );

        const convidados = result.rows;
        const confirmados = convidados.filter(c => c.presenca).length;
        const naoVao = convidados.filter(c => !c.presenca).length;

        const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painel dos Noivos - Confirmações</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; background: #FAF7F2; color: #2D2D2D; padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; }
        h1 { color: #8B5E4A; text-align: center; margin-bottom: 10px; font-size: 2rem; }
        .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
        .stats { display: flex; gap: 15px; justify-content: center; margin-bottom: 30px; flex-wrap: wrap; }
        .stat-card { background: #fff; padding: 20px 30px; border-radius: 12px; text-align: center; box-shadow: 0 2px 10px rgba(139,94,74,0.1); }
        .stat-number { font-size: 2rem; font-weight: bold; color: #8B5E4A; }
        .stat-label { font-size: 0.85rem; color: #666; margin-top: 5px; }
        .stat-card.confirmados .stat-number { color: #4A7C59; }
        .stat-card.ausentes .stat-number { color: #A65D57; }
        table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(139,94,74,0.1); }
        th { background: #8B5E4A; color: #fff; padding: 12px 15px; text-align: left; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
        td { padding: 12px 15px; border-bottom: 1px solid #f0e8e0; font-size: 0.9rem; }
        tr:last-child td { border-bottom: none; }
        tr:hover { background: #f9f5f0; }
        .badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
        .badge-sim { background: #e8f5e9; color: #2e7d32; }
        .badge-nao { background: #fbe9e7; color: #c62828; }
        .msg { max-width: 200px; font-size: 0.8rem; color: #666; }
        .data { font-size: 0.8rem; color: #999; }
        @media (max-width: 600px) {
            table, thead, tbody, th, td, tr { display: block; }
            thead { display: none; }
            tr { margin-bottom: 10px; border-radius: 8px; border: 1px solid #f0e8e0; }
            td { padding: 8px 12px; position: relative; padding-left: 45%; text-align: right; }
            td::before { content: attr(data-label); position: absolute; left: 12px; font-weight: 600; color: #8B5E4A; text-align: left; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>💍 Painel dos Noivos</h1>
        <p class="subtitle">Lista de confirmações de presença</p>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${convidados.length}</div>
                <div class="stat-label">Total</div>
            </div>
            <div class="stat-card confirmados">
                <div class="stat-number">${confirmados}</div>
                <div class="stat-label">Confirmados ✓</div>
            </div>
            <div class="stat-card ausentes">
                <div class="stat-number">${naoVao}</div>
                <div class="stat-label">Não irão</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Presença</th>
                    <th>Mensagem</th>
                    <th>Data</th>
                </tr>
            </thead>
            <tbody>
                ${convidados.map((c, i) => `
                <tr>
                    <td data-label="#">${i + 1}</td>
                    <td data-label="Nome">${c.nome}</td>
                    <td data-label="Email">${c.email && !c.email.includes('@casamento.local') ? c.email : '-'}</td>
                    <td data-label="Presença"><span class="badge ${c.presenca ? 'badge-sim' : 'badge-nao'}">${c.presenca ? 'Sim ✓' : 'Não ✗'}</span></td>
                    <td data-label="Mensagem" class="msg">${c.mensagem || '-'}</td>
                    <td data-label="Data" class="data">${new Date(c.data_confirmacao).toLocaleDateString('pt-BR')} ${new Date(c.data_confirmacao).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</td>
                </tr>`).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;

        return { statusCode: 200, headers, body: html };
    } catch (error) {
        console.error('Erro:', error);
        return { statusCode: 500, headers, body: `<h1>Erro</h1><p>${error.message}</p>` };
    } finally {
        if (client) client.release();
    }
};
