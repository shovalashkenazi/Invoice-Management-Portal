import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { parse as csvParse } from 'csv-parse/sync';
import { CSVRecord } from '../interfaces/csv-record.interface';

@Injectable()
export class CSVParserService {
  private readonly logger = new Logger(CSVParserService.name);

  validateUploadedFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    if (!file.mimetype.includes('csv')) {
      throw new BadRequestException('File must be a CSV');
    }
  }

  parseCSVContent(file: Express.Multer.File): CSVRecord[] {
    this.logger.log(`Parsing CSV file, size: ${file.size} bytes`);
    const content = file.buffer.toString().trim();
    const records: CSVRecord[] = csvParse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: (value: string) => value.trim(),
    });

    if (records.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    return records;
  }

  validateCSVStructure(records: CSVRecord[]): void {
    const requiredColumns = ['invoice_id', 'invoice_date', 'invoice_due_date', 'invoice_cost', 'invoice_currency', 'invoice_status', 'supplier_internal_id'];

    const headers = Object.keys(records[0] || {});
    const missingColumns = requiredColumns.filter((col) => !headers.includes(col));

    if (missingColumns.length > 0) {
      throw new BadRequestException(`Missing required columns: ${missingColumns.join(', ')}`);
    }
  }
}
