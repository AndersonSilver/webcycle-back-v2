import {
  IsString,
  IsNumber,
  IsUUID,
  Min,
  Max,
  MinLength,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CreateReviewDto {
  @IsUUID('4')
  courseId!: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @MinLength(10)
  comment!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

