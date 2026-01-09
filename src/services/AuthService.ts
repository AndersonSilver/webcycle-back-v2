import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { User, UserRole } from '../entities/User.entity';
import { RegisterDto, UpdateProfileDto } from '../dto/auth.dto';
import * as bcrypt from 'bcryptjs';
import { generateToken } from '../config/jwt.config';
import { emailService } from './EmailService';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  async register(registerDto: RegisterDto) {
    // Verificar se email já existe
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Criar usuário
    const user = this.userRepository.create({
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
      role: UserRole.STUDENT,
    });

    await this.userRepository.save(user);

    // Enviar email de boas-vindas
    try {
      await emailService.sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Erro ao enviar email de boas-vindas:', emailError);
      // Não falhar o registro se o email falhar
    }

    // Gerar token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async login(email: string, password: string) {
    // Buscar usuário
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new Error('Email ou senha inválidos');
    }

    // Verificar senha
    if (!user.password) {
      throw new Error('Este usuário foi cadastrado via Google. Use login social.');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new Error('Email ou senha inválidos');
    }

    // Gerar token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async googleLogin(googleUser: User) {
    const token = generateToken({
      userId: googleUser.id,
      email: googleUser.email,
      role: googleUser.role,
    });

    return {
      user: this.sanitizeUser(googleUser),
      token,
    };
  }

  async updateProfile(userId: string, updateData: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (updateData.name) user.name = updateData.name;
    if (updateData.avatar) user.avatar = updateData.avatar;

    await this.userRepository.save(user);
    return this.sanitizeUser(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.password) {
      throw new Error('Usuário não encontrado ou não possui senha');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Senha atual incorreta');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // Não revelar se o email existe ou não por segurança
      return;
    }

    // Gerar token de reset (em produção, usar JWT ou token seguro)
    const resetToken = uuidv4();
    // TODO: Armazenar token no banco com expiração

    await emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(_token: string, _newPassword: string) {
    // TODO: Validar token e buscar usuário
    // Por enquanto, implementação básica
    // const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Atualizar senha do usuário associado ao token
    throw new Error('Funcionalidade de reset de senha ainda não implementada completamente');
  }

  sanitizeUser(user: User): Partial<User> {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}

