import {
  IsArray,
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsObject,
  MinLength,
} from 'class-validator';
import { PaymentMethod } from '../entities/Purchase.entity';

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

