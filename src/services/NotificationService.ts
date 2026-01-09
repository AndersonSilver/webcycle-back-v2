import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { UserNotification, NotificationType } from '../entities/UserNotification.entity';
import { User } from '../entities/User.entity';
import { CreateNotificationDto } from '../dto/notification.dto';
import { emailService } from './EmailService';

export class NotificationService {
  private notificationRepository: Repository<UserNotification>;
  private userRepository: Repository<User>;

  constructor() {
    this.notificationRepository = AppDataSource.getRepository(UserNotification);
    this.userRepository = AppDataSource.getRepository(User);
  }

  async createNotification(data: CreateNotificationDto) {
    const notification = this.notificationRepository.create(data);
    const savedNotification = await this.notificationRepository.save(notification);

    // Enviar email se configurado
    const user = await this.userRepository.findOne({ where: { id: data.userId } });
    if (user) {
      await emailService.sendNotificationEmail(
        user.email,
        user.name,
        data.title,
        data.message,
        data.link
      );
    }

    return savedNotification;
  }

  async createNotificationForUser(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string
  ) {
    return this.createNotification({
      userId,
      type,
      title,
      message,
      link,
    });
  }

  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    const where: any = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    return this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notificação não encontrada');
    }

    notification.read = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      { userId, read: false },
      { read: true }
    );
  }

  async deleteNotification(notificationId: string, userId: string) {
    const result = await this.notificationRepository.delete({
      id: notificationId,
      userId,
    });

    if (result.affected === 0) {
      throw new Error('Notificação não encontrada');
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, read: false },
    });
  }
}

