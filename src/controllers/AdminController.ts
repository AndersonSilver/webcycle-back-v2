import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Purchase, PaymentStatus } from '../entities/Purchase.entity';
import { User, UserRole } from '../entities/User.entity';
import { Course } from '../entities/Course.entity';
import { Material } from '../entities/Material.entity';
import { Module } from '../entities/Module.entity';
import { Lesson } from '../entities/Lesson.entity';
import { Progress } from '../entities/Progress.entity';
import { UserNotification } from '../entities/UserNotification.entity';
import { SaleNotificationRecipient } from '../entities/SaleNotificationRecipient.entity';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { validateDto } from '../middleware/ValidationMiddleware';
import { UpdateSaleNotificationSettingsDto } from '../dto/sale-notification.dto';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Configurar Multer para uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

export class AdminController {
  private router: Router;
  private purchaseRepository: Repository<Purchase>;
  private userRepository: Repository<User>;
  private courseRepository: Repository<Course>;
  private materialRepository: Repository<Material>;
  private moduleRepository: Repository<Module>;
  private lessonRepository: Repository<Lesson>;
  private progressRepository: Repository<Progress>;
  private notificationRepository: Repository<UserNotification>;
  private saleNotificationRepository: Repository<SaleNotificationRecipient>;

  constructor() {
    this.router = Router();
    this.purchaseRepository = AppDataSource.getRepository(Purchase);
    this.userRepository = AppDataSource.getRepository(User);
    this.courseRepository = AppDataSource.getRepository(Course);
    this.materialRepository = AppDataSource.getRepository(Material);
    this.moduleRepository = AppDataSource.getRepository(Module);
    this.lessonRepository = AppDataSource.getRepository(Lesson);
    this.progressRepository = AppDataSource.getRepository(Progress);
    this.notificationRepository = AppDataSource.getRepository(UserNotification);
    this.saleNotificationRepository = AppDataSource.getRepository(SaleNotificationRecipient);
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.use(AuthMiddleware.authenticate);
    this.router.use(AuthMiddleware.requireAdmin);

    // Dashboard básico
    this.router.get('/dashboard', this.getDashboard.bind(this));
    this.router.get('/dashboard/sales-chart', this.getSalesChart.bind(this));
    this.router.get('/dashboard/revenue-chart', this.getRevenueChart.bind(this));
    this.router.get('/dashboard/students-chart', this.getStudentsChart.bind(this));
    this.router.get('/dashboard/payment-methods-chart', this.getPaymentMethodsChart.bind(this));

    // Analytics
    this.router.get('/revenue', this.getRevenue.bind(this));
    this.router.get('/analytics/overview', this.getAnalyticsOverview.bind(this));
    this.router.get('/analytics/student-progress', this.getStudentProgress.bind(this));

    // Exportação
    this.router.post('/export/purchases', this.exportPurchases.bind(this));
    this.router.post('/export/students', this.exportStudents.bind(this));
    this.router.post('/export/courses', this.exportCourses.bind(this));

    // Uploads
    this.router.post('/courses/:courseId/upload-video', upload.single('video') as any, this.uploadVideo.bind(this));
    this.router.post('/courses/:courseId/upload-image', upload.single('image') as any, this.uploadImage.bind(this));
    this.router.post('/courses/:courseId/upload-material', upload.single('material') as any, this.uploadMaterial.bind(this));

    // Materiais
    this.router.get('/courses/:courseId/materials', this.getCourseMaterials.bind(this));
    this.router.delete('/courses/:courseId/materials/:materialId', this.deleteMaterial.bind(this));

    // Utilitários
    this.router.put('/courses/:courseId/reorder-modules', this.reorderModules.bind(this));
    this.router.post('/courses/:courseId/duplicate', this.duplicateCourse.bind(this));

    // Notificações
    this.router.get('/notifications', this.getNotifications.bind(this));
    this.router.put('/notifications/:id/read', this.markNotificationRead.bind(this));
    this.router.put('/notifications/read-all', this.markAllNotificationsRead.bind(this));

    // Listagens básicas
    this.router.get('/students', this.getStudents.bind(this));
    this.router.get('/purchases', this.getPurchases.bind(this));

    // Configurações de email de vendas
    this.router.get('/sale-email-settings', this.getSaleEmailSettings.bind(this));
    this.router.put('/sale-email-settings', validateDto(UpdateSaleNotificationSettingsDto), this.updateSaleEmailSettings.bind(this));
  }

