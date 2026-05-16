# 💍 Site de Casamento - Rafaela & Uilson

Um site elegante e responsivo para o casamento de Rafaela e Uilson, com RSVP, galeria de fotos e muito mais!

## 🌐 Acesso

- **Site Principal**: https://casamentorafaelaeuilson.netlify.app
- **Área dos Noivos**: https://casamentorafaelaeuilson.netlify.app/admin.html

## ✨ Funcionalidades

- ✅ Formulário de Confirmação de Presença (RSVP)
- 📸 Galeria de Fotos com Upload
- 🎬 Suporte a Vídeos
- 📧 Envio de Emails de Confirmação
- 📊 Painel Administrativo com Estatísticas
- 📥 Download de Fotos e Exportação CSV
- 🗺️ Mapa com Localização do Restaurante
- ⏳ Contagem Regressiva para o Casamento
- 📱 Design Responsivo

## 🛠️ Tecnologia

- **Frontend**: HTML5, CSS3, JavaScript Vanilla
- **Backend**: Netlify Functions + SQLite
- **Email**: Nodemailer (Gmail)
- **Hospedagem**: Netlify

## 📦 Instalação Local

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev
```

## 🚀 Deploy

O site é automaticamente deployado no Netlify quando você faz push para a branch `main`.

## 📧 Configuração de Email

Para que os emails funcionem, configure as variáveis de ambiente no Netlify:

1. Vá em **Site Settings** → **Build & Deploy** → **Environment**
2. Adicione:
   - `EMAIL_SERVICE`: `gmail`
   - `EMAIL_USER`: seu email Gmail
   - `EMAIL_PASSWORD`: sua App Password do Gmail
   - `EMAIL_FROM`: `Uilson & Rafaela <seu_email@gmail.com>`

## 📝 Estrutura

```
├── index.html              # Página principal
├── admin.html              # Painel administrativo
├── styles.css              # Estilos
├── script.js               # JavaScript principal
├── netlify/
│   └── functions/
│       ├── confirmacao.js  # API de confirmação de presença
│       └── admin-convidados.js  # API de listagem de convidados
└── Fotos/                  # Galeria de fotos pré-carregadas
```

## 🎨 Cores

- Marrom Caramelo: `#8B5E4A`
- Bege Quente: `#C9A27E`
- Nude Areia: `#E6D3C1`
- Bege Claro: `#F5EDE3`
- Creme: `#FAF7F2`

## 📄 Licença

Projeto pessoal para o casamento de Rafaela & Uilson.

---

Feito com ❤️ para um dia especial!
