import { Controller, Post, Body, UsePipes, ValidationPipe, UseGuards, Delete, Param, Get, Query, Patch, BadRequestException } from '@nestjs/common';
import { SellInvoiceService } from './sell-invoice.service';
import { CreateSellInvoiceDto } from './dto/create-sell-invoice.dto';
import { ReturnSellInvoiceDto } from './dto/return-sell-invoice.dto';
import { SellInvoice } from './sell-invoice.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReturnHistory } from '../return-history/return-history.entity';

@Controller('sell-invoices')
@UseGuards(JwtAuthGuard)
export class SellInvoiceController {
    constructor(private readonly sellInvoiceService: SellInvoiceService) { }

    @Post()
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async create(@Body() createSellInvoiceDto: CreateSellInvoiceDto): Promise<SellInvoice> {
        return this.sellInvoiceService.create(createSellInvoiceDto);
    }

    @Delete(':id')
    async delete(@Param('id') id: number): Promise<{ message: string }> {
        await this.sellInvoiceService.delete(id);
        return { message: 'Sell invoice deleted successfully' };
    }

    @Get()
    async findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ): Promise<{ data: SellInvoice[], count: number }> {
        limit = limit > 10 ? 10 : limit;
        return this.sellInvoiceService.findAll(page, limit, startDate, endDate);
    }

    @Patch('return')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async returnProduct(@Body() returnSellInvoiceDto: ReturnSellInvoiceDto): Promise<{ message: string }> {
        await this.sellInvoiceService.returnProduct(returnSellInvoiceDto);
        return { message: 'Product returned successfully' };
    }

    @Get('return-history')
    async listReturnHistory(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ): Promise<{ data: ReturnHistory[], count: number }> {
        limit = limit > 10 ? 10 : limit;
        return this.sellInvoiceService.listReturnHistory(page, limit, startDate, endDate);
    }

    @Get('report/profit')
    async getProfitReport(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ): Promise<{ totalPurchase: number, totalSell: number, totalReturn: number, totalProfit: number }> {
        if (!startDate || !endDate) {
            throw new BadRequestException('Start date and end date are required');
        }
        return this.sellInvoiceService.getProfitReport(startDate, endDate);
    }

    @Get('report/todaysale')
    async getTodaySalesReport(): Promise<{ totalInvoices: number, totalAmountSold: number }> {
        return this.sellInvoiceService.getTodaySalesReport();
    }
}
