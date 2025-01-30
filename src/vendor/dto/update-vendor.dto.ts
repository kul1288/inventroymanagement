import { IsEmail, IsNotEmpty, IsPhoneNumber, IsOptional } from 'class-validator';

export class UpdateVendorDto {
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    address: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsPhoneNumber(undefined)
    phoneno: string;
}
