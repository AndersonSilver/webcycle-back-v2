# 🚀 Como Instalar o ngrok no Windows

## 📋 Opção 1: Instalação via Chocolatey (Mais Fácil)

Se você tem o Chocolatey instalado:

```powershell
choco install ngrok
```

## 📋 Opção 2: Download Manual (Recomendado)

### Passo 1: Baixar o ngrok

1. Acesse: **https://ngrok.com/download**
2. Clique em **"Download for Windows"**
3. Baixe o arquivo ZIP

### Passo 2: Extrair e Instalar

1. Extraia o arquivo ZIP baixado
2. Você terá um arquivo `ngrok.exe`
3. **Opção A - Adicionar ao PATH (Recomendado):**
   - Copie o `ngrok.exe` para uma pasta permanente (ex: `C:\ngrok\`)
   - Adicione essa pasta ao PATH do Windows:
     - Pressione `Win + R`
     - Digite: `sysdm.cpl` e pressione Enter
     - Vá na aba "Avançado" > "Variáveis de Ambiente"
     - Em "Variáveis do sistema", encontre "Path" e clique em "Editar"
     - Clique em "Novo" e adicione: `C:\ngrok\` (ou o caminho onde você colocou o ngrok.exe)
     - Clique em "OK" em todas as janelas
     - **Reinicie o terminal/PowerShell**

   **Opção B - Usar direto da pasta:**
   - Coloque o `ngrok.exe` em uma pasta (ex: `C:\ngrok\`)
   - Use o caminho completo: `C:\ngrok\ngrok.exe http 3001`

### Passo 3: Verificar Instalação

Abra um **novo** PowerShell ou CMD e digite:

```powershell
ngrok version
```

Se mostrar a versão, está instalado corretamente!

## 📋 Opção 3: Via npm (Se você tem Node.js)

```powershell
npm install -g ngrok
```

## 🚀 Como Usar

### 1. Inicie seu servidor backend

```powershell
npm run dev
```

O servidor deve estar rodando na porta 3001.

### 2. Em outro terminal, execute o ngrok

```powershell
ngrok http 3001
```

### 3. Você verá algo assim:

```
ngrok                                                                               

Session Status                online
Account                       seu-email@exemplo.com (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3001

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### 4. Copie a URL HTTPS

Copie a URL que aparece em **"Forwarding"**:
```
https://abc123def456.ngrok-free.app
```

### 5. Use no Mercado Pago

No painel do Mercado Pago, configure o webhook com:
```
https://abc123def456.ngrok-free.app/api/webhooks/mercadopago
```

## ⚠️ Importante

- **Mantenha o ngrok rodando** enquanto estiver testando
- Se fechar o terminal do ngrok, a URL muda na próxima vez
- A URL gratuita muda a cada execução (a menos que tenha conta paga)
- O ngrok precisa estar rodando para o webhook funcionar

## 🔧 Troubleshooting

### "ngrok não é reconhecido"
- Certifique-se de que adicionou ao PATH e **reiniciou o terminal**
- Ou use o caminho completo: `C:\caminho\para\ngrok.exe http 3001`

### "Porta 3001 já está em uso"
- Verifique se outro processo está usando a porta 3001
- Ou use outra porta: `ngrok http 3002` (e ajuste seu servidor)

### "ERR_NGROK_334 - endpoint já está online"

Este erro significa que **já existe uma instância do ngrok rodando** com essa URL.

**Solução 1: Parar a instância existente (Recomendado)**

1. **Encontre o processo do ngrok:**
   ```powershell
   # No PowerShell, liste processos do ngrok
   Get-Process ngrok -ErrorAction SilentlyContinue
   ```

2. **Pare o processo:**
   ```powershell
   # Pare todos os processos ngrok
   Stop-Process -Name ngrok -Force
   ```

3. **Ou feche o terminal onde o ngrok está rodando**

4. **Inicie novamente:**
   ```powershell
   ngrok http 3001
   ```

**Solução 2: Usar pooling (para múltiplos endpoints)**

Se você realmente precisa rodar múltiplos endpoints ao mesmo tempo:

```powershell
ngrok http 3001 --pooling-enabled
```

**Solução 3: Usar a instância que já está rodando**

Se você já tem o ngrok rodando em outro terminal, **use essa URL**! Não precisa iniciar outro.

- Verifique qual URL está sendo usada na instância existente
- Use essa URL no webhook do Mercado Pago

### "Erro de autenticação" ou "authtoken não parece válido"

**O token que você tem não é um authtoken válido.** Siga estes passos:

1. **Acesse o Dashboard do ngrok:**
   - Vá para: **https://dashboard.ngrok.com/get-started/your-authtoken**
   - Ou: **https://dashboard.ngrok.com/** > "Your Authtoken"

2. **Copie o Authtoken correto:**
   - O authtoken tem um formato específico, geralmente algo como:
     - `2abc123def456ghi789jkl012mno345pqr678stu901vwx234yz_5ABCDEFGHIJKLMNOPQRSTUVWXYZ123456`
   - É uma string **muito longa** (geralmente 40+ caracteres)
   - **NÃO** são códigos curtos como `QHWFWXH82U`

3. **Configure o authtoken correto:**
   ```powershell
   ngrok config add-authtoken SEU_AUTHTOKEN_LONGO_AQUI
   ```

4. **Se você ainda não tem conta no ngrok:**
   - Acesse: https://dashboard.ngrok.com/signup
   - Crie uma conta gratuita
   - Depois de criar, você verá seu authtoken na página inicial

**⚠️ Importante:** 
- Os códigos curtos que você listou **NÃO são authtokens**
- O authtoken é uma string muito longa que você encontra no dashboard
- Você precisa estar logado no dashboard do ngrok para ver o authtoken

## 📚 Links Úteis

- **Download**: https://ngrok.com/download
- **Documentação**: https://ngrok.com/docs
- **Dashboard**: https://dashboard.ngrok.com/

---

**Dica:** Se você vai usar ngrok frequentemente, considere criar uma conta gratuita no ngrok para ter URLs mais estáveis e outras funcionalidades.

