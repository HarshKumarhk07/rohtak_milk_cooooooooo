import React from "react";
import { motion } from "framer-motion";
import { resolveSectionImage } from "../utils/dairyImageResolver";

const LoadingSpinner = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col justify-center items-center w-full min-h-[70vh] p-4 text-center bg-white/90 backdrop-blur-md fixed inset-0 z-[100]"
    >
      <div className="relative mb-8">
        {/* Animated outer ring using Framer Motion instead of CSS animation for reliability */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-4 border-dashed border-green-500 opacity-20"
        />

        {/* Dairy image with entrance animation */}
        <motion.div
          initial={{ scale: 0.9, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
        >
          <img
            src={resolveSectionImage('loading')}
            alt="Loading dairy content"
            className="w-36 h-36 md:w-52 md:h-52 object-cover rounded-full shadow-2xl border-4 border-white animate-pulse"
          />
        </motion.div>
      </div>

      {/* Text with fade-in animation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="font-serif text-2xl md:text-4xl font-bold bg-gradient-to-r from-green-800 to-green-600 text-transparent bg-clip-text">
          Fresh Dairy, Delivered
        </h3>
        <p className="mt-3 text-gray-800 text-sm md:text-lg font-bold tracking-wide">
          Preparing your milk and dairy items for safe delivery...
        </p>
      </motion.div>
    </motion.div>
  );
};

export default LoadingSpinner;
