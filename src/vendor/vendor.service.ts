import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from './vendor.entity';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@Injectable()
export class VendorService {
    constructor(
        @InjectRepository(Vendor)
        private vendorsRepository: Repository<Vendor>,
    ) { }

    async create(createVendorDto: CreateVendorDto): Promise<Vendor> {
        const existingVendor = await this.vendorsRepository.findOne({ where: { name: createVendorDto.name } });
        if (existingVendor) {
            throw new BadRequestException('Vendor with this name already exists');
        }
        const vendor = this.vendorsRepository.create(createVendorDto);
        return this.vendorsRepository.save(vendor);
    }

    async findAll(): Promise<Vendor[]> {
        return this.vendorsRepository.find();
    }

    async findOne(id: number): Promise<Vendor> {
        const vendor = await this.vendorsRepository.findOne({ where: { id } });
        if (!vendor) {
            throw new NotFoundException('Vendor not found');
        }
        return vendor;
    }

    async update(id: number, updateVendorDto: UpdateVendorDto): Promise<Vendor> {
        const vendor = await this.findOne(id);
        if (updateVendorDto.name && updateVendorDto.name !== vendor.name) {
            const existingVendor = await this.vendorsRepository.findOne({ where: { name: updateVendorDto.name } });
            if (existingVendor && existingVendor.id !== id) {
                throw new BadRequestException('Vendor with this name already exists');
            }
        }
        Object.assign(vendor, updateVendorDto);
        return this.vendorsRepository.save(vendor);
    }

    async remove(id: number): Promise<void> {
        const vendor = await this.findOne(id);
        await this.vendorsRepository.remove(vendor);
    }
}
