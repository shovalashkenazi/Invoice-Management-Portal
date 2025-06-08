import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { PrismaService } from 'prisma/prisma.service';
import { CurrencyService } from '../currency/currency.service';

@Module({
  controllers: [InvoicesController],
  providers: [InvoicesService, PrismaService, CurrencyService],
})
export class InvoicesModule {}
