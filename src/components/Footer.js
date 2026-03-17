import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
          {/* Logo and About Section */}
          <div className="space-y-4">
            <Link to="/">
              <img src="/logo-2.jpeg" alt="Grocery Store Logo" className="w-48 h-auto object-contain bg-white rounded-lg p-2" />
            </Link>
            <p className="text-xs md:text-sm">
              Your trusted online grocery store. We bring fresh vegetables, fruits, and daily essentials directly from the farm to your kitchen with love and care.
            </p>
            <div className="text-xs md:text-sm pt-2">
              <p>Address: Dk saharan Marodhi JATAN 103, Rohtak, 124021</p>
              <p>Phone Number: <a href="tel:+917293333340" className="hover:text-white transition-colors">7293333340</a></p>
            </div>
            <div className="flex space-x-4 mt-4">
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <FaFacebook size={20} />
              </a>
              <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <FaTwitter size={20} />
              </a>
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <FaInstagram size={20} />
              </a>
              <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <FaLinkedin size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base md:text-lg font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-xs md:text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Shop All</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-base md:text-lg font-bold text-white mb-4">Customer Service</h3>
            <ul className="space-y-2 text-xs md:text-sm">
              <li><Link to="/shipping" className="hover:text-white transition-colors">Shipping & Returns</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/track-order" className="hover:text-white transition-colors">Track Your Order</Link></li>
              <li><a href="mailto:Gaonseghartak1@gmail.com" className="hover:text-white transition-colors">Farmer Support: Gaonseghartak1@gmail.com</a></li>
            </ul>
          </div>

          {/* Newsletter Section */}
          <div>
            <h3 className="text-base md:text-lg font-bold text-white mb-4">Stay Connected</h3>
            <p className="text-xs md:text-sm">Subscribe to our newsletter for exclusive offers and updates on fresh arrivals.</p>
            <form className="mt-4 flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-grow rounded-l-md p-2 bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring focus:border-indigo-500 text-xs md:text-sm"
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white p-2 rounded-r-md hover:bg-indigo-700 transition-colors text-xs md:text-sm"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="mt-8 md:mt-12 pt-6 border-t border-gray-700 text-center text-xs md:text-sm">
        <p>&copy; {new Date().getFullYear()} GAON SE GHAR TAK. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
