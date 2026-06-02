import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import ProductCard from './ProductCard';

const FeaturedProductsSection = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const pincode = localStorage.getItem("selectedPincode");
                const response = await apiClient.get('/products/featured', {
                    params: { pincode }
                });
                setProducts(response.data.slice(0, 8)); // Revert to 8 products for desktop row
            } catch (error) {
                console.error('Failed to fetch featured products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFeatured();

        const handlePincodeUpdate = () => {
            fetchFeatured();
        };
        window.addEventListener("pincode-updated", handlePincodeUpdate);
        return () => window.removeEventListener("pincode-updated", handlePincodeUpdate);
    }, []);

    if (loading) return null;
    if (products.length === 0) return null;

    return (
        <section className="pt-2 pb-8 bg-white border-t border-gray-50">
            <div className="container mx-auto px-4">
                <div className="flex flex-col mb-4">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                        Featured Products
                    </h2>
                    <div className="h-1.5 w-20 bg-green-600 rounded-full"></div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                    {products.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedProductsSection;
