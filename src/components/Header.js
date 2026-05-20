import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineShoppingCart,
  HiOutlineUser,
  HiOutlineSearch,
  HiOutlineHeart,
  HiChevronRight,
  HiOutlineLocationMarker,
} from "react-icons/hi";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import apiClient from "../services/apiClient";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cartContext = useCart();
  const { logout, user } = useAuth();
  const cartItems = cartContext?.cartItems || [];

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [animateCart, setAnimateCart] = useState(false);
  const [categories, setCategories] = useState([]);
  const [pincode, setPincode] = useState(() => {
    if (window.location.pathname === "/login") return "";
    return localStorage.getItem("selectedPincode") || "124001";
  });
  const [isDeliverable, setIsDeliverable] = useState(null);

  const [showInitialPincodeModal, setShowInitialPincodeModal] = useState(false);
  const [modalPincode, setModalPincode] = useState("");
  const [triggerModalOnHome, setTriggerModalOnHome] = useState(false);

  useEffect(() => {
    // Check if we need to show the modal when we land on the home page
    if (location.pathname === "/" && triggerModalOnHome) {
      setShowInitialPincodeModal(true);
      setTriggerModalOnHome(false);
    }
  }, [location.pathname, triggerModalOnHome]);

  useEffect(() => {
    // Set default pincode if none is saved AND we are not on login page
    if (!localStorage.getItem("selectedPincode") && location.pathname !== "/login") {
      localStorage.setItem("selectedPincode", "124001");
      setPincode("124001");
      window.dispatchEvent(new Event("pincode-updated"));
    }

    // Show modal on mount if already logged in and not shown this session
    const token = localStorage.getItem("token");
    const modalShown = sessionStorage.getItem("pincodeModalShown");
    if (token && !modalShown) {
      sessionStorage.setItem("pincodeModalShown", "true");
      // Only show if we're not on the login page, otherwise queue it
      if (location.pathname !== "/login") {
        setShowInitialPincodeModal(true);
      } else {
        setTriggerModalOnHome(true);
      }
    }

    // Show modal after login event
    const handleUserLoggedIn = () => {
      sessionStorage.removeItem("pincodeModalShown"); // reset so it shows after fresh login
      const shownCheck = sessionStorage.getItem("pincodeModalShown");
      if (!shownCheck) {
        sessionStorage.setItem("pincodeModalShown", "true");
        // Queue it instead of showing immediately on the login page
        setTriggerModalOnHome(true);
      }
    };
    window.addEventListener("user-logged-in", handleUserLoggedIn);
    return () => window.removeEventListener("user-logged-in", handleUserLoggedIn);
  }, [location.pathname]); // Listen to path changes

  const handleModalClose = () => {
    // If user closes without entering, keep 124001 as default
    if (!localStorage.getItem("selectedPincode") || localStorage.getItem("selectedPincode") === "124001") {
      localStorage.setItem("selectedPincode", "124001");
      setPincode("124001");
      window.dispatchEvent(new Event("pincode-updated"));
    }
    setShowInitialPincodeModal(false);
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (modalPincode.length === 6) {
      setPincode(modalPincode);
      localStorage.setItem("selectedPincode", modalPincode);
      window.dispatchEvent(new Event("pincode-updated"));
      setShowInitialPincodeModal(false);
    } else {
      alert("Please enter a valid 6-digit Pincode");
    }
  };

  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 6) {
      setPincode(val);
    }
  };

  const handlePincodeSubmit = (e) => {
    if (e) e.preventDefault();
    if (pincode.length === 6) {
      localStorage.setItem("selectedPincode", pincode);
      window.dispatchEvent(new Event("pincode-updated"));
    }
  };

  useEffect(() => {
    if (pincode.length === 6) {
      const saved = localStorage.getItem("selectedPincode");
      if (saved !== pincode) {
        localStorage.setItem("selectedPincode", pincode);
        window.dispatchEvent(new Event("pincode-updated"));
      }
    } else if (pincode.length === 0) {
      if (localStorage.getItem("selectedPincode")) {
        localStorage.removeItem("selectedPincode");
        window.dispatchEvent(new Event("pincode-updated"));
      }
    }
  }, [pincode]);

  useEffect(() => {
    const handlePincodeUpdate = () => {
      const saved = localStorage.getItem("selectedPincode") || "124001";
      if (saved !== pincode) {
        setPincode(saved);
      }
    };
    window.addEventListener("pincode-updated", handlePincodeUpdate);
    return () => window.removeEventListener("pincode-updated", handlePincodeUpdate);
  }, [pincode]);

  useEffect(() => {
    const verifyServerAvailability = async (pc) => {
      if (!pc || pc.length !== 6) {
        setIsDeliverable(null);
        return;
      }
      try {
        // Fetch products for this pincode to see if anything is available
        const response = await apiClient.get("/products", {
          params: { pincode: pc, limit: 1 } // limit to 1 for efficiency
        });
        // If data is an array and has at least one product, it's deliverable/serviceable
        setIsDeliverable(Array.isArray(response.data) && response.data.length > 0);
      } catch (err) {
        console.error("Availability check failed:", err);
        setIsDeliverable(false);
      }
    };

    if (pincode.length === 6) {
      verifyServerAvailability(pincode);
    } else {
      setIsDeliverable(null);
    }
  }, [pincode]);

  // Fetch categories for the menu
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get("/categories");
        setCategories(response.data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Shrink-on-scroll listener
  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Animate cart on item count change
  useEffect(() => {
    if (cartItems.length > 0) {
      setAnimateCart(true);
      const timer = setTimeout(() => setAnimateCart(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartItems.length]);

  const handleLogout = async () => {
    await logout(); // Calls AuthContext logout which handles API and storage
    localStorage.removeItem("selectedPincode");
    sessionStorage.removeItem("pincodeModalShown");
    setPincode("");
    window.dispatchEvent(new Event("pincode-updated"));
    cartContext?.clearCart(); // Clear the cart on logout
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen((s) => !s);
    if (isSearchVisible) setIsSearchVisible(false);
  };

  const toggleSearch = () => {
    setIsSearchVisible((s) => !s);
    if (isMenuOpen) setIsMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSearchVisible(false);
      setIsMenuOpen(false);
    }
  };

  const navLinks = [
    { name: "New Release", path: "/products/recent" },
    { name: "Best Seller", path: "/products/bestseller" },
    { name: "Shop All", path: "/products" },
    { name: "Blog", path: "/blog" },
    { name: "Contact", path: "/contact" },
    { name: "Visit our khet", path: "/book-appointment" }];

  const isActive = (path) => location.pathname === path;

  const cartCount = cartItems.length;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
        ? "backdrop-blur-lg bg-white/80 shadow-lg text-gray-800"
        : "bg-white/90 backdrop-blur-md text-gray-800 border-b border-gray-100"
        }`}
      role="banner"
    >
      {/* Promo bar */}
      <div className="bg-green-600 text-white py-1.5 px-2 text-[9px] md:text-xs font-bold tracking-widest uppercase overflow-hidden relative">
        <div className="flex animate-marquee whitespace-nowrap min-w-max">
          <span className="px-4">Fresh Organic Vegetables at your doorstep. Get 20% off on your first order!</span>
          <span className="px-4">Fresh Organic Vegetables at your doorstep. Get 20% off on your first order!</span>
          <span className="px-4">Fresh Organic Vegetables at your doorstep. Get 20% off on your first order!</span>
          <span className="px-4">Fresh Organic Vegetables at your doorstep. Get 20% off on your first order!</span>
        </div>
      </div>

      {/* Coming Soon static banner */}
      <div className="bg-yellow-400 text-gray-900 py-1.5 px-2 text-center text-[10px] md:text-sm font-bold tracking-widest uppercase">
        Coming Soon at your doorstep
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-300 py-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center transition-all duration-300"
          aria-label="Gaon Se Ghar Tak Home"
        >
          <img src="/logo-2.jpeg" alt="Gaon Se Ghar Tak" className="h-[32px] w-[115px] md:h-[65px] md:w-[260px] object-contain mix-blend-multiply" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex flex-1 justify-center px-2">
          <ul className="flex items-center space-x-3 lg:space-x-5">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className={`relative font-semibold text-[11px] lg:text-sm transition-all duration-300 whitespace-nowrap px-1 py-1 group
                    ${isActive(link.path)
                      ? "text-green-700"
                      : "text-gray-600 hover:text-green-800"}`}
                >
                  {link.name}
                  <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-green-600 transition-all duration-300 transform origin-left
                    ${isActive(link.path) ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-30"}`}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right actions (desktop) */}
        <div className="hidden md:flex items-center space-x-3 lg:space-x-6">
          {/* Pincode Search Bar */}
          <form
            onSubmit={handlePincodeSubmit}
            className="flex items-center rounded-full bg-white/70 backdrop-blur px-3 py-1 border border-transparent focus-within:border-green-300 transition-all duration-200 shadow-sm"
          >
            <HiOutlineLocationMarker className="text-red-600 w-3.5 h-3.5 mr-1.5 shrink-0" />
            <input
              type="text"
              placeholder="Pincode"
              className="bg-transparent outline-none text-[11px] w-14 py-1"
              maxLength="6"
              value={pincode}
              onChange={handlePincodeChange}
            />
            {isDeliverable !== null && (
              <span className={`ml-1 text-[8px] lg:text-[9px] font-bold ${isDeliverable ? "text-green-600" : "text-red-500"} whitespace-nowrap`}>
                {isDeliverable ? "Available" : "Not Available"}
              </span>
            )}
          </form>
          <form
            onSubmit={handleSearch}
            className="flex items-center rounded-full bg-white/70 backdrop-blur px-3 py-1 border border-transparent focus-within:border-green-300 transition-all duration-200 shadow-sm"
          >
            <HiOutlineSearch className="text-gray-500 mr-1.5 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none w-20 lg:w-32 text-[11px] py-1"
            />
          </form>

          {user ? (
            <div className="flex items-center space-x-4">
              <Link
                to={user.role === "admin" ? "/admin" : user.role === "delivery" ? "/delivery" : "/myorders"}
                className={`transition-colors ${isActive("/admin") || isActive("/delivery") || isActive("/myorders") ? "text-green-700 font-bold" : "text-gray-600 hover:text-green-800"}`}
                title="Account"
              >
                <HiOutlineUser className="w-6 h-6" />
              </Link>
              <Link
                to="/my-appointments"
                className={`transition-colors text-sm font-medium ${isActive("/my-appointments") ? "text-green-700 font-bold" : "text-gray-600 hover:text-green-800"}`}
              >
                Your Appointment
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-green-800 transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className={`transition-all duration-300 font-bold px-4 py-1.5 rounded-full ${isActive("/login") ? "bg-green-600 text-white shadow-md shadow-green-200" : "text-gray-600 hover:text-green-800 hover:bg-green-50"}`}>
              Login
            </Link>
          )}

          <Link to="/wishlist" className="text-gray-600 hover:text-red-500 transition-colors" title="Wishlist">
            <HiOutlineHeart className="w-6 h-6" />
          </Link>

          <Link to="/cart" className="relative text-gray-600 hover:text-green-800 transition-colors" title="Cart">
            <HiOutlineShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center transition-all duration-300 transform ${animateCart ? "scale-125" : "scale-100"}`}>
                {cartCount}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile icons */}
        <div className="md:hidden flex items-center space-x-1.5">
          {/* Mobile Pincode Search */}
          <form
            onSubmit={handlePincodeSubmit}
            className="flex items-center bg-white/70 backdrop-blur border border-transparent rounded-full px-1.5 py-0.5 mr-1 shadow-sm"
          >
            <HiOutlineLocationMarker className="text-red-600 w-3 h-3 mr-0.5" />
            <input
              type="text"
              placeholder="Zip"
              className="bg-transparent outline-none text-[9px] w-10"
              maxLength="6"
              value={pincode}
              onChange={handlePincodeChange}
            />
            {isDeliverable !== null && (
              <span className={`ml-1 text-[6px] font-bold ${isDeliverable ? "text-green-600" : "text-red-500"} whitespace-nowrap`}>
                {isDeliverable ? "Available" : "Not Available"}
              </span>
            )}
          </form>
          <button onClick={toggleSearch} className="text-gray-600 p-1"><HiOutlineSearch className="w-5 h-5" /></button>
          <Link to="/cart" className="relative text-gray-600 p-1">
            <HiOutlineShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full w-3.5 h-3.5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <button onClick={toggleMenu} className="text-gray-600 p-1">
            {isMenuOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile search expanded */}
      {isSearchVisible && (
        <div className="md:hidden px-4 pb-4 animate-in fade-in slide-in-from-top-2">
          <form onSubmit={handleSearch} className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl outline-none border-none focus:ring-2 focus:ring-green-500/20"
            />
          </form>
        </div>
      )}

      {/* Enhanced Mobile slide-in menu */}
      <div
        className={`fixed inset-0 z-[60] md:hidden transition-all duration-300 ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={toggleMenu} />
        <aside className={`absolute top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-out transform ${isMenuOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col`}>

          {/* Menu Header */}
          <div className="p-5 border-b flex items-center justify-between bg-gray-50">
            <Link to="/" onClick={toggleMenu}>
              <img src="/logo-2.jpeg" alt="Logo" className="h-10 w-auto object-contain mix-blend-multiply" />
            </Link>
            <button onClick={toggleMenu} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"><HiOutlineX className="w-6 h-6" /></button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* User Info Section */}
            <div className="p-6 bg-gradient-to-r from-green-50 to-white">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">Hi, {user.name || "User"}</h3>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              ) : (
                <Link to="/login" onClick={toggleMenu} className="flex items-center space-x-3 text-green-600 font-bold">
                  <div className="w-10 h-10 border-2 border-dashed border-green-200 rounded-full flex items-center justify-center">
                    <HiOutlineUser className="w-5 h-5" />
                  </div>
                  <span>Sign In / Register</span>
                </Link>
              )}
            </div>

            {/* Quick Links Grid */}
            <div className="grid grid-cols-2 gap-4 p-6 border-b">
              <Link to="/cart" onClick={toggleMenu} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors">
                <div className="relative mb-1">
                  <HiOutlineShoppingCart className="w-6 h-6 text-gray-700" />
                  {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>}
                </div>
                <span className="text-xs font-medium text-gray-600">Cart</span>
              </Link>
              <Link to="/wishlist" onClick={toggleMenu} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl hover:bg-red-50 transition-colors">
                <HiOutlineHeart className="w-6 h-6 text-gray-700 mb-1" />
                <span className="text-xs font-medium text-gray-600">Wishlist</span>
              </Link>
            </div>

            {/* Navigation Navigation */}
            <nav className="p-4">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-4">Main Menu</h4>
              <ul className="space-y-1">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      onClick={toggleMenu}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 group
                        ${isActive(link.path)
                          ? "bg-green-50 text-green-700 border-l-4 border-green-600 shadow-sm"
                          : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      <span className={`font-medium ${isActive(link.path) ? "ml-1" : ""}`}>{link.name}</span>
                      <HiChevronRight className={`w-4 h-4 transition-transform ${isActive(link.path) ? "text-green-600 translate-x-1" : "text-gray-300 group-hover:translate-x-1"}`} />
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Categories Section */}
              {categories.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-4">Shop By Category</h4>
                  <ul className="space-y-1">
                    {categories.map((cat) => (
                      <li key={cat._id}>
                        <Link
                          to={`/categories/${cat._id}`}
                          onClick={toggleMenu}
                          className="flex items-center p-2 text-gray-600 hover:text-green-800 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden mr-3">
                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-sm font-medium">{cat.name}</span>
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link to="/products" onClick={toggleMenu} className="block p-3 text-green-600 text-sm font-bold text-center border-t mt-2">
                        View All Categories
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </nav>
          </div>

          {/* User Actions Footer */}
          <div className="p-6 border-t bg-gray-50 mt-auto">
            {user ? (
              <div className="space-y-4">
                <div className="space-y-1 pb-4 border-b border-gray-100">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Quick Access</h4>
                  <Link to="/products/recent" onClick={toggleMenu} className={`flex items-center p-2 rounded-lg transition-all ${isActive("/products/recent") ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-white"}`}>
                    <span className="text-sm font-medium">New Release</span>
                  </Link>
                  <Link to="/products/bestseller" onClick={toggleMenu} className={`flex items-center p-2 rounded-lg transition-all ${isActive("/products/bestseller") ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-white"}`}>
                    <span className="text-sm font-medium">Best Seller</span>
                  </Link>
                  <Link to="/products" onClick={toggleMenu} className={`flex items-center p-2 rounded-lg transition-all ${isActive("/products") ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-white"}`}>
                    <span className="text-sm font-medium">Shop All</span>
                  </Link>
                  <Link to="/contact" onClick={toggleMenu} className={`flex items-center p-2 rounded-lg transition-all ${isActive("/contact") ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-white"}`}>
                    <span className="text-sm font-medium">Contact</span>
                  </Link>
                  <Link to="/book-appointment" onClick={toggleMenu} className={`flex items-center p-2 rounded-lg transition-all ${isActive("/book-appointment") ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-white"}`}>
                    <span className="text-sm font-medium">Book Visit</span>
                  </Link>
                  <Link to="/blog" onClick={toggleMenu} className={`flex items-center p-2 rounded-lg transition-all ${isActive("/blog") ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-white"}`}>
                    <span className="text-sm font-medium">Blog</span>
                  </Link>
                  <Link to="/wishlist" onClick={toggleMenu} className={`flex items-center p-2 rounded-lg transition-all ${isActive("/wishlist") ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-white"}`}>
                    <span className="text-sm font-medium">Wishlist</span>
                  </Link>
                  <Link to="/my-appointments" onClick={toggleMenu} className={`flex items-center p-2 rounded-lg transition-all ${isActive("/my-appointments") ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-white"}`}>
                    <span className="text-sm font-medium">Your Appointment</span>
                  </Link>
                </div>
                <div className="space-y-3">
                  <Link
                    to={user.role === "admin" ? "/admin" : user.role === "delivery" ? "/delivery" : "/myorders"}
                    onClick={toggleMenu}
                    className={`flex items-center justify-center space-x-2 w-full py-2.5 bg-white border rounded-lg text-sm font-medium shadow-sm ${isActive("/admin") || isActive("/delivery") || isActive("/myorders") ? "border-green-600 text-green-700" : "border-gray-200 text-gray-700"}`}
                  >
                    <HiOutlineUser className="w-4 h-4" />
                    <span>Account Dashboard</span>
                  </Link>
                  <button
                    onClick={() => { handleLogout(); toggleMenu(); }}
                    className="w-full py-2.5 text-red-600 text-sm font-bold hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1 pb-4 border-b border-gray-100">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Quick Access</h4>
                  <Link to="/products/recent" onClick={toggleMenu} className={`flex items-center p-2 rounded-lg transition-all ${isActive("/products/recent") ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-white"}`}>
                    <span className="text-sm font-medium">New Release</span>
                  </Link>
                  <Link to="/products/bestseller" onClick={toggleMenu} className={`flex items-center p-2 rounded-lg transition-all ${isActive("/products/bestseller") ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-white"}`}>
                    <span className="text-sm font-medium">Best Seller</span>
                  </Link>
                  <Link to="/products" onClick={toggleMenu} className={`flex items-center p-2 rounded-lg transition-all ${isActive("/products") ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-white"}`}>
                    <span className="text-sm font-medium">Shop All</span>
                  </Link>
                  <Link to="/contact" onClick={toggleMenu} className={`flex items-center p-2 rounded-lg transition-all ${isActive("/contact") ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-white"}`}>
                    <span className="text-sm font-medium">Contact</span>
                  </Link>
                  <Link to="/book-appointment" onClick={toggleMenu} className={`flex items-center p-2 rounded-lg transition-all ${isActive("/book-appointment") ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-white"}`}>
                    <span className="text-sm font-medium">Book Visit</span>
                  </Link>
                  <Link to="/blog" onClick={toggleMenu} className={`flex items-center p-2 rounded-lg transition-all ${isActive("/blog") ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-white"}`}>
                    <span className="text-sm font-medium">Blog</span>
                  </Link>
                  <Link to="/wishlist" onClick={toggleMenu} className={`flex items-center p-2 rounded-lg transition-all ${isActive("/wishlist") ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-white"}`}>
                    <span className="text-sm font-medium">Wishlist</span>
                  </Link>
                  <Link to="/my-appointments" onClick={toggleMenu} className={`flex items-center p-2 rounded-lg transition-all ${isActive("/my-appointments") ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-white"}`}>
                    <span className="text-sm font-medium">Your Appointment</span>
                  </Link>
                </div>
                <Link
                  to="/login"
                  onClick={toggleMenu}
                  className="block w-full py-3 bg-green-600 text-white text-center rounded-xl font-bold shadow-lg shadow-green-200"
                >
                  Login to Your Account
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Initial Pincode Modal */}
      {showInitialPincodeModal && (
        <div className="fixed top-0 left-0 w-screen h-screen z-[9999] flex items-center justify-center p-4">
          {/* Enhanced Glassmorphism Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[8px] transition-all duration-300"></div>

          {/* Modal Container - Perfectly Centered */}
          <div className="relative bg-white rounded-[2.5rem] p-8 sm:p-10 w-full max-w-sm shadow-[0_25px_60px_rgba(0,0,0,0.3)] transform transition-all duration-500 scale-100 opacity-100 border border-white/20">
            {/* Close Button */}
            <button
              onClick={handleModalClose}
              className="absolute -top-4 -right-4 bg-white text-gray-500 hover:text-red-500 w-11 h-11 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-200 border border-gray-100 group z-50"
            >
              <HiOutlineX className="w-6 h-6 transform group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Header Content */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
                <HiOutlineLocationMarker className="w-8 h-8 text-green-600 animate-bounce-slow" />
              </div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight mb-2">Set Your Location</h2>
              <p className="text-[13px] text-gray-500 leading-relaxed font-medium">
                Please enter your pincode to see available <br /> products and special pricing for your area.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleModalSubmit} className="space-y-5">
              <div className="relative group">
                <input
                  type="text"
                  maxLength="6"
                  placeholder="000000"
                  value={modalPincode}
                  onChange={(e) => setModalPincode(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center tracking-[0.5em] text-2xl font-extrabold p-4 border-2 border-gray-100 bg-gray-50/50 rounded-2xl focus:outline-none focus:border-green-500 focus:bg-white transition-all placeholder:text-gray-200 placeholder:tracking-normal placeholder:font-bold"
                />
              </div>

              <div className="bg-green-50/50 rounded-xl p-3 flex items-start space-x-2 border border-green-100/50">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
                <p className="text-[11px] text-green-700 leading-snug">
                  Don't have a pincode? Closing this will show default products for <span className="font-bold underline">124001</span>.
                </p>
              </div>

              <button
                type="submit"
                disabled={modalPincode.length !== 6}
                className="w-full h-14 bg-green-600 text-white font-black text-lg rounded-2xl hover:bg-green-700 active:scale-[0.98] transition-all disabled:grayscale disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_10px_20px_rgba(22,163,74,0.3)] hover:shadow-[0_15px_25px_rgba(22,163,74,0.4)]"
              >
                Set Location
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
