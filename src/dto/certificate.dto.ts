import { IsUUID, IsOptional } from 'class-validator';

export class GenerateCertificateDto {
  @IsUUID('4')
  courseId!: string;
}

export class VerifyCertificateDto {
  @IsOptional()
  code?: string;
}

