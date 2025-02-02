import {
  IsNotEmpty,
  IsNumber,
  IsDate,
  ValidateNested,
  IsArray,
  IsString,
  Validate,
  IsBoolean,
  IsOptional,
  IsEnum,
  ArrayNotEmpty,
  ArrayUnique,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsBeforeToday } from '../../validators/is-before-today.validator';
import { InvoiceType } from '../purchase-invoice.entity';

class PurchaseInvoiceProductDto {
  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  rate: number;

  @IsNotEmpty()
  @IsNumber()
  @Max(100, { message: 'Discount should not be greater than 100' })
  discount: number;
}

export class CreatePurchaseInvoiceDto {
  @IsNotEmpty()
  @IsNumber()
  vendorId: number;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  @Validate(IsBeforeToday, { message: 'Purchase date should be a past date' })
  purchaseDate: Date;

  @IsOptional()
  @IsBoolean()
  tax?: boolean = false;

  @IsNotEmpty()
  @IsEnum(InvoiceType, { message: 'Type must be either cash or credit' })
  type: InvoiceType;

  @IsArray()
  @ArrayNotEmpty({ message: 'Please add some product' })
  @ArrayUnique((product: PurchaseInvoiceProductDto) => product.productId, {
    message: 'Products array should contain unique products',
  })
  @ValidateNested({ each: true })
  @Type(() => PurchaseInvoiceProductDto)
  products: PurchaseInvoiceProductDto[];
}
