import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from 'prisma/prisma.service';
import { InvoicesModule } from './invoices/invoices.module';
import { SuppliersModule } from './suppliers/suppliers.module';

@Module({
  imports: [InvoicesModule, SuppliersModule],
  controllers: [AppController],
  providers: [AppService, PrismaService], // ✅ הוספה
  exports: [PrismaService], // ⬅️ אופציונלי אם תשתמש בו במודולים אחרים
})
export class AppModule {}
