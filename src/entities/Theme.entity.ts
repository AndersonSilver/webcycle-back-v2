import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('themes')
export class Theme {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ default: true })
  active!: boolean;

  // Cores principais
  @Column({ type: 'varchar', length: 7, default: '#3B82F6' })
  primary!: string; // Azul principal

  @Column({ type: 'varchar', length: 7, default: '#2563EB' })
  primaryDark!: string; // Azul escuro (hover)

  @Column({ type: 'varchar', length: 7, default: '#60A5FA' })
  primaryLight!: string; // Azul claro

  // Cores secundárias
  @Column({ type: 'varchar', length: 7, default: '#10B981' })
  secondary!: string; // Verde

  @Column({ type: 'varchar', length: 7, default: '#059669' })
  secondaryDark!: string; // Verde escuro

  // Cores de texto
  @Column({ type: 'varchar', length: 7, default: '#1F2937' })
  textPrimary!: string; // Texto principal

  @Column({ type: 'varchar', length: 7, default: '#6B7280' })
  textSecondary!: string; // Texto secundário

  // Cores de fundo
  @Column({ type: 'varchar', length: 7, default: '#FFFFFF' })
  background!: string; // Fundo principal

  @Column({ type: 'varchar', length: 7, default: '#F9FAFB' })
  backgroundSecondary!: string; // Fundo secundário

  // Cores de borda
  @Column({ type: 'varchar', length: 7, default: '#E5E7EB' })
  border!: string; // Borda padrão

  // Cores de destaque
  @Column({ type: 'varchar', length: 7, default: '#F59E0B' })
  accent!: string; // Amarelo/laranja

  @Column({ type: 'varchar', length: 7, default: '#EF4444' })
  danger!: string; // Vermelho (erros, deletar)

  @Column({ type: 'varchar', length: 7, default: '#10B981' })
  success!: string; // Verde (sucesso)

  @Column({ type: 'varchar', length: 7, default: '#6366F1' })
  info!: string; // Roxo (informações)

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

