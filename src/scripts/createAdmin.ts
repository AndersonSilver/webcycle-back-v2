import 'reflect-metadata';
import { AppDataSource } from '../config/database.config';
import { User, UserRole } from '../entities/User.entity';
import * as bcrypt from 'bcryptjs';

async function createAdmin() {
  try {
    // Inicializar conexão com banco
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const userRepository = AppDataSource.getRepository(User);

    // Verificar se já existe admin
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@tb-psico.com' },
    });

    if (existingAdmin) {
      console.log('⚠️  Admin já existe!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      await AppDataSource.destroy();
      return;
    }

    // Criar senha hash
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário admin
    const admin = userRepository.create({
      name: 'Administrador',
      email: 'admin@tb-psico.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      emailVerified: true,
    });

    await userRepository.save(admin);

    console.log('✅ Usuário admin criado com sucesso!');
    console.log('📧 Email: admin@tb-psico.com');
    console.log('🔑 Senha:', password);
    console.log('👤 Role: admin');
    console.log('');
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

createAdmin();

