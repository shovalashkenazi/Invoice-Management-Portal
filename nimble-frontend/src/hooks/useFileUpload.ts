// hooks/useCsvUpload.ts
import { useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { INVOICE_UPLOAD_ENDPOINT } from '../constants';

export const useCsvUpload = (onUploadSuccess?: () => void) => {
  const toast = useToast();
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);

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

      setIsUploadingCsv(true);
      const csvFormData = new FormData();
      csvFormData.append('file', selectedFile);

      try {
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
