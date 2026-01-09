# 💬 Guia Completo: Implementação de Chat de Suporte

## 📋 Visão Geral

Este documento explica como implementar um sistema de chat de suporte em tempo real usando **Socket.io** (WebSocket) no projeto TB-PSICO.

## 🏗️ Arquitetura

```
┌─────────────┐         WebSocket          ┌─────────────┐
│   Frontend  │ ←────────────────────────→ │   Backend   │
│   (React)   │    Mensagens em tempo real │  (Express)  │
└─────────────┘                            └─────────────┘
                                                    ↓
                                            ┌─────────────┐
                                            │ PostgreSQL  │
                                            │  (Mensagens)│
                                            └─────────────┘
```

## 📦 Dependências Necessárias

### Backend
```bash
npm install socket.io
npm install @types/socket.io --save-dev
```

### Frontend
```bash
npm install socket.io-client
```

## 🗄️ Estrutura do Banco de Dados

### 1. Entidade: SupportTicket (Conversa)
```typescript
- id: UUID
- userId: UUID (quem abriu)
- adminId: UUID (quem está atendendo, nullable)
- subject: string (assunto)
- status: enum ('open', 'in_progress', 'closed')
- priority: enum ('low', 'medium', 'high')
- createdAt: Date
- updatedAt: Date
- closedAt: Date (nullable)
```

### 2. Entidade: SupportMessage (Mensagens)
```typescript
- id: UUID
- ticketId: UUID (conversa)
- senderId: UUID (quem enviou)
- senderType: enum ('user', 'admin')
- content: string (texto da mensagem)
- read: boolean (foi lida?)
- readAt: Date (nullable)
- createdAt: Date
```

## 🔧 Implementação Backend

### Passo 1: Instalar Socket.io

```bash
cd TB-PSICO-BACK
npm install socket.io
npm install @types/socket.io --save-dev
```

### Passo 2: Criar Entidades

**TB-PSICO-BACK/src/entities/SupportTicket.entity.ts**
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './User.entity';
import { SupportMessage } from './SupportMessage.entity';

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  CLOSED = 'closed',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ nullable: true })
  adminId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'adminId' })
  admin?: User;

  @Column()
  subject!: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  status!: TicketStatus;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
  })
  priority!: TicketPriority;

  @OneToMany(() => SupportMessage, (message) => message.ticket)
  messages!: SupportMessage[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true })
  closedAt?: Date;
}
```

**TB-PSICO-BACK/src/entities/SupportMessage.entity.ts**
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SupportTicket } from './SupportTicket.entity';
import { User } from './User.entity';

export enum SenderType {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('support_messages')
export class SupportMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  ticketId!: string;

  @ManyToOne(() => SupportTicket, (ticket) => ticket.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticketId' })
  ticket!: SupportTicket;

  @Column()
  senderId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender!: User;

  @Column({
    type: 'enum',
    enum: SenderType,
  })
  senderType!: SenderType;

  @Column('text')
  content!: string;

  @Column({ default: false })
  read!: boolean;

  @Column({ nullable: true })
  readAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
```

### Passo 3: Configurar Socket.io no app.ts

**TB-PSICO-BACK/src/app.ts** (adicionar após criar servidor HTTP)

```typescript
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// ... código existente ...

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.frontendUrl || 'http://localhost:5173',
    credentials: true,
  },
});

// ... middlewares existentes ...

// Socket.io Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Token não fornecido'));
    }

    // Verificar token JWT (usar mesma lógica do AuthMiddleware)
    const decoded = jwt.verify(token, env.jwtSecret) as any;
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: decoded.userId },
    });

    if (!user) {
      return next(new Error('Usuário não encontrado'));
    }

    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error('Token inválido'));
  }
});

// Socket.io Connection Handler
io.on('connection', (socket) => {
  const user = socket.data.user;
  console.log(`✅ Usuário conectado: ${user.email} (${user.id})`);

  // Entrar na sala do usuário
  socket.join(`user_${user.id}`);

  // Se for admin, entrar na sala de admins
  if (user.role === 'admin') {
    socket.join('admins');
  }

  // Criar novo ticket
  socket.on('create_ticket', async (data) => {
    // Implementar criação de ticket
  });

  // Enviar mensagem
  socket.on('send_message', async (data) => {
    // Implementar envio de mensagem
  });

  // Marcar mensagens como lidas
  socket.on('mark_read', async (data) => {
    // Implementar marcação como lida
  });

  // Desconectar
  socket.on('disconnect', () => {
    console.log(`❌ Usuário desconectado: ${user.email}`);
  });
});

// ... rotas existentes ...

// Mudar de app.listen para httpServer.listen
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
```

