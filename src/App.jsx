import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import RestaurantPage from "./pages/RestaurantPage";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/restaurant/:id" element={<RestaurantPage />} />
      </Routes>
    </BrowserRouter>
  );
}