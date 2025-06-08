export interface CSVRecord {
  invoice_id: string;
  invoice_date: string;
  invoice_due_date: string;
  invoice_cost: string;
  invoice_currency: string;
  invoice_status: string;
  supplier_internal_id: string;
  supplier_company_name?: string;
  supplier_external_id?: string;
  supplier_address?: string;
  supplier_city?: string;
  supplier_country?: string;
  supplier_contact_name?: string;
  supplier_phone?: string;
  supplier_email?: string;
  supplier_bank_code?: string;
  supplier_bank_branch_code?: string;
  supplier_bank_account_number?: string;
  supplier_status?: string;
  supplier_stock_value?: string;
  supplier_withholding_tax?: string;
}
