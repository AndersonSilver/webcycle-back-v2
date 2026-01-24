import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  Max,
  IsUUID,
} from 'class-validator';

export class CreateProductReviewDto {
  @IsUUID()
  productId!: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  comment!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

