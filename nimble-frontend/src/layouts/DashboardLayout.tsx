import { Box } from "@chakra-ui/react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box
      fontFamily={"Varela Round, sans-serif"}
      minHeight="100vh"
      display="flex"
      flexDirection="column"
    >
      <Navbar />
      <Box
        as="main"
        flex="1"
        bg="gray.50"
        p={5}
        width="100%"
        mx="auto"
        overflowY="auto"
      >
        {children}
      </Box>
      <Footer />
    </Box>
  );
};

export default DashboardLayout;
