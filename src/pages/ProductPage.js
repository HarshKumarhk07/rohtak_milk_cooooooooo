

import React, { useState, useEffect } from "react";
import apiClient from '../services/apiClient';
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import {
  FaHeart,
  FaShareAlt,
  FaStar,
  FaChevronLeft,
  FaChevronRight,
  FaSearchPlus,
  FaSearchMinus,
} from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const userSelectedVariantRef = React.useRef(false); // tracks if user manually picked a variant
  const [similarProducts, setSimilarProducts] = useState([]);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { user, wishlist, fetchWishlist, loading: authLoading } = useAuth();
  const isAuthenticated = Boolean(user || localStorage.getItem("token"));
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [heartAnimation, setHeartAnimation] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  const [dynamicRating, setDynamicRating] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false); // desktop hover zoom
  const [isFullScreen, setIsFullScreen] = useState(false); // mobile fullscreen zoom
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedPincode, setSelectedPincode] = useState(() => localStorage.getItem("selectedPincode") || '');

  // Detect mobile
  const isMobile = window.matchMedia("(pointer: coarse)").matches;

  // Persist pincode
  useEffect(() => {
    if (selectedPincode.length === 6) {
      localStorage.setItem("selectedPincode", selectedPincode);
      window.dispatchEvent(new Event("pincode-updated"));
    }
  }, [selectedPincode]);

  const normalizeSize = (size) => size ? size.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]/g, '').trim() : '';

  // Pincode-aware variant resolution:
  // - If a 6-digit pincode is entered → show ONLY sizes set up for that pincode in pincodePricing
  // - If no pincode → show sizes from product.variants (global catalog)
  // This ensures exactly what the admin set in the backend is what the user sees.
  const availableVariants = React.useMemo(() => {
    if (!product) return [];

    if (selectedPincode.length === 6) {
      // Get all pincode pricing entries for this specific pincode
      const pincodeEntries = (product.pincodePricing || []).filter(
        p => p.pincode === selectedPincode.trim() && p.size
      );

      if (pincodeEntries.length > 0) {
        const seen = new Map();
        pincodeEntries.forEach(p => {
          const normSize = normalizeSize(p.size);
          if (!seen.has(normSize)) {
            // Try to enrich with matching product.variant data (e.g. _id)
            const matchingVariant = (product.variants || []).find(
              v => normalizeSize(v.size) === normSize
            );
            seen.set(normSize, {
              ...(matchingVariant || {}),
              size: p.size, // use the size label from pincodePricing
              price: Number(p.price),
              originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
              countInStock: Number(p.inventory),
              _id: matchingVariant?._id || `pincode-${p.size}`,
            });
          }
        });
        return Array.from(seen.values());
      }
      // Pincode exists but no entries — show nothing (will show unavailable)
      return [];
    }

    // No pincode — fall back to product.variants
    return [...(product.variants || []).map(v => ({ ...v }))];
  }, [product, selectedPincode]);

  const isNewArrival = (creationTime) => {
    const oneDay = 24 * 60 * 60 * 1000;
    const creationDate = new Date(creationTime);
    const today = new Date();
    const diffDays = Math.round(Math.abs((today - creationDate) / oneDay));
    return diffDays < 15;
  };

  // Placeholder for reviews (will be generated dynamically)
  const generateReviews = (productId) => {
    const pseudoRandom = (productId.charCodeAt(productId.length - 1) % 10) / 10;
    const rating = (4.2 + (pseudoRandom * 0.7)).toFixed(1);
    const reviews = (100 + (pseudoRandom * 400)).toFixed(0);
    return { rating, reviews };
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await apiClient.get(
          `/products/${id}`
        );
        setProduct(response.data);

        if (response.data.variants && response.data.variants.length > 0) {
          // Initial selection logic moved to separate useEffect
          const ratingInfo = generateReviews(response.data._id);
          setDynamicRating(ratingInfo);
        }
      } catch (err) {
        setError("Product not found.");
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 1500);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      if (product && product.category) {
        try {
          const catId = product.category._id || product.category;
          const response = await apiClient.get(`/products/category/${catId}`);
          // Filter out current product and take top 8
          const filtered = response.data
            .filter(p => p._id !== product._id)
            .slice(0, 8);
          setSimilarProducts(filtered);
        } catch (error) {
          console.error("Failed to fetch similar products:", error);
        }
      }
    };
    fetchSimilarProducts();
  }, [product, id]);

  useEffect(() => {
    if (!user) {
      setIsWishlisted(false);
      return;
    }
    const isInWishlist = wishlist.some((item) => item._id === id);
    setIsWishlisted(isInWishlist);
  }, [id, user, wishlist]);

  // When pincode changes reset manual-selection flag so auto-select can pick the right variant for the new context
  useEffect(() => {
    userSelectedVariantRef.current = false;
    setSelectedVariant(null);
  }, [selectedPincode]);

  // Auto-select the first/best variant whenever availableVariants changes (product load or pincode change)
  useEffect(() => {
    if (availableVariants.length > 0 && !userSelectedVariantRef.current) {
      // Pick the first variant with stock, or just the first one
      const best = availableVariants.find(v => Number(v.countInStock) > 0) || availableVariants[0];
      setSelectedVariant(best);
    }
  }, [availableVariants]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!selectedVariant) {
      alert("Please select a pack size first.");
      return;
    }
    const pincodeRule = (selectedPincode && selectedVariant)
      ? product?.pincodePricing?.find((entry) => entry.pincode === selectedPincode.trim() && normalizeSize(entry.size) === normalizeSize(selectedVariant.size))
      : null;
    const effectiveStock = pincodeRule ? Number(pincodeRule.inventory) : 0;
    const effectivePrice = pincodeRule ? Number(pincodeRule.price) : null;
    const effectiveOriginalPrice = pincodeRule ? (pincodeRule.originalPrice || null) : null;

    if (selectedPincode && !pincodeRule) {
      alert("This product is not available for selected pincode.");
      return;
    }
    if (effectiveStock <= 0) {
      alert("This pack size is out of stock.");
      return;
    }
    const productToAdd = {
      _id: product._id,
      name: product.name,
      images: product.images,
      pincodePricing: product.pincodePricing,
      selectedVariant: {
        ...selectedVariant,
        price: effectivePrice,
        originalPrice: effectiveOriginalPrice,
        countInStock: effectiveStock,
      },
    };
    addToCart(productToAdd);
    alert(`${product.name} (${selectedVariant.size}) added to cart!`);
  };

  const isVideo = (url) => {
    if (!url) return false;
    const videoExtensions = [".mp4", ".mov", ".webm", ".ogg", ".m4v"];
    return videoExtensions.some((ext) => url.toLowerCase().includes(ext)) || url.includes("/video/upload/");
  };

  const maskPhoneNumber = (phone = "") => {
    const digits = String(phone).replace(/\D/g, "");
    if (digits.length <= 4) return digits;
    return `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`;
  };

  const nextImage = () => {
    setActiveImageIndex(
      (prevIndex) => (prevIndex + 1) % product.images.length
    );
  };

  const prevImage = () => {
    setActiveImageIndex(
      (prevIndex) =>
        (prevIndex - 1 + product.images.length) % product.images.length
    );
  };

  const toggleWishlist = async () => {
    try {
      if (!user) {
        alert("Please login to use wishlist.");
        return;
      }
      if (isWishlistLoading) return;
      setIsWishlistLoading(true);

      const pc = localStorage.getItem("selectedPincode");
      const previousWishlistState = isWishlisted;
      setIsWishlisted(!previousWishlistState); // Optimistic Update

      if (previousWishlistState) {
        await apiClient.delete(`/wishlist/${product._id}`, {
          params: { pincode: pc }
        });
      } else {
        await apiClient.post(`/wishlist/${product._id}`, {
          pincode: pc
        });
      }
      await fetchWishlist(pc);

      if (!previousWishlistState) { // Only animate when adding to wishlist
        setHeartAnimation(true);
        setTimeout(() => setHeartAnimation(false), 1000);
      }
    } catch (err) {
      console.error(err);
      setIsWishlisted(!isWishlisted); // Revert on failure
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleShare = () => {
    const link = window.location.href;
    navigator.clipboard
      .writeText(link)
      .then(() => alert("Product link copied to clipboard!"))
      .catch(() => alert("Failed to copy link"));
  };

  const handleMouseMove = (e) => {
    if (!isZoomed) return;
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setMousePosition({ x, y });
  };

  if (loading) return <LoadingSpinner />;
  if (error)
    return <div className="text-center text-red-500 mt-10">{error}</div>;
  if (!product) return null;

  const productDescriptionParagraphs = product.description
    .split("\n\n")
    .map((p, i) => (
      <p key={i} className="mt-4 first:mt-0 leading-relaxed text-gray-700">
        {p}
      </p>
    ));

  const pincodeRule = (selectedPincode && selectedVariant)
    ? product?.pincodePricing?.find((entry) => entry.pincode === selectedPincode.trim() && normalizeSize(entry.size) === normalizeSize(selectedVariant.size))
    : null;

  const effectivePrice = pincodeRule ? Number(pincodeRule.price) : null;
  const effectiveOriginalPrice = pincodeRule ? (pincodeRule.originalPrice || null) : null;
  const effectiveStock = pincodeRule ? Number(pincodeRule.inventory) : 0;
  const isCheckingPincode = selectedPincode.length > 0 && selectedPincode.length < 6;
  const isUnavailableForPincode = selectedPincode.length === 6 && !pincodeRule;
  const availableLocations = [...new Set(
    (product?.pincodePricing || [])
      .map((entry) => entry.location)
      .filter(Boolean)
  )];

  return (
    <div className="container mx-auto px-4 py-2 md:py-4 bg-white">
      {/* Full-screen image modal for mobile zoom */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4"
            onClick={() => setIsFullScreen(false)}
          >
            <motion.img
              src={product.images[activeImageIndex]}
              alt={product.name}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="max-w-full max-h-full object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main product page layout */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-8 items-start justify-center">
        {/* Image and Video Gallery */}
        <div className="w-full md:w-1/2">
          <div
            className="relative w-full h-[250px] md:h-[420px] bg-gray-50 rounded-2xl shadow-xl overflow-hidden group"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setIsZoomed(false)}
            onClick={() => {
              if (isMobile && !isVideo(product.images[activeImageIndex])) {
                setIsFullScreen(true);
              }
            }}
          >
            {isVideo(product.images[activeImageIndex]) ? (
              <video
                src={product.images[activeImageIndex]}
                controls
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain p-4"
              />
            ) : (
              <img
                src={product.images[activeImageIndex]}
                alt={product.name}
                className={`w-full h-full object-contain p-4 transition-transform duration-500 ease-in-out ${isZoomed && !isMobile ? "scale-110" : "scale-100"
                  }`}
              />
            )}

            {/* Out of Stock Overlay like Blinkit */}
            {selectedVariant && !isCheckingPincode && (
              selectedPincode.length === 6
                ? (!pincodeRule || effectiveStock <= 0)
                : (selectedVariant.countInStock <= 0)
            ) && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                  <div className="bg-red-600 text-white font-black px-6 py-2 rounded-lg shadow-xl transform -rotate-12 scale-110 border-2 border-white text-center">
                    {selectedPincode.length === 6 && !pincodeRule ? 'NOT AVAILABLE AT PINCODE' : 'OUT OF STOCK'}
                  </div>
                </div>
              )}

            {/* Desktop zoom toggle */}
            {!isVideo(product.images[activeImageIndex]) && !isMobile && (
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className="hidden md:flex absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-md hover:bg-white transition z-30"
                aria-label="Toggle zoom"
              >
                {isZoomed ? (
                  <FaSearchMinus className="text-gray-700" />
                ) : (
                  <FaSearchPlus className="text-gray-700" />
                )}
              </button>
            )}

            {/* Zoom lens background (desktop only) */}
            {isZoomed && !isMobile && (
              <div
                className="hidden md:block absolute top-0 left-0 w-full h-full cursor-none z-20"
                style={{
                  backgroundImage: `url(${product.images[activeImageIndex]})`,
                  backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
                  backgroundSize: "200%",
                }}
              />
            )}

            {/* Mobile zoom icon */}
            {!isVideo(product.images[activeImageIndex]) && isMobile && (
              <button
                onClick={() => setIsFullScreen(true)}
                className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition z-30"
                aria-label="Full screen zoom"
              >
                <FaSearchPlus className="text-gray-700" />
              </button>
            )}

            {/* Navigation arrows */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-md hover:bg-white transition z-30"
                >
                  <FaChevronLeft className="text-gray-700" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-md hover:bg-white transition z-30"
                >
                  <FaChevronRight className="text-gray-700" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail grid */}
          <div className="flex space-x-2 md:space-x-4 mt-4 overflow-x-auto pb-4">
            {product.images.map((img, index) => (
              <div
                key={index}
                className={`flex-shrink-0 w-16 h-16 md:w-24 md:h-24 overflow-hidden rounded-md cursor-pointer border-2 transition-all duration-300 ${activeImageIndex === index
                  ? "border-gray-900 shadow-md"
                  : "border-transparent hover:border-gray-400"
                  }`}
                onClick={() => {
                  setActiveImageIndex(index);
                }}
              >
                {isVideo(img) ? (
                  <video src={img} muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <img
                    src={img}
                    alt={`${product.name} thumbnail ${index}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Product details */}
        <div className="w-full md:w-1/2 flex flex-col p-1 md:p-0">
          <div className="flex items-center justify-between mb-2">
            {isNewArrival(product.createdAt) && (
              <span className="bg-gray-200 text-gray-700 text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full tracking-wide">
                New Arrival
              </span>
            )}
            <div className="flex space-x-4 ml-auto relative">
              <button
                onClick={toggleWishlist}
                className="relative p-2 rounded-full hover:bg-gray-100 transition"
              >
                <FaHeart
                  className={`text-2xl transition-transform duration-300 ${user && isWishlisted
                    ? "text-red-500 scale-110"
                    : "text-gray-400 hover:text-red-400"
                    }`}
                />
                <AnimatePresence>
                  {heartAnimation && (
                    <motion.div
                      initial={{ opacity: 1, y: 0, scale: 1 }}
                      animate={{ opacity: 0, y: -40, scale: 1.5 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      className="absolute top-0 left-1/2 -translate-x-1/2 text-red-500"
                    >
                      <FaHeart />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-gray-100 transition"
              >
                <FaShareAlt className="text-2xl text-gray-400 hover:text-gray-900" />
              </button>
            </div>
          </div>

          <h1 className="text-lg md:text-[22px] font-extrabold text-gray-900 leading-tight tracking-tight mt-1">
            {product.name}
          </h1>
          <p className="text-xs md:text-sm font-medium text-gray-500">{product.brand}</p>

          {dynamicRating && (
            <div className="flex items-center mt-3">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={`w-4 h-4 md:w-5 md:h-5 ${i < Math.floor(dynamicRating.rating)
                    ? "text-yellow-400"
                    : "text-gray-300"
                    }`}
                />
              ))}
              <span className="ml-2 text-xs md:text-sm text-gray-500">
                ({dynamicRating.reviews} Reviews)
              </span>
            </div>
          )}

          <div className="mt-3 flex flex-col gap-1">
            {selectedPincode.length < 6 ? (
              <p className="text-orange-600 font-bold text-sm md:text-base animate-pulse">
                Please enter 6-digit pincode to check price and availability.
              </p>
            ) : (
              <>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl md:text-3xl font-extrabold text-gray-900">
                    ₹{effectivePrice ?? "N/A"}
                  </span>
                  {effectiveOriginalPrice && (
                    <span className="text-base md:text-xl text-gray-400 font-medium">
                      MRP: <span className="line-through decoration-red-500/40">₹{effectiveOriginalPrice}</span>
                    </span>
                  )}
                </div>
                {effectiveOriginalPrice && effectivePrice && (
                  <span className="inline-block bg-green-100 text-green-700 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full w-fit">
                    SAVE ₹{effectiveOriginalPrice - effectivePrice} ({Math.round(((effectiveOriginalPrice - effectivePrice) / effectiveOriginalPrice) * 100)}% OFF)
                  </span>
                )}
              </>
            )}
          </div>

          <div className="mt-4">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm md:text-base">Pincode <span className="text-red-600">*</span>:</h4>
            <input
              type="text"
              value={selectedPincode}
              onChange={(e) => setSelectedPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6 digit pincode"
              className="w-full p-2 border rounded-md text-sm"
            />
            {selectedPincode.length === 6 && pincodeRule && (
              <div className="mt-1 text-xs font-semibold">
                <p className="text-gray-700">Location: {pincodeRule.location || 'Matched Area'}</p>
                <p className={effectiveStock > 0 ? "text-green-700" : "text-red-600"}>
                  Availability: {effectiveStock > 0 ? `Available (Qty ${effectiveStock})` : 'Out of stock for this pincode'}
                </p>
              </div>
            )}
            {isUnavailableForPincode && (
              <p className="mt-1 text-xs text-red-600 font-semibold">Product not available at this pincode.</p>
            )}
            {availableLocations.length > 0 && (
              <p className="mt-1 text-[11px] text-gray-500">
                Available Locations: {availableLocations.join(', ')}
              </p>
            )}
          </div>

          {/* Pack Size Selection */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm md:text-base">Select Pack Size:</h4>
            <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
              {availableVariants.map((variant, index) => {
                const isSelected = selectedVariant && normalizeSize(selectedVariant.size) === normalizeSize(variant.size);
                const rule = selectedPincode.length === 6
                  ? product.pincodePricing?.find(p => p.pincode === selectedPincode.trim() && normalizeSize(p.size) === normalizeSize(variant.size))
                  : null;
                const stock = selectedPincode.length === 6
                  ? (rule ? Number(rule.inventory) : 0)
                  : Number(variant.countInStock);
                const isOutOfStock = stock <= 0 && !isCheckingPincode;
                const isUnavailableHere = selectedPincode.length === 6 && !rule;

                return (
                  <button
                    key={variant._id || `variant-${index}`}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      userSelectedVariantRef.current = true;
                      setSelectedVariant(variant);
                    }}
                    className={`py-1 md:py-2 px-2 rounded-md font-medium text-[9px] md:text-xs transition-all duration-300 border shadow-sm relative z-30 flex flex-col items-center justify-center min-h-[45px]
                      ${isSelected
                        ? "bg-gray-900 text-white border-gray-900 transform scale-105"
                        : "bg-white text-gray-800 border-gray-300 hover:border-gray-900"
                      }
                      ${(isOutOfStock || isUnavailableHere)
                        ? "opacity-60 grayscale bg-gray-50 text-gray-400 border-gray-200"
                        : "hover:shadow-md cursor-pointer active:scale-95"
                      }`}
                  >
                    <span>{variant.size}</span>
                    {isUnavailableHere ? (
                      <span className="text-[7px] md:text-[8px] font-bold text-orange-500 mt-0.5 uppercase">N/A Here</span>
                    ) : isOutOfStock ? (
                      <span className="text-[7px] md:text-[8px] font-bold text-red-500 mt-0.5 uppercase">Out of stock</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h4 className="font-semibold text-gray-800 mb-1 text-[10px] md:text-sm">Description:</h4>
            <div className="text-[11px] md:text-xs text-gray-700 leading-relaxed">
              {productDescriptionParagraphs}
            </div>
          </div>

          {/* Action Button */}
          {/* --- Add to Cart button disabled for "Coming Soon" launch (code kept, only commented out) ---
          <div className="mt-8">
            {product.isComingSoon ? (
              <button
                className="w-full bg-yellow-500 text-white font-bold py-3 md:py-4 rounded-md text-base md:text-lg cursor-not-allowed shadow-md"
                disabled
              >
                Coming Soon
              </button>
            ) : (selectedPincode.length === 6 && selectedVariant && effectiveStock > 0 && !isUnavailableForPincode) ? (
              <button
                onClick={handleAddToCart}
                className={`w-full font-bold py-3 md:py-4 rounded-md text-sm md:text-base transition transform shadow-lg ${isAuthenticated
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02]"
                  }`}
              >
                {isAuthenticated ? 'Add to Cart' : 'Login to Buy'}
              </button>
            ) : (
              <button
                className="w-full bg-gray-400 text-white font-bold py-3 md:py-4 rounded-md text-base md:text-lg cursor-not-allowed shadow-md"
                disabled
              >
                {selectedPincode.length < 6 ? 'Enter Pincode' : 'Out of Stock'}
              </button>
            )}
          </div>
          --- */}
        </div>
      </div>

      {/* Video & Consultation Section (Full Width Below) */}
      {product.videoUrl && (
        <div className="mt-4 md:mt-6 border-t border-gray-100 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 items-stretch">
            {/* Video Showcase Card */}
            <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm">
              <h3 className="text-sm md:text-base font-bold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">🖼️</span> Media Showcase
              </h3>
              <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-md bg-black">
                {(product.videoUrl.includes('youtube.com') || product.videoUrl.includes('youtu.be')) ? (
                  <iframe
                    src={product.videoUrl.replace('watch?v=', 'embed/').split('&')[0]}
                    title="Product Video"
                    className="absolute top-0 left-0 w-full h-full"
                    allowFullScreen
                  ></iframe>
                ) : (/\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i.test(product.videoUrl) || product.videoUrl.includes('/image/upload/')) ? (
                  <img
                    src={product.videoUrl}
                    alt={`${product.name} showcase`}
                    className="absolute top-0 left-0 w-full h-full object-contain bg-white"
                  />
                ) : (
                  <video
                    src={product.videoUrl}
                    controls
                    className="absolute top-0 left-0 w-full h-full object-contain"
                  ></video>
                )}
              </div>
            </div>

            {/* Book Consultation Card */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-green-600/10 shadow-sm flex flex-col items-center text-center justify-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-green-600"></div>

              <h3 className="text-lg md:text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">
                Authentic Farm Experience
              </h3>

              <p className="text-xs md:text-base text-gray-600 leading-relaxed mb-6 max-w-2xl">
                Go beyond the product and witness the purity firsthand. Join us for a personalized farm tour where you can see our heritage practices in action, connect with nature, and explore our chemical-free ecosystem through traditional farming techniques.
              </p>

              <div className="w-full max-w-4xl mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-green-100 bg-green-50/40 p-4 text-left">
                    <h4 className="text-sm md:text-base font-bold text-green-800 mb-3">Farmer Details</h4>
                    <div className="grid grid-cols-1 gap-2 text-xs md:text-sm text-gray-700">
                      {product.farmerName && <p><span className="font-semibold">Name:</span> {product.farmerName}</p>}
                      {product.farmerEmail && <p><span className="font-semibold">Email:</span> {product.farmerEmail}</p>}
                      {product.farmerPhone && <p><span className="font-semibold">Contact:</span> {maskPhoneNumber(product.farmerPhone)}</p>}
                      {product.farmerLocation && <p><span className="font-semibold">Location:</span> {product.farmerLocation}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 bg-green-50/50 p-2.5 rounded-lg border border-green-100/50">
                      <span className="text-green-600 font-bold text-[10px] md:text-xs">✓</span>
                      <span className="text-[9px] md:text-[11px] text-gray-700 font-semibold text-left">Guided Field Tours</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-50/50 p-2.5 rounded-lg border border-green-100/50">
                      <span className="text-green-600 font-bold text-[10px] md:text-xs">✓</span>
                      <span className="text-[9px] md:text-[11px] text-gray-700 font-semibold text-left">Expert Consulting</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-50/50 p-2.5 rounded-lg border border-green-100/50">
                      <span className="text-green-600 font-bold text-[10px] md:text-xs">✓</span>
                      <span className="text-[9px] md:text-[11px] text-gray-700 font-semibold text-left">Seasonal Harvesting</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-50/50 p-2.5 rounded-lg border border-green-100/50">
                      <span className="text-green-600 font-bold text-[10px] md:text-xs">✓</span>
                      <span className="text-[9px] md:text-[11px] text-gray-700 font-semibold text-left">Cattle Interaction</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-50/50 p-2.5 rounded-lg border border-green-100/50">
                      <span className="text-green-600 font-bold text-[10px] md:text-xs">✓</span>
                      <span className="text-[9px] md:text-[11px] text-gray-700 font-semibold text-left">Organic Diet Tips</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-50/50 p-2.5 rounded-lg border border-green-100/50">
                      <span className="text-green-600 font-bold text-[10px] md:text-xs">✓</span>
                      <span className="text-[9px] md:text-[11px] text-gray-700 font-semibold text-left">Natural Composting</span>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                to="/book-appointment"
                className="inline-flex items-center justify-center px-10 py-3 bg-green-600 text-white font-extrabold rounded-md hover:bg-green-700 transition-all shadow-md group border-b-4 border-green-800 text-[12px] md:text-base"
              >
                SCHEDULE YOUR VISIT
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>

              <div className="mt-6 flex items-center gap-2 text-[8px] md:text-[10px] text-green-700 font-bold uppercase tracking-widest bg-green-50 px-4 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Join 500+ Organic Families
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Similar Products Section */}
      {similarProducts.length > 0 && (
        <div className="mt-16 mb-20">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl md:text-2xl font-black text-gray-900">
              Recommended for You
            </h3>
            <div className="h-0.5 flex-grow mx-8 bg-gray-100 hidden md:block"></div>
            <button className="text-green-600 font-bold text-sm hover:underline">
              View All
            </button>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-8 gap-2 md:gap-4">
            {similarProducts.map((p) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;

