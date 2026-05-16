const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../../casamento.db'));

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    return new Promise((resolve) => {
        db.all(`SELECT * FROM convidados ORDER BY data_confirmacao DESC`, (err, rows) => {
            if (err) {
                resolve({
                    statusCode: 500,
                    body: JSON.stringify({ success: false, message: err.message })
                });
                return;
            }

            const confirmados = rows.filter(c => c.presenca === 1).map(c => ({
                Nome: c.nome,
                Email: c.email,
                Presenca: c.presenca,
                Mensagem: c.mensagem,
                FotoUrl: c.foto_url,
                DataConfirmacao: c.data_confirmacao
            }));

            const recusados = rows.filter(c => c.presenca === 0).map(c => ({
                Nome: c.nome,
                Email: c.email,
                Presenca: c.presenca,
                Mensagem: c.mensagem,
                FotoUrl: c.foto_url,
                DataConfirmacao: c.data_confirmacao
            }));

            resolve({
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    confirmados,
                    recusados,
                    total: rows.length
                })
            });
        });
    });
};
