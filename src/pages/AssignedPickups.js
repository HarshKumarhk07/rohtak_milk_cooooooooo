import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import moment from 'moment';
import { resolveProductImage } from '../utils/dairyImageResolver';

const AssignedPickups = ({ setActiveTab }) => {
    const [pickups, setPickups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAssignedPickups = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/return-replace/admin/assigned-pickups');
            setPickups(response.data);
        } catch (err) {
            setError('Failed to fetch assigned pickups.');
            console.error(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignedPickups();
    }, []);

    const handleMoveToUnassigned = async (pickupId) => {
        if (!window.confirm("Are you sure you want to move this to unassigned deliveries?")) return;

        try {
            const token = localStorage.getItem('token');
            await apiClient.post(
                '/return-replace/admin/update-status',
                { requestId: pickupId, status: 'received' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchAssignedPickups();
            setActiveTab('unassignedOrders');
        } catch (err) {
            console.error(err);
            alert('Failed to update status.');
        }
    };

    if (loading) return <div className="text-center mt-10">Loading assigned pickups...</div>;
    if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;

    return (
        <div className="p-3 md:p-0">
            <h2 className="text-xl md:text-2xl font-semibold mb-6">Assigned Return & Replacement Pickups</h2>
            <div className="space-y-6">
                {pickups.length > 0 ? (
                    pickups.map(pickup => (
                        <div key={pickup._id} className="bg-white rounded-lg shadow-md p-4 md:p-6">
                            <h3 className="text-lg md:text-xl font-semibold text-blue-600 mb-4">Request ID: {pickup._id}</h3>
                            <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                                <div>
                                    <p className="text-sm md:text-base"><strong>Order ID:</strong> {pickup.order?.orderNumber}</p>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 my-4 p-3 bg-gray-50 rounded-lg">
                                        <img
                                            src={resolveProductImage(pickup.originalItem?.product, 0)}
                                            alt={pickup.originalItem.name}
                                            className="w-20 h-20 object-cover rounded shadow-sm"
                                        />
                                        <div className="space-y-1">
                                            <p className="font-bold text-gray-800">{pickup.originalItem?.name || 'Product Details Not Available'}</p>
                                            <p className="text-sm text-gray-500">Qty: {pickup.originalItem?.qty} | Pack: {pickup.originalItem?.size}</p>
                                            <p className="text-sm"><strong>Request Type:</strong> <span className="capitalize text-indigo-600 font-semibold">{pickup.type}</span></p>
                                            <p className="text-sm"><strong>Status:</strong> <button onClick={() => handleMoveToUnassigned(pickup._id)} className="text-blue-600 font-bold hover:underline transition-all">Unassigned Deliveries</button></p>
                                        </div>
                                    </div>
                                    <div className="mt-4 border-t pt-4 space-y-1">
                                        <p className="text-sm md:text-base"><strong>Customer:</strong> {pickup.user?.name}</p>
                                        <p className="text-sm md:text-base"><strong>Email:</strong> {pickup.user?.email}</p>
                                        <p className="text-sm md:text-base"><strong>Phone:</strong> {pickup.user?.phone}</p>
                                        <p className="text-sm md:text-base"><strong>Pickup Address:</strong> {pickup.order?.shippingAddress?.address}, {pickup.order?.shippingAddress?.city}, {pickup.order?.shippingAddress?.postalCode}</p>

                                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                            <p className="text-sm"><strong>Assigned to:</strong> {pickup.pickupPerson?.name} ({pickup.pickupPerson?.email})</p>
                                            <p className="text-xs text-gray-500 mt-1">Assigned On: {moment(pickup.updatedAt).format('MMMM Do YYYY, h:mm a')}</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Status update section removed as per requirement */}
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No assigned pickups found.</p>
                )}
            </div>
        </div>
    );
};

export default AssignedPickups;