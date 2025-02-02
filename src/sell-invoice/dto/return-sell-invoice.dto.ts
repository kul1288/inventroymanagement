import { IsNotEmpty, IsNumber, ValidateNested, IsArray, Min, IsString, IsOptional, ArrayNotEmpty, ArrayUnique } from 'class-validator';
import { Type } from 'class-transformer';

class ReturnProductDto {
    @IsNotEmpty()
    @IsNumber()
    productId: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(1, { message: 'Quantity must be at least 1' })
    quantity: number;

    @IsOptional()
    @IsString()
    reason?: string;
}

export class ReturnSellInvoiceDto {
    @IsNotEmpty()
    @IsNumber()
    sellInvoiceId: number;

    @IsArray()
    @ArrayNotEmpty({ message: 'Please add some products' })
    @ArrayUnique((product: ReturnProductDto) => product.productId, { message: 'Products array should contain unique product IDs' })
    @ValidateNested({ each: true })
    @Type(() => ReturnProductDto)
    products: ReturnProductDto[];
}
