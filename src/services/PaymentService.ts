import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { env } from '../config/env.config';
import { PaymentMethod } from '../entities/Purchase.entity';

// Validar Access Token
if (!env.mercadopagoAccessToken || env.mercadopagoAccessToken.trim() === '') {
  console.warn('⚠️ MERCADOPAGO_ACCESS_TOKEN não está configurado!');
}

const client = new MercadoPagoConfig({
  accessToken: env.mercadopagoAccessToken,
  options: { timeout: 10000 }, // Aumentado timeout para 10s
});

const payment = new Payment(client);
const preference = new Preference(client);

export interface PaymentData {
  amount: number;
  description: string;
  purchaseId: string;
  paymentMethod: PaymentMethod;
  payerEmail: string;
  payerName: string;
  // Informações adicionais do comprador (opcionais, mas melhoram aprovação)
  payerAddress?: {
    street_name?: string;
    street_number?: number;
    zip_code?: string;
  };
  payerPhone?: {
    area_code?: string;
    number?: string;
  };
  payerIdentification?: {
    type?: string; // CPF, CNPJ
    number?: string;
  };
  // Informações dos cursos para melhorar detalhamento
  courses?: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    quantity?: number;
  }>;
}

export interface PaymentResult {
  id: string;
  status: string;
  pixCode?: string;
  boletoUrl?: string;
  paymentLink?: string;
  statusDetail?: string;
  threeDSInfo?: any;
}

export interface ProcessCardPaymentData {
  amount: number;
  description: string;
  purchaseId: string;
  payerEmail: string;
  payerName: string;
  token: string; // Token gerado pelo Mercado Pago JS no frontend
  installments?: number;
  paymentMethodId?: string; // visa, mastercard, etc.
  identificationType?: string;
  identificationNumber?: string;
}

export class PaymentService {
  async createPayment(data: PaymentData): Promise<PaymentResult> {
    try {
      if (data.paymentMethod === PaymentMethod.PIX) {
        return await this.createPixPayment(data);
      } else if (data.paymentMethod === PaymentMethod.BOLETO) {
        return await this.createBoletoPayment(data);
      } else {
        return await this.createCreditCardPayment(data);
      }
    } catch (error: any) {
      throw new Error(`Erro ao criar pagamento: ${error.message}`);
    }
  }

  private async createPixPayment(data: PaymentData): Promise<PaymentResult> {
    const paymentData = {
      transaction_amount: data.amount,
      description: data.description,
      payment_method_id: 'pix',
      payer: {
        email: data.payerEmail,
        first_name: data.payerName.split(' ')[0],
        last_name: data.payerName.split(' ').slice(1).join(' ') || '',
      },
      metadata: {
        purchase_id: data.purchaseId,
      },
    };

    const result = await payment.create({ body: paymentData });

    return {
      id: result.id?.toString() || '',
      status: result.status || 'pending',
      pixCode: result.point_of_interaction?.transaction_data?.qr_code || undefined,
    };
  }

  private async createBoletoPayment(data: PaymentData): Promise<PaymentResult> {
    const paymentData = {
      transaction_amount: data.amount,
      description: data.description,
      payment_method_id: 'bolbradesco',
      payer: {
        email: data.payerEmail,
        first_name: data.payerName.split(' ')[0],
        last_name: data.payerName.split(' ').slice(1).join(' ') || '',
      },
      metadata: {
        purchase_id: data.purchaseId,
      },
    };

    const result = await payment.create({ body: paymentData });

    return {
      id: result.id?.toString() || '',
      status: result.status || 'pending',
      boletoUrl: result.transaction_details?.external_resource_url || undefined,
    };
  }

  private async createCreditCardPayment(data: PaymentData): Promise<PaymentResult> {
    // Garante que frontendUrl está configurado e válido
    const frontendUrl = env.frontendUrl || 'http://localhost:3000';
    
    // Valida se a URL é válida
    if (!frontendUrl || frontendUrl.trim() === '') {
      throw new Error('FRONTEND_URL não está configurado no arquivo .env');
    }

    // ✅ Validação do valor do pagamento
    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error(`Valor inválido para pagamento: ${data.amount}. O valor deve ser um número positivo.`);
    }
    
    // Garantir que o valor tenha no máximo 2 casas decimais
    const unitPrice = Number(amount.toFixed(2));
    if (unitPrice <= 0) {
      throw new Error(`Valor do pagamento deve ser maior que zero. Valor recebido: ${amount}`);
    }

    // ✅ CHECKOUT PRO: Sempre usar preferência com back_urls
    // Para localhost, usar query params para identificar o retorno no frontend
    const isLocalhost = frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1');
    
    // ✅ CHECKOUT PRO: Configuração completa da preferência
    // Validar email do pagador (obrigatório e deve ser válido)
    const payerEmail = (data.payerEmail || '').trim();
    if (!payerEmail || !payerEmail.includes('@') || payerEmail.length < 5) {
      throw new Error(`Email do pagador inválido: "${payerEmail}". Email é obrigatório e deve ser válido.`);
    }

