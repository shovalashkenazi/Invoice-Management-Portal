import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../pages/dashboard/index";

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="*" element={<h1>404 - Not Found</h1>} />
  </Routes>
);

export default AppRoutes;
