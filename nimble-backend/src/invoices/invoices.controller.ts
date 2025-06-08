import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCSV(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.invoicesService.importFromCSV(file);
  }

  @Get('aggregated')
  async getAggregated() {
    return this.invoicesService.getAggregatedData();
  }

  @Get('filtered')
  async getFilteredData(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
    @Query('customer') customer?: string,
  ) {
    return this.invoicesService.getFilteredData({
      from,
      to,
      status,
      customer,
    });
  }

  @Get()
  async getInvoices(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
    @Query('customer') customer?: string,
  ) {
    return this.invoicesService.getInvoices(page, limit, {
      from,
      to,
      status,
      customer,
    });
  }
}
