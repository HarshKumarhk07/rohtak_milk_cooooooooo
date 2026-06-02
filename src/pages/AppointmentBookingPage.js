import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { FaCheckCircle, FaSeedling, FaMapMarkedAlt, FaLock } from 'react-icons/fa';

const AppointmentBookingPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        preferredDate: '',
        preferredTime: '',
        message: ''
    });
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', msg: '' });

        const user = JSON.parse(localStorage.getItem('user'));
        const appointmentData = {
            ...formData,
            userId: user ? (user.id || user._id) : null
        };

        try {
            await apiClient.post('/appointments', appointmentData);
            setStatus({ type: 'success', msg: 'Appointment booked successfully!' });
            setFormData({ name: '', email: '', phone: '', preferredDate: '', preferredTime: '', message: '' });
        } catch (error) {
            console.error('Failed to book appointment:', error);
            setStatus({ type: 'error', msg: 'Failed to book appointment. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-0 md:min-h-[calc(100vh-80px)] bg-gray-50 flex items-start md:items-center justify-center pt-4 pb-6 md:py-20 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl w-full grid lg:grid-cols-5 gap-4 lg:gap-16 items-start">
                {/* Left Side: Related Content (Laptop View Only) */}
                <div className="hidden lg:block lg:col-span-3 space-y-12 animate-fadeInLeft">
                    {/* ... (keep laptop content same) ... */}
                    <div className="space-y-6">
                        <div className="inline-flex items-center space-x-2 bg-green-100 text-green-700 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] shadow-sm">
                            <FaSeedling className="animate-bounce" />
                            <span>Premium Dairy Experience</span>
                        </div>
                        <h1 className="text-6xl font-black text-gray-900 leading-[1.1]">
                            Pure <span className="text-green-600">Dairy</span> Experience
                        </h1>
                        <p className="text-xl text-gray-600 leading-relaxed text-justify">
                            Visit our dairy farms and processing units to learn about milk collection, hygiene practices, and subscription options for daily milk delivery.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                                {[
                                { title: "Purity at its Source", desc: "See milk collection and hygienic handling at source to ensure purity." },
                                { title: "Dairy Insight", desc: "Interact with our dairy experts to understand milk quality and handling." },
                                { title: "Fresh Milk Experience", desc: "Taste fresh milk and dairy products, and learn about subscription options." }
                            ].map((item, index) => (
                                <div key={index} className="flex items-start space-x-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-green-200 transition-colors">
                                    <div className="mt-1">
                                        <FaCheckCircle className="text-green-500 text-lg" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{item.title}</h4>
                                        <p className="text-sm text-gray-500">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Booking Form - Extremely compact for mobile, premium for laptop */}
                <div className="lg:col-span-2 w-full space-y-4 lg:space-y-6 bg-white p-5 lg:p-10 rounded-[1.5rem] lg:rounded-[2.5rem] shadow-2xl border border-gray-50 transition-all duration-500 transform hover:shadow-[0_20px_50px_rgba(34,197,94,0.1)]">
                    <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-green-600 font-bold text-[8px] lg:text-xs uppercase tracking-widest">
                            <FaMapMarkedAlt />
                            <span>Visit Booking</span>
                        </div>
                        <h2 className="text-xl lg:text-4xl font-black text-gray-900">
                            Schedule Your <span className="text-green-600 underline md:decoration-green-100 underline-offset-4 lg:underline-offset-8">Visit</span>
                        </h2>
                        <p className="text-[10px] lg:text-sm text-gray-500 font-medium">
                            Book your slot in less than a minute.
                        </p>
                    </div>

                    {status.msg && (
                        <div className={`p-3 lg:p-5 rounded-xl lg:rounded-2xl text-[10px] lg:text-sm font-bold flex items-center space-x-2 md:space-x-3 ${status.type === 'success' ? 'bg-green-50 text-green-800 border-l-4 md:border-l-8 border-green-600' : 'bg-red-50 text-red-800 border-l-4 md:border-l-8 border-red-600'}`}>
                            {status.type === 'success' ? <FaCheckCircle className="text-xs lg:text-xl" /> : null}
                            <span>{status.msg}</span>
                        </div>
                    )}

                    {!localStorage.getItem('user') ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <div className="p-4 bg-white rounded-full shadow-sm text-gray-400">
                                <FaLock className="text-2xl" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-gray-700">Login into your account for appointments</p>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-black">Authorized Access Only</p>
                            </div>
                            <Link
                                to="/login"
                                className="px-8 py-3 bg-green-600 text-white text-xs font-black rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 uppercase tracking-widest"
                            >
                                Login Now
                            </Link>
                        </div>
                    ) : (
                        <form className="space-y-3 lg:space-y-4" onSubmit={handleSubmit}>
                            <div className="space-y-3 lg:space-y-4">
                                <div className="group">
                                    <label htmlFor="name" className="block text-[8px] lg:text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5 lg:mb-1.5 group-focus-within:text-green-600 transition-colors">Full Name *</label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="block w-full px-3 lg:px-5 py-2 lg:py-3.5 bg-gray-50 border border-gray-100 text-gray-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all text-xs lg:text-sm font-medium"
                                        placeholder="Your Full Name"
                                    />
                                </div>
                                <div className="group">
                                    <label htmlFor="email" className="block text-[8px] lg:text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5 lg:mb-1.5 group-focus-within:text-green-600 transition-colors">Email Address *</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="block w-full px-3 lg:px-5 py-2 lg:py-3.5 bg-gray-50 border border-gray-100 text-gray-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all text-xs lg:text-sm font-medium"
                                        placeholder="yourname@gmail.com"
                                    />
                                </div>
                                <div className="group">
                                    <label htmlFor="phone" className="block text-[8px] lg:text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5 lg:mb-1.5 group-focus-within:text-green-600 transition-colors">Phone Number *</label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="block w-full px-3 lg:px-5 py-2 lg:py-3.5 bg-gray-50 border border-gray-100 text-gray-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all text-xs lg:text-sm font-medium"
                                        placeholder="Mobile Number"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3 lg:gap-5">
                                    <div className="group">
                                        <label htmlFor="preferredDate" className="block text-[8px] lg:text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5 lg:mb-1.5 group-focus-within:text-green-600 transition-colors">Date *</label>
                                        <input
                                            id="preferredDate"
                                            name="preferredDate"
                                            type="date"
                                            required
                                            value={formData.preferredDate}
                                            onChange={handleChange}
                                            className="block w-full px-2 lg:px-5 py-2 lg:py-3.5 bg-gray-50 border border-gray-100 text-gray-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all text-xs lg:text-sm font-medium"
                                        />
                                    </div>
                                    <div className="group">
                                        <label htmlFor="preferredTime" className="block text-[8px] lg:text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5 lg:mb-1.5 group-focus-within:text-green-600 transition-colors">Time *</label>
                                        <input
                                            id="preferredTime"
                                            name="preferredTime"
                                            type="time"
                                            required
                                            value={formData.preferredTime}
                                            onChange={handleChange}
                                            className="block w-full px-2 lg:px-5 py-2 lg:py-3.5 bg-gray-50 border border-gray-100 text-gray-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all text-xs lg:text-sm font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="group">
                                    <label htmlFor="message" className="block text-[8px] lg:text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5 lg:mb-1.5 group-focus-within:text-green-600 transition-colors">Notes (Optional)</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows="2"
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="block w-full px-3 lg:px-5 py-2 lg:py-3.5 bg-gray-50 border border-gray-100 text-gray-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all text-xs lg:text-sm font-medium resize-none shadow-sm"
                                        placeholder="Brief message..."
                                    ></textarea>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-3 lg:py-4.5 px-8 border border-transparent text-xs lg:text-sm font-black rounded-xl lg:rounded-2xl text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-offset-2 focus:ring-4 focus:ring-green-500/30 shadow-xl shadow-green-100 transition-all duration-300 active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? 'Securing slot...' : 'Schedule Visit Now'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppointmentBookingPage;
