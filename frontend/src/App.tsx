import { Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Product } from "./pages/Product";
import { Profile } from "./pages/Profile";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { Inventory } from "./pages/admin/Inventory";
import { Clients } from "./pages/admin/Clients";
import { NotFound } from "./pages/NotFound";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/product" element={<Product />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/clients" element={<Clients />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
