import { BadRequestException, Injectable } from '@nestjs/common';
import { CSVRecord } from '../interfaces/csv-record.interface';
import { FilterParams } from '../interfaces/filter-params.interface';

@Injectable()
export class CSVValidatorService {
  validateUniqueInvoiceIds(records: CSVRecord[]): void {
    const invoiceIds = records.map((record) => record.invoice_id);
    if (new Set(invoiceIds).size !== invoiceIds.length) {
      throw new BadRequestException('Duplicate invoice_id found in CSV');
    }
  }

  validateFilters(filters: FilterParams): void {
    const errors: string[] = [];

    if (filters.from && isNaN(Date.parse(filters.from))) {
      errors.push('Invalid "from" date format');
    }
    if (filters.to && isNaN(Date.parse(filters.to))) {
      errors.push('Invalid "to" date format');
    }
    if (filters.currency && !['USD', 'EUR', 'GBP'].includes(filters.currency)) {
      errors.push('Invalid currency');
    }
    if (filters.status && !['CONFIRMED', 'CANCELLED', 'PENDING'].includes(filters.status)) {
      errors.push('Invalid status');
    }

    if (errors.length > 0) {
      throw new BadRequestException(`Filter validation errors: ${errors.join(', ')}`);
    }
  }

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

  validateCSVStructure(records: CSVRecord[]): void {
    const requiredColumns = ['invoice_id', 'invoice_date', 'invoice_due_date', 'invoice_cost', 'invoice_currency', 'invoice_status', 'supplier_internal_id'];

    const headers = Object.keys(records[0] || {});
    const missingColumns = requiredColumns.filter((col) => !headers.includes(col));

    if (missingColumns.length > 0) {
      throw new BadRequestException(`Missing required columns: ${missingColumns.join(', ')}`);
    }
  }
}
