e-- ========================================
-- Banco de Dados - Site de Casamento
-- Criação das Tabelas
-- ========================================

-- Criar banco de dados (se não existir)
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'CasamentoDB')
BEGIN
    CREATE DATABASE CasamentoDB;
END
GO

USE CasamentoDB;
GO

-- ========================================
-- Tabela de Convidados/Confirmações
-- ========================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Convidados')
BEGIN
    CREATE TABLE Convidados (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Nome NVARCHAR(200) NOT NULL,
        Email NVARCHAR(200) NOT NULL,
        Telefone NVARCHAR(20) NOT NULL,
        Acompanhantes INT DEFAULT 0,
        Presenca BIT NOT NULL,  -- 1 = Sim, 0 = Não
        Mensagem NVARCHAR(MAX) NULL,
        DataConfirmacao DATETIME DEFAULT GETDATE(),
        CriadoEm DATETIME DEFAULT GETDATE(),
        AtualizadoEm DATETIME DEFAULT GETDATE()
    );
    
    PRINT 'Tabela Convidados criada com sucesso!';
END
GO

-- ========================================
-- Tabela de Fotos do Evento
-- ========================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Fotos')
BEGIN
    CREATE TABLE Fotos (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        NomeOriginal NVARCHAR(255) NOT NULL,
        NomeArquivo NVARCHAR(255) NOT NULL,
        TipoArquivo NVARCHAR(50) NOT NULL,
        Tamanho BIGINT NOT NULL,
        Url NVARCHAR(500) NOT NULL,
        IdConvidado INT NULL,  -- Opcional: vincular foto a um convidado
        CriadoEm DATETIME DEFAULT GETDATE(),
        
        FOREIGN KEY (IdConvidado) REFERENCES Convidados(Id) ON DELETE SET NULL
    );
    
    PRINT 'Tabela Fotos criada com sucesso!';
END
GO

-- ========================================
-- Tabela de Configurações do Casamento
-- ========================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Configuracoes')
BEGIN
    CREATE TABLE Configuracoes (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Chave NVARCHAR(100) NOT NULL UNIQUE,
        Valor NVARCHAR(MAX) NOT NULL,
        Descricao NVARCHAR(500) NULL,
        CriadoEm DATETIME DEFAULT GETDATE(),
        AtualizadoEm DATETIME DEFAULT GETDATE()
    );
    
    -- Inserir configurações padrão
    INSERT INTO Configuracoes (Chave, Valor, Descricao) VALUES
    ('NomeNoivo', 'Uilson', 'Nome do noivo'),
    ('NomeNoiva', 'Rafaela', 'Nome da noiva'),
    ('DataCasamento', '2026-06-15', 'Data do casamento'),
    ('HoraCerimonia', '16:00', 'Horário da cerimônia'),
    ('HoraRecepcao', '18:00', 'Horário da recepção'),
    ('LocalCerimonia', 'Igreja Nossa Senhora das Graças', 'Nome do local da cerimônia'),
    ('EnderecoCerimonia', 'Av. Praia de Itapu�, Qd 04 - Lote 06', 'Endereço da cerimônia'),
    ('LocalRecepcao', 'Salão de Eventos Villaggio', 'Nome do local da recepção'),
    ('EnderecoRecepcao', 'Av. Praia de Itapu�, Qd 04 - Lote 06', 'Endereço da recepção'),
    ('DressCodeHomens', 'Traje Social completo (terno e gravata)', 'Dress code para homens'),
    ('DressCodeMulheres', 'Vestido de festa ou traje elegante', 'Dress code para mulheres');
    
    PRINT 'Tabela Configuracoes criada com sucesso!';
END
GO

-- ========================================
-- Índices para performance
-- ========================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Convidados_Email' AND object_id = OBJECT_ID('Convidados'))
BEGIN
    CREATE INDEX IX_Convidados_Email ON Convidados(Email);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Convidados_Presenca' AND object_id = OBJECT_ID('Convidados'))
BEGIN
    CREATE INDEX IX_Convidados_Presenca ON Convidados(Presenca);
END
GO

-- ========================================
-- Procedure: Inserir/Atualizar Convidado
-- ========================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_SalvarConvidado')
BEGIN
    DROP PROCEDURE sp_SalvarConvidado;
END
GO

