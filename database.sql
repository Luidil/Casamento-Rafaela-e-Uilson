-- ========================================
-- Banco de Dados PostgreSQL - Site de Casamento
-- Execute este script no pgAdmin ou via psql
-- ========================================

-- Criar banco de dados (opcional - se ja existir pule)
-- CREATE DATABASE casamento_db;

-- ========================================
-- Tabela de Convidados/Confirmações
-- ========================================
CREATE TABLE IF NOT EXISTS convidados (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    presenca BOOLEAN NOT NULL,  -- TRUE = Sim, FALSE = Não
    mensagem TEXT,
    foto_url VARCHAR(500),
    data_confirmacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Tabela de Fotos do Evento
-- ========================================
CREATE TABLE IF NOT EXISTS fotos (
    id SERIAL PRIMARY KEY,
    nome_original VARCHAR(255) NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    tipo_arquivo VARCHAR(50) NOT NULL,
    tamanho BIGINT NOT NULL,
    url VARCHAR(500) NOT NULL,
    id_convidado INTEGER REFERENCES convidados(id) ON DELETE SET NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Tabela de Configurações do Casamento
-- ========================================
CREATE TABLE IF NOT EXISTS configuracoes (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descricao VARCHAR(500),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Inserir configurações padrão
-- ========================================
INSERT INTO configuracoes (chave, valor, descricao) VALUES
('NomeNoivo', 'Uilson', 'Nome do noivo'),
('NomeNoiva', 'Rafaela', 'Nome da noiva'),
('DataCasamento', '2026-09-01', 'Data do casamento'),
('HoraCerimonia', '16:00', 'Horário da cerimônia'),
('HoraRecepcao', '18:00', 'Horário da recepção'),
('LocalCerimonia', 'Igreja Nossa Senhora das Graças', 'Nome do local da cerimônia'),
('EnderecoCerimonia', 'Av. Praia de Itapuã, Qd 04 - Lote 06', 'Endereço da cerimônia'),
('LocalRecepcao', 'Salão de Eventos Villaggio', 'Nome do local da recepção'),
('EnderecoRecepcao', 'Av. Praia de Itapuã, Qd 04 - Lote 06', 'Endereço da recepção'),
('DressCodeHomens', 'Traje Social completo (terno e gravata)', 'Dress code para homens'),
('DressCodeMulheres', 'Vestido de festa ou traje elegante', 'Dress code para mulheres')
ON CONFLICT (chave) DO NOTHING;

-- ========================================
-- Índices para performance
-- ========================================
CREATE INDEX IF NOT EXISTS ix_convidados_email ON convidados(email);
CREATE INDEX IF NOT EXISTS ix_convidados_presenca ON convidados(presenca);

-- ========================================
-- Tabela de Presentes/Lista de Casamento
-- ========================================
CREATE TABLE IF NOT EXISTS presentes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100),
    preco DECIMAL(10, 2),
    link_compra VARCHAR(500),
    imagem_url VARCHAR(500),
    quantidade_total INTEGER DEFAULT 1,
    quantidade_comprada INTEGER DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Tabela de Músicas Solicitadas
-- ========================================
CREATE TABLE IF NOT EXISTS musicas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    artista VARCHAR(255) NOT NULL,
    solicitado_por VARCHAR(200),
    id_convidado INTEGER REFERENCES convidados(id) ON DELETE SET NULL,
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Tabela de Comentários/Mensagens
-- ========================================
CREATE TABLE IF NOT EXISTS comentarios (
    id SERIAL PRIMARY KEY,
    id_convidado INTEGER REFERENCES convidados(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    aprovado BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Tabela de Galeria de Fotos (Organizada)
-- ========================================
CREATE TABLE IF NOT EXISTS galeria_fotos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100),
    ordem INTEGER DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Tabela de Fotos da Galeria
-- ========================================
CREATE TABLE IF NOT EXISTS fotos_galeria (
    id SERIAL PRIMARY KEY,
    id_galeria INTEGER NOT NULL REFERENCES galeria_fotos(id) ON DELETE CASCADE,
    nome_original VARCHAR(255) NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    tipo_arquivo VARCHAR(50) NOT NULL,
    tamanho BIGINT NOT NULL,
    url VARCHAR(500) NOT NULL,
    ordem INTEGER DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Tabela de Fotos Enviadas por Convidados
-- ========================================
CREATE TABLE IF NOT EXISTS fotos_convidados (
    id SERIAL PRIMARY KEY,
    id_convidado INTEGER NOT NULL REFERENCES convidados(id) ON DELETE CASCADE,
    nome_original VARCHAR(255) NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    tipo_arquivo VARCHAR(50) NOT NULL,
    tamanho BIGINT NOT NULL,
    url VARCHAR(500) NOT NULL,
    aprovado BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Tabela de Cronograma/Timeline
-- ========================================
CREATE TABLE IF NOT EXISTS cronograma (
    id SERIAL PRIMARY KEY,
    horario TIME NOT NULL,
    evento VARCHAR(255) NOT NULL,
    descricao TEXT,
    local VARCHAR(255),
    ordem INTEGER DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Tabela de Hospedagem (Sugestões)
-- ========================================
CREATE TABLE IF NOT EXISTS hospedagem (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(100),
    endereco VARCHAR(500),
    telefone VARCHAR(20),
    email VARCHAR(200),
    website VARCHAR(500),
    descricao TEXT,
    preco_aproximado VARCHAR(100),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Tabela de Transporte
-- ========================================
CREATE TABLE IF NOT EXISTS transporte (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(100),
    saida_local VARCHAR(255),
    saida_horario TIME,
    destino_local VARCHAR(255),
    destino_horario TIME,
    capacidade INTEGER,
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Tabela de Logs de Atividades
-- ========================================
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    tipo_acao VARCHAR(100) NOT NULL,
    descricao TEXT,
    id_convidado INTEGER REFERENCES convidados(id) ON DELETE SET NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Verificar criação
-- ========================================
SELECT 
    'Tabelas criadas com sucesso!' AS status,
    (SELECT COUNT(*) FROM configuracoes) AS configuracoes_inseridas;
