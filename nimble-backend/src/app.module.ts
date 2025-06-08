import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from 'prisma/prisma.service';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { CurrencyService } from './modules/currency/currency.service';

@Module({
  imports: [InvoicesModule],
  controllers: [AppController],
  providers: [AppService, PrismaService, CurrencyService],
  exports: [PrismaService],
})
export class AppModule {}