CREATE PROCEDURE sp_SalvarConvidado
    @Nome NVARCHAR(200),
    @Email NVARCHAR(200),
    @Telefone NVARCHAR(20),
    @Acompanhantes INT = 0,
    @Presenca BIT,
    @Mensagem NVARCHAR(MAX) = NULL,
    @Id INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verifica se o convidado já existe pelo e-mail
    SELECT @Id = Id FROM Convidados WHERE Email = @Email;
    
    IF @Id IS NULL
    BEGIN
        -- Insere novo convidado
        INSERT INTO Convidados (Nome, Email, Telefone, Acompanhantes, Presenca, Mensagem)
        VALUES (@Nome, @Email, @Telefone, @Acompanhantes, @Presenca, @Mensagem);
        
        SET @Id = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        -- Atualiza convidado existente
        UPDATE Convidados
        SET Nome = @Nome,
            Telefone = @Telefone,
            Acompanhantes = @Acompanhantes,
            Presenca = @Presenca,
            Mensagem = @Mensagem,
            AtualizadoEm = GETDATE()
        WHERE Id = @Id;
    END
    
    SELECT @Id AS Id;
END
GO

-- ========================================
-- Procedure: Listar Convidados
-- ========================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_ListarConvidados')
BEGIN
    DROP PROCEDURE sp_ListarConvidados;
END
GO

CREATE PROCEDURE sp_ListarConvidados
    @Presenca BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Presenca IS NULL
    BEGIN
        SELECT * FROM Convidados ORDER BY DataConfirmacao DESC;
    END
    ELSE
    BEGIN
        SELECT * FROM Convidados 
        WHERE Presenca = @Presenca 
        ORDER BY DataConfirmacao DESC;
    END
    
    -- Retorna totais
    SELECT 
        COUNT(*) AS Total,
        SUM(CASE WHEN Presenca = 1 THEN 1 ELSE 0 END) AS Confirmados,
        SUM(CASE WHEN Presenca = 0 THEN 1 ELSE 0 END) AS Recusados,
        SUM(CASE WHEN Presenca = 1 THEN Acompanhantes ELSE 0 END) AS TotalAcompanhantes
    FROM Convidados;
END
GO

-- ========================================
-- Procedure: Inserir Foto
-- ========================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_SalvarFoto')
BEGIN
    DROP PROCEDURE sp_SalvarFoto;
END
GO

CREATE PROCEDURE sp_SalvarFoto
    @NomeOriginal NVARCHAR(255),
    @NomeArquivo NVARCHAR(255),
    @TipoArquivo NVARCHAR(50),
    @Tamanho BIGINT,
    @Url NVARCHAR(500),
    @IdConvidado INT = NULL,
    @Id INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Fotos (NomeOriginal, NomeArquivo, TipoArquivo, Tamanho, Url, IdConvidado)
    VALUES (@NomeOriginal, @NomeArquivo, @TipoArquivo, @Tamanho, @Url, @IdConvidado);
    
    SET @Id = SCOPE_IDENTITY();
    
    SELECT @Id AS Id;
END
GO

-- ========================================
-- Procedure: Listar Fotos
-- ========================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_ListarFotos')
BEGIN
    DROP PROCEDURE sp_ListarFotos;
END
GO

CREATE PROCEDURE sp_ListarFotos
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT f.*, c.Nome AS NomeConvidado
    FROM Fotos f
    LEFT JOIN Convidados c ON f.IdConvidado = c.Id
    ORDER BY f.CriadoEm DESC;
END
GO

-- ========================================
-- Verificar criação das tabelas
-- ========================================
SELECT 
    t.name AS Tabela,
    c.name AS Coluna,
    ty.name AS Tipo,
    c.max_length AS TamanhoMax
FROM sys.tables t
INNER JOIN sys.columns c ON t.object_id = c.object_id
INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
WHERE t.name IN ('Convidados', 'Fotos', 'Configuracoes')
ORDER BY t.name, c.column_id;
GO

PRINT '========================================';
PRINT 'Banco de dados configurado com sucesso!';
PRINT 'Tabelas: Convidados, Fotos, Configuracoes';
PRINT 'Procedures: sp_SalvarConvidado, sp_ListarConvidados, sp_SalvarFoto, sp_ListarFotos';
PRINT '========================================';
GO
