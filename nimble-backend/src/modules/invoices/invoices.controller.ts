// === NestJS Core Imports ===
import { Controller, Get, Post, Query, UploadedFile, UseInterceptors, UsePipes, ValidationPipe, ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

// === Service Imports ===
import { InvoicesService } from './invoices.service';

// === DTO Imports ===
import { FilterDto } from './filter.dto';

@Controller('invoices')
export class InvoicesController {
  // === Constructor ===
  constructor(private readonly invoicesService: InvoicesService) {}

  // === File Upload Endpoints ===
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCSV(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    return this.invoicesService.importFromCSV(file);
  }

  // === Data Retrieval Endpoints ===
  @Get('aggregated')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAggregated(@Query() filters: FilterDto) {
    return this.invoicesService.getAggregatedData(filters);
  }

  @Get('filtered')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getFilteredData(@Query() filters: FilterDto) {
    return this.invoicesService.getFilteredData(filters);
  }
}
