// import React from 'react';

// const ContactPage = () => {
//   const whatsappNumber = '919728268800'; // India's country code (91) + phone number

//   return (
//     <div className="container mx-auto p-8 lg:p-16">
//       <div className="text-center mb-12">
//         <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-4">Contact Us</h1>
//         <p className="text-lg text-gray-600 max-w-2xl mx-auto">
//           We'd love to hear from you! Whether you have a question about our products, need help with an order, or just want to say hello, we're here to help. Feel free to visit our store or reach out to us directly.
//         </p>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
//         {/* Contact Information Section */}
//         <div className="bg-white p-8 rounded-xl shadow-lg">
//           <h2 className="text-2xl font-bold text-gray-800 mb-6">Our Details</h2>
//           <div className="space-y-4">
//             <div>
//               <h3 className="text-lg font-semibold text-gray-700">Address</h3>
//               <p className="text-gray-600">
//                 Gandhi Shopping Complex<br />
//                 94D, Delhi Rd, Model Town<br />
//                 Rohtak, Haryana 124001
//               </p>
//             </div>
//             <div>
//               <h3 className="text-lg font-semibold text-gray-700">Phone</h3>
//               <a href="tel:+919728268800" className="text-blue-600 hover:underline">
//                 097282 68800
//               </a>
//             </div>
//             <div>
//               <h3 className="text-lg font-semibold text-gray-700">Hours</h3>
//               <p className="text-gray-600"> Closes 9 pm</p>
//             </div>
//             <div>
//               <h3 className="text-lg font-semibold text-gray-700">WhatsApp</h3>
//               <a
//                 href={`https://wa.me/${whatsappNumber}`}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="text-green-600 hover:underline"
//               >
//                 Send us a message on WhatsApp
//               </a>
//             </div>
//           </div>
//         </div>

//         {/* Embedded Map Section */}
//         <div className="bg-white p-2 rounded-xl shadow-lg">
//           <h2 className="text-2xl font-bold text-gray-800 mb-4">Find Us</h2>
//           <div className="rounded-lg overflow-hidden">
//             {/* The iframe provided by the user */}
//             <iframe
//               src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3497.100913506757!2d76.5878482!3d28.8927891!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390da57f02d4f3b7%3A0x6334a171d9f0412e!2sGandhi%20Shopping%20Complex!5e0!3m2!1sen!2sin!4v1672345678901!5m2!1sen!2sin"
//               width="100%"
//               height="450"
//               style={{ border: 0 }}
//               allowFullScreen=""
//               loading="lazy"
//               referrerPolicy="no-referrer-when-downgrade"
//             ></iframe>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ContactPage;

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaMapMarkerAlt, FaPhoneAlt, FaClock, FaWhatsapp, FaMapMarkedAlt, FaCheckCircle, FaLock } from "react-icons/fa";
import apiClient from "../services/apiClient";

