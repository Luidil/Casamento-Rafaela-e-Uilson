-- ========================================
-- RESET COMPLETO DO BANCO DE DADOS
-- Execute no DBeaver
-- ========================================

-- Deletar todas as tabelas (ordem importa por causa das foreign keys)
DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS transporte;
DROP TABLE IF EXISTS hospedagem;
DROP TABLE IF EXISTS cronograma;
DROP TABLE IF EXISTS fotos_convidados;
DROP TABLE IF EXISTS fotos_galeria;
DROP TABLE IF EXISTS galeria_fotos;
DROP TABLE IF EXISTS comentarios;
DROP TABLE IF EXISTS musicas;
DROP TABLE IF EXISTS presentes;
DROP TABLE IF EXISTS fotos;
DROP TABLE IF EXISTS configuracoes;
DROP TABLE IF EXISTS convidados;

-- ========================================
-- CRIAR TABELAS DO ZERO
-- ========================================

CREATE TABLE convidados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    presenca BOOLEAN NOT NULL,
    mensagem TEXT,
    foto_url TEXT,
    data_confirmacao DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fotos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_original TEXT NOT NULL,
    nome_arquivo TEXT NOT NULL,
    tipo_arquivo TEXT NOT NULL,
    tamanho INTEGER NOT NULL,
    url TEXT NOT NULL,
    id_convidado INTEGER,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(id_convidado) REFERENCES convidados(id) ON DELETE SET NULL
);

CREATE TABLE presentes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT,
    preco REAL,
    link_compra TEXT,
    imagem_url TEXT,
    quantidade_total INTEGER DEFAULT 1,
    quantidade_comprada INTEGER DEFAULT 0,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE musicas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    artista TEXT NOT NULL,
    solicitado_por TEXT,
    id_convidado INTEGER,
    observacoes TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(id_convidado) REFERENCES convidados(id) ON DELETE SET NULL
);

CREATE TABLE comentarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_convidado INTEGER,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    aprovado BOOLEAN DEFAULT 0,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(id_convidado) REFERENCES convidados(id) ON DELETE CASCADE
);

CREATE TABLE galeria_fotos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT,
    ordem INTEGER DEFAULT 0,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fotos_galeria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_galeria INTEGER NOT NULL,
    nome_original TEXT NOT NULL,
    nome_arquivo TEXT NOT NULL,
    tipo_arquivo TEXT NOT NULL,
    tamanho INTEGER NOT NULL,
    url TEXT NOT NULL,
    ordem INTEGER DEFAULT 0,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(id_galeria) REFERENCES galeria_fotos(id) ON DELETE CASCADE
);

CREATE TABLE fotos_convidados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_convidado INTEGER NOT NULL,
    nome_original TEXT NOT NULL,
    nome_arquivo TEXT NOT NULL,
    tipo_arquivo TEXT NOT NULL,
    tamanho INTEGER NOT NULL,
    url TEXT NOT NULL,
    aprovado BOOLEAN DEFAULT 0,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(id_convidado) REFERENCES convidados(id) ON DELETE CASCADE
);

CREATE TABLE cronograma (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    horario TEXT NOT NULL,
    evento TEXT NOT NULL,
    descricao TEXT,
    local TEXT,
    ordem INTEGER DEFAULT 0,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hospedagem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    tipo TEXT,
    endereco TEXT,
    telefone TEXT,
    email TEXT,
    website TEXT,
    descricao TEXT,
    preco_aproximado TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transporte (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT,
    saida_local TEXT,
    saida_horario TEXT,
    destino_local TEXT,
    destino_horario TEXT,
    capacidade INTEGER,
    observacoes TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_acao TEXT NOT NULL,
    descricao TEXT,
    id_convidado INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(id_convidado) REFERENCES convidados(id) ON DELETE SET NULL
);

CREATE TABLE configuracoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chave TEXT NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descricao TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- CRIAR ÍNDICES
-- ========================================
CREATE INDEX ix_convidados_email ON convidados(email);
CREATE INDEX ix_convidados_presenca ON convidados(presenca);
CREATE INDEX ix_fotos_convidado ON fotos(id_convidado);
CREATE INDEX ix_fotos_galeria_id ON fotos_galeria(id_galeria);

SELECT 'Banco resetado com sucesso!' AS status;
