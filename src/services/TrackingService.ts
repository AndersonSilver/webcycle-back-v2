import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { ShippingTracking, ShippingStatus } from '../entities/ShippingTracking.entity';
import { TrackingEvent } from '../entities/TrackingEvent.entity';
import { ProductPurchase } from '../entities/ProductPurchase.entity';
import { env } from '../config/env.config';
import { emailService } from './EmailService';
import { User } from '../entities/User.entity';

interface BrasilAbertoResponse {
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalOfItems: number;
    totalOfPages: number;
  };
  result: Array<{
    objectCode: string;
    events: Array<{
      code: string;
      description: string;
      creation: string;
      type: string;
      unit: {
        city: string;
        state: string;
      };
    }>;
    modality?: string;
    postalType?: {
      category: string;
      description: string;
      initials: string;
    };
  }>;
}

export class TrackingService {
  private trackingRepository: Repository<ShippingTracking>;
  private eventRepository: Repository<TrackingEvent>;
  private productPurchaseRepository: Repository<ProductPurchase>;
  private userRepository: Repository<User>;

  constructor() {
    this.trackingRepository = AppDataSource.getRepository(ShippingTracking);
    this.eventRepository = AppDataSource.getRepository(TrackingEvent);
    this.productPurchaseRepository = AppDataSource.getRepository(ProductPurchase);
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Busca informações de rastreamento na API Brasil Aberto
   * Implementa retry com backoff exponencial e melhor tratamento de erros
   */
  async fetchTrackingFromBrasilAberto(trackingCode: string, retries: number = 3): Promise<BrasilAbertoResponse | null> {
    const apiKey = env.BRASIL_ABERTO_API_KEY || '';
    const apiBaseUrl = env.BRASIL_ABERTO_API_URL || 'https://brasilaberto.com/api';

    // Validação da API key (se necessário)
    if (apiKey && apiKey.trim() === '') {
      console.warn('⚠️ BRASIL_ABERTO_API_KEY não configurada. Configure a variável de ambiente se necessário.');
    }

    // Validação do código de rastreamento
    if (!trackingCode || trackingCode.trim() === '') {
      console.error('❌ Código de rastreamento inválido');
      return null;
    }

    const url = `${apiBaseUrl}/v1/postal-orders/${encodeURIComponent(trackingCode.trim())}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Timeout de 15 segundos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'PSICO-Tracking-Service/1.0',
        };

        // Adicionar API key no header se configurada
        if (apiKey && apiKey.trim() !== '') {
          headers['Authorization'] = `Bearer ${apiKey.trim()}`;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Tratamento de diferentes status HTTP
        if (response.status === 404) {
          console.warn(`⚠️ Código de rastreamento não encontrado: ${trackingCode}`);
          return null;
        }

        if (response.status === 401 || response.status === 403) {
          console.error(`❌ Erro de autenticação na API Brasil Aberto. Verifique a API key.`);
          return null;
        }

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
          console.warn(`⏳ Rate limit atingido. Aguardando ${waitTime}ms antes de tentar novamente...`);
          
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          return null;
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => response.statusText);
          console.error(`❌ Erro HTTP ${response.status}: ${errorText}`);
          
          // Retry apenas para erros 5xx (erros do servidor)
          if (response.status >= 500 && attempt < retries) {
            const waitTime = Math.pow(2, attempt) * 1000;
            console.warn(`🔄 Tentativa ${attempt}/${retries} falhou. Tentando novamente em ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          return null;
        }

        const data = await response.json();

        // Validação da estrutura da resposta
        if (!data || typeof data !== 'object') {
          console.error('❌ Resposta inválida da API Brasil Aberto');
          return null;
        }

        // Verificar se há erro na resposta
        if (data.error || (data.meta && data.meta.totalOfItems === 0 && (!data.result || data.result.length === 0))) {
          console.warn(`⚠️ API retornou sem dados: ${data.message || 'Nenhum resultado encontrado'}`);
          return null;
        }

        // Validar estrutura mínima esperada
        if (!data.result || !Array.isArray(data.result) || data.result.length === 0) {
          console.warn('⚠️ Resposta da API não contém dados de rastreamento válidos');
          return null;
        }

        const firstResult = data.result[0];
        if (!firstResult.objectCode || !firstResult.events || !Array.isArray(firstResult.events)) {
          console.warn('⚠️ Estrutura de dados inválida na resposta');
          return null;
        }

        console.log(`✅ Tracking atualizado com sucesso: ${trackingCode} (${firstResult.events.length} eventos)`);
        return data as BrasilAbertoResponse;

      } catch (error: any) {
        // Tratamento específico para timeout
        if (error.name === 'AbortError') {
          console.error(`⏱️ Timeout ao buscar tracking (tentativa ${attempt}/${retries})`);
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          console.error(`🌐 Erro de conexão com a API Brasil Aberto: ${error.message}`);
          return null; // Não retry para erros de conexão
        } else {
          console.error(`❌ Erro ao buscar tracking (tentativa ${attempt}/${retries}):`, error.message);
        }

        // Retry com backoff exponencial
        if (attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.warn(`🔄 Tentando novamente em ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          console.error(`❌ Falha ao buscar tracking após ${retries} tentativas`);
          return null;
        }
      }
    }

    return null;
  }

  /**
   * Mapeia status do Brasil Aberto para ShippingStatus
   * Baseado nos códigos e descrições de eventos da API
   */
  private mapStatusToShippingStatus(eventCode: string, description: string): ShippingStatus {
    const codeLower = eventCode.toLowerCase();
    const descLower = description.toLowerCase();

    // Códigos comuns dos Correios
    if (codeLower.includes('bdr') || codeLower.includes('bdm') || descLower.includes('entregue') || descLower.includes('entregue ao destinatário')) {
      return ShippingStatus.DELIVERED;
    }
    if (codeLower.includes('saiu para entrega') || descLower.includes('saiu para entrega') || descLower.includes('saiu para entrega')) {
      return ShippingStatus.OUT_FOR_DELIVERY;
    }
    if (codeLower.includes('em trânsito') || descLower.includes('em trânsito') || descLower.includes('trânsito')) {
      return ShippingStatus.IN_TRANSIT;
    }
    if (codeLower.includes('postado') || descLower.includes('objeto postado') || descLower.includes('postado')) {
      return ShippingStatus.SHIPPED;
    }
    if (codeLower.includes('devolvido') || descLower.includes('devolvido') || descLower.includes('retorno')) {
      return ShippingStatus.RETURNED;
    }
    if (codeLower.includes('aguardando') || descLower.includes('aguardando') || descLower.includes('preparando')) {
      return ShippingStatus.PREPARING;
    }
    if (codeLower.includes('exceção') || descLower.includes('exceção') || descLower.includes('problema') || descLower.includes('erro')) {
      return ShippingStatus.EXCEPTION;
    }

    // Default: em trânsito se já tem eventos
    return ShippingStatus.IN_TRANSIT;
  }

  /**
   * Atualiza o tracking de uma compra
   * Busca dados atualizados da API e sincroniza com o banco de dados
   */
  async updateTracking(trackingId: string): Promise<ShippingTracking | null> {
    const tracking = await this.trackingRepository.findOne({
      where: { id: trackingId },
      relations: ['productPurchase', 'productPurchase.purchase', 'productPurchase.product', 'events'],
    });

    if (!tracking) {
      console.error(`❌ Tracking não encontrado: ${trackingId}`);
      return null;
    }

    if (!tracking.trackingCode) {
      console.warn(`⚠️ Tracking sem código de rastreamento: ${trackingId}`);
      return tracking;
    }

    console.log(`🔄 Atualizando tracking: ${tracking.trackingCode}`);

    const brasilAbertoData = await this.fetchTrackingFromBrasilAberto(tracking.trackingCode);

    // Se não conseguiu buscar dados, retorna o tracking atual sem atualizar
    if (!brasilAbertoData || !brasilAbertoData.result || brasilAbertoData.result.length === 0) {
      console.warn(`⚠️ Não foi possível buscar dados atualizados para: ${tracking.trackingCode}`);
      return tracking;
    }

    const trackingData = brasilAbertoData.result[0];
    const events = trackingData.events || [];

    if (events.length === 0) {
      console.warn(`⚠️ Nenhum evento encontrado para: ${tracking.trackingCode}`);
      return tracking;
    }

    const previousStatus = tracking.status;
    
    // Determinar novo status baseado no último evento
    const lastEvent = events[events.length - 1];
    const newStatus = this.mapStatusToShippingStatus(
      lastEvent.code || '',
      lastEvent.description || ''
    );

    // Atualizar dados do tracking
    tracking.status = newStatus;
    tracking.trackingData = brasilAbertoData;
    
    // Atualizar transportadora se disponível
    if (trackingData.postalType?.description) {
      tracking.carrier = trackingData.postalType.description;
    } else if (trackingData.modality) {
      tracking.carrier = trackingData.modality;
    }

    // Atualizar data de entrega se entregue
    if (newStatus === ShippingStatus.DELIVERED && !tracking.deliveredAt) {
      try {
        const deliveredDate = new Date(lastEvent.creation);
        if (!isNaN(deliveredDate.getTime())) {
          tracking.deliveredAt = deliveredDate;
        } else {
          tracking.deliveredAt = new Date();
        }
      } catch {
        tracking.deliveredAt = new Date();
      }
    }

    // Atualizar data estimada de entrega se disponível
    if (events.length > 0 && !tracking.estimatedDeliveryDate) {
      try {
        const firstEvent = events[0];
        const postedDate = new Date(firstEvent.creation);
        if (!isNaN(postedDate.getTime())) {
          // Adicionar 10 dias úteis como estimativa padrão
          const estimatedDate = new Date(postedDate);
          estimatedDate.setDate(estimatedDate.getDate() + 10);
          tracking.estimatedDeliveryDate = estimatedDate;
        }
      } catch (error) {
        console.warn('Erro ao processar data estimada:', error);
      }
    }

    await this.trackingRepository.save(tracking);

    // Adicionar novos eventos
    const existingEventDates = new Set(
      tracking.events.map((e) => {
        if (e.timestamp) {
          return e.timestamp.toISOString();
        }
        return '';
      })
    );

    let newEventsCount = 0;
    for (const event of events) {
      try {
        const eventDate = new Date(event.creation);
        
        // Validar data
        if (isNaN(eventDate.getTime())) {
          console.warn(`⚠️ Data inválida no evento: ${event.creation}`);
          continue;
        }

        const eventKey = eventDate.toISOString();

        if (!existingEventDates.has(eventKey)) {
          // Montar localização
          const location = event.unit 
            ? `${event.unit.city || ''}${event.unit.city && event.unit.state ? ' - ' : ''}${event.unit.state || ''}`.trim()
            : '';

          const trackingEvent = this.eventRepository.create({
            trackingId: tracking.id,
            status: event.code || 'Atualização',
            description: event.description || event.code || 'Evento de rastreamento',
            location: location,
            timestamp: eventDate,
          });

          await this.eventRepository.save(trackingEvent);
          existingEventDates.add(eventKey);
          newEventsCount++;
        }
      } catch (error) {
        console.error('Erro ao salvar evento:', error);
      }
    }

    if (newEventsCount > 0) {
      console.log(`✅ ${newEventsCount} novo(s) evento(s) adicionado(s)`);
    }

    // Enviar email se o status mudou
    if (previousStatus !== newStatus && tracking.productPurchase?.purchase) {
      try {
        await this.sendTrackingUpdateEmail(tracking, previousStatus, newStatus);
      } catch (error) {
        console.error('Erro ao enviar email de atualização:', error);
        // Não falhar a atualização por causa do email
      }
    }

    console.log(`✅ Tracking atualizado: ${tracking.trackingCode} - Status: ${newStatus}`);
    return tracking;
  }

  /**
   * Envia email de atualização de tracking
   */
  private async sendTrackingUpdateEmail(
    tracking: ShippingTracking,
    _previousStatus: ShippingStatus,
    _newStatus: ShippingStatus
  ): Promise<void> {
    try {
      const productPurchase = await this.productPurchaseRepository.findOne({
        where: { id: tracking.productPurchaseId },
        relations: ['purchase', 'product'],
      });

      if (!productPurchase?.purchase) {
        return;
      }

      const user = await this.userRepository.findOne({
        where: { id: productPurchase.purchase.userId },
      });

      if (!user) {
        return;
      }

      const statusMessages: Record<ShippingStatus, string> = {
        [ShippingStatus.PENDING]: 'Aguardando postagem',
        [ShippingStatus.PREPARING]: 'Preparando para envio',
        [ShippingStatus.SHIPPED]: 'Produto postado',
        [ShippingStatus.IN_TRANSIT]: 'Produto em trânsito',
        [ShippingStatus.OUT_FOR_DELIVERY]: 'Saiu para entrega',
        [ShippingStatus.DELIVERED]: 'Produto entregue',
        [ShippingStatus.RETURNED]: 'Produto devolvido',
        [ShippingStatus.EXCEPTION]: 'Exceção no envio',
      };

      const statusMessage = statusMessages[newStatus] || 'Status atualizado';
      const productName = productPurchase.product?.title || 'Produto';

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Atualização do seu pedido</h2>
          <p>Olá <strong>${user.name}</strong>,</p>
          <p>Seu pedido do produto <strong>${productName}</strong> teve uma atualização:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #6366f1;">
              ${statusMessage}
            </p>
            ${tracking.trackingCode ? `<p style="margin: 10px 0 0 0;">Código de rastreamento: <strong>${tracking.trackingCode}</strong></p>` : ''}
          </div>
          ${(() => {
            const trackingData = tracking.trackingData as any;
            const events = trackingData?.result?.[0]?.events;
            if (events && Array.isArray(events) && events.length > 0) {
              return `
            <h3 style="color: #333; margin-top: 30px;">Histórico de rastreamento:</h3>
            <ul style="list-style: none; padding: 0;">
              ${events
                .slice(-5)
                .reverse()
                .map(
                  (event: any) => {
                    try {
                      const eventDate = new Date(event.creation);
                      const location = event.unit 
                        ? `${event.unit.city || ''}${event.unit.city && event.unit.state ? ' - ' : ''}${event.unit.state || ''}`.trim()
                        : '';
                      return `
                  <li style="padding: 10px; border-left: 3px solid #6366f1; margin-bottom: 10px; background-color: #f9f9f9;">
                    <strong>${event.description || event.code || 'Atualização'}</strong><br>
                    ${!isNaN(eventDate.getTime()) ? `${eventDate.toLocaleDateString('pt-BR')} ${eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : event.creation || ''}<br>
                    ${location ? `<small>${location}</small>` : ''}
                  </li>
                `;
                    } catch {
                      return '';
                    }
                  }
                )
                .filter(Boolean)
                .join('')}
            </ul>
          `;
            }
            return '';
          })()}
          <p style="margin-top: 30px;">
            <a href="${env.frontendUrl || 'http://localhost:5173'}/minhas-compras" 
               style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Ver detalhes da compra
            </a>
          </p>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            Abraços,<br><strong>Equipe PSICO</strong>
          </p>
        </div>
      `;

      await emailService.sendEmail({
        to: user.email,
        subject: `Atualização do seu pedido - ${productName}`,
        html,
      });
    } catch (error) {
      console.error('Erro ao enviar email de tracking:', error);
    }
  }

  /**
   * Adiciona código de rastreamento a uma compra de produto físico
   * Busca automaticamente os dados da API após adicionar o código
   */
  async addTrackingCode(
    productPurchaseId: string,
    trackingCode?: string,
    carrier?: string
  ): Promise<ShippingTracking> {
    // Verificar se já existe tracking para esta compra
    let tracking = await this.trackingRepository.findOne({
      where: { productPurchaseId },
      relations: ['events'],
    });

    if (!tracking) {
      // Criar tracking básico apenas para armazenar comprovante de envio
      tracking = this.trackingRepository.create({
        productPurchaseId,
        trackingCode: trackingCode?.trim() || undefined,
        carrier: carrier?.trim() || undefined,
        status: ShippingStatus.PENDING,
      });
    } else {
      // Atualizar apenas se fornecido
      if (trackingCode) {
        tracking.trackingCode = trackingCode.trim();
      }
      if (carrier) {
        tracking.carrier = carrier.trim();
      }
    }

    await this.trackingRepository.save(tracking);
    return tracking;
  }

  /**
   * Busca tracking com eventos
   */
  async getTrackingWithEvents(trackingId: string): Promise<ShippingTracking | null> {
    return await this.trackingRepository.findOne({
      where: { id: trackingId },
      relations: ['events', 'productPurchase', 'productPurchase.product'],
      order: {
        events: {
          createdAt: 'DESC',
        },
      },
    });
  }

  /**
   * Busca tracking por código
   */
  async getTrackingByCode(trackingCode: string): Promise<ShippingTracking | null> {
    return await this.trackingRepository.findOne({
      where: { trackingCode },
      relations: ['events', 'productPurchase', 'productPurchase.product'],
      order: {
        events: {
          createdAt: 'DESC',
        },
      },
    });
  }
}

