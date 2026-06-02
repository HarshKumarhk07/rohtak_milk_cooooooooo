import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { FaEnvelope } from 'react-icons/fa';

const AppointmentManagement = () => {
    const [appointments, setAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [filters, setFilters] = useState({
        year: '',
        month: '',
        search: ''
    });

    const fetchAppointments = async () => {
        try {
            const response = await apiClient.get('/appointments');
            setAppointments(response.data);
            setFilteredAppointments(response.data);
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    useEffect(() => {
        let result = [...appointments];

        if (filters.year) {
            result = result.filter(app => new Date(app.preferredDate).getFullYear().toString() === filters.year);
        }

        if (filters.month) {
            result = result.filter(app => (new Date(app.preferredDate).getMonth() + 1).toString() === filters.month);
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(app =>
                app.name.toLowerCase().includes(searchLower) ||
                app.phone.includes(filters.search) ||
                (app.email && app.email.toLowerCase().includes(searchLower)) ||
                app._id.toLowerCase().includes(searchLower)
            );
        }

        setFilteredAppointments(result);
    }, [filters, appointments]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await apiClient.put(`/appointments/${id}/status`, { status: newStatus });
            // Update local state
            setAppointments(appointments.map(app =>
                app._id === id ? { ...app, status: newStatus } : app
            ));
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status');
        }
    };

    const showMessage = (msg) => {
        if (msg) setSelectedMessage(msg);
    };

    if (loading) return <div>Loading appointments...</div>;

    return (
            <div className="bg-white p-3 md:p-6 rounded-lg shadow-md">
                <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Dairy Tours</h2>

            {/* Filter Section */}
            <div className="flex flex-wrap gap-4 mb-6">
                <input
                    type="number"
                    name="year"
                    placeholder="Year"
                    value={filters.year}
                    onChange={handleFilterChange}
                    className="border rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
                />
                <select
                    name="month"
                    value={filters.month}
                    onChange={handleFilterChange}
                    className="border rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Select Month</option>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                </select>
                <input
                    type="text"
                    name="search"
                    placeholder="Search by name, ID, or phone"
                    value={filters.search}
                    onChange={handleFilterChange}
                    className="border rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAppointments.length > 0 ? (
                            filteredAppointments.map((appointment) => (
                                <tr key={appointment._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(appointment.preferredDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {appointment.preferredTime}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {appointment.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {appointment.email || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {appointment.phone}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <select
                                            value={appointment.status || 'pending'}
                                            onChange={(e) => handleStatusUpdate(appointment._id, e.target.value)}
                                            className="border rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="visited">Visited</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        <button
                                            onClick={() => showMessage(appointment.message)}
                                            className="text-blue-600 hover:text-blue-800 transition-colors"
                                            title="View Message"
                                        >
                                            <FaEnvelope size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                    No appointments found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Message Modal */}
            {selectedMessage && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform animate-in slide-in-from-bottom-8 duration-300">
                        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-6 py-4">
                            <h3 className="text-black font-bold text-lg flex items-center">
                                <FaEnvelope className="mr-2" /> Visitor Message
                            </h3>
                        </div>
                        <div className="p-8">
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 italic text-gray-700 leading-relaxed shadow-inner overflow-auto max-h-60 break-words text-sm">
                                "{selectedMessage}"
                            </div>
                            <button
                                onClick={() => setSelectedMessage(null)}
                                className="mt-8 w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-green-100 uppercase tracking-wider text-xs"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentManagement;
