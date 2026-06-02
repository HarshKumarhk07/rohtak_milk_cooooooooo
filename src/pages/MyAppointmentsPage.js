import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';
import { FaCalendarCheck, FaClock, FaMapMarkerAlt, FaCalendarTimes } from 'react-icons/fa';
import moment from 'moment';

const MyAppointmentsPage = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const response = await apiClient.get('/appointments/my-appointments');
                setAppointments(response.data);
            } catch (err) {
                console.error('Failed to fetch appointments:', err);
                setError('Failed to load your appointments.');
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, []);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'visited': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="bg-gray-50 min-h-screen py-10 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center space-x-4 mb-8">
                    <div className="bg-green-600 p-3 rounded-xl shadow-lg shadow-green-200">
                        <FaCalendarCheck className="text-white text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Your Appointments</h1>
                        <p className="text-gray-500">Track your dairy tours and scheduled visits.</p>
                    </div>
                </div>

                {error ? (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-center">
                        {error}
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                        <FaCalendarTimes className="mx-auto text-5xl text-gray-200 mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Appointments Found</h3>
                        <p className="text-gray-500 mb-6">You haven't scheduled any dairy tours yet.</p>
                        <a href="/book-appointment" className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100">
                            Book Now
                        </a>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {appointments.map((appointment) => (
                            <div key={appointment._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-6 md:p-8">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                        <div className="flex items-center space-x-3">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(appointment.status)}`}>
                                                {appointment.status || 'Pending'}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium">
                                                ID: {appointment._id.substring(appointment._id.length - 8).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="text-sm font-bold text-gray-400">
                                            Booked on: {moment(appointment.createdAt).format('MMM DD, YYYY')}
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-6">
                                        <div className="flex items-start space-x-3">
                                            <div className="p-2 bg-blue-50 rounded-lg">
                                                <FaClock className="text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date & Time</p>
                                                <p className="font-bold text-gray-800">{moment(appointment.preferredDate).format('dddd, MMM DD')}</p>
                                                <p className="text-sm text-gray-600">{appointment.preferredTime}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start space-x-3">
                                            <div className="p-2 bg-orange-50 rounded-lg">
                                                <FaMapMarkerAlt className="text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Location</p>
                                                <p className="font-bold text-gray-800">Rohtak Milk Company</p>
                                                <p className="text-sm text-gray-600">Dairy Processing Unit</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start space-x-3">
                                            <div className="p-2 bg-purple-50 rounded-lg">
                                                <FaCalendarCheck className="text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Visitor Info</p>
                                                <p className="font-bold text-gray-800">{appointment.name}</p>
                                                <p className="text-sm text-gray-600">{appointment.phone}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {appointment.message && (
                                        <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100 overflow-auto max-h-40">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Your Message</p>
                                            <p className="text-sm text-gray-600 italic break-words">"{appointment.message}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyAppointmentsPage;
