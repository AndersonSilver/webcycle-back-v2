import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  Max,
  IsUrl,
  IsObject,
} from 'class-validator';
import { ProductType } from '../entities/Product.entity';

export class CreateProductDto {
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  originalPrice?: number;

  @IsString()
  image!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsEnum(ProductType)
  type!: ProductType;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsString()
  @IsUrl()
  @IsOptional()
  digitalFileUrl?: string;

  @IsObject()
  @IsOptional()
  specifications?: Record<string, any>;

  @IsString()
  @IsOptional()
  author?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  pages?: number;

  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  rating?: number;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  originalPrice?: number;

  @IsString()
  @IsOptional()
  image?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsString()
  @IsUrl()
  @IsOptional()
  digitalFileUrl?: string;

  @IsObject()
  @IsOptional()
  specifications?: Record<string, any>;

  @IsString()
  @IsOptional()
  author?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  pages?: number;

  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  rating?: number;
}

export class AddTrackingCodeDto {
  @IsString()
  @IsOptional()
  trackingCode?: string;

  @IsString()
  @IsOptional()
  carrier?: string;
}

