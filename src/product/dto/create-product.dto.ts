import { IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  partNo: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  unit: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumQuantity?: number;

  @IsOptional()
  @IsString()
  commonName?: string;
}
