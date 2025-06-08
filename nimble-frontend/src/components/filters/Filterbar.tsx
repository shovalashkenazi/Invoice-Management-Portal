import {
  Box,
  FormControl,
  FormLabel,
  Select,
  VStack,
  Text,
  Collapse,
  Button,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";

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
  const [isOpen, setIsOpen] = useState(true);
  const isMobile = useBreakpointValue({ base: true, md: false });

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
      p={{ base: 5, md: 4 }}
      bg="white"
      borderColor="gray.200"
      position={{ base: "relative", md: "sticky" }}
      top={{ base: 0, md: "0" }}
      overflowY="auto"
      borderRadius="xl"
      boxShadow={{ base: "sm", md: "none" }}
      h={{ base: "auto", md: "800px" }}
      minHeight={{ base: "auto", md: "800px" }}
      maxHeight={{ base: "none", md: "800px" }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Text fontSize="lg" fontWeight="bold">
          Filters
        </Text>
        {isMobile && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsOpen(!isOpen)}
            rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          >
            {isOpen ? "Hide" : "Show"}
          </Button>
        )}
      </Box>

      <Collapse in={isMobile ? isOpen : true}>
        <VStack spacing={{ base: 3, md: 4 }} align="stretch">
          <FormControl>
            <FormLabel fontSize={{ base: "sm", md: "md" }}>From Year</FormLabel>
            <Select
              value={from.split("-")[0] || "All"}
              onChange={(e) => {
                const year =
                  e.target.value === "All" ? "" : `${e.target.value}-01`;
                onChange({ from: year, to, status, customer });
              }}
              size={{ base: "sm", md: "md" }}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontSize={{ base: "sm", md: "md" }}>
              From Month
            </FormLabel>
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
              size={{ base: "sm", md: "md" }}
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontSize={{ base: "sm", md: "md" }}>To Year</FormLabel>
            <Select
              value={to.split("-")[0] || "All"}
              onChange={(e) => {
                const year =
                  e.target.value === "All" ? "" : `${e.target.value}-12`;
                onChange({ from, to: year, status, customer });
              }}
              size={{ base: "sm", md: "md" }}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontSize={{ base: "sm", md: "md" }}>To Month</FormLabel>
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
              size={{ base: "sm", md: "md" }}
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontSize={{ base: "sm", md: "md" }}>Status</FormLabel>
            <Select
              placeholder="All"
              value={status}
              onChange={(e) =>
                onChange({ from, to, status: e.target.value, customer })
              }
              size={{ base: "sm", md: "md" }}
            >
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="PENDING">PENDING</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontSize={{ base: "sm", md: "md" }}>Customer</FormLabel>
            <Select
              placeholder="All"
              value={customer}
              onChange={(e) =>
                onChange({ from, to, status, customer: e.target.value })
              }
              size={{ base: "sm", md: "md" }}
            >
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
