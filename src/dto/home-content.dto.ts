import { IsOptional, IsString, IsArray, ValidateNested, IsObject, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class ButtonDto {
  @IsString()
  text!: string;

  @IsString()
  action!: string;
}

class CarouselItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  url!: string;

  @IsString()
  alt!: string;

  @IsNumber()
  order!: number;
}

class CardDto {
  @IsString()
  icon!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  gradientColors!: { from: string; to: string };
}

class HeroDto {
  @IsString()
  badge!: string;

  @IsString()
  title!: string;

  @IsString()
  subtitle!: string;

  @ValidateNested()
  @Type(() => ButtonDto)
  primaryButton!: ButtonDto;

  @ValidateNested()
  @Type(() => ButtonDto)
  secondaryButton!: ButtonDto;
}

class WhyChooseUsDto {
  @IsString()
  badge!: string;

  @IsString()
  title!: string;

  @IsString()
  subtitle!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CardDto)
  cards!: CardDto[];
}

class TestimonialsDto {
  @IsString()
  badge!: string;

  @IsString()
  title!: string;

  @IsString()
  subtitle!: string;
}

class NewsletterFeatureDto {
  @IsString()
  text!: string;
}

class NewsletterDto {
  @IsString()
  title!: string;

  @IsString()
  subtitle!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NewsletterFeatureDto)
  features!: NewsletterFeatureDto[];
}

class BenefitCardDto {
  @IsString()
  icon!: string;

  @IsString()
  title!: string;

  @IsString()
  subtitle!: string;

  @IsString()
  iconColor!: string;
}

class CtaDto {
  @IsString()
  badge!: string;

  @IsString()
  title!: string;

  @IsString()
  subtitle!: string;

  @ValidateNested()
  @Type(() => ButtonDto)
  primaryButton!: ButtonDto;

  @ValidateNested()
  @Type(() => ButtonDto)
  secondaryButton!: ButtonDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BenefitCardDto)
  benefitCards!: BenefitCardDto[];
}

export class UpdateHomeContentDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => HeroDto)
  hero?: HeroDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CarouselItemDto)
  carousel?: CarouselItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => WhyChooseUsDto)
  whyChooseUs?: WhyChooseUsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TestimonialsDto)
  testimonials?: TestimonialsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NewsletterDto)
  newsletter?: NewsletterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CtaDto)
  cta?: CtaDto;
}