  private async getSaleEmailSettings(_req: Request, res: Response) {
    try {
      const recipients = await this.saleNotificationRepository.find({
        order: { createdAt: 'ASC' },
      });

      const active = recipients.length === 0 ? true : recipients.every((item) => item.active);

      return res.json({
        active,
        recipients: recipients.map((item) => ({
          email: item.email,
          createdAt: item.createdAt,
        })),
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async updateSaleEmailSettings(req: Request, res: Response) {
    try {
      const updateData: UpdateSaleNotificationSettingsDto = req.body;

      const normalizedEmails = Array.from(
        new Set(
          (updateData.recipientEmails || [])
            .map((email) => email.trim().toLowerCase())
            .filter((email) => email.length > 0)
        )
      );

      const existingRecipients = await this.saleNotificationRepository.find();
      const existingEmails = new Set(existingRecipients.map((item) => item.email));

      const recipientsToAdd = normalizedEmails.filter((email) => !existingEmails.has(email));
      const recipientsToKeep = new Set(normalizedEmails);

      if (recipientsToAdd.length > 0) {
        const newRecipients = recipientsToAdd.map((email) =>
          this.saleNotificationRepository.create({
            email,
            active: updateData.active !== undefined ? updateData.active : true,
          })
        );
        await this.saleNotificationRepository.save(newRecipients);
      }

      const recipientsToRemove = existingRecipients.filter((item) => !recipientsToKeep.has(item.email));
      if (recipientsToRemove.length > 0) {
        await this.saleNotificationRepository.remove(recipientsToRemove);
      }

      if (updateData.active !== undefined) {
        await this.saleNotificationRepository
          .createQueryBuilder()
          .update(SaleNotificationRecipient)
          .set({ active: updateData.active })
          .execute();
      }

      const updatedRecipients = await this.saleNotificationRepository.find({
        order: { createdAt: 'ASC' },
      });

      return res.json({
        message: 'Configurações de email de vendas atualizadas',
        settings: {
          active: updatedRecipients.length === 0 ? true : updatedRecipients.every((item) => item.active),
          recipients: updatedRecipients.map((item) => ({
            email: item.email,
            createdAt: item.createdAt,
          })),
        },
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getDashboard(_req: Request, res: Response) {
    try {
      const purchases = await this.purchaseRepository.find({
        where: { paymentStatus: PaymentStatus.PAID },
      });

      // Garantir que finalAmount seja convertido para número
      const totalRevenue = purchases.reduce((sum, p) => {
        const finalAmount = typeof p.finalAmount === 'string' 
          ? parseFloat(p.finalAmount) 
          : (typeof p.finalAmount === 'number' ? p.finalAmount : 0);
        return sum + Number(finalAmount);
      }, 0);
      
      const totalSales = purchases.length;
      const totalStudents = await this.userRepository.count({
        where: { role: UserRole.STUDENT },
      });
      const totalCourses = await this.courseRepository.count({ where: { active: true } });

      res.json({
        totalRevenue: Number(totalRevenue.toFixed(2)), // Garantir 2 casas decimais
        totalSales: Number(totalSales),
        totalStudents: Number(totalStudents),
        totalCourses: Number(totalCourses),
        averageTicket: totalSales > 0 ? Number((totalRevenue / totalSales).toFixed(2)) : 0,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async getStudents(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [students, total] = await this.userRepository.findAndCount({
        where: { role: UserRole.STUDENT },
        skip,
        take: Number(limit),
        order: { createdAt: 'DESC' },
      });

      res.json({
        students,
        total,
        page: Number(page),
        limit: Number(limit),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async getPurchases(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [purchases, total] = await this.purchaseRepository.findAndCount({
        skip,
        take: Number(limit),
        order: { createdAt: 'DESC' },
        relations: [
          'user', 
          'courses', 
          'courses.course',
          'products',
          'products.product',
          'products.tracking',
          'products.tracking.events'
        ],
      });

      // Garantir que valores decimais sejam retornados como números
      const purchasesWithNumbers = purchases.map(p => ({
        ...p,
        totalAmount: Number(p.totalAmount),
        discountAmount: Number(p.discountAmount),
        finalAmount: Number(p.finalAmount),
      }));

      res.json({
        purchases: purchasesWithNumbers,
        total,
        page: Number(page),
        limit: Number(limit),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  // Gráficos
  private async getSalesChart(req: Request, res: Response) {
    try {
      const { period = '30' } = req.query; // dias (pode ser "30", "30d", "7d", etc.)
      // Extrair número do período (remove "d" se presente)
      const days = parseInt(String(period).replace(/[^0-9]/g, '') || '30', 10);
      if (isNaN(days) || days <= 0) {
        return res.status(400).json({ message: 'Período inválido. Use um número de dias válido (ex: 30, 30d, 7d)' });
      }
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0); // Normalizar para início do dia

      const purchases = await this.purchaseRepository
        .createQueryBuilder('purchase')
        .where('purchase.createdAt >= :startDate', { startDate })
        .andWhere('purchase.paymentStatus = :status', { status: PaymentStatus.PAID })
        .orderBy('purchase.createdAt', 'ASC')
        .getMany();

      // Agrupar por data
      const salesByDate: { [key: string]: number } = {};
      purchases.forEach((p) => {
        const date = p.createdAt.toISOString().split('T')[0];
        salesByDate[date] = (salesByDate[date] || 0) + 1;
      });

      const chartData = Object.keys(salesByDate)
        .sort()
        .map((date) => ({
          date,
          sales: salesByDate[date],
        }));

      return res.json({ chartData, period: days });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getRevenueChart(req: Request, res: Response) {
    try {
      const { period = '30' } = req.query;
      // Extrair número do período (remove "d" se presente)
      const days = parseInt(String(period).replace(/[^0-9]/g, '') || '30', 10);
      if (isNaN(days) || days <= 0) {
        return res.status(400).json({ message: 'Período inválido. Use um número de dias válido (ex: 30, 30d, 7d)' });
      }
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0); // Normalizar para início do dia

      const purchases = await this.purchaseRepository
        .createQueryBuilder('purchase')
        .where('purchase.createdAt >= :startDate', { startDate })
        .andWhere('purchase.paymentStatus = :status', { status: PaymentStatus.PAID })
        .getMany();

      // Agrupar por data
      const revenueByDate: { [key: string]: number } = {};
      purchases.forEach((p) => {
        const date = p.createdAt.toISOString().split('T')[0];
        revenueByDate[date] = (revenueByDate[date] || 0) + Number(p.finalAmount);
      });

      const chartData = Object.keys(revenueByDate)
        .sort()
        .map((date) => ({
          date,
          revenue: revenueByDate[date],
        }));

      return res.json({ chartData, period: days });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getStudentsChart(req: Request, res: Response) {
    try {
      const { period = '30' } = req.query;
      // Extrair número do período (remove "d" se presente)
      const days = parseInt(String(period).replace(/[^0-9]/g, '') || '30', 10);
      if (isNaN(days) || days <= 0) {
        return res.status(400).json({ message: 'Período inválido. Use um número de dias válido (ex: 30, 30d, 7d)' });
      }
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0); // Normalizar para início do dia

      const students = await this.userRepository
        .createQueryBuilder('user')
        .where('user.createdAt >= :startDate', { startDate })
        .andWhere('user.role = :role', { role: UserRole.STUDENT })
        .orderBy('user.createdAt', 'ASC')
        .getMany();

      const studentsByDate: { [key: string]: number } = {};
      students.forEach((s) => {
        const date = s.createdAt.toISOString().split('T')[0];
        studentsByDate[date] = (studentsByDate[date] || 0) + 1;
      });

      const chartData = Object.keys(studentsByDate)
        .sort()
        .map((date) => ({
          date,
          students: studentsByDate[date],
        }));

      return res.json({ chartData, period: days });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getPaymentMethodsChart(_req: Request, res: Response) {
    try {
      const purchases = await this.purchaseRepository.find({
        where: { paymentStatus: PaymentStatus.PAID },
      });

      const methodsCount: { [key: string]: number } = {};
      purchases.forEach((p) => {
        methodsCount[p.paymentMethod] = (methodsCount[p.paymentMethod] || 0) + 1;
      });

      const chartData = Object.keys(methodsCount).map((method) => ({
        method,
        count: methodsCount[method],
        percentage: (methodsCount[method] / purchases.length) * 100,
      }));

      res.json({ chartData });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  // Analytics
  private async getRevenue(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const queryBuilder = this.purchaseRepository
        .createQueryBuilder('purchase')
        .where('purchase.paymentStatus = :status', { status: PaymentStatus.PAID });

      if (startDate) {
        queryBuilder.andWhere('purchase.createdAt >= :startDate', { startDate });
      }
      if (endDate) {
        queryBuilder.andWhere('purchase.createdAt <= :endDate', { endDate });
      }

      const purchases = await queryBuilder.getMany();

      const totalRevenue = purchases.reduce((sum, p) => sum + Number(p.finalAmount), 0);
      const totalDiscount = purchases.reduce((sum, p) => sum + Number(p.discountAmount), 0);
      const averageTicket = purchases.length > 0 ? totalRevenue / purchases.length : 0;

      res.json({
        totalRevenue,
        totalDiscount,
        averageTicket,
        totalSales: purchases.length,
        period: { startDate, endDate },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async getAnalyticsOverview(_req: Request, res: Response) {
    try {
      const totalStudents = await this.userRepository.count({
        where: { role: UserRole.STUDENT },
      });
      const totalCourses = await this.courseRepository.count({ where: { active: true } });
      const totalPurchases = await this.purchaseRepository.count({
        where: { paymentStatus: PaymentStatus.PAID },
      });

      const purchases = await this.purchaseRepository.find({
        where: { paymentStatus: PaymentStatus.PAID },
      });
      const totalRevenue = purchases.reduce((sum, p) => sum + Number(p.finalAmount), 0);

      res.json({
        students: totalStudents,
        courses: totalCourses,
        purchases: totalPurchases,
        revenue: totalRevenue,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async getStudentProgress(_req: Request, res: Response) {
    try {
      const progressRecords = await this.progressRepository.find({
        relations: ['user', 'course'],
      });

      const studentsProgress = progressRecords.reduce((acc: any, p) => {
        if (!acc[p.userId]) {
          acc[p.userId] = {
            userId: p.userId,
            userName: p.user?.name,
            totalLessons: 0,
            completedLessons: 0,
            courses: [],
          };
        }
        if (p.completed) {
          acc[p.userId].completedLessons++;
        }
        acc[p.userId].totalLessons++;
        return acc;
      }, {});

      const progressArray = Object.values(studentsProgress).map((sp: any) => ({
        ...sp,
        completionRate: sp.totalLessons > 0 ? (sp.completedLessons / sp.totalLessons) * 100 : 0,
      }));

      res.json({ progress: progressArray });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  // Exportação
  private async exportPurchases(req: Request, res: Response) {
    try {
      const { format = 'csv' } = req.body;
      const purchases = await this.purchaseRepository.find({
        relations: ['user', 'courses', 'courses.course'],
      });

      if (format === 'csv') {
        const csv = [
          'ID,Usuário,Total,Desconto,Final,Método,Status,Data',
          ...purchases.map(
            (p) =>
              `${p.id},${p.user?.name || ''},${p.totalAmount},${p.discountAmount},${p.finalAmount},${p.paymentMethod},${p.paymentStatus},${p.createdAt}`
          ),
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=purchases.csv');
        res.send(csv);
      } else {
        res.json({ purchases });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async exportStudents(req: Request, res: Response) {
    try {
      const { format = 'csv' } = req.body;
      const students = await this.userRepository.find({
        where: { role: UserRole.STUDENT },
      });

      if (format === 'csv') {
        const csv = [
          'ID,Nome,Email,Data de Cadastro',
          ...students.map((s) => `${s.id},${s.name},${s.email},${s.createdAt}`),
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
        res.send(csv);
      } else {
        res.json({ students });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async exportCourses(req: Request, res: Response) {
    try {
      const { format = 'csv' } = req.body;
      const courses = await this.courseRepository.find();

      if (format === 'csv') {
        const csv = [
          'ID,Título,Categoria,Preço,Instrutor,Ativo,Data de Criação',
          ...courses.map(
            (c) =>
              `${c.id},${c.title},${c.category},${c.price},${c.instructor},${c.active},${c.createdAt}`
          ),
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=courses.csv');
        res.send(csv);
      } else {
        res.json({ courses });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  // Uploads
  private async uploadVideo(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: 'Arquivo não enviado' });
      }

      // TODO: Upload para Azure Blob Storage
      const videoUrl = `/uploads/videos/${uuidv4()}-${file.originalname}`;

      return res.json({
        message: 'Vídeo enviado com sucesso',
        videoUrl,
        courseId,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async uploadImage(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: 'Arquivo não enviado' });
      }

      // TODO: Upload para Azure Blob Storage
      const imageUrl = `/uploads/images/${uuidv4()}-${file.originalname}`;

      return res.json({
        message: 'Imagem enviada com sucesso',
        imageUrl,
        courseId,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async uploadMaterial(req: Request, res: Response) {
    try {
      const { lessonId, title, description } = req.body;
      const file = req.file;

      if (!file || !lessonId) {
        return res.status(400).json({ message: 'Arquivo e lessonId são obrigatórios' });
      }

      // TODO: Upload para Azure Blob Storage
      const materialUrl = `/uploads/materials/${uuidv4()}-${file.originalname}`;

      const material = this.materialRepository.create({
        lessonId,
        title: title || file.originalname,
        description,
        url: materialUrl,
        type: file.mimetype,
        size: file.size,
      });

      const savedMaterial = await this.materialRepository.save(material);

      return res.json({
        message: 'Material enviado com sucesso',
        material: savedMaterial,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Materiais
  private async getCourseMaterials(req: Request, res: Response) {
    try {
      const { courseId } = req.params;

      // Buscar materiais através das aulas dos módulos do curso
      const modules = await this.moduleRepository.find({
        where: { courseId },
        relations: ['lessons'],
      });

      const lessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
      const materials = await this.materialRepository.find({
        where: lessonIds.map((id) => ({ lessonId: id })),
        order: { createdAt: 'DESC' },
      });

      res.json({ materials });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async deleteMaterial(req: Request, res: Response) {
    try {
      const { materialId } = req.params;
      await this.materialRepository.delete(materialId);
      return res.json({ message: 'Material deletado com sucesso' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Utilitários
  private async reorderModules(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const { moduleIds } = req.body;

      if (!Array.isArray(moduleIds)) {
        return res.status(400).json({ message: 'moduleIds deve ser um array' });
      }

      await Promise.all(
        moduleIds.map((moduleId: string, index: number) =>
          this.moduleRepository.update(
            { id: moduleId, courseId },
            { order: index + 1 }
          )
        )
      );

      return res.json({ message: 'Módulos reordenados com sucesso' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async duplicateCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
        relations: ['modules', 'modules.lessons'],
      });

      if (!course) {
        return res.status(404).json({ message: 'Curso não encontrado' });
      }

      // Criar novo curso (sem módulos e aulas, serão criados depois)
      const newCourse = this.courseRepository.create({
        title: `${course.title} (Cópia)`,
        subtitle: course.subtitle,
        description: course.description,
        price: course.price,
        originalPrice: course.originalPrice,
        category: course.category,
        image: course.image,
        videoUrl: course.videoUrl,
        instructor: course.instructor,
        duration: course.duration,
        lessons: course.lessons,
        students: 0, // Resetar contador
        rating: 0, // Resetar rating
        aboutCourse: course.aboutCourse,
        benefits: course.benefits,
        bonuses: course.bonuses,
        active: false, // Inativo por padrão
      });

      const savedCourse = await this.courseRepository.save(newCourse);

      // Duplicar módulos e aulas
      if (course.modules) {
        for (const module of course.modules) {
          const newModule = this.moduleRepository.create({
            courseId: savedCourse.id,
            title: module.title,
            duration: module.duration,
            order: module.order,
          });
          const savedModule = await this.moduleRepository.save(newModule);

          if (module.lessons) {
            for (const lesson of module.lessons) {
              // Criar aula duplicada
              const newLesson = this.lessonRepository.create({
                moduleId: savedModule.id,
                title: lesson.title,
                duration: lesson.duration,
                videoUrl: lesson.videoUrl,
                order: lesson.order,
                free: lesson.free,
              });
              await this.lessonRepository.save(newLesson);
            }
          }
        }
      }

      return res.json({
        message: 'Curso duplicado com sucesso',
        course: savedCourse,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Notificações
  private async getNotifications(_req: Request, res: Response) {
    try {
      const notifications = await this.notificationRepository.find({
        order: { createdAt: 'DESC' },
        relations: ['user'],
      });

      res.json({ notifications });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async markNotificationRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.notificationRepository.update(id, { read: true });
      const notification = await this.notificationRepository.findOne({ where: { id } });
      res.json({ notification });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async markAllNotificationsRead(_req: Request, res: Response) {
    try {
      await this.notificationRepository.update({ read: false }, { read: true });
      res.json({ message: 'Todas as notificações foram marcadas como lidas' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

