import { IsNumber, Min, IsOptional } from 'class-validator';

export class UpdateProgressDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  watchedDuration?: number;
}

export class CompleteLessonDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  watchedDuration?: number;
}

