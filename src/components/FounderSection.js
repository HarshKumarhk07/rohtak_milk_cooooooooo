import React from "react";
import { motion } from "framer-motion";
import { FaQuoteLeft } from "react-icons/fa";

const stats = [
  { value: "8+", label: "Years of Experience" },
  { value: "100%", label: "Pure & Fresh" },
  { value: "10k+", label: "Happy Families" },
];

const FounderSection = () => {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white to-green-50/40">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center mb-8 md:mb-12 text-center">
          <span className="bg-green-100 text-green-700 text-[10px] md:text-xs font-black px-4 py-1 rounded-full uppercase tracking-widest mb-3">
            Meet Our Founder
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            The Person Behind The Purity
          </h2>
          <div className="h-1.5 w-20 bg-yellow-400 rounded-full mt-3"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center max-w-5xl mx-auto">
          {/* Founder Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-tr from-green-600 to-yellow-400 rounded-3xl rotate-3 opacity-20"></div>
              <img
                src="/founder.jpeg"
                alt="Ravi Khandelwal, Founder of Rohtak Milk Company"
                className="relative w-64 h-80 md:w-80 md:h-96 object-cover object-top rounded-3xl shadow-xl border-4 border-white"
              />
              <div className="absolute -bottom-4 -right-2 bg-green-700 text-white px-4 py-2 rounded-xl shadow-lg">
                <p className="text-sm md:text-base font-black leading-none">Ravi Khandelwal</p>
                <p className="text-[10px] md:text-xs text-green-100 font-medium mt-0.5">Founder &amp; CEO</p>
              </div>
            </div>
          </motion.div>

          {/* Founder Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="flex flex-col"
          >
            <FaQuoteLeft className="text-green-600/30 w-8 h-8 mb-3" />
            <p className="text-xl md:text-2xl font-bold text-gray-800 leading-snug italic mb-4">
              "Purity is our first choice — never a compromise."
            </p>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-6">
              With over 8 years dedicated to dairy farming and direct-to-home
              delivery, Ravi Khandelwal founded Rohtak Milk Company with one
              simple mission — to bring farm-fresh, unadulterated milk and dairy
              products straight to your kitchen. Every bottle reflects a promise
              of trust, hygiene and honest quality.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white rounded-xl border border-green-100 shadow-sm px-2 py-3 md:py-4 text-center"
                >
                  <p className="text-xl md:text-3xl font-black text-green-700 leading-none">
                    {stat.value}
                  </p>
                  <p className="text-[9px] md:text-xs font-semibold text-gray-500 mt-1.5 uppercase tracking-wide leading-tight">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FounderSection;
