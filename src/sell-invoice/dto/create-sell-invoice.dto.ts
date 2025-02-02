import {
  IsNotEmpty,
  IsNumber,
  ValidateNested,
  IsArray,
  IsString,
  Validate,
  IsBoolean,
  IsOptional,
  ArrayNotEmpty,
  ArrayUnique,
  IsEmail,
  IsEnum,
  Matches,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsBeforeOrToday } from '../../validators/is-before-or-today.validator';
import { IsDateTime } from '../../validators/is-datetime.validator';
import { InvoiceType } from '../sell-invoice.entity';

class SellInvoiceProductDto {
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

  @IsNotEmpty()
  @IsEnum(InvoiceType, { message: 'Type must be either cash or credit' })
  type: InvoiceType = InvoiceType.CASH;
}

class CustomerInfoDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateSellInvoiceDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customer: CustomerInfoDto;

  @IsNotEmpty()
  @Validate(IsDateTime, {
    message: 'Sell date must be in the format yyyy-mm-dd hh:ii:ss',
  })
  @Validate(IsBeforeOrToday, {
    message: 'Sell date should be today or a past date',
  })
  sellDate: string;

  @IsOptional()
  @IsBoolean()
  tax?: boolean = false;

  @IsNotEmpty()
  @IsEnum(InvoiceType, { message: 'Type must be either cash or credit' })
  type: InvoiceType = InvoiceType.CASH;

  @IsArray()
  @ArrayNotEmpty({ message: 'Please add some product' })
  @ArrayUnique((product: SellInvoiceProductDto) => product.productId, {
    message: 'Products array should contain unique products',
  })
  @ValidateNested({ each: true })
  @Type(() => SellInvoiceProductDto)
  products: SellInvoiceProductDto[];
}
