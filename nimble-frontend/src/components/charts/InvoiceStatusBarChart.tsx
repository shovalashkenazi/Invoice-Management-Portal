import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Box, Text } from "@chakra-ui/react";

const InvoiceStatusBarChart = ({
  data,
}: {
  data: { status: string; total: number }[];
}) => {
  if (!data?.length)
    return (
      <Box
        w="100%"
        h="300px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="gray.400">No data available</Text>
      </Box>
    );

  return (
    <Box mt={9} w="100%" h="300px">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="status" tick={{ fontSize: 12 }} height={50} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="total" fill="#6B46C1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default InvoiceStatusBarChart;
