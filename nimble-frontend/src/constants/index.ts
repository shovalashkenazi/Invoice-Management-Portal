// =============================================================================
// API ENDPOINTS
// =============================================================================

export const INVOICE_UPLOAD_ENDPOINT = 'http://localhost:3000/invoices/upload';

export const API_ENDPOINTS = {
  AGGREGATED: 'http://localhost:3000/invoices/aggregated',
  FILTERED: 'http://localhost:3000/invoices/filtered',
} as const;

// =============================================================================
// UI CONFIGURATION
// =============================================================================

export const TOAST_CONFIG = {
  FILTER_SUCCESS: {
    title: 'Filters Applied',
    description: 'Dashboard updated with filtered data',
    status: 'success' as const,
    duration: 2000,
    isClosable: true,
  },
  ERROR: {
    title: 'Error',
    description: 'Failed to fetch dashboard data',
    status: 'error' as const,
    duration: 3000,
    isClosable: true,
  },
} as const;

// =============================================================================
// BUSINESS LOGIC CONSTANTS
// =============================================================================

// Date Range Configuration
export const START_YEAR = 2020;
export const END_YEAR = 2025;

export const MONTHS = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).concat('All');

export const YEARS = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i)
  .map((year) => year.toString())
  .concat('All')
  .reverse(); // Latest years first

// Invoice Statuses
export const STATUSES = ['CONFIRMED', 'CANCELLED', 'PENDING'] as const;
