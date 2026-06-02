

// import React, { useState, useEffect } from 'react';
// 
// import moment from 'moment';
// import LoadingSpinner from '../components/LoadingSpinner';
// import { FaBox, FaTruck, FaUndo, FaExchangeAlt, FaTimesCircle, FaCheckCircle, FaSpinner } from 'react-icons/fa';

// const MyOrdersPage = () => {
//     const [orders, setOrders] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [allRequests, setAllRequests] = useState([]);

//     const [showRequestModal, setShowRequestModal] = useState(false);
//     const [currentOrder, setCurrentOrder] = useState(null);
//     const [requestType, setRequestType] = useState('return');
//     const [requestReason, setRequestReason] = useState('');
//     const [requestMessage, setRequestMessage] = useState('');

//     const [availableSizes, setAvailableSizes] = useState([]);
//     const [selectedSize, setSelectedSize] = useState('');

//     const fetchMyOrdersAndRequests = async () => {
//         try {
//             const token = localStorage.getItem('token');
//             const [ordersRes, requestsRes] = await Promise.all([
//                 apiClient.get('/orders/myorders', {
//                     headers: { Authorization: `Bearer ${token}` },
//                 }),
//                 apiClient.get('/return-replace/my-requests', {
//                     headers: { Authorization: `Bearer ${token}` },
//                 }),
//             ]);
//             setOrders(ordersRes.data);
//             setAllRequests(requestsRes.data);
//         } catch (err) {
//             console.error('Error fetching data:', err);
//             setError('Failed to fetch orders or requests.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchMyOrdersAndRequests();
//     }, []);

//     const handleRequestClick = async (order, type) => {
//         setCurrentOrder(order);
//         setRequestType(type);
//         setRequestReason('');
//         setSelectedSize('');

//         if (type === 'replace') {
//             try {
//                 const productId = order.orderItems[0]?.product?._id;
//                 if (!productId) {
//                     console.error('Product ID is missing.');
//                     return;
//                 }
//                 const productDetailsRes = await apiClient.get(
//                     `/products/${productId}`
//                 );
//                 const availableVariants = productDetailsRes.data.variants.filter(
//                     (v) => v.countInStock > 0
//                 );
//                 setAvailableSizes(availableVariants);
//             } catch (err) {
//                 console.error('Failed to fetch product variants:', err);
//             }
//         }
//         setShowRequestModal(true);
//     };

//     const handleSizeChange = (e) => {
//         const newSize = e.target.value;
//         setSelectedSize(newSize);
//         setRequestReason(`Requested size - "${newSize}"`);
//     };

//     const handleRequestSubmit = async (e) => {
//         e.preventDefault();
//         try {
//             const token = localStorage.getItem('token');
//             const payload = {
//                 orderId: currentOrder._id,
//                 type: requestType,
//                 reason: requestReason,
//             };

//             if (requestType === 'replace') {
//                 payload.replacedProductInfo = {
//                     name: currentOrder.orderItems[0].name,
//                     qty: currentOrder.orderItems[0].qty,
//                     price: currentOrder.orderItems[0].price,
//                     product: currentOrder.orderItems[0].product._id,
//                     size: selectedSize,
//                 };
//             }

//             await apiClient.post('/return-replace/request', payload, {
//                 headers: { Authorization: `Bearer ${token}` },
//             });

//             setRequestMessage('Request submitted successfully!');
//             setShowRequestModal(false);
//             fetchMyOrdersAndRequests();
//         } catch (err) {
//             setRequestMessage(err.response?.data?.message || 'Failed to submit request.');
//         }
//     };

//     const handleCancelRequest = async (requestId) => {
//         if (window.confirm('Are you sure you want to cancel this request?')) {
//             try {
//                 const token = localStorage.getItem('token');
//                 await apiClient.post(
//                     '/return-replace/cancel-request',
//                     { requestId },
//                     { headers: { Authorization: `Bearer ${token}` } }
//                 );
//                 setRequestMessage('Request cancelled successfully!');
//                 fetchMyOrdersAndRequests();
//             } catch (err) {
//                 setRequestMessage(err.response?.data?.message || 'Failed to cancel request.');
//             }
//         }
//     };

//     const getStatusColor = (status) => {
//         switch (status) {
//             case 'pending': return 'bg-yellow-100 text-yellow-800';
//             case 'delivered': return 'bg-green-100 text-green-800';
//             case 'shipped': return 'bg-blue-100 text-blue-800';
//             case 'canceled': return 'bg-red-100 text-red-800';
//             default: return 'bg-gray-100 text-gray-800';
//         }
//     };

