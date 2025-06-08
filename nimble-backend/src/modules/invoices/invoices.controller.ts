import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  Query,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvoicesService } from './invoices.service';
import { FilterDto } from './filter.dto';

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
