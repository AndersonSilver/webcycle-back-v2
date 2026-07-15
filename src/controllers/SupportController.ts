import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { SupportTicket, TicketStatus, TicketPriority } from '../entities/SupportTicket.entity';
import { SupportMessage, SenderType } from '../entities/SupportMessage.entity';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { validateDto } from '../middleware/ValidationMiddleware';
import { CreateTicketDto, SendMessageDto } from '../dto/support.dto';
import { Server as SocketIOServer } from 'socket.io';

export class SupportController {
  private router: Router;
  private ticketRepository: Repository<SupportTicket>;
  private messageRepository: Repository<SupportMessage>;
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.router = Router();
    this.io = io;
    this.ticketRepository = AppDataSource.getRepository(SupportTicket);
    this.messageRepository = AppDataSource.getRepository(SupportMessage);
    this.setupRoutes();
    this.setupSocketHandlers();
  }

  private setupRoutes() {
    // Listar tickets do usuário
    this.router.get('/tickets', AuthMiddleware.authenticate, this.getMyTickets.bind(this));
    
    // Criar novo ticket
    this.router.post('/tickets', AuthMiddleware.authenticate, validateDto(CreateTicketDto), this.createTicket.bind(this));
    
    // Detalhes do ticket
    this.router.get('/tickets/:id', AuthMiddleware.authenticate, this.getTicket.bind(this));
    
    // Fechar ticket
    this.router.put('/tickets/:id/close', AuthMiddleware.authenticate, this.closeTicket.bind(this));
    
    // Listar mensagens do ticket
    this.router.get('/tickets/:id/messages', AuthMiddleware.authenticate, this.getMessages.bind(this));
    
    // Enviar mensagem
    this.router.post('/tickets/:id/messages', AuthMiddleware.authenticate, validateDto(SendMessageDto), this.sendMessage.bind(this));
    
    // Admin: Listar todos os tickets
    this.router.get('/admin/tickets', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, this.getAllTickets.bind(this));
    
    // Admin: Atribuir ticket
    this.router.put('/admin/tickets/:id/assign', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, this.assignTicket.bind(this));
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      const user = (socket as any).data.user;
      if (!user) return;

      console.log(`✅ Usuário conectado ao chat: ${user.email} (${user.id})`);

      // Entrar na sala do usuário
      socket.join(`user_${user.id}`);

      // Se for admin, entrar na sala de admins
      if (user.role === 'admin') {
        socket.join('admins');
        console.log(`👨‍💼 Admin conectado: ${user.email}`);
      }

      // Enviar mensagem via Socket
      socket.on('send_message', async (data: { ticketId: string; content: string }) => {
        try {
          const ticket = await this.ticketRepository.findOne({
            where: { id: data.ticketId },
            relations: ['user'],
          });

          if (!ticket) {
            socket.emit('error', { message: 'Ticket não encontrado' });
            return;
          }

          // Verificar acesso
          if (ticket.userId !== user.id && user.role !== 'admin') {
            socket.emit('error', { message: 'Acesso negado' });
            return;
          }

          // Criar mensagem
          const message = this.messageRepository.create({
            ticketId: data.ticketId,
            senderId: user.id,
            senderType: user.role === 'admin' ? SenderType.ADMIN : SenderType.USER,
            content: data.content,
            read: false,
          });

          const savedMessage = await this.messageRepository.save(message);

          // Carregar mensagem com sender
          const messageWithSender = await this.messageRepository.findOne({
            where: { id: savedMessage.id },
            relations: ['sender'],
          });

          // Atualizar timestamp do ticket
          ticket.updatedAt = new Date();
          await this.ticketRepository.save(ticket);

          // Garantir que a data seja retornada em UTC com timezone
          const messageWithUTC = {
            ...messageWithSender,
            createdAt: messageWithSender!.createdAt instanceof Date 
              ? messageWithSender!.createdAt.toISOString() 
              : messageWithSender!.createdAt,
          };

          // Enviar para o usuário do ticket
          this.io.to(`user_${ticket.userId}`).emit('new_message', {
            ticketId: data.ticketId,
            message: messageWithUTC,
          });

          // Se admin enviou, notificar usuário
          if (user.role === 'admin') {
            this.io.to(`user_${ticket.userId}`).emit('ticket_updated', {
              ticketId: data.ticketId,
              message: 'Novo atendimento recebido',
            });
            // Também enviar para admins
            this.io.to('admins').emit('new_message', {
              ticketId: data.ticketId,
              message: messageWithUTC,
            });
          }

          // Se usuário enviou, notificar admins
          if (user.role !== 'admin') {
            this.io.to('admins').emit('new_message', {
              ticketId: data.ticketId,
              message: messageWithUTC,
            });
          }
        } catch (error: any) {
          console.error('Erro ao enviar mensagem via Socket:', error);
          socket.emit('error', { message: 'Erro ao enviar mensagem' });
        }
      });

      // Marcar mensagens como lidas
      socket.on('mark_read', async (data: { ticketId: string }) => {
        try {
          console.log(`\n📖 [MARK_READ] Recebido evento mark_read:`);
          console.log(`   - Ticket ID: ${data.ticketId}`);
          console.log(`   - Usuário: ${user.email} (${user.id})`);
          console.log(`   - Role: ${user.role}`);
          
          // Quando admin marca como lido: marca mensagens do USUÁRIO
          // Quando usuário marca como lido: marca mensagens do ADMIN
          const targetSenderType = user.role === 'admin' ? SenderType.USER : SenderType.ADMIN;
          console.log(`   - Target Sender Type: ${targetSenderType}`);
          
          // Buscar as mensagens não lidas usando query builder para evitar problemas com enum
          const unreadMessages = await this.messageRepository
            .createQueryBuilder('message')
            .where('message.ticketId = :ticketId', { ticketId: data.ticketId })
            .andWhere('message.read = :read', { read: false })
            .andWhere('message.senderType = :senderType', { senderType: targetSenderType })
            .getMany();
          
          console.log(`   - Mensagens não lidas encontradas: ${unreadMessages.length}`);
          if (unreadMessages.length > 0) {
            console.log(`   - Detalhes das mensagens:`, unreadMessages.map(m => ({
              id: m.id,
              senderType: m.senderType,
              read: m.read,
              content: m.content.substring(0, 50) + '...',
            })));
          }
          
          if (unreadMessages.length === 0) {
            console.log(`   ⚠️ Nenhuma mensagem não lida para marcar`);
            return;
          }
          
          // Marcar cada mensagem como lida usando save (mais confiável)
          const readAt = new Date();
          let updatedCount = 0;
          for (const message of unreadMessages) {
            message.read = true;
            message.readAt = readAt;
            await this.messageRepository.save(message);
            updatedCount++;
          }
          
          console.log(`   ✅ ${updatedCount} mensagens marcadas como lidas usando save()`);
          
          // Verificar se realmente foram atualizadas usando query builder
          const remainingUnread = await this.messageRepository
            .createQueryBuilder('message')
            .where('message.ticketId = :ticketId', { ticketId: data.ticketId })
            .andWhere('message.read = :read', { read: false })
            .andWhere('message.senderType = :senderType', { senderType: targetSenderType })
            .getCount();
          
          console.log(`   - Mensagens não lidas após atualização: ${remainingUnread}`);
          
          if (remainingUnread > 0) {
            console.log(`   ⚠️ ATENÇÃO: Ainda existem ${remainingUnread} mensagens não lidas após atualização!`);
          }
          
          // Notificar admins que as mensagens foram marcadas como lidas
          if (user.role === 'admin') {
            console.log(`   📢 Emitindo messages_read para admins`);
            this.io.to('admins').emit('messages_read', { ticketId: data.ticketId });
            // Também notificar o usuário do ticket
            const ticket = await this.ticketRepository.findOne({ where: { id: data.ticketId } });
            if (ticket) {
              console.log(`   📢 Emitindo messages_read para user_${ticket.userId}`);
              this.io.to(`user_${ticket.userId}`).emit('messages_read', { ticketId: data.ticketId });
            }
          }
          console.log(`\n`);
        } catch (error) {
          console.error('❌ Erro ao marcar como lida:', error);
          console.error('❌ Stack:', (error as Error).stack);
        }
      });

      // Desconectar
      socket.on('disconnect', () => {
        console.log(`❌ Usuário desconectado do chat: ${user.email}`);
      });
    });
  }

  private async getMyTickets(req: Request, res: Response) {
    try {
      const userId = (req.user as any).id;
      const tickets = await this.ticketRepository.find({
        where: { userId },
        relations: ['admin'],
        order: { createdAt: 'DESC' },
      });
      
      // Garantir que as datas sejam retornadas em UTC com timezone
      const ticketsWithUTC = tickets.map((ticket: any) => ({
        ...ticket,
        createdAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : ticket.createdAt,
        updatedAt: ticket.updatedAt instanceof Date ? ticket.updatedAt.toISOString() : ticket.updatedAt,
      }));
      
      return res.json({ tickets: ticketsWithUTC });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async createTicket(req: Request, res: Response) {
    try {
      const userId = (req.user as any).id;
      const { subject, priority } = req.body as CreateTicketDto;

      const ticket = this.ticketRepository.create({
        userId,
        subject,
        priority: (priority || TicketPriority.MEDIUM) as TicketPriority,
        status: TicketStatus.OPEN,
      });

      const savedTicket = await this.ticketRepository.save(ticket);

      // Notificar admins via Socket.io
      this.io.to('admins').emit('new_ticket', savedTicket);

      return res.status(201).json({ ticket: savedTicket });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getTicket(req: Request, res: Response) {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;

      const ticket = await this.ticketRepository.findOne({
        where: { id },
        relations: ['messages', 'messages.sender', 'admin', 'user'],
      });

      if (!ticket) {
        return res.status(404).json({ message: 'Ticket não encontrado' });
      }

      // Verificar se o usuário tem acesso
      if (ticket.userId !== userId && (req.user as any).role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      // Garantir que as datas sejam retornadas em UTC com timezone
      const ticketWithUTC = {
        ...ticket,
        createdAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : ticket.createdAt,
        updatedAt: ticket.updatedAt instanceof Date ? ticket.updatedAt.toISOString() : ticket.updatedAt,
        messages: ticket.messages?.map((msg: any) => ({
          ...msg,
          createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt,
          read: msg.read !== undefined ? msg.read : false,
        })),
      };

      return res.json({ ticket: ticketWithUTC });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getMessages(req: Request, res: Response) {
    try {
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;
      const { id } = req.params;

      const ticket = await this.ticketRepository.findOne({ where: { id } });
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket não encontrado' });
      }
      if (ticket.userId !== userId && userRole !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const messages = await this.messageRepository.find({
        where: { ticketId: id },
        relations: ['sender'],
        order: { createdAt: 'ASC' },
      });
      
      // Garantir que as datas sejam retornadas em UTC com timezone e incluir propriedade read
      const messagesWithUTC = messages.map((msg: any) => ({
        ...msg,
        createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt,
        read: msg.read !== undefined ? msg.read : false,
      }));
      
      return res.json({ messages: messagesWithUTC });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async sendMessage(req: Request, res: Response) {
    try {
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;
      const { id } = req.params;
      const { content } = req.body as SendMessageDto;

      const ticket = await this.ticketRepository.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!ticket) {
        return res.status(404).json({ message: 'Ticket não encontrado' });
      }

      // Verificar acesso
      if (ticket.userId !== userId && userRole !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      // Criar mensagem
      const message = this.messageRepository.create({
        ticketId: id,
        senderId: userId,
        senderType: userRole === 'admin' ? SenderType.ADMIN : SenderType.USER,
        content,
        read: false,
      });

      const savedMessage = await this.messageRepository.save(message);

      // Carregar mensagem com sender
      const messageWithSender = await this.messageRepository.findOne({
        where: { id: savedMessage.id },
        relations: ['sender'],
      });

      // Atualizar timestamp do ticket
      ticket.updatedAt = new Date();
      if (ticket.status === TicketStatus.OPEN && userRole === 'admin') {
        ticket.status = TicketStatus.IN_PROGRESS;
      }
      await this.ticketRepository.save(ticket);

      // Garantir que a data seja retornada em UTC com timezone e incluir propriedade read
      const messageWithUTC = {
        ...messageWithSender,
        createdAt: messageWithSender!.createdAt instanceof Date 
          ? messageWithSender!.createdAt.toISOString() 
          : messageWithSender!.createdAt,
        read: messageWithSender!.read !== undefined ? messageWithSender!.read : false,
      };

      // Enviar via Socket.io
      // Sempre enviar para o usuário do ticket
      this.io.to(`user_${ticket.userId}`).emit('new_message', {
        ticketId: id,
        message: messageWithUTC,
      });

      // Se admin enviou, também enviar para a sala de admins (incluindo o próprio admin)
      if (userRole === 'admin') {
        this.io.to('admins').emit('new_message', {
          ticketId: id,
          message: messageWithUTC,
        });
      } else {
        // Se usuário enviou, notificar admins
        this.io.to('admins').emit('new_message', {
          ticketId: id,
          message: messageWithUTC,
        });
      }

      return res.status(201).json({ message: messageWithUTC });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getAllTickets(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const where: any = {};
      if (status) {
        where.status = status;
      }

      const tickets = await this.ticketRepository.find({
        where,
        relations: ['user', 'admin', 'messages', 'messages.sender'],
        order: { createdAt: 'DESC' },
      });

      // Garantir que as datas sejam retornadas em UTC com timezone e incluir propriedade read das mensagens
      const ticketsWithUTC = tickets.map((ticket: any) => ({
        ...ticket,
        createdAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : ticket.createdAt,
        updatedAt: ticket.updatedAt instanceof Date ? ticket.updatedAt.toISOString() : ticket.updatedAt,
        messages: ticket.messages?.map((msg: any) => ({
          ...msg,
          createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt,
          read: msg.read !== undefined ? msg.read : false, // Garantir que read sempre existe
        })) || [],
      }));

      return res.json({ tickets: ticketsWithUTC });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async assignTicket(req: Request, res: Response) {
    try {
      const adminId = (req.user as any).id;
      const { id } = req.params;

      const ticket = await this.ticketRepository.findOne({ 
        where: { id },
        relations: ['user'],
      });
      
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket não encontrado' });
      }

      ticket.adminId = adminId;
      ticket.status = TicketStatus.IN_PROGRESS;
      await this.ticketRepository.save(ticket);

      // Notificar usuário via Socket.io
      this.io.to(`user_${ticket.userId}`).emit('ticket_assigned', ticket);

      return res.json({ ticket });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async closeTicket(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const ticket = await this.ticketRepository.findOne({ 
        where: { id },
        relations: ['user'],
      });
      
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket não encontrado' });
      }

      ticket.status = TicketStatus.CLOSED;
      ticket.closedAt = new Date();
      await this.ticketRepository.save(ticket);

      // Notificar via Socket.io
      this.io.to(`user_${ticket.userId}`).emit('ticket_closed', ticket);

      return res.json({ ticket });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

