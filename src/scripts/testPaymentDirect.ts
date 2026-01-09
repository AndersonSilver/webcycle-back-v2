/**
 * Script para testar pagamento diretamente com a API do Mercado Pago
 * Use este script para verificar se o problema está no token ou na aplicação
 */

import dotenv from 'dotenv';
dotenv.config();

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

async function testPayment() {
  if (!MERCADOPAGO_ACCESS_TOKEN) {
    console.error('❌ MERCADOPAGO_ACCESS_TOKEN não configurado!');
    process.exit(1);
  }

  console.log('🔍 Testando pagamento diretamente com API do Mercado Pago...');
  console.log('🔑 Access Token:', MERCADOPAGO_ACCESS_TOKEN.substring(0, 20) + '...');

  // IMPORTANTE: Você precisa gerar um token válido primeiro!
  // Use o formulário do frontend para gerar um token e cole aqui
  const TEST_TOKEN = 'COLE_AQUI_O_TOKEN_GERADO_NO_FRONTEND';

  if (TEST_TOKEN === 'COLE_AQUI_O_TOKEN_GERADO_NO_FRONTEND') {
    console.error('❌ Por favor, gere um token no frontend e cole aqui!');
    console.log('📝 Passos:');
    console.log('1. Abra o frontend e preencha o formulário de cartão');
    console.log('2. Clique em "Pagar"');
    console.log('3. No console do navegador, copie o token completo');
    console.log('4. Cole o token na variável TEST_TOKEN acima');
    process.exit(1);
  }

  const payload = {
    transaction_amount: 0.01, // Valor mínimo para teste
    token: TEST_TOKEN,
    description: 'Teste de pagamento',
    installments: 1,
    payer: {
      email: 'test@test.com',
      first_name: 'Test',
      last_name: 'User',
    },
  };

  console.log('\n📦 Payload sendo enviado:');
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    console.log('\n📋 Resposta do Mercado Pago:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Data:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('\n✅ Pagamento processado com sucesso!');
      console.log('Payment ID:', responseData.id);
      console.log('Status:', responseData.status);
    } else {
      console.log('\n❌ Erro no pagamento:');
      if (responseData.cause && Array.isArray(responseData.cause)) {
        responseData.cause.forEach((cause: any, index: number) => {
          console.log(`Causa ${index + 1}:`, {
            code: cause.code,
            description: cause.description,
            data: cause.data,
          });
        });
      }
    }
  } catch (error: any) {
    console.error('\n❌ Erro na requisição:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPayment();

