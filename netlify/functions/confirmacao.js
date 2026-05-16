const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../../casamento.db'));

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    try {
        const data = JSON.parse(event.body);
        const { nome, email, presenca, mensagem, fotoUrl } = data;

        if (!nome || !presenca) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, message: 'Dados incompletos' })
            };
        }

        const presencaValue = presenca === 'sim' ? 1 : 0;
        const msgValue = mensagem || null;
        const fotoValue = fotoUrl || null;

        return new Promise((resolve) => {
            db.get('SELECT id FROM convidados WHERE email = ?', [email], (err, row) => {
                if (row) {
                    db.run(
                        `UPDATE convidados SET nome = ?, presenca = ?, mensagem = ?, foto_url = COALESCE(?, foto_url), data_confirmacao = CURRENT_TIMESTAMP WHERE email = ?`,
                        [nome, presencaValue, msgValue, fotoValue, email],
                        () => {
                            resolve({
                                statusCode: 200,
                                body: JSON.stringify({ success: true, message: 'Confirmação atualizada!' })
                            });
                        }
                    );
                } else {
                    db.run(
                        `INSERT INTO convidados (nome, email, presenca, mensagem, foto_url) VALUES (?, ?, ?, ?, ?)`,
                        [nome, email, presencaValue, msgValue, fotoValue],
                        () => {
                            resolve({
                                statusCode: 200,
                                body: JSON.stringify({ success: true, message: 'Confirmação enviada com sucesso!' })
                            });
                        }
                    );
                }
            });
        });
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message })
        };
    }
};
