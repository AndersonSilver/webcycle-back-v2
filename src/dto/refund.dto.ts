import { IsUUID, IsString, MinLength, IsOptional } from 'class-validator';

export class RequestRefundDto {
  @IsUUID('4')
  purchaseId!: string;

  @IsString()
  @MinLength(10)
  reason!: string;

  @IsString()
  @IsOptional()
  comment?: string;
}

export class RejectRefundDto {
  @IsString()
  @MinLength(10)
  reason!: string;
}

