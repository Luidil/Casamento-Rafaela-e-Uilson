const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Banco de dados SQLite - usar diretório do projeto
const dbPath = path.join(process.cwd(), 'casamento.db');

const db = new sqlite3.Database(dbPath);

// Inicializar banco
function initDB() {
    return new Promise((resolve) => {
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS convidados (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    presenca BOOLEAN NOT NULL,
                    mensagem TEXT,
                    foto_url TEXT,
                    data_confirmacao DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            resolve();
        });
    });
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
        await initDB();

        if (event.httpMethod === 'GET') {
            return new Promise((resolve) => {
                db.all('SELECT * FROM convidados ORDER BY data_confirmacao DESC', (err, rows) => {
                    if (err) {
                        resolve({
                            statusCode: 500,
                            headers,
                            body: JSON.stringify({ success: false, message: err.message })
                        });
                        return;
                    }

                    const confirmados = rows.filter(r => r.presenca === 1);
                    const recusados = rows.filter(r => r.presenca === 0);

                    resolve({
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({
                            success: true,
                            confirmados: confirmados.map(c => ({
                                Nome: c.nome,
                                Email: c.email,
                                Presenca: c.presenca,
                                Mensagem: c.mensagem,
                                DataConfirmacao: c.data_confirmacao
                            })),
                            recusados: recusados.map(c => ({
                                Nome: c.nome,
                                Email: c.email,
                                Presenca: c.presenca,
                                Mensagem: c.mensagem,
                                DataConfirmacao: c.data_confirmacao
                            })),
                            total: rows.length
                        })
                    });
                });
            });
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Método não permitido' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, message: error.message })
        };
    }
};
