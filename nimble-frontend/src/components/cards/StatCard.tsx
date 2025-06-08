import { Box, Text, IconButton, useColorModeValue } from "@chakra-ui/react";
import { InfoOutlineIcon } from "@chakra-ui/icons";

interface StatCardProps {
  title: string;
  value: string;
  actionLabel?: string;
  icon?: React.ReactElement; // שים לב: React.ReactElement ולא ReactNode
}

const StatCard = ({
  title,
  value,
  actionLabel,
  icon = <InfoOutlineIcon />,
}: StatCardProps) => {
  return (
    <Box
      bg={"white"}
      borderRadius="xl"
      p={4}
      boxShadow="sm"
      display="flex"
      flexDirection="column"
      gap={2}
      fontFamily={"Varela Round, sans-serif"}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Text fontSize="sm" color="gray.500" fontWeight="medium">
          {title}
        </Text>

        <IconButton
          icon={icon}
          aria-label="Stat icon"
          variant="ghost"
          size="sm"
          color="gray.400"
        />
      </Box>

      <Text fontSize="2xl" fontWeight="bold">
        {value}
        <Text as="span" fontSize="sm" ml={1}>
          $
        </Text>
      </Text>

      {actionLabel && (
        <Box
          mt={1}
          px={2}
          py={1}
          borderRadius="md"
          bg="purple.100"
          textAlign="center"
        >
          <Text fontSize="xs" color="purple.600" fontWeight="semibold">
            {actionLabel}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default StatCard;
