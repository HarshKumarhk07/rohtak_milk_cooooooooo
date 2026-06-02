

import React, { useState, useEffect } from 'react';

import LiveLocationTracker from '../components/LiveLocationTracker';
import moment from 'moment';
import apiClient from '../services/apiClient';

const DeliveryDashboard = () => {
    const [assignedDeliveries, setAssignedDeliveries] = useState([]);
    const [deliveredOrders, setDeliveredOrders] = useState([]);
    const [cancelledOrders, setCancelledOrders] = useState([]);
    const [assignedPickups, setAssignedPickups] = useState([]);
    const [completedPickups, setCompletedPickups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpInput, setOtpInput] = useState('');
    const [currentDelivery, setCurrentDelivery] = useState(null);
    const [activeTab, setActiveTab] = useState('assigned');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState("");
    const [notification, setNotification] = useState(null);
    const prevAssignedIdsRef = React.useRef(null);

    const fetchAllData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [assignedRes, deliveredRes, cancelledRes, pickupsRes, completedPickupsRes] = await Promise.all([
                apiClient.get('/delivery/my-deliveries'),
                apiClient.get('/delivery/delivered-orders'),
                apiClient.get('/delivery/cancelled-orders'),
                apiClient.get('/return-replace/my-pickups'),
                apiClient.get(`/return-replace/my-pickups/completed?month=${filterMonth}&year=${filterYear}`),
            ]);

            const assignedData = assignedRes.data;
            
            const notifyNewest = (data) => {
                if (data.length > 0) {
                    const newest = [...data].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
                    if (newest) {
                        const productNames = newest.order?.orderItems?.map(item => item.name).join(', ') || 'No products';
                        setNotification(`New Delivery Assigned: Order ID: ${newest.order?.orderNumber || 'N/A'} - ${productNames}`);
                        setTimeout(() => setNotification(null), 8000);
                    }
                }
            };

            if (prevAssignedIdsRef.current === null) {
                // First load/login: notify only newest assigned delivery
                notifyNewest(assignedData);
            } else {
                // Subsequent polls: notify only newest added delivery
                const prevIds = prevAssignedIdsRef.current;
                const newAssignments = assignedData.filter(d => !prevIds.includes(d._id));
                notifyNewest(newAssignments);
            }
            
            prevAssignedIdsRef.current = assignedData.map(d => d._id);
            setAssignedDeliveries(assignedData);

            setDeliveredOrders(
                deliveredRes.data.filter(d => {
                    const orderNum = d.order?.orderNumber || '';
                    return !orderNum.startsWith('REP-') && !orderNum.startsWith('RET-');
                })
            );
            setCancelledOrders(cancelledRes.data);
            setAssignedPickups(pickupsRes.data);
            setCompletedPickups(completedPickupsRes.data);
        } catch (err) {
            setError('Failed to fetch data.');
            console.error(err.response?.data?.message || err.message);
        } finally {
            if (!silent) setLoading(false);
        }
    };

