

import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { resolveProductImage } from '../utils/dairyImageResolver';

import ProductManagement from '../components/ProductManagement';
import UserManagement from '../components/UserManagement';
import CreateUser from '../components/CreateUser';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import CompletedOrders from '../components/CompletedOrders';
import CancelledOrders from '../components/CancelledOrders';
import ReturnReplaceRequests from '../components/ReturnReplaceRequests';
import CompletedCancelledRequests from '../components/CompletedCancelledRequests';
import AssignedPickups from './AssignedPickups';
import AppointmentManagement from '../components/AppointmentManagement';
import FranchiseStockManagement from '../components/FranchiseStockManagement';
import SubscriptionPlanManagement from '../components/SubscriptionPlanManagement';
import SubscriptionManagement from '../components/SubscriptionManagement';
import AnnouncementBannerManagement from '../components/AnnouncementBannerManagement';
import AdminSecurityDashboard from '../components/AdminSecurityDashboard';


const AdminDashboard = () => {
    const [unassignedOrders, setUnassignedOrders] = useState([]);
    const [deliveryPartners, setDeliveryPartners] = useState([]);
    const [assignedOrders, setAssignedOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('unassignedOrders');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [orderToAssign, setOrderToAssign] = useState(null);
    const [selectedPartner, setSelectedPartner] = useState('');
    const [refreshFlag, setRefreshFlag] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredUnassigned, setFilteredUnassigned] = useState([]);
    const [filteredAssigned, setFilteredAssigned] = useState([]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [unassignedRes, partnersRes, assignedRes] = await Promise.all([
                apiClient.get('/orders/unassigned'),
                apiClient.get('/users/delivery-partners'),
                apiClient.get('/orders/assigned'),
            ]);

            setUnassignedOrders(unassignedRes.data);
            setDeliveryPartners(partnersRes.data);
            setAssignedOrders(assignedRes.data);
        } catch (err) {
            setError('Failed to fetch data.');
            console.error(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchAllData();
    }, [refreshFlag]);

    useEffect(() => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();

        // Filter unassigned orders

        const unassignedResults = unassignedOrders.filter(order =>
            (order.customerInfo?.name || '').toLowerCase().includes(lowercasedSearchTerm) ||
            (order.customerInfo?.phone || '').toLowerCase().includes(lowercasedSearchTerm) ||
            (order.user?.email || '').toLowerCase().includes(lowercasedSearchTerm) ||
            (order.orderNumber || '').toLowerCase().includes(lowercasedSearchTerm)
        );
        setFilteredUnassigned(unassignedResults);

        // Filter assigned orders
        const assignedResults = assignedOrders.filter(order =>
            (order.customerInfo?.name || '').toLowerCase().includes(lowercasedSearchTerm) ||
            (order.customerInfo?.phone || '').toLowerCase().includes(lowercasedSearchTerm) ||
            (order.user?.email || '').toLowerCase().includes(lowercasedSearchTerm) ||
            (order.assignedTo?.name || '').toLowerCase().includes(lowercasedSearchTerm) ||
            (order.orderNumber || '').toLowerCase().includes(lowercasedSearchTerm)
        );
        setFilteredAssigned(assignedResults);
    }, [searchTerm, unassignedOrders, assignedOrders]);

    const handleAssignClick = (order) => {
        setOrderToAssign(order);
        setShowAssignModal(true);
    };

    const handleAssignOrder = async () => {
        if (!selectedPartner) {
            alert('Please select a delivery partner.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await apiClient.post(
                '/delivery/assign',
                { orderId: orderToAssign._id, deliveryPersonId: selectedPartner },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Order assigned successfully!');
            setShowAssignModal(false);
            setOrderToAssign(null);
            setSelectedPartner('');
            setRefreshFlag(prev => !prev);
        } catch (err) {
            setError('Failed to assign order.');
            console.error(err);
        }
    };

    const handleAdminStatusChange = async (orderId, status) => {
        const confirmChange = window.confirm(`Are you sure you want to change the status to '${status}'?`);
        if (!confirmChange) return;

        try {
            const token = localStorage.getItem('token');
            await apiClient.post(
                `/delivery/admin/update-status/${orderId}`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Status updated successfully!');
            setRefreshFlag(prev => !prev);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status.');
            console.error(err);
        }
    };

    // Admin-only: cancel an out-of-stock order and refund the full amount to the
    // customer's wallet. Calls the dedicated wallet-refund endpoint which is
    // idempotent (a given order can only ever be refunded once).
    const handleCancelRefund = async (order) => {
        const confirmCancel = window.confirm(
            `Cancel order ${order.orderNumber} and refund ₹${order.totalPrice} to ${order.customerInfo?.name || 'the customer'}'s wallet?`
        );
        if (!confirmCancel) return;

        try {
            const { data } = await apiClient.post(`/orders/${order._id}/cancel-refund`, {
                reason: 'Product(s) out of stock',
            });
            alert(
                `Order cancelled. ₹${data.refundAmount} credited to the customer's wallet. New wallet balance: ₹${data.walletBalance}.`
            );
            setRefreshFlag(prev => !prev);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to cancel & refund.');
            console.error(err);
        }
    };

    // Per-order selection of items to mark out of stock: { [orderId]: [itemId] }
    const [oosSelection, setOosSelection] = useState({});

    const itemIsMarkable = (item) => {
        const s = item.status || 'CONFIRMED';
        return !['OUT_OF_STOCK', 'CANCELLED', 'DELIVERED'].includes(s);
    };
    const orderHasMarkableItems = (order) => (order.orderItems || []).some(itemIsMarkable);

    const toggleOosItem = (orderId, itemId) => {
        setOosSelection((prev) => {
            const current = prev[orderId] || [];
            const next = current.includes(itemId)
                ? current.filter((id) => id !== itemId)
                : [...current, itemId];
            return { ...prev, [orderId]: next };
        });
    };

    // Confirmation modal state for marking items out of stock.
    const [oosModal, setOosModal] = useState(null); // { order, itemIds, items }
    const [oosSubmitting, setOosSubmitting] = useState(false);
    const [oosResult, setOosResult] = useState(null); // { success, count, refunded, balance, message }

    // Format "2 × 1L = 2L" by parsing the number+unit out of the pack size.
    const formatItemQty = (item) => {
        const match = String(item.size || '').match(/([\d.]+)\s*(ml|l|kg|g)/i);
        if (match) {
            const total = parseFloat(match[1]) * item.qty;
            return `${item.qty} × ${item.size} = ${Number(total.toFixed(2))}${match[2]}`;
        }
        return `Qty: ${item.qty} × ${item.size}`;
    };

    // Open the confirmation modal for the SELECTED items.
    const requestMarkOutOfStock = (order, itemIds) => {
        if (!itemIds || itemIds.length === 0) return;
        const items = order.orderItems.filter((i) => itemIds.includes(i._id));
        setOosModal({ order, itemIds, items });
    };

    // Admin-only: mark the SELECTED item(s) out of stock in one request. Refunds
    // just those items to the customer's wallet (one combined email is sent);
    // the rest of the order continues to delivery.
    const confirmMarkOutOfStock = async () => {
        if (!oosModal) return;
        const { order, itemIds } = oosModal;
        setOosSubmitting(true);
        try {
            const { data } = await apiClient.post(`/orders/${order._id}/items-out-of-stock`, {
                itemIds,
            });
            setOosSelection((prev) => ({ ...prev, [order._id]: [] }));
            setOosModal(null);
            setOosResult({
                success: true,
                count: itemIds.length,
                refunded: data.refundedAmount,
                balance: data.walletBalance,
            });
            setRefreshFlag(prev => !prev);
        } catch (err) {
            setOosModal(null);
            setOosResult({
                success: false,
                message: err.response?.data?.message || 'Failed to mark items out of stock.',
            });
            console.error(err);
        } finally {
            setOosSubmitting(false);
        }
    };

    if (loading) return <div className="text-center mt-10">Loading admin dashboard...</div>;
    if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto whitespace-nowrap pb-2">
                    <button onClick={() => setActiveTab('unassignedOrders')} className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base ${activeTab === 'unassignedOrders' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Unassigned Deliveries</button>
                    <button onClick={() => setActiveTab('assignedOrders')} className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base ${activeTab === 'assignedOrders' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Assigned Deliveries</button>
                    <button onClick={() => setActiveTab('products')} className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base ${activeTab === 'products' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Products</button>
                    <button onClick={() => setActiveTab('users')} className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base ${activeTab === 'users' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Users</button>
                    <button onClick={() => setActiveTab('createUser')} className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base ${activeTab === 'createUser' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Create User</button>
                    <button onClick={() => setActiveTab('analytics')} className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base ${activeTab === 'analytics' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Analytics</button>
                    <button onClick={() => setActiveTab('completedOrders')} className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base ${activeTab === 'completedOrders' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Completed</button>
                    <button onClick={() => setActiveTab('cancelledOrders')} className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base ${activeTab === 'cancelledOrders' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Cancelled</button>
                    <button onClick={() => setActiveTab('pendingReturns')} className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base ${activeTab === 'pendingReturns' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Return Requests</button>
                    <button onClick={() => setActiveTab('assignedPickups')} className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base ${activeTab === 'assignedPickups' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Pickup Tasks</button>
                    <button onClick={() => setActiveTab('completedReturns')} className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base ${activeTab === 'completedReturns' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Completed Returns</button>
                    <button onClick={() => setActiveTab('cancelledReturns')} className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base ${activeTab === 'cancelledReturns' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Cancelled Returns</button>
                    <button onClick={() => setActiveTab('appointments')} className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base ${activeTab === 'appointments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Appointments</button>
                    <button onClick={() => setActiveTab('franchise')} className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base ${activeTab === 'franchise' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Franchise</button>
                    <button onClick={() => setActiveTab('subscriptions')} className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base ${activeTab === 'subscriptions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Subscriptions</button>
                    <button onClick={() => setActiveTab('subscriptionPlans')} className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base ${activeTab === 'subscriptionPlans' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Subscription Plans</button>
                    <button onClick={() => setActiveTab('banners')} className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base ${activeTab === 'banners' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Banners</button>
                    <button onClick={() => setActiveTab('security')} className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base ${activeTab === 'security' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Security</button>

                </nav>
            </div>

            {activeTab === 'unassignedOrders' && (
                <div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
                        <h2 className="text-2xl font-semibold">Unassigned Deliveries</h2>
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-auto p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="space-y-4">
                        {filteredUnassigned.length > 0 ? filteredUnassigned.map(order => (
                            <div key={order._id} className="bg-white rounded-lg shadow-md p-6 flex justify-between items-start flex-col md:flex-row">
                                <div className="w-full md:w-1/2 space-y-2">
                                    <p className="text-sm md:text-base"><strong>Order ID:</strong> {order.orderNumber}</p>
                                    <p className="text-sm md:text-base"><strong>Customer:</strong> {order.customerInfo?.name}</p>
                                    <p className="text-sm md:text-base"><strong>Phone:</strong> {order.customerInfo?.phone || 'N/A'}</p>
                                    <p className="text-sm md:text-base"><strong>Email:</strong> {order.user?.email}</p>
                                    <p className="text-sm md:text-base"><strong>Address:</strong> {order.shippingAddress?.address}, {order.shippingAddress?.city} {order.shippingAddress?.postalCode}</p>
                                    <p className="text-sm md:text-base"><strong>Total Price:</strong> ₹{order.totalPrice}</p>
                                </div>
                                <div className="w-full md:w-1/2 flex flex-col items-start md:items-end mt-6 md:mt-0 space-y-4">
                                    <div className="w-full flex flex-col items-start md:items-end">
                                        <p className="font-semibold text-sm md:text-base">Products:</p>
                                        <div className="w-full space-y-2 mt-2">
                                            {order.orderItems.map((item) => {
                                                const itemStatus = item.status || 'CONFIRMED';
                                                const isOOS = itemStatus === 'OUT_OF_STOCK';
                                                const canMark = !isOOS && itemStatus !== 'CANCELLED' && itemStatus !== 'DELIVERED';
                                                return (
                                                    <div key={item._id} className="flex items-center justify-between gap-2 bg-gray-50 p-2 rounded-md">
                                                        <div className="flex items-center space-x-3 min-w-0">
                                                            <img
                                                                src={resolveProductImage(item.product, 0)}
                                                                alt={item.name}
                                                                className="w-12 h-12 md:w-14 md:h-14 object-cover rounded shadow-sm flex-shrink-0"
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="text-xs md:text-sm font-medium truncate">{item.name} <span className="text-gray-500">(Pack: {item.size})</span></p>
                                                                <p className="text-[11px] text-gray-500">Qty: {item.qty} · ₹{item.price}</p>
                                                                {isOOS ? (
                                                                    <span className="inline-block text-[10px] font-bold text-red-600">Out of Stock{item.refundAmount ? ` · Refunded ₹${item.refundAmount}` : ''}</span>
                                                                ) : (
                                                                    <span className="inline-block text-[10px] font-bold text-green-600 capitalize">{itemStatus.toLowerCase()}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {canMark && (
                                                            <label className="flex-shrink-0 flex items-center gap-1.5 text-[10px] md:text-xs text-orange-700 font-semibold cursor-pointer select-none">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={(oosSelection[order._id] || []).includes(item._id)}
                                                                    onChange={() => toggleOosItem(order._id, item._id)}
                                                                    className="accent-orange-600 w-4 h-4"
                                                                />
                                                                Out of Stock
                                                            </label>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {orderHasMarkableItems(order) && (
                                                <button
                                                    type="button"
                                                    disabled={!((oosSelection[order._id] || []).length)}
                                                    onClick={() => requestMarkOutOfStock(order, oosSelection[order._id] || [])}
                                                    className="mt-2 w-full text-xs md:text-sm bg-orange-600 text-white px-3 py-2 rounded-md hover:bg-orange-700 transition-colors font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    Mark Selected Out of Stock{(oosSelection[order._id] || []).length ? ` (${oosSelection[order._id].length})` : ''}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 w-full md:justify-end">
                                        <button onClick={() => handleAssignClick(order)} className="flex-1 md:flex-none bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors shadow-md">Assign</button>
                                        <button onClick={() => handleCancelRefund(order)} className="flex-1 md:flex-none bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors shadow-sm">Cancel &amp; Refund to Wallet</button>
                                    </div>
                                </div>
                            </div>
                        )) : <p>No unassigned orders found.</p>}
                    </div>
                </div>
            )}

            {activeTab === 'assignedOrders' && (
                <div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
                        <h2 className="text-2xl font-semibold">Assigned Deliveries</h2>
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-auto p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="space-y-4">
                        {filteredAssigned.length > 0 ? filteredAssigned.map(order => (
                            <div key={order._id} className="bg-white rounded-lg shadow-md p-6 flex justify-between items-start flex-col md:flex-row">
                                <div className="w-full md:w-1/2 space-y-2">
                                    <p className="text-sm md:text-base"><strong>Order ID:</strong> {order.orderNumber}</p>
                                    <p className="text-sm md:text-base"><strong>Customer:</strong> {order.customerInfo?.name} ({order.user?.email})</p>
                                    <p className="text-sm md:text-base"><strong>Phone:</strong> {order.customerInfo?.phone || 'N/A'}</p>
                                    <p className="text-sm md:text-base"><strong>Address:</strong> {order.shippingAddress?.address}, {order.shippingAddress?.city} {order.shippingAddress?.postalCode}</p>
                                    <p className="text-sm md:text-base"><strong>Assigned To:</strong> {order.assignedTo?.name} ({order.assignedTo?.email})</p>
                                    <p className="text-sm md:text-base"><strong>Status:</strong> <span className="capitalize font-semibold text-blue-600">{order.status}</span></p>
                                    <p className="text-sm md:text-base"><strong>Total Price:</strong> ₹{order.totalPrice}</p>
                                </div>
                                <div className="w-full md:w-1/2 flex flex-col items-start md:items-end mt-6 md:mt-0 space-y-4">
                                    <div className="w-full flex flex-col items-start md:items-end">
                                        <p className="font-semibold text-sm md:text-base">Products:</p>
                                        <div className="w-full space-y-2 mt-2">
                                            {order.orderItems.map((item) => {
                                                const itemStatus = item.status || 'CONFIRMED';
                                                const isOOS = itemStatus === 'OUT_OF_STOCK';
                                                const canMark = !isOOS && itemStatus !== 'CANCELLED' && itemStatus !== 'DELIVERED';
                                                return (
                                                    <div key={item._id} className="flex items-center justify-between gap-2 bg-gray-50 p-2 rounded-md">
                                                        <div className="flex items-center space-x-3 min-w-0">
                                                            <img
                                                                src={resolveProductImage(item.product, 0)}
                                                                alt={item.name}
                                                                className="w-12 h-12 md:w-14 md:h-14 object-cover rounded shadow-sm flex-shrink-0"
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="text-xs md:text-sm font-medium truncate">{item.name} <span className="text-gray-500">(Pack: {item.size})</span></p>
                                                                <p className="text-[11px] text-gray-500">Qty: {item.qty} · ₹{item.price}</p>
                                                                {isOOS ? (
                                                                    <span className="inline-block text-[10px] font-bold text-red-600">Out of Stock{item.refundAmount ? ` · Refunded ₹${item.refundAmount}` : ''}</span>
                                                                ) : (
                                                                    <span className="inline-block text-[10px] font-bold text-green-600 capitalize">{itemStatus.toLowerCase()}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {canMark && (
                                                            <label className="flex-shrink-0 flex items-center gap-1.5 text-[10px] md:text-xs text-orange-700 font-semibold cursor-pointer select-none">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={(oosSelection[order._id] || []).includes(item._id)}
                                                                    onChange={() => toggleOosItem(order._id, item._id)}
                                                                    className="accent-orange-600 w-4 h-4"
                                                                />
                                                                Out of Stock
                                                            </label>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {orderHasMarkableItems(order) && (
                                                <button
                                                    type="button"
                                                    disabled={!((oosSelection[order._id] || []).length)}
                                                    onClick={() => requestMarkOutOfStock(order, oosSelection[order._id] || [])}
                                                    className="mt-2 w-full text-xs md:text-sm bg-orange-600 text-white px-3 py-2 rounded-md hover:bg-orange-700 transition-colors font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    Mark Selected Out of Stock{(oosSelection[order._id] || []).length ? ` (${oosSelection[order._id].length})` : ''}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 w-full md:justify-end">
                                        <button onClick={() => handleAdminStatusChange(order._id, 'delivered')} className="flex-1 md:flex-none bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors shadow-sm">Complete</button>
                                        <button onClick={() => handleCancelRefund(order)} className="flex-1 md:flex-none bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors shadow-sm">Cancel &amp; Refund to Wallet</button>
                                        <button onClick={() => handleAssignClick(order)} className="flex-1 md:flex-none bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors shadow-sm">Reassign</button>
                                    </div>
                                </div>
                            </div>
                        )) : <p>No assigned orders found.</p>}
                    </div>
                </div>
            )}

            {activeTab === 'pendingReturns' && (
                <ReturnReplaceRequests
                    deliveryPartners={deliveryPartners}
                    setActiveTab={setActiveTab}
                    setRefreshFlag={setRefreshFlag}
                />
            )}
            {activeTab === 'assignedPickups' && <AssignedPickups setActiveTab={setActiveTab} />}
            {activeTab === 'completedReturns' && <CompletedCancelledRequests type="completed" />}
            {activeTab === 'cancelledReturns' && <CompletedCancelledRequests type="cancelled" />}
            {activeTab === 'products' && <ProductManagement />}
            {activeTab === 'users' && <UserManagement />}
            {/* {activeTab === 'users' && <UserManagement onUserListUpdated={fetchAllData} />} */}
            {activeTab === 'createUser' && <CreateUser onUserCreated={fetchAllData} />}
            {activeTab === 'analytics' && <AnalyticsDashboard />}
            {activeTab === 'completedOrders' && <CompletedOrders refreshFlag={refreshFlag} />}
            {activeTab === 'cancelledOrders' && <CancelledOrders refreshFlag={refreshFlag} />}
            {activeTab === 'appointments' && <AppointmentManagement />}
            {activeTab === 'franchise' && <FranchiseStockManagement />}
            {activeTab === 'subscriptions' && <SubscriptionManagement />}
            {activeTab === 'subscriptionPlans' && <SubscriptionPlanManagement />}
            {activeTab === 'banners' && <AnnouncementBannerManagement />}
            {activeTab === 'security' && <AdminSecurityDashboard />}


            {showAssignModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-4">Assign Order to Delivery Partner</h3>
                        <p className="mb-2"><strong>Order:</strong> {orderToAssign.customerInfo?.name}'s order</p>
                        <select onChange={(e) => setSelectedPartner(e.target.value)} className="w-full p-2 border rounded-md">
                            <option value="">Select Delivery Partner</option>
                            {deliveryPartners.map(partner => (
                                <option key={partner._id} value={partner._id}>{partner.name} ({partner.email})</option>
                            ))}
                        </select>
                        <div className="mt-6 flex justify-between space-x-4">
                            <button onClick={() => setShowAssignModal(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md">Cancel</button>
                            <button onClick={handleAssignOrder} className="bg-green-600 text-white px-4 py-2 rounded-md" disabled={!selectedPartner}>Confirm Assign</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Out-of-stock confirmation modal */}
            {oosModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !oosSubmitting && setOosModal(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-orange-50 border-b border-orange-100 px-6 py-4">
                            <h3 className="text-lg font-bold text-orange-700">Mark Items Out of Stock</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Order #{oosModal.order.orderNumber} · {oosModal.order.customerInfo?.name}
                            </p>
                        </div>

                        <div className="px-6 py-4 max-h-72 overflow-y-auto divide-y divide-gray-100">
                            {oosModal.items.map((item) => (
                                <div key={item._id} className="flex items-center gap-3 py-2.5">
                                    <img src={resolveProductImage(item.product, 0)} alt={item.name} className="w-11 h-11 object-cover rounded flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                                        <p className="text-xs text-gray-500">{formatItemQty(item)}</p>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">₹{(item.price * item.qty).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-600">Total Refund</span>
                            <span className="text-xl font-extrabold text-green-700">
                                ₹{oosModal.items.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2)}
                            </span>
                        </div>

                        <p className="px-6 pt-3 text-xs text-gray-500">
                            This amount will be credited to the customer's wallet. The remaining items will still be delivered.
                        </p>

                        <div className="px-6 py-4 flex gap-3">
                            <button
                                onClick={() => setOosModal(null)}
                                disabled={oosSubmitting}
                                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmMarkOutOfStock}
                                disabled={oosSubmitting}
                                className="flex-1 py-2.5 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 transition-colors disabled:opacity-60"
                            >
                                {oosSubmitting ? 'Processing…' : 'Confirm & Refund'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Out-of-stock result modal (success / error) */}
            {oosResult && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOosResult(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${oosResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                            {oosResult.success ? (
                                <svg className="w-9 h-9 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="w-9 h-9 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            )}
                        </div>

                        {oosResult.success ? (
                            <>
                                <h3 className="text-lg font-bold text-gray-900">Items Marked Out of Stock</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {oosResult.count} item(s) updated and refunded to the customer's wallet.
                                </p>
                                <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-2 text-left">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Refunded</span>
                                        <span className="font-bold text-green-700">₹{oosResult.refunded}</span>
                                    </div>
                                    <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                                        <span className="text-gray-500">Customer Wallet Balance</span>
                                        <span className="font-bold text-gray-900">₹{oosResult.balance}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-bold text-gray-900">Couldn't Mark Out of Stock</h3>
                                <p className="text-sm text-gray-500 mt-1">{oosResult.message}</p>
                            </>
                        )}

                        <button
                            onClick={() => setOosResult(null)}
                            className={`mt-6 w-full py-2.5 rounded-lg text-white font-semibold transition-colors ${oosResult.success ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-800'}`}
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;