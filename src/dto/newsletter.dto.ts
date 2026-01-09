import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class SubscribeNewsletterDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class SendNewsletterUpdateDto {
  @IsString()
  @MinLength(5)
  subject!: string;

  @IsString()
  @MinLength(20)
  content!: string;

  @IsOptional()
  @IsString()
  ctaText?: string;

  @IsOptional()
  @IsString()
  ctaLink?: string;
}

