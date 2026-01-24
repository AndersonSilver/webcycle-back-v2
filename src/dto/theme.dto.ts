import { IsString, IsOptional, IsBoolean, Matches } from 'class-validator';

export class UpdateThemeDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Primary deve ser uma cor hexadecimal válida (ex: #3B82F6)' })
  primary?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'PrimaryDark deve ser uma cor hexadecimal válida' })
  primaryDark?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'PrimaryLight deve ser uma cor hexadecimal válida' })
  primaryLight?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Secondary deve ser uma cor hexadecimal válida' })
  secondary?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'SecondaryDark deve ser uma cor hexadecimal válida' })
  secondaryDark?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'TextPrimary deve ser uma cor hexadecimal válida' })
  textPrimary?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'TextSecondary deve ser uma cor hexadecimal válida' })
  textSecondary?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Background deve ser uma cor hexadecimal válida' })
  background?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'BackgroundSecondary deve ser uma cor hexadecimal válida' })
  backgroundSecondary?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Border deve ser uma cor hexadecimal válida' })
  border?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Accent deve ser uma cor hexadecimal válida' })
  accent?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Danger deve ser uma cor hexadecimal válida' })
  danger?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Success deve ser uma cor hexadecimal válida' })
  success?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Info deve ser uma cor hexadecimal válida' })
  info?: string;
}

