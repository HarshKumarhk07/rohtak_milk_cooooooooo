

import React, { useState, useEffect } from 'react';

import apiClient from '../services/apiClient';
import moment from 'moment';
import { resolveProductImage } from '../utils/dairyImageResolver';

const CancelledOrders = ({ refreshFlag }) => {
    const [cancelledOrders, setCancelledOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(moment().month() + 1);
    const [selectedYear, setSelectedYear] = useState(moment().year());
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOrders, setFilteredOrders] = useState([]);

    const fetchCancelledOrders = async () => {
        try {
            const response = await apiClient.get(
                `/orders/cancelled?month=${selectedMonth}&year=${selectedYear}`
            );
            setCancelledOrders(response.data);
        } catch (err) {
            setError('Failed to fetch cancelled orders.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchCancelledOrders();
    }, [selectedMonth, selectedYear, refreshFlag]);

    useEffect(() => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        const results = cancelledOrders.filter(order =>
            order.user?.name.toLowerCase().includes(lowercasedSearchTerm) ||
            order.user?.email.toLowerCase().includes(lowercasedSearchTerm) ||
            order.user?.phone?.toLowerCase().includes(lowercasedSearchTerm) ||
            order.orderNumber.toLowerCase().includes(lowercasedSearchTerm)
        );
        setFilteredOrders(results);
    }, [searchTerm, cancelledOrders]);

    const months = moment.months().map((name, index) => ({ name, value: index + 1 }));
    const years = [2024, 2025, 2026];

    const handleRevertStatus = async (orderId) => {
        const confirmRevert = window.confirm('Are you sure you want to revert this order? It will be moved back to the Unassigned list.');
        if (!confirmRevert) return;

        try {
            const token = localStorage.getItem('token');
            await apiClient.post(
                '/orders/revert-status',
                { orderId, status: 'pending' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Order status reverted successfully!');
            fetchCancelledOrders();
        } catch (err) {
            console.error(err);
            alert('Failed to revert status.');
        }
    };

    if (loading) return <div className="text-center mt-10">Loading cancelled orders...</div>;
    if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;

    return (
        <div className="p-3 md:p-6 bg-white shadow-md rounded-lg">
            <h2 className="text-xl md:text-2xl font-semibold mb-6">Cancelled Orders</h2>

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
                                <p className="text-sm md:text-base"><strong>Cancelled On:</strong> {moment(order.updatedAt).format('MMMM Do YYYY, h:mm:ss a')}</p>
                                <p className="text-sm md:text-base"><strong>Total Price:</strong> <span className="font-bold text-red-600">₹{order.totalPrice}</span></p>
                            </div>

                            <div className="w-full lg:w-2/5 flex flex-col md:flex-row lg:flex-col justify-between items-start md:items-center lg:items-end gap-6">
                                <div className="w-full flex flex-col items-start md:items-end">
                                    <p className="font-semibold text-sm mb-3">Original Product:</p>
                                    <img
                                        src={resolveProductImage(order.orderItems?.[0]?.product, 0)}
                                        alt="Original Product"
                                        className="w-20 h-20 md:w-24 md:h-24 object-cover rounded mt-2 border border-gray-100 shadow-sm"
                                    />
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
                    <p>No cancelled orders found for this period.</p>
                )}
            </div>
        </div>
    );
};

export default CancelledOrders;