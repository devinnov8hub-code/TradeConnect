import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Register from "./components/register";
import Login from "./components/login";
import VerifyEmail from "./Admin/verifyEmail";
import VerifyOtp from "./Admin/VerifyOtp";
import Dashboard from "./Admin/Dashboard";
import Users from "./Admin/Users.farmers";
import Buyers from "./Admin/Users.buyers";
import Listings from "./Admin/Listings";
import Orders from "./Admin/Orders";
import Disputes from "./Admin/Disputes";
import AddListing from "./Admin/AddListing";
import AddFarmer from "./Admin/AddFarmer";
import FarmerProfile from "./Admin/FarmerProfile";
import { Marketplace } from "./Buyers/MarketPlace";
import LandingPage from "./components/LandingPage";
import { CartProvider } from "./Buyers/CartContext";
import BuyerOrders from "./Buyers/Orders";
import BuyerDisputes from "./Buyers/Disputes";
import BuyerSettings from "./Buyers/Settings";
import Checkout from "./Buyers/Checkout";
import ProduceDetail from "./Buyers/ProduceDetail";
import ProtectedRoute from "./components/ProtectedRoute";
import EditListing from "./Admin/EditListing";

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/" index element={<LandingPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmers"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyers"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Buyers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/listings"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Listings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-listing"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AddListing />
              </ProtectedRoute>
            }
          />
           <Route
            path="/listings/:id/edit"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EditListing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/disputes"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Disputes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmers/add"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AddFarmer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmers/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <FarmerProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/marketplace"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <Marketplace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace/orders"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <BuyerOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace/disputes"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <BuyerDisputes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace/settings"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <BuyerSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace/produce/:id"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <ProduceDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace/checkout"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <Checkout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
