

// import React, { useState, useEffect, useRef } from "react";
// import apiClient from "../services/apiClient";
// import { Link } from "react-router-dom";
// import { BsArrowRight } from "react-icons/bs";
// import { FaHeart, FaShareAlt } from "react-icons/fa";
// import { useAuth } from "../context/AuthContext";
// import { motion, AnimatePresence } from "framer-motion";

// const ProductCard = ({ product }) => {
//   const [activeImageIndex, setActiveImageIndex] = useState(0);
//   const [heartAnimation, setHeartAnimation] = useState(false);
//   const [isVisible, setIsVisible] = useState(false);
//   const cardRef = useRef(null);
//   const intervalRef = useRef(null);

//   const { user, wishlist, fetchWishlist } = useAuth();

//   const isWishlisted = wishlist.some((item) => item._id === product._id);

//   // Auto image cycle
//   useEffect(() => {
//     if (isVisible) {
//       intervalRef.current = setInterval(() => {
//         setActiveImageIndex(
//           (prevIndex) => (prevIndex + 1) % product.images.length
//         );
//       }, 2000);
//     }
//     return () => clearInterval(intervalRef.current);
//   }, [product.images, isVisible]);

//   // Intersection Observer for lazy loading
//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting) {
//           setIsVisible(true);
//         } else {
//           setIsVisible(false);
//           setActiveImageIndex(0);
//         }
//       },
//       { threshold: 0.1 }
//     );

//     if (cardRef.current) observer.observe(cardRef.current);

//     return () => {
//       if (cardRef.current) observer.unobserve(cardRef.current);
//     };
//   }, []);

//   const isVideo = (url) => {
//     const videoExtensions = [".mp4", ".mov", ".webm", ".ogg"];
//     return videoExtensions.some((ext) => url.endsWith(ext));
//   };

//   const isOutOfStock = product.variants.every((v) => v.countInStock <= 0);

//   // ✅ Fixed wishlist toggle
//   const toggleWishlist = async () => {
//     if (!user) {
//       alert("Please login to add to wishlist");
//       return;
//     }
//     try {
//       const token = localStorage.getItem("token");
//       const config = { headers: { Authorization: `Bearer ${token}` } };

//       if (isWishlisted) {
//         await apiClient.delete(`/wishlist/${product._id}`, config);
//       } else {
//         await apiClient.post(`/wishlist/${product._id}`, {}, config);
//         setHeartAnimation(true);
//         setTimeout(() => setHeartAnimation(false), 800);
//       }

//       await fetchWishlist();
//     } catch (err) {
//       console.error("Wishlist error", err);
//       alert("Something went wrong with wishlist.");
//     }
//   };

//   return (
//     <div
//       ref={cardRef}
//       className="relative group rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow duration-300"
//     >
//       {/* ❤️ Wishlist + Share */}
//       <div className="absolute top-4 right-4 z-20 flex space-x-3">
//         <button onClick={toggleWishlist} className="relative">
//           <FaHeart
//             className={`text-2xl ${
//               isWishlisted ? "text-red-500" : "text-gray-400 hover:text-red-400"
//             } transition-colors`}
//           />
//           <AnimatePresence>
//             {heartAnimation && (
//               <motion.div
//                 initial={{ opacity: 1, y: 0, scale: 1 }}
//                 animate={{ opacity: 0, y: -30, scale: 1.3 }}
//                 exit={{ opacity: 0 }}
//                 transition={{ duration: 0.7 }}
//                 className="absolute top-0 left-1/2 -translate-x-1/2 text-red-500"
//               >
//                 <FaHeart />
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </button>
//         <button
//           onClick={() =>
//             navigator.clipboard
//               .writeText(`${window.location.origin}/product/${product._id}`)
//               .then(() => alert("Product link copied!"))
//           }
//         >
//           <FaShareAlt className="text-2xl text-gray-400 hover:text-green-500 transition-colors" />
//         </button>
//       </div>

//       {/* Product Image */}
//       <Link to={`/product/${product._id}`} className="block">
//         <div className="relative w-full h-72">
//           {isOutOfStock && (
//             <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
//               Out of Stock
//             </div>
//           )}
//           {product.images.map((url, index) => (
//             <div
//               key={index}
//               className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${
//                 index === activeImageIndex ? "opacity-100" : "opacity-0"
//               }`}
//             >
//               {isVideo(url) && isVisible ? (
//                 <video
//                   src={url}
//                   autoPlay
//                   loop
//                   muted
//                   playsInline
//                   className="w-full h-full object-cover"
//                 />
//               ) : (
//                 <img
//                   src={url}
//                   alt={product.name}
//                   className="w-full h-full object-cover"
//                   loading="lazy"
//                 />
//               )}
//             </div>
//           ))}
//           <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent"></div>
//         </div>
//       </Link>

