import { BellIcon, QuestionOutlineIcon } from "@chakra-ui/icons";
import {
  Box,
  Flex,
  IconButton,
  Avatar,
  Text,
  Tooltip,
  Divider,
  useColorModeValue,
} from "@chakra-ui/react";

const Navbar = () => {
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:3000/invoices/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("CSV uploaded successfully!");
      } else {
        const error = await res.text();
        alert("Upload failed: " + error);
      }
    } catch (err) {
      alert("Error uploading CSV");
      console.error(err);
    } finally {
      // מאפס את ה-input אחרי כל העלאה
      e.target.value = "";
    }
  };

  return (
    <Box
      fontFamily="Varela Round, sans-serif"
      bg="white"
      borderBottom="1px solid"
      borderColor="gray.200"
      px={6}
      py={3}
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Flex justify="space-between" align="center">
        {/* Logo / Title */}
        <Flex align="center" gap={3}>
          <Box
            bg="purple.100"
            p={2}
            borderRadius="100px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontWeight="bold" color="purple.600" fontSize="lg">
              🚀
            </Text>
          </Box>

          <Text
            fontSize="xl"
            fontWeight="bold"
            color={useColorModeValue("gray.800", "white")}
          >
            Main
          </Text>
        </Flex>

        {/* Actions */}
        <Flex align="center" gap={3}>
          {/* Upload CSV Button */}
          <input
            type="file"
            accept=".csv"
            id="csv-upload"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
          <label htmlFor="csv-upload">
            <Tooltip label="Upload CSV">
              <Text
                as="span"
                fontSize="sm"
                color="gray.600"
                ml={1}
                display={{ base: "none", md: "inline" }}
              >
                Upload CSV
              </Text>{" "}
              <IconButton
                as="span"
                icon={<Text fontSize="sm">📤</Text>}
                aria-label="Upload CSV"
                variant="ghost"
                size="sm"
              />
            </Tooltip>
          </label>

          <Divider orientation="vertical" height="20px" />

          <Tooltip label="Help">
            <IconButton
              icon={<QuestionOutlineIcon />}
              aria-label="Help"
              variant="ghost"
              size="sm"
            />
          </Tooltip>

          <Divider orientation="vertical" height="20px" />

          <Tooltip label="Notifications">
            <IconButton
              icon={<BellIcon />}
              aria-label="Notifications"
              variant="ghost"
              size="sm"
            />
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
