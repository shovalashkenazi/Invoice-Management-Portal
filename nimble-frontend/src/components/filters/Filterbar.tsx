import {
  Box,
  FormControl,
  FormLabel,
  Select,
  VStack,
  Text,
} from "@chakra-ui/react";

interface Customer {
  id: string;
  companyName: string;
}

interface Props {
  from: string;
  to: string;
  status: string;
  customer: string;
  customers: Customer[];
  onChange: (filters: {
    from: string;
    to: string;
    status: string;
    customer: string;
  }) => void;
}

const FilterBar = ({
  from,
  to,
  status,
  customer,
  customers,
  onChange,
}: Props) => {
  // Generate years range (e.g., 2020-2025)
  const years = Array.from({ length: 2025 - 2020 + 1 }, (_, i) => 2020 + i).map(
    (year) => year.toString()
  );
  years.unshift("All");

  // Months array
  const months = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );
  months.unshift("All");

  return (
    <Box
      w={{ base: "100%", md: "260px" }}
      p={4}
      bg="white"
      borderRight="1px solid"
      borderColor="gray.200"
      h="800px"
      minHeight="800px"
      maxHeight="800px"
      position="sticky"
      top="0"
      overflowY="auto"
      borderRadius="xl"
    >
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        Filters
      </Text>

      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel>From Year</FormLabel>
          <Select
            value={from.split("-")[0] || "All"}
            onChange={(e) => {
              const year =
                e.target.value === "All" ? "" : `${e.target.value}-01`;
              onChange({ from: year, to, status, customer });
            }}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>From Month</FormLabel>
          <Select
            value={from.split("-")[1] || "All"}
            onChange={(e) => {
              const year =
                from.split("-")[0] || new Date().getFullYear().toString();
              const month = e.target.value === "All" ? "" : e.target.value;
              const newFrom = month ? `${year}-${month}` : year;
              onChange({ from: newFrom, to, status, customer });
            }}
            isDisabled={!from || from === "All"}
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>To Year</FormLabel>
          <Select
            value={to.split("-")[0] || "All"}
            onChange={(e) => {
              const year =
                e.target.value === "All" ? "" : `${e.target.value}-12`;
              onChange({ from, to: year, status, customer });
            }}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>To Month</FormLabel>
          <Select
            value={to.split("-")[1] || "All"}
            onChange={(e) => {
              const year =
                to.split("-")[0] || new Date().getFullYear().toString();
              const month = e.target.value === "All" ? "" : e.target.value;
              const newTo = month ? `${year}-${month}` : year;
              onChange({ from, to: newTo, status, customer });
            }}
            isDisabled={!to || to === "All"}
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Status</FormLabel>
          <Select
            placeholder="All"
            value={status}
            onChange={(e) =>
              onChange({ from, to, status: e.target.value, customer })
            }
          >
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="PENDING">PENDING</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Customer</FormLabel>
          <Select
            placeholder="All"
            value={customer}
            onChange={(e) =>
              onChange({ from, to, status, customer: e.target.value })
            }
          >
            {customers?.map((c) => (
              <option key={c.id} value={c.companyName}>
                {c.companyName}
              </option>
            ))}
          </Select>
        </FormControl>
      </VStack>
    </Box>
  );
};

export default FilterBar;
