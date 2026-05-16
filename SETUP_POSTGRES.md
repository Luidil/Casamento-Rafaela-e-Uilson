# Setup PostgreSQL para o Site de Casamento

## Passo 1: Abrir o pgAdmin

1. Abra o **pgAdmin** (geralmente em `http://localhost:5050`)
2. Faça login com suas credenciais

## Passo 2: Executar o Script de Setup

1. No pgAdmin, clique em **"Tools"** → **"Query Tool"**
2. Copie todo o conteúdo do arquivo `setup-postgres.sql`
3. Cole no Query Tool
4. Clique em **"Execute"** (ou pressione F5)

## Passo 3: Verificar se Funcionou

Você deve ver a mensagem: **"Setup concluído com sucesso!"**

## Passo 4: Iniciar o Servidor

```bash
node server.js
```

Você deve ver:
```
✅ Conectado ao PostgreSQL
🎉 Servidor do Site de Casamento
   Acesse: http://localhost:5500
```

## Troubleshooting

### Erro: "autenticação do tipo senha falhou"
- Verifique se o usuário `casamento_user` foi criado
- Verifique se a senha é `casamento123`
- Verifique o arquivo `.env` tem as credenciais corretas

### Erro: "banco de dados não existe"
- Execute o script `setup-postgres.sql` novamente
- Certifique-se de que o banco `casamento_db` foi criado

### Erro: "Porta 5500 já está em uso"
```bash
# Matar processo anterior
Get-Process -Name node | Stop-Process -Force

# Ou usar outra porta no server.js
```

## Credenciais Padrão

- **Host**: localhost
- **Porta**: 5432
- **Banco**: casamento_db
- **Usuário**: casamento_user
- **Senha**: casamento123

Você pode alterar essas credenciais no arquivo `.env`
