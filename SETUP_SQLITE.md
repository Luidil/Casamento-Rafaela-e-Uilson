# Setup SQLite para o Site de Casamento

## ✅ Configuração Concluída!

O servidor está agora configurado para usar **SQLite** com o banco de dados `casamento.db`.

## Passo 1: Executar o Script SQL (Opcional)

Se você quer criar todas as tabelas de uma vez:

1. Abra o **DBeaver**
2. Clique com botão direito em `casamento.db` → **SQL Editor** → **Open SQL Script**
3. Copie todo o conteúdo do arquivo `setup-postgres.sql` (renomeado para SQLite)
4. Cole no editor SQL
5. Clique em **Execute** (ou pressione Ctrl+Enter)

## Passo 2: Iniciar o Servidor

```bash
node server.js
```

Você deve ver:
```
✅ Conectado ao SQLite (casamento.db)
✅ Email configurado com sucesso
🎉 Servidor do Site de Casamento
   Acesse: http://localhost:5500
```

## Passo 3: Testar o RSVP

1. Acesse `http://localhost:5500`
2. Preencha o formulário de confirmação
3. Clique em "Confirmar Presença"
4. Você deve ver a mensagem: **"Confirmação enviada com sucesso!"**

## Verificar os Dados no DBeaver

1. No DBeaver, clique em `casamento.db` → **Tabelas** → **convidados**
2. Clique em **Data** para ver os registros salvos

## Tabelas Criadas

- **convidados** - Confirmações de presença
- **fotos** - Fotos do evento
- **presentes** - Lista de presentes
- **musicas** - Músicas solicitadas
- **comentarios** - Comentários dos convidados
- **galeria_fotos** - Galerias de fotos
- **fotos_galeria** - Fotos dentro das galerias
- **fotos_convidados** - Fotos enviadas pelos convidados
- **cronograma** - Timeline do evento
- **hospedagem** - Sugestões de hospedagem
- **transporte** - Informações de transporte
- **logs** - Registro de atividades
- **configuracoes** - Configurações do casamento

## Troubleshooting

### Erro: "Banco de dados não existe"
- O arquivo `casamento.db` será criado automaticamente na primeira execução

### Erro: "Tabela não existe"
- Execute o script `setup-postgres.sql` no DBeaver para criar todas as tabelas

### Erro: "Porta 5500 já está em uso"
```bash
# Matar processo anterior
Get-Process -Name node | Stop-Process -Force
```

## Credenciais de Email

As credenciais estão no arquivo `.env`:
- **EMAIL_SERVICE**: gmail
- **EMAIL_USER**: rafaela.turma5@gmail.com
- **EMAIL_PASSWORD**: oqkecnbzaxbtapnm

Quando um convidado confirma presença, um email é enviado automaticamente!

## Próximos Passos

1. ✅ Banco de dados configurado
2. ✅ Servidor rodando
3. ✅ RSVP funcionando
4. 📸 Adicionar mais funcionalidades (fotos, presentes, etc.)
