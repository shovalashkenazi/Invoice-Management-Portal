import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Box, Text } from "@chakra-ui/react";

interface PieData {
  status: string;
  total: number;
}

const COLORS = ["#6B46C1", "#ED8936", "#E53E3E"];

const InvoiceStatusPieChart = ({ data }: { data: PieData[] }) => {
  if (!data || data.length === 0)
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
    <Box w="100%" h="300px">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            dataKey="total"
            nameKey="status"
            data={data}
            cx="50%"
            cy="45%"
            outerRadius={80}
            fill="#8884d8"
            label
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ paddingTop: "10px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default InvoiceStatusPieChart;
