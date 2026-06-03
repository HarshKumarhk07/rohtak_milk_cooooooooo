import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaFire } from "react-icons/fa";
import apiClient from "../services/apiClient";
import { dairyAssets, resolveCategoryImage, resolveProductImage } from "../utils/dairyImageResolver";

const dairyData = [
  {
    productName: "Cow Milk - 1L",
    productPrice: "₹60/L",
    productImage: dairyAssets.productCowMilk,
  },
  {
    productName: "Buffalo Milk - 1L",
    productPrice: "₹80/L",
    productImage: dairyAssets.productBuffaloMilk,
  },
  {
    productName: "Toned Milk - 1L",
    productPrice: "₹54/L",
    productImage: dairyAssets.productTonedMilk,
  },
  {
    productName: "Buttermilk - 1L",
    productPrice: "₹40/L",
    productImage: dairyAssets.productButtermilk,
  },
  {
    productName: "Fresh Curd - 1kg",
    productPrice: "₹90/kg",
    productImage: dairyAssets.productCurd,
  },
  {
    productName: "Pure Cow Ghee - 1L",
    productPrice: "₹650/L",
    productImage: dairyAssets.productGhee,
  }
];

// Promotional banners live in the public/ folder (banner 1.png, banner 2.png ...).
// Add more files following the same naming and extend this list to show them.
const allBanners = [
  "/banner 1.png",
  "/banner 2.png",
  "/banner 3.png",
  "/banner 4.png",
];

