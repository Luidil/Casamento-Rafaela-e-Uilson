# Site de Casamento - Rafaela & Uilson

Aplicacao simples em Node.js para confirmacao de presenca, upload de fotos e geracao de QR Code em PDF.

## Requisitos

- Node.js 18+
- PostgreSQL

## Configuracao

1. Instale as dependencias:

```bash
npm install
```

2. Copie o arquivo de exemplo:

```bash
copy .env.example .env
```

3. Ajuste as credenciais do banco no `.env`:

```env
DB_HOST=localhost
DB_PORT=5433
DB_NAME=casamento_db
DB_USER=casamento_user
DB_PASSWORD=casamento123
```

4. Execute o script SQL:

```sql
-- no banco configurado acima
\i database.sql
```

## Executar

```bash
npm start
```

Aplicacao:

- Site principal: `http://localhost:5500`
- Area dos noivos: `http://localhost:5500/admin.html`

## Estrutura

- `index.html`: pagina principal
- `admin.html`: painel simples dos noivos
- `styles.css`: estilos
- `script.js`: comportamento do frontend
- `server.js`: servidor HTTP e APIs
- `database.sql`: criacao das tabelas PostgreSQL
- `uploads/`: arquivos enviados

## Endpoints

- `POST /api/confirmacao`
- `GET /api/confirmacoes`
- `GET /api/admin/convidados`
- `POST /api/upload`
- `GET /api/qrcode-pdf?target=/%23fotos`