//     const getRequestStatusColor = (status) => {
//         switch (status) {
//             case 'pending': return 'text-yellow-600';
//             case 'approved': return 'text-green-600';
//             case 'rejected': return 'text-red-600';
//             case 'out for pickup': return 'text-purple-600';
//             case 'completed': return 'text-green-600';
//             default: return 'text-gray-600';
//         }
//     };

//     if (loading) return <LoadingSpinner />;
//     if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;

//     return (
//         <div className="container mx-auto px-4 py-8 md:py-12">
//             <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-800">Your Order History</h1>
//             {requestMessage && (
//                 <div className="bg-green-100 text-green-700 p-4 rounded-md mb-6 transition-all duration-300 transform animate-fadeInUp">
//                     {requestMessage}
//                 </div>
//             )}

//             {orders.length === 0 ? (
//                 <div className="text-center text-gray-500 py-12">
//                     <FaBox className="mx-auto w-16 h-16 text-gray-300 mb-4" />
//                     <p className="text-xl">You have not placed any orders yet.</p>
//                 </div>
//             ) : (
//                 <div className="space-y-8">
//                     {orders.map((order) => {
//                         const request = allRequests.find(
//                             (req) => String(req.order?._id || req.order) === String(order._id)
//                         );

//                         const isPendingOrInProgress = request?.status === 'pending' || request?.status === 'out for pickup';
//                         const isRejected = request?.status === 'rejected';
//                         const isCompleted = request?.status === 'received' || request?.status === 'completed';
//                         const isActionable = order.isDelivered && !isPendingOrInProgress && !isCompleted && !isRejected;

//                         return (
//                             <div key={order._id} className="bg-white rounded-xl shadow-lg p-6 md:p-8 hover:shadow-xl transition-shadow duration-300">
//                                 <div className="flex justify-between items-center border-b pb-4 mb-4">
//                                     <div>
//                                         <h2 className="text-xl md:text-2xl font-bold text-gray-800">
//                                             Order #{order.orderNumber}
//                                         </h2>
//                                         <p className="text-sm text-gray-500">
//                                             Placed on: {moment(order.createdAt).format('MMMM Do YYYY, h:mm a')}
//                                         </p>
//                                     </div>
//                                     <span className={`px-4 py-1 rounded-full text-sm font-semibold capitalize ${getStatusColor(order.status)}`}>
//                                         {order.status}
//                                     </span>
//                                 </div>

//                                 <div className="flex justify-between items-center mb-6">
//                                     <div className="flex items-center space-x-2 text-gray-700">
//                                         <p className="font-semibold">Total:</p>
//                                         <p className="text-xl font-bold text-indigo-600">₹{order.totalPrice}</p>
//                                     </div>
//                                     <div className="flex items-center space-x-2 text-gray-700">
//                                         <p className="font-semibold">Payment:</p>
//                                         <p className={`font-semibold ${order.isPaid ? 'text-green-600' : 'text-red-600'}`}>
//                                             {order.isPaid ? 'Paid' : 'Not Paid'}
//                                         </p>
//                                     </div>
//                                     <div className="flex items-center space-x-2 text-gray-700">
//                                         <p className="font-semibold">Delivery:</p>
//                                         <p className={`font-semibold ${order.isDelivered ? 'text-green-600' : 'text-red-600'}`}>
//                                             {order.isDelivered ? 'Delivered' : 'Pending'}
//                                         </p>
//                                     </div>
//                                 </div>

//                                 {/* Order Items */}
//                                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 border-t pt-6">
//                                     {order.orderItems.map((item) => (
//                                         <div key={item._id} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-md">
//                                             <img
//                                                 src={item.product?.images?.[0]}
//                                                 alt={item.name}
//                                                 className="w-20 h-20 object-cover rounded-lg shadow-sm"
//                                             />
//                                             <div className="flex-1">
//                                                 <p className="font-semibold text-gray-800">{item.name}</p>
//                                                 <p className="text-sm text-gray-500">Qty: {item.qty} | Size: {item.size}</p>
//                                                 <p className="text-lg font-bold text-indigo-500">₹{item.price}</p>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>

