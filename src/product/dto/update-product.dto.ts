import { IsOptional, IsString, ValidateIf, IsNumber, Min } from 'class-validator';

export class UpdateProductDto {
  @ValidateIf(
    (o) =>
      o.partNo !== undefined || o.name !== undefined || o.unit !== undefined,
  )
  @IsOptional()
  @IsString()
  partNo?: string;

  @ValidateIf(
    (o) =>
      o.partNo !== undefined || o.name !== undefined || o.unit !== undefined,
  )
  @IsOptional()
  @IsString()
  name?: string;

  @ValidateIf(
    (o) =>
      o.partNo !== undefined || o.name !== undefined || o.unit !== undefined,
  )
  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumQuantity?: number;
}
