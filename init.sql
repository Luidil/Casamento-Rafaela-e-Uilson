-- Tabela de convidados
CREATE TABLE IF NOT EXISTS convidados (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    presenca BOOLEAN DEFAULT false,
    mensagem TEXT,
    data_confirmacao TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para busca por email
CREATE INDEX IF NOT EXISTS idx_convidados_email ON convidados(email);