useEffect(() => {
    fetchAllData();
    const intervalId = setInterval(() => {
        fetchAllData(true);
    }, 15000);
    return () => clearInterval(intervalId);
}, [filterMonth, filterYear]);

    const handleUpdateStatus = async (delivery, status) => {
        if (!delivery || !delivery.order || !delivery.order._id) {
            alert('Invalid delivery or order information.');
            console.error('Delivery or Order ID is missing', delivery);
            return;
        }

        setCurrentDelivery({ ...delivery, newStatus: status });
        if (status === 'out for delivery') {
            try {
                const token = localStorage.getItem('token');
                await apiClient.post(
                    '/delivery/update-status',
                    { orderId: delivery.order._id, status },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                alert('Status updated to "Out for Delivery".');
                fetchAllData();
            } catch (error) {
                console.error('Update status error:', error.response?.data || error.message);
                alert(error.response?.data?.message || 'Failed to update status.');
            }
        } else {
            try {
                const token = localStorage.getItem('token');
                await apiClient.post('/delivery/send-otp', { orderId: delivery.order._id }, { headers: { Authorization: `Bearer ${token}` } });
                setShowOtpModal(true);
                alert('OTP sent to customer.');
            } catch (error) {
                console.error('Send OTP error:', error.response?.data || error.message);
                alert(error.response?.data?.message || 'Failed to send OTP.');
            }
        }
    };

    const handleVerifyAndChangeStatus = async () => {
        if (!otpInput || !currentDelivery) return;
        try {
            const token = localStorage.getItem('token');
            await apiClient.post(
                '/delivery/update-status',
                {
                    orderId: currentDelivery.order._id,
                    otp: otpInput,
                    status: currentDelivery.newStatus
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Status updated successfully!');
            setShowOtpModal(false);
            setOtpInput('');
            fetchAllData();
        } catch (error) {
            console.error('Verify and update status error:', error.response?.data || error.message);
            alert(error.response?.data?.message || 'Failed to update status.');
        }
    };

    const handlePickupStatusChange = async (pickup, status) => {
        try {
            const token = localStorage.getItem('token');
            await apiClient.post(
                '/return-replace/pickup-status',
                { requestId: pickup._id, status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Pickup status updated successfully!');
            fetchAllData();
        } catch (error) {
            console.error('Update pickup status error:', error.response?.data || error.message);
            alert(error.response?.data?.message || 'Failed to update pickup status.');
        }
    };

    if (loading) return <div className="text-center mt-10">Loading deliveries...</div>;
    if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;

    return (
        <div className="p-3 md:p-6 lg:p-8 bg-gray-50 min-h-screen relative">
            {/* Notification Popup */}
            {notification && (
                <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[100] flex items-center bg-blue-600 border-l-4 border-blue-800 py-3 px-6 shadow-xl rounded animate-bounce">
                    <div className="text-white flex items-center gap-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="font-bold">{notification}</p>
                    </div>
                    <button onClick={() => setNotification(null)} className="ml-4 text-white hover:text-gray-200" title="Close">
                        &times;
                    </button>
                </div>
            )}

            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold mb-6 text-gray-800">Delivery Dashboard</h1>

            <div className="border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
                <nav className="-mb-px flex space-x-4 md:space-x-8 whitespace-nowrap pb-1">
                    <button onClick={() => setActiveTab('assigned')} className={`py-3 px-1 border-b-2 font-medium text-xs md:text-base ${activeTab === 'assigned' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Assigned Deliveries</button>
                    <button onClick={() => setActiveTab('pickups')} className={`py-3 px-1 border-b-2 font-medium text-xs md:text-base ${activeTab === 'pickups' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Pickup Assignments</button>
                    <button onClick={() => setActiveTab('delivered')} className={`py-3 px-1 border-b-2 font-medium text-xs md:text-base ${activeTab === 'delivered' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Delivered Orders</button>
                    <button onClick={() => setActiveTab('cancelled')} className={`py-3 px-1 border-b-2 font-medium text-xs md:text-base ${activeTab === 'cancelled' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Cancelled Orders</button>
                    <button onClick={() => setActiveTab('completedPickups')} className={`py-3 px-1 border-b-2 font-medium text-xs md:text-base ${activeTab === 'completedPickups' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Completed Pickups</button>
                    <button onClick={() => setActiveTab('tracker')} className={`py-3 px-1 border-b-2 font-medium text-xs md:text-base ${activeTab === 'tracker' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Live Tracker</button>
                </nav>
            </div>

            {activeTab === 'assigned' && (
                <div className="space-y-4">
                    {assignedDeliveries.length > 0 ? (
                        assignedDeliveries.map(delivery => (
                            <div key={delivery._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3.5 md:p-6 transition-all hover:shadow-md">
                                <div className="space-y-1.5 mb-4">
                                    <p className="text-[13px] md:text-base"><strong>Order ID:</strong> <span className="text-blue-600 font-medium">{delivery.order?.orderNumber}</span></p>
                                    <p className="text-[13px] md:text-base"><strong>Customer:</strong> {delivery.order?.user?.name} ({delivery.order?.user?.phone})</p>
                                    <p className="text-[13px] md:text-base"><strong>Email:</strong> {delivery.order?.user?.email}</p>
                                    <p className="text-[13px] md:text-base"><strong>Address:</strong> {delivery.order?.shippingAddress?.address}, {delivery.order?.shippingAddress?.city}, {delivery.order?.shippingAddress?.postalCode}</p>
                                    <p className="text-[13px] md:text-base"><strong>Status:</strong> <span className="capitalize font-semibold text-blue-600">{delivery.status}</span></p>
                                </div>
                                <div className="mt-5 flex flex-row md:flex-wrap gap-2 md:gap-3">
                                    <button onClick={() => handleUpdateStatus(delivery, 'out for delivery')} className="flex-1 md:flex-none md:min-w-[140px] bg-blue-600 text-white px-1.5 md:px-4 py-2 md:py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-[10px] md:text-sm font-semibold shadow-sm">
                                        <span className="md:hidden">Out Delivery</span>
                                        <span className="hidden md:inline">Out for Delivery</span>
                                    </button>
                                    <button onClick={() => handleUpdateStatus(delivery, 'delivered')} className="flex-1 md:flex-none md:min-w-[140px] bg-green-600 text-white px-1.5 md:px-4 py-2 md:py-2.5 rounded-lg hover:bg-green-700 transition-colors text-[10px] md:text-sm font-semibold shadow-sm">Delivered</button>
                                    <button onClick={() => handleUpdateStatus(delivery, 'cancelled')} className="flex-1 md:flex-none md:min-w-[140px] bg-red-600 text-white px-1.5 md:px-4 py-2 md:py-2.5 rounded-lg hover:bg-red-700 transition-colors text-[10px] md:text-sm font-semibold shadow-sm">Cancel</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No deliveries have been assigned to you yet.</p>
                    )}
                </div>
            )}

            {activeTab === 'pickups' && (
                <div className="space-y-4">
                    <h2 className="text-lg md:text-xl font-semibold mb-6 text-gray-800">Your Pickup Assignments</h2>
                    {assignedPickups.filter(p => p.status !== 'received').length > 0 ? (
                        assignedPickups.filter(p => p.status !== 'received').map(pickup => (
                            <div key={pickup._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3.5 md:p-6 transition-all hover:shadow-md">
                                <div className="space-y-1.5 mb-4">
                                    <p className="text-[13px] md:text-base"><strong>Order Number:</strong> <span className="text-blue-600 font-medium">{pickup.order?.orderNumber}</span></p>
                                    <p className="text-[13px] md:text-base"><strong>Customer:</strong> {pickup.user?.name} ({pickup.user?.phone})</p>
                                    <p className="text-[13px] md:text-base"><strong>Email:</strong> {pickup.user?.email}</p>
                                    <p className="text-[13px] md:text-base"><strong>Address:</strong> {pickup.order?.shippingAddress?.address}, {pickup.order?.shippingAddress?.city}, {pickup.order?.shippingAddress?.postalCode}</p>
                                    <p className="text-[13px] md:text-base"><strong>Request Type:</strong> <span className="capitalize font-semibold text-indigo-600">{pickup.type}</span></p>
                                    <p className="text-[13px] md:text-base"><strong>Reason:</strong> <span className="text-gray-600">{pickup.reason}</span></p>
                                    <p className="text-[13px] md:text-base"><strong>Status:</strong> <span className="capitalize font-semibold text-orange-600">{pickup.status === 'out for pickup' ? 'Pickup' : pickup.status}</span></p>
                                </div>
                                <div className="mt-5">
                                    <button
                                        onClick={() => handlePickupStatusChange(pickup, 'received')}
                                        className="w-full md:w-auto bg-green-600 text-white px-5 md:px-6 py-2 md:py-2.5 rounded-lg hover:bg-green-700 transition-colors font-semibold text-xs md:text-sm shadow-sm"
                                    >
                                        Mark as Received
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No pickup assignments found.</p>
                    )}
                </div>
            )}


            {activeTab === 'delivered' && (
                <div className="space-y-4">
                    <h2 className="text-lg md:text-xl font-semibold mb-6 text-gray-800">Your Delivered Orders</h2>
                    {deliveredOrders.length > 0 ? (
                        deliveredOrders.map(delivery => (
                            <div key={delivery._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3.5 md:p-6 transition-all hover:shadow-md">
                                <div className="space-y-1.5">
                                    <p className="text-[13px] md:text-base"><strong>Order ID:</strong> <span className="text-blue-600 font-medium">{delivery.order?.orderNumber}</span></p>
                                    <p className="text-[13px] md:text-base"><strong>Customer:</strong> {delivery.order?.user?.name} ({delivery.order?.user?.phone})</p>
                                    <p className="text-[13px] md:text-base"><strong>Email:</strong> {delivery.order?.user?.email}</p>
                                    <p className="text-[13px] md:text-base"><strong>Address:</strong> {delivery.order?.shippingAddress?.address}, {delivery.order?.shippingAddress?.city}, {delivery.order?.shippingAddress?.postalCode}</p>
                                    <p className="text-[13px] md:text-base"><strong>Status:</strong> <span className="capitalize font-semibold text-green-600">{delivery.status}</span></p>
                                    <p className="text-[13px] md:text-base"><strong>Delivered On:</strong> <span className="text-gray-500">{moment(delivery.deliveredAt).format('MMMM Do YYYY, h:mm:ss a')}</span></p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center py-10 text-gray-500">No delivered orders found.</p>
                    )}
                </div>
            )}

            {activeTab === 'cancelled' && (
                <div className="space-y-4">
                    <h2 className="text-lg md:text-xl font-semibold mb-6 text-gray-800">Your Cancelled Orders</h2>
                    {cancelledOrders.length > 0 ? (
                        cancelledOrders.map(delivery => (
                            <div key={delivery._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3.5 md:p-6 transition-all hover:shadow-md">
                                <div className="space-y-1.5">
                                    <p className="text-[13px] md:text-base"><strong>Order ID:</strong> <span className="text-blue-600 font-medium">{delivery.order?.orderNumber}</span></p>
                                    <p className="text-[13px] md:text-base"><strong>Customer:</strong> {delivery.order?.user?.name} ({delivery.order?.user?.phone})</p>
                                    <p className="text-[13px] md:text-base"><strong>Email:</strong> {delivery.order?.user?.email}</p>
                                    <p className="text-[13px] md:text-base"><strong>Address:</strong> {delivery.order?.shippingAddress?.address}, {delivery.order?.shippingAddress?.city}, {delivery.order?.shippingAddress?.postalCode}</p>
                                    <p className="text-[13px] md:text-base"><strong>Status:</strong> <span className="capitalize font-semibold text-red-600">{delivery.status}</span></p>
                                    <p className="text-[13px] md:text-base"><strong>Cancelled On:</strong> <span className="text-gray-500">{moment(delivery.updatedAt).format('MMMM Do YYYY, h:mm:ss a')}</span></p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center py-10 text-gray-500">No cancelled orders found.</p>
                    )}
                </div>
            )}

            {activeTab === 'completedPickups' && (
                <div className="space-y-4">
                    <h2 className="text-lg md:text-xl font-semibold mb-6 text-gray-800">Completed Pickups</h2>
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <input
                            type="number"
                            placeholder="Year"
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm flex-1 md:max-w-[150px] text-sm"
                        />
                        <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm flex-1 md:max-w-[200px] text-sm"
                        >
                            <option value="">Select Month</option>
                            {moment.months().map((month, index) => (
                                <option key={index} value={index + 1}>{month}</option>
                            ))}
                        </select>
                    </div>
                    {completedPickups.length > 0 ? (
                        completedPickups.map(pickup => (
                            <div key={pickup._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3.5 md:p-6 transition-all hover:shadow-md">
                                <div className="space-y-1.5">
                                    <p className="text-[13px] md:text-base"><strong>Order Number:</strong> <span className="text-blue-600 font-medium">{pickup.order?.orderNumber}</span></p>
                                    <p className="text-[13px] md:text-base"><strong>Customer:</strong> {pickup.user?.name} ({pickup.user?.phone})</p>
                                    <p className="text-[13px] md:text-base"><strong>Email:</strong> {pickup.user?.email}</p>
                                    <p className="text-[13px] md:text-base"><strong>Address:</strong> {pickup.order?.shippingAddress?.address}, {pickup.order?.shippingAddress?.city}, {pickup.order?.shippingAddress?.postalCode}</p>
                                    <p className="text-[13px] md:text-base"><strong>Request Type:</strong> <span className="capitalize font-semibold text-indigo-600">{pickup.type}</span></p>
                                    <p className="text-[13px] md:text-base"><strong>Reason:</strong> <span className="text-gray-600">{pickup.reason}</span></p>
                                    <p className="text-[13px] md:text-base"><strong>Status:</strong> <span className="capitalize font-semibold text-green-600">{pickup.status}</span></p>
                                    <p className="text-[13px] md:text-base"><strong>Completed On:</strong> <span className="text-gray-500">{moment(pickup.pickupDeliveredAt).format('MMMM Do YYYY, h:mm:ss a')}</span></p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No completed pickups found.</p>
                    )}
                </div>
            )}

            {activeTab === 'tracker' && <LiveLocationTracker />}


            {showOtpModal && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-sm transform transition-all">
                        <h3 className="text-xl font-bold mb-4 text-gray-900 border-b pb-2">Verify with OTP</h3>
                        <p className="text-gray-600 mb-6 text-sm">An OTP has been sent to the customer's email. Please enter it to update the status.</p>
                        <div className="mb-6">
                            <input
                                type="text"
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value)}
                                placeholder="Enter 6-digit OTP"
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-center tracking-[0.5em] font-bold text-sm"
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleVerifyAndChangeStatus} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 uppercase tracking-wider text-xs">Verify & Update</button>
                            <button onClick={() => { setShowOtpModal(false); setOtpInput(''); }} className="w-full bg-gray-50 text-gray-500 font-bold py-3 rounded-xl hover:bg-gray-100 transition-all uppercase tracking-wider text-xs">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default DeliveryDashboard;