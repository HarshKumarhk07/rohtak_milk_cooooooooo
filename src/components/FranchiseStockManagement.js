
import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { resolveProductImage } from '../utils/dairyImageResolver';
import { FaMapMarkerAlt, FaBoxes, FaSearch, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const FranchiseStockManagement = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedLocations, setExpandedLocations] = useState({});

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await apiClient.get('/products');
            setProducts(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            setLoading(false);
        }
    };

    // Organize products by location
    const getLocationsData = () => {
        const locations = {};

        products.forEach(product => {
            if (product.pincodePricing && product.pincodePricing.length > 0) {
                product.pincodePricing.forEach(pricing => {
                    const locKey = pricing.location || pricing.pincode || 'Unknown Location';
                    if (!locations[locKey]) {
                        locations[locKey] = {
                            name: locKey,
                            pincodes: new Set(),
                            products: []
                        };
                    }
                    locations[locKey].pincodes.add(pricing.pincode);
                    locations[locKey].products.push({
                        ...product,
                        localPrice: pricing.price,
                        localOriginalPrice: pricing.originalPrice,
                        localStock: pricing.inventory,
                        pincode: pricing.pincode,
                        localSize: pricing.size
                    });
                });
            } else {
                // If no pincode pricing, maybe it's general stock?
                const locKey = 'General Inventory';
                if (!locations[locKey]) {
                    locations[locKey] = {
                        name: locKey,
                        pincodes: new Set(['Global']),
                        products: []
                    };
                }
                locations[locKey].products.push({
                    ...product,
                    localPrice: product.variants?.[0]?.price || 'N/A',
                    localOriginalPrice: product.variants?.[0]?.originalPrice || null,
                    localStock: product.variants?.reduce((acc, v) => acc + (v.countInStock || 0), 0) || 0,
                    pincode: 'Global',
                    localSize: product.variants?.[0]?.size || 'N/A'
                });
            }
        });

        return Object.values(locations).sort((a, b) => a.name.localeCompare(b.name));
    };

    const toggleLocation = (locName) => {
        setExpandedLocations(prev => ({
            ...prev,
            [locName]: !prev[locName]
        }));
    };

    if (loading) return <div className="p-8 text-center bg-white rounded-lg shadow">Loading inventory data...</div>;

    const locationsData = getLocationsData();
    const filteredLocations = locationsData.filter(loc =>
        loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.products.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-red-500" />
                            Franchise & Location Inventory
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Monitor product availability across all delivery points</p>
                    </div>
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search location or product..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none w-full md:w-80 shadow-sm"
                        />
                    </div>
                </div>

                <div className="grid gap-6">
                    {filteredLocations.length > 0 ? filteredLocations.map((loc) => (
                        <div key={loc.name} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div
                                onClick={() => toggleLocation(loc.name)}
                                className="p-4 md:p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                        <FaMapMarkerAlt />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-800 font-sans tracking-tight">{loc.name}</h2>
                                        <p className="text-[11px] text-gray-400 font-normal font-sans tracking-wider uppercase">
                                            PINCODES: {Array.from(loc.pincodes).join(', ')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="hidden sm:block text-right">
                                        <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Products</div>
                                        <div className="text-lg font-bold text-gray-700">{loc.products.length}</div>
                                    </div>
                                    <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
                                    <div className="bg-gray-100 p-2 rounded-full text-gray-500">
                                        {expandedLocations[loc.name] ? <FaChevronUp /> : <FaChevronDown />}
                                    </div>
                                </div>
                            </div>

                            {expandedLocations[loc.name] && (
                                <div className="border-t border-gray-100 bg-white">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-3">Product</th>
                                                    <th className="px-6 py-3">Pincode</th>
                                                    <th className="px-6 py-3">Size</th>
                                                    <th className="px-6 py-3">Stock Status</th>
                                                    <th className="px-6 py-3 text-right">Selling Price</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {loc.products.map((prod, idx) => (
                                                    <tr key={`${loc.name}-${prod._id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <img
                                                                    src={resolveProductImage(prod, 0)}
                                                                    alt={prod.name}
                                                                    className="w-10 h-10 object-cover rounded-md bg-gray-100"
                                                                />
                                                                <div>
                                                                    <div className="text-sm font-bold text-gray-800">{prod.name}</div>
                                                                    <div className="text-[10px] text-gray-400 uppercase font-medium">{prod.brand} | {prod.category?.name}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-[11px] font-medium font-sans bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 uppercase tracking-tighter">
                                                                {prod.pincode}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-xs font-bold text-gray-600">{prod.localSize}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-2 h-2 rounded-full ${prod.localStock > 10 ? 'bg-green-500' : prod.localStock > 0 ? 'bg-orange-400' : 'bg-red-500'}`}></span>
                                                                <span className={`text-sm font-bold ${prod.localStock > 10 ? 'text-green-700' : prod.localStock > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                                                                    {prod.localStock <= 0 ? 'Out of Stock' : `${prod.localStock} units`}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex flex-col items-end">
                                                                <div className="text-sm font-bold text-gray-800">₹{prod.localPrice}</div>
                                                                {prod.localOriginalPrice && (
                                                                    <div className="text-[10px] text-gray-400 line-through">₹{prod.localOriginalPrice}</div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {loc.products.length === 0 && (
                                        <div className="p-8 text-center text-gray-400 italic text-sm">
                                            No products assigned to this location yet.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )) : (
                        <div className="bg-white p-12 text-center rounded-xl border-2 border-dashed border-gray-200">
                            <FaBoxes className="text-gray-300 text-4xl mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-600">No results found</h3>
                            <p className="text-gray-400">Try searching for a different location or product</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FranchiseStockManagement;
