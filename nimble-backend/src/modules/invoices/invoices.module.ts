import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { PrismaService } from 'prisma/prisma.service';
import { CurrencyService } from '../currency/currency.service';
import { CSVParserService } from './utils/csv-parser';
import { CSVValidatorService } from './utils/csv-validator';
import { InvoiceProcessorService } from './utils/invoice-processor';
import { DataTransformerService } from './utils/data-transformer';

@Module({
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    PrismaService,
    CurrencyService,
    CSVParserService,
    CSVValidatorService,
    InvoiceProcessorService,
    DataTransformerService,
  ],
})
export class InvoicesModule {}
