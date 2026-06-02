

import React, { useState, useEffect } from 'react';

import apiClient from '../services/apiClient';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { resolveProductImage } from '../utils/dairyImageResolver';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand: '',
    category: '',
    gender: '',
    subCategory: '',
    isFeatured: false,
    isBestseller: false,
    videoUrl: '',
    farmerName: '',
    farmerPhone: '',
    farmerLocation: '',
    farmerEmail: '',
    isComingSoon: false,
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState(null);
  const [newCategoryImagePreview, setNewCategoryImagePreview] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [variants, setVariants] = useState([{ size: '', price: '', originalPrice: '', discount: '', countInStock: '' }]);
  const [pincodePricingRows, setPincodePricingRows] = useState([{ pincodes: '', size: '', originalPrice: '', discount: '', price: '', inventory: '' }]);
  const [pincodeLocationMap, setPincodeLocationMap] = useState({});
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [refreshCategories, setRefreshCategories] = useState(false);
  const [refreshProducts, setRefreshProducts] = useState(false);

  const [selectedPincode, setSelectedPincode] = useState(() => localStorage.getItem("selectedPincode") || "");

  useEffect(() => {
    fetchProducts();
    fetchCategories();

    const handlePincodeUpdate = () => {
      setSelectedPincode(localStorage.getItem("selectedPincode") || "");
    };
    window.addEventListener("pincode-updated", handlePincodeUpdate);
    return () => window.removeEventListener("pincode-updated", handlePincodeUpdate);
  }, [refreshCategories, refreshProducts]);

  const extractPincodes = (value = '') => value
    .split(',')
    .map((p) => p.trim())
    .filter((p) => /^\d{6}$/.test(p));

  const resolvePincodeLocation = async (pincode) => {
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      const postOffice = data?.[0]?.PostOffice?.[0];
      if (!postOffice) return '';
      return `${postOffice.District}, ${postOffice.State}`;
    } catch (error) {
      return '';
    }
  };

  useEffect(() => {
    const allPincodes = [...new Set(
      pincodePricingRows.flatMap((row) => extractPincodes(row.pincodes))
    )];

    if (!allPincodes.length) return;

    let isMounted = true;
    const fetchLocations = async () => {
      for (const pincode of allPincodes) {
        if (pincodeLocationMap[pincode]) continue;
        const location = await resolvePincodeLocation(pincode);
        if (!isMounted || !location) continue;
        setPincodeLocationMap((prev) => (prev[pincode] ? prev : { ...prev, [pincode]: location }));
      }
    };

    fetchLocations();
    return () => {
      isMounted = false;
    };
  }, [pincodePricingRows, pincodeLocationMap]);

  useEffect(() => {
    const allPincodes = [...new Set(
      pincodePricingRows.flatMap((row) => extractPincodes(row.pincodes))
    )];
    if (!allPincodes.length) return;

    const uniqueLocations = [...new Set(
      allPincodes
        .map((pincode) => pincodeLocationMap[pincode])
        .filter(Boolean)
    )];

    if (!uniqueLocations.length) return;

    const mergedLocation = uniqueLocations.join(', ');
    setFormData((prev) => (
      prev.farmerLocation === mergedLocation ? prev : { ...prev, farmerLocation: mergedLocation }
    ));
  }, [pincodePricingRows, pincodeLocationMap]);

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.get('/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? All products in this category might lose their link.')) return;
    try {
      const token = localStorage.getItem('token');
      await apiClient.delete(`/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Category deleted successfully!');
      setRefreshCategories(prev => !prev);
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prevImages => [...prevImages, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
  };

  const handleVideoChange = (e) => {
    setVideoFile(e.target.files[0]);
  };

  const handleRemoveImage = (indexToRemove, isExisting) => {
    if (isExisting) {
      setExistingImages(existingImages.filter((_, index) => index !== indexToRemove));
    } else {
      setImages(images.filter((_, index) => index !== indexToRemove));
      setImagePreviews(imagePreviews.filter((_, index) => index !== indexToRemove));
    }
  };

  const normalizeSize = (size) => size ? size.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]/g, '').trim() : '';

  const handlePincodeRowChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...pincodePricingRows];
    updated[index][name] = value;

    const original = parseFloat(updated[index].originalPrice);
    const disc = parseFloat(updated[index].discount);
    const price = parseFloat(updated[index].price);

    if (name === 'originalPrice') {
      if (!isNaN(original) && original > 0) {
        if (!isNaN(price)) {
          updated[index].discount = Math.max(0, (((original - price) / original) * 100)).toFixed(2);
        } else if (!isNaN(disc)) {
          updated[index].price = Math.round(original - (original * disc / 100));
        }
      }
    } else if (name === 'discount') {
      if (!isNaN(disc)) {
        if (!isNaN(price) && disc < 100) {
          updated[index].originalPrice = Math.round(price / (1 - disc / 100));
        } else if (!isNaN(original)) {
          updated[index].price = Math.round(original - (original * disc / 100));
        }
      }
    } else if (name === 'price') {
      if (!isNaN(price)) {
        if (!isNaN(original) && original > 0) {
          updated[index].discount = Math.max(0, (((original - price) / original) * 100)).toFixed(2);
        } else if (!isNaN(disc) && disc < 100) {
          updated[index].originalPrice = Math.round(price / (1 - disc / 100));
        }
      }
    }

    setPincodePricingRows(updated);
  };

  const addPincodeRow = () => setPincodePricingRows([...pincodePricingRows, { pincodes: '', size: '', originalPrice: '', discount: '', price: '', inventory: '' }]);
  const removePincodeRow = (index) => {
    const updated = [...pincodePricingRows];
    updated.splice(index, 1);
    setPincodePricingRows(updated.length ? updated : [{ pincodes: '', size: '', originalPrice: '', discount: '', price: '', inventory: '' }]);
  };

  const buildPincodePricingPayload = () => {
    const expanded = [];
    pincodePricingRows.forEach((row) => {
      if (!row.pincodes || row.price === '' || row.inventory === '') return;
      extractPincodes(row.pincodes)
        .forEach((pincode) => {
          expanded.push({
            pincode,
            location: pincodeLocationMap[pincode] || '',
            size: row.size,
            originalPrice: row.originalPrice !== '' ? Number(row.originalPrice) : null,
            discount: row.discount !== '' ? Number(row.discount) : null,
            price: Number(row.price),
            inventory: Number(row.inventory),
          });
        });
    });
    return expanded;
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const pricingPayload = buildPincodePricingPayload();
    if (pricingPayload.length === 0) {
      alert("Please add at least one valid Pincode Pricing rule. Global products are not allowed.");
      return;
    }

    const token = localStorage.getItem('token');
    const data = new FormData();
    for (const key in formData) data.append(key, formData[key]);

    // Rebuild variants completely from pincodePricing unique sizes
    const uniqueSizes = [...new Set(pricingPayload.map(p => p.size).filter(Boolean))];
    const syncedVariants = uniqueSizes.map(size => {
      const normalizedQuery = normalizeSize(size);
      const matches = pricingPayload.filter(p => normalizeSize(p.size) === normalizedQuery);
      const oldVariant = variants.find(v => normalizeSize(v.size) === normalizedQuery);

      const totalInventory = matches.reduce((sum, p) => sum + (Number(p.inventory) || 0), 0);
      const firstMatch = matches[0] || {};

      return {
        size: size,
        price: Number(firstMatch.price) || 0,
        originalPrice: Number(firstMatch.originalPrice) || 0,
        discount: Number(firstMatch.discount) || 0,
        countInStock: totalInventory > 0 ? totalInventory : (oldVariant ? (Number(oldVariant.countInStock) || 0) : 0),
      };
    });

    data.append('variants', JSON.stringify(syncedVariants));
    data.append('pincodePricing', JSON.stringify(pricingPayload));
    for (const image of images) data.append('images', image);
    if (videoFile) data.append('video', videoFile);

    try {
      await apiClient.post('/products', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      alert('Product added successfully!');
      resetForm();
      setRefreshProducts(prev => !prev);
    } catch (error) {
      console.error('Failed to add product:', error);
      alert('Failed to add product.');
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      brand: product.brand,
      category: product.category._id,
      gender: product.gender,
      subCategory: product.subCategory || '',
      isFeatured: product.isFeatured || false,
      isBestseller: product.isBestseller || false,
      videoUrl: product.videoUrl || '',
      farmerName: product.farmerName || '',
      farmerPhone: product.farmerPhone || '',
      farmerLocation: product.farmerLocation || '',
      farmerEmail: product.farmerEmail || '',
      isComingSoon: product.isComingSoon || false,
    });
    setVariants(product.variants.map(v => ({
      ...v,
      originalPrice: v.originalPrice || '',
      discount: v.discount || ''
    })));
    setPincodePricingRows(
      product.pincodePricing && product.pincodePricing.length > 0
        ? product.pincodePricing.map((entry) => ({
          pincodes: entry.pincode || '',
          size: entry.size || '',
          originalPrice: entry.originalPrice ?? '',
          discount: entry.discount ?? '',
          price: entry.price ?? '',
          inventory: entry.inventory ?? '',
        }))
        : [{ pincodes: '', size: '', originalPrice: '', discount: '', price: '', inventory: '' }]
    );
    setPincodeLocationMap(
      (product.pincodePricing || []).reduce((acc, entry) => {
        if (entry.pincode && entry.location) acc[entry.pincode] = entry.location;
        return acc;
      }, {})
    );
    setExistingImages(product.images);
    setImages([]);
    setImagePreviews([]);
    setVideoFile(null);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    const pricingPayload = buildPincodePricingPayload();
    if (pricingPayload.length === 0) {
      alert("Please add at least one valid Pincode Pricing rule. Global products are not allowed.");
      return;
    }

    const token = localStorage.getItem('token');
    const data = new FormData();
    for (const key in formData) data.append(key, formData[key]);

    // Rebuild variants completely from pincodePricing unique sizes
    const uniqueSizes = [...new Set(pricingPayload.map(p => p.size).filter(Boolean))];
    const syncedVariants = uniqueSizes.map(size => {
      const normalizedQuery = normalizeSize(size);
      const matches = pricingPayload.filter(p => normalizeSize(p.size) === normalizedQuery);
      const oldVariant = variants.find(v => normalizeSize(v.size) === normalizedQuery);

      const totalInventory = matches.reduce((sum, p) => sum + (Number(p.inventory) || 0), 0);
      const firstMatch = matches[0] || {};

      return {
        size: size,
        price: Number(firstMatch.price) || 0,
        originalPrice: Number(firstMatch.originalPrice) || 0,
        discount: Number(firstMatch.discount) || 0,
        countInStock: totalInventory > 0 ? totalInventory : (oldVariant ? (Number(oldVariant.countInStock) || 0) : 0),
      };
    });

    data.append('variants', JSON.stringify(syncedVariants));
    data.append('pincodePricing', JSON.stringify(pricingPayload));
    for (const image of images) data.append('images', image);
    for (const imageUrl of existingImages) data.append('existingImages', imageUrl);
    if (videoFile) data.append('video', videoFile);

    try {
      await apiClient.put(`/products/${editingProduct._id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      alert('Product updated successfully!');
      resetForm();
      setRefreshProducts(prev => !prev);
    } catch (error) {
      console.error('Failed to update product:', error);
      alert('Failed to update product.');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = localStorage.getItem('token');
      await apiClient.delete(`/products/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      alert('Product deleted successfully!');
      setRefreshProducts(prev => !prev);
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product.');
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      brand: '',
      category: '',
      gender: '',
      subCategory: '',
      isFeatured: false,
      isBestseller: false,
      videoUrl: '',
      farmerName: '',
      farmerPhone: '',
      farmerLocation: '',
      farmerEmail: '',
      isComingSoon: false
    });
    setVariants([{ size: '', price: '', originalPrice: '', discount: '', countInStock: '' }]);
    setPincodePricingRows([{ pincodes: '', size: '', originalPrice: '', discount: '', price: '', inventory: '' }]);
    setPincodeLocationMap({});
    setImages([]);
    setImagePreviews([]);
    setExistingImages([]);
    setVideoFile(null);
  };

  return (
    <div className="p-3 md:p-6 bg-white shadow-md rounded-lg max-w-full overflow-hidden">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-800 border-b pb-2">
        {editingProduct ? 'Edit Product' : 'Add New Product'}
      </h2>

      <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Product Name" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24" required />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Brand</label>
            <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} placeholder="Brand" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={(e) => {
                if (e.target.value === "new") {
                  setShowCategoryForm(true);
                  setFormData({ ...formData, category: "" });
                } else {
                  setShowCategoryForm(false);
                  handleInputChange(e);
                }
              }}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
              <option value="new" className="font-bold text-blue-600">+ Create New Category</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="isFeatured"
              id="isFeatured"
              checked={formData.isFeatured}
              onChange={handleInputChange}
              className="w-5 h-5 accent-blue-600 cursor-pointer"
            />
            <label htmlFor="isFeatured" className="text-sm font-bold text-gray-700 cursor-pointer">
              Featured
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="isBestseller"
              id="isBestseller"
              checked={formData.isBestseller}
              onChange={handleInputChange}
              className="w-5 h-5 accent-green-600 cursor-pointer"
            />
            <label htmlFor="isBestseller" className="text-sm font-bold text-gray-700 cursor-pointer">
              Best Seller
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="isComingSoon"
              id="isComingSoon"
              checked={formData.isComingSoon}
              onChange={handleInputChange}
              className="w-5 h-5 accent-yellow-600 cursor-pointer"
            />
            <label htmlFor="isComingSoon" className="text-sm font-bold text-gray-700 cursor-pointer">
              Coming Soon
            </label>
          </div>
        </div>

        {/* Show new category form if selected */}
        {showCategoryForm && (
          <div className="p-4 border rounded-md bg-gray-50 mt-2">
            <h3 className="text-lg font-semibold mb-2">Add New Category</h3>
            <input
              type="text"
              placeholder="Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full p-2 border rounded-md mb-2"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                setNewCategoryImage(file);
                setNewCategoryImagePreview(URL.createObjectURL(file));
              }}
              className="w-full p-2 border rounded-md mb-2"
            />
            {newCategoryImagePreview && (
              <img src={newCategoryImagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-md mb-2" />
            )}
            <button
              type="button"
              onClick={async () => {
                try {
                  const token = localStorage.getItem("token");
                  const data = new FormData();
                  data.append("name", newCategoryName);
                  if (newCategoryImage) data.append("image", newCategoryImage);

                  const res = await apiClient.post("/categories", data, {
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
                  });

                  alert("Category created!");
                  setCategories([...categories, res.data]);
                  setFormData({ ...formData, category: res.data._id });
                  setShowCategoryForm(false);
                  setNewCategoryName("");
                  setNewCategoryImage(null);
                  setNewCategoryImagePreview(null);
                } catch (err) {
                  console.error(err);
                  alert("Failed to create category");
                }
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-md"
            >
              Save Category
            </button>
          </div>
        )}

        {/* Manage Existing Categories */}
        <div className="mt-4 p-4 border rounded-md bg-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Existing Categories (Click &times; to delete)</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <div key={cat._id} className="flex items-center bg-white border border-gray-300 rounded-full pl-3 pr-1 py-1 shadow-sm hover:border-red-300 transition-all group">
                <span className="text-xs font-bold text-gray-700 mr-2">{cat.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat._id)}
                  className="bg-gray-100 text-gray-400 hover:bg-red-500 hover:text-white rounded-full p-1 transition-all"
                  title={`Delete ${cat.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Item Type</label>
            <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" required>
              <option value="">Select Item Type</option>
              <option value="standard">Standard</option>
              <option value="organic">Organic</option>
              <option value="premium">Premium</option>
              <option value="budget">Budget</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sub Category</label>
            <input
              type="text"
              name="subCategory"
              value={formData.subCategory}
              onChange={handleInputChange}
              placeholder="e.g. Dairy, Milk, Paneer"
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Video (Optional)</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="file"
              name="video"
              accept="video/*,image/*"
              onChange={handleVideoChange}
              className="w-full p-2 border border-dashed rounded-xl border-blue-400 bg-blue-50 text-sm"
            />
            {formData.videoUrl && !videoFile && (
              <span className="text-[10px] bg-blue-100 text-blue-800 px-3 py-1 rounded-full self-center whitespace-nowrap">Current video attached</span>
            )}
          </div>
        </div>

        <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100 space-y-4">
          <h3 className="text-sm font-black text-green-800 uppercase tracking-widest flex items-center">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
            Farmer Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" name="farmerName" value={formData.farmerName} onChange={handleInputChange} placeholder="Name" className="w-full p-2.5 bg-white border rounded-xl text-sm" />
            <input type="text" name="farmerPhone" value={formData.farmerPhone} onChange={handleInputChange} placeholder="Contact No" className="w-full p-2.5 bg-white border rounded-xl text-sm" />
            <input type="text" name="farmerLocation" value={formData.farmerLocation} onChange={handleInputChange} placeholder="Location" className="w-full p-2.5 bg-white border rounded-xl text-sm md:col-span-2" />
            <input type="email" name="farmerEmail" value={formData.farmerEmail} onChange={handleInputChange} placeholder="Email" className="w-full p-2.5 bg-white border rounded-xl text-sm md:col-span-2" />
          </div>
        </div>


        <div className="space-y-4">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest border-b pb-1">Pincode Price & Inventory <span className="text-red-600 text-lg">*</span></h3>
          <div className="space-y-4">
            {pincodePricingRows.map((row, index) => (
              <div key={`pincode-row-${index}`} className="relative p-5 border-2 border-yellow-100 rounded-3xl bg-yellow-50/20">
                <button type="button" onClick={() => removePincodeRow(index)} className="absolute -top-3 -right-3 bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-transform hover:rotate-90">×</button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-yellow-700 uppercase mb-1">Target Pincodes (Comma separated)</label>
                    <input type="text" name="pincodes" value={row.pincodes} onChange={(e) => handlePincodeRowChange(index, e)} placeholder="e.g. 110001, 122001" className="w-full p-3 bg-white border border-yellow-200 rounded-2xl text-sm" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-yellow-700 uppercase mb-1">Pack Size</label>
                    <input type="text" name="size" value={row.size} onChange={(e) => handlePincodeRowChange(index, e)} placeholder="e.g. 1kg" className="w-full p-3 bg-white border border-yellow-200 rounded-2xl text-sm" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:col-span-1">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">Original</label>
                      <input type="number" name="originalPrice" value={row.originalPrice} onChange={(e) => handlePincodeRowChange(index, e)} className="w-full p-2.5 bg-white border rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">Disc%</label>
                      <input type="number" name="discount" value={row.discount} onChange={(e) => handlePincodeRowChange(index, e)} className="w-full p-2.5 bg-white border rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">Final</label>
                      <input type="number" name="price" value={row.price} onChange={(e) => handlePincodeRowChange(index, e)} className="w-full p-2.5 bg-white border border-green-200 rounded-xl text-sm font-bold text-green-700" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-yellow-700 uppercase mb-1">Local Stock Availability</label>
                    <input type="number" name="inventory" value={row.inventory} onChange={(e) => handlePincodeRowChange(index, e)} placeholder="Stock Qty" className="w-full p-3 bg-white border border-yellow-200 rounded-2xl text-sm" />
                  </div>
                </div>

                <div className="mt-3 bg-white/60 p-2.5 rounded-xl border border-yellow-200/50">
                  <p className="text-[10px] font-bold text-yellow-800 uppercase mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5"></span>
                    Verified Locations
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2 italic">
                    {extractPincodes(row.pincodes)
                      .map((pincode) => pincodeLocationMap[pincode] ? `${pincode}(${pincodeLocationMap[pincode]})` : `${pincode}(...)`)
                      .join(', ') || 'No valid pincodes entered'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addPincodeRow} className="bg-yellow-50 text-yellow-700 font-bold px-5 py-3 rounded-2xl text-xs hover:bg-yellow-600 hover:text-white transition-all shadow-sm w-full md:w-auto mt-2">
            + Add Pincode Specific Pricing
          </button>
        </div>

        {/* Images */}
        <h3 className="text-lg font-semibold">Product Images</h3>
        <input type="file" name="images" multiple onChange={handleImageChange} className="w-full p-2 border rounded-md" />
        <div className="flex flex-wrap space-x-2 mt-2">
          {existingImages.map((url, idx) => (
            <div key={`ex-${idx}`} className="relative">
              <img src={url} alt="" className="h-24 w-24 object-cover rounded-md" />
              <button type="button" onClick={() => handleRemoveImage(idx, true)} className="absolute top-0 right-0 bg-red-600 text-white rounded-full h-6 w-6">&times;</button>
            </div>
          ))}
          {imagePreviews.map((preview, idx) => (
            <div key={`new-${idx}`} className="relative">
              <img src={preview} alt="" className="h-24 w-24 object-cover rounded-md" />
              <button type="button" onClick={() => handleRemoveImage(idx, false)} className="absolute top-0 right-0 bg-red-600 text-white rounded-full h-6 w-6">&times;</button>
            </div>
          ))}
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-md">
          {editingProduct ? 'Update Product' : 'Add Product'}
        </button>
        {editingProduct && (
          <button type="button" onClick={resetForm} className="w-full bg-gray-400 text-white p-2 rounded-md">Cancel</button>
        )}
      </form>

      {/* Existing Products */}
      <div className="mt-12 md:mt-16 border-t pt-8">
        <h2 className="text-xl md:text-2xl font-black text-gray-800 mb-6 uppercase tracking-tight flex items-center">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3 text-sm">✓</span>
          Active Inventory
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map(product => (
            <div key={product._id} className="flex flex-col p-4 bg-gray-50 border rounded-3xl hover:shadow-xl hover:bg-white transition-all duration-300 group">
              <div className="flex items-start space-x-4">
                <div className="relative min-w-[80px] h-[80px]">
                  <img src={resolveProductImage(product, 0)} alt={product.name} className="w-full h-full object-cover rounded-2xl shadow-sm border border-white" />
                  {product.variants.every(v => v.countInStock <= 0) && (product.pincodePricing || []).every(p => p.inventory <= 0) && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg">OUT</span>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-gray-900 truncate pr-2">{product.name}</h4>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full text-gray-500 border group-hover:border-blue-200">{product.brand}</span>
                  </div>
                  <p className="text-[10px] font-bold text-blue-600 mt-0.5">{product.category?.name || 'Uncategorized'}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {product.variants.map((v, i) => {
                      const normalizedVSize = normalizeSize(v.size);
                      // Prioritize selected pincode match
                      let pincodeData = (product.pincodePricing || [])
                        .find(p => p.pincode === selectedPincode && normalizeSize(p.size) === normalizedVSize);

                      // Fallback to any pincode match for this size
                      if (!pincodeData) {
                        pincodeData = (product.pincodePricing || [])
                          .find(p => normalizeSize(p.size) === normalizedVSize);
                      }

                      const pincodeStock = (product.pincodePricing || [])
                        .filter(p => normalizeSize(p.size) === normalizedVSize)
                        .reduce((acc, p) => acc + (p.inventory || 0), 0);

                      const displayPrice = pincodeData?.price || v.price;
                      const totalVStock = (v.countInStock || 0) > 0 ? v.countInStock : pincodeStock;

                      return (
                        <span key={i} className={`text-[9px] px-2 py-0.5 rounded-md font-bold ${totalVStock <= 0 ? 'bg-red-50 text-red-500 line-through' : 'bg-green-50 text-green-700'}`}>
                          {v.size}: ₹{displayPrice} ({totalVStock <= 0 ? '0' : totalVStock})
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-dashed flex items-center justify-between">
                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                  Total Units: <span className="text-gray-900 ml-1">
                    {Math.max(
                      product.variants.reduce((acc, v) => acc + (v.countInStock || 0), 0),
                      (product.pincodePricing || []).reduce((acc, p) => acc + (p.inventory || 0), 0)
                    )}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditClick(product)}
                    className="p-2 md:px-4 md:py-1.5 bg-white border-2 border-yellow-400 text-yellow-600 hover:bg-yellow-400 hover:text-white transition-all rounded-xl flex items-center justify-center"
                    title="Edit Product"
                  >
                    <FaEdit className="md:mr-1.5" size={14} />
                    <span className="hidden md:inline text-[10px] font-black uppercase">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product._id)}
                    className="p-2 md:px-4 md:py-1.5 bg-white border-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white transition-all rounded-xl flex items-center justify-center"
                    title="Delete Product"
                  >
                    <FaTrash className="md:mr-1.5" size={12} />
                    <span className="hidden md:inline text-[10px] font-black uppercase">Del</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;

