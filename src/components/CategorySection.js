
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../services/apiClient';
import { resolveCategoryImage } from '../utils/dairyImageResolver';

const CategorySection = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await apiClient.get('/categories');
                setCategories(response.data);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (loading) return null;
    if (categories.length === 0) return null;

    return (
        <section className="py-4 md:py-8 bg-white">
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex flex-col mb-3 md:mb-6">
                    <h2 className="text-lg md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
                        Shop By Category
                    </h2>
                    <div className="h-1.5 w-20 bg-green-600 rounded-full"></div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-1.5 md:gap-4">
                    {categories.map((category) => {
                        return (
                            <Link
                                key={category._id}
                                to={`/categories/${category._id}`}
                                className="group relative h-20 md:h-52 overflow-hidden rounded-xl bg-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100"
                            >
                                <img
                                    src={resolveCategoryImage(category)}
                                    alt={category.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                <div className="absolute bottom-2 left-1 right-1 text-center">
                                    <h3 className="text-white text-[8px] md:text-sm font-black uppercase tracking-tighter md:tracking-wider leading-tight">
                                        {category.name}
                                    </h3>
                                    <p className="text-green-400 text-[10px] font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:block">
                                        SHOP NOW
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default CategorySection;