//       {/* Product Info */}
//       <div className="p-6 relative z-10">
//         <h3 className="text-xl font-bold text-gray-900 truncate">
//           {product.name}
//         </h3>
//         <p className="mt-1 text-sm text-gray-500">{product.brand}</p>
//         <div className="flex justify-between items-center mt-4">
//           <span className="text-2xl font-bold text-gray-900">
//             ₹{product.variants.length > 0 ? product.variants[0].price : "N/A"}
//           </span>
//           <Link
//             to={`/product/${product._id}`}
//             className="relative inline-flex items-center space-x-2 px-4 py-2 rounded-full
//                         bg-white border-2 border-transparent transition-all duration-300
//                         group-hover:border-green-500/80 group-hover:bg-gradient-to-r from-green-500/20 to-green-500/20"
//           >
//             <span className="relative z-10 text-gray-800 font-semibold text-sm transition-colors duration-300 group-hover:text-green-600">
//               View
//             </span>
//             <BsArrowRight className="relative z-10 text-gray-800 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-green-600" />
//             <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300 animate-shimmer"></span>
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProductCard;


import React, { useState, useEffect, useRef, useMemo } from "react";
import apiClient from "../services/apiClient";
import { Link, useNavigate } from "react-router-dom";
import { FaHeart, FaShareAlt, FaStar } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { isDairyImageUrl, resolveProductImage } from "../utils/dairyImageResolver";