//                                 {/* Request Status */}
//                                 {request && (
//                                     <div className="mt-6 p-4 rounded-md bg-gray-100 flex items-center justify-between">
//                                         <div className="flex items-center space-x-3">
//                                             <span className={`text-xl ${getRequestStatusColor(request.status)}`}>
//                                                 {request.status === 'pending' && <FaSpinner className="animate-spin" />}
//                                                 {request.status === 'out for pickup' && <FaTruck />}
//                                                 {isRejected && <FaTimesCircle />}
//                                                 {isCompleted && <FaCheckCircle />}
//                                                 {!request.status && <FaBox />}
//                                             </span>
//                                             <p className={`font-bold capitalize ${getRequestStatusColor(request.status)}`}>
//                                                 {request.type} request status: {request.status}
//                                             </p>
//                                             {isRejected && request.rejectionReason && (
//                                                 <span className="text-sm text-gray-500 italic">
//                                                     Reason: {request.rejectionReason}
//                                                 </span>
//                                             )}
//                                         </div>
//                                         {isPendingOrInProgress && (
//                                             <button
//                                                 onClick={() => handleCancelRequest(request._id)}
//                                                 className="bg-gray-500 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-600"
//                                             >
//                                                 Cancel Request
//                                             </button>
//                                         )}
//                                     </div>
//                                 )}

//                                 {/* Action Buttons */}
//                                 {isActionable && (
//                                     <div className="mt-6 flex space-x-4">
//                                         <button
//                                             onClick={() => handleRequestClick(order, 'replace')}
//                                             className={`px-6 py-2 rounded-md font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors transform hover:scale-105`}
//                                         >
//                                             <FaExchangeAlt className="inline-block mr-2" /> Replace Order
//                                         </button>
//                                         <button
//                                             onClick={() => handleRequestClick(order, 'return')}
//                                             className={`px-6 py-2 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors transform hover:scale-105`}
//                                         >
//                                             <FaUndo className="inline-block mr-2" /> Return Order
//                                         </button>
//                                     </div>
//                                 )}
//                             </div>
//                         );
//                     })}
//                 </div>
//             )}

//             {/* MODAL */}
//             {showRequestModal && currentOrder && (
//                 <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50">
//                     <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg transform scale-95 animate-fadeInUp">
//                         <h3 className="text-2xl font-bold mb-6 capitalize text-center">
//                             {requestType} Request for Order #{currentOrder.orderNumber}
//                         </h3>
//                         <form onSubmit={handleRequestSubmit}>
//                             {requestType === 'replace' && (
//                                 <div className="mb-6">
//                                     <label className="block text-gray-700 text-sm font-bold mb-2">Select New Size</label>
//                                     <select
//                                         value={selectedSize}
//                                         onChange={handleSizeChange}
//                                         className="shadow border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
//                                         required
//                                     >
//                                         <option value="">-- Choose a size --</option>
//                                         {availableSizes.map((variant) => (
//                                             <option
//                                                 key={variant.size}
//                                                 value={variant.size}
//                                             >
//                                                 Size {variant.size} (Stock: {variant.countInStock})
//                                             </option>
//                                         ))}
//                                     </select>
//                                     {selectedSize && <p className="mt-2 text-sm text-gray-500 font-bold">Your chosen size: {selectedSize}</p>}
//                                 </div>
//                             )}
//                             <div className="mb-6">
//                                 <label className="block text-gray-700 text-sm font-bold mb-2">
//                                     Reason for {requestType}
//                                 </label>
//                                 <textarea
//                                     value={requestReason}
//                                     onChange={(e) => setRequestReason(e.target.value)}
//                                     className="shadow border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
//                                     rows="4"
//                                     required
//                                 />
//                             </div>
//                             <div className="flex justify-end space-x-4">
//                                 <button
//                                     type="button"
//                                     onClick={() => setShowRequestModal(false)}
//                                     className="bg-gray-300 text-gray-800 px-6 py-3 rounded-md font-semibold hover:bg-gray-400 transition-colors"
//                                 >
//                                     Cancel
//                                 </button>
//                                 <button
//                                     type="submit"
//                                     className="bg-indigo-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-indigo-700 transition-colors"
//                                 >
//                                     Submit Request
//                                 </button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default MyOrdersPage;

import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

import moment from 'moment';
import LoadingSpinner from '../components/LoadingSpinner';
import { FaBox, FaTruck, FaUndo, FaExchangeAlt, FaTimesCircle, FaCheckCircle, FaSpinner, FaClock } from 'react-icons/fa';
import { resolveProductImage } from '../utils/dairyImageResolver';

const MyOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [allRequests, setAllRequests] = useState([]);

    const [showRequestModal, setShowRequestModal] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [requestType, setRequestType] = useState('return');
    const [requestReason, setRequestReason] = useState('');
    const [requestMessage, setRequestMessage] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [returnImages, setReturnImages] = useState([]);

    const [availableSizes, setAvailableSizes] = useState([]);
    const [selectedSize, setSelectedSize] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchMyOrdersAndRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const [ordersRes, requestsRes] = await Promise.all([
                apiClient.get('/orders/myorders', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                apiClient.get('/return-replace/my-requests', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);
            setOrders(ordersRes.data);
            setAllRequests(requestsRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to fetch orders or requests.');
        } finally {
            setTimeout(() => {
                setLoading(false);
            }, 1500);
        }
    };

    useEffect(() => {
        fetchMyOrdersAndRequests();
    }, []);

    const handleRequestClick = async (order, item, type) => {
        setCurrentOrder(order);
        setSelectedItem(item);
        setRequestType(type);
        setRequestReason('');
        setRequestMessage(''); // Clear previous message
        setSelectedSize('');
        setReturnImages([]);

        if (type === 'replace') {
            try {
                const productId = item.product?._id || item.product;
                if (!productId) {
                    console.error('Product ID is missing.');
                    return;
                }
                const productDetailsRes = await apiClient.get(
                    `/products/${productId}`
                );
                const availableVariants = productDetailsRes.data.variants.filter(
                    (v) => v.countInStock > 0
                );
                setAvailableSizes(availableVariants);
            } catch (err) {
                console.error('Failed to fetch product variants:', err);
            }
        }
        setShowRequestModal(true);
    };

    const handleSizeChange = (e) => {
        const newSize = e.target.value;
        setSelectedSize(newSize);
        setRequestReason(`Requested size - "${newSize}"`);
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                orderId: currentOrder._id,
                type: requestType,
                reason: requestReason,
                originalItem: {
                    name: selectedItem.name,
                    qty: selectedItem.qty,
                    price: selectedItem.price,
                    product: selectedItem.product?._id || selectedItem.product,
                    size: selectedItem.size
                }
            };

            if (requestType === 'replace') {
                payload.replacedProductInfo = {
                    name: selectedItem.name,
                    qty: selectedItem.qty,
                    price: selectedItem.price,
                    product: selectedItem.product?._id || selectedItem.product,
                    size: selectedSize,
                };
                await apiClient.post('/return-replace/request', payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                if (returnImages.length === 0) {
                    setRequestMessage('Please upload product images for return request.');
                    return;
                }

                const formData = new FormData();
                formData.append('orderId', payload.orderId);
                formData.append('type', payload.type);
                formData.append('reason', payload.reason);
                formData.append('originalItem', JSON.stringify(payload.originalItem));
                returnImages.forEach((file) => formData.append('returnImages', file));

                await apiClient.post('/return-replace/request', formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            setRequestMessage(
                requestType === 'return'
                    ? 'Return request submitted. Please wait for approval request.'
                    : 'Replacement Request submitted successfully!'
            );
            setShowRequestModal(false);
            setReturnImages([]);
            fetchMyOrdersAndRequests();
        } catch (err) {
            setRequestMessage(err.response?.data?.message || 'Failed to submit request.');
        } finally {
            setSubmitting(false);
        }
    };

    const getRequestStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'text-green-600';
            case 'rejected': return 'text-red-600';
            case 'out for pickup': return 'text-purple-600';
            case 'received': return 'text-green-600';
            case 'completed': return 'text-green-600';
            default: return 'text-gray-400';
        }
    };

    const getDeliveryWindowText = (order) => {
        const start = order.deliveryWindowStart
            ? moment(order.deliveryWindowStart)
            : moment(order.createdAt).add(1, 'day').hour(10).minute(0).second(0).millisecond(0);
        const end = order.deliveryWindowEnd
            ? moment(order.deliveryWindowEnd)
            : moment(order.createdAt).add(1, 'day').hour(18).minute(0).second(0).millisecond(0);

        return `${start.format('MMMM Do YYYY')}, ${start.format('h:mm A')} - ${end.format('h:mm A')}`;
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;

    return (
        <div className="bg-gray-100 min-h-screen container mx-auto px-4 py-4 md:py-12">
            <h1 className="text-2xl md:text-4xl font-extrabold mb-4 md:mb-8 text-center text-gray-800">Your Order History</h1>

            {orders.length === 0 ? (
                <div className="text-center text-gray-500 py-8 md:py-12">
                    <FaBox className="mx-auto w-12 h-12 md:w-16 md:h-16 text-gray-300 mb-4" />
                    <p className="text-base md:text-xl">You have not placed any orders yet.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {orders.map((order) => {
                        const request = allRequests.find(
                            (req) => String(req.order?._id || req.order) === String(order._id)
                        );

                        const isPendingOrInProgress = request?.status === 'pending' || request?.status === 'out for pickup';
                        const isRejected = request?.status === 'rejected';
                        const isCompleted = request?.status === 'received' || request?.status === 'completed';

                        return (
                            <div key={order._id} className="bg-white rounded-xl shadow-lg p-6 md:p-8 hover:shadow-xl transition-shadow duration-300">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b pb-4 mb-4">
                                    <div className="mb-4 md:mb-0">
                                        <h2 className="text-lg md:text-2xl font-bold text-gray-800 break-words md:break-normal font-sans">
                                            Order #{order.orderNumber}
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Placed on: {moment(order.createdAt).format('MMMM Do YYYY, h:mm a')}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                            <FaClock className="text-gray-400" />
                                            Expected Delivery: {getDeliveryWindowText(order)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:flex md:justify-between md:items-center mb-6 text-sm md:text-base">
                                    <div className="flex items-center space-x-2 text-gray-700 col-span-2 md:col-span-1 mb-2 md:mb-0">
                                        <p className="font-semibold">Total:</p>
                                        <p className="text-xl font-bold text-indigo-600">₹{order.totalPrice}</p>
                                    </div>
                                    <div className="flex items-center space-x-2 text-gray-700">
                                        <p className="font-semibold">Payment:</p>
                                        <p className={`font-semibold ${order.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                                            {order.isPaid ? 'Paid' : 'Not Paid'}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2 text-gray-700">
                                        <p className="font-semibold">Delivery:</p>
                                        <p className={`font-semibold ${order.isDelivered ? 'text-green-600' :
                                            order.status === 'out for delivery' ? 'text-blue-600' :
                                                order.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'
                                            }`}>
                                            {order.status === 'out for delivery' ? 'Out for Delivery' :
                                                order.isDelivered ? 'Delivered' :
                                                    order.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                                        </p>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 border-t pt-6">
                                    {order.orderItems.map((item) => {
                                        const itemRequest = allRequests.find(
                                            (req) => String(req.order?._id || req.order) === String(order._id) &&
                                                String(req.originalItem?.product?._id || req.originalItem?.product) === String(item.product?._id || item.product) &&
                                                req.originalItem?.size === item.size
                                        );

                                        const isItemPendingOrInProgress = itemRequest?.status === 'pending' || itemRequest?.status === 'out for pickup';
                                        const isItemRejected = itemRequest?.status === 'rejected';
                                        const isItemCompleted = itemRequest?.status === 'received' || itemRequest?.status === 'completed';
                                        const isItemActionable = order.isDelivered && !isItemPendingOrInProgress && !isItemCompleted && !isItemRejected;

                                        return (
                                            <div key={item._id} className="flex flex-col bg-gray-50 p-4 rounded-md">
                                                <div className="flex items-center space-x-4">
                                                    <img
                                                        src={resolveProductImage(item.product, 0)}
                                                        alt={item.name}
                                                        className="w-20 h-20 object-cover rounded-lg shadow-sm"
                                                    />
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-800">
                                                            {item.name}
                                                            {item.product?.isActive === false && (
                                                                <span className="text-red-500 text-xs ml-2 font-bold">(Deactivated)</span>
                                                            )}
                                                        </p>
                                                        <p className="text-sm text-gray-500">Qty: {item.qty} | Pack: {item.size}</p>
                                                        <p className="text-lg font-bold text-indigo-500">₹{item.price}</p>
                                                    </div>
                                                </div>

                                                {/* Success/Notification Message for this Item */}
                                                {requestMessage && currentOrder?._id === order._id && selectedItem?._id === item._id && (
                                                    <div className="mt-3 bg-green-100 text-green-700 p-3 rounded-md animate-fadeInUp">
                                                        {requestMessage}
                                                    </div>
                                                )}

                                                {/* Item Specific Request Status */}
                                                {itemRequest && (
                                                    <div className="mt-3 p-2 rounded bg-white shadow-sm border border-gray-100 flex items-center space-x-2">
                                                        <span className={`text-sm ${getRequestStatusColor(itemRequest.status)}`}>
                                                            {itemRequest.status === 'pending' && <FaClock />}
                                                            {itemRequest.status === 'approved' && <FaCheckCircle />}
                                                            {itemRequest.status === 'out for pickup' && <FaTruck />}
                                                            {isItemRejected && <FaTimesCircle />}
                                                            {isItemCompleted && <FaCheckCircle />}
                                                            {!itemRequest.status && <FaBox />}
                                                        </span>
                                                        <p className={`text-xs font-bold capitalize ${getRequestStatusColor(itemRequest.status)}`}>
                                                            {itemRequest.status === 'pending'
                                                                ? `${itemRequest.type === 'replace' ? 'Replace' : 'Return'} Request Under Review` :
                                                                itemRequest.status === 'out for pickup' ? `${itemRequest.type === 'replace' ? 'Replace' : 'Return'}: Pickup` :
                                                                    `${itemRequest.type === 'replace' ? 'Replace' : 'Return'}: ${itemRequest.status}`}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Item Specific Action Buttons */}
                                                {isItemActionable && (
                                                    <div className="mt-4 flex space-x-2">
                                                        <button
                                                            onClick={() => handleRequestClick(order, item, 'replace')}
                                                            className="flex items-center justify-center py-1.5 px-4 rounded bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors"
                                                        >
                                                            <FaExchangeAlt className="mr-1" /> Replace
                                                        </button>
                                                        <button
                                                            onClick={() => handleRequestClick(order, item, 'return')}
                                                            className="flex items-center justify-center py-1.5 px-4 rounded bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
                                                        >
                                                            <FaUndo className="mr-1" /> Return
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Order Level Status (Only show if no individual item requests or general order issues) */}
                                {/* Order level request status hidden as per requirement */}
                                {/* {request && !allRequests.some(r => r.order === order._id && r.originalItem) && (
                                    <div className="mt-6 p-4 rounded-md bg-gray-100 flex flex-col md:flex-row md:items-center justify-between">
                                        <div className="flex items-center space-x-3 mb-4 md:mb-0">
                                            <span className={`text-xl ${getRequestStatusColor(request.status)}`}>
                                                {request.status === 'pending' && <FaClock />}
                                                {request.status === 'out for pickup' && <FaTruck />}
                                                {isRejected && <FaTimesCircle />}
                                                {isCompleted && <FaCheckCircle />}
                                                {!request.status && <FaBox />}
                                            </span>
                                            <p className={`font-bold capitalize ${getRequestStatusColor(request.status)}`}>
                                                Order request status: {request.status}
                                            </p>
                                        </div>
                                        {isPendingOrInProgress && (
                                            <button
                                                onClick={() => handleCancelRequest(request._id)}
                                                className="bg-gray-500 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-600 transition-colors"
                                            >
                                                Cancel Request
                                            </button>
                                        )}
                                    </div>
                                )} */}

                                {/* General buttons removed since we now have item-level buttons */}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL */}
            {showRequestModal && currentOrder && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg transform scale-95 animate-fadeInUp">
                        <h3 className="text-2xl font-bold mb-6 capitalize text-center">
                            {requestType} Request for Order #{currentOrder.orderNumber}
                        </h3>
                        <form onSubmit={handleRequestSubmit}>
                            {requestType === 'replace' && (
                                <div className="mb-6">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Select Pack Size</label>
                                    <select
                                        value={selectedSize}
                                        onChange={handleSizeChange}
                                        className="shadow border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        required
                                    >
                                        <option value="">-- Choose Pack Size --</option>
                                        {availableSizes.map((variant) => (
                                            <option
                                                key={variant.size}
                                                value={variant.size}
                                            >
                                                Pack {variant.size} (Stock: {variant.countInStock})
                                            </option>
                                        ))}
                                    </select>
                                    {selectedSize && <p className="mt-2 text-sm text-gray-500 font-bold">Your chosen Pack Size: {selectedSize}</p>}
                                </div>
                            )}
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Reason for {requestType}
                                </label>
                                <textarea
                                    value={requestReason}
                                    onChange={(e) => setRequestReason(e.target.value)}
                                    className="shadow border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    rows="4"
                                    required
                                />
                            </div>
                            {requestType === 'return' && (
                                <div className="mb-6">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Upload Product Images (Required)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => setReturnImages(Array.from(e.target.files || []))}
                                        className="shadow border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        required
                                    />
                                </div>
                            )}
                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setShowRequestModal(false)}
                                    className="bg-gray-300 text-gray-800 px-6 py-3 rounded-md font-semibold hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`bg-indigo-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {submitting ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Request'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyOrdersPage;