const HeroSection = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Banner carousel state. Any image that fails to load (e.g. banner 4 not
  // added yet) is automatically dropped so we never show a broken image.
  const [banners, setBanners] = useState(allBanners);
  const [currentBanner, setCurrentBanner] = useState(0);

  const handleBannerError = (src) => {
    setBanners((prev) => prev.filter((b) => b !== src));
  };

  // Auto-advance the banner every 4 seconds.
  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => {
      setCurrentBanner((c) => (c + 1) % banners.length);
    }, 4000);
    return () => clearInterval(id);
  }, [banners.length]);

  // Keep the active index valid if banners get filtered out.
  useEffect(() => {
    if (currentBanner >= banners.length) setCurrentBanner(0);
  }, [banners.length, currentBanner]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catRes, prodRes] = await Promise.all([
          apiClient.get('/categories'),
          apiClient.get('/products'),
        ]);
        setCategories(catRes.data);
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      } catch (error) {
        console.error('Failed to fetch hero data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Trending strip is built from real products so the admin-uploaded image
  // shows here too. Falls back to the static list only if no products exist.
  const trendingItems = products.length > 0
    ? products.slice(0, 12).map((p) => {
        const variant = p.variants?.[0] || {};
        return {
          id: p._id,
          productName: p.name,
          productPrice: variant.price ? `₹${variant.price}` : '',
          productImage: resolveProductImage(p, 0),
        };
      })
    : dairyData;

  return (
    <div className="relative flex flex-col bg-white overflow-hidden pt-0 pb-10 md:pb-20">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-white"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[1400px] mb-6 overflow-hidden relative rounded-xl shadow-lg border border-white/10 bg-gradient-to-r from-[#2e7d32] via-[#388e3c] to-[#4caf50] min-h-[160px] md:min-h-[300px] flex items-center group cursor-pointer"
          onClick={() => navigate('/products')}
        >
          <div className="relative z-10 w-full md:w-1/2 px-6 md:px-16 py-4 md:py-6 flex flex-col justify-center">
            <div className="mb-2 md:mb-4">
              <span className="bg-yellow-400 text-black text-[9px] md:text-[12px] font-black px-3 py-1 rounded-full shadow-md uppercase tracking-widest inline-flex items-center">
                <span className="mr-1.5 w-2 h-2 bg-green-700 rounded-full animate-pulse"></span>
                Subscribe for daily delivery
              </span>
            </div>
            <h2 className="text-lg md:text-3xl lg:text-5xl font-extrabold text-white leading-tight mb-2 md:mb-4 drop-shadow-md">
              Fresh Milk & Dairy Delivered Daily
            </h2>
            <p className="text-white/90 text-[11px] md:text-lg font-medium mb-3 md:mb-8 max-w-[540px] leading-relaxed">
              Choose daily, alternate-day or weekly subscriptions for cow & buffalo milk. One-time orders available for curd, paneer and ghee.
            </p>
            <div>
              <button className="bg-yellow-400 text-black font-extrabold py-2 px-5 md:px-8 rounded-md text-[11px] md:text-base hover:bg-yellow-500 transition-colors shadow-sm">
                Explore Dairy
              </button>
            </div>
          </div>

          <div className="absolute right-0 top-0 w-full md:w-1/2 h-full flex justify-end">
            <div className="w-full h-full relative">
              {/* Rotating banner images from the public/ folder. */}
              {banners.map((src, idx) => (
                <img
                  key={src}
                  src={src}
                  alt={`Promotional banner ${idx + 1}`}
                  onError={() => handleBannerError(src)}
                  className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-[1200ms] ease-in-out will-change-[opacity,transform] ${idx === currentBanner ? "opacity-100 z-[1] banner-kenburns" : "opacity-0 z-0"}`}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-r from-[#2e7d32] via-[#2e7d32]/30 to-transparent"></div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-2 md:gap-4 w-full max-w-[1400px] px-0 md:px-4 pb-16 min-h-[120px] md:min-h-[200px] items-start justify-center">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-10">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full"
              />
              <p className="mt-4 text-green-800 font-bold text-sm animate-pulse">Loading Categories...</p>
            </div>
          ) : (
            categories.map((cat, idx) => (
              <motion.div
                key={cat._id || idx}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.05 * idx, duration: 0.5 }}
                whileHover={{ y: -5 }}
                className="group flex flex-col items-center cursor-pointer"
                onClick={() => navigate(`/categories/${cat._id}`)}
              >
                <div className="bg-[#b8ead4] rounded-xl overflow-hidden shadow-md relative w-full aspect-[4/5] sm:aspect-square flex flex-col items-center justify-center border border-yellow-600/10 hover:border-yellow-400/60 transition-all duration-500 group">
                  <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white/40 to-transparent clip-path-dome"></div>
                  <div className="relative z-10 flex flex-col items-center w-full h-full pt-2 md:pt-4">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-52 lg:h-52 rounded-lg overflow-hidden border border-white/80 shadow-[0_0_12px_rgba(255,255,255,0.3)] bg-white/30 p-0.5 transform transition-all duration-500 group-hover:scale-105 group-hover:rotate-1">
                      <img src={resolveCategoryImage(cat)} alt={cat.name} className="w-full h-full object-cover rounded-md" />
                    </div>
                    <div className="mt-auto w-full bg-white/20 backdrop-blur-md border-t border-white/30 py-1 md:py-1.5 group-hover:bg-white/40 transition-colors">
                      <h3 className="text-[#1e4636] text-[7px] sm:text-[11px] md:text-[13px] font-black text-center px-0.5 uppercase tracking-widest leading-tight">{cat.name}</h3>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-950/95 via-[#1e4636]/90 to-green-900/90 backdrop-blur-xl w-[95%] md:w-3/4 rounded-xl p-2 md:p-4 flex items-center justify-between space-x-3 overflow-x-auto z-20 shadow-[0_5px_15px_rgba(0,0,0,0.3)] border border-yellow-500/10 no-scrollbar">
        <div className="flex items-center space-x-1 flex-shrink-0">
          <FaFire className="text-yellow-400 animate-pulse w-3 h-3 md:w-4 md:h-4" />
          <span className="font-black tracking-tighter text-yellow-500 uppercase italic text-[10px] md:text-sm whitespace-nowrap">TRENDING</span>
        </div>

        <div className="flex space-x-3 md:space-x-6 text-sm text-white overflow-x-auto no-scrollbar items-center">
          {trendingItems.map((item, idx) => (
            <div key={item.id || idx} className="flex items-center space-x-2 min-w-[120px] md:min-w-[160px] bg-white/5 border border-white/5 rounded-lg px-2 py-1 shadow-inner hover:bg-white/15 transition-all cursor-pointer group/item" onClick={() => navigate(item.id ? `/product/${item.id}` : '/products')}>
              <img src={item.productImage} alt={item.productName} className="w-[28px] h-[28px] md:w-[40px] md:h-[40px] object-cover rounded-md flex-shrink-0 group-hover/item:scale-110 transition-transform" />
              <div className="overflow-hidden">
                <p className="font-bold truncate text-[9px] md:text-[12px] group-hover/item:text-yellow-300" title={item.productName}>{item.productName}</p>
                <p className="text-yellow-400 font-black text-[8px] md:text-[11px] leading-none">{item.productPrice}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .clip-path-dome { clip-path: ellipse(60% 70% at 50% 0%); background: linear-gradient(to bottom, rgba(255,255,255,0.4), transparent); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .banner-kenburns { animation: bannerZoom 5.5s ease-out forwards; }
        @keyframes bannerZoom { from { transform: scale(1); } to { transform: scale(1.08); } }
      `}} />
    </div>
  );
};

export default HeroSection;
