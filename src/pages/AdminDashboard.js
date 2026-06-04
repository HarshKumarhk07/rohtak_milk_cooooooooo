

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
                                            {order.orderItems.map((item) => (
                                                <div key={item._id} className="flex items-center space-x-3 bg-gray-50 p-2 rounded-md md:bg-transparent md:p-0 md:justify-end">
                                                    <img
                                                        src={resolveProductImage(item.product, 0)}
                                                        alt={item.name}
                                                        className="w-12 h-12 md:w-16 md:h-16 object-cover rounded shadow-sm"
                                                    />
                                                    <p className="text-xs md:text-sm font-medium">{item.name} <span className="text-gray-500">(Pack: {item.size})</span></p>
                                                </div>
                                            ))}
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
                                            {order.orderItems.map((item) => (
                                                <div key={item._id} className="flex items-center space-x-3 bg-gray-50 p-2 rounded-md md:bg-transparent md:p-0 md:justify-end">
                                                    <img
                                                        src={resolveProductImage(item.product, 0)}
                                                        alt={item.name}
                                                        className="w-12 h-12 md:w-16 md:h-16 object-cover rounded shadow-sm"
                                                    />
                                                    <p className="text-xs md:text-sm font-medium">{item.name} <span className="text-gray-500">(Pack: {item.size})</span></p>
                                                </div>
                                            ))}
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
        </div>
    );
};

export default AdminDashboard;