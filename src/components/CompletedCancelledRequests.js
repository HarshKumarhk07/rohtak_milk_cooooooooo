import React, { useState, useEffect } from 'react';
import moment from 'moment';
import apiClient from '../services/apiClient';
import { resolveProductImage } from '../utils/dairyImageResolver';

const CompletedCancelledRequests = ({ type }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredRequests, setFilteredRequests] = useState([]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const endpoint = type === 'completed' ? 'completed' : 'cancelled';
            const response = await apiClient.get(
                `/return-replace/admin/${endpoint}?month=${filterMonth}&year=${filterYear}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRequests(response.data);
            setLoading(false);
        } catch (err) {
            setError(`Failed to fetch ${type} requests.`);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [filterMonth, filterYear, type]);

    useEffect(() => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        const results = requests.filter(request =>
            (request.user?.name || '').toLowerCase().includes(lowercasedSearchTerm) ||
            (request.order?.orderNumber || '').toLowerCase().includes(lowercasedSearchTerm) ||
            (request.user?.phone || '').toLowerCase().includes(lowercasedSearchTerm) ||
            (request.order?.shippingAddress?.address || '').toLowerCase().includes(lowercasedSearchTerm)
        );
        setFilteredRequests(results);
    }, [searchTerm, requests]);

    const formatStatus = (status) => {
        if (status === 'received' || status === 'completed') {
            return 'Return Completed';
        }
        return status;
    };

    if (loading) return <div className="text-center mt-10 text-gray-500">Loading {type} requests...</div>;
    if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;

    return (
        <div className="p-3 md:p-0">
            <h2 className="text-xl md:text-2xl font-bold mb-6 capitalize text-gray-800 border-b pb-2">{type} Requests</h2>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-8">
                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Year"
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="flex-1 md:w-32 p-2 border rounded shadow-sm focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="flex-1 md:w-48 p-2 border rounded shadow-sm focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                        <option value="">Select Month</option>
                        {moment.months().map((month, index) => (
                            <option key={index} value={index + 1}>{month}</option>
                        ))}
                    </select>
                </div>
                <input
                    type="text"
                    placeholder="Search by name, order ID, or phone"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 border rounded w-full md:flex-grow shadow-sm focus:ring-2 focus:ring-indigo-500 text-sm"
                />
            </div>
            <div className="space-y-6">
                {filteredRequests.length > 0 ? (
                    filteredRequests.map(request => (
                        <div key={request._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100 p-6">
                            <div className="flex flex-wrap justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm font-bold text-gray-400">Request ID: {request._id}</p>
                                    <p className="text-lg font-bold text-indigo-700">Order: #{request.order?.orderNumber}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${request.status === 'completed' || request.status === 'received' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {formatStatus(request.status)}
                                    </span>
                                    <p className="text-xs text-gray-400 mt-1">{moment(request.updatedAt).format('MMM Do YYYY, h:mm a')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
                                <div>
                                    <p className="font-semibold text-gray-700 mb-2">Customer Info:</p>
                                    <p className="text-sm"><strong>Name:</strong> {request.user?.name}</p>
                                    <p className="text-sm"><strong>Phone:</strong> {request.user?.phone || 'N/A'}</p>
                                    <p className="text-sm"><strong>Email:</strong> {request.user?.email}</p>
                                    <p className="text-sm"><strong>Address:</strong> {request.order?.shippingAddress?.address}, {request.order?.shippingAddress?.city}</p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="font-semibold text-gray-700 mb-2">Requested Product ({request.type}):</p>
                                    <div className="flex items-center space-x-4">
                                        <img
                                            src={resolveProductImage(request.originalItem?.product, 0)}
                                            alt={request.originalItem.name}
                                            className="w-20 h-20 object-cover rounded shadow-sm bg-white"
                                        />
                                        <div>
                                            <p className="font-bold text-gray-800 leading-tight">{request.originalItem?.name || 'Product Not Found'}</p>
                                            <p className="text-sm text-gray-500 mt-1">Qty: {request.originalItem?.qty} | Pack: {request.originalItem?.size}</p>
                                            <p className="text-sm font-bold text-indigo-600 mt-1 font-sans">₹{request.originalItem?.price}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm mt-3 pt-3 border-t border-gray-200">
                                        <span className="font-semibold text-gray-600">Reason:</span> {request.reason}
                                    </p>
                                    {request.rejectionReason && (
                                        <p className="text-sm mt-1 text-red-600">
                                            <span className="font-semibold text-gray-700">Rejection Reason:</span> {request.rejectionReason}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white p-10 rounded-lg text-center shadow-sm border border-dashed border-gray-300">
                        <p className="text-gray-500">No {type} requests found for this search/filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompletedCancelledRequests;