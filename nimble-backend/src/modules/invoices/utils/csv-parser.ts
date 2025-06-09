import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { parse as csvParse } from 'csv-parse/sync';
import { CSVRecord } from '../interfaces/csv-record.interface';

@Injectable()
export class CSVParserService {
  private readonly logger = new Logger(CSVParserService.name);

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
}
