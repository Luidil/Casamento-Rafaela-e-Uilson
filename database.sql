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
-- Verificar criação
-- ========================================
SELECT 
    'Tabelas criadas com sucesso!' AS status,
    (SELECT COUNT(*) FROM configuracoes) AS configuracoes_inseridas;
