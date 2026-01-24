# Configuração do Sistema de Rastreamento

## API Brasil Aberto

O sistema utiliza a API do Brasil Aberto para buscar informações de rastreamento de encomendas dos Correios.

### Configuração da API Key

1. **Obtenha sua API Key** (se necessário)
   - Acesse a documentação em: https://brasilaberto.com/docs/swagger
   - Verifique se a API requer autenticação
   - Se necessário, gere ou copie sua API Key

2. **Configure a variável de ambiente**
   
   Adicione no arquivo `.env` na raiz do projeto `TB-PSICO-BACK`:

   ```env
   BRASIL_ABERTO_API_KEY=sua_api_key_aqui
   BRASIL_ABERTO_API_URL=https://brasilaberto.com/api
   ```

   **Nota:** 
   - A `BRASIL_ABERTO_API_KEY` é opcional se a API não requer autenticação
   - A `BRASIL_ABERTO_API_URL` é opcional. Se não for informada, será usado o valor padrão `https://brasilaberto.com/api`

3. **Reinicie o servidor**
   
   Após adicionar a variável, reinicie o servidor backend para que as mudanças tenham efeito.

### Funcionalidades Implementadas

#### ✅ Busca Automática
- Quando um código de rastreamento é adicionado, o sistema busca automaticamente os dados na API Brasil Aberto
- Retry automático com backoff exponencial (até 3 tentativas)
- Timeout de 15 segundos por requisição
- Endpoint: `GET /v1/postal-orders/{code}`

#### ✅ Tratamento de Erros
- Validação de API key (se configurada) antes de fazer requisições
- Tratamento específico para diferentes códigos HTTP:
  - `404`: Código não encontrado
  - `401/403`: Erro de autenticação (se API key fornecida)
  - `429`: Rate limit (aguarda e tenta novamente)
  - `5xx`: Erros do servidor (retry automático)

#### ✅ Atualização de Status
- Mapeamento automático de status da API para status interno
- Atualização de data de entrega quando o produto é entregue
- Cálculo de data estimada de entrega

#### ✅ Histórico de Eventos
- Sincronização automática de eventos de rastreamento
- Evita duplicação de eventos
- Ordenação por data/hora

#### ✅ Notificações por Email
- Envio automático de email quando o status muda
- Inclui histórico de rastreamento no email
- Link direto para a página de compras

### Como Usar

#### Para o Admin:

1. **Adicionar código de rastreamento:**
   - Acesse "Gerenciar Vendas" no painel admin
   - Clique em "Adicionar Rastreamento" no produto físico
   - Preencha o código de rastreamento e transportadora (opcional)
   - Opcionalmente, anexe o comprovante de envio
   - Clique em "Salvar Rastreamento"

2. **Atualizar manualmente:**
   - Clique no botão "Atualizar" ao lado do código de rastreamento
   - O sistema buscará os dados mais recentes da API

#### Para o Cliente:

- O cliente pode ver o rastreamento na página "Minhas Compras"
- O histórico é atualizado automaticamente
- Recebe email quando há atualizações importantes

### Estrutura da API

A API do Brasil Aberto espera:
- **URL:** `https://brasilaberto.com/api/v1/postal-orders/{code}`
- **Método:** GET
- **Parâmetros:**
  - `code`: Código de rastreamento (path parameter)
- **Headers:** (opcional)
  - `Authorization: Bearer {api_key}` (se autenticação for necessária)

**Exemplo de resposta:**
```json
{
  "meta": {
    "currentPage": 1,
    "itemsPerPage": 1,
    "totalOfItems": 1,
    "totalOfPages": 1
  },
  "result": [
    {
      "objectCode": "BR123456789BR",
      "events": [
        {
          "code": "BDR",
          "description": "Objeto entregue ao destinatário",
          "creation": "2024-01-15T10:30:00Z",
          "type": "01",
          "unit": {
            "city": "São Paulo",
            "state": "SP"
          }
        }
      ],
      "modality": "PAC",
      "postalType": {
        "category": "PAC",
        "description": "PAC",
        "initials": "PAC"
      }
    }
  ]
}
```

### Troubleshooting

#### API Key não configurada (se necessário)
- **Sintoma:** Logs mostram "⚠️ BRASIL_ABERTO_API_KEY não configurada"
- **Solução:** Se a API requer autenticação, adicione a variável `BRASIL_ABERTO_API_KEY` no arquivo `.env`

#### Erro de autenticação
- **Sintoma:** Erro HTTP 401 ou 403
- **Solução:** Verifique se a API key está correta e ativa (se autenticação for necessária)

#### Código não encontrado
- **Sintoma:** Erro HTTP 404 ou resposta vazia
- **Solução:** Verifique se o código de rastreamento está correto e se já foi postado

#### Rate Limit
- **Sintoma:** Erro HTTP 429
- **Solução:** O sistema aguarda automaticamente e tenta novamente. Evite muitas atualizações simultâneas.

### Logs

O sistema gera logs detalhados para facilitar o debug:
- ✅ Sucesso: `✅ Tracking atualizado com sucesso`
- ⚠️ Avisos: `⚠️ Código de rastreamento não encontrado`
- ❌ Erros: `❌ Erro ao buscar tracking`
- 🔄 Retry: `🔄 Tentando novamente em Xms...`

