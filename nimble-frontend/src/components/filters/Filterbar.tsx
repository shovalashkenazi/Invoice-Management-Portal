import { Box, FormControl, FormLabel, Select, VStack, Text, Collapse, Button, useBreakpointValue } from '@chakra-ui/react';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { FilterBarProps } from '../../types';
import { MONTHS, STATUSES, YEARS } from '../../constants';

const FilterBar = ({ from, to, status, customer, customers, onChange }: FilterBarProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Helper to get year and month from date string
  const getDateParts = (date: string) => {
    const [year, month] = date.split('-');
    return { year: year || 'All', month: month || 'All' };
  };

  // Handle year and month changes with validation
  const handleDateChange = (key: 'from' | 'to', type: 'year' | 'month', value: string) => {
    const current = key === 'from' ? from : to;
    const { year, month } = getDateParts(current);
    const currentYear = year !== 'All' ? year : new Date().getFullYear().toString();

    if (type === 'year') {
      const newYear = value === 'All' ? '' : value;
      const newValue = newYear ? (month !== 'All' ? `${newYear}-${month}` : `${newYear}-${key === 'from' ? '01' : '12'}`) : '';
      onChange(key, newValue);
    } else {
      const newMonth = value === 'All' ? '' : value;
      const newValue = newMonth ? `${currentYear}-${newMonth}` : currentYear;
      onChange(key, newValue);
    }
  };

  return (
    <Box
      w={{ base: '100%', md: '260px' }}
      p={{ base: 5, md: 4 }}
      bg="white"
      borderColor="gray.200"
      position={{ base: 'relative', md: 'sticky' }}
      top={{ base: 0, md: '0' }}
      overflowY="auto"
      borderRadius="xl"
      boxShadow={{ base: 'sm', md: 'none' }}
      h={{ base: 'auto', md: '840px' }}
      minHeight={{ base: 'auto', md: '840px' }}
      maxHeight={{ base: 'auto', md: '840px' }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Text fontSize="lg" fontWeight="bold">
          Filters
        </Text>
        {isMobile && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsOpen(!isOpen)}
            rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            aria-label={isOpen ? 'Hide filters' : 'Show filters'}
          >
            {isOpen ? 'Hide' : 'Show'}
          </Button>
        )}
      </Box>

      <Collapse in={isMobile ? isOpen : true}>
        <VStack spacing={{ base: 3, md: 4 }} align="stretch">
          <FormControl>
            <FormLabel fontSize={{ base: 'sm', md: 'md' }}>From Year</FormLabel>
            <Select value={getDateParts(from).year} onChange={(e) => handleDateChange('from', 'year', e.target.value)} size={{ base: 'sm', md: 'md' }} aria-label="Select from year">
              {YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontSize={{ base: 'sm', md: 'md' }}>From Month</FormLabel>
            <Select
              value={getDateParts(from).month}
              onChange={(e) => handleDateChange('from', 'month', e.target.value)}
              isDisabled={getDateParts(from).year === 'All'}
              size={{ base: 'sm', md: 'md' }}
              aria-label="Select from month"
            >
              {MONTHS.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontSize={{ base: 'sm', md: 'md' }}>To Year</FormLabel>
            <Select value={getDateParts(to).year} onChange={(e) => handleDateChange('to', 'year', e.target.value)} size={{ base: 'sm', md: 'md' }} aria-label="Select to year">
              {YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontSize={{ base: 'sm', md: 'md' }}>To Month</FormLabel>
            <Select
              value={getDateParts(to).month}
              onChange={(e) => handleDateChange('to', 'month', e.target.value)}
              isDisabled={getDateParts(to).year === 'All'}
              size={{ base: 'sm', md: 'md' }}
              aria-label="Select to month"
            >
              {MONTHS.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontSize={{ base: 'sm', md: 'md' }}>Status</FormLabel>
            <Select placeholder="All" value={status} onChange={(e) => onChange('status', e.target.value)} size={{ base: 'sm', md: 'md' }} aria-label="Select status">
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontSize={{ base: 'sm', md: 'md' }}>Customer</FormLabel>
            <Select placeholder="All" value={customer} onChange={(e) => onChange('customer', e.target.value)} size={{ base: 'sm', md: 'md' }} aria-label="Select customer">
              {customers?.map((c) => (
                <option key={c.id} value={c.companyName}>
                  {c.companyName}
                </option>
              ))}
            </Select>
          </FormControl>
        </VStack>
      </Collapse>
    </Box>
  );
};

export default FilterBar;