const ProductCard = ({ product }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [heartAnimation, setHeartAnimation] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [localWishlistOverride, setLocalWishlistOverride] = useState(null); // overrides global isWishlisted optimistically
  const [isHovered, setIsHovered] = useState(false); // New state for hover
  const cardRef = useRef(null);
  const intervalRef = useRef(null);

  const { user, wishlist, fetchWishlist } = useAuth();
  const { cartItems, addToCart, removeFromCart, updateCartQuantity } = useCart();
  const navigate = useNavigate();
  const isAuthenticated = Boolean(user || localStorage.getItem("token"));

  const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
  const cartItem = defaultVariant ? cartItems.find((item) => item._id === product._id && item.selectedVariant.size === defaultVariant.size) : null;
  const qty = cartItem ? cartItem.qty : 0;

  const ratingData = useMemo(() => {
    // Generate consistent pseudo-random rating based on product ID
    const pseudoRandom = (product._id.charCodeAt(product._id.length - 1) % 10) / 10;
    const rate = (4.2 + (pseudoRandom * 0.7)).toFixed(1);
    const count = (100 + (pseudoRandom * 400)).toFixed(0);
    return { rate, count };
  }, [product._id]);

  // Pincode Logic for Card — reactive to changes
  const [selectedPincode, setSelectedPincode] = useState(
    () => localStorage.getItem("selectedPincode") || ""
  );

  useEffect(() => {
    const handlePincodeUpdate = () => {
      setSelectedPincode(localStorage.getItem("selectedPincode") || "");
    };
    window.addEventListener("pincode-updated", handlePincodeUpdate);
    return () => window.removeEventListener("pincode-updated", handlePincodeUpdate);
  }, []);

  const localPriceData = useMemo(() => {
    if (!selectedPincode || !product.pincodePricing || product.pincodePricing.length === 0) {
      return null;
    }
    return product.pincodePricing.find(p => p.pincode === selectedPincode.trim());
  }, [product.pincodePricing, selectedPincode]);

  const effectivePrice = localPriceData ? Number(localPriceData.price) : (defaultVariant ? Number(defaultVariant.price) : null);
  const effectiveOriginalPrice = localPriceData ? Number(localPriceData.originalPrice) : (defaultVariant ? Number(defaultVariant.originalPrice) : null);
  const effectiveStock = localPriceData ? Number(localPriceData.inventory) : (defaultVariant ? Number(defaultVariant.countInStock) : 0);
  const globalStock = useMemo(() => {
    const variantStock = (product.variants || []).reduce((acc, v) => acc + (v.countInStock || 0), 0);
    const pincodeStock = (product.pincodePricing || []).reduce((acc, p) => acc + (p.inventory || 0), 0);
    return Math.max(variantStock, pincodeStock);
  }, [product.variants, product.pincodePricing]);

  const isOutOfStock = selectedPincode ? (effectiveStock <= 0) : (globalStock <= 0);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Please log in to buy products.");
      navigate("/login");
      return;
    }
    if (!defaultVariant) return;
    addToCart({ ...product, selectedVariant: { ...defaultVariant, price: effectivePrice, countInStock: effectiveStock, inventory: effectiveStock } });
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Please log in to buy products.");
      navigate("/login");
      return;
    }
    if (!defaultVariant) return;
    // If not in cart, add first
    if (qty === 0) {
      addToCart({ ...product, selectedVariant: defaultVariant });
    } else {
      updateCartQuantity(product._id, defaultVariant.size, qty + 1);
    }
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Please log in to buy products.");
      navigate("/login");
      return;
    }
    if (!defaultVariant) return;
    if (qty > 1) {
      updateCartQuantity(product._id, defaultVariant.size, qty - 1);
    } else {
      removeFromCart(product._id, defaultVariant.size);
    }
  };

  const globalIsWishlisted = user && wishlist.some((item) => item._id === product._id);
  const isWishlisted = localWishlistOverride !== null ? localWishlistOverride : globalIsWishlisted;
  const cardImages = product?.images?.length > 0 ? product.images : [resolveProductImage(product, 0)];

  // Auto image cycle is now based on hover state
  useEffect(() => {
    if (isHovered) {
      intervalRef.current = setInterval(() => {
        setActiveImageIndex(
          (prevIndex) => (prevIndex + 1) % cardImages.length
        );
      }, 2000);
    } else {
      clearInterval(intervalRef.current);
      setActiveImageIndex(0); // Reset to the first image when not hovered
    }
    return () => clearInterval(intervalRef.current);
  }, [cardImages, isHovered]);

  const isVideo = (url) => {
    const videoExtensions = [".mp4", ".mov", ".webm", ".ogg"];
    return videoExtensions.some((ext) => url.endsWith(ext));
  };
  const isComingSoon = product.isComingSoon;

  // ✅ Fixed wishlist toggle
  const toggleWishlist = async () => {
    if (!user) {
      alert("Please login to add to wishlist");
      return;
    }
    if (isWishlistLoading) return;
    setIsWishlistLoading(true);

    const prevWishlistedState = isWishlisted;
    setLocalWishlistOverride(!prevWishlistedState); // Optimistic Update

    try {
      const pc = localStorage.getItem("selectedPincode");

      if (prevWishlistedState) {
        await apiClient.delete(`/wishlist/${product._id}`, {
          params: { pincode: pc }
        });
      } else {
        await apiClient.post(`/wishlist/${product._id}`, {
          pincode: pc
        });
        setHeartAnimation(true);
        setTimeout(() => setHeartAnimation(false), 800);
      }

      await fetchWishlist(pc);
      setLocalWishlistOverride(null); // Clear override after successful sync
    } catch (err) {
      console.error("Wishlist error", err);
      setLocalWishlistOverride(prevWishlistedState); // Revert on failure
      alert("Something went wrong with wishlist.");
    } finally {
      setIsWishlistLoading(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className="relative group rounded-lg overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ❤️ Wishlist + Share */}
      <div className="absolute top-2 right-2 z-20 flex space-x-2">
        <button onClick={toggleWishlist} className="relative">
          <FaHeart
            className={`text-sm sm:text-lg ${user && isWishlisted ? "text-red-500" : "text-gray-400 hover:text-red-400"
              } transition-colors`}
          />
          <AnimatePresence>
            {heartAnimation && (
              <motion.div
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 0, y: -20, scale: 1.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
                className="absolute top-0 left-1/2 -translate-x-1/2 text-red-500"
              >
                <FaHeart className="text-[10px]" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
        <button
          onClick={() =>
            navigator.clipboard
              .writeText(`${window.location.origin}/product/${product._id}`)
              .then(() => alert("Product link copied!"))
          }
        >
          <FaShareAlt className="text-sm sm:text-lg text-gray-400 hover:text-green-500 transition-colors" />
        </button>
      </div>

      {/* Product Image */}
      <Link to={`/product/${product._id}`} className="block">
        <div className="relative w-full h-20 sm:h-36 bg-white flex items-center justify-center overflow-hidden">
          {isComingSoon ? (
            <div className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 bg-yellow-500 text-white text-[7px] font-bold rounded-full">
              Coming Soon
            </div>
          ) : isOutOfStock ? (
            <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center">
              <div className="bg-red-600 text-white text-[6px] sm:text-[9px] font-black px-2 py-1 rounded shadow-lg transform -rotate-6 border border-white">
                OUT OF STOCK
              </div>
            </div>
          ) : null}

          {/* ... existing code for images ... */}
          {product.images && product.images.length > 0 ? (
            product.images.map((url, index) => (
              <div
                key={index}
                className={`absolute inset-0 w-full h-full flex items-center justify-center p-1 sm:p-2 transition-opacity duration-700 ${index === activeImageIndex ? "opacity-100" : "opacity-0"
                  } ${isOutOfStock ? "grayscale" : ""}`}
              >
                {isVideo(url) && isHovered && isDairyImageUrl(url) ? (
                  <video
                    src={url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                ) : (
                  <img
                    src={resolveProductImage(product, index)}
                    alt={product.name}
                    className="w-full h-full object-contain mix-blend-multiply"
                    loading="lazy"
                  />
                )}
              </div>
            ))
          ) : (
            <img
              src={resolveProductImage(product, 0)}
              alt={product.name}
              className="w-full h-full object-contain mix-blend-multiply"
              loading="lazy"
            />
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-1.5 sm:p-3 relative z-10 flex flex-col flex-grow">
        <h3 className="text-[8px] sm:text-[12px] font-semibold text-gray-800 line-clamp-2 leading-tight h-5 sm:h-7 mb-0.5">
          {product.name}
        </h3>
        {ratingData && (
          <div className="flex items-center space-x-1 mt-0">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={`text-[6px] sm:text-[10px] ${i < Math.floor(parseFloat(ratingData.rate))
                    ? "text-yellow-500"
                    : "text-gray-300"
                    }`}
                />
              ))}
            </div>
            <span className="text-[5px] sm:text-[9px] text-gray-400">({ratingData.count})</span>
          </div>
        )}
        <p className="mt-0 text-[6px] sm:text-[9px] text-gray-500 uppercase tracking-wide truncate">{product.brand}</p>
        <div className="flex items-center justify-between mt-1 gap-1">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[15px] font-bold text-gray-900 leading-none">
                {effectivePrice ? `₹${effectivePrice}` : "Enter Pincode"}
              </span>
              {effectiveOriginalPrice && (
                <span className="text-[7px] sm:text-[11px] text-gray-400 line-through decoration-red-500/50 leading-none">
                  ₹{effectiveOriginalPrice}
                </span>
              )}
            </div>
            {effectiveOriginalPrice && effectivePrice && (
              <span className="text-[6px] sm:text-[10px] text-green-600 font-bold mt-0.5">
                {Math.round(((effectiveOriginalPrice - effectivePrice) / effectiveOriginalPrice) * 100)}% OFF
              </span>
            )}
          </div>

          {/* ADD Button or Counter */}
          <div className="relative z-20 flex justify-end">
            {isComingSoon ? (
              null
            ) : isOutOfStock ? (
              <span className="text-[6px] sm:text-[8px] font-black text-red-600 uppercase border border-red-600 px-1 py-0.5 rounded">Out of Stock</span>
            ) : (!isAuthenticated || qty === 0) ? (
              <button
                onClick={handleAdd}
                className={`px-1 py-0.5 sm:px-2 sm:py-1 rounded border transition-all font-bold text-[6px] sm:text-[9px] shadow-sm uppercase tracking-wider ${isAuthenticated
                  ? "border-green-600 text-green-700 bg-green-50 hover:bg-green-600 hover:text-white"
                  : "border-blue-600 text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white"
                  }`}
              >
                {isAuthenticated ? (effectivePrice ? 'Add' : 'Check') : 'Login'}
              </button>
            ) : (
              <div className="flex items-center bg-green-600 text-white rounded shadow-sm overflow-hidden">
                <button
                  onClick={handleDecrement}
                  className="px-1 py-0.5 sm:px-1.5 sm:py-1 hover:bg-green-700 transition font-bold text-[6px] sm:text-xs"
                >
                  -
                </button>
                <span className="px-0.5 sm:px-1 font-bold text-[6px] sm:text-[10px] min-w-[12px] sm:min-w-[16px] text-center">
                  {qty}
                </span>
                <button
                  onClick={handleIncrement}
                  className="px-1 py-0.5 sm:px-1.5 sm:py-1 hover:bg-green-700 transition font-bold text-[6px] sm:text-xs"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
