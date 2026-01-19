import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('home_page_content')
export class HomePageContent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Hero Section
  @Column('jsonb', { nullable: true })
  hero?: {
    badge: string;
    title: string;
    subtitle: string;
    primaryButton: { text: string; action: string };
    secondaryButton: { text: string; action: string };
  };

  // Carousel Images
  @Column('jsonb', { nullable: true })
  carousel?: Array<{
    id: string;
    url: string;
    alt: string;
    order: number;
  }>;

  // Why Choose Us Section
  @Column('jsonb', { nullable: true })
  whyChooseUs?: {
    badge: string;
    title: string;
    subtitle: string;
    cards: Array<{
      icon: string;
      title: string;
      description: string;
      gradientColors: { from: string; to: string };
    }>;
  };

  // Testimonials Section
  @Column('jsonb', { nullable: true })
  testimonials?: {
    badge: string;
    title: string;
    subtitle: string;
  };

  // Newsletter Section
  @Column('jsonb', { nullable: true })
  newsletter?: {
    title: string;
    subtitle: string;
    features: Array<{ text: string }>;
  };

  // CTA Section
  @Column('jsonb', { nullable: true })
  cta?: {
    badge: string;
    title: string;
    subtitle: string;
    primaryButton: { text: string; action: string };
    secondaryButton: { text: string; action: string };
    benefitCards: Array<{
      icon: string;
      title: string;
      subtitle: string;
      iconColor: string;
    }>;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

