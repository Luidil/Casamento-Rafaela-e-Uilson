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

-- Tabela de fotos (metadados apenas; os bytes ficam no Netlify Blobs)
CREATE TABLE IF NOT EXISTS fotos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(255) NOT NULL,
    dados TEXT,
    blob_key TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para ordenar a galeria pelas fotos mais recentes
CREATE INDEX IF NOT EXISTS idx_fotos_created_at ON fotos(created_at DESC);
