import { BellIcon, QuestionOutlineIcon } from '@chakra-ui/icons';
import { Box, Flex, IconButton, Avatar, Text, Tooltip, Divider, useColorModeValue } from '@chakra-ui/react';

const Navbar = () => {
  return (
    <Box fontFamily="Varela Round, sans-serif" bg="white" borderBottom="1px solid" borderColor="gray.200" px={6} py={3} position="sticky" top={0} zIndex={10}>
      <Flex justify="space-between" align="center">
        {/* Logo / Title */}
        <Flex align="center" gap={3}>
          <Box bg="purple.100" p={2} borderRadius="100px" display="flex" alignItems="center" justifyContent="center">
            <Text fontWeight="bold" color="purple.600" fontSize="lg">
              🚀
            </Text>
          </Box>

          <Text fontSize="xl" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
            Main
          </Text>
        </Flex>

        {/* Actions */}
        <Flex align="center" gap={3}>
          <Divider orientation="vertical" height="20px" />

          <Tooltip label="Help">
            <IconButton icon={<QuestionOutlineIcon />} aria-label="Help" variant="ghost" size="sm" />
          </Tooltip>

          <Divider orientation="vertical" height="20px" />

          <Tooltip label="Notifications">
            <IconButton icon={<BellIcon />} aria-label="Notifications" variant="ghost" size="sm" />
          </Tooltip>

          <Divider orientation="vertical" height="20px" />

          <Text fontSize="sm" color="purple.600" fontWeight="medium">
            Supplier
          </Text>

          <Avatar size="sm" name="RB" bg="purple.500" color="white" />
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar;