    // Validar nome do pagador (obrigatório, mínimo 2 caracteres)
    const payerName = (data.payerName || '').trim();
    if (!payerName || payerName.length < 2) {
      throw new Error(`Nome do pagador inválido: "${payerName}". Nome é obrigatório e deve ter pelo menos 2 caracteres.`);
    }

    // Separar nome e sobrenome do pagador
    const nameParts = payerName.split(' ').filter(part => part.length > 0);
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || firstName;

    // Mapear categoria para category_id do Mercado Pago
    // Categorias comuns: art, electronics, fashion, food, home, services, etc.
    const mapCategoryToMercadoPago = (category: string): string => {
      const categoryMap: Record<string, string> = {
        'psicologia': 'services',
        'saude': 'services',
        'educacao': 'services',
        'curso': 'services',
        'online': 'services',
        'e-learning': 'services',
      };
      return categoryMap[category.toLowerCase()] || 'services';
    };

    // Construir items da preferência
    // Se temos informações dos cursos, criar um item por curso
    // Caso contrário, criar um item único
    const items = data.courses && data.courses.length > 0
      ? data.courses.map((course) => ({
          id: course.id, // ✅ Código do item (4 pontos)
          title: (course.title || 'Curso').substring(0, 127).trim() || 'Curso', // ✅ Nome do item (4 pontos)
          description: (course.description || 'Compra de curso').substring(0, 127).trim() || 'Compra de curso', // ✅ Descrição do item (3 pontos)
          quantity: course.quantity || 1, // ✅ Quantidade do produto (5 pontos)
          unit_price: parseFloat(Number(course.price).toFixed(2)), // ✅ Preço do item (6 pontos)
          category_id: mapCategoryToMercadoPago(course.category), // ✅ Categoria do item (4 pontos)
          currency_id: 'BRL',
        }))
      : [{
          id: data.purchaseId,
          title: (data.description || 'Curso').substring(0, 127).trim() || 'Curso',
          description: (data.description || 'Compra de curso').substring(0, 127).trim() || 'Compra de curso',
          quantity: 1,
          unit_price: parseFloat(unitPrice.toFixed(2)),
          category_id: 'services', // Categoria padrão
          currency_id: 'BRL',
        }];

    // Construir objeto payer com informações adicionais
    const payer: any = {
      email: payerEmail,
      name: firstName,
      surname: lastName, // ✅ Sobrenome do comprador (5 pontos) - já implementado
    };

    // Adicionar informações opcionais do comprador (boas práticas)
    if (data.payerAddress) {
      payer.address = {
        street_name: data.payerAddress.street_name,
        street_number: data.payerAddress.street_number,
        zip_code: data.payerAddress.zip_code,
      };
    }

    if (data.payerPhone) {
      payer.phone = {
        area_code: data.payerPhone.area_code,
        number: data.payerPhone.number,
      };
    }

    if (data.payerIdentification) {
      payer.identification = {
        type: data.payerIdentification.type || 'CPF',
        number: data.payerIdentification.number,
      };
    }

    const preferenceData: any = {
      items,
      payer,
      metadata: {
        purchase_id: data.purchaseId,
      },
      // ✅ Campos adicionais para habilitar botão "Pagar" no Checkout Pro
      statement_descriptor: 'WEBCYCLE', // Descrição que aparece na fatura (máx 22 caracteres)
      external_reference: data.purchaseId, // ✅ Referência externa (17 pontos) - já implementado
      // Configurações de pagamento
      payment_methods: {
        excluded_payment_types: [], // Não excluir nenhum tipo de pagamento
        excluded_payment_methods: [], // Não excluir nenhum método de pagamento
        installments: 12, // Máximo de parcelas permitidas
        default_installments: 1, // Parcela padrão (importante para habilitar botão)
      },
      // ✅ Configurações adicionais para garantir que o botão habilite
      binary_mode: false, // Permitir status pendente (não apenas aprovado/rejeitado)
      expires: false, // Não expirar a preferência
      date_created: new Date().toISOString(), // Data de criação (pode ser necessário para habilitar botão)
      // ✅ IMPORTANTE: Não incluir campos relacionados a tokens no Checkout Pro
      // O Checkout Pro gera seus próprios tokens quando o usuário preenche o cartão
    };

    // ✅ Back URLs melhoradas - usar rotas específicas (4 pontos)
    // O Mercado Pago redireciona para essas URLs após o pagamento
    // IMPORTANTE: URLs devem ser HTTPS em produção e acessíveis publicamente
    preferenceData.back_urls = {
      success: `${frontendUrl}/purchase/success?pref_id={preference_id}`,
      failure: `${frontendUrl}/purchase/failure?pref_id={preference_id}`,
      pending: `${frontendUrl}/purchase/pending?pref_id={preference_id}`,
    };
    
