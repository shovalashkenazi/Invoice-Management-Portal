import { BadRequestException, Injectable } from '@nestjs/common';
import { parse as parseDate } from 'date-fns';
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

  validateRecord(record: CSVRecord, existingSupplier: any): string[] {
    const errors: string[] = [];

    const requiredFields = ['invoice_id', 'invoice_date', 'invoice_due_date', 'invoice_cost', 'invoice_currency', 'invoice_status', 'supplier_internal_id'];

    requiredFields.forEach((field) => {
      if (!record[field as keyof CSVRecord]) {
        errors.push(field);
      }
    });

    const invoiceDate = parseDate(record.invoice_date, 'dd/MM/yyyy', new Date());
    const dueDate = parseDate(record.invoice_due_date, 'dd/MM/yyyy', new Date());

    if (isNaN(invoiceDate.getTime()) || isNaN(dueDate.getTime())) {
      errors.push('invalid_date_format');
    } else if (dueDate < invoiceDate) {
      errors.push('due_date_before_invoice_date');
    }

    const cost = parseFloat(record.invoice_cost);
    if (isNaN(cost) || cost < 0) {
      errors.push('invalid_cost');
    }

    const validCurrencies = ['USD', 'EUR', 'GBP'] as const;
    if (!validCurrencies.includes(record.invoice_currency as any)) {
      errors.push('invalid_currency');
    }

    const validStatuses = ['CONFIRMED', 'CANCELLED', 'PENDING'] as const;
    if (!validStatuses.includes(record.invoice_status as any)) {
      errors.push('invalid_status');
    }

    if (!existingSupplier && !record.supplier_company_name) {
      errors.push('supplier_company_name');
    }

    return errors;
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
}
