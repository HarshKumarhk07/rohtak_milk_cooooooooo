import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaLeaf, FaTruck, FaShieldAlt } from "react-icons/fa";
import FounderSection from "../components/FounderSection";

const values = [
  {
    icon: <FaLeaf className="w-6 h-6" />,
    title: "Pure & Natural",
    text: "Farm-fresh, unadulterated milk and dairy with no preservatives or additives.",
  },
  {
    icon: <FaShieldAlt className="w-6 h-6" />,
    title: "Quality Assured",
    text: "Strict hygiene, temperature control and sealed packaging on every order.",
  },
  {
    icon: <FaTruck className="w-6 h-6" />,
    title: "Doorstep Delivery",
    text: "Daily, alternate-day and weekly subscriptions delivered right to your home.",
  },
];

const AboutPage = () => {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-r from-[#2e7d32] via-[#388e3c] to-[#4caf50] text-white">
        <div className="container mx-auto px-4 py-14 md:py-20 text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-yellow-400 text-black text-[10px] md:text-xs font-black px-4 py-1 rounded-full uppercase tracking-widest inline-block mb-4"
          >
            About Us
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-extrabold mb-4 drop-shadow"
          >
            Rohtak Milk Company
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm md:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed"
          >
            Your trusted dairy delivery partner — bringing fresh milk, curd,
            paneer and pure ghee directly from local farms to your home with
            care and quality assurance.
          </motion.p>
        </div>
      </section>

      {/* Values */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8 max-w-5xl mx-auto">
            {values.map((v) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5 }}
                className="bg-green-50/50 border border-green-100 rounded-2xl p-6 text-center"
              >
                <div className="w-12 h-12 bg-green-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4">
                  {v.icon}
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{v.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder details */}
      <FounderSection />

      {/* CTA */}
      <section className="py-12 md:py-16 bg-green-50/40">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">
            Taste the Purity Today
          </h2>
          <p className="text-sm md:text-base text-gray-600 max-w-xl mx-auto mb-6">
            Join thousands of families who trust Rohtak Milk Company for their
            daily dose of fresh, pure dairy.
          </p>
          <Link
            to="/products"
            className="inline-block bg-green-700 text-white font-bold px-8 py-3 rounded-full shadow-lg hover:bg-green-800 transition-colors"
          >
            Explore Our Products
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