    // Garantir que back_urls está sendo enviado (obrigatório para pontuação)
    console.log('✅ Back URLs configuradas:', preferenceData.back_urls);
    
    // Auto return apenas se não for localhost (Mercado Pago pode não aceitar localhost)
    if (!isLocalhost) {
      preferenceData.auto_return = 'approved';
    } else {
      console.warn('⚠️ Usando localhost - auto_return desabilitado. O frontend verificará o status via query params ou webhook.');
    }

    // Configurar notification_url (webhook) se estiver configurado
    // Em produção, configure MERCADOPAGO_WEBHOOK_URL no .env com sua URL pública HTTPS
    if (env.mercadopagoWebhookUrl) {
      preferenceData.notification_url = env.mercadopagoWebhookUrl;
      console.log('🔔 Webhook URL configurado na preferência:', env.mercadopagoWebhookUrl);
    } else {
      console.warn('⚠️ MERCADOPAGO_WEBHOOK_URL não configurado. Configure no .env ou no painel do Mercado Pago.');
      console.warn('⚠️ Sem webhook configurado, você precisará verificar o status do pagamento manualmente ou via back_urls.');
    }

    // Calcular total dos itens
    const totalAmount = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    // Log da preferência sendo criada (para debug)
    console.log('📦 Criando preferência Checkout Pro (Mercado Pago Checklist):', {
      items: preferenceData.items.map((item: any) => ({
        id: item.id, // ✅ Código do item
        title: item.title, // ✅ Nome do item
        description: item.description, // ✅ Descrição do item
        unit_price: item.unit_price, // ✅ Preço do item
        quantity: item.quantity, // ✅ Quantidade do produto
        category_id: item.category_id, // ✅ Categoria do item
        currency_id: item.currency_id,
      })),
      payer: {
        email: preferenceData.payer.email,
        name: preferenceData.payer.name,
        surname: preferenceData.payer.surname, // ✅ Sobrenome do comprador
        hasAddress: !!preferenceData.payer.address,
        hasPhone: !!preferenceData.payer.phone,
        hasIdentification: !!preferenceData.payer.identification,
      },
      external_reference: preferenceData.external_reference, // ✅ Referência externa
      totalAmount,
      hasBackUrls: !!preferenceData.back_urls, // ✅ Back URLs
      backUrls: preferenceData.back_urls,
      hasPaymentMethods: !!preferenceData.payment_methods,
      default_installments: preferenceData.payment_methods?.default_installments,
      binary_mode: preferenceData.binary_mode,
      expires: preferenceData.expires,
    });

    const result = await preference.create({ body: preferenceData });

    // Detectar se está em produção ou sandbox baseado no Access Token
    const isProduction = env.mercadopagoAccessToken.startsWith('APP_USR-');
    const isSandbox = env.mercadopagoAccessToken.startsWith('TEST-');

    console.log('✅ Preferência criada:', {
      id: result.id,
      init_point: result.init_point?.substring(0, 50) + '...',
      sandbox_init_point: result.sandbox_init_point?.substring(0, 50) + '...',
      environment: isProduction ? 'PRODUÇÃO' : isSandbox ? 'SANDBOX' : 'DESCONHECIDO',
    });

    // Usar init_point em produção, sandbox_init_point em sandbox
    const paymentLink = isProduction 
      ? result.init_point 
      : (result.sandbox_init_point || result.init_point);

