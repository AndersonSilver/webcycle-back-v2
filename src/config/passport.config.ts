import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import passport from 'passport';
import { AppDataSource } from './database.config';
import { User, UserRole } from '../entities/User.entity';
import { env } from './env.config';
import { emailService } from '../services/EmailService';

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: env.googleClientId,
      clientSecret: env.googleClientSecret,
      callbackURL: env.googleCallbackUrl,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const userRepository = AppDataSource.getRepository(User);

        // Verificar se usuário já existe pelo Google ID
        let user = await userRepository.findOne({
          where: { googleId: profile.id },
        });

        if (!user) {
          // Verificar se existe pelo email
          user = await userRepository.findOne({
            where: { email: profile.emails?.[0]?.value },
          });

          if (user) {
            // Atualizar usuário existente com Google ID
            user.googleId = profile.id;
            user.avatar = profile.photos?.[0]?.value || undefined;
            user.emailVerified = true;
            await userRepository.save(user);
          } else {
            // Criar novo usuário
            user = userRepository.create({
              name: profile.displayName || '',
              email: profile.emails?.[0]?.value || '',
              googleId: profile.id,
              avatar: profile.photos?.[0]?.value || undefined,
              emailVerified: true,
              role: UserRole.STUDENT,
            });
            await userRepository.save(user);
            
            // Enviar email de boas-vindas para novo usuário
            try {
              await emailService.sendWelcomeEmail(user.email, user.name);
            } catch (emailError) {
              console.error('Erro ao enviar email de boas-vindas:', emailError);
              // Não falhar o login se o email falhar
            }
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, false);
      }
    }
  )
);

// JWT Strategy - Aceita token do header Authorization OU da query string
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Primeiro tenta do header Authorization
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Se não encontrar, tenta da query string
        (req) => {
          let token = null;
          if (req && req.query && req.query.token) {
            token = req.query.token as string;
          }
          return token;
        },
      ]),
      secretOrKey: env.jwtSecret,
    },
    async (payload, done) => {
      try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
          where: { id: payload.userId },
        });

        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

export default passport;

