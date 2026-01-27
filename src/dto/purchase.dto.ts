import {
  IsArray,
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsObject,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../entities/Purchase.entity';

export class ShippingAddressDto {
  @IsString()
  @MinLength(1)
  street!: string;

  @IsString()
  @MinLength(1)
  number!: string;

  @IsString()
  @IsOptional()
  complement?: string;

  @IsString()
  @MinLength(1)
  neighborhood!: string;

  @IsString()
  @MinLength(1)
  city!: string;

  @IsString()
  @MinLength(2)
  state!: string;

  @IsString()
  @MinLength(1)
  zipCode!: string;
}

export class CheckoutDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  courses?: string[];

  @IsArray()
  @IsOptional()
  products?: Array<{
    productId: string;
    quantity: number;
  }>;

  @IsString()
  @IsOptional()
  couponCode?: string;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  @IsOptional()
  shippingAddress?: ShippingAddressDto;
}

export class ConfirmPurchaseDto {
  @IsString()
  paymentId!: string;

  @IsObject()
  @IsOptional()
  paymentData?: Record<string, any>;
}

export class ProcessPaymentDto {
  @IsString()
  @MinLength(1)
  token!: string; // Token gerado pelo Mercado Pago JS no frontend

  @IsString()
  @IsOptional()
  installments?: string;

  @IsString()
  @IsOptional()
  paymentMethodId?: string; // visa, mastercard, etc. (opcional, será detectado pelo token)

  @IsString()
  @IsOptional()
  identificationType?: string;

  @IsString()
  @IsOptional()
  identificationNumber?: string;
}

