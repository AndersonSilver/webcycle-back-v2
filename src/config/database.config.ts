import { DataSource } from 'typeorm';
import { env } from './env.config';
import { User } from '../entities/User.entity';
import { Course } from '../entities/Course.entity';
import { Module } from '../entities/Module.entity';
import { Lesson } from '../entities/Lesson.entity';
import { Purchase } from '../entities/Purchase.entity';
import { PurchaseCourse } from '../entities/PurchaseCourse.entity';
import { Progress } from '../entities/Progress.entity';
import { Coupon } from '../entities/Coupon.entity';
import { Review } from '../entities/Review.entity';
import { CartItem } from '../entities/CartItem.entity';
import { Certificate } from '../entities/Certificate.entity';
import { Favorite } from '../entities/Favorite.entity';
import { UserNotification } from '../entities/UserNotification.entity';
import { Refund } from '../entities/Refund.entity';
import { Material } from '../entities/Material.entity';
import { ShareToken } from '../entities/ShareToken.entity';
import { Podcast } from '../entities/Podcast.entity';
import { UserPodcast } from '../entities/UserPodcast.entity';
import { NewsletterSubscriber } from '../entities/NewsletterSubscriber.entity';
import { SupportTicket } from '../entities/SupportTicket.entity';
import { SupportMessage } from '../entities/SupportMessage.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.dbHost,
  port: env.dbPort,
  username: env.dbUsername,
  password: env.dbPassword,
  database: env.dbDatabase,
  synchronize: env.dbSynchronize,
  logging: env.dbLogging,
  entities: [
    User,
    Course,
    Module,
    Lesson,
    Purchase,
    PurchaseCourse,
    Progress,
    Coupon,
    Review,
    CartItem,
    Certificate,
    Favorite,
    UserNotification,
    Refund,
    Material,
    ShareToken,
    Podcast,
    UserPodcast,
    NewsletterSubscriber,
    SupportTicket,
    SupportMessage,
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});

