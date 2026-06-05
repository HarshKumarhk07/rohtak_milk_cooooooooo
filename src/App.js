// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import HomePage from './pages/HomePage';
// import ProductPage from './pages/ProductPage';
// import CartPage from './pages/CartPage';
// import LoginPage from './pages/LoginPage';
// import SignupPage from './pages/SignupPage';
// import AdminDashboard from './pages/AdminDashboard';
// import DeliveryDashboard from './pages/DeliveryDashboard';
// import Header from './components/Header';
// import Footer from './components/Footer';
// import MyOrdersPage from './pages/MyOrdersPage';
// import CategoryProductsPage from "./pages/CategoryProductsPage"
// import AllFeaturedProductsPage from './pages/AllFeaturedProductsPage';
// import GenderProductsPage from './pages/GenderProductsPage'
// src/App.js
import React, { useEffect } from 'react'; // Import useEffect
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import AdminDashboard from './pages/AdminDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import Header from './components/Header';
import Footer from './components/Footer';
import MyOrdersPage from './pages/MyOrdersPage';
import CategoryProductsPage from "./pages/CategoryProductsPage";
import AllFeaturedProductsPage from './pages/AllFeaturedProductsPage';
import GenderProductsPage from './pages/GenderProductsPage';
import AllRecentProductsPage from "./pages/AllRecentProductsPage";
import AllBestsellerProductsPage from "./pages/AllBestsellerProductsPage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import WalletPage from "./pages/WalletPage";
import AllProductsPage from "./pages/AllProductsPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import WishlistPage from "./pages/WishlistPage"
import LoginRegisterPage from "./pages/LoginRegisterPage";
import PremiumShowcase from "./pages/PremiumShowcase"
import AppointmentBookingPage from "./pages/AppointmentBookingPage";
import MyAppointmentsPage from "./pages/MyAppointmentsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsConditionsPage from "./pages/TermsConditionsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import SubscribePage from "./pages/SubscribePage";
import MySubscriptionsPage from "./pages/MySubscriptionsPage";
import ProfilePage from "./pages/ProfilePage";
import ComingSoonPopup from "./components/ComingSoonPopup";

// Define the ScrollToTop component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function AppLayout() {
  // No longer hiding header on homepage to ensure consistency

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop /> {/* Add the ScrollToTop component here */}
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<AllProductsPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginRegisterPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/myorders" element={<MyOrdersPage />} />
          <Route path="/delivery" element={<DeliveryDashboard />} />
          <Route path="/categories/:categoryId" element={<CategoryProductsPage />} />
          <Route path="/products/subcategory/:subCategory" element={<AllFeaturedProductsPage />} />
          <Route path="/type/:type" element={<GenderProductsPage />} />
          <Route path="/products/recent" element={<AllRecentProductsPage />} />
          <Route path="/products/bestseller" element={<AllBestsellerProductsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/blog" element={<PremiumShowcase />} />
          <Route path="/book-appointment" element={<AppointmentBookingPage />} />
          <Route path="/my-appointments" element={<MyAppointmentsPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsConditionsPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/subscribe" element={<SubscribePage />} />
          <Route path="/my-subscriptions" element={<MySubscriptionsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ComingSoonPopup />
      <AppLayout />
    </Router>
  );
}

export default App;