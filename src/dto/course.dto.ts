import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  IsUrl,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BenefitDto {
  @IsString()
  icon!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateCourseDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  originalPrice?: number;

  @IsString()
  category!: string;

  @IsUrl()
  image!: string;

  @IsUrl()
  @IsOptional()
  videoUrl?: string;

  @IsString()
  instructor!: string;

  @IsString()
  duration!: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  lessons?: number;

  @IsString()
  @IsOptional()
  aboutCourse?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BenefitDto)
  @IsOptional()
  bonuses?: BenefitDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BenefitDto)
  @IsOptional()
  benefits?: BenefitDto[];
}

export class UpdateCourseDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @MinLength(10)
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
  category?: string;

  @IsUrl()
  @IsOptional()
  image?: string;

  @IsUrl()
  @IsOptional()
  videoUrl?: string;

  @IsString()
  @IsOptional()
  instructor?: string;

  @IsString()
  @IsOptional()
  duration?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  lessons?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BenefitDto)
  @IsOptional()
  bonuses?: BenefitDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BenefitDto)
  @IsOptional()
  benefits?: BenefitDto[];
}

export class CreateModuleDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  duration!: string;

  @IsNumber()
  @Min(0)
  order!: number;
}

export class UpdateModuleDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  duration?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class CreateLessonDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  duration!: string;

  @IsUrl()
  videoUrl!: string;

  @IsNumber()
  @Min(0)
  order!: number;

  @IsBoolean()
  @IsOptional()
  free?: boolean;
}

export class UpdateLessonDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  duration?: string;

  @IsUrl()
  @IsOptional()
  videoUrl?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  free?: boolean;
}

