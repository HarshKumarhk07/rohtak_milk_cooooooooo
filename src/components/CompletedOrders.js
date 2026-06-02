import React, { useState, useEffect } from 'react';

import moment from 'moment';
import apiClient from '../services/apiClient';
import { resolveProductImage } from '../utils/dairyImageResolver';

const CompletedOrders = ({ refreshFlag }) => {
    const [completedOrders, setCompletedOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(moment().month() + 1);
    const [selectedYear, setSelectedYear] = useState(moment().year());
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOrders, setFilteredOrders] = useState([]);

    const fetchCompletedOrders = async () => {
        console.log('Attempting to fetch completed orders...');
        setLoading(true);
        try {
            const url = `/orders/completed?month=${selectedMonth}&year=${selectedYear}`;
            console.log('Fetching from URL:', url);

            const response = await apiClient.get(url);

            console.log('API call successful. Data received:', response.data);
            setCompletedOrders(response.data);
        } catch (err) {
            console.error(
                'Failed to fetch completed orders. Error:',
                err.response?.data?.message || err.message
            );
            setError('Failed to fetch completed orders.');
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        console.log('useEffect triggered. Refresh flag:', refreshFlag);
        fetchCompletedOrders();
    }, [selectedMonth, selectedYear, refreshFlag]);

    useEffect(() => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        const results = completedOrders.filter(order =>
            order.user?.name.toLowerCase().includes(lowercasedSearchTerm) ||
            order.user?.email.toLowerCase().includes(lowercasedSearchTerm) ||
            order.user?.phone?.toLowerCase().includes(lowercasedSearchTerm) ||
            order.orderNumber.toLowerCase().includes(lowercasedSearchTerm)
        );
        setFilteredOrders(results);
    }, [searchTerm, completedOrders]);

    const months = moment.months().map((name, index) => ({ name, value: index + 1 }));
    const years = [2024, 2025, 2026];

    const handleRevertStatus = async (orderId) => {
        const confirmRevert = window.confirm('Are you sure you want to revert this order? It will be moved back to the Unassigned list.');
        if (!confirmRevert) return;

        console.log('Reverting status for order:', orderId);
        try {
            const token = localStorage.getItem('token');
            await apiClient.post(
                '/orders/revert-status',
                { orderId, status: 'pending' },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            alert('Order status reverted successfully!');
            fetchCompletedOrders();
        } catch (err) {
            console.error('Failed to revert status. Error:', err.response?.data?.message || err.message);
            alert('Failed to revert status.');
        }
    };

    if (loading) return <div className="text-center mt-10">Loading completed orders...</div>;
    if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;

    return (
        <div className="p-3 md:p-6 bg-white shadow-md rounded-lg">
            <h2 className="text-xl md:text-2xl font-semibold mb-6">Completed Orders</h2>

            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
                <div className="flex gap-2">
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="flex-1 md:flex-none p-2 border rounded-md text-sm">
                        {months.map(m => (
                            <option key={m.value} value={m.value}>{m.name}</option>
                        ))}
                    </select>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="flex-1 md:flex-none p-2 border rounded-md text-sm">
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                <input
                    type="text"
                    placeholder="Search by name, order ID, or phone"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 border rounded-md w-full md:w-1/2 text-sm"
                />
            </div>

            <div className="space-y-4">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map(order => (
                        <div key={order._id} className="bg-gray-50 border border-gray-100 rounded-lg p-4 md:p-6 flex flex-col lg:flex-row justify-between items-start gap-6">
                            <div className="w-full lg:w-3/5 space-y-1">
                                <p className="text-sm md:text-base"><strong>Order ID:</strong> <span className="text-blue-600 font-semibold">{order.orderNumber}</span></p>
                                <p className="text-sm md:text-base"><strong>Customer:</strong> {order.user?.name}</p>
                                <p className="text-sm md:text-base"><strong>Phone:</strong> {order.user?.phone || 'N/A'}</p>
                                <p className="text-sm md:text-base"><strong>Email:</strong> {order.user?.email}</p>
                                <p className="text-sm md:text-base"><strong>Address:</strong> {order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}</p>
                                <p className="text-sm md:text-base"><strong>Assigned To:</strong> {order.assignedTo?.name || 'N/A'}</p>
                                <p className="text-sm md:text-base"><strong>Delivered On:</strong> {moment(order.deliveredAt).format('MMMM Do YYYY, h:mm:ss a')}</p>
                                <p className="text-sm md:text-base"><strong>Total Price:</strong> <span className="font-bold text-green-600">₹{order.totalPrice}</span></p>
                            </div>

                            <div className="w-full lg:w-2/5 flex flex-col md:flex-row lg:flex-col justify-between items-start md:items-center lg:items-end gap-6">
                                <div className="w-full flex flex-col items-start md:items-end">
                                    <p className="font-semibold text-sm mb-3">Products:</p>
                                    <div className="w-full flex flex-wrap justify-start md:justify-end gap-3">
                                        {order.orderItems.map((item) => (
                                            <div key={item._id} className="flex items-center gap-3 p-2 bg-white rounded-md border border-gray-100 shadow-sm min-w-[180px]">
                                                <img
                                                        src={resolveProductImage(item.product, 0)}
                                                    alt={item.name}
                                                    className="w-12 h-12 md:w-16 md:h-16 object-cover rounded"
                                                />
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-bold leading-tight">{item.name}</p>
                                                    <p className="text-[10px] text-gray-500">Pack: {item.size}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRevertStatus(order._id)}
                                    className="w-full md:w-auto bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition-colors shadow-sm text-sm font-semibold"
                                >
                                    Revert
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No completed orders found for this period.</p>
                )}
            </div>
        </div>
    );
};

export default CompletedOrders;