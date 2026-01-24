import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Product, ProductType } from '../entities/Product.entity';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { validateDto } from '../middleware/ValidationMiddleware';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';

export class ProductController {
  private router: Router;
  private productRepository: Repository<Product>;

  constructor() {
    this.router = Router();
    this.productRepository = AppDataSource.getRepository(Product);
    this.setupRoutes();
  }

  private setupRoutes() {
    // Rotas públicas
    this.router.get('/', this.getAll.bind(this));
    this.router.get('/:id', this.getById.bind(this));
    this.router.get('/category/:category', this.getByCategory.bind(this));
    this.router.get('/type/:type', this.getByType.bind(this));

    // Rotas protegidas (admin)
    this.router.use(AuthMiddleware.authenticate);
    this.router.post('/', AuthMiddleware.requireAdmin, validateDto(CreateProductDto), this.create.bind(this));
    this.router.put('/:id', AuthMiddleware.requireAdmin, validateDto(UpdateProductDto), this.update.bind(this));
    this.router.delete('/:id', AuthMiddleware.requireAdmin, this.delete.bind(this));
  }

  private async getAll(req: Request, res: Response) {
    try {
      const { type, category, active, page = '1', limit = '20' } = req.query;

      const queryBuilder = this.productRepository.createQueryBuilder('product');

      if (type) {
        queryBuilder.where('product.type = :type', { type });
      }

      if (category) {
        queryBuilder.andWhere('product.category = :category', { category });
      }

      if (active !== undefined) {
        queryBuilder.andWhere('product.active = :active', { active: active === 'true' });
      } else {
        queryBuilder.andWhere('product.active = :active', { active: true });
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      queryBuilder.skip(skip).take(limitNum);
      queryBuilder.orderBy('product.createdAt', 'DESC');

      const [products, total] = await queryBuilder.getManyAndCount();

      res.json({
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
  }

  private async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const product = await this.productRepository.findOne({
        where: { id },
      });

      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      res.json({ product });
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      res.status(500).json({ error: 'Erro ao buscar produto' });
    }
  }

  private async getByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const { page = '1', limit = '20' } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const [products, total] = await this.productRepository.findAndCount({
        where: { category, active: true },
        skip,
        take: limitNum,
        order: { createdAt: 'DESC' },
      });

      res.json({
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Erro ao buscar produtos por categoria:', error);
      res.status(500).json({ error: 'Erro ao buscar produtos por categoria' });
    }
  }

  private async getByType(req: Request, res: Response) {
    try {
      const { type } = req.params;
      const { page = '1', limit = '20' } = req.query;

      if (!Object.values(ProductType).includes(type as ProductType)) {
        return res.status(400).json({ error: 'Tipo de produto inválido' });
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const [products, total] = await this.productRepository.findAndCount({
        where: { type: type as ProductType, active: true },
        skip,
        take: limitNum,
        order: { createdAt: 'DESC' },
      });

      res.json({
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Erro ao buscar produtos por tipo:', error);
      res.status(500).json({ error: 'Erro ao buscar produtos por tipo' });
    }
  }

  private async create(req: Request, res: Response) {
    try {
      const productData: CreateProductDto = req.body;

      const product = this.productRepository.create({
        ...productData,
        stock: productData.stock || 0,
        active: true,
        salesCount: 0,
        rating: productData.rating || 0,
        reviewsCount: 0,
      });

      const savedProduct = await this.productRepository.save(product);

      res.status(201).json(savedProduct);
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      res.status(500).json({ error: 'Erro ao criar produto' });
    }
  }

  private async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const productData: UpdateProductDto = req.body;

      const product = await this.productRepository.findOne({
        where: { id },
      });

      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      Object.assign(product, productData);
      const updatedProduct = await this.productRepository.save(product);

      res.json(updatedProduct);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
  }

  private async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const product = await this.productRepository.findOne({
        where: { id },
      });

      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      await this.productRepository.remove(product);

      res.json({ message: 'Produto removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      res.status(500).json({ error: 'Erro ao remover produto' });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

