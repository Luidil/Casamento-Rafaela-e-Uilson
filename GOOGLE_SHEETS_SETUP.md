# Configuração Google Sheets + Apps Script

## Passo 1: Criar o Apps Script

1. Abra sua Google Sheet: https://docs.google.com/spreadsheets/d/1RTxxXaK4P0EswifIkob5YcdX6PzVAOK7EncuN_8GbPM/edit
2. Clique em **Extensões** → **Apps Script**
3. Delete o código padrão e cole este código:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  
  // Verificar se email já existe
  const range = sheet.getRange('C:C');
  const values = range.getValues();
  let rowToUpdate = -1;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === data.email) {
      rowToUpdate = i + 1;
      break;
    }
  }
  
  if (rowToUpdate > 0) {
    // Atualizar linha existente
    sheet.getRange(rowToUpdate, 1).setValue(Date.now());
    sheet.getRange(rowToUpdate, 2).setValue(data.nome);
    sheet.getRange(rowToUpdate, 3).setValue(data.email);
    sheet.getRange(rowToUpdate, 4).setValue(data.presenca);
    sheet.getRange(rowToUpdate, 5).setValue(data.mensagem);
    sheet.getRange(rowToUpdate, 6).setValue(new Date().toISOString());
  } else {
    // Adicionar nova linha
    sheet.appendRow([
      Date.now(),
      data.nome,
      data.email,
      data.presenca,
      data.mensagem,
      new Date().toISOString()
    ]);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Dados salvos com sucesso'
  })).setMimeType(ContentService.MimeType.JSON);
}
```

4. Clique em **Deploy** → **New deployment**
5. Selecione **Type** → **Web app**
6. Configure:
   - **Execute as**: Sua conta Google
   - **Who has access**: Anyone
7. Clique em **Deploy**
8. Copie a URL do deployment (vai parecer com: `https://script.google.com/macros/s/AKfycbx.../usercontent`)

## Passo 2: Adicionar a URL ao Netlify

1. Vá em https://app.netlify.com/sites/casamentorafaelaeuilson/settings/deploys
2. Clique em **Environment**
3. Adicione uma nova variável:
   - **Key**: `GOOGLE_APPS_SCRIPT_URL`
   - **Value**: Cole a URL que você copiou

## Passo 3: Pronto!

Agora os dados vão ser salvos automaticamente na Google Sheet!