### Passo 4: Criar Controller e Service

**TB-PSICO-BACK/src/controllers/SupportController.ts**
```typescript
import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { SupportTicket, TicketStatus } from '../entities/SupportTicket.entity';
import { SupportMessage, SenderType } from '../entities/SupportMessage.entity';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

export class SupportController {
  private router: Router;
  private ticketRepository: Repository<SupportTicket>;
  private messageRepository: Repository<SupportMessage>;

  constructor(private io: any) {
    this.router = Router();
    this.ticketRepository = AppDataSource.getRepository(SupportTicket);
    this.messageRepository = AppDataSource.getRepository(SupportMessage);
    this.setupRoutes();
  }

  private setupRoutes() {
    // Listar tickets do usuário
    this.router.get('/tickets', AuthMiddleware.authenticate, this.getMyTickets.bind(this));
    
    // Criar novo ticket
    this.router.post('/tickets', AuthMiddleware.authenticate, this.createTicket.bind(this));
    
    // Detalhes do ticket
    this.router.get('/tickets/:id', AuthMiddleware.authenticate, this.getTicket.bind(this));
    
    // Fechar ticket
    this.router.put('/tickets/:id/close', AuthMiddleware.authenticate, this.closeTicket.bind(this));
    
    // Listar mensagens do ticket
    this.router.get('/tickets/:id/messages', AuthMiddleware.authenticate, this.getMessages.bind(this));
    
    // Admin: Listar todos os tickets
    this.router.get('/admin/tickets', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, this.getAllTickets.bind(this));
    
    // Admin: Atribuir ticket
    this.router.put('/admin/tickets/:id/assign', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, this.assignTicket.bind(this));
  }

  private async getMyTickets(req: Request, res: Response) {
    try {
      const userId = (req.user as any).id;
      const tickets = await this.ticketRepository.find({
        where: { userId },
        relations: ['messages', 'admin'],
        order: { createdAt: 'DESC' },
      });
      return res.json({ tickets });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async createTicket(req: Request, res: Response) {
    try {
      const userId = (req.user as any).id;
      const { subject, priority } = req.body;

      const ticket = this.ticketRepository.create({
        userId,
        subject,
        priority: priority || 'medium',
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
        relations: ['messages', 'messages.sender', 'admin'],
      });

      if (!ticket) {
        return res.status(404).json({ message: 'Ticket não encontrado' });
      }

      // Verificar se o usuário tem acesso
      if (ticket.userId !== userId && (req.user as any).role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      return res.json({ ticket });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getMessages(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const messages = await this.messageRepository.find({
        where: { ticketId: id },
        relations: ['sender'],
        order: { createdAt: 'ASC' },
      });
      return res.json({ messages });
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
        relations: ['user', 'admin', 'messages'],
        order: { createdAt: 'DESC' },
      });

      return res.json({ tickets });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async assignTicket(req: Request, res: Response) {
    try {
      const adminId = (req.user as any).id;
      const { id } = req.params;

      const ticket = await this.ticketRepository.findOne({ where: { id } });
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
      const ticket = await this.ticketRepository.findOne({ where: { id } });
      
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket não encontrado' });
      }

      ticket.status = TicketStatus.CLOSED;
      ticket.closedAt = new Date();
      await this.ticketRepository.save(ticket);

      return res.json({ ticket });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
```

## 🎨 Implementação Frontend

### Passo 1: Instalar Socket.io Client

```bash
cd TB-PSICO-FRONT
npm install socket.io-client
```

### Passo 2: Criar Hook de Socket

**TB-PSICO-FRONT/src/hooks/useSocket.ts**
```typescript
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

export const useSocket = (token: string | null) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    // Conectar ao servidor Socket.io
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Conectado ao chat de suporte');
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Desconectado do chat de suporte');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token]);

  return socketRef.current;
};
```

### Passo 3: Criar Componente de Chat

