import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Certificate } from '../entities/Certificate.entity';
import { Course } from '../entities/Course.entity';
import { Purchase, PaymentStatus } from '../entities/Purchase.entity';
import { Progress } from '../entities/Progress.entity';
import { v4 as uuidv4 } from 'uuid';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

export class CertificateService {
  private certificateRepository: Repository<Certificate>;
  private courseRepository: Repository<Course>;
  private purchaseRepository: Repository<Purchase>;
  private progressRepository: Repository<Progress>;

  constructor() {
    this.certificateRepository = AppDataSource.getRepository(Certificate);
    this.courseRepository = AppDataSource.getRepository(Course);
    this.purchaseRepository = AppDataSource.getRepository(Purchase);
    this.progressRepository = AppDataSource.getRepository(Progress);
  }

  async generateCertificate(userId: string, courseId: string) {
    // Verificar se usuário completou o curso
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['modules', 'modules.lessons'],
    });

    if (!course) {
      throw new Error('Curso não encontrado');
    }

    // Verificar se usuário comprou o curso
    const purchase = await this.purchaseRepository
      .createQueryBuilder('purchase')
      .innerJoin('purchase.courses', 'pc')
      .where('purchase.userId = :userId', { userId })
      .andWhere('pc.courseId = :courseId', { courseId })
      .andWhere('purchase.paymentStatus = :status', { status: PaymentStatus.PAID })
      .getOne();

    if (!purchase) {
      throw new Error('Você precisa comprar o curso para gerar o certificado');
    }

    // Verificar se todas as aulas foram concluídas
    const totalLessons = course.modules.reduce(
      (acc, module) => acc + module.lessons.length,
      0
    );

    // Buscar todas as aulas do curso
    const allLessonIds = course.modules.flatMap((module) =>
      module.lessons.map((lesson) => lesson.id)
    );

    // Verificar se todas foram concluídas
    const allCompleted = await Promise.all(
      allLessonIds.map(async (lessonId) => {
        const progress = await this.progressRepository.findOne({
          where: { userId, lessonId, completed: true },
        });
        return !!progress;
      })
    );

    const allLessonsCompleted = allCompleted.every((completed) => completed);

    if (!allLessonsCompleted || totalLessons === 0) {
      throw new Error('Você precisa completar todas as aulas para gerar o certificado');
    }

    // Verificar se já existe certificado
    const existingCertificate = await this.certificateRepository.findOne({
      where: { userId, courseId },
    });

    if (existingCertificate) {
      return existingCertificate;
    }

    // Gerar código único
    const verificationCode = uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();
    const certificateNumber = `CERT-${Date.now()}-${verificationCode.substring(0, 8)}`;

    // Criar certificado (pdfUrl será gerado depois)
    const certificate = this.certificateRepository.create({
      userId,
      courseId,
      verificationCode,
      certificateNumber,
      pdfUrl: '', // Será gerado quando necessário
      issuedAt: new Date(),
    });

    return this.certificateRepository.save(certificate);
  }

  async getUserCertificates(userId: string) {
    return this.certificateRepository.find({
      where: { userId },
      relations: ['course'],
      order: { issuedAt: 'DESC' },
    });
  }

  async getCertificateById(certificateId: string, userId: string) {
    const certificate = await this.certificateRepository.findOne({
      where: { id: certificateId, userId },
      relations: ['course', 'user'],
    });

    if (!certificate) {
      throw new Error('Certificado não encontrado');
    }

    return certificate;
  }

  async verifyCertificate(verificationCode: string) {
    const certificate = await this.certificateRepository.findOne({
      where: { verificationCode },
      relations: ['course', 'user'],
    });

    if (!certificate) {
      throw new Error('Certificado não encontrado');
    }

    return {
      valid: true,
      certificate: {
        id: certificate.id,
        courseTitle: certificate.course.title,
        userName: certificate.user.name,
        issuedAt: certificate.issuedAt,
      },
    };
  }

  async generatePDF(certificateId: string, userId: string): Promise<Buffer> {
    const certificate = await this.getCertificateById(certificateId, userId);
    
    // Buscar curso com módulos e aulas para calcular duração
    const course = await this.courseRepository.findOne({
      where: { id: certificate.courseId },
      relations: ['modules', 'modules.lessons'],
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 30, bottom: 30, left: 30, right: 30 },
        autoFirstPage: true,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 30;

      // Cores
      const goldColor = '#D4AF37';
      const darkBlueColor = '#1a365d';
      const borderColor = '#B8860B';

      // ========== BORDA DECORATIVA ==========
      // Borda externa dourada
      doc.lineWidth(4);
      doc.strokeColor(borderColor);
      doc.rect(margin - 10, margin - 10, pageWidth - 2 * (margin - 10), pageHeight - 2 * (margin - 10));
      doc.stroke();

      // Borda interna
      doc.lineWidth(2);
      doc.strokeColor(goldColor);
      doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);
      doc.stroke();

      // Decorações nos cantos (círculos decorativos menores)
      const cornerRadius = 10;
      const cornerOffset = 20;

      doc.fillColor(goldColor);
      // Canto superior esquerdo
      doc.circle(margin + cornerOffset, margin + cornerOffset, cornerRadius).fill();
      // Canto superior direito
      doc.circle(pageWidth - margin - cornerOffset, margin + cornerOffset, cornerRadius).fill();
      // Canto inferior esquerdo
      doc.circle(margin + cornerOffset, pageHeight - margin - cornerOffset, cornerRadius).fill();
      // Canto inferior direito
      doc.circle(pageWidth - margin - cornerOffset, pageHeight - margin - cornerOffset, cornerRadius).fill();

      // ========== TÍTULO PRINCIPAL (CENTRALIZADO À ESQUERDA) ==========
      const titleX = 250; // Posição mais à esquerda
      const titleY = margin + 50;
      
      doc.fontSize(46)
        .fillColor(darkBlueColor)
        .font('Helvetica-Bold')
        .text('CERTIFICADO', 265, titleY, {
          width: pageWidth - 2 * margin - 200, // Largura total menos espaço do selo
        });

      doc.fontSize(28)
        .fillColor(goldColor)
        .font('Helvetica-Bold')
        .text('DE CONCLUSÃO', 310, titleY + 60, {
          width: pageWidth - 2 * margin - 200,
        });

      // Linha decorativa abaixo do título com pontos
      const lineY = titleY + 125;
      doc.lineWidth(2.5);
      doc.strokeColor(goldColor);
      doc.moveTo(titleX + 110, lineY)
        .lineTo(titleX + 230, lineY)
        .stroke();

      // Pontos decorativos
      doc.fillColor(goldColor);
      doc.circle(titleX + 110, lineY, 5).fill();
      doc.circle(titleX + 230, lineY, 5).fill();

      // ========== TEXTO DE CERTIFICAÇÃO ==========
      const certTextY = lineY + 40;
      doc.fontSize(16)
        .fillColor('#333333')
        .font('Helvetica')
        .text('A plataforma PSICO certifica que', titleX + 60, certTextY, {
          width: pageWidth - 2 * margin - 200,
        });

      // ========== NOME DO ALUNO (DESTAQUE) ==========
      const nameY = certTextY + 60;
      doc.fontSize(34)
        .fillColor(darkBlueColor)
        .font('Helvetica-Bold')
        .text(certificate.user.name.toUpperCase(), titleX - 85, nameY, {
          width: pageWidth - 2 * margin - 200,
        });

      // Linha decorativa abaixo do nome
      const nameLineY = nameY + 60;
      doc.lineWidth(2.5);
      doc.strokeColor(goldColor);
      doc.moveTo(titleX, nameLineY)
        .lineTo(titleX + 360, nameLineY)
        .stroke();

      // Pontos decorativos
      doc.fillColor(goldColor);
      doc.circle(titleX, nameLineY, 5).fill();
      doc.circle(titleX + 360, nameLineY, 5).fill();

      // ========== DETALHES DO CURSO ==========
      const courseTextY = nameLineY + 40;
      doc.fontSize(16)
        .fillColor('#333333')
        .font('Helvetica')
        .text('concluiu com êxito o curso', titleX + 60, courseTextY, {
          width: pageWidth - 2 * margin - 200,
        });

      const courseTitleY = courseTextY + 35;
      doc.fontSize(22)
        .fillColor(darkBlueColor)
        .font('Helvetica-Bold')
        .text(certificate.course.title, titleX + 10, courseTitleY, {
          width: pageWidth - 2 * margin - 200,
        });

      // Informações adicionais do curso
      const totalLessons = course
        ? course.modules.reduce((acc, module) => acc + module.lessons.length, 0)
        : certificate.course.lessons || 0;

      const courseDuration = certificate.course.duration || 'Não especificada';

      const courseInfoY = courseTitleY + 38;
      doc.fontSize(13)
        .fillColor('#555555')
        .font('Helvetica')
        .text(
          `com carga horária total de ${courseDuration} e ${totalLessons} ${totalLessons === 1 ? 'aula' : 'aulas'}`,
          titleX + 40,
          courseInfoY,
          {
            width: pageWidth - 2 * margin - 200,
          }
        );

      // Data de emissão
      const issueDate = certificate.issuedAt.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      const dateY = courseInfoY + 35;
      doc.fontSize(14)
        .fillColor('#666666')
        .font('Helvetica')
        .text(`Emitido em ${issueDate}`, titleX + 50, dateY, {
          width: pageWidth - 2 * margin - 200,
        });

      // ========== SELO OFICIAL (posicionado no canto superior direito) ==========
      const sealX = pageWidth - margin - 60;
      const sealY = margin + 80;
      const sealRadius = 35;

      // Círculo externo do selo
      doc.lineWidth(3);
      doc.strokeColor(borderColor);
      doc.circle(sealX, sealY, sealRadius).stroke();

      // Círculo interno
      doc.lineWidth(2);
      doc.strokeColor(goldColor);
      doc.circle(sealX, sealY, sealRadius - 5).stroke();


      // Estrelas no selo (3 estrelas em triângulo)
      doc.fillColor(goldColor);
      const starRadius = sealRadius - 15;
      doc.circle(sealX, sealY - starRadius, 3).fill(); // Topo
      doc.circle(sealX - starRadius * 0.866, sealY + starRadius * 0.5, 3).fill(); // Esquerda inferior
      doc.circle(sealX + starRadius * 0.866, sealY + starRadius * 0.5, 3).fill(); // Direita inferior


      // ========== CÓDIGO DE VERIFICAÇÃO (canto inferior direito) ==========
      const codeY = pageHeight - margin - 70;
      const codeX = pageWidth - margin - 240;
      
      doc.fontSize(9)
        .fillColor('#999999')
        .font('Helvetica')
        .text(`Código de Verificação: ${certificate.verificationCode}`, codeX, codeY, {
          width: 240,
        });

      doc.fontSize(8)
        .fillColor('#999999')
        .font('Helvetica')
        .text(`Número do Certificado: ${certificate.certificateNumber}`, codeX, codeY + 12, {
          width: 240,
        });

      doc.end();
    });
  }
}

