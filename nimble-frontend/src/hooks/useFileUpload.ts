import { useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { INVOICE_UPLOAD_ENDPOINT } from '../constants';

interface CSVRecord {
  invoice_id: string;
  invoice_date: string;
  invoice_due_date: string;
  invoice_cost: string;
  invoice_currency: string;
  invoice_status: string;
  supplier_internal_id: string;
  supplier_company_name?: string;
}

export const useCsvUpload = (onUploadSuccess?: () => void) => {
  const toast = useToast();
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);

  const parseDate = (dateStr: string): Date => {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  const validateRecord = (record: CSVRecord, rowIndex: number): string[] => {
    const errors: string[] = [];

    const requiredFields: (keyof CSVRecord)[] = [
      'invoice_id',
      'invoice_date',
      'invoice_due_date',
      'invoice_cost',
      'invoice_currency',
      'invoice_status',
      'supplier_internal_id',
      'supplier_company_name',
    ];

    requiredFields.forEach((field) => {
      if (!record[field]?.trim()) {
        errors.push(`Row ${rowIndex + 1}: Missing ${field}`);
      }
    });

    // Skip further validation if required fields are missing
    if (errors.length > 0) {
      return errors;
    }

    const invoiceDate = parseDate(record.invoice_date);
    const dueDate = parseDate(record.invoice_due_date);

    if (isNaN(invoiceDate.getTime()) || isNaN(dueDate.getTime())) {
      errors.push(`Row ${rowIndex + 1}: Invalid date format`);
    } else if (dueDate < invoiceDate) {
      errors.push(`Row ${rowIndex + 1}: Due date is before invoice date`);
    }

    const cost = parseFloat(record.invoice_cost);
    if (isNaN(cost) || cost < 0) {
      errors.push(`Row ${rowIndex + 1}: Invalid invoice cost`);
    }

    const validCurrencies = ['USD', 'EUR', 'GBP'];
    if (!validCurrencies.includes(record.invoice_currency)) {
      errors.push(`Row ${rowIndex + 1}: Invalid currency`);
    }

    const validStatuses = ['CONFIRMED', 'CANCELLED', 'PENDING'];
    if (!validStatuses.includes(record.invoice_status)) {
      errors.push(`Row ${rowIndex + 1}: Invalid status`);
    }

    return errors;
  };

  const parseCsv = (file: File): Promise<CSVRecord[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        // Split rows and filter out empty lines
        const rows = text
          .split('\n')
          .map((row) => row.trim())
          .filter((row) => row.length > 0)
          .map((row) => row.split(','));

        // Assuming first row is header
        const headers = rows[0];
        const records: CSVRecord[] = rows.slice(1).map((row) => {
          const record: Partial<CSVRecord> = {};
          headers.forEach((header, index) => {
            record[header.trim() as keyof CSVRecord] = row[index]?.trim() || '';
          });
          return record as CSVRecord;
        });

        resolve(records);
      };
      reader.onerror = () => reject(new Error('Failed to read CSV file'));
      reader.readAsText(file);
    });
  };

  const handleCsvFileUpload = useCallback(
    async (uploadEvent: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = uploadEvent.target.files?.[0];
      if (!selectedFile) {
        toast({
          title: 'Upload Error',
          description: 'Please select a CSV file to upload.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      try {
        // Validate CSV content before uploading
        const records = await parseCsv(selectedFile);
        const validationErrors: string[] = [];

        // Check for duplicate invoice_id values
        const invoiceIdMap = new Map<string, number[]>();
        records.forEach((record, index) => {
          if (record.invoice_id) {
            if (invoiceIdMap.has(record.invoice_id)) {
              invoiceIdMap.get(record.invoice_id)!.push(index + 1);
            } else {
              invoiceIdMap.set(record.invoice_id, [index + 1]);
            }
          }
        });

        // Collect duplicate errors
        invoiceIdMap.forEach((rowIndices, invoiceId) => {
          if (rowIndices.length > 1) {
            validationErrors.push(`Duplicate invoice_id '${invoiceId}' in rows ${rowIndices.join(', ')}`);
          }
        });

        // Validate each record
        records.forEach((record, index) => {
          const errors = validateRecord(record, index);
          validationErrors.push(...errors);
        });

        if (validationErrors.length > 0) {
          toast({
            title: 'Validation Error',
            description: validationErrors.join('; '),
            status: 'error',
            duration: 7000,
            isClosable: true,
          });
          uploadEvent.target.value = ''; // Reset file input
          return;
        }

        setIsUploadingCsv(true);
        const csvFormData = new FormData();
        csvFormData.append('file', selectedFile);

        const uploadResponse = await fetch(INVOICE_UPLOAD_ENDPOINT, {
          method: 'POST',
          body: csvFormData,
        });

        const responseData = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(responseData.message || 'Upload failed.');
        }

        // Ensure minimum animation duration for UX
        await new Promise((resolve) => setTimeout(resolve, 4000));

        toast({
          title: 'Upload Success',
          description: responseData.message || 'CSV uploaded successfully!',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        onUploadSuccess?.();
      } catch (uploadError) {
        const errorMessage = uploadError instanceof Error ? uploadError.message : 'An unexpected error occurred.';
        const friendlyErrorDescription = errorMessage.includes('Validation errors found')
          ? errorMessage.replace(
              /Invoice (\w+): Missing or invalid fields - (.+)/,
              (_, invoiceId, missingFields) => `Failed to upload invoice ${invoiceId} due to missing or invalid fields: ${missingFields}.`,
            )
          : errorMessage;

        await new Promise((resolve) => setTimeout(resolve, 4000));

        toast({
          title: 'Upload Error',
          description: friendlyErrorDescription,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsUploadingCsv(false);
        uploadEvent.target.value = ''; // Reset file input
      }
    },
    [toast, onUploadSuccess],
  );

  return { isUploadingCsv, handleCsvFileUpload };
};