**TB-PSICO-FRONT/src/app/components/SupportChat.tsx**
```typescript
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { apiClient } from '../../services/apiClient';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Send, MessageCircle, X } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderType: 'user' | 'admin';
  sender: {
    name: string;
    email: string;
  };
  createdAt: string;
  read: boolean;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  messages: Message[];
}

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [message, setMessage] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem('SESSION')
    ? JSON.parse(localStorage.getItem('SESSION')!).token
    : null;

  const socket = useSocket(token);

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Escutar novas mensagens
    socket.on('new_message', (data: { ticketId: string; message: Message }) => {
      if (currentTicket?.id === data.ticketId) {
        setCurrentTicket((prev) => ({
          ...prev!,
          messages: [...prev!.messages, data.message],
        }));
      }
      scrollToBottom();
    });

    // Escutar ticket atribuído
    socket.on('ticket_assigned', (ticket: Ticket) => {
      if (currentTicket?.id === ticket.id) {
        setCurrentTicket(ticket);
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('ticket_assigned');
    };
  }, [socket, currentTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [currentTicket?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTickets = async () => {
    try {
      const response = await apiClient.getMySupportTickets();
      setTickets(response.tickets || []);
    } catch (error) {
      console.error('Erro ao carregar tickets:', error);
    }
  };

  const createTicket = async () => {
    try {
      const response = await apiClient.createSupportTicket({
        subject: newTicketSubject,
      });
      setTickets([response.ticket, ...tickets]);
      setCurrentTicket(response.ticket);
      setShowNewTicket(false);
      setNewTicketSubject('');
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !currentTicket) return;

    try {
      await apiClient.sendSupportMessage(currentTicket.id, {
        content: message,
      });

      // Enviar via Socket.io também
      socket?.emit('send_message', {
        ticketId: currentTicket.id,
        content: message,
      });

      setMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const openTicket = async (ticketId: string) => {
    try {
      const response = await apiClient.getSupportTicket(ticketId);
      setCurrentTicket(response.ticket);
    } catch (error) {
      console.error('Erro ao abrir ticket:', error);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg"
          size="lg"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <h3 className="font-bold">Suporte</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-blue-700"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!currentTicket ? (
          <div className="p-4 flex-1 overflow-y-auto">
            <Button
              onClick={() => setShowNewTicket(true)}
              className="w-full mb-4"
            >
              Nova Conversa
            </Button>

            {showNewTicket && (
              <Card className="p-4 mb-4">
                <Input
                  placeholder="Assunto da conversa"
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button onClick={createTicket} size="sm">
                    Criar
                  </Button>
                  <Button
                    onClick={() => setShowNewTicket(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </Card>
            )}

            <div className="space-y-2">
              {tickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className="p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => openTicket(ticket.id)}
                >
                  <div className="font-semibold">{ticket.subject}</div>
                  <div className="text-sm text-gray-500">
                    {ticket.status === 'open' && 'Aberto'}
                    {ticket.status === 'in_progress' && 'Em atendimento'}
                    {ticket.status === 'closed' && 'Fechado'}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentTicket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.senderType === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.senderType === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <div className="text-sm font-semibold mb-1">
                      {msg.sender.name}
                    </div>
                    <div>{msg.content}</div>
                    <div className="text-xs mt-1 opacity-70">
                      {new Date(msg.createdAt).toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Digite sua mensagem..."
              />
              <Button onClick={sendMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

## 📝 Adicionar ao apiClient.ts

```typescript
// Support Chat
async getMySupportTickets() {
  return this.request<{ tickets: any[] }>('/support/tickets');
}

async createSupportTicket(data: { subject: string; priority?: string }) {
  return this.request<{ ticket: any }>('/support/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async getSupportTicket(id: string) {
  return this.request<{ ticket: any }>(`/support/tickets/${id}`);
}

async sendSupportMessage(ticketId: string, data: { content: string }) {
  return this.request<{ message: any }>(`/support/tickets/${ticketId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

## 🚀 Fluxo de Funcionamento

1. **Usuário abre chat** → Cria ticket ou seleciona existente
2. **Envia mensagem** → Salva no banco + envia via Socket.io
3. **Admin recebe** → Notificação em tempo real
4. **Admin responde** → Mensagem aparece instantaneamente para o usuário
5. **Mensagens são salvas** → Histórico completo no banco

## ✅ Vantagens desta Implementação

- ✅ **Tempo Real**: Mensagens instantâneas via WebSocket
- ✅ **Persistência**: Todas as mensagens salvas no banco
- ✅ **Escalável**: Socket.io gerencia múltiplas conexões
- ✅ **Seguro**: Autenticação JWT no Socket
- ✅ **Histórico**: Usuário vê todas as conversas anteriores

## 🔄 Próximos Passos

1. Criar migration para as entidades
2. Implementar notificações push
3. Adicionar upload de arquivos nas mensagens
4. Criar dashboard admin para gerenciar tickets
5. Adicionar métricas (tempo de resposta, satisfação)

Quer que eu implemente alguma parte específica agora?

