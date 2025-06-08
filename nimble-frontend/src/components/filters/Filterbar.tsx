// components/layout/FilterBar.tsx
import {
  Box,
  FormControl,
  FormLabel,
  Input,
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
  return (
    <Box
      w={{ base: "100%", md: "260px" }}
      p={4}
      bg="white"
      borderRight="1px solid"
      borderColor="gray.200"
      h="full"
      position="sticky"
      borderRadius="xl"
      top="0"
    >
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        Filters
      </Text>

      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel>From</FormLabel>
          <Input
            type="date"
            value={from}
            onChange={(e) =>
              onChange({ from: e.target.value, to, status, customer })
            }
          />
        </FormControl>

        <FormControl>
          <FormLabel>To</FormLabel>
          <Input
            type="date"
            value={to}
            onChange={(e) =>
              onChange({ from, to: e.target.value, status, customer })
            }
          />
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