const ContactPage = () => {
  const whatsappNumber = "917293333340";

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
    <div className="container mx-auto p-4 lg:p-16">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-2xl md:text-5xl font-extrabold text-gray-800 mb-4">
          Contact Us
        </h1>
        <p className="text-sm md:text-lg text-gray-600 max-w-2xl mx-auto">
          We'd love to hear from you! Whether you have a question about our
          products, need help with an order, or just want to say hello, we're
          here to help.
        </p>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white p-8 rounded-xl shadow-lg order-2 lg:order-first"
        >
          <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Our Details</h2>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <FaMapMarkerAlt className="text-indigo-600 text-xl mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Address</h3>
                <p className="text-gray-600">
                  Dk saharan Marodhi JATAN 103 <br />
                  Rohtak, 124021
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <FaPhoneAlt className="text-indigo-600 text-xl mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Phone</h3>
                <a
                  href="tel:+917293333340"
                  className="text-blue-600 hover:underline"
                >
                  7293333340
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <FaClock className="text-indigo-600 text-xl mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Hours</h3>
                <p className="text-gray-600">12:00 PM - 6:00 PM</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <FaWhatsapp className="text-green-600 text-xl mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-700">WhatsApp</h3>
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline"
                >
                  Send us a message on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Booking Form Section (Replaced Map) */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white p-8 rounded-xl shadow-lg order-first lg:order-last"
        >
          <div className="space-y-1 mb-6">
            <div className="flex items-center space-x-2 text-green-600 font-bold text-xs uppercase tracking-widest">
              <FaMapMarkedAlt />
              <span>Visit Booking</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
              Schedule Your <span className="text-green-600">Visit</span>
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              Book your slot in less than a minute.
            </p>
          </div>

          {status.msg && (
            <div className={`p-4 mb-4 rounded-xl text-sm font-bold flex items-center space-x-2 ${status.type === 'success' ? 'bg-green-50 text-green-800 border-l-4 border-green-600' : 'bg-red-50 text-red-800 border-l-4 border-red-600'}`}>
              {status.type === 'success' ? <FaCheckCircle className="text-lg" /> : null}
              <span>{status.msg}</span>
            </div>
          )}

          {!localStorage.getItem('user') ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <div className="p-4 bg-white rounded-full shadow-sm text-gray-400">
                <FaLock className="text-2xl" />
              </div>
              <div className="text-center px-4">
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
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-focus-within:text-green-600 transition-colors">Full Name *</label>
                  <input
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full px-4 py-2 bg-gray-50 border border-gray-100 text-gray-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all text-sm font-medium"
                    placeholder="Your Full Name"
                  />
                </div>
                <div className="group">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-focus-within:text-green-600 transition-colors">Email Address *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full px-4 py-2 bg-gray-50 border border-gray-100 text-gray-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all text-sm font-medium"
                    placeholder="yourname@gmail.com"
                  />
                </div>
              </div>
              <div className="group">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-focus-within:text-green-600 transition-colors">Phone Number *</label>
                <input
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full px-4 py-2 bg-gray-50 border border-gray-100 text-gray-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all text-sm font-medium"
                  placeholder="Mobile Number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-focus-within:text-green-600 transition-colors">Date *</label>
                  <input
                    name="preferredDate"
                    type="date"
                    required
                    value={formData.preferredDate}
                    onChange={handleChange}
                    className="block w-full px-2 py-2 bg-gray-50 border border-gray-100 text-gray-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all text-sm font-medium"
                  />
                </div>
                <div className="group">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-focus-within:text-green-600 transition-colors">Time *</label>
                  <input
                    name="preferredTime"
                    type="time"
                    required
                    value={formData.preferredTime}
                    onChange={handleChange}
                    className="block w-full px-2 py-2 bg-gray-50 border border-gray-100 text-gray-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all text-sm font-medium"
                  />
                </div>
              </div>
              <div className="group">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-focus-within:text-green-600 transition-colors">Notes (Optional)</label>
                <textarea
                  name="message"
                  rows="2"
                  value={formData.message}
                  onChange={handleChange}
                  className="block w-full px-4 py-2 bg-gray-50 border border-gray-100 text-gray-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all text-sm font-medium resize-none shadow-sm"
                  placeholder="Brief message..."
                ></textarea>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-8 border border-transparent text-sm font-black rounded-xl text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-offset-2 focus:ring-4 focus:ring-green-500/30 shadow-xl shadow-green-100 transition-all duration-300 active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Securing slot...' : 'Book Visit Farm'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>

      {/* Map Section - Shifted to Bottom */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mt-12 bg-white p-4 rounded-xl shadow-lg"
      >
        <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-4">Find Us</h2>
        <div className="rounded-lg overflow-hidden h-[450px]">
          <iframe
            title="Rohtak Milk Company location map"
            src="https://maps.google.com/maps?q=28.8475,76.5165&hl=en&z=15&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </motion.div>
    </div>
  );
};

export default ContactPage;