    return {
      id: result.id || '',
      status: 'pending',
      paymentLink: paymentLink || undefined,
    };
  }

  async getPaymentStatus(paymentId: string): Promise<string> {
    try {
      // Verifica se é um pref_id (preferência) ou payment_id (pagamento)
      // Pref_id geralmente tem formato: "140335646-21f49b23-dbad-4e56-b6b6-95d4f349c918"
      // Payment_id geralmente é apenas numérico ou UUID simples
      const isPreferenceId = paymentId.includes('-') && paymentId.split('-').length > 2;
      
      if (isPreferenceId) {
        // É uma preferência (Checkout Pro) - busca pagamentos relacionados
        // Para preferências, o status só é conhecido após o pagamento ser processado
        // O webhook do Mercado Pago enviará o payment_id real
        console.warn(`⚠️ Tentativa de consultar status usando pref_id: ${paymentId}. Use o webhook ou aguarde o processamento do pagamento.`);
        return 'pending';
      } else {
        // É um payment_id - busca o pagamento diretamente
        const result = await payment.get({ id: paymentId });
        return result.status || 'pending';
      }
    } catch (error: any) {
      // Se o erro for porque o ID não existe ou é inválido, retorna pending
      if (error.message?.includes('not found') || error.message?.includes('no encontrado')) {
        console.warn(`⚠️ Pagamento não encontrado: ${paymentId}. Status: pending`);
        return 'pending';
      }
      throw new Error(`Erro ao consultar pagamento: ${error.message}`);
    }
  }

  async getPreferenceStatus(prefId: string): Promise<string> {
    try {
      // Preferências não têm status direto, mas podemos verificar se há pagamentos associados
      // O status real só vem via webhook após o pagamento ser processado
      await preference.get({ preferenceId: prefId });
      return 'pending';
    } catch (error: any) {
      throw new Error(`Erro ao consultar preferência: ${error.message}`);
    }
  }

  async getPaymentDetails(paymentId: string): Promise<any> {
    try {
      // Verifica se é um pref_id ou payment_id
      const isPreferenceId = paymentId.includes('-') && paymentId.split('-').length > 2;
      
      if (isPreferenceId) {
        // Busca detalhes da preferência
        const pref = await preference.get({ preferenceId: paymentId });
        return {
          type: 'preference',
          id: pref.id,
          status: 'pending',
          initPoint: pref.init_point,
          sandboxInitPoint: pref.sandbox_init_point,
          items: pref.items,
          payer: pref.payer,
          metadata: pref.metadata,
        };
      } else {
        // Busca detalhes do pagamento
        const pay = await payment.get({ id: paymentId });
        return {
          type: 'payment',
          id: pay.id,
          status: pay.status,
          statusDetail: pay.status_detail,
          transactionAmount: pay.transaction_amount,
          currencyId: pay.currency_id,
          paymentMethodId: pay.payment_method_id,
          paymentTypeId: pay.payment_type_id,
          external_reference: pay.external_reference, // ✅ Adicionar external_reference (purchaseId)
          metadata: pay.metadata, // ✅ Metadata (pode conter purchase_id)
          dateCreated: pay.date_created,
          dateApproved: pay.date_approved,
          payer: pay.payer,
          pointOfInteraction: pay.point_of_interaction,
          transactionDetails: pay.transaction_details,
        };
      }
    } catch (error: any) {
      throw new Error(`Erro ao buscar detalhes: ${error.message}`);
    }
  }

  /**
   * Busca detalhes de uma merchant_order no Mercado Pago
   * @param merchantOrderId ID da merchant_order
   * @returns Detalhes da merchant_order incluindo payment_ids
   */
  async getMerchantOrderDetails(merchantOrderId: string): Promise<any> {
    try {
      // Extrair ID da URL se for uma URL completa
      let orderId = merchantOrderId;
      if (merchantOrderId.includes('merchant_orders/')) {
        const match = merchantOrderId.match(/merchant_orders\/(\d+)/);
        if (match) {
          orderId = match[1];
        }
      }

      // Buscar merchant_order via API REST do Mercado Pago
      const response = await fetch(
        `https://api.mercadopago.com/merchant_orders/${orderId}?access_token=${env.mercadopagoAccessToken}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar merchant_order: ${response.statusText}`);
      }

      const merchantOrder = await response.json();

      return {
        id: merchantOrder.id,
        status: merchantOrder.status,
        external_reference: merchantOrder.external_reference, // ✅ purchaseId
        preference_id: merchantOrder.preference_id,
        payments: merchantOrder.payments || [], // ✅ Array de payment_ids
        order_status: merchantOrder.order_status,
        total_amount: merchantOrder.total_amount,
        paid_amount: merchantOrder.paid_amount,
        date_created: merchantOrder.date_created,
        last_updated: merchantOrder.last_updated,
      };
    } catch (error: any) {
      throw new Error(`Erro ao buscar merchant_order: ${error.message}`);
    }
  }

    async processCardPayment(data: ProcessCardPaymentData): Promise<PaymentResult> {
      try {
        // Validações
        if (!data.token || data.token.trim() === '') {
          throw new Error('Token do cartão é obrigatório');
        }

        // Validar formato do token (tokens do Mercado Pago geralmente têm 32 caracteres alfanuméricos)
        const tokenPattern = /^[a-f0-9]{32}$/i;
        if (!tokenPattern.test(data.token.trim())) {
          console.warn('⚠️ Token pode estar em formato inválido. Tokens do Mercado Pago geralmente têm 32 caracteres hexadecimais.');
        }

        if (!data.amount || data.amount <= 0) {
          throw new Error('Valor do pagamento inválido');
        }

        if (!data.payerEmail || !data.payerEmail.includes('@')) {
          throw new Error('Email do pagador inválido');
        }

      // Processa pagamento com cartão diretamente (Checkout Transparente)
      // IMPORTANTE: O token deve ser gerado no frontend usando Mercado Pago JS
      // Estrutura baseada na documentação oficial do Mercado Pago SDK v2
      
      // Extrair nome do email para usar como fallback
      const emailParts = data.payerEmail.split('@');
      const firstName = data.payerName?.split(' ')[0] || emailParts[0] || 'Cliente';
      const lastName = data.payerName?.split(' ').slice(1).join(' ') || '';

      // Estrutura do payload conforme documentação oficial do Mercado Pago
      // https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/card/integrate-via-core-methods
      // Payload mínimo necessário para processar pagamento
      const paymentData: any = {
        transaction_amount: Number(data.amount),
        token: data.token.trim(), // Token gerado pelo Mercado Pago JS
        description: data.description.substring(0, 127), // Limita tamanho da descrição
        installments: Number(data.installments) || 1,
        payer: {
          email: data.payerEmail,
        },
      };
      
      // Adicionar payment_method_id apenas se fornecido (opcional)
      if (data.paymentMethodId) {
        paymentData.payment_method_id = data.paymentMethodId;
      }
      
      // Statement descriptor removido temporariamente para teste (pode causar problemas em algumas contas)
      // paymentData.statement_descriptor = 'WEBCYCLE';

      // IMPORTANTE: Se você está recebendo internal_error, pode ser o webhook configurado no painel
      // Se o webhook estiver configurado com URL inacessível (ex: localhost), pode causar internal_error
      // Opção 1: Remover o webhook do painel do Mercado Pago temporariamente para testar
      // Opção 2: Configurar webhook corretamente com ngrok (veja WEBHOOK_CAUSANDO_INTERNAL_ERROR.md)
      // Opção 3: Descomentar a linha abaixo para desabilitar webhook neste pagamento específico
      // paymentData.notification_url = null; // Desabilita webhook para este pagamento

      // Adicionar nome do pagador (obrigatório para alguns casos)
      if (firstName && firstName.length > 0) {
        paymentData.payer.first_name = firstName;
        paymentData.payer.last_name = lastName && lastName.length > 0 ? lastName : firstName;
      } else {
        // Se não tiver nome, usar email como fallback
        const emailName = emailParts[0];
        paymentData.payer.first_name = emailName;
        paymentData.payer.last_name = emailName;
      }

      // Adiciona identification (recomendado para Brasil)
      // TEMPORARIAMENTE DESABILITADO PARA TESTE - pode estar causando internal_error
      // Se funcionar sem identification, o problema pode ser com o CPF de teste
      const ENABLE_IDENTIFICATION = false; // Mudar para true após teste
      
      if (ENABLE_IDENTIFICATION && data.identificationType && data.identificationNumber) {
        const cleanIdentification = data.identificationNumber.replace(/\D/g, '');
        
        // Validar CPF (deve ter 11 dígitos)
        if (data.identificationType.toUpperCase() === 'CPF' && cleanIdentification.length !== 11) {
          console.warn(`⚠️ CPF inválido: ${cleanIdentification.length} dígitos (esperado: 11)`);
        }
        
        paymentData.payer.identification = {
          type: data.identificationType.toUpperCase(),
          number: cleanIdentification,
        };
      } else {
        console.log('⚠️ Campo identification desabilitado para teste. Se funcionar, o problema pode ser com o CPF de teste.');
      }

      // Statement descriptor já adicionado acima

      // Verificar se Access Token está configurado
      if (!env.mercadopagoAccessToken || env.mercadopagoAccessToken.trim() === '') {
        throw new Error('MERCADOPAGO_ACCESS_TOKEN não está configurado no arquivo .env');
      }

      // Verificar se Access Token é válido (deve começar com TEST- ou APP_USR-)
      if (!env.mercadopagoAccessToken.startsWith('TEST-') && !env.mercadopagoAccessToken.startsWith('APP_USR-')) {
        console.warn('⚠️ Access Token pode estar incorreto. Deve começar com TEST- (sandbox) ou APP_USR- (produção)');
      }

      console.log('💳 Processando pagamento:', {
        amount: paymentData.transaction_amount,
        installments: paymentData.installments,
        payerEmail: paymentData.payer.email,
        tokenLength: paymentData.token.length,
        hasIdentification: !!paymentData.payer.identification,
        accessTokenPrefix: env.mercadopagoAccessToken.substring(0, 10) + '...',
      });

      // Validação detalhada do token antes de enviar
      const tokenValidation = {
        token: paymentData.token,
        length: paymentData.token.length,
        format: /^[a-f0-9]{32}$/i.test(paymentData.token) ? '✅ Válido' : '❌ Inválido',
        timestamp: new Date().toISOString(),
      };

      console.log('🔍 Validação do Token:', tokenValidation);

      if (tokenValidation.format === '❌ Inválido') {
        console.error('⚠️ ATENÇÃO: Token tem formato inválido!');
        console.error('Token recebido:', paymentData.token);
        console.error('Tamanho esperado: 32 caracteres');
        console.error('Tamanho recebido:', paymentData.token.length);
      }

      // Log do payload completo (sem token por segurança)
      console.log('📦 Payload enviado ao Mercado Pago:', {
        transaction_amount: paymentData.transaction_amount,
        token: paymentData.token.substring(0, 10) + '...' + paymentData.token.substring(paymentData.token.length - 5),
        tokenLength: paymentData.token.length,
        tokenFormat: tokenValidation.format,
        description: paymentData.description,
        installments: paymentData.installments,
        payer: paymentData.payer,
        payment_method_id: paymentData.payment_method_id || '(não fornecido)',
        timestamp: tokenValidation.timestamp,
      });

      // Tentar processar pagamento
      let result;
      try {
        // Validação final antes de enviar
        if (!paymentData.token || paymentData.token.trim() === '') {
          throw new Error('Token do cartão está vazio ou inválido');
        }
        
        if (paymentData.token.length !== 32) {
          throw new Error(`Token do cartão tem tamanho inválido: ${paymentData.token.length} caracteres (esperado: 32)`);
        }
        
        if (!/^[a-f0-9]{32}$/i.test(paymentData.token)) {
          throw new Error(`Token do cartão tem formato inválido: ${paymentData.token}`);
        }
        
        // Log do payload completo antes de enviar (para debug)
        console.log('🚀 Enviando requisição ao Mercado Pago...');
        console.log('📋 Payload completo (JSON):', JSON.stringify({
          ...paymentData,
          token: paymentData.token.substring(0, 10) + '...' + paymentData.token.substring(paymentData.token.length - 5),
        }, null, 2));
        
        // Log do token completo apenas para debug (remover em produção)
        console.log('🔑 Token completo sendo enviado:', paymentData.token);
        
        // Tentar usar o SDK primeiro
        try {
          result = await payment.create({ body: paymentData });
        } catch (sdkError: any) {
          // Tentar capturar x-request-id do erro do SDK (se disponível)
          const sdkRequestId = sdkError.response?.headers?.['x-request-id'] || 
                               sdkError.response?.headers?.['X-Request-Id'] ||
                               sdkError.headers?.['x-request-id'] ||
                               sdkError.headers?.['X-Request-Id'];
          
          if (sdkRequestId) {
            console.log('🔍 x-request-id do SDK (forneça ao suporte do Mercado Pago):', sdkRequestId);
          }
          
          // Se o SDK falhar com internal_error sem detalhes, tentar API REST diretamente
          if (sdkError.message === 'internal_error' && !sdkError.response?.data) {
            console.warn('⚠️ SDK retornou internal_error sem detalhes. Tentando API REST diretamente...');
            
            try {
              const response = await fetch('https://api.mercadopago.com/v1/payments', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${env.mercadopagoAccessToken}`,
                },
                body: JSON.stringify(paymentData),
              });
              
              // Capturar x-request-id (essencial para suporte do Mercado Pago)
              const requestId = response.headers.get('x-request-id');
              const contentType = response.headers.get('content-type');
              
              // Log dos headers importantes
              console.log('📋 Headers da resposta da API REST:', {
                status: response.status,
                statusText: response.statusText,
                'x-request-id': requestId || '(não fornecido)',
                'content-type': contentType || '(não fornecido)',
                'x-ratelimit-limit': response.headers.get('x-ratelimit-limit') || '(não fornecido)',
                'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining') || '(não fornecido)',
              });
              
              // ⚠️ IMPORTANTE: x-request-id é essencial para o suporte investigar o problema
              if (requestId) {
                console.log('🔍 x-request-id (forneça ao suporte do Mercado Pago):', requestId);
              } else {
                console.warn('⚠️ x-request-id não foi fornecido pelo Mercado Pago');
              }
              
              const responseData = await response.json();
              
              if (!response.ok) {
                console.error('❌ Erro da API REST:', {
                  status: response.status,
                  statusText: response.statusText,
                  'x-request-id': requestId || '(não fornecido)',
                  data: responseData,
                });
                
                // Incluir x-request-id na mensagem de erro para facilitar suporte
                const errorMessage = requestId 
                  ? `API REST retornou erro: ${response.status} - ${JSON.stringify(responseData)} (x-request-id: ${requestId})`
                  : `API REST retornou erro: ${response.status} - ${JSON.stringify(responseData)}`;
                
                throw new Error(errorMessage);
              }
              
              // Converter resposta da API REST para o formato esperado
              result = {
                id: responseData.id,
                status: responseData.status,
                status_detail: responseData.status_detail,
                three_ds_info: responseData.three_ds_info,
              };
              
              console.log('✅ Pagamento processado via API REST:', result);
            } catch (apiError: any) {
              console.error('❌ Erro na API REST:', apiError);
              throw sdkError; // Relançar erro original do SDK
            }
          } else {
            throw sdkError; // Relançar erro original se não for internal_error sem detalhes
          }
        }
        
        console.log('✅ Resposta do Mercado Pago recebida:', {
          id: result.id,
          status: result.status,
          statusDetail: result.status_detail,
        });
      } catch (mpError: any) {
        // Log mais detalhado do erro antes de relançar
        console.error('❌ Erro na chamada payment.create:', {
          error: mpError,
          errorMessage: mpError.message,
          errorCause: mpError.cause,
          errorStatus: mpError.status,
          errorStatusCode: mpError.statusCode,
          errorResponse: mpError.response,
          errorResponseData: mpError.response?.data,
          errorResponseStatus: mpError.response?.status,
          errorResponseStatusText: mpError.response?.statusText,
          errorApiMessage: mpError.apiMessage,
          errorStack: mpError.stack,
          // Tentar acessar propriedades específicas do SDK
          errorName: mpError.name,
          errorCode: mpError.code,
        });

        // Tentar extrair mais informações do erro
        if (mpError.cause && Array.isArray(mpError.cause) && mpError.cause.length > 0) {
          console.error('📋 Detalhes do erro (cause):', JSON.stringify(mpError.cause, null, 2));
        }

        // Se houver response.data, logar também
        if (mpError.response?.data) {
          console.error('📋 Response data completo:', JSON.stringify(mpError.response.data, null, 2));
          
          // Tentar extrair mensagem mais específica
          const responseData = mpError.response.data;
          if (responseData.message) {
            console.error('📋 Mensagem do erro:', responseData.message);
          }
          if (responseData.cause && Array.isArray(responseData.cause)) {
            responseData.cause.forEach((cause: any, index: number) => {
              console.error(`📋 Causa ${index + 1}:`, {
                code: cause.code,
                description: cause.data?.description || cause.description,
                data: cause.data,
              });
            });
          }
        }
        
        // Log adicional para debug
        console.error('📋 Status HTTP:', mpError.response?.status);
        console.error('📋 Status Text:', mpError.response?.statusText);
        console.error('📋 Headers:', mpError.response?.headers);

        throw mpError;
      }

      console.log('✅ Pagamento processado:', {
        id: result.id,
        status: result.status,
        statusDetail: result.status_detail,
      });

      return {
        id: result.id?.toString() || '',
        status: result.status || 'pending',
        statusDetail: result.status_detail || undefined,
        threeDSInfo: result.three_ds_info || undefined,
      };
    } catch (error: any) {
      // Log detalhado do erro
      console.error('❌ Erro completo do Mercado Pago:', {
        message: error.message,
        name: error.name,
        cause: error.cause,
        status: error.status,
        statusCode: error.statusCode,
        response: error.response,
        responseData: error.response?.data,
        responseStatus: error.response?.status,
        responseStatusText: error.response?.statusText,
        apiMessage: error.apiMessage,
        stack: error.stack,
      });

      // Tentar extrair mensagem mais detalhada
      let errorMessage = 'Erro ao processar pagamento com cartão';
      let errorDetails: any = {};

      // Verificar diferentes formatos de erro do Mercado Pago SDK
      if (error.response?.data) {
        const mpError = error.response.data;
        errorDetails = mpError;
        
        if (mpError.message) {
          errorMessage += `: ${mpError.message}`;
        }
        
        if (mpError.cause && Array.isArray(mpError.cause) && mpError.cause.length > 0) {
          const firstCause = mpError.cause[0];
          if (firstCause.description) {
            errorMessage += ` - ${firstCause.description}`;
          }
          if (firstCause.code) {
            errorMessage += ` (Código: ${firstCause.code})`;
          }
        }
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      } else if (error.apiMessage) {
        errorMessage += `: ${error.apiMessage}`;
      }

      // Adicionar sugestões baseadas no erro
      if (error.message?.includes('internal_error') || error.message === 'internal_error' || error.response?.data?.message?.includes('internal_error')) {
        // Verificar se o Access Token está configurado corretamente
        const accessTokenPrefix = env.mercadopagoAccessToken ? env.mercadopagoAccessToken.substring(0, 10) : 'NÃO CONFIGURADO';
        const isTestToken = env.mercadopagoAccessToken?.startsWith('TEST-');
        const isProdToken = env.mercadopagoAccessToken?.startsWith('APP_USR-');
        
        // Usar 'data' (parâmetro da função) em vez de 'paymentData' que pode não estar no escopo
        const tokenInfo = data?.token ? `${data.token.substring(0, 10)}... (${data.token.length} caracteres)` : 'NÃO ENCONTRADO ❌';
        const tokenFormat = data?.token ? (/^[a-f0-9]{32}$/i.test(data.token) ? 'VÁLIDO ✅' : 'INVÁLIDO ❌') : 'NÃO ENCONTRADO ❌';
        const amountInfo = data?.amount ? `R$ ${data.amount}` : 'NÃO ENCONTRADO';
        const emailInfo = data?.payerEmail || 'NÃO ENCONTRADO';
        
        let diagnosticMessage = '\n\n🔍 Diagnóstico do erro "internal_error":\n';
        diagnosticMessage += `1. Access Token: ${accessTokenPrefix}...\n`;
        diagnosticMessage += `   - Ambiente: ${isTestToken ? 'TESTE ✅' : isProdToken ? 'PRODUÇÃO ✅' : 'INVÁLIDO ❌'}\n`;
        diagnosticMessage += `2. Token do cartão recebido: ${tokenInfo}\n`;
        diagnosticMessage += `3. Formato do token: ${tokenFormat}\n`;
        diagnosticMessage += `4. Valor do pagamento: ${amountInfo}\n`;
        diagnosticMessage += `5. Email do pagador: ${emailInfo}\n`;
        
        diagnosticMessage += '\n💡 Possíveis causas:\n';
        diagnosticMessage += '- Token do cartão expirado (tokens expiram em alguns segundos)\n';
        diagnosticMessage += '- Public Key e Access Token de ambientes diferentes (teste vs produção)\n';
        diagnosticMessage += '- Token gerado com Public Key diferente da aplicação do Access Token\n';
        diagnosticMessage += '- Access Token inválido ou expirado\n';
        
        console.error(diagnosticMessage);
        
        errorMessage += '. Verifique: 1) Access Token está correto? 2) Token do cartão foi gerado corretamente? 3) Public Key e Access Token são do mesmo ambiente (teste/produção)?';
      }

      console.error('❌ Detalhes do erro:', errorDetails);

      throw new Error(errorMessage);
    }
  }

  async refundPayment(paymentId: string): Promise<any> {
    try {
      // Mercado Pago não tem método direto de reembolso na SDK v2
      // Em produção, usar a API REST do Mercado Pago para reembolsos
      // Por enquanto, retornar sucesso simulado
      console.log(`Reembolso solicitado para pagamento: ${paymentId}`);
      return {
        id: paymentId,
        status: 'refunded',
      };
    } catch (error: any) {
      throw new Error(`Erro ao processar reembolso: ${error.message}`);
    }
  }

  /**
   * Valida um token de cartão do Mercado Pago
   * Tenta criar um pagamento de teste com valor mínimo para verificar se o token é válido
   */
  async validateToken(token: string): Promise<{
    valid: boolean;
    message: string;
    details?: any;
  }> {
    try {
      // Validações básicas
      if (!token || token.trim() === '') {
        return {
          valid: false,
          message: 'Token está vazio',
        };
      }

      const cleanToken = token.trim();

      // Validar formato
      const tokenPattern = /^[a-f0-9]{32}$/i;
      if (!tokenPattern.test(cleanToken)) {
        return {
          valid: false,
          message: `Token tem formato inválido. Esperado: 32 caracteres hexadecimais. Recebido: ${cleanToken.length} caracteres`,
          details: {
            length: cleanToken.length,
            format: 'inválido',
            expectedFormat: '32 caracteres hexadecimais (0-9, a-f)',
          },
        };
      }

      // Tentar criar um pagamento de teste com valor mínimo
      // Isso vai validar se o token é válido e não expirado
      const testPaymentData = {
        transaction_amount: 0.01, // Valor mínimo para teste
        token: cleanToken,
        description: 'Validação de token',
        installments: 1,
        payer: {
          email: 'test@test.com',
          first_name: 'Test',
          last_name: 'User',
        },
      };

      console.log('🔍 Validando token:', {
        token: cleanToken.substring(0, 10) + '...' + cleanToken.substring(cleanToken.length - 5),
        length: cleanToken.length,
        format: tokenPattern.test(cleanToken) ? '✅ Válido' : '❌ Inválido',
      });

      try {
        const result = await payment.create({ body: testPaymentData });

        return {
          valid: true,
          message: 'Token válido e não expirado',
          details: {
            tokenLength: cleanToken.length,
            format: 'válido',
            paymentId: result.id,
            status: result.status,
          },
        };
      } catch (error: any) {
        // Analisar o erro para dar mensagem mais específica
        let errorMessage = 'Token inválido ou expirado';
        let errorDetails: any = {};

        if (error.message?.includes('internal_error')) {
          errorMessage = 'Token pode estar expirado ou ser de outra aplicação';
          errorDetails = {
            possibleCauses: [
              'Token expirado (tokens expiram em alguns segundos)',
              'Token de outra aplicação (Public Key diferente)',
              'Token gerado incorretamente',
            ],
          };
        } else if (error.message?.includes('invalid_token')) {
          errorMessage = 'Token inválido';
          errorDetails = {
            possibleCauses: [
              'Token não foi gerado corretamente',
              'Token foi alterado ou corrompido',
            ],
          };
        } else if (error.cause && Array.isArray(error.cause) && error.cause.length > 0) {
          const firstCause = error.cause[0];
          errorMessage = firstCause.description || errorMessage;
          errorDetails = {
            code: firstCause.code,
            description: firstCause.description,
          };
        }

        return {
          valid: false,
          message: errorMessage,
          details: {
            error: error.message,
            ...errorDetails,
          },
        };
      }
    } catch (error: any) {
      return {
        valid: false,
        message: `Erro ao validar token: ${error.message}`,
        details: {
          error: error.message,
        },
      };
    }
  }
}

