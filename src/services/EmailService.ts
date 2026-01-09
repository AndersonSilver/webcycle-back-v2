import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.config';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  trackingId?: string; // ID para tracking de abertura e cliques
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Gera um template base melhorado com responsividade e link de descadastro
   */
  private getBaseTemplate(
    headerColor: string,
    headerGradient: string,
    title: string,
    content: string,
    buttonText?: string,
    buttonLink?: string,
    buttonColor?: string,
    unsubscribeLink?: string
  ): string {
    const unsubscribeSection = unsubscribeLink
      ? `<p style="text-align: center; margin-top: 20px; font-size: 11px; color: #9ca3af;">
          <a href="${unsubscribeLink}" style="color: #6b7280; text-decoration: underline;">Descadastrar da newsletter</a>
        </p>`
      : '';

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #333; 
              background-color: #f3f4f6;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            .email-wrapper { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: #ffffff;
            }
            .header { 
              background: linear-gradient(135deg, ${headerColor} 0%, ${headerGradient} 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
            }
            .header h1 { 
              font-size: 28px; 
              font-weight: 700; 
              margin: 0;
              line-height: 1.2;
            }
            .content { 
              background: #ffffff; 
              padding: 40px 30px; 
            }
            .content p { 
              margin-bottom: 16px; 
              font-size: 16px;
              color: #374151;
            }
            .content h2 { 
              font-size: 22px; 
              font-weight: 600; 
              margin: 24px 0 16px 0;
              color: #111827;
            }
            .content ul, .content ol { 
              margin: 16px 0 16px 20px; 
            }
            .content li { 
              margin-bottom: 8px; 
              font-size: 16px;
              color: #374151;
            }
            .button { 
              display: inline-block; 
              background: ${buttonColor || '#2563eb'}; 
              color: white !important; 
              padding: 14px 32px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 24px 0; 
              font-weight: 600;
              font-size: 16px;
              text-align: center;
            }
            .button:hover { 
              opacity: 0.9; 
            }
            .button-container { 
              text-align: center; 
              margin: 30px 0; 
            }
            .course-list, .info-box { 
              background: #f9fafb; 
              padding: 24px; 
              border-radius: 8px; 
              margin: 24px 0; 
              border-left: 4px solid ${buttonColor || '#2563eb'};
            }
            .course-list h3, .info-box h3 { 
              font-size: 18px; 
              font-weight: 600; 
              margin-bottom: 16px;
              color: #111827;
            }
            .course-list ul { 
              list-style: none; 
              margin: 0; 
              padding: 0; 
            }
            .course-list li { 
              padding: 12px 0; 
              border-bottom: 1px solid #e5e7eb; 
            }
            .course-list li:last-child { 
              border-bottom: none; 
            }
            .total, .highlight { 
              font-size: 20px; 
              font-weight: 700; 
              margin-top: 16px; 
              color: ${buttonColor || '#2563eb'};
            }
            .footer { 
              text-align: center; 
              padding: 30px; 
              color: #6b7280; 
              font-size: 12px; 
              background-color: #f9fafb;
              border-top: 1px solid #e5e7eb;
            }
            .footer a { 
              color: #6b7280; 
              text-decoration: underline; 
            }
            @media only screen and (max-width: 600px) {
              .email-wrapper { width: 100% !important; }
              .header { padding: 30px 20px !important; }
              .header h1 { font-size: 24px !important; }
              .content { padding: 30px 20px !important; }
              .button { 
                display: block !important; 
                width: 100% !important; 
                padding: 16px !important; 
              }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <h1>${title}</h1>
            </div>
            <div class="content">
              ${content}
              ${buttonText && buttonLink ? `
                <div class="button-container">
                  <a href="${buttonLink}" class="button">${buttonText}</a>
                </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>Este é um email automático. Por favor, não responda.</p>
              <p style="margin-top: 8px;">
                <a href="${env.frontendUrl || 'http://localhost:5173'}">Plataforma de Cursos</a> | 
                <a href="${env.frontendUrl || 'http://localhost:5173'}/contato">Contato</a>
              </p>
              ${unsubscribeSection}
              <p style="margin-top: 16px; font-size: 11px; color: #9ca3af;">
                © ${new Date().getFullYear()} WebCycle. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private initializeTransporter() {
    // Se usar Resend via SMTP
    if (env.smtpHost && env.smtpUser && env.smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort || 587,
        secure: env.smtpPort === 465,
        auth: {
          user: env.smtpUser,
          pass: env.smtpPass,
        },
      });
    }
  }

  /**
   * Adiciona tracking pixel e links rastreados ao HTML do email
   */
  private addTracking(html: string, trackingId?: string): string {
    if (!trackingId) return html;

    // Adicionar pixel de rastreamento (1x1 imagem transparente)
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${env.port || 3001}`;
    const trackingPixel = `<img src="${backendUrl}/api/email/track/open/${trackingId}" width="1" height="1" style="display:none;" alt="" />`;
    
    // Substituir links por versões rastreadas
    const trackedHtml = html.replace(
      /href="([^"]+)"/g,
      (match, url) => {
        // Não rastrear links de descadastro ou tracking
        if (url.includes('/api/email/track') || url.includes('unsubscribe')) {
          return match;
        }
        const separator = url.includes('?') ? '&' : '?';
        return `href="${url}${separator}utm_source=email&utm_medium=email&utm_campaign=track&tracking_id=${trackingId}"`;
      }
    );

    // Adicionar pixel antes do fechamento do body
    return trackedHtml.replace('</body>', `${trackingPixel}</body>`);
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      console.warn('Email transporter não configurado. Configure as variáveis SMTP_* no .env');
      return;
    }

    try {
      // Adicionar tracking ao HTML
      const htmlWithTracking = this.addTracking(options.html, options.trackingId);

      await this.transporter.sendMail({
        from: options.from || env.smtpFrom || env.smtpUser,
        to: options.to,
        subject: options.subject,
        html: htmlWithTracking,
      });
      
      // Registrar tracking se fornecido (usar import dinâmico para evitar circular)
      if (options.trackingId) {
        try {
          const { EmailTrackingController } = await import('../controllers/EmailTrackingController');
          EmailTrackingController.registerTracking(
            options.trackingId,
            options.to,
            options.subject
          );
        } catch (err) {
          // Ignorar erro de import circular em desenvolvimento
          console.warn('Não foi possível registrar tracking:', err);
        }
      }
      
      console.log(`Email enviado para: ${options.to}${options.trackingId ? ` (Tracking ID: ${options.trackingId})` : ''}`);
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    const trackingId = uuidv4();
    const content = `
      <p>Olá <strong>${userName}</strong>,</p>
      <p>É um prazer ter você conosco! Estamos muito felizes em fazer parte da sua jornada de aprendizado em psicologia aplicada.</p>
      
      <h2>🎯 O que você pode fazer agora:</h2>
      <ul>
        <li>Explorar nossos cursos especializados</li>
        <li>Adicionar podcasts gratuitos aos seus cursos</li>
        <li>Acompanhar seu progresso de aprendizado</li>
        <li>Receber certificados ao concluir cursos</li>
      </ul>
      
      <p>Se tiver alguma dúvida, nossa equipe está sempre pronta para ajudar!</p>
      
      <p>Abraços,<br><strong>Equipe WebCycle</strong></p>
    `;

    const html = this.getBaseTemplate(
      '#2563eb',
      '#0d9488',
      'Bem-vindo(a) à Plataforma de Cursos!',
      content,
      'Explorar Cursos',
      `${env.frontendUrl || 'http://localhost:5173'}`,
      '#2563eb'
    );

    await this.sendEmail({
      to: userEmail,
      subject: 'Bem-vindo(a) à Plataforma de Cursos de Psicologia! 🎓',
      html,
      trackingId,
    });
  }

  async sendPurchaseConfirmationEmail(
    userEmail: string,
    userName: string,
    courses: Array<{ title: string; price: number }>,
    totalAmount: number
  ): Promise<void> {
    const trackingId = uuidv4();
    const coursesList = courses
      .map((course) => {
        const price = typeof course.price === 'string' ? parseFloat(course.price) : course.price;
        return `<li><strong>${course.title}</strong> - R$ ${price.toFixed(2)}</li>`;
      })
      .join('');

    const content = `
      <p>Olá <strong>${userName}</strong>,</p>
      <p>Sua compra foi confirmada com sucesso! Você já tem acesso aos cursos adquiridos.</p>
      
      <div class="course-list">
        <h3>Cursos Adquiridos:</h3>
        <ul>
          ${coursesList}
        </ul>
        <div class="total">Total: R$ ${(typeof totalAmount === 'string' ? parseFloat(totalAmount) : totalAmount).toFixed(2)}</div>
      </div>
      
      <p>Bons estudos! 🎓</p>
      
      <p>Abraços,<br><strong>Equipe WebCycle</strong></p>
    `;

    const html = this.getBaseTemplate(
      '#10b981',
      '#059669',
      '✅ Compra Confirmada!',
      content,
      'Acessar Meus Cursos',
      `${env.frontendUrl || 'http://localhost:5173'}/meus-cursos`,
      '#10b981'
    );

    await this.sendEmail({
      to: userEmail,
      subject: 'Compra Confirmada - Acesso aos Cursos Liberado! ✅',
      html,
      trackingId,
    });
  }

  async sendNewsletterConfirmationEmail(email: string, name?: string): Promise<void> {
    const trackingId = uuidv4();
    const unsubscribeLink = `${env.frontendUrl || 'http://localhost:5173'}/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${trackingId}`;
    
    const content = `
      <p>Olá${name ? ` <strong>${name}</strong>` : ''},</p>
      <p>Obrigado por se inscrever na nossa newsletter!</p>
      <p>Agora você receberá:</p>
      <ul>
        <li>✨ Dicas exclusivas sobre psicologia aplicada</li>
        <li>📚 Artigos e conteúdos educativos</li>
        <li>🎓 Novidades sobre novos cursos</li>
        <li>💡 E muito mais!</li>
      </ul>
      <p>Fique de olho na sua caixa de entrada!</p>
      <p>Abraços,<br><strong>Equipe WebCycle</strong></p>
    `;

    const html = this.getBaseTemplate(
      '#f59e0b',
      '#d97706',
      '🎉 Inscrição Confirmada!',
      content,
      undefined,
      undefined,
      '#f59e0b',
      unsubscribeLink
    );

    await this.sendEmail({
      to: email,
      subject: 'Newsletter: Inscrição Confirmada! 🎉',
      html,
      trackingId,
    });
  }

  /**
   * Envia email de atualização da newsletter para um único inscrito
   */
  async sendNewsletterUpdateEmail(
    email: string,
    name: string | undefined,
    subject: string,
    content: string,
    ctaText?: string,
    ctaLink?: string
  ): Promise<void> {
    const trackingId = uuidv4();
    const unsubscribeLink = `${env.frontendUrl || 'http://localhost:5173'}/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${trackingId}`;
    
    // Personalizar conteúdo com nome se disponível
    const personalizedContent = name 
      ? `<p>Olá <strong>${name}</strong>,</p>${content}`
      : content;
    
    const html = this.getBaseTemplate(
      '#3b82f6',
      '#2563eb',
      subject,
      personalizedContent,
      ctaText,
      ctaLink,
      '#3b82f6',
      unsubscribeLink
    );

    await this.sendEmail({
      to: email,
      subject,
      html,
      trackingId,
    });
  }

  /**
   * Envia email de atualização da newsletter para todos os inscritos ativos
   */
  async sendNewsletterBulkUpdate(
    subscribers: Array<{ email: string; name?: string }>,
    subject: string,
    content: string,
    ctaText?: string,
    ctaLink?: string
  ): Promise<{ sent: number; failed: number; errors: string[] }> {
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Enviar emails em lotes para evitar sobrecarga
    const batchSize = 10;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (subscriber) => {
          try {
            await this.sendNewsletterUpdateEmail(
              subscriber.email,
              subscriber.name,
              subject,
              content,
              ctaText,
              ctaLink
            );
            sent++;
          } catch (error: any) {
            failed++;
            errors.push(`${subscriber.email}: ${error.message}`);
            console.error(`Erro ao enviar newsletter para ${subscriber.email}:`, error);
          }
        })
      );

      // Pequeno delay entre lotes para evitar rate limiting
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { sent, failed, errors };
  }

  /**
   * Email de conclusão de curso
   */
  async sendCourseCompletionEmail(
    userEmail: string,
    userName: string,
    courseTitle: string,
    courseId: string
  ): Promise<void> {
    const trackingId = uuidv4();
    const content = `
      <p>Olá <strong>${userName}</strong>,</p>
      <p>Parabéns! 🎉 Você concluiu o curso <strong>${courseTitle}</strong>!</p>
      
      <div class="info-box">
        <h3>🎓 Próximos Passos:</h3>
        <ul>
          <li>Gere seu certificado de conclusão</li>
          <li>Compartilhe sua conquista nas redes sociais</li>
          <li>Explore outros cursos relacionados</li>
          <li>Deixe uma avaliação sobre o curso</li>
        </ul>
      </div>
      
      <p>Continue aprendendo e evoluindo! 🚀</p>
      
      <p>Abraços,<br><strong>Equipe WebCycle</strong></p>
    `;

    const html = this.getBaseTemplate(
      '#8b5cf6',
      '#7c3aed',
      '🎉 Curso Concluído!',
      content,
      'Gerar Certificado',
      `${env.frontendUrl || 'http://localhost:5173'}/curso/${courseId}`,
      '#8b5cf6'
    );

    await this.sendEmail({
      to: userEmail,
      subject: `Parabéns! Você concluiu o curso: ${courseTitle} 🎓`,
      html,
      trackingId,
    });
  }

  /**
   * Email de certificado gerado
   */
  async sendCertificateEmail(
    userEmail: string,
    userName: string,
    courseTitle: string,
    certificateNumber: string,
    certificateId: string,
    verificationCode: string
  ): Promise<void> {
    const trackingId = uuidv4();
    const content = `
      <p>Olá <strong>${userName}</strong>,</p>
      <p>Seu certificado do curso <strong>${courseTitle}</strong> está pronto! 🎓</p>
      
      <div class="info-box">
        <h3>📜 Detalhes do Certificado:</h3>
        <ul>
          <li><strong>Número:</strong> ${certificateNumber}</li>
          <li><strong>Código de Verificação:</strong> ${verificationCode}</li>
          <li><strong>Curso:</strong> ${courseTitle}</li>
        </ul>
      </div>
      
      <p>Você pode baixar seu certificado em PDF e compartilhar sua conquista!</p>
      
      <p>Abraços,<br><strong>Equipe WebCycle</strong></p>
    `;

    const html = this.getBaseTemplate(
      '#ec4899',
      '#db2777',
      '📜 Certificado Gerado!',
      content,
      'Baixar Certificado',
      `${env.frontendUrl || 'http://localhost:5173'}/certificados/${certificateId}/download`,
      '#ec4899'
    );

    await this.sendEmail({
      to: userEmail,
      subject: `Seu certificado está pronto: ${courseTitle} 📜`,
      html,
      trackingId,
    });
  }

  /**
   * Email de lembrete (curso não acessado há X dias)
   */
  async sendCourseReminderEmail(
    userEmail: string,
    userName: string,
    courseTitle: string,
    courseId: string,
    daysSinceLastAccess: number
  ): Promise<void> {
    const trackingId = uuidv4();
    const content = `
      <p>Olá <strong>${userName}</strong>,</p>
      <p>Notamos que você não acessa o curso <strong>${courseTitle}</strong> há ${daysSinceLastAccess} ${daysSinceLastAccess === 1 ? 'dia' : 'dias'}.</p>
      
      <div class="info-box">
        <h3>💡 Por que continuar?</h3>
        <ul>
          <li>Complete seu aprendizado e receba o certificado</li>
          <li>Adquira novos conhecimentos e habilidades</li>
          <li>Mantenha o ritmo de estudos constante</li>
          <li>Alcance seus objetivos profissionais</li>
        </ul>
      </div>
      
      <p>Volte hoje e continue de onde parou! 📚</p>
      
      <p>Abraços,<br><strong>Equipe WebCycle</strong></p>
    `;

    const html = this.getBaseTemplate(
      '#06b6d4',
      '#0891b2',
      '📚 Continue seus Estudos!',
      content,
      'Continuar Curso',
      `${env.frontendUrl || 'http://localhost:5173'}/curso/${courseId}/assistir`,
      '#06b6d4'
    );

    await this.sendEmail({
      to: userEmail,
      subject: `Continue aprendendo: ${courseTitle} 📚`,
      html,
      trackingId,
    });
  }

  /**
   * Email de reembolso
   */
  async sendRefundEmail(
    userEmail: string,
    userName: string,
    courses: Array<{ title: string; price: number }>,
    refundAmount: number,
    refundId: string,
    status: 'approved' | 'rejected'
  ): Promise<void> {
    const trackingId = uuidv4();
    const coursesList = courses
      .map((course) => {
        const price = typeof course.price === 'string' ? parseFloat(course.price) : course.price;
        return `<li><strong>${course.title}</strong> - R$ ${price.toFixed(2)}</li>`;
      })
      .join('');

    const statusMessage = status === 'approved'
      ? 'Seu pedido de reembolso foi <strong>aprovado</strong>! ✅'
      : 'Infelizmente, seu pedido de reembolso foi <strong>rejeitado</strong>. ❌';

    const content = `
      <p>Olá <strong>${userName}</strong>,</p>
      <p>${statusMessage}</p>
      
      <div class="course-list">
        <h3>Cursos:</h3>
        <ul>
          ${coursesList}
        </ul>
        ${status === 'approved' ? `<div class="total">Valor do Reembolso: R$ ${refundAmount.toFixed(2)}</div>` : ''}
      </div>
      
      ${status === 'approved' 
        ? '<p>O valor será creditado na sua conta em até 5-7 dias úteis.</p>'
        : '<p>Se você tiver alguma dúvida ou quiser mais informações, entre em contato conosco.</p>'
      }
      
      <p>Abraços,<br><strong>Equipe WebCycle</strong></p>
    `;

    const html = this.getBaseTemplate(
      status === 'approved' ? '#10b981' : '#ef4444',
      status === 'approved' ? '#059669' : '#dc2626',
      status === 'approved' ? '✅ Reembolso Aprovado!' : '❌ Reembolso Rejeitado',
      content,
      'Ver Detalhes',
      `${env.frontendUrl || 'http://localhost:5173'}/reembolsos/${refundId}`,
      status === 'approved' ? '#10b981' : '#ef4444'
    );

    await this.sendEmail({
      to: userEmail,
      subject: status === 'approved' 
        ? `Reembolso Aprovado - R$ ${refundAmount.toFixed(2)} ✅`
        : 'Reembolso Rejeitado ❌',
      html,
      trackingId,
    });
  }

  /**
   * Email de notificação genérico (para NotificationService)
   */
  async sendNotificationEmail(
    userEmail: string,
    userName: string,
    title: string,
    message: string,
    link?: string
  ): Promise<void> {
    const trackingId = uuidv4();
    const content = `
      <p>Olá <strong>${userName}</strong>,</p>
      <p>${message}</p>
      ${link ? '<p>Clique no botão abaixo para mais detalhes.</p>' : ''}
      <p>Abraços,<br><strong>Equipe WebCycle</strong></p>
    `;

    const html = this.getBaseTemplate(
      '#6366f1',
      '#4f46e5',
      title,
      content,
      link ? 'Ver Detalhes' : undefined,
      link,
      '#6366f1'
    );

    await this.sendEmail({
      to: userEmail,
      subject: title,
      html,
      trackingId,
    });
  }
}

export const emailService = new EmailService();
