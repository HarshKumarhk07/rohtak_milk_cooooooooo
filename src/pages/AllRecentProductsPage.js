


// import React, { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import ProductCard from "../components/ProductCard"

// const AllRecentProductsPage = () => {
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchAllRecentProducts = async () => {
//       try {
//         setLoading(true);
//         const response = await fetch(
//           "/products/recent?limit=all"
//         );
//         if (!response.ok) throw new Error("Failed to fetch recent products");
//         const data = await response.json();
//         setProducts(data);
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchAllRecentProducts();
//   }, []);

//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: { staggerChildren: 0.15 },
//     },
//   };

//   const itemVariants = {
//     hidden: { opacity: 0, y: 40, scale: 0.95 },
//     visible: { opacity: 1, y: 0, scale: 1 },
//   };

//   if (loading) return <div className="text-center py-12">Loading...</div>;
//   if (error)
//     return <div className="text-center py-12 text-red-500">Error: {error}</div>;

//   return (
//     <section className="relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-16">
//       <h1 className="absolute top-10 left-1/2 -translate-x-1/2 text-7xl md:text-9xl font-extrabold text-gray-200 opacity-50 select-none">
//         ARRIVALS
//       </h1>

//       <div className="container mx-auto px-4 relative z-10">
//         <motion.h2
//           initial={{ opacity: 0, y: 30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6 }}
//           className="text-4xl md:text-5xl font-extrabold text-center text-gray-900 mb-12"
//         >
//           New Arrivals
//         </motion.h2>

//         {products.length === 0 ? (
//           <div className="text-center py-20">
//             <p className="text-lg text-gray-600 mb-2">
//               🚀 No new products available at the moment.
//             </p>
//             <p className="text-gray-500">Check back soon for exciting updates!</p>
//           </div>
//         ) : (
//           <motion.div
//             initial="hidden"
//             animate="visible"
//             variants={containerVariants}
//             className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
//           >
//             {products.map((product) => (
//               <motion.div
//                 key={product._id}
//                 variants={itemVariants}
//                 transition={{ duration: 0.5 }}
//               >
//                 <ProductCard product={product} />
//               </motion.div>
//             ))}
//           </motion.div>
//         )}
//       </div>
//     </section>
//   );
// };

// export default AllRecentProductsPage;

import React, { useState, useEffect } from "react";
import apiClient from "../services/apiClient";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import FilterSidebar from "../components/FilterSidebar";

const AllRecentProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state (price will be set once products load)
  const [filters, setFilters] = useState({
    price: [0, 100000],
    gender: [],
    category: [],
    subCategory: [],
    size: [],
    brand: [],
  });

  // mobile drawer state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    const fetchAllRecentProducts = async () => {
      try {
        setLoading(true);
        const pincode = localStorage.getItem("selectedPincode");
        // Fetch only the 20 most recent products
        const { data } = await apiClient.get("/products/recent", {
          params: { limit: 20, pincode }
        });
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 1500);
      }
    };
    fetchAllRecentProducts();

    const handlePincodeUpdate = () => {
      fetchAllRecentProducts();
    };
    window.addEventListener("pincode-updated", handlePincodeUpdate);
    return () => window.removeEventListener("pincode-updated", handlePincodeUpdate);
  }, []);


  // When products load, compute global min/max from variants or top-level price
  useEffect(() => {
    if (!products?.length) return;

    const allPrices = products.flatMap((p) => {
      if (Array.isArray(p.variants) && p.variants.length) {
        return p.variants
          .map((v) => Number(v?.price ?? v?.amount ?? NaN))
          .filter((n) => !Number.isNaN(n));
      }
      if (p.price != null) {
        const n = Number(p.price);
        return Number.isNaN(n) ? [] : [n];
      }
      return [];
    });

    if (allPrices.length) {
      const min = Math.min(...allPrices);
      const max = Math.max(...allPrices);
      setFilters((prev) => {
        const [curMin, curMax] = prev.price ?? [0, 0];
        if (curMin !== min || curMax !== max) {
          return { ...prev, price: [min, max] };
        }
        return prev;
      });
    }
  }, [products]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center py-12 text-red-500">Error: {error}</div>;

  // Normalize helper for category/brand values (object or string)
  const normalizeValue = (val) => (typeof val === "string" ? val : val?.name || "");

  // Build unique filter lists (strings only), no duplicates
  const categories = [
    ...new Set(products.map((p) => normalizeValue(p.category)).filter(Boolean)),
  ].sort();
  const subCategories = [
    ...new Set(products.map((p) => normalizeValue(p.subCategory)).filter(Boolean)),
  ].sort();
  const brands = [
    ...new Set(products.map((p) => normalizeValue(p.brand)).filter(Boolean)),
  ].sort();

  // Filtering logic
  const filteredProducts = products.filter((p) => {
    const [minFilter, maxFilter] = filters.price ?? [0, Infinity];

    const productPrices =
      Array.isArray(p.variants) && p.variants.length
        ? p.variants.map((v) => Number(v?.price)).filter((n) => !Number.isNaN(n))
        : p.price != null
          ? [Number(p.price)].filter((n) => !Number.isNaN(n))
          : [];

    if (!productPrices.length) return false;

    const priceMatch = productPrices.some(
      (price) => price >= minFilter && price <= maxFilter
    );
    if (!priceMatch) return false;

    if (filters.gender.length && !filters.gender.includes(p.gender)) return false;

    const productCategory = normalizeValue(p.category);
    if (filters.category.length && !filters.category.includes(productCategory))
      return false;

    const productSubCategory = normalizeValue(p.subCategory);
    if (
      filters.subCategory.length &&
      !filters.subCategory.includes(productSubCategory)
    )
      return false;

    if (filters.size.length) {
      const sizes =
        Array.isArray(p.variants)
          ? p.variants.map((v) => String(v.size)).filter(Boolean)
          : p.size
            ? [String(p.size)]
            : [];
      if (!sizes.some((s) => filters.size.includes(s))) return false;
    }

    const productBrand = normalizeValue(p.brand);
    if (filters.brand.length && !filters.brand.includes(productBrand))
      return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Mobile filter button */}
        <div className="md:hidden mb-4 flex justify-start">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-semibold shadow-sm flex items-center gap-1"
          >
            Open Filters
          </button>
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <div className="w-1/4 hidden md:block">
            <FilterSidebar
              filters={filters}
              setFilters={setFilters}
              categories={categories}
              subCategories={subCategories}
              brands={brands}
              products={products}
            />
          </div>

          {/* Products area */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">New Arrivals</h1>
            {filteredProducts.length === 0 ? (
              <p className="text-center text-sm md:text-lg text-gray-600">Not available product at this location.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileFilterOpen(false)} />
            <div className="relative w-3/4 max-w-xs bg-white shadow-lg h-full p-4 overflow-y-auto">
              <button onClick={() => setMobileFilterOpen(false)} className="mb-4 px-3 py-1 bg-black text-white rounded font-bold shadow-sm">Close</button>
              <FilterSidebar
                filters={filters}
                setFilters={setFilters}
                categories={categories}
                subCategories={subCategories}
                brands={brands}
                products={products}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllRecentProductsPage;